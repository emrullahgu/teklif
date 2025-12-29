import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Trash2, Mail, User, Building, RefreshCw, UserPlus, Lock, AlertCircle } from 'lucide-react';
import emailjs from 'emailjs-com';

const SimpleAdminPanel = ({ isEmbedded = false }) => {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(isEmbedded); // Embedded ise otomatik authenticated
  
  // Yeni kullanıcı oluşturma state'leri
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
    role: 'user'
  });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState('');

  // Admin bilgileri
  const ADMIN_EMAIL = 'emrullah.gunay@kobinerji.com';
  const ADMIN_PASSWORD = 'Eg8502Eg.';

  useEffect(() => {
    if (isAuthenticated) {
      loadUsers();
    }
  }, [filter, isAuthenticated]);

  const loadUsers = () => {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    console.log('📋 Tüm kullanıcılar:', allUsers.length);
    console.log('🔍 Seçili filtre:', filter);
    
    let filteredUsers = allUsers;
    if (filter === 'pending') {
      filteredUsers = allUsers.filter(u => !u.approved);
      console.log('⏳ Bekleyen kullanıcılar:', filteredUsers.length);
    } else if (filter === 'approved') {
      filteredUsers = allUsers.filter(u => u.approved);
      console.log('✅ Onaylı kullanıcılar:', filteredUsers.length);
    } else {
      console.log('📊 Tüm kullanıcılar gösteriliyor:', filteredUsers.length);
    }
    
    console.log('👥 Gösterilecek kullanıcılar:', filteredUsers);
    setUsers(filteredUsers);
  };

  const approveUser = (userId) => {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = allUsers.map(u => 
      u.id === userId ? { ...u, approved: true, approvedAt: new Date().toISOString() } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    alert('Kullanıcı başarıyla onaylandı!');
    loadUsers();
  };

  const deleteUser = (userId) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = allUsers.filter(u => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    alert('Kullanıcı silindi!');
    loadUsers();
  };

  const revokeApproval = (userId) => {
    if (!window.confirm('Bu kullanıcının onayını iptal etmek istediğinizden emin misiniz?')) {
      return;
    }
    
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = allUsers.map(u => 
      u.id === userId ? { ...u, approved: false } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    alert('Kullanıcı onayı iptal edildi!');
    loadUsers();
  };

  const changeUserRole = (userId, newRole) => {
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = allUsers.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    alert(`Kullanıcı rolü "${newRole}" olarak güncellendi!`);
    loadUsers();
  };

  const generateRandomPassword = () => {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
  };

  const sendLoginCredentials = async (userId) => {
    try {
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const user = allUsers.find(u => u.id === userId);
      
      if (!user) {
        alert('Kullanıcı bulunamadı!');
        return;
      }

      console.log('📧 Login bilgileri gönderiliyor:', user.email);

      await emailjs.send(
        'service_5l9ghli',
        'template_5xj0s46',
        {
          to_email: user.email,
          to_name: user.name,
          user_name: user.name,
          user_email: user.email,
          user_password: user.password,
          user_company: user.company || 'Belirtilmemiş',
          login_url: window.location.origin,
          from_name: 'Teklif Sistemi',
          reply_to: 'emrullah.gunay@kobinerji.com'
        },
        '-rEVDm1IKnRaw6jCm'
      );

      console.log('✅ Email başarıyla gönderildi');
      alert(`✅ Login bilgileri ${user.email} adresine gönderildi!`);

    } catch (error) {
      console.error('❌ Email gönderme hatası:', error);
      alert('❌ E-posta gönderilemedi! Konsolu kontrol edin.');
    }
  };

  const createNewUser = async (e) => {
    e.preventDefault();
    setCreateUserError('');
    setCreateUserLoading(true);

    try {
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      
      // E-posta kontrolü
      if (allUsers.find(u => u.email === newUserForm.email)) {
        throw new Error('Bu e-posta adresi zaten kullanılıyor!');
      }

      // Şifre yoksa otomatik oluştur
      const password = newUserForm.password || generateRandomPassword();

      const newUser = {
        id: Date.now().toString(),
        name: newUserForm.name,
        email: newUserForm.email,
        company: newUserForm.company,
        password: password,
        role: newUserForm.role,
        approved: true, // Admin oluşturduğu için otomatik onaylı
        createdAt: new Date().toISOString(),
        createdBy: 'admin'
      };

      // Kullanıcıyı kaydet
      allUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(allUsers));

      console.log('✅ Yeni kullanıcı oluşturuldu:', newUser.email);

      // EmailJS ile login bilgilerini gönder
      try {
        console.log('📧 Email gönderiliyor:', newUser.email);
        
        const emailResult = await emailjs.send(
          'service_5l9ghli',
          'template_5xj0s46',
          {
            to_email: newUser.email,
            to_name: newUser.name,
            user_name: newUser.name,
            user_email: newUser.email,
            user_password: password,
            user_company: newUser.company || 'Belirtilmemiş',
            login_url: window.location.origin,
            from_name: 'Teklif Sistemi',
            reply_to: 'emrullah.gunay@kobinerji.com'
          },
          '-rEVDm1IKnRaw6jCm'
        );
        
        console.log('✅ Email başarıyla gönderildi:', emailResult);
        alert(`✅ Kullanıcı başarıyla oluşturuldu!\n\nLogin bilgileri ${newUser.email} adresine gönderildi.\n\nE-posta: ${newUser.email}\nŞifre: ${password}`);
      } catch (emailError) {
        console.error('❌ Email gönderme hatası:', emailError);
        alert(`⚠️ Kullanıcı oluşturuldu ancak e-posta gönderilemedi!\n\nLütfen manuel olarak iletişime geçin:\nE-posta: ${newUser.email}\nŞifre: ${password}`);
      }
      
      // Formu temizle
      setNewUserForm({
        name: '',
        email: '',
        company: '',
        password: '',
        role: 'user'
      });
      setShowCreateUser(false);
      loadUsers();

    } catch (error) {
      console.error('Kullanıcı oluşturma hatası:', error);
      setCreateUserError(error.message || 'Kullanıcı oluşturulurken bir hata oluştu!');
    } finally {
      setCreateUserLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Bilinmiyor';
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR');
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminEmail === ADMIN_EMAIL && adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Hatalı e-posta veya şifre!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Admin Paneli Girişi</h2>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şifre
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Şifrenizi girin"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Paneli</h1>
              <p className="text-gray-600">Kullanıcı onay ve yönetim sistemi</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateUser(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
              >
                <UserPlus className="w-4 h-4" />
                Yeni Kullanıcı
              </button>
              <button
                onClick={loadUsers}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
              >
                <RefreshCw className="w-4 h-4" />
                Yenile
              </button>
            </div>
          </div>
        </div>

        {/* Yeni Kullanıcı Oluşturma Modalı */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">Yeni Kullanıcı Oluştur</h2>
                <p className="text-gray-600 text-sm mt-1">Login bilgileri otomatik e-posta ile gönderilecek</p>
              </div>

              <form onSubmit={createNewUser} className="p-6 space-y-4">
                {createUserError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{createUserError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad Soyad *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={newUserForm.name}
                      onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Kullanıcı adı"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-posta *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={newUserForm.email}
                      onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Firma
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={newUserForm.company}
                      onChange={(e) => setNewUserForm({ ...newUserForm, company: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Firma adı"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şifre (Opsiyonel)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Boş bırakılırsa otomatik oluşturulur"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Boş bırakılırsa güvenli rastgele şifre oluşturulur</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="user">Kullanıcı</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong className="text-blue-700">Not:</strong> Login bilgileri (e-posta ve şifre) kullanıcıya otomatik olarak e-posta ile gönderilecektir.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={createUserLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {createUserLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Oluşturuluyor...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Kullanıcı Oluştur</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateUser(false);
                      setCreateUserError('');
                      setNewUserForm({
                        name: '',
                        email: '',
                        company: '',
                        password: '',
                        role: 'user'
                      });
                    }}
                    disabled={createUserLoading}
                    className="px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition disabled:opacity-50"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filtreler */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Clock className="inline w-4 h-4 mr-2" />
              Bekleyen
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'approved'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <CheckCircle className="inline w-4 h-4 mr-2" />
              Onaylı
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tümü
            </button>
          </div>
        </div>

        {/* Kullanıcı Listesi */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {users.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg">Kullanıcı bulunamadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Kullanıcı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      E-posta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Şirket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Kayıt Tarihi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.approved ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Onaylı
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-4 h-4 mr-1" />
                            Bekliyor
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="text-gray-900 font-medium">{user.name || 'İsimsiz'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail className="w-5 h-5 text-gray-400 mr-2" />
                          <span className="text-gray-600">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.company ? (
                          <div className="flex items-center">
                            <Building className="w-5 h-5 text-gray-400 mr-2" />
                            <span className="text-gray-600">{user.company}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role || 'user'}
                          onChange={(e) => changeUserRole(user.id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="user">Kullanıcı</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2 flex-wrap">
                          {!user.approved ? (
                            <>
                              <button
                                onClick={() => approveUser(user.id)}
                                className="inline-flex items-center px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Onayla
                              </button>
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="inline-flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reddet
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => sendLoginCredentials(user.id)}
                                className="inline-flex items-center px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                                title="Login bilgilerini mail ile gönder"
                              >
                                <Mail className="w-4 h-4 mr-1" />
                                Bilgileri Gönder
                              </button>
                              <button
                                onClick={() => revokeApproval(user.id)}
                                className="inline-flex items-center px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                İptal
                              </button>
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="inline-flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleAdminPanel;
