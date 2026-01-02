import React from 'react';
import ReactDOM from 'react-dom/client';
import BordroTakip from './BordroTakip.jsx';
import { AuthProvider } from './SimpleAuth';
import SimpleLogin from './SimpleLogin';
import SimpleRegister from './SimpleRegister';
import './index.css';

// Auth ile sarılmış Bordro Bileşeni
function BordroWithAuth() {
  const [showRegister, setShowRegister] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
      if (user && user.approved) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
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
    return <SimpleLogin onSwitchToRegister={() => setShowRegister(true)} />;
  }

  return <BordroTakip />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BordroWithAuth />
    </AuthProvider>
  </React.StrictMode>,
);
