# 🔗 OSOS - WorkTracker Entegrasyonu

OSOS raporlama sistemi ile WorkTracker görev takip sistemi arasında entegrasyon kurulmuştur. Bu sayede OSOS raporlarından doğrudan görev oluşturabilirsiniz.

## 📋 Özellikler

### ✅ Yapabilecekleriniz:
- **Otomatik Görev Oluşturma**: OSOS raporundan tüm detaylarla görev oluşturun
- **Akıllı Öncelik Belirleme**: Sorunlu ölçümler varsa otomatik yüksek öncelik
- **Detaylı Açıklama**: Rapor detayları otomatik görev açıklamasına eklenir
- **Kullanıcı Atama**: WorkTracker kullanıcılarına görev atayabilme
- **Son Tarih Belirleme**: Sonraki kontrol tarihi otomatik son tarih olarak atanır

## 🚀 Kullanım

### 1️⃣ WorkTracker'ı Başlatın

WorkTracker-main klasöründe:

```bash
cd WorkTracker-main
npm install
npm run dev
```

WorkTracker http://localhost:3000 adresinde çalışacaktır.

### 2️⃣ OSOS Uygulamasında Görev Oluşturun

1. **OSOS raporunu doldurun**:
   - Firma bilgilerini girin
   - Ölçüm verilerini ekleyin
   - Tespit ve önerileri yazın

2. **"Görev Oluştur" butonuna tıklayın** (Header'da yeşil buton)

3. **WorkTracker'a Bağlanın**:
   ```
   URL: http://localhost:3000
   E-posta: admin@example.com (veya kayıtlı kullanıcı)
   Şifre: admin123
   ```

4. **Görev Bilgilerini Kontrol Edin**:
   - Başlık otomatik doldurulur
   - Açıklama rapor detaylarıyla oluşturulur
   - Öncelik akıllı belirlenir
   - İsteğe göre düzenleyin

5. **"Görevi Oluştur" butonuna tıklayın**

6. ✅ **Görev WorkTracker'da oluşturuldu!**

## 📊 Otomatik Oluşturulan Görev İçeriği

Görev oluşturulduğunda şu bilgiler otomatik eklenir:

```
📋 OSOS RAPOR DETAYLARI

🏢 Firma: Örnek Firma A.Ş.
📄 Rapor No: OSOS-2026-001
📅 Rapor Tarihi: 2026-01-15
📍 Adres: İzmir OSB 1. Cad. No:45

⚠️ SORUNLU ÖLÇÜMLER (2 adet):
1. Ana Pano - Topraklama Direnci: 15 Ohm (Limit: < 10)
2. Tali Pano - İzolasyon: 0.5 MOhm (Limit: > 1)

🔍 TESPİTLER:
[Rapordaki tespit metni]

💡 ÖNERİLER:
[Rapordaki öneri metni]

📞 İletişim: Ahmet Yılmaz
📱 Telefon: 0532 xxx xx xx
✅ Sonraki Kontrol: 2026-07-15
```

## 🎯 Öncelik Belirleme Mantığı

- **YÜKSEK**: Sorunlu (Uygun Değil) ölçüm varsa
- **ORTA**: Tüm ölçümler uygunsa
- **ACİL**: Manuel olarak ayarlanabilir

## 🔧 Teknik Detaylar

### API Endpoint'leri

#### WorkTracker Login
```javascript
POST http://localhost:3000/api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### Görev Oluşturma
```javascript
POST http://localhost:3000/api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "OSOS Raporu - Firma X",
  "description": "Rapor detayları...",
  "priority": "HIGH",
  "status": "PENDING",
  "assignedToId": "user-uuid",
  "dueDate": "2026-07-15"
}

Response:
{
  "id": "task-uuid",
  "title": "...",
  "status": "PENDING",
  ...
}
```

#### Kullanıcı Listesi
```javascript
GET http://localhost:3000/api/users
Authorization: Bearer <token>

Response:
[
  {
    "id": "uuid-1",
    "name": "John Doe",
    "email": "john@example.com"
  },
  ...
]
```

## 🛠️ Kod Yapısı

### Yeni State Değişkenleri (OSOS.jsx)

```javascript
// WorkTracker Entegrasyonu
const [showWorkTrackerModal, setShowWorkTrackerModal] = useState(false);
const [workTrackerConfig, setWorkTrackerConfig] = useState({
  url: 'http://localhost:3000',
  email: '',
  password: ''
});
const [workTrackerToken, setWorkTrackerToken] = useState(null);
const [workTrackerUsers, setWorkTrackerUsers] = useState([]);
const [taskForm, setTaskForm] = useState({
  title: '',
  description: '',
  priority: 'MEDIUM',
  assignedToId: '',
  dueDate: ''
});
```

### Yeni Fonksiyonlar

1. **`loginToWorkTracker()`**: WorkTracker'a giriş yapar
2. **`fetchWorkTrackerUsers()`**: Kullanıcı listesini çeker
3. **`createWorkTrackerTask()`**: Görev oluşturur
4. **`createTaskFromReport()`**: Rapordan otomatik görev oluşturur

## ⚠️ Sorun Giderme

### Problem: "WorkTracker bağlantı hatası"

**Çözüm**:
1. WorkTracker sunucusunun çalıştığından emin olun:
   ```bash
   cd WorkTracker-main
   npm run dev
   ```
2. URL'nin doğru olduğunu kontrol edin (`http://localhost:3000`)
3. CORS ayarlarını kontrol edin

