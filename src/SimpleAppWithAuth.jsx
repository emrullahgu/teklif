import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './SimpleAuth';
import SimpleLogin from './SimpleLogin';
import SimpleRegister from './SimpleRegister';
import ForgotPassword from './ForgotPassword';
import UserProfile from './UserProfile';
import App from './App';
import SimpleAdminPanel from './SimpleAdminPanel';
import { LogOut, User, Shield, Settings, UserPlus } from 'lucide-react';

const AuthWrapper = () => {
  const { isAuthenticated, loading, currentUser, signOut } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Admin kontrolü
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'emrullah.gunay@kobinerji.com';

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
    if (showForgotPassword) {
      return <ForgotPassword onBackToLogin={() => setShowForgotPassword(false)} />;
    }
    if (showRegister) {
      return <SimpleRegister onSwitchToLogin={() => setShowRegister(false)} />;
    }
    return (
      <SimpleLogin 
        onSwitchToRegister={() => setShowRegister(true)}
        onSwitchToForgotPassword={() => setShowForgotPassword(true)}
      />
    );
  }

  // Admin paneli gösteriliyorsa
  if (showAdminPanel) {
    return (
      <div>
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <button
              onClick={() => setShowAdminPanel(false)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
            >
              ← Ana Sayfa
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış Yap</span>
            </button>
          </div>
        </div>
        <SimpleAdminPanel isEmbedded={true} />
      </div>
    );
  }

  return (
    <div>
      {/* Profil modal */}
      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
      
      {/* Kullanıcı bilgisi ve çıkış butonu */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <span className="text-gray-700 font-medium">{currentUser?.name || currentUser?.email}</span>
            {currentUser?.company && (
              <span className="text-gray-500 text-sm">- {currentUser.company}</span>
            )}
            {isAdmin && (
              <span className="ml-3 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                ADMIN
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition duration-200"
            >
              <Settings className="w-4 h-4" />
              <span>Profil</span>
            </button>
            {isAdmin && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition duration-200"
              >
                <Shield className="w-4 h-4" />
                <span>Yönetim Paneli</span>
              </button>
            )}
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Çıkış Yap</span>
            </button>
          </div>
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
