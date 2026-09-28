// SimpleAuth — Supabase Auth ile oturum yönetimi.
//
// Giriş Supabase Auth (GoTrue) ile yapılır; oturum tarayıcıda saklanır ve tüm sayfalarda
// (ana uygulama, bordro, osos, akaryakıt...) ortaktır. Kullanıcının rol / onay / bordro
// yetkisi public.users tablosundan okunur. Onaylanmamış hesaplar giriş yapamaz.
// Veritabanında tablolar sadece giriş yapmış, onaylı kullanıcılara açıktır (RLS).
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
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

async function profilGetir(userId) {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (data) delete data.password;
  return data;
}

function yerelKayitTemizle() {
  localStorage.removeItem('currentUser');
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Oturumdaki kullanıcının profilini yükler; onaysızsa oturumu kapatır.
  const oturumuYukle = useCallback(async (session) => {
    if (!session?.user) {
      setCurrentUser(null);
      yerelKayitTemizle();
      return null;
    }
    const profil = await profilGetir(session.user.id);
    if (!profil || !profil.approved) {
      await supabase.auth.signOut();
      setCurrentUser(null);
      yerelKayitTemizle();
      return null;
    }
    // Eski kodun okuduğu kopya (activityLogger vb.)
    localStorage.setItem('currentUser', JSON.stringify(profil));
    setCurrentUser(profil);
    return profil;
  }, []);

  useEffect(() => {
    let aktif = true;
    supabase.auth.getSession()
      .then(({ data }) => oturumuYukle(data.session))
      .catch((e) => console.error('Oturum yüklenemedi:', e?.message || e))
      .finally(() => { if (aktif) setLoading(false); });

    const { data: dinleyici } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        yerelKayitTemizle();
      }
    });
    return () => {
      aktif = false;
      dinleyici.subscription.unsubscribe();
    };
  }, [oturumuYukle]);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: (email || '').trim().toLowerCase(),
      password,
    });
    if (error) {
      if (error.code === 'email_not_confirmed' || /not confirmed/i.test(error.message || '')) {
        throw new Error('Hesabınız henüz onaylanmamış. Lütfen admin onayını bekleyin.');
      }
      throw new Error('E-posta veya şifre hatalı!');
    }
    const profil = await oturumuYukle(data.session);
    if (!profil) {
      throw new Error('Hesabınız henüz onaylanmamış. Lütfen admin onayını bekleyin.');
    }
    try {
      await ActivityLogger.login(profil.email);
    } catch {
      /* log yazılamazsa girişi engelleme */
    }
    return profil;
  };

  const signOut = async () => {
    const userEmail = currentUser?.email;
    if (userEmail) {
      try {
        await ActivityLogger.logout(userEmail);
      } catch {
        /* sessiz */
      }
    }
    await supabase.auth.signOut();
    setCurrentUser(null);
    yerelKayitTemizle();
  };

  // Yeni kayıt: hesap onaysız oluşturulur, admin onaylayana kadar giriş yapılamaz.
  const register = async (userData) => {
    const { data, error } = await supabase.rpc('app_register', {
      p_email: (userData.email || '').trim().toLowerCase(),
      p_password: userData.password,
      p_name: userData.name || null,
      p_company: userData.company || null,
    });
    if (error) throw new Error(error.message);
    return { id: data, email: userData.email, name: userData.name, company: userData.company, approved: false };
  };

  // Profil bilgilerini günceller. Şifre burada değişmez (changeOwnPassword / admin RPC).
  const updateUser = async (userId, updates) => {
    const { password, ...alanlar } = updates || {};
    if (password) {
      throw new Error('Şifre değiştirmek için changeOwnPassword kullanın.');
    }
    const { data, error } = await supabase
      .from('users')
      .update(alanlar)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;

    if (currentUser && currentUser.id === userId) {
      const guncel = { ...currentUser, ...data };
      delete guncel.password;
      localStorage.setItem('currentUser', JSON.stringify(guncel));
      setCurrentUser(guncel);
    }
    return data;
  };

  const changeOwnPassword = async (eskiSifre, yeniSifre) => {
    const { error } = await supabase.rpc('app_change_own_password', { p_old: eskiSifre, p_new: yeniSifre });
    if (error) throw new Error(error.message);
  };

  const deleteAccount = async (userId) => {
    const { error } = await supabase.rpc('app_delete_user', { p_user_id: userId });
    if (error) throw new Error(error.message);
    if (currentUser && currentUser.id === userId) {
      await signOut();
    }
    return true;
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    register,
    updateUser,
    changeOwnPassword,
    deleteAccount,
    isAuthenticated: currentUser !== null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
