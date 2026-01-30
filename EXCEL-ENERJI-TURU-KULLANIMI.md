# ⚡ Excel Enerji Türü Seçimi - Kullanım Kılavuzu

## 🎯 Özellik Açıklaması

Haftalık raporlama sistemine eklenen bu özellik sayesinde, OSOS Excel raporlarındaki farklı enerji türlerini (Aktif, Reaktif Endüktif, Reaktif Kapasitif) ayırt edebilir ve doğru şekilde raporlayabilirsiniz.

---

## 🔋 Enerji Türleri

### 1. ⚡ Aktif Enerji (kWh)
- **Tanım**: Elektrik enerjisinin gerçek iş yapan kısmı
- **Birim**: kWh (kilowatt-saat)
- **Kullanım**: Motorlar, aydınlatma, ısıtma gibi cihazlar
- **Faturalama**: Aylık elektrik faturanızda görünen tüketim
- **Excel Kolonu**: Genellikle "Tüketim ()", "Aktif Enerji", "kWh"

### 2. 🔴 Reaktif Endüktif Enerji (kVArh)
- **Tanım**: Endüktif yüklerden kaynaklanan reaktif enerji
- **Birim**: kVArh (kilovolt-amper-reaktif-saat)
- **Kaynak**: Motorlar, transformatörler, balastlar
- **Etki**: Güç faktörünü düşürür
- **Kompanzasyon**: Kapasitörlerle dengelenir
- **Excel Kolonu**: "Endüktif", "Induktif", "Reaktif +"

### 3. 🔵 Reaktif Kapasitif Enerji (kVArh)
- **Tanım**: Kapasitif yüklerden kaynaklanan reaktif enerji
- **Birim**: kVArh
- **Kaynak**: Kapasitörler, kablolar
- **Etki**: Aşırı kompanzasyonda oluşur
- **Ceza**: Fazla kapasitif enerji de cezaya tabi
- **Excel Kolonu**: "Kapasitif", "Capacitive", "Reaktif -"

---

## 📊 Excel Dosyası Formatları

OSOS sisteminden gelen Excel raporları genellikle şu formatlarda olabilir:

### Format 1: Tek Tüketim Kolonu
```
| Tarih | Saat | Tüketim () | Endeks | Çarpan |
|-------|------|-----------|--------|--------|
| ...   | ...  | 77.28     | ...    | 1380   |
```
Bu durumda kolon "Tüketim ()" ve türü belirtilmeli.

### Format 2: Ayrı Enerji Türü Kolonları
```
| Tarih | Saat | Aktif (kWh) | Endüktif (kVArh) | Kapasitif (kVArh) |
|-------|------|-------------|------------------|-------------------|
| ...   | ...  | 150.5       | 45.2             | 5.1               |
```
Her enerji türü için ayrı Excel yüklenebilir.

### Format 3: OSOS Standart Format
```
| Tarih | Okunan Endeks | Çarpan | Hesaplanmış Endeks | Tüketim () |
|-------|---------------|--------|--------------------|-----------|
| ...   | 3334.976      | 1380   | 4602266.88         | 77.28     |
```

---

## 🚀 Adım Adım Kullanım

### 1. Excel Yükleme
1. **"Yeni Rapor"** butonuna tıklayın
2. **"Excel Verileri Yükle"** bölümünü bulun
3. Excel dosyasını seçin
4. Sistem otomatik olarak kolonları tespit eder

### 2. Otomatik Algılama
Sistem kolon isimlerinden enerji türünü tahmin eder:
- "tüketim" → **Aktif** (varsayılan)
- "endüktif" veya "induktif" → **Endüktif**
- "kapasitif" → **Kapasitif**

### 3. Manuel Seçim
Önizleme ekranında:

#### **Veri Kolonu** Seçimi:
- Dropdown'dan Excel'deki hangi kolonun kullanılacağını seçin
- Örnek: "Tüketim ()", "Aktif Enerji", "Reaktif Endüktif"

#### **Enerji Türü** Seçimi:
- ⚡ **Aktif Enerji (kWh)** - Normal elektrik tüketimi
- 🔴 **Reaktif Endüktif (kVArh)** - Motor ve trafo yükleri
- 🔵 **Reaktif Kapasitif (kVArh)** - Kapasitör yükleri

### 4. Onaylama
Seçiminizi kontrol edin:
```
Seçili: Tüketim () (⚡ Aktif Enerji)
```

### 5. Forma Aktarma
**"Verileri Forma Aktar"** butonuna tıklayın.

Sistem otomatik olarak:
- Hafta başlangıç/bitiş tarihlerini
- Toplam tüketimi (kWh veya kVArh)
- Ortalama güç değerlerini
- Notlar bölümüne enerji türü bilgisini ekler

---

## 📈 Grafiklerde Görünüm

### Grafik Başlıkları
Enerji türüne göre otomatik değişir:
- **Aktif**: "Saatlik Enerji Tüketimi (kWh)"
- **Endüktif/Kapasitif**: "Saatlik Enerji Tüketimi (kVArh)"

### Enerji Türü Badge
Grafik ekranının üstünde gösterilir:
- ⚡ Aktif Enerji (kWh)
- 🔴 Reaktif Endüktif (kVArh)
- 🔵 Reaktif Kapasitif (kVArh)

### Renk Kodlama
- **Mavi**: Aktif enerji grafiği
- **Kırmızı**: Endüktif enerji (gelecek güncelleme)
- **Yeşil**: Kapasitif enerji (gelecek güncelleme)

---

## 🎯 Kullanım Senaryoları

### Senaryo 1: Sadece Aktif Enerji Raporu
```
1. Aktif enerji Excel'ini yükle
2. "Tüketim ()" kolonunu seç
3. "⚡ Aktif Enerji" seç
4. Forma aktar ve kaydet
```

