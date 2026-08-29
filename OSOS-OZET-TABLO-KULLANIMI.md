# 📋 OSOS Özet Tablosu - Manuel Giriş Kılavuzu

## 🎯 Özellik Açıklaması

OSOS (Organize Sanayi Ölçüm Sistemi) raporlarından gelen özet tablosunu manuel olarak sisteme aktarabilirsiniz. Bu tablo, endeks kodları, tüketim değerleri ve yasal sınır durumlarını içerir.

---

## 📊 Tablo İçeriği

### Kolonlar:
1. **Endeks Kodu**: OBIS kodu (örn: 1.8.0, 5.8.0, 8.8.0)
2. **Açıklama**: Enerji türü açıklaması
3. **İlk Endeks**: Dönem başı sayaç değeri
4. **Son Endeks**: Dönem sonu sayaç değeri
5. **Endeks Farkı**: Son - İlk endeks
6. **Çarpan**: Transformatör çarpan katsayısı (genellikle 1380)
7. **Tüketim (kWh/kVArh)**: Hesaplanmış tüketim
8. **Yasal Sınır**: Reaktif enerji sınırları (%20, %15)
9. **Durum**: Reaktif enerji oranı (%)

---

## 🔢 Endeks Kodları ve Anlamları

### Aktif Enerji (kWh)
| Kod | Açıklama | Açıklama |
|-----|----------|----------|
| **1.8.0** | **Aktif enerji** | **Toplam aktif tüketim** |
| 1.8.1 | Gündüz | 06:00 - 17:00 arası tüketim |
| 1.8.2 | Puant | 17:00 - 22:00 arası tüketim |
| 1.8.3 | Gece | 22:00 - 06:00 arası tüketim |
| 2.8.0 | Aktif enerji ters yönde | Üretim/veriş |

### Reaktif Enerji (kVArh)
| Kod | Açıklama | Yasal Sınır | Açıklama |
|-----|----------|-------------|----------|
| **5.8.0** | **Endüktif Reaktif** | **%20** | **Motor/trafo yükleri** |
| **8.8.0** | **Kapasitif Reaktif** | **%15** | **Aşırı kompanzasyon** |
| 6.8.0 | Veriş-Kapasitif Reaktif | - | Veriş reaktif |
| 7.8.0 | Veriş-Endüktif Reaktif | - | Veriş reaktif |

### Diğer
| Kod | Açıklama |
|-----|----------|
| 1.6.0 | Demant/Güç | Maksimum güç talebi |
| 2.6.0 | Veriş-Demand | Veriş güç |

---

## 🚀 Kullanım Adımları

### 1. OSOS Raporundan Kopyalama

OSOS web arayüzünden veya Excel raporundan özet tablosunu kopyalayın:

```
Endeks Kodu	Açıklama	İlk endeks	Son endeks	Endeks Farkı	Çarpan	Tüketim (kWh)	Yasal Sınır	Durum
1.8.0	Aktif enerji	3.296,18	3.346,94	50,7570	1380,0000	70.044,66	 	 
1.8.1	Gündüz	2.346,98	2.383,77	36,7930	1380,0000	50.774,34	SQL	 
1.8.2	Puant	506,20	513,84	07,6400	1380,0000	10.543,20	SQL	 
1.8.3	Gece	443,00	449,32	06,3240	1380,0000	8.727,12	SQL	 
5.8.0	Endüktif Reaktif	217,07	220,06	02,9960	1380,0000	4.134,48	%20	% 5,90
8.8.0	Kapasitif Reaktif	103,43	104,37	00,9410	1380,0000	1.298,58	%15	% 1,85
```

### 2. Sisteme Aktarma

1. Haftalık raporlama formunda **"OSOS Özet Tablosu (Manuel Yapıştır)"** butonuna tıklayın
2. Açılan metin kutusuna kopyaladığınız tabloyu **CTRL+V** ile yapıştırın
3. **"Parse Et ve Yükle"** butonuna tıklayın
4. Sistem otomatik olarak veriyi parse eder

### 3. Doğrulama

Yükleme sonrası gösterilir:
- ✅ Kaç satır veri yüklendiği
- ✅ Aktif enerji toplamı (1.8.0)
- ✅ Endüktif reaktif (5.8.0)
- ✅ Kapasitif reaktif (8.8.0)

