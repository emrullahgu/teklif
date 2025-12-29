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

  useEffect(() => {
    // LocalStorage'dan kullanıcıyı yükle
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Kullanıcı onaylı mı kontrol et
      const users = JSON.parse(localStorage.getItem('users') || '[]');
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
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('E-posta veya şifre hatalı!');
    }
    
    if (!user.approved) {
      throw new Error('Hesabınız henüz onaylanmamış. Lütfen admin onayını bekleyin.');
    }
    
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
    
    return newUser;
  };

  const value = {
    currentUser,
    loading,
    signIn,
    signOut,
    register,
    isAuthenticated: currentUser !== null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
