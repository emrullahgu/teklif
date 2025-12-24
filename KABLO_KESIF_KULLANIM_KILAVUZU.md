# Kablo Keşif Metraj Modülü - Kullanım Kılavuzu

## 📋 Genel Bakış

Kablo Keşif Metraj modülü, **Serer Kablo** (İzmir) firmasının fiyat listesine dayalı olarak kablo malzemeleri için profesyonel keşif metraj ve fiyat teklifi oluşturmanızı sağlar.

## 🎯 Özellikler

### 1. Kapsamlı Kablo Veritabanı

Sistem 4 ana kablo kategorisini destekler:

#### **Tek Damarlı Kablolar (NYA/NYAF/H05V-U/H05V-K)**
- 0,5 mm² - 95 mm² arası kesitler
- Bina içi tesisatlarda kullanım
- Tek telli veya çok telli seçenekler

#### **Çok Damarlı Tesisat Kabloları (NYM/TTR/H05VV-F)**
- 2x0,75 mm² - 4x4 mm² arası kesitler
- Sıva altı/üstü kullanım
- Birden fazla damar içeren kablolar

#### **Alçak Gerilim Güç Kabloları (NYY/YVV/N2XH)**
- 3x16+10 mm² - 3x240+120 mm² arası kesitler
- Yer altı, şebeke ve dış aydınlatma
- Nötr kesiti düşürülmüş özel kesitler

#### **Alüminyum Hava Hattı Kabloları (ALPEK/AER)**
- 1x10+16 mm² - 3x95+95 mm² arası kesitler
- Direkler arası askı telli kablolar
- Hava hatları için optimize edilmiş

### 2. Fiyat Yönetimi

- **İki Fiyat Seçeneği**: Fiyat 1 ve Fiyat 2 (uygun olduğunda)
- **Otomatik Hesaplama**: Miktar x Birim Fiyat
- **İskonto Desteği**: % cinsinden esnek iskonto uygulama
- **KDV Hesaplama**: Varsayılan %20, değiştirilebilir

### 3. Müşteri Yönetimi

Detaylı müşteri bilgileri:
- Firma/Kurum Adı (zorunlu)
- Yetkili Adı Soyadı
- Adres
- Telefon
- Otomatik tarih

## 🚀 Kullanım Adımları

### Adım 1: Modüle Erişim
Ana sayfada **"Kablo Keşif Metraj"** sekmesine tıklayın (mor renk, Cable ikonu).

### Adım 2: Müşteri Bilgilerini Girin
```
✓ Firma Adı: ABC Elektrik Ltd. Şti.
✓ Yetkili: Mehmet Demir
✓ Adres: İzmir, Konak
✓ Telefon: 0532 123 45 67
```

### Adım 3: Kablo Ekleme

1. **Kategori Seçin**
   - Dropdown menüden kablo kategorisi seçin
   - Her kategori açıklaması ile birlikte gösterilir

2. **Kablo Tipi ve Kesit Seçin**
   - Seçilen kategoriye ait tüm kablo tipleri listelenir
   - Fiyatlar anlık olarak gösterilir

3. **Fiyat Türü Seçin**
   - Fiyat 1 (varsayılan)
   - Fiyat 2 (varsa)

4. **Miktar Girin**
   - Metre cinsinden
   - Ondalıklı değer desteklenir (örn: 150.5)

5. **Listeye Ekle**
   - Otomatik toplam hesaplama
   - Anında liste güncellemesi

### Adım 4: Eklenen Kabloları Yönetin

**Liste Özellikleri:**
- ✏️ Miktar düzenleme (tablo içinden)
- 🗑️ Kablo silme
- 📊 Otomatik ara toplam güncelleme

**Tablo Sütunları:**
- SIRA: Otomatik sıra numarası
- KABLO ADI: Tam kablo adı ve kodu
- KESİT: mm² cinsinden kesit
- KATEGORİ: Kablo kategorisi
- BİRİM FİYAT: Seçilen fiyat türü
- MİKTAR: Düzenlenebilir
- BİRİM: Metre
- TOPLAM: Otomatik hesaplanan

### Adım 5: İskonto ve KDV Ayarları

**İskonto Oranı:**
- 0-100 arası % değer
- Varsayılan: %0
- Ara toplam üzerinden hesaplanır

**KDV Oranı:**
- 0-100 arası % değer
- Varsayılan: %20
- İskonto sonrası tutara uygulanır

### Adım 6: Teklif Özeti

Sistem otomatik olarak gösterir:
```
Ara Toplam:        XX.XXX,XX TL
İskonto (% X):     - X.XXX,XX TL
İskonto Sonrası:   XX.XXX,XX TL
KDV (% 20):        + X.XXX,XX TL
─────────────────────────────────
GENEL TOPLAM:      XX.XXX,XX TL
```

### Adım 7: Teklif Oluşturma

**"Teklif Önizlemesine Git"** butonuna tıklayın.

## 📄 Teklif Çıktısı

### PDF/Yazdırma Özellikleri

**Sayfa Başlığı:**
- Firma logosu
- "KABLO KEŞİF METRAJ FİYAT TEKLİFİ" başlığı
- Referans numarası (otomatik)
- Tarih