### 4. Form Entegrasyonu

- Aktif enerji (1.8.0) otomatik olarak **"Enerji Tüketimi"** alanına aktarılır
- Diğer alanları manuel doldurun

---

## 📋 Format Gereksinimleri

### Desteklenen Formatlar:

#### Format 1: Tab ile ayrılmış
```
1.8.0	Aktif enerji	3.296,18	3.346,94	50,7570	1380,0000	70.044,66	 	 
```

#### Format 2: Çoklu boşlukla ayrılmış
```
1.8.0  Aktif enerji  3.296,18  3.346,94  50,7570  1380,0000  70.044,66    
```

### Sayı Formatı:
- **Türkçe format desteklenir**: 3.296,18 (binlik nokta, ondalık virgül)
- Sistem otomatik olarak parse eder: 3296.18

### Minimum Gereksinimler:
- En az **7 kolon** olmalı
- **Endeks Kodu** zorunlu (örn: 1.8.0)
- **Tüketim değeri** zorunlu

---

## 📈 Raporlarda Görünüm

### 1. Rapor Kartlarında
Rapor kartında badge gösterilir:
```
📋 OSOS Özet Tablo Mevcut
```

### 2. Grafik Modalında
Detaylı tablo formatında:
- Tüm endeks kodları
- Tüketim değerleri
- Yasal sınır durumları
- Renk kodlu durum gösterimi (yeşil/kırmızı)

### 3. PDF Raporunda
Profesyonel tablo formatında:
- A4 sayfa düzeni
- Endeks bazlı detaylar
- Ana satırlar vurgulanmış (1.8.0, 5.8.0, 8.8.0)
- Açıklama notu

---

## 💡 Kullanım Senaryoları

### Senaryo 1: Temel Kullanım
```
1. OSOS'tan özet tablosunu kopyala
2. Sisteme yapıştır ve parse et
3. Aktif enerji otomatik dolsun
4. Diğer alanları manuel doldur
5. Kaydet
6. PDF'i indir - özet tablo dahil
```

### Senaryo 2: Reaktif Enerji Analizi
```
1. OSOS tablosunu yükle
2. Grafik butonuna tıkla
3. OSOS özet tablosunu incele
4. Endüktif reaktif oranını kontrol et (5.8.0)
5. Kapasitif reaktif oranını kontrol et (8.8.0)
6. Yasal sınırları karşılaştır
7. Gerekirse kompanzasyon ayarı yap
```

### Senaryo 3: Dönemsel Karşılaştırma
```
1. Her hafta OSOS tablosunu yükle
2. Filtreleme ile belirli dönemi seç
3. Endüktif/kapasitif trendini incele
4. Gündüz/Puant/Gece dağılımını analiz et
5. Optimizasyon önerileri hazırla
```

---

## 🎨 Görsel Özellikler

### Renk Kodlama
- 🟡 **Sarı**: Ana satırlar (1.8.0, 5.8.0, 8.8.0)
- 🟢 **Yeşil**: Durum iyi (< yasal sınır)
- 🔴 **Kırmızı**: Durum kötü (> yasal sınır)
- ⚪ **Beyaz/Gri**: Alt detay satırları

### Font ve Stil
- **Bold**: Ana enerji türleri
- Normal: Zaman dilimi detayları
- Sağa hizalı: Sayısal değerler
- Merkez: Durum kolonları

---

## ⚠️ Önemli Notlar

### Yasal Sınırlar
1. **Endüktif Reaktif (5.8.0)**
   - Yasal sınır: %20
   - Hesaplama: (Endüktif / Aktif) × 100
   - %20'nin üstü: Ceza
   - Çözüm: Kompanzasyon ekle

2. **Kapasitif Reaktif (8.8.0)**
   - Yasal sınır: %15
   - Hesaplama: (Kapasitif / Aktif) × 100
   - %15'in üstü: Ceza
   - Çözüm: Kompanzasyonu azalt

### Veri Doğruluğu
- ✅ Her zaman güncel OSOS raporunu kullanın
- ✅ Tarih aralıklarının uyumlu olduğundan emin olun
- ✅ Çarpan değerini kontrol edin (genelde 1380)
- ✅ Toplam tüketim = Gündüz + Puant + Gece

