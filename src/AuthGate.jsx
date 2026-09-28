// AuthGate — ayrı açılan sayfaları (bordro, osos, akaryakıt, beyaz yaka, kontrol, admin)
// giriş zorunlu hale getirir. Oturum ana uygulamayla ortaktır: orada giriş yapan
// kullanıcı bu sayfalarda tekrar giriş yapmaz.
import React from 'react';
import { AuthProvider, useAuth } from './SimpleAuth';
import SimpleLogin from './SimpleLogin';
import SunucuDurumu from './SunucuDurumu';

const anaSayfayaGit = () => {
  window.location.href = '/';
};

function Kapi({ children, sadeceAdmin }) {
  const { isAuthenticated, loading, currentUser, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">Yükleniyor...</div>
    );
  }

  if (!isAuthenticated) {
    return <SimpleLogin onSwitchToRegister={anaSayfayaGit} onSwitchToForgotPassword={anaSayfayaGit} />;
  }

  if (sadeceAdmin && currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-gray-700">
        <p>Bu sayfa sadece yöneticiler içindir.</p>
        <div className="flex gap-3">
          <button type="button" onClick={anaSayfayaGit} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Ana sayfa
          </button>
          <button type="button" onClick={signOut} className="px-4 py-2 bg-gray-500 text-white rounded-lg">
            Çıkış yap
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default function AuthGate({ children, sadeceAdmin = false }) {
  return (
    <AuthProvider>
      <Kapi sadeceAdmin={sadeceAdmin}>{children}</Kapi>
      <SunucuDurumu />
    </AuthProvider>
  );
}
