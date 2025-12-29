import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Admin bilgileri
  const ADMIN_EMAIL = 'emrullah.gunay@kobinerji.com';
  const ADMIN_PASSWORD = 'Eg8502Eg.';

  useEffect(() => {
    // Admin kullanıcısını otomatik oluştur (yoksa)
    initializeAdmin();
    setLoading(false);
  }, []);

  const initializeAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', ADMIN_EMAIL)
        .single();

      if (error && error.code === 'PGRST116') {
        // Admin yok, oluştur
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            name: 'Admin',
            company: 'Kob Enerji',
            approved: true,
            role: 'admin'
          }]);

        if (insertError) {
          console.error('Admin oluşturma hatası:', insertError);
        } else {
          console.log('✅ Admin kullanıcısı oluşturuldu');
        }
      }
    } catch (error) {
      console.error('Admin kontrolü hatası:', error);
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log('🔐 Login denemesi:', { email, password });

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !user) {
        // Ayrıntılı hata ayıklama
        const { data: userByEmail } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (userByEmail) {
          console.log('❌ E-posta bulundu ama şifre yanlış!');
          console.log('Girilen şifre:', password);
          console.log('Kayıtlı şifre:', userByEmail.password);
        } else {
          console.log('❌ E-posta bulunamadı!');
        }
        throw new Error('E-posta veya şifre hatalı!');
      }

      if (!user.approved) {
        throw new Error('Hesabınız henüz onaylanmamış. Lütfen admin onayını bekleyin.');
      }

      console.log('✅ Giriş başarılı!', user);

      // Şifreyi saklama (güvenlik için)
      const userToStore = { ...user };
      delete userToStore.password;

      localStorage.setItem('currentUser', JSON.stringify(userToStore));
      setCurrentUser(userToStore);
      return userToStore;
    } catch (error) {
      console.error('❌ Login hatası:', error);
      throw error;
    }
  };

  const signOut = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const register = async (userData) => {
    try {
      console.log('📝 Kayıt işlemi başlatılıyor:', userData);

      // E-posta kontrolü
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        throw new Error('Bu e-posta adresi zaten kullanılıyor!');
      }

      // Yeni kullanıcı oluştur
      const { data, error } = await supabase
        .from('users')
        .insert([{
          ...userData,
          approved: false,
          role: 'user'
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Kayıt başarılı:', data);
      return data;
    } catch (error) {
      console.error('❌ Kayıt hatası:', error);
      throw error;
    }
  };

  const updateUser = async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // currentUser güncelle
      if (currentUser && currentUser.id === userId) {
        const updatedUser = { ...currentUser, ...updates };
        delete updatedUser.password;
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
      }

      return data;
    } catch (error) {
      console.error('Kullanıcı güncelleme hatası:', error);
      throw error;
    }
  };

  const deleteAccount = async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Eğer kendi hesabını siliyorsa logout yap
      if (currentUser && currentUser.id === userId) {
        signOut();
      }

      return true;
    } catch (error) {
      console.error('Hesap silme hatası:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    register,
    updateUser,
    deleteAccount,
    isAuthenticated: currentUser !== null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
