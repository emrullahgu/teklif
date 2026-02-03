# Ürün Takip Sistemi Kurulum Kılavuzu

## Genel Bakış

Ürün Takip Sistemi, envanter yönetimi ve ürün takibi için geliştirilmiş bir modüldür. Bu sistem sayesinde:

- **Ürün bilgilerini kaydedin**: Ürün adı, kategori, marka, model
- **Stok takibi yapın**: Hangi üründen kaç adet var?
- **Lokasyon yönetimi**: Ürünler nerede? (Depo-A, Raf-3 vb.)
- **Seri no takibi**: Her ürünün seri numarası
- **Filtreleme ve arama**: Hızlı arama ve çoklu filtreler
- **İstatistikler**: Kategori bazında özet raporlar

## Veritabanı Kurulumu

### 1. Supabase'e Giriş Yapın

1. [Supabase Dashboard](https://app.supabase.com) adresine gidin
2. Projenizi seçin
3. Sol menüden **SQL Editor** seçeneğine tıklayın

### 2. Migration SQL'i Çalıştırın

1. SQL Editor'de **New Query** butonuna tıklayın
2. `urun-takip-migration.sql` dosyasının içeriğini kopyalayın ve editöre yapıştırın
3. **Run** butonuna tıklayarak SQL'i çalıştırın

Migration dosyası şunları oluşturacaktır:

- `urun_takip` tablosu
- Gerekli index'ler (hızlı arama için)
- Otomatik tarih güncelleme trigger'ı
- Row Level Security (RLS) politikaları

### 3. Tablo Yapısı

```sql
CREATE TABLE urun_takip (
    id UUID PRIMARY KEY,
    urun_adi TEXT NOT NULL,           -- Ürün adı
    kategori TEXT NOT NULL,            -- Kategori (Solar Panel, İnvertör, vb.)
    marka TEXT,                        -- Marka
    model TEXT,                        -- Model
    miktar NUMERIC DEFAULT 0,          -- Stok miktarı
    birim TEXT DEFAULT 'Adet',         -- Birim (Adet, Kg, Metre, vb.)
    lokasyon TEXT,                     -- Fiziksel konum (Depo-A, Raf-3)
    aciklama TEXT,                     -- Açıklama/notlar
    seri_no TEXT,                      -- Seri numarası
    tarih DATE DEFAULT CURRENT_DATE,   -- Kayıt tarihi
    created_at TIMESTAMP,              -- Oluşturulma zamanı
    updated_at TIMESTAMP,              -- Güncellenme zamanı
    user_id UUID                       -- Kullanıcı ID (RLS için)
);
```

## Özellikler

### 1. Ürün Ekleme ve Düzenleme

- **Yeni Ürün Ekle** butonu ile modal açılır
- Zorunlu alanlar: Ürün Adı ve Kategori
- İsteğe bağlı: Marka, Model, Seri No, Lokasyon, Açıklama
- Miktar ve birim seçimi
- Tarih otomatik atanır (değiştirilebilir)

### 2. Arama ve Filtreleme

**Arama Alanı:**
- Ürün adı, marka, model veya seri no ile arama
- Gerçek zamanlı sonuçlar

**Filtreler:**
- Kategori filtresi
- Marka filtresi
- Lokasyon filtresi
- Çoklu filtre kombinasyonu

### 3. İstatistikler

Dashboard'da 4 ana istatistik kartı:

1. **Toplam Ürün**: Sistemdeki ürün çeşit sayısı
2. **Toplam Miktar**: Tüm ürünlerin toplam miktarı
3. **Kategori**: Kaç farklı kategori var
4. **Lokasyon**: Kaç farklı lokasyon tanımlı

**Kategori Özeti:**
- Her kategori için ürün sayısı ve toplam miktar
- Görsel kartlar şeklinde gösterim

### 4. Ürün Listesi

Tablo formatında liste:
- Ürün Adı
- Kategori (renkli badge)
- Marka
- Model
- Miktar + Birim
- Lokasyon (ikon ile)
- Seri No
- İşlemler (Düzenle, Sil)

### 5. PDF Export

**PDF İndir** butonu ile raporları dışa aktarın:

- Profesyonel PDF rapor formatı
- Genel istatistikler (toplam ürün, miktar, kategori, lokasyon)
- Kategori özeti tablosu
- Detaylı ürün listesi (tüm kolonlar)
- Aktif filtreler raporda belirtilir
- Landscape (yatay) sayfa formatı
- Sayfa numaraları
- Tarihli dosya adı: `Urun_Takip_Raporu_[TARIH].pdf`

**PDF İçeriği:**
1. **Başlık**: Ürün Takip Sistemi - Envanter Raporu
2. **Tarih**: Rapor oluşturulma tarihi
3. **Genel İstatistikler**: Özet bilgiler
4. **Kategori Özeti**: Kategori bazında dökümler
5. **Aktif Filtreler**: Hangi filtreler uygulandı
6. **Ürün Listesi**: Tüm ürün detayları tablolu format

### 6. Güvenlik (RLS)

Row Level Security sayesinde:
- Her kullanıcı sadece kendi kayıtlarını görür
- Kullanıcılar sadece kendi kayıtlarını düzenleyebilir/silebilir
- Veri gizliliği korunur

## Kullanım Örnekleri

### Örnek 1: Solar Panel Eklemek

```
Ürün Adı: Panel 600W
Kategori: Solar Panel
Marka: JinkoSolar
Model: Tiger Pro 600W
Miktar: 50
Birim: Adet
Lokasyon: Depo-A, Raf-3
Seri No: JS-600-2024
Açıklama: Yüksek verimli monokristal panel
```

### Örnek 2: Kablo Eklemek

```
Ürün Adı: NYY Kablo 4x16
Kategori: Kablo
Marka: Türk Prysmian
Model: 4x16 NYY
Miktar: 500
Birim: Metre
Lokasyon: Depo-C, Rulo-12
Seri No: NYY-4X16-2024
Açıklama: Topraklı enerji kablosu
```

### Örnek 3: İnvertör Eklemek

```
Ürün Adı: Güç İnvertörü
Kategori: İnvertör
Marka: Huawei
Model: SUN2000-10KTL
Miktar: 5
Birim: Adet
Lokasyon: Depo-B, Raf-1
Seri No: HW-INV-001
Açıklama: Hibrit tip, 10kW
```

## Birimler

Sistem aşağıdaki birimleri destekler:

- **Adet**: Parça halindeki ürünler
- **Kg**: Ağırlık bazlı ürünler
- **Metre**: Uzunluk bazlı ürünler (kablo, boru vb.)
- **Litre**: Hacim bazlı ürünler (sıvılar)
- **Paket**: Paketlenmiş ürünler
- **Kutu**: Kutulu ürünler
- **Rulo**: Rulo halindeki ürünler

## İpuçları

1. **Kategori İsimlendirme**: Tutarlı kategori isimleri kullanın
   - ✅ "Solar Panel"
   - ❌ "solar panel", "Solar Paneller", "Panel"

2. **Lokasyon Sistemi**: Mantıklı bir kodlama sistemi kullanın
   - Format: `Depo-A, Raf-3, Bölme-2`
   - Hiyerarşik yapı: Alan > Raf > Bölme

3. **Seri No Takibi**: 
   - Üretici seri numaralarını kaydedin
   - Kendi lot numaralarınızı oluşturun
   - Format: `MARKA-MODEL-YIL`

4. **Açıklama Alanı**: 
   - Teknik özellikler
   - Garanti bilgileri
   - Önemli notlar

5. **PDF Raporları**:
   - Filtreli veya tüm ürünleri PDF olarak indirin
   - Profesyonel rapor formatı
   - İstatistikler ve kategori özetleri dahil
   - Aktif filtreler raporda görünür

## Sorun Giderme

### Ürünler Görünmüyor

1. Supabase bağlantısını kontrol edin
2. RLS politikalarının doğru çalıştığını kontrol edin
3. Browser Console'da hata var mı bakın

### Ekleme/Güncelleme Hatası

1. Zorunlu alanları doldurduğunuzdan emin olun
2. Kullanıcı oturumunun açık olduğunu kontrol edin
3. Supabase kotalarını kontrol edin

### Arama Çalışmıyor

1. Index'lerin doğru oluştuğunu kontrol edin
2. Cache'i temizleyin ve sayfayı yenileyin

### PDF İndirme Çalışmıyor

1. Pop-up engelleyicilerini kontrol edin
2. jsPDF kütüphanesinin yüklendiğinden emin olun
3. Browser Console'da hata mesajları var mı bakın

## Gelecek Geliştirmeler

- [x] ✅ PDF export (tamamlandı)
- [ ] QR kod ile ürün takibi
- [ ] Stok azaldığında otomatik uyarı
- [ ] Toplu ürün ekleme (Excel import)
- [ ] Excel export
- [ ] Ürün geçmişi ve hareket logları
- [ ] Barkod okuyucu entegrasyonu
- [ ] Fotoğraf ekleme özelliği
- [ ] Stok transfer işlemleri
- [ ] Raporlama ve Excel export

## Destek

Sorularınız için:
- Email: emrullah.gunay@kobinerji.com
- GitHub Issues
