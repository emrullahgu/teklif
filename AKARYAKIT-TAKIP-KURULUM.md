# 🚨 Akaryakıt Takip Sistemi - Kurulum

## ⚠️ HATA ÇÖZÜMÜ

Eğer şu hatayı alıyorsanız:
```
Could not find the table 'public.fuel_records' in the schema cache
```

**Veritabanı migration'ını henüz çalıştırmamışsınız demektir.**

## 📋 Kurulum Adımları

### 1. Supabase Dashboard'a Giriş Yapın
- [https://app.supabase.com](https://app.supabase.com) adresine gidin
- Projenizi seçin

### 2. SQL Editor'ü Açın
- Sol menüden **"SQL Editor"** seçeneğine tıklayın
- **"New query"** butonuna tıklayın

### 3. Migration Dosyasını Çalıştırın
- `akaryakıt-migration.sql` dosyasını açın
- Tüm içeriği kopyalayın (Ctrl+A, Ctrl+C)
- SQL Editor'e yapıştırın (Ctrl+V)
- **"Run"** veya **"Execute"** butonuna tıklayın

### 4. Başarı Kontrolü
Migration başarılı olduğunda, aşağıdaki tablolar oluşturulacaktır:
- ✅ `vehicles` (Araçlar)
- ✅ `drivers` (Sürücüler)
- ✅ `fuel_records` (Yakıt Kayıtları)

### 5. Tabloları Kontrol Edin
- Sol menüden **"Table Editor"** seçeneğine tıklayın
- Yukarıdaki 3 tablonun listelendiğinden emin olun

## 🎉 Sistem Özellikleri

### ✨ Aylık Görüntüleme
- **Varsayılan:** Sistem açıldığında **güncel ay** otomatik olarak gösterilir
- **Ay Seçici:** İstediğiniz ayı seçebilirsiniz
- **Bugün Butonu:** Tek tıkla güncel aya dönebilirsiniz

### 📊 Görüntüleme Modları
1. **Aylık Mod**
   - Seçilen ayın tüm kayıtları
   - Ay bazında istatistikler
   - Araç ve sürücü filtreleme

2. **Tüm Veriler Modu**
   - Başlangıç-bitiş tarihi ile özel aralık seçimi
   - Tüm kayıtların listelenmesi
   - Detaylı raporlama

### 📈 İstatistikler
- **Toplam Kayıt:** Seçilen dönemdeki toplam yakıt alım sayısı
- **Toplam Litre:** Alınan toplam yakıt miktarı
- **Toplam Tutar:** Toplam harcama
- **Ortalama Birim Fiyat:** Litre başına ortalama ücret

### 🔍 Filtreleme
- Araç bazlı
- Sürücü bazlı
- Tarih aralığı (Tüm Veriler modunda)
- Ay bazlı (Aylık modda)

### 📄 Raporlama
- **Excel Export:** Tüm veriler .xlsx formatında
- **PDF Export:** Profesyonel rapor çıktısı

## 🗃️ Veritabanı Yapısı

### Vehicles (Araçlar)
- `id` - UUID (Primary Key)
- `plate` - Plaka
- `brand` - Marka
- `model` - Model
- `year` - Yıl
- `color` - Renk
- `active` - Aktif/Pasif

### Drivers (Sürücüler)
- `id` - UUID (Primary Key)
- `full_name` - Ad Soyad
- `phone` - Telefon
- `tc_no` - TC Kimlik No
- `license_no` - Ehliyet No
- `active` - Aktif/Pasif

### Fuel Records (Yakıt Kayıtları)
- `id` - UUID (Primary Key)
- `date` - Tarih
- `vehicle_id` - Araç ID (Foreign Key)
- `driver_id` - Sürücü ID (Foreign Key)
- `liters` - Litre
- `price_per_liter` - Litre Fiyatı
- `total_amount` - Toplam Tutar (Otomatik hesaplanan)
- `km` - Araç KM
- `station` - İstasyon Adı
- `fuel_type` - Yakıt Tipi (Dizel, Benzin, LPG, Elektrik)
- `payment_method` - Ödeme Şekli (Nakit, Kredi Kartı, Fuel Kart, Havale)
- `description` - Açıklama

## 🔐 Güvenlik

Row Level Security (RLS) aktiftir:
- **SELECT:** Herkes görebilir
- **INSERT/UPDATE/DELETE:** Sadece authenticated kullanıcılar

## 💡 Kullanım İpuçları

1. **Hızlı Kayıt:** Araç ve sürücü ekledikten sonra, yakıt kaydı eklerken litre ve birim fiyat girdiğinizde toplam tutar otomatik hesaplanır

2. **Ay Geçişi:** Her ayın başında sistem otomatik olarak yeni aya geçer

3. **Veri Analizi:** İstatistik kartları seçilen filtrelere göre anlık güncellenir

4. **Toplu İşlemler:** Excel'e aktararak daha detaylı analizler yapabilirsiniz

## 🆘 Sorun Giderme

### "404 Not Found" Hatası
- Migration çalıştırılmamış demektir
- Yukarıdaki adımları takip edin

### "Unauthorized" Hatası
- Supabase authentication kontrolü yapın
- RLS politikalarını kontrol edin

### Veriler Gözükmüyor
- Doğru ayı seçtiğinizden emin olun
- Filtreleri temizleyin
- "Tüm Veriler" moduna geçin

## 📞 Destek

Herhangi bir sorun yaşarsanız, yukarıdaki adımları takip edin veya Supabase loglarını kontrol edin.
