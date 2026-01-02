# KOBİNERJİ - BORDRO TAKİP SİSTEMİ

## 📋 Kurulum Adımları

### 1. Veritabanı Kurulumu (Supabase)

1. **Supabase Dashboard'a gidin**: https://supabase.com
2. **SQL Editor'ı açın** (yan menüden SQL)
3. `database-setup.sql` dosyasındaki tüm SQL kodlarını kopyalayıp çalıştırın
4. Tablolar otomatik olarak oluşturulacak:
   - `employees` (Personel Bilgileri)
   - `daily_logs` (Günlük Puantaj Kayıtları)
   - `expenses` (Avans/Gider/Prim Kayıtları)

### 2. Proje Başlatma

```bash
# Gerekli paketler zaten yüklü olmalı, emin olmak için:
npm install

# Bordro sistemini başlatmak için:
npm run dev
```

### 3. Bordro Sistemine Erişim

Tarayıcıda şu adresi açın:
```
http://localhost:3000/bordro.html
```

---

## 🎯 Kullanım Kılavuzu

### A) İLK KULLANIM - Personel Ekleme

1. **"Yeni Personel" butonuna tıklayın**
2. Formda şu bilgileri girin:
   - **Ad Soyad**: Personelin tam adı
   - **Anlaşılan Net Maaş**: Personel ile anlaşılan gerçek maaş (örn: 45.000 TL)
   - **Resmi Net Maaş (SGK)**: Bordrodaki resmi maaş (örn: 17.002 TL)
3. **"KAYDET"** butonuna basın

> **Not**: Veriler gerçek zamanlı olarak Supabase veritabanına kaydedilir!

---

### B) PERSONEL DETAY GÖRÜNÜMÜ

#### 1. Puantaj Girişi (Günlük Çalışma Saatleri)

**Manuel Giriş:**
- Her gün için **"Durum"** sütununu seçin:
  - `Normal`: Standart iş günü
  - `Pazar (x2)`: Pazar günü çalışması (2x ücret)
  - `Resmi Tatil (x2)`: Tatil günü çalışması (2x ücret)
  - `İzinli`: Ücretli izin
  - `Raporlu`: Rapor (hastalık izni)

- **Giriş/Çıkış Saatlerini** ayarlayın
- **Mesai Saati** otomatik hesaplanır:
  - Hafta içi: 18:00'den sonra mesai
  - Cumartesi: 13:00'den sonra mesai
  - *Manuel değiştirilebilir*

**Otomatik Doldurma:**
- **"OTOMATİK DOLDUR"** butonuna basın
- Tüm boş günler standart mesai saatleriyle doldurulur
  - Hafta içi: 08:00 - 18:00
  - Cumartesi: 08:00 - 13:00

> **Önemli**: Her değişiklik otomatik olarak veritabanına kaydedilir!

#### 2. Avans ve Gider İşlemleri

**Avans Ekleme:**
1. **"AVANS"** butonuna tıklayın
2. Tutarı girin (örn: 5000)
3. Avans maaştan otomatik düşülür

**Gider/Prim Ekleme:**
1. **"GİDER/PRİM"** butonuna tıklayın
2. Tutarı girin (örn: 2000)
3. Tutar maaşa eklenir

**Kayıt Silme:**
- Her kayıt yanındaki 🗑️ (çöp kutusu) simgesine tıklayın

---

### C) GENEL BAKIŞ (ÖZET TABLO)

**Tüm personellerin özet bilgilerini gösterir:**

| Sütun | Açıklama |
|-------|----------|
| **ANLAŞILAN NET** | Personel ile anlaşılan gerçek maaş |
| **GÜN** | Toplam çalışılan gün sayısı |
| **MESAİ (S)** | Toplam mesai saati |
| **HAKEDİŞ TOP.** | Brüt toplam (maaş + mesai + pazar farkı + prim) |
| **AVANS** | Verilen toplam avans |
| **NET ELE GEÇEN** | Hakediş - Avans |
| **RESMİ MAAŞ** | SGK üzerinden ödenen |
| **ÖDENECEK** | Net Ele Geçen - Resmi Maaş = **Nakit ödenecek tutar** |

**İŞLEMLER:**
- 📝 **Düzenle**: Personel bilgilerini güncelle
- ➡️ **Puantaj Girişi**: Detay ekranına git

---

