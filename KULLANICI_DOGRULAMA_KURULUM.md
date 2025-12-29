# 🔐 Kullanıcı Doğrulama Sistemi Kurulum Kılavuzu

## ✅ Yapılan Değişiklikler

Sitenize kullanıcı kayıt, giriş ve admin onay sistemi eklenmiştir.

### Yeni Dosyalar:
- ✅ `src/firebase.js` - Firebase yapılandırması
- ✅ `src/Login.jsx` - Giriş ekranı
- ✅ `src/Register.jsx` - Kayıt ekranı
- ✅ `src/AuthContext.jsx` - Kullanıcı yönetimi
- ✅ `src/AppWithAuth.jsx` - Korumalı ana uygulama
- ✅ `src/AdminPanel.jsx` - Admin onay paneli
- ✅ `src/admin.jsx` - Admin paneli giriş dosyası
- ✅ `admin.html` - Admin paneli HTML sayfası

### Güncellenmiş Dosyalar:
- ✅ `src/main.jsx` - AppWithAuth ile güncellendi
- ✅ `package.json` - Firebase eklendi

---

## 🚀 Firebase Kurulum Adımları

### 1. Firebase Projesi Oluşturun

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. "Proje Ekle" butonuna tıklayın
3. Proje adı verin (örn: "teklif-sistemi")
4. Google Analytics'i isteğe bağlı olarak etkinleştirin
5. "Proje Oluştur" butonuna tıklayın

### 2. Web Uygulaması Ekleyin

1. Firebase projesinde sol menüden **⚙️ Proje Ayarları** > **Genel** kısmına gidin
2. "Uygulamalar" bölümünde **</>** (Web) butonuna tıklayın
3. Uygulama takma adı verin (örn: "teklif-web")
4. Firebase Hosting'i kurmak istemiyorsanız işaretlemeyin
5. "Uygulamayı Kaydet" butonuna tıklayın
6. Karşınıza çıkan **firebaseConfig** bilgilerini kopyalayın

### 3. Firebase Config'i Güncelleyin

`src/firebase.js` dosyasını açın ve Firebase Console'dan aldığınız bilgilerle güncelleyin:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...", // Kendi bilgileriniz
  authDomain: "teklif-sistemi.firebaseapp.com",
  projectId: "teklif-sistemi",
  storageBucket: "teklif-sistemi.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 4. Authentication'ı Etkinleştirin

1. Firebase Console'da sol menüden **🔐 Authentication** seçin
2. "Başlayın" butonuna tıklayın
3. "Sign-in method" (Oturum açma yöntemi) sekmesine gidin
4. **E-posta/Şifre** seçeneğini etkinleştirin
   - "E-posta/Şifre" satırına tıklayın
   - "Etkinleştir" anahtarını açın
   - "Kaydet" butonuna tıklayın

### 5. Firestore Database Kurun

1. Firebase Console'da sol menüden **🔥 Firestore Database** seçin
2. "Veritabanı Oluştur" butonuna tıklayın
3. **Test modunda başlat** seçeneğini seçin (geliştirme için)
4. Konum seçin (örn: europe-west3 - Frankfurt)
5. "Etkinleştir" butonuna tıklayın

### 6. Firestore Güvenlik Kuralları (ÖNEMLİ!)

Firestore Database > **Rules** sekmesine gidin ve aşağıdaki kuralları ekleyin:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcılar koleksiyonu
    match /users/{userId} {
      // Herkes kendi kaydını oluşturabilir (kayıt sırasında)
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Sadece kendi bilgilerini okuyabilir
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Kullanıcı kendi bilgilerini güncelleyemez (sadece admin)
      allow update: if false;
      
      // Kullanıcı kendi hesabını silemez (sadece admin)
      allow delete: if false;
    }
  }
}
```

⚠️ **NOT:** Yukarıdaki kurallar normal kullanıcılar içindir. Admin paneli için ayrı bir güvenlik yapılandırması yapmalısınız (aşağıda anlatılıyor).

---

## 👨‍💼 Admin Hesabı Oluşturma

### Manuel Yöntem (Firebase Console):

1. Firebase Console > **Authentication** > **Users** sekmesine gidin
2. "Kullanıcı Ekle" butonuna tıklayın
3. Admin e-posta ve şifrenizi girin
4. Kullanıcıyı oluşturun
5. Firestore Database > **users** koleksiyonuna gidin
6. Manuel olarak bir doküman ekleyin:
   - Doküman ID: Admin kullanıcısının UID'si (Authentication'dan kopyalayın)
   - Alanlar:
     ```
     approved: true
     email: "admin@example.com"
     name: "Admin"
     role: "admin"
     createdAt: (şu anki tarih)
     ```

### Otomatik Yöntem (Site Üzerinden):

1. Sitenizin kayıt sayfasına gidin
2. Admin hesabınızı kaydedin
3. Firebase Console > Firestore Database > users koleksiyonuna gidin
4. Oluşturduğunuz kullanıcıyı bulun
5. `approved` alanını `true` yapın
6. İsteğe bağlı: `role` alanını `"admin"` olarak ekleyin

---

## 🎯 Kullanım

### Normal Kullanıcı:

1. **Kayıt Olma:**
   - Siteye gidin → "Kayıt Ol" butonuna tıklayın
   - Ad, e-posta, şifre girin
   - Kayıt tamamlanır ancak giriş yapılamaz (admin onayı gerekir)

2. **Onay Bekleme:**
   - Admin e-postanıza onay talebi bildirimi gelir
   - Admin panelinden onaylanmanızı bekleyin

3. **Giriş Yapma:**
   - Onaylandıktan sonra e-posta ve şifre ile giriş yapın
   - Artık siteye tam erişiminiz var

### Admin:

1. **Admin Paneline Erişim:**
   - Tarayıcınızda `http://localhost:5173/admin.html` adresine gidin
   - Veya canlı sitede: `https://siteniz.com/admin.html`