**Tedarikçi Bilgileri:**
- Firma: Serer Kablo
- Adres: 1203/4 Sok. No:11/E Yenişehir / İZMİR
- Telefon: 0.232 469 80 17
- Web: www.serer.com.tr
- ⚠️ KDV dahil değildir uyarısı

**Müşteri Bilgileri:**
- Girdiğiniz tüm bilgiler
- Profesyonel düzen

**Malzeme Tablosu:**
- Mor renkli başlık
- Tüm kablo detayları
- Sayfa sonu otomatik yönetimi
- Sayfa numaraları

**Finansal Özet:**
- Detaylı hesap dökümü
- Renkli vurgulama
- Net toplam tutarlar

**Genel Şartlar:**
- Teklif geçerlilik süresi: 15 gün
- KDV bilgisi
- Teslimat koşulları
- Ödeme şartları
- Revizyon hakları
- Kalite garantisi

## 📊 Dışa Aktarma Seçenekleri

Teklif önizleme sayfasında:

1. **📄 PDF İndir**
   - Yüksek kaliteli PDF
   - Çoklu sayfa desteği
   - Profesyonel düzen

2. **🖨️ Yazdır**
   - Doğrudan yazdırma
   - Sayfa düzeni optimize

3. **📊 Excel İndir**
   - Düzenlenebilir format
   - Tüm veriler tabloda

4. **📝 Word İndir**
   - .docx formatı
   - Tam düzenleme özgürlüğü

## 💡 Pratik İpuçları

### 1. Hızlı Kablo Arama
- Önce kategoriyi daraltın
- Kesit bilgisine göre seçim yapın
- Fiyat karşılaştırması yapın

### 2. Toplu İşlemler
- Aynı kategoriden birden fazla kablo ekleyin
- Sonradan miktar düzenleyin
- Gereksiz kalemleri hemen silin

### 3. Fiyat Optimizasyonu
- Her iki fiyat seçeneğini kontrol edin
- İskonto stratejinizi belirleyin
- Müşteriye özel indirim uygulayın

### 4. Teklif Hazırlama
- Önce tüm kabloları ekleyin
- İskonto ve KDV'yi son adımda ayarlayın
- Önizleme yapıp kontrol edin
- PDF olarak kaydedin

## 🔧 Teknik Detaylar

### Veri Yapısı
```json
{
  "kategori": {
    "id": "tek-damarli",
    "ad": "Tek Damarlı Kablolar",
    "aciklama": "...",
    "urunler": [
      {
        "kod": "NYA-2.5",
        "ad": "NYA 2,5 mm²",
        "kesit": "2,5",
        "fiyat1": 28.00,
        "fiyat2": 29.10,
        "birim": "Metre"
      }
    ]
  }
}
```

### Hesaplama Formülleri

**Kalem Toplamı:**
```
Toplam = Birim Fiyat × Miktar
```

**Ara Toplam:**
```
Ara Toplam = Σ(Tüm Kalemler)
```

**İskonto:**
```
İskonto Tutarı = Ara Toplam × (İskonto % / 100)
İskonto Sonrası = Ara Toplam - İskonto Tutarı
```

**KDV ve Genel Toplam:**
```
KDV Tutarı = İskonto Sonrası × (KDV % / 100)
Genel Toplam = İskonto Sonrası + KDV Tutarı
```

## ⚠️ Önemli Notlar

1. **Fiyat Güncelliği**
   - Fiyatlar Serer Kablo'nun güncel listesine göre
   - Değişiklik hakkı saklıdır
   - Sipariş öncesi teyit önerilir

2. **KDV Durumu**
   - Liste fiyatlarına KDV dahil DEĞİLDİR
   - Teklifte KDV ayrıca hesaplanır
   - KDV oranı değiştirilebilir

3. **Minimum Sipariş**
   - Tedarikçiye özel koşullar geçerli olabilir
   - Büyük miktarlarda ek indirim imkanı
   - Teslimat süreleri değişkenlik gösterebilir

## 🆘 Sık Sorulan Sorular

**S: Fiyat 2 ne zaman görünür?**
C: Sadece tedarikçi tarafından alternatif fiyat sağlandığında. Yoksa Fiyat 1 kullanılır.

**S: Listede olmayan bir kablo ekleyebilir miyim?**
C: Hayır, sadece Serer Kablo listesindeki kablolar desteklenmektedir.

**S: İskonto sonradan değiştirilebilir mi?**
C: Evet, teklif önizlemesi öncesinde istediğiniz zaman değiştirebilirsiniz.

**S: Birden fazla tedarikçi eklenebilir mi?**
C: Şu an sadece Serer Kablo desteklenmektedir. Gelecek güncellemelerde eklenebilir.

**S: Toplu miktar güncellemesi yapılabilir mi?**
C: Evet, tablo içinden her kalemin miktarını ayrı ayrı düzenleyebilirsiniz.

## 📞 Destek

Sorularınız için:
- **Uygulama Desteği**: Kobinerji Mühendislik
- **Fiyat Bilgisi**: Serer Kablo (0.232 469 80 17)
- **Web**: www.serer.com.tr

---

**Son Güncelleme:** 23 Aralık 2025
**Versiyon:** 2026.0.0
**Geliştirici:** Kobinerji Mühendislik