## 💡 HESAPLAMA YAPISI

### Maaş Hesaplama Formülü

```
1. Günlük Ücret = Anlaşılan Net Maaş / 30
2. Saatlik Mesai Ücreti = (Anlaşılan Net Maaş / 225) × 1.5

Brüt Hakediş = 
  + (Çalışılan Gün × Günlük Ücret)
  + (Pazar/Tatil Günleri × Günlük Ücret)  [Ekstra ödeme]
  + (Mesai Saati × Saatlik Mesai Ücreti)
  + Prim/Gider Tutarları

Net Ele Geçen = Brüt Hakediş - Avanslar

ÖDENECEK = Net Ele Geçen - Resmi Maaş
```

**Örnek:**
- Anlaşılan Maaş: 45.000 TL
- Resmi Maaş: 17.002 TL
- Çalışılan Gün: 22
- Mesai: 10 saat
- Avans: 5.000 TL

```
Günlük: 1.500 TL
Çalışma: 22 × 1.500 = 33.000 TL
Mesai: 10 × 300 = 3.000 TL
Brüt: 36.000 TL
Net: 36.000 - 5.000 = 31.000 TL
ÖDENECEK: 31.000 - 17.002 = 13.998 TL
```

---

## 🔥 ÖNEMLİ NOTLAR

### ✅ VERİ GÜVENLİĞİ
- Tüm veriler **Supabase PostgreSQL** veritabanında güvenle saklanır
- LocalStorage kullanılmaz - gerçek veritabanı kaydı
- Row Level Security (RLS) aktif - kullanıcılar sadece kendi verilerini görür

### 🔄 OTOMATİK KAYIT
- Her puantaj girişi anlık kaydedilir
- Her gider/avans işlemi hemen veritabanına yazılır
- Personel bilgileri güncelleme sonrası otomatik senkronize olur

### 📊 EXCEL EXPORT
- Genel Bakış ekranındaki **"EXCEL"** butonu (yakında aktif)
- Aylık bordro raporlarını Excel dosyası olarak indirin

### 🛡️ YETKİLENDİRME
- Supabase Auth entegrasyonu eklenebilir
- Şu anda tüm kullanıcılar tüm verileri görebilir
- RLS politikaları kullanıcı bazlı erişim için hazır

---

## 📱 EKRAN GÖRÜNÜMLERİ

### 1. GENEL BAKIŞ
- Tüm personellerin özet listesi
- Aylık maaş hesaplamaları
- Hızlı personel ekleme
- Excel export

### 2. PERSONEL DETAY
- **Sol Panel:**
  - Personel seçimi
  - Hakediş özeti
  - Avans/Gider işlemleri
  
- **Sağ Panel:**
  - 30 günlük puantaj tablosu
  - Giriş/Çıkış saatleri
  - Otomatik mesai hesaplama
  - Açıklama notları

---

## 🔧 TEKNİK DETAYLAR

### Teknoloji Stack
- **Frontend**: React 18 + TypeScript
- **UI**: Tailwind CSS + Lucide Icons
- **Database**: Supabase (PostgreSQL)
- **Build**: Vite

### Veritabanı Tabloları
```sql
employees (id, name, agreed_salary, official_salary, active)
daily_logs (id, employee_id, day, month, year, type, start_time, end_time, overtime_hours, description)
expenses (id, employee_id, month, year, type, amount, description, date)
```

### API İşlemleri
- `loadEmployees()`: Personel listesini çek
- `loadMonthlyData()`: Ay bazlı puantaj/gider verilerini çek
- `saveEmployee()`: Personel ekle/güncelle
- `saveDailyLog()`: Günlük puantaj kaydet
- `saveExpense()`: Gider/Avans kaydet
- `deleteExpenseFromDB()`: Gider/Avans sil

---

## 🚀 DEPLOYMENT

### Netlify ile Yayınlama

1. **Build ayarları** (`netlify.toml` otomatik hazır):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Push to GitHub** ve Netlify'da projeyi bağla
3. **Environment Variables** ekle (gerekirse):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## 📞 DESTEK

Herhangi bir sorun için:
- Supabase Dashboard'dan log kontrolü
- Browser Console'da hata mesajlarını kontrol edin
- Network sekmesinden API isteklerini izleyin

---

**🎉 SİSTEM HAZIR! Bordro Takibine Başlayabilirsiniz!**
