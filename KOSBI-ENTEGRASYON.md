# KOSBI Entegrasyonu - Kurulum Kılavuzu

## 📋 Genel Bakış

KOSBI (https://elektrik.kosbi.org.tr) elektrik sayaç verilerini otomatik çekmek için backend proxy servisi kurulumu.

## 🚀 Hızlı Başlangıç

### 1. Backend Sunucusunu Başlatın

```bash
# Server klasörüne gidin
cd server

# Bağımlılıkları yükleyin
npm install

# Sunucuyu başlatın
npm start

# VEYA geliştirme modu (otomatik yeniden başlatma)
npm run dev
```

Sunucu `http://localhost:3001` adresinde çalışacak.

### 2. Frontend'i Güncelleyin

`src/Osos.jsx` dosyasında `fetchKosbiData` fonksiyonunu güncelleyin (aşağıda detaylı açıklama).

### 3. Test Edin

1. OSOS sayfasını açın (`http://localhost:3000/osos.html`)
2. "KOSBI Veri Çek" butonuna tıklayın
3. Kullanıcı seçip "Veri Çek" butonuna basın
4. Sayaç verileri otomatik yüklenecek

## 🔧 Teknik Detaylar

### Backend API Endpoints

#### 1. Login
```
POST http://localhost:3001/api/kosbi/login
Content-Type: application/json

{
  "username": "7372509",
  "password": "0129"
}

Response:
{
  "success": true,
  "sessionId": "7372509_1234567890",
  "message": "Giriş başarılı"
}
```

#### 2. Sayaç Verilerini Çek
```
GET http://localhost:3001/api/kosbi/meters/:sessionId

Response:
{
  "success": true,
  "data": [
    {
      "sayacNo": "12345678",
      "ad": "Ana Sayaç",
      "cekilen": "1250",
      "verilen": "50",
      "reaktifCekilen": "120",
      "reaktifVerilen": "5",
      "tarih": "2026-01-15"
    }
  ],
  "count": 1
}
```

#### 3. Logout
```
DELETE http://localhost:3001/api/kosbi/logout/:sessionId

Response:
{
  "success": true
}
```

#### 4. Health Check
```
GET http://localhost:3001/health

Response:
{
  "status": "OK",
  "activeSessions": 2,
  "timestamp": "2026-01-15T10:30:00.000Z"
}
```

### Frontend Entegrasyonu

`src/Osos.jsx` dosyasındaki `fetchKosbiData` fonksiyonunu şu şekilde güncelleyin:

```javascript
const fetchKosbiData = async (user) => {
  setIsLoadingKosbi(true);
  setSelectedKosbiUser(user);
  
  try {
    // 1. Login
    const loginResponse = await fetch('http://localhost:3001/api/kosbi/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: user.username,
        password: user.password
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      throw new Error(loginData.error || 'Login başarısız');
    }
    
    // 2. Sayaç verilerini çek
    const metersResponse = await fetch(
      `http://localhost:3001/api/kosbi/meters/${loginData.sessionId}`
    );
    
    const metersData = await metersResponse.json();
    
    if (!metersData.success) {
      throw new Error(metersData.error || 'Veri çekme başarısız');
    }
    
    setKosbiData(metersData.data);
    setIsLoadingKosbi(false);
    alert(`✅ ${user.name} için ${metersData.count} sayaç verisi yüklendi`);
    
  } catch (error) {
    console.error('KOSBI veri çekme hatası:', error);
    alert('❌ Veri çekme hatası: ' + error.message);
    setIsLoadingKosbi(false);
  }
};
```

## ⚠️ Önemli Notlar

### 1. HTML Yapısı
KOSBI'nin HTML yapısı değişebilir. `kosbi-proxy.js` dosyasındaki Cheerio selector'ları kontrol edin:

```javascript
// Sayaç tablosunu bul
$('table tr').each((index, element) => {
  const cells = $(element).find('td');
  // ...
});
```

### 2. Sayfa URL'leri
KOSBI'deki sayfa URL'leri değişebilir. Kontrol edilmesi gerekenler:
- `/Login.aspx` - Login sayfası
- `/SayacOkumalari.aspx` - Sayaç verileri sayfası (isim farklı olabilir)
- `/Default.aspx` - Ana sayfa

### 3. Form Alanları
ASP.NET ViewState alanları:
- `__VIEWSTATE`
- `__EVENTVALIDATION`
- `__VIEWSTATEGENERATOR`
- `txtKullaniciAdi` (kullanıcı adı input)
- `txtSifre` (şifre input)
- `btnGiris` (giriş button)

Bu alanlar değişirse `kosbi-proxy.js`'i güncelleyin.

### 4. Session Yönetimi
- Session'lar bellekte tutulur (production'da Redis kullanın)
- 2 saatten eski session'lar otomatik silinir
- Her kullanıcı için ayrı session

## 🔒 Güvenlik

### Production Ortamı İçin:
1. **Environment Variables**: Hassas bilgileri `.env` dosyasında tutun
2. **HTTPS**: Sadece HTTPS üzerinden iletişim kurun
3. **Rate Limiting**: Express-rate-limit kullanın
4. **Redis**: Session storage için Redis kullanın
5. **Şifre Encryption**: Kullanıcı şifrelerini encrypt edin
6. **Authentication**: Frontend'de de authentication ekleyin

Örnek `.env` dosyası:
```
PORT=3001
KOSBI_BASE_URL=https://elektrik.kosbi.org.tr
NODE_ENV=production
REDIS_URL=redis://localhost:6379
```

## 🐛 Sorun Giderme

### Problem: "Login başarısız"
**Çözüm**: 
1. Kullanıcı adı/şifre doğru mu kontrol edin
2. KOSBI sitesi erişilebilir mi test edin
3. Form alanlarının isimlerini kontrol edin

### Problem: "Sayaç verisi bulunamadı"
**Çözüm**: 
1. KOSBI'ye manuel giriş yapıp tablo yapısını inceleyin
2. Cheerio selector'larını güncelleyin
3. Console loglarını kontrol edin

### Problem: "CORS hatası"
**Çözüm**: 
1. Backend sunucusu çalışıyor mu kontrol edin
2. CORS ayarlarını kontrol edin
3. Frontend URL'lerinin cors whitelist'te olduğundan emin olun

### Problem: "Session expired"
**Çözüm**: 
1. Kullanıcı tekrar giriş yapsın
2. Session timeout süresini artırın
3. Redis kullanarak session'ları kalıcı hale getirin

## 📊 Log İzleme

Backend sunucusu detaylı loglar üretir:
```
🔐 KOSBI Login denemesi: 7372509
📄 ViewState alındı
✅ Login başarılı
📊 Sayaç verileri çekiliyor: 7372509
✅ 3 sayaç verisi bulundu
```

## 🚀 Production Deployment

### Heroku
```bash
# Heroku CLI kurulu olmalı
heroku create kosbi-proxy
git subtree push --prefix server heroku main
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production
COPY server/ ./
EXPOSE 3001
CMD ["node", "kosbi-proxy.js"]
```

### PM2 (Process Manager)
```bash
npm install -g pm2
pm2 start server/kosbi-proxy.js --name kosbi-proxy
pm2 save
pm2 startup
```

## 📞 Destek

Sorun yaşarsanız:
1. Backend sunucu loglarını kontrol edin
2. Browser console'unu kontrol edin
3. Network sekmesinde API çağrılarını inceleyin
4. KOSBI sitesinin erişilebilir olduğundan emin olun

## 📝 Lisans

MIT License