### Senaryo 2: Reaktif Endüktif Analizi
```
1. Endüktif enerji Excel'ini yükle
2. "Reaktif Endüktif" kolonunu seç
3. "🔴 Reaktif Endüktif" seç
4. Forma aktar
5. Kompanzasyon önerilerini not ekle
```

### Senaryo 3: Kapasitif Enerji İzleme
```
1. Kapasitif enerji Excel'ini yükle
2. "Reaktif Kapasitif" kolonunu seç
3. "🔵 Reaktif Kapasitif" seç
4. Forma aktar
5. Aşırı kompanzasyon uyarısı ekle
```

### Senaryo 4: Tam Analiz (3 Rapor)
Her enerji türü için ayrı rapor oluşturun:
1. **Hafta 1 - Aktif**: Genel tüketim analizi
2. **Hafta 1 - Endüktif**: Reaktif yük değerlendirmesi
3. **Hafta 1 - Kapasitif**: Kompanzasyon kontrolü

---

## 💡 Önemli Notlar

### ⚠️ Dikkat Edilmesi Gerekenler

1. **Doğru Kolon Seçimi**
   - Excel'de birden fazla tüketim kolonu olabilir
   - Mutlaka doğru kolonu seçin
   - Kolon başlığını kontrol edin

2. **Enerji Türü Uyumu**
   - Seçtiğiniz kolon ve enerji türü uyumlu olmalı
   - Aktif enerji için kWh
   - Reaktif için kVArh

3. **Birim Kontrolü**
   - Grafiklerde birimler otomatik gösterilir
   - kWh: Aktif enerji
   - kVArh: Reaktif enerji

4. **Notlar Bölümü**
   - Enerji türü otomatik olarak notlara eklenir
   - Ek bilgiler ekleyebilirsiniz

### ✅ En İyi Pratikler

1. **Her Enerji Türü İçin Ayrı Rapor**
   - Aktif, endüktif ve kapasitif için ayrı kayıt
   - Karşılaştırma yapmak daha kolay olur

2. **Kolon İsimlendirmesi**
   - Excel kolonlarında açıklayıcı isimler kullanın
   - "Aktif kWh", "Reaktif Endüktif kVArh" gibi

3. **Düzenli Takip**
   - Her hafta aynı enerji türlerini izleyin
   - Trend analizi yapın

4. **Kompanzasyon İlişkisi**
   - Endüktif yüksek → Kompanzasyon gerekli
   - Kapasitif yüksek → Aşırı kompanzasyon
   - İkisini birlikte değerlendirin

---

## 🗄️ Veritabanında Saklama

Her rapor için aşağıdaki bilgiler saklanır:

```json
{
  "excel_data": [ ... ],           // Tüm detay veriler
  "excel_enerji_turu": "aktif",    // aktif|enduktif|kapasitif
  "excel_kolon": "Tüketim ()"      // Kullanılan kolon adı
}
```

### Sorgu Örnekleri

**Enerji türüne göre raporlar:**
```sql
SELECT fabrika_adi, excel_enerji_turu, COUNT(*) 
FROM haftalik_raporlar 
GROUP BY fabrika_adi, excel_enerji_turu;
```

**Toplam tüketim karşılaştırması:**
```sql
SELECT 
  excel_enerji_turu,
  SUM(enerji_tuketimi) as toplam
FROM haftalik_raporlar
WHERE excel_enerji_turu IS NOT NULL
GROUP BY excel_enerji_turu;
```

---

## 📊 Raporlama İpuçları

### Yönetim Sunumu
1. Aktif enerji raporunu ana gösterge olarak kullanın
2. Reaktif enerjileri yan grafiklerle gösterin
3. Güç faktörü ile ilişkilendirin

### Teknik Analiz
1. Endüktif enerji trendini izleyin
2. Kompanzasyon etkinliğini değerlendirin
3. Kapasitif enerjiyi kontrol edin (aşırı kompanzasyon)

### Maliyet Hesaplama
- Aktif: Ana maliyet kalemi
- Endüktif: Ceza riski (cosφ < 0.85)
- Kapasitif: Ceza riski (aşırı kompanzasyon)

---

## 🔄 Güncelleme ve Düzenleme

Kayıtlı raporları düzenlerken:
1. Enerji türü değiştirilebilir
2. Farklı kolon seçilebilir
3. Veriler yeniden parse edilir
4. Grafikler otomatik güncellenir

---

## 🆘 Sorun Giderme

### Problem: Enerji türü yanlış algılanıyor
**Çözüm**: Önizleme ekranında manuel olarak değiştirin

### Problem: Grafik yanlış birimle gösteriliyor
**Çözüm**: Enerji türünü kontrol edin, gerekirse düzenle

### Problem: Excel kolonları görünmüyor
**Çözüm**: Excel dosyasının ilk satırında başlık olduğundan emin olun

### Problem: Tüketim değerleri yanlış
**Çözüm**: Doğru kolonu seçtiğinizden emin olun

---

## 📞 Destek

- 📧 Email: info@kobinerji.com
- 📱 Tel: +90 535 714 52 88
- 🌐 Web: www.kobinerji.com

---

## 🎓 Eğitim Videoları (Yakında)

- [ ] Excel yükleme ve enerji türü seçimi
- [ ] Aktif-Reaktif enerji analizi
- [ ] Kompanzasyon optimizasyonu
- [ ] Çoklu rapor karşılaştırma

---

**Kobinerji Mühendislik** © 2026 - Enerji Verimliliği Uzmanı

*Bu özellik ile artık her enerji türünü ayrı ayrı takip edebilir, kompanzasyon sisteminizi optimize edebilir ve reaktif enerji cezalarından kaçınabilirsiniz!* ⚡🔴🔵
