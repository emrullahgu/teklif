# 📊 Haftalık Raporlama - Excel Import ve Görselleştirme Özelliği

## 🚀 Yeni Özellikler

### 1. **Excel Dosya İmportı**
- OSOS raporlarından gelen `grdResult.xls` formatındaki Excel dosyalarını otomatik olarak okur
- Saatlik enerji tüketim verilerini parse eder
- Tarih, saat, endeks değerleri ve tüketim bilgilerini yapılandırır

### 2. **Otomatik Veri Aktarımı**
- Excel'den okunan veriler otomatik olarak forma aktarılır:
  - Hafta başlangıç/bitiş tarihleri
  - Toplam enerji tüketimi
  - Ortalama güç değerleri

### 3. **Gelişmiş Görselleştirme**
- **Saatlik Enerji Tüketimi**: Area Chart ile detaylı tüketim grafiği
- **Hesaplanmış Endeks**: Bar Chart ile endeks değerleri
- **Okunan Endeks Trendi**: Line Chart ile trend analizi
- **İstatistikler**: Min, Max, Ortalama ve Toplam değerler

### 4. **Veritabanı Entegrasyonu**
- Excel verileri JSON formatında veritabanına kaydedilir
- Her rapor için Excel verisi saklanır ve yeniden görüntülenebilir

---

## 📝 Kullanım Adımları

### Adım 1: Yeni Rapor Oluşturma
1. Ana sayfada **"Yeni Rapor"** butonuna tıklayın
2. Form açılacaktır

### Adım 2: Excel Dosyası Yükleme
1. Formda **"Excel Verileri Yükle (OSOS Raporu)"** bölümünü bulun
2. **"Excel Dosyası Yükle"** butonuna tıklayın
3. `grdResult.xls` veya benzer formatda Excel dosyasını seçin
4. Sistem otomatik olarak dosyayı parse edecektir

### Adım 3: Excel Önizleme
Excel yüklendikten sonra otomatik olarak önizleme ekranı açılır:
- ✅ Toplam satır sayısı
- ✅ Toplam tüketim miktarı
- ✅ Tarih aralığı
- ✅ Saatlik tüketim grafiği
- ✅ İlk 100 satır veri tablosu

**"Verileri Forma Aktar"** butonuna tıklayarak verileri otomatik olarak forma aktarın.

### Adım 4: Diğer Alanları Doldurma
Excel'den otomatik dolmayan alanları manuel olarak doldurun:
- Fabrika adı
- Güç faktörü (cosφ)
- Reaktif güç (kVAr)
- Aktif güç (kW) - Excel'den ortalama değer gelir
- Kompanzasyon durumu
- Maliyet
- Önceki hafta güç faktörü
- Hedef güç faktörü
- Notlar (opsiyonel)
- Görsel (opsiyonel)

### Adım 5: Kaydetme
**"Kaydet"** butonuna tıklayarak raporu kaydedin.

---

## 📈 Grafik Görüntüleme

### Kayıtlı Raporlarda Grafik Görme
1. Ana sayfadaki rapor kartlarında **"Grafik"** butonu görünür (sadece Excel verisi olan raporlarda)
2. **"Grafik"** butonuna tıklayın
3. Detaylı grafik modalı açılır:

#### Grafik Türleri:
- **Saatlik Enerji Tüketimi** (Area Chart)
  - Mavi gradient dolgu
  - Saatlik bazda tüketim görünümü
  
- **Hesaplanmış Endeks Değerleri** (Bar Chart)
  - Yeşil bar grafikler
  - İlk 50 veri noktası
  
- **Okunan Endeks Trendi** (Line Chart)
  - Mor çizgi grafik
  - Tüm veri noktaları

#### İstatistikler:
- 🔴 **Max Tüketim**: En yüksek saatlik tüketim
- 🔵 **Min Tüketim**: En düşük saatlik tüketim
- 🟢 **Ortalama**: Ortalama saatlik tüketim
- 🟣 **Toplam**: Haftalık toplam tüketim

---

## 📄 PDF Raporunda Grafikler

PDF raporu oluşturulduğunda:
- Tüm grafikler otomatik olarak PDF'e dahil edilir (gelecek güncellemede)
- Yüksek çözünürlükte görsel çıktı
- Profesyonel sayfa düzeni

---

## 🗄️ Veritabanı Yapısı

### Tablo: `haftalik_raporlar`
Yeni kolon eklendi:
```sql
excel_data JSONB
```

**Veri Formatı:**
```json
[
  {
    "tarih": "2026-01-15",
    "saat": "08:00",
    "okunan_endeks": 3334.976,
    "carpan": 1380,
    "hesaplanmis_endeks": 4602266.88,
    "tuketim": 77.28
  },
  ...
]
```

