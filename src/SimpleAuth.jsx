import React, { createContext, useContext, useState, useEffect } from 'react';

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
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const adminExists = users.find(u => u.email === ADMIN_EMAIL);
    
    if (!adminExists) {
      const adminUser = {
        id: 'admin-' + Date.now(),
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: 'Admin',
        company: 'Kob Enerji',
        approved: true,
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      users.push(adminUser);
      localStorage.setItem('users', JSON.stringify(users));
    }

    // LocalStorage'dan kullanıcıyı yükle
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Kullanıcı onaylı mı kontrol et
      const userInDB = users.find(u => u.email === user.email);
      
      if (userInDB && userInDB.approved) {
        setCurrentUser(userInDB);
      } else {
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const signIn = (email, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    console.log('🔐 Login denemesi:', { email, password });
    console.log('👥 Tüm kullanıcılar:', users.map(u => ({ email: u.email, password: u.password, approved: u.approved })));
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      // Ayrıntılı hata ayıklama
      const userByEmail = users.find(u => u.email === email);
      if (userByEmail) {
        console.log('❌ E-posta bulundu ama şifre yanlış!');
        console.log('Girilen şifre:', password);
        console.log('Kayıtlı şifre:', userByEmail.password);
        console.log('Şifreler eşit mi?', userByEmail.password === password);
        console.log('Girilen şifre tipi:', typeof password, 'Uzunluk:', password.length);
        console.log('Kayıtlı şifre tipi:', typeof userByEmail.password, 'Uzunluk:', userByEmail.password ? userByEmail.password.length : 0);
      } else {
        console.log('❌ E-posta bulunamadı!');
      }
      throw new Error('E-posta veya şifre hatalı!');
    }
    
    if (!user.approved) {
      throw new Error('Hesabınız henüz onaylanmamış. Lütfen admin onayını bekleyin.');
    }
    
    console.log('✅ Giriş başarılı!');
    
    // Şifreyi saklama (güvenlik için)
    const userToStore = { ...user };
    delete userToStore.password;
    
    localStorage.setItem('currentUser', JSON.stringify(userToStore));
    setCurrentUser(userToStore);
    return userToStore;
  };

  const signOut = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  const register = (userData) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    // E-posta kontrolü
    if (users.find(u => u.email === userData.email)) {
      throw new Error('Bu e-posta adresi zaten kullanılıyor!');
    }
    
    const newUser = {
      ...userData,
      id: Date.now().toString(),
      approved: false,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    console.log('✅ Kullanıcı kaydedildi:', newUser.email);
    console.log('📊 Toplam kullanıcı sayısı:', users.length);
    
    return newUser;
  };

  const updateUser = (updatedUserData) => {
    // LocalStorage'daki mevcut kullanıcıyı güncelle
    const userToStore = { ...updatedUserData };
    delete userToStore.password; // Şifreyi saklama
    
    localStorage.setItem('currentUser', JSON.stringify(userToStore));
    setCurrentUser(userToStore);
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    register,
    updateUser,
    isAuthenticated: currentUser !== null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