2. **Kullanıcı Onaylama:**
   - "Bekleyen" sekmesinde onay bekleyen kullanıcıları görün
   - "Onayla" butonuna tıklayarak kullanıcıyı aktif edin
   - "Reddet" butonuna tıklayarak kullanıcıyı silin

3. **Kullanıcı Yönetimi:**
   - "Onaylı" sekmesinde aktif kullanıcıları görün
   - İsterseniz kullanıcı onayını iptal edebilirsiniz
   - Kullanıcıları tamamen silebilirsiniz

---

## 🔒 Güvenlik Önerileri

### 1. Production Firestore Kuralları

Canlı ortam için daha güvenli kurallar:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Sadece authenticated kullanıcılar kendi dokümanını oluşturabilir
      allow create: if request.auth != null 
                    && request.auth.uid == userId
                    && request.resource.data.approved == false;
      
      // Kullanıcılar sadece kendi bilgilerini okuyabilir
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Hiç kimse update/delete yapamaz (admin için ayrı kural gerekir)
      allow update, delete: if false;
    }
  }
}
```

### 2. Admin Güvenlik

- Admin panelini production'da gizli bir URL'de tutun
- Firebase Authentication'da admin kullanıcıları için özel claims ekleyin
- Admin paneline sadece belirli IP'lerden erişim verin (hosting ayarları)

### 3. E-posta Doğrulama (Opsiyonel)

Kayıt sırasında e-posta doğrulama eklemek için `Register.jsx` dosyasında:

```javascript
import { sendEmailVerification } from 'firebase/auth';

// Kayıt başarılı olduktan sonra:
await sendEmailVerification(userCredential.user);
```

### 4. Şifre Sıfırlama (Opsiyonel)

`Login.jsx` dosyasına şifre sıfırlama özelliği ekleyin:

```javascript
import { sendPasswordResetEmail } from 'firebase/auth';

const handlePasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    alert('Şifre sıfırlama e-postası gönderildi!');
  } catch (error) {
    console.error('Şifre sıfırlama hatası:', error);
  }
};
```

---

## 🚀 Canlıya Alma

### Netlify Deploy:

1. **Build ayarları (`netlify.toml`)** zaten var
2. Firebase config bilgilerinizi environment variables olarak ekleyin:
   - VITE_FIREBASE_API_KEY
   - VITE_FIREBASE_AUTH_DOMAIN
   - vb.

3. `src/firebase.js` dosyasını environment variables kullanacak şekilde güncelleyin:

```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

4. Git push yapın, Netlify otomatik deploy eder

---

## ❓ Sorun Giderme

### "Firebase App not initialized" hatası:
- `src/firebase.js` dosyasındaki config bilgilerini kontrol edin
- Firebase Console'da uygulamanızın doğru kurulduğunu doğrulayın

### "Permission denied" hatası:
- Firestore kurallarını kontrol edin
- Kullanıcının `approved: true` olduğunu doğrulayın

### Admin paneli çalışmıyor:
- `npm run dev` çalıştırdıktan sonra `http://localhost:5173/admin.html` adresine gidin
- Browser console'da hata mesajlarını kontrol edin

### Kullanıcı giriş yapamıyor:
- Authentication > Users'da kullanıcının olduğunu kontrol edin
- Firestore > users koleksiyonunda `approved: true` olduğunu kontrol edin

---

## 📧 Destek

Herhangi bir sorun yaşarsanız:
1. Browser console'u (F12) açın ve hataları kontrol edin
2. Firebase Console > Authentication > Users'da kullanıcıları kontrol edin
3. Firebase Console > Firestore Database'de veri yapısını kontrol edin

---

**🎉 Tebrikler! Kullanıcı doğrulama sisteminiz hazır.**

Artık siteniz sadece sizin onayladığınız kullanıcılar tarafından kullanılabilir.