### Sık Karşılaşılan Hatalar
❌ **Hata**: "Tablo parse edilemedi"
✅ **Çözüm**: Tab veya çoklu boşluk kullanın, tek boşluk yeterli değil

❌ **Hata**: Sayılar yanlış parse ediliyor
✅ **Çözüm**: Türkçe format kullanın (3.296,18)

❌ **Hata**: Bazı satırlar eksik
✅ **Çözüm**: Her satırda en az 7 kolon olmalı

---

## 📊 Veri Analizi İpuçları

### 1. Güç Faktörü Hesaplama
```
cosφ = Aktif / √(Aktif² + Reaktif²)

Örnek:
Aktif = 70.044,66 kWh
Endüktif = 4.134,48 kVArh
cosφ = 70044.66 / √(70044.66² + 4134.48²)
cosφ ≈ 0.998 (Çok iyi!)
```

### 2. Reaktif Güç Oranı
```
Endüktif Oran = (Endüktif / Aktif) × 100
Kapasitif Oran = (Kapasitif / Aktif) × 100

Örnek:
Endüktif = 4.134,48 / 70.044,66 × 100 = %5,90 (✅ < %20)
Kapasitif = 1.298,58 / 70.044,66 × 100 = %1,85 (✅ < %15)
```

### 3. Tüketim Profili
```
Gündüz %: (Gündüz / Toplam) × 100
Puant %: (Puant / Toplam) × 100
Gece %: (Gece / Toplam) × 100

Örnek:
Gündüz: 50.774,34 / 70.044,66 × 100 = %72,5
Puant: 10.543,20 / 70.044,66 × 100 = %15,0
Gece: 8.727,12 / 70.044,66 × 100 = %12,5
```

---

## 🗄️ Veritabanı Yapısı

```json
{
  "osos_ozet_tablo": [
    {
      "endeks_kodu": "1.8.0",
      "aciklama": "Aktif enerji",
      "ilk_endeks": 3296.18,
      "son_endeks": 3346.94,
      "endeks_farki": 50.757,
      "carpan": 1380,
      "tuketim": 70044.66,
      "yasal_sinir": "",
      "durum": ""
    },
    ...
  ]
}
```

### SQL Sorguları

**Endüktif reaktif oranı yüksek fabrikaları bul:**
```sql
SELECT fabrika_adi, hafta_baslangic,
       (SELECT (elem->>'durum')::text 
        FROM jsonb_array_elements(osos_ozet_tablo) elem 
        WHERE elem->>'endeks_kodu' = '5.8.0') as enduktif_oran
FROM haftalik_raporlar
WHERE osos_ozet_tablo IS NOT NULL
  AND (SELECT (elem->>'durum')::text 
       FROM jsonb_array_elements(osos_ozet_tablo) elem 
       WHERE elem->>'endeks_kodu' = '5.8.0') LIKE '% %'
  AND CAST(REPLACE(REPLACE((SELECT (elem->>'durum')::text 
       FROM jsonb_array_elements(osos_ozet_tablo) elem 
       WHERE elem->>'endeks_kodu' = '5.8.0'), '%', ''), ' ', '') AS NUMERIC) > 15;
```

---

## 🔄 Güncelleme ve Düzenleme

Kayıtlı raporlarda OSOS tablosunu değiştirmek için:
1. Raporu düzenle
2. "OSOS Özet Tablosu" bölümünü bul
3. "Düzenle" butonuna tıkla
4. Yeni tabloyu yapıştır
5. Parse et ve kaydet

---

## 📞 Destek

- 📧 Email: info@kobinerji.com
- 📱 Tel: +90 535 714 52 88
- 🌐 Web: www.kobinerji.com

---

## 📚 İlgili Dokümanlar

- [HAFTALIK-RAPORLAMA-EXCEL-IMPORT.md](HAFTALIK-RAPORLAMA-EXCEL-IMPORT.md)
- [EXCEL-ENERJI-TURU-KULLANIMI.md](EXCEL-ENERJI-TURU-KULLANIMI.md)
- OBIS Kod Standardı Dokümantasyonu

---

**Kobinerji Mühendislik** © 2026 - OSOS Entegrasyonu Uzmanı

*OSOS özet tablosu ile raporlarınız daha detaylı ve profesyonel!* 📋✨
