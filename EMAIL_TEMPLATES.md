# EmailJS Template Kullanım Rehberi

## Mevcut Template'ler

### 1. template_g8ee2jz - Admin Bildirimleri
**Kullanım Alanları:**
- Yeni kullanıcı kaydı bildirimi (admin'e)
- Sistem bildirimleri

**EmailJS'te Template İçeriği:**
```
Subject: Yeni Kullanıcı Kaydı - {{from_name}}

Merhaba Admin,

Yeni kullanıcı kaydı! Onay bekliyor.

Ad Soyad: {{from_name}}
E-posta: {{from_email}}
Şirket: {{company}}

{{message}}

Admin paneline gitmek için: https://teklif-sistemi.netlify.app

İyi günler.
```

**Kod'da Parametreler:**
```javascript
{
  to_email: 'emrullah.gunay@kobinerji.com',
  to_name: 'Admin',
  from_name: userData.name,
  from_email: userData.email,
  company: userData.company,
  message: 'Detaylı bilgi...'
}
```

---

### 2. template_5xj0s46 - Login Bilgileri
**Kullanım Alanları:**
- Yeni kullanıcı oluşturma (admin tarafından)
- Login bilgilerini tekrar gönderme
- Şifre sıfırlama

**EmailJS'te Template İçeriği:**
```
Subject: {{from_name}} - Giriş Bilgileriniz

Merhaba {{user_name}},

Sisteme giriş bilgileriniz aşağıdadır:

E-posta: {{user_email}}
Şifre: {{user_password}}
Firma: {{user_company}}

Giriş için: {{login_url}}

⚠️ Güvenlik için giriş yaptıktan sonra şifrenizi değiştirmenizi öneririz.

İyi günler dileriz,
{{from_name}}
```

**Kod'da Parametreler:**
```javascript
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
}
```

---

## Kullanım Yerleri

### SimpleRegister.jsx
- Template: **template_g8ee2jz**
- Amaç: Admin'e yeni kayıt bildirimi

### SimpleAdminPanel.jsx
- **createNewUser()**: template_5xj0s46 → Yeni kullanıcıya login bilgileri
- **sendLoginCredentials()**: template_5xj0s46 → Mevcut kullanıcıya login bilgileri

### ForgotPassword.jsx
- Template: **template_5xj0s46**
- Amaç: Şifre sıfırlama - yeni geçici şifre

---

## EmailJS Dashboard Ayarları

1. https://dashboard.emailjs.com/ → Login
2. Email Templates sekmesi
3. Her template için yukarıdaki içerikleri kopyalayın
4. **Önemli**: `{{variable}}` formatını koruyun
5. Test Email gönderin

---

## Güvenlik Notları

- API Key: `-rEVDm1IKnRaw6jCm` (public key - güvenli)
- Service ID: `service_5l9ghli`
- Şifreler düz metin olarak gönderiliyor (kullanıcı değiştirmeli)
- Reply-to: `emrullah.gunay@kobinerji.com`

---

## Sorun Giderme

**Mail gitmiyor?**
1. Console'u kontrol et (F12)
2. EmailJS dashboard'da Usage kontrolü
3. Template variable'larını kontrol et

**Yanlış bilgiler geliyor?**
- Template'deki `{{variable}}` isimlerini kontrol et
- Kod'daki parametre isimlerini kontrol et

**Spam'e düşüyor?**
- EmailJS'in SPF/DKIM ayarları otomatik
- Kullanıcılara "Gelen Kutusu" kontrolü söyle
