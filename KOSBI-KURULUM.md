# 🚀 KOSBI Gerçek Entegrasyon Kurulumu

## ✅ Kurulum Tamamlandı!

KOSBI elektrik sayaç verilerini gerçek zamanlı olarak çekmek için backend proxy servisi hazır.

## 📋 Hızlı Başlangıç

### 1. Backend Sunucuyu Başlatın

**Terminal 1 - Backend:**
```bash
cd server
npm install  # İlk seferinde bir kez
npm start    # Sunucuyu başlat
```

Backend `http://localhost:3001` adresinde çalışacak.

### 2. Frontend'i Başlatın

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Frontend `http://localhost:3000` veya `http://localhost:5173` adresinde çalışacak.

### 3. OSOS Sayfasına Gidin

- Ana sayfadan "OSOS" butonuna tıklayın
- Veya direkt: `http://localhost:3000/osos.html`

### 4. KOSBI Verilerini Çekin

1. "KOSBI Veri Çek" butonuna tıklayın
2. Kayıtlı kullanıcılardan birini seçin (Novatem veya Ektam)
3. "Veri Çek" butonuna basın
4. Veriler otomatik yüklenecek
5. "Ölçüm Tablosuna Aktar" ile rapora ekleyin

## 📊 Tek Komutla Her İkisini Başlatma

**İleride (concurrently kurulu değil):**
```bash
npm install -g concurrently
npm run all  # Frontend + Backend birlikte
```

## 🔧 Mevcut Kullanıcılar

| Kullanıcı | Kullanıcı Adı | Şifre |
|-----------|---------------|-------|
| Novatem   | 7372509      | 0129  |
| Ektam     | 7372470      | 0129  |

Yeni kullanıcı eklemek için OSOS sayfasında "+ Yeni Kullanıcı" butonunu kullanın.

## 🎯 Nasıl Çalışıyor?

```
OSOS Frontend (React)
       ↓
   API Request
       ↓
Backend Proxy (Node.js - Port 3001)
       ↓
KOSBI Web Sitesi (elektrik.kosbi.org.tr)
       ↓
   Sayaç Verileri
       ↓
Backend Proxy (Parse HTML)
       ↓
   JSON Response
       ↓
OSOS Frontend (Tabloya Yükle)
```

## 🔍 API Test Etme

Backend çalışıyor mu test edin:
```bash
# Health check
curl http://localhost:3001/health

# Beklenen cevap:
# {"status":"OK","activeSessions":0,"timestamp":"2026-01-15T..."}
```

## ⚠️ Önemli Notlar

### 1. KOSBI HTML Yapısı
KOSBI'nin HTML yapısı değişebilir. Sayaç verileri gelmiyor mu?

**Çözüm:**
1. KOSBI'ye manuel giriş yapın
2. Sayaç sayfasının URL'ini kontrol edin
3. `server/kosbi-proxy.js` dosyasındaki URL'leri güncelleyin
4. Tablo yapısını Chrome DevTools ile inceleyin
5. Cheerio selector'larını güncelleyin

### 2. Backend Çalışmıyorsa
Frontend otomatik olarak demo moda geçer. Gerçek veri için backend'in çalışması gerekir.

### 3. CORS Hatası
Backend `http://localhost:3000` ve `http://localhost:5173` için CORS enabled. Farklı port kullanıyorsanız `server/kosbi-proxy.js`'deki CORS ayarlarını güncelleyin.

## 🐛 Sorun Giderme

### Problem: "Backend sunucu bulunamadı"
```bash
# Backend çalışıyor mu?
curl http://localhost:3001/health

# Çalışmıyorsa:
cd server
npm start
```

### Problem: "Login başarısız"
- Kullanıcı adı/şifre doğru mu?
- KOSBI sitesi erişilebilir mi?
- Backend console'da hata var mı?

### Problem: "Sayaç verisi bulunamadı"
- KOSBI'ye manuel giriş yapıp tablo yapısını kontrol edin
- `server/kosbi-proxy.js`'deki Cheerio selector'larını güncelleyin
- Backend console'da HTML output'unu inceleyin

## 📁 Dosya Yapısı

```
teklif/
├── src/
│   └── Osos.jsx              # Frontend (React)
├── server/
│   ├── kosbi-proxy.js        # Backend proxy server
│   ├── package.json          # Backend dependencies
│   └── node_modules/         # Backend packages
├── KOSBI-ENTEGRASYON.md      # Detaylı dokümantasyon
└── package.json              # Frontend + scripts
```

## 🔒 Production İçin

1. **Environment Variables:**
```bash
# server/.env
PORT=3001
NODE_ENV=production
KOSBI_BASE_URL=https://elektrik.kosbi.org.tr
```

2. **HTTPS Kullanın:**
- Let's Encrypt sertifikası
- Cloudflare proxy

3. **Rate Limiting:**
```bash
npm install express-rate-limit
```

4. **Session Storage:**
```bash
npm install redis
# Redis kullanarak session'ları saklayın
```

5. **Monitoring:**
```bash
npm install -g pm2
pm2 start server/kosbi-proxy.js --name kosbi-proxy
pm2 monit
```

## 📞 Destek

Backend logs:
```bash
cd server
npm start
# Console'da detaylı loglar göreceksiniz
```

Browser console:
- F12 > Console > API çağrılarını görün
- Network sekmesinden response'ları inceleyin

## 🎉 Test Zamanı!

1. ✅ Backend başlat: `cd server && npm start`
2. ✅ Frontend başlat: `npm run dev`
3. ✅ OSOS sayfasına git
4. ✅ "KOSBI Veri Çek" butonuna tıkla
5. ✅ Kullanıcı seç ve veri çek
6. ✅ Verileri rapora aktar

Başarılar! 🚀
