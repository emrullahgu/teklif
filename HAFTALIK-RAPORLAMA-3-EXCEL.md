# Haftalık Raporlama - 3 Ayrı Excel Dosyası Sistemi

## Genel Bakış

Haftalık raporlama sisteminde artık **3 ayrı Excel dosyası** yükleme özelliği bulunmaktadır. Her bir Excel dosyası farklı bir enerji türünü temsil eder ve raporda ayrı bir grafik sayfası olarak gösterilir.

## 3 Enerji Türü

### 1. **Aktif Enerji (1.8.0)**
- **Renk Kodu**: Yeşil (#10b981)
- **OBIS Kodu**: 1.8.0
- **Birim**: kWh (kilowatt-saat)
- **Açıklama**: Tesiste tüketilen gerçek enerji miktarıdır. Elektrik faturanızda esas maliyeti oluşturan değerdir.

### 2. **Endüktif Reaktif Enerji (5.8.0)**
- **Renk Kodu**: Sarı (#f59e0b)
- **OBIS Kodu**: 5.8.0
- **Birim**: kVArh (kilovar-saat)
- **Açıklama**: İndüktif yüklerden (motorlar, transformatörler) kaynaklanan reaktif enerjidir. Kompanzasyon için kondansatör gerektirir.

### 3. **Kapasitif Reaktif Enerji (8.8.0)**
- **Renk Kodu**: Pembe (#ec4899)
- **OBIS Kodu**: 8.8.0
- **Birim**: kVArh (kilovar-saat)
- **Açıklama**: Kapasitif yüklerden veya aşırı kompanzasyondan kaynaklanan reaktif enerjidir. Reaktör ile dengelenir.

## Kullanım Adımları

### 1. Excel Dosyalarını Hazırlama

Her 3 Excel dosyası da OSOS sisteminden indirilen **grdResult.xls** formatında olmalıdır:

```
grdResult_aktif.xls    → Aktif Enerji (1.8.0)
grdResult_enduktif.xls → Endüktif Reaktif (5.8.0)
grdResult_kapasitif.xls → Kapasitif Reaktif (8.8.0)
```

#### Excel İçeriği:
- **Tarih**: Excel serial date formatı (örn: 45321.5 = 2024-01-15 12:00)
- **Okunan Endeks Değeri**: Sayacın gösterdiği değer
- **Çarpan**: Çoğunlukla 1380
- **Hesaplanmış Endeks**: Okunan x Çarpan
- **Tüketim**: Saatlik tüketim değeri (kWh veya kVArh)

### 2. Rapor Formunda Excel Yükleme

Haftalık rapor ekle/düzenle formunda 3 ayrı yükleme butonu bulunur:

```jsx
┌─────────────────────────────────────────────────────┐
│ ✓ Aktif Enerji (1.8.0) - 168 satır                │
│   [Yeşil Kenarlı Buton]                            │
├─────────────────────────────────────────────────────┤
│ ✓ Endüktif Reaktif (5.8.0) - 168 satır            │
│   [Sarı Kenarlı Buton]                             │
├─────────────────────────────────────────────────────┤
│ ✓ Kapasitif Reaktif (8.8.0) - 168 satır           │
│   [Pembe Kenarlı Buton]                            │
└─────────────────────────────────────────────────────┘
```

**İşlem Adımları:**
1. İlk butona tıklayın → Aktif enerji Excel dosyasını seçin
2. İkinci butona tıklayın → Endüktif Excel dosyasını seçin
3. Üçüncü butona tıklayın → Kapasitif Excel dosyasını seçin
4. Her yükleme sonrası yeşil onay mesajı görünür
5. Form kaydedildiğinde 3 Excel de veritabanına kaydedilir

### 3. PDF Raporunda Gösterim

PDF raporu şu sayfalara sahip olacaktır:

#### **Sayfa 1: Genel Bilgiler + OSOS Özet Tablosu**
- Fabrika adı, tarih aralığı
- Güç faktörü, enerji tüketimi
- 4 kolonlu kompakt OSOS tablosu (1.8.0, 5.8.0, 8.8.0, 2.8.0)

#### **Sayfa 2: Analiz ve Öneriler**
- Güç faktörü analizi
- Kompanzasyon önerileri
- Maliyet hesaplamaları

#### **Sayfa 3: Aktif Enerji Grafiği** (Eğer yüklendiyse)
- Yeşil kenarlı sayfa
- Saatlik aktif enerji (kWh) line chart
- İstatistikler (Toplam, Ortalama, Max, Min)
- Yük profili yorumu

#### **Sayfa 4: Endüktif Reaktif Grafiği** (Eğer yüklendiyse)
- Sarı kenarlı sayfa
- Saatlik endüktif reaktif (kVArh) line chart
- İstatistikler
- Kompanzasyon önerileri

#### **Sayfa 5: Kapasitif Reaktif Grafiği** (Eğer yüklendiyse)
- Pembe kenarlı sayfa
- Saatlik kapasitif reaktif (kVArh) line chart
- İstatistikler
- Reaktör kullanım önerileri

#### **Son Sayfa: Saha Görseli** (Eğer yüklendiyse)
- Kompanzasyon panosu fotoğrafı
- Sayaç görseli

## Veritabanı Yapısı

### Tablo: `haftalik_raporlar`

**3 Ayrı Excel JSONB Kolonları:**

```sql
excel_data_aktif      JSONB    -- Aktif enerji Excel verisi
excel_data_enduktif   JSONB    -- Endüktif Excel verisi
excel_data_kapasitif  JSONB    -- Kapasitif Excel verisi
```

**JSONB İçerik Formatı:**
```json
[
  {
    "tarih": "2024-01-15",
    "saat": "00:00",
    "okunan_endeks": 123456,
    "carpan": 1380,
    "hesaplanmis_endeks": 170389680,
    "tuketim": 245.67,
    "raw_data": { ... }
  },
  {
    "tarih": "2024-01-15",
    "saat": "01:00",
    "okunan_endeks": 123460,
    "carpan": 1380,
    "hesaplanmis_endeks": 170394800,
    "tuketim": 238.45,
    "raw_data": { ... }
  }
  // ... 168 saat (1 hafta)
]
```

### Migration SQL

```sql
-- Eski kolonları kaldır
ALTER TABLE haftalik_raporlar DROP COLUMN IF EXISTS excel_data;
ALTER TABLE haftalik_raporlar DROP COLUMN IF EXISTS excel_enerji_turu;
ALTER TABLE haftalik_raporlar DROP COLUMN IF EXISTS excel_kolon;

-- Yeni 3 kolon ekle
ALTER TABLE haftalik_raporlar ADD COLUMN IF NOT EXISTS excel_data_aktif JSONB;
ALTER TABLE haftalik_raporlar ADD COLUMN IF NOT EXISTS excel_data_enduktif JSONB;
ALTER TABLE haftalik_raporlar ADD COLUMN IF NOT EXISTS excel_data_kapasitif JSONB;

-- Indexler
CREATE INDEX IF NOT EXISTS idx_excel_data_aktif ON haftalik_raporlar USING GIN (excel_data_aktif);
CREATE INDEX IF NOT EXISTS idx_excel_data_enduktif ON haftalik_raporlar USING GIN (excel_data_enduktif);
CREATE INDEX IF NOT EXISTS idx_excel_data_kapasitif ON haftalik_raporlar USING GIN (excel_data_kapasitif);

-- Açıklamalar
COMMENT ON COLUMN haftalik_raporlar.excel_data_aktif IS 'Aktif enerji (1.8.0) saatlik detay verileri - OSOS grdResult.xls';
COMMENT ON COLUMN haftalik_raporlar.excel_data_enduktif IS 'Endüktif reaktif (5.8.0) saatlik detay verileri - OSOS grdResult.xls';
COMMENT ON COLUMN haftalik_raporlar.excel_data_kapasitif IS 'Kapasitif reaktif (8.8.0) saatlik detay verileri - OSOS grdResult.xls';
```

## React Component Yapısı

### State Variables

```jsx
const [excelDataAktif, setExcelDataAktif] = useState([]);
const [excelDataEnduktif, setExcelDataEnduktif] = useState([]);
const [excelDataKapasitif, setExcelDataKapasitif] = useState([]);
```

### Upload Handlers

```jsx
const handleExcelUploadAktif = (e) => { ... };
const handleExcelUploadEnduktif = (e) => { ... };
const handleExcelUploadKapasitif = (e) => { ... };
```

### Form Submit

```jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  const rapor = {
    ...formData,
    excel_data_aktif: excelDataAktif.length > 0 ? JSON.stringify(excelDataAktif) : null,
    excel_data_enduktif: excelDataEnduktif.length > 0 ? JSON.stringify(excelDataEnduktif) : null,
    excel_data_kapasitif: excelDataKapasitif.length > 0 ? JSON.stringify(excelDataKapasitif) : null,
    osos_ozet_tablo: ososOzetTablosu.length > 0 ? JSON.stringify(ososOzetTablosu) : null
  };
  // ... Supabase insert/update
};
```

### PDF Generation

```jsx
const excelDataSets = [
  { data: selectedRapor.excel_data_aktif, type: 'aktif', title: 'Aktif Enerji', code: '1.8.0', color: '#10b981' },
  { data: selectedRapor.excel_data_enduktif, type: 'enduktif', title: 'Reaktif Endüktif Enerji', code: '5.8.0', color: '#f59e0b' },
  { data: selectedRapor.excel_data_kapasitif, type: 'kapasitif', title: 'Reaktif Kapasitif Enerji', code: '8.8.0', color: '#ec4899' }
];

excelDataSets.forEach((excelSet) => {
  if (excelSet.data) {
    const excelData = JSON.parse(excelSet.data);
    pages.push(
      <div key={`page-excel-${excelSet.type}`} className="haftalik-pdf-page">
        {/* Excel grafiği ve istatistikler */}
      </div>
    );
  }
});
```

## Avantajlar

### Önceki Sistem (Tek Excel)
❌ 1 Excel dosyası yüklenir
❌ Enerji türü dropdown ile seçilir
❌ PDF'de sadece 1 grafik sayfası
❌ Diğer 2 enerji türü için ayrı rapor gerekir

### Yeni Sistem (3 Ayrı Excel)
✅ 3 Excel dosyası ayrı ayrı yüklenir
✅ Her biri kendi rengine sahip
✅ PDF'de 3 ayrı grafik sayfası
✅ Tüm enerji türleri tek raporda
✅ Karşılaştırmalı analiz kolaylaşır

## Sık Sorulan Sorular

### S: 3 Excel'in hepsini yüklemek zorunlu mu?
**C:** Hayır, istediğiniz kadarını yükleyebilirsiniz. Örneğin sadece aktif enerji yüklenir, diğer 2 boş bırakılabilir. PDF'de sadece yüklenenler için sayfa oluşturulur.

### S: Excel formatı farklı olursa?
**C:** Sistem otomatik olarak "Tarih" ve "Tüketim" içeren kolonları bulur. Türkçe formatı (3.296,18) düzgün parse eder.

### S: Eski raporlardaki tek Excel verisi kaybolur mu?
**C:** Eski `excel_data` kolonu DROP edilir, ancak migration öncesi yedek almanızı öneririz. Yeni sistem ile eski raporlar yeniden oluşturulmalıdır.

### S: PDF'de sayfa sırası nasıl?
**C:** Sabit sıra:
1. Genel Bilgiler
2. Analiz
3. Aktif Enerji (varsa)
4. Endüktif Reaktif (varsa)
5. Kapasitif Reaktif (varsa)
6. Görsel (varsa)

### S: Grafiklerde üst üste binme olur mu?
**C:** Hayır, her sayfa 297mm (A4 yüksekliği) ile sınırlıdır. `windowHeight` ve `overflow: hidden` ile üst üste binme engellenir.

## Örnek Kullanım Senaryosu

### Haftalık Rapor Hazırlama

1. **OSOS'tan Veri İndirme:**
   - OSOS web sitesine giriş yap
   - Detay Raporu → 1.8.0 seç → Hafta seç → İndir (grdResult.xls)
   - Detay Raporu → 5.8.0 seç → Hafta seç → İndir
   - Detay Raporu → 8.8.0 seç → Hafta seç → İndir

2. **Haftalık Rapor Oluşturma:**
   - Haftalık Raporlama → Yeni Rapor
   - Fabrika adı: "ABC Tekstil"
   - Tarih aralığı: 15-21 Ocak 2024
   - Aktif enerji Excel'i yükle → "✓ 168 satır"
   - Endüktif Excel'i yükle → "✓ 168 satır"
   - Kapasitif Excel'i yükle → "✓ 168 satır"
   - OSOS özet tablosunu yapıştır
   - Güç faktörü auto-calculate ✓
   - Form kaydet

3. **PDF Rapor İndirme:**
   - Rapor kartında "PDF" butonuna tıkla
   - Önizleme açılır → 6 sayfa görünür
   - "PDF İndir" → `Haftalik_Rapor_ABC_Tekstil_2024-01-15.pdf`

4. **Analiz:**
   - Sayfa 3: Aktif enerji zirve saatleri 08:00-17:00
   - Sayfa 4: Endüktif reaktif yüksek → Kompanzasyon yetersiz
   - Sayfa 5: Kapasitif reaktif düşük → İyi dengelenmiş

## Teknik Detaylar

### PDF Oluşturma Algoritması

```javascript
const pages = []; // Tüm sayfalar

// Sayfa 1: Genel + OSOS
pages.push(<Page1 />);

// Sayfa 2: Analiz
pages.push(<Page2 />);

// Sayfa 3-5: Excel Grafikleri (dinamik)
let excelPageCount = 0;
excelDataSets.forEach((set) => {
  if (set.data) {
    excelPageCount++;
    pages.push(<ExcelPage data={set.data} type={set.type} color={set.color} />);
  }
});

// Son Sayfa: Görsel (varsa)
if (gorsel_url) {
  pages.push(<ImagePage />);
}

// PDF Oluşturma
const pdf = new jsPDF('p', 'mm', 'a4');
pages.forEach((page, i) => {
  if (i > 0) pdf.addPage();
  const canvas = await html2canvas(page, { windowHeight: page.scrollHeight });
  pdf.addImage(canvas, 'JPEG', 0, 0, 210, 297);
});
pdf.save(`Haftalik_Rapor_${fabrika}_${tarih}.pdf`);
```

### Performans Optimizasyonu

- **Lazy Loading**: Excel parse sadece gerektiğinde
- **JSON Stringify**: Veritabanına kaydederken minimize
- **GIN Index**: JSONB sorgulama hızı
- **WindowHeight**: PDF render sırasında overflow önleme

## Bakım ve Güncelleme

### Database Migration Çalıştırma

```bash
# Supabase SQL Editor'de çalıştır
psql -h your-project.supabase.co -U postgres -d postgres -f haftalik-raporlama-excel-migration.sql
```

### React Component Güncellemeleri

```bash
# Dosya: src/HaftalikRaporlama.jsx
git pull origin main
npm install
npm run dev
```

## Destek ve İletişim

- **Geliştirici**: KOBİNERJİ Mühendislik
- **Email**: info@kobinerji.com
- **Tel**: +90 535 714 52 88
- **Adres**: Kemalpaşa O.S.B. Gazi Bulv. Ceran Plaza No:177/19 35170 Kemalpaşa / İzmir