### Problem: "Login başarısız"

**Çözüm**:
1. E-posta ve şifrenin doğru olduğunu kontrol edin
2. WorkTracker'da kullanıcının kayıtlı olduğundan emin olun
3. Database bağlantısını kontrol edin

### Problem: "Görev oluşturulamadı"

**Çözüm**:
1. Görev başlığının doldurulduğundan emin olun
2. Token'ın geçerli olduğunu kontrol edin
3. WorkTracker API loglarını inceleyin

## 📝 Örnek Kullanım Senaryosu

### Senaryo: Elektrik Tesisatı Kontrolü

1. **OSOS Raporu Oluştur**:
   - Firma: ABC Makina San. Tic. Ltd. Şti.
   - Rapor No: OSOS-2026-015
   - 5 ölçüm noktası ekle
   - 2 noktada sorun tespit et

2. **Görev Oluştur**:
   - "Görev Oluştur" butonuna tık
   - WorkTracker'a bağlan
   - Elektrik teknisyenine ata
   - Son tarih: 30 gün sonrası
   - Oluştur

3. **WorkTracker'da Takip**:
   - Görev "Beklemede" olarak oluşur
   - Teknisyen e-posta bildirimi alır
   - Dashboard'da görünür
   - İlerleme takip edilir

## 🔐 Güvenlik Notları

- Şifreler localStorage'da **saklanmaz**
- Token session bazlıdır (sayfa yenilenince silinir)
- API çağrıları Bearer token ile korunur
- HTTPS kullanımı önerilir (production'da)

## 🎨 Kullanıcı Arayüzü

### Header Butonları
```
┌─────────────┬─────────────┬──────────────┬─────────┬──────────┐
│ KOSBI Veri  │ Görev      │ Düzenleme    │ PDF     │ Yazdır   │
│ Çek         │ Oluştur    │ Modu         │ İndir   │          │
└─────────────┴─────────────┴──────────────┴─────────┴──────────┘
```

### WorkTracker Modal
```
┌────────────────────────────────────────┐
│ WorkTracker Görev Oluştur             │
├────────────────────────────────────────┤
│                                        │
│ [Bağlantı Formu]                      │
│   URL: http://localhost:3000          │
│   E-posta: [___________]              │
│   Şifre: [___________]                │
│   [🔐 Bağlan]                         │
│                                        │
│ --- VEYA ---                          │
│                                        │
│ [Görev Formu]                         │
│   Başlık: [________________________]  │
│   Açıklama: [____________________]    │
│   Öncelik: [Yüksek ▼]                │
│   Atanan: [Seçiniz ▼]                │
│   Son Tarih: [___________]           │
│   [✅ Görevi Oluştur]                 │
│                                        │
└────────────────────────────────────────┘
```

## 📚 Ek Kaynaklar

- [WorkTracker Dökümanları](./WorkTracker-main/README.md)
- [OSOS Entegrasyon](./Gunay/OSOS_ENTEGRASYON.md)
- [KOSBI Kurulum](./KOSBI-KURULUM.md)

## 🎉 Başarı Mesajları

Görev başarıyla oluşturulduğunda:

```
✅ Görev başarıyla oluşturuldu!

Görev: OSOS Raporu - ABC Makina (OSOS-2026-015)
Durum: PENDING
Öncelik: HIGH
```

---

**Not**: Bu entegrasyon local development için optimize edilmiştir. Production ortamında HTTPS, environment variables ve güvenlik önlemleri alınmalıdır.

## 🔄 Gelecek Geliştirmeler

- [ ] Token'ı güvenli şekilde saklama (encrypted storage)
- [ ] Toplu görev oluşturma (birden fazla rapor)
- [ ] Görev şablonları
- [ ] PDF eklentisi (raporu görev ekine ekleme)
- [ ] Otomatik bildirim ayarları
- [ ] Rapor - görev eşleştirme (bağlantılı kayıtlar)
- [ ] Analytics entegrasyonu (görev istatistikleri)

