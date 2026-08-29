import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import BordroTakip from './BordroTakip.jsx';
import './index.css';

export const BordroWithPassword = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Sayfa yüklendiğinde sessionStorage'ı kontrol et
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('bordro_authenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === '687191') {
      setIsAuthenticated(true);
      sessionStorage.setItem('bordro_authenticated', 'true');
      setError('');
    } else {
      setError('Hatalı şifre!');
      setPassword('');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('bordro_authenticated');
    setIsAuthenticated(false);
    setPassword('');
  };

  if (isAuthenticated) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg font-semibold transition flex items-center space-x-2"
          >
            <span>🔒</span>
            <span>Çıkış Yap</span>
          </button>
        </div>
        <BordroTakip />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Bordro Takip Sistemi</h1>
          <p className="text-gray-600">Lütfen şifrenizi girin</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Şifrenizi girin"
              autoFocus
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BordroWithPassword />
  </React.StrictMode>,
);