### Migration Script
Migration script'i çalıştırmak için:
```bash
# Supabase SQL Editor'de şu dosyayı çalıştırın:
haftalik-raporlama-excel-migration.sql
```

---

## 🎨 Excel Dosya Formatı

### Beklenen Kolonlar:
| Kolon Adı | Tip | Açıklama |
|-----------|-----|----------|
| Tarih | Excel Date | Excel serial date formatı |
| Tarih2 | Excel Date | İkinci tarih (opsiyonel) |
| Okuma Süresi (Saat) | Number | Okuma aralığı (saat) |
| Okunan Endeks Değeri | Number | Sayaç okuması |
| Çarpan | Number | Çarpan katsayısı (genelde 1380) |
| Hesaplanmış Endeks | Number | Okunan × Çarpan |
| Hesaplanmış Sonraki Endeks | Number | Sonraki değer |
| Tüketim () | Number | kWh tüketim |

### Örnek Excel Dosyası:
`src/ExampleImperotHaftalık/grdResult (1).xls`

---

## 🔧 Teknik Detaylar

### Kullanılan Kütüphaneler:
- **XLSX**: Excel dosyalarını okuma ve yazma
- **Recharts**: React için grafik kütüphanesi
- **html2canvas**: HTML elementlerini görüntüye dönüştürme
- **jsPDF**: PDF oluşturma

### Veri İşleme:
1. Excel binary dosyası `Uint8Array` olarak okunur
2. XLSX.read() ile workbook parse edilir
3. İlk sheet'ten JSON'a dönüştürülür
4. Excel serial date, JavaScript Date'e çevrilir
5. Veri state'e kaydedilir
6. Kayıt sırasında JSON.stringify() ile string'e çevrilir
7. Supabase JSONB kolonuna yazılır

### Tarih Dönüşümü:
```javascript
// Excel serial date to JS Date
const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
```

---

## 💡 İpuçları

### En İyi Pratikler:
1. ✅ Excel dosyalarını orijinal formatta yükleyin
2. ✅ Grafikleri görüntülemek için önce Excel yükleyin
3. ✅ Tüm manuel alanları doldurmayı unutmayın
4. ✅ Her rapor için görsel eklemek profesyonellik katar
5. ✅ Notlar bölümüne özel durumları yazın

### Hata Durumları:
- ❌ **Excel okunamadı**: Dosya formatını kontrol edin
- ❌ **Grafik butonu yok**: Excel verisi yüklenmemiş demektir
- ❌ **Veri eksik**: Excel'deki zorunlu kolonları kontrol edin

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: Haftalık Rutin Rapor
1. Pazartesi sabahı OSOS sisteminden Excel raporu indir
2. Sisteme giriş yap
3. "Yeni Rapor" butonuna tıkla
4. Excel dosyasını yükle
5. Otomatik doldurulan verileri kontrol et
6. Güç faktörü ve maliyet bilgilerini gir
7. Kaydet
8. Grafikleri görüntüle ve analiz et
9. PDF olarak indir ve yönetime sun

### Senaryo 2: Geçmişe Dönük Analiz
1. Geçmiş hafta raporlarını aç
2. Her raporda "Grafik" butonuna tıkla
3. Tüketim trendlerini karşılaştır
4. Min/Max/Ortalama değerleri incele
5. Anomalileri tespit et

### Senaryo 3: Yönetim Sunumu
1. Filtreleri kullanarak belirli dönemi seç
2. Excel ile tüm verileri export et
3. Her rapor için PDF oluştur
4. Grafik görsellerini ekran görüntüsü al
5. PowerPoint sunumu hazırla

---

## 📞 Destek

Sorularınız için:
- 📧 Email: info@kobinerji.com
- 📱 Tel: +90 535 714 52 88
- 🌐 Web: www.kobinerji.com

---

## 🔄 Versiyon Geçmişi

### v2.0.0 (2026-01-30)
- ✨ Excel import özelliği eklendi
- 📊 Recharts ile gelişmiş grafikler
- 🗄️ JSONB ile Excel verisi saklama
- 📈 3 farklı grafik türü (Area, Bar, Line)
- 📊 İstatistik kartları
- 🎨 Responsive modal tasarımları

### v1.0.0 (2026-01-20)
- 🎉 İlk sürüm
- 📝 Manuel veri girişi
- 📄 PDF rapor oluşturma
- 📊 Temel istatistikler

---

## 🚀 Gelecek Özellikler

- [ ] PDF raporuna grafikleri otomatik ekleme
- [ ] Çoklu Excel dosya yükleme
- [ ] Excel export (grafik dahil)
- [ ] Email ile otomatik rapor gönderimi
- [ ] Mobil uygulama
- [ ] Yapay zeka ile anomali tespiti
- [ ] Tahminsel analiz
- [ ] Gerçek zamanlı dashboard

---

**Kobinerji Mühendislik** © 2026 - Tüm hakları saklıdır.
