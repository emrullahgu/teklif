import React, { useState } from 'react';
import { AuthProvider, useAuth } from './SimpleAuth';
import SimpleLogin from './SimpleLogin';
import SimpleRegister from './SimpleRegister';
import App from './App';
import { LogOut, User } from 'lucide-react';

const AuthWrapper = () => {
  const { isAuthenticated, loading, currentUser, signOut } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showRegister) {
      return <SimpleRegister onSwitchToLogin={() => setShowRegister(false)} />;
    }
    return (
      <SimpleLogin onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  return (
    <div>
      {/* Kullanıcı bilgisi ve çıkış butonu */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span className="text-gray-700 font-medium">{currentUser?.name || currentUser?.email}</span>
            {currentUser?.company && (
              <span className="text-gray-500 text-sm">- {currentUser.company}</span>
            )}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </div>
      
      {/* Ana uygulama */}
      <App />
    </div>
  );
};

const SimpleAppWithAuth = () => {
  return (
    <AuthProvider>
      <AuthWrapper />
    </AuthProvider>
  );
};

export default SimpleAppWithAuth;
