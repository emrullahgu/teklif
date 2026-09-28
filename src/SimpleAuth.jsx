import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ActivityLogger from './activityLogger';

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

  useEffect(() => {
    setLoading(false);
  }, []);

  const signIn = async (email, password) => {
    try {
      // Şifre kontrolü sunucuda yapılır (bcrypt); şifreler tarayıcıya hiç gelmez
      const { data: user, error } = await supabase.rpc('app_login', {
        p_email: email,
        p_password: password,
      });

      if (error) throw error;
      if (!user) {
        throw new Error('E-posta veya şifre hatalı!');
      }

      if (!user.approved) {
        throw new Error('Hesabınız henüz onaylanmamış. Lütfen admin onayını bekleyin.');
      }

      const userToStore = { ...user };
      delete userToStore.password;

      localStorage.setItem('currentUser', JSON.stringify(userToStore));
      setCurrentUser(userToStore);

      // Login log kaydı
      await ActivityLogger.login(user.email);

      return userToStore;
    } catch (error) {
      console.error('❌ Login hatası:', error.message || error);
      throw error;
    }
  };

  const signOut = () => {
    const userEmail = currentUser?.email;
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    
    // Logout log kaydı
    if (userEmail) {
      ActivityLogger.logout(userEmail);
    }
  };

  const register = async (userData) => {
    try {
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
