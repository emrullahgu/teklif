import React, { useState } from 'react';
import emailjs from 'emailjs-com';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

const ForgotPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const generateTempPassword = () => {
    return Math.random().toString(36).slice(-8);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Kullanıcıyı bul
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(u => u.email === email);

      if (!user) {
        setError('Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı!');
        setLoading(false);
        return;
      }

      // Geçici şifre oluştur
      const tempPassword = generateTempPassword();

      // Şifreyi güncelle
      const updatedUsers = users.map(u => 
        u.email === email ? { ...u, password: tempPassword } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));

      // E-posta gönder
      await emailjs.send(
        'service_5l9ghli',
        'template_5xj0s46',
        {
          to_email: email,
          to_name: user.name,
          message: `Merhaba ${user.name},\n\nYeni geçici şifreniz: ${tempPassword}\n\nGiriş için: ${window.location.origin}\n\nGiriş yaptıktan sonra lütfen şifrenizi değiştirin.`
        },
        '-rEVDm1IKnRaw6jCm'
      );

      setSuccess(true);
      
      // 5 saniye sonra login'e yönlendir
      setTimeout(() => {
        onBackToLogin();
      }, 5000);

    } catch (error) {
      console.error('Şifre sıfırlama hatası:', error);
      setError('Şifre sıfırlama işlemi başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            E-posta Gönderildi!
          </h2>
          <p className="text-gray-600 mb-4">
            Yeni geçici şifreniz e-posta adresinize gönderildi.
          </p>
          <p className="text-sm text-gray-500">
            E-postanızı kontrol edin ve yeni şifrenizle giriş yapın.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Giriş sayfasına yönlendiriliyorsunuz...
          </p>
          <button
            onClick={onBackToLogin}
            className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
          >
            Hemen Giriş Yap →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <button
          onClick={onBackToLogin}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Geri Dön</span>
        </button>

        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Şifremi Unuttum</h2>
          <p className="text-gray-600 mt-2">E-posta adresinize yeni şifre göndereceğiz</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-posta Adresiniz
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ornek@email.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Gönderiliyor...</span>
              </>
            ) : (
              <>
                <Mail className="w-5 h-5" />
                <span>Şifre Gönder</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center">
            <strong className="text-blue-700">Not:</strong> Yeni şifreniz e-posta adresinize gönderilecek. Giriş yaptıktan sonra şifrenizi değiştirmenizi öneririz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
