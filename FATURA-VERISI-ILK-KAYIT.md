# 📋 Fatura/Okuma Endeks Tablosundan İlk Fabrika Kaydı Girişi

## 🎯 Amaç

Bu rehber, **ilk kez bir fabrika kaydı oluştururken** fatura/okuma endeks tablosundan elde edilen verileri sisteme nasıl gireceğinizi açıklar.

---

## ✅ Fatura Tablosunda Bulunan Bilgiler

Elektrik faturanızın veya OSOS okuma endeks tablosunun şu bilgileri içerir:

| Parametre | Değer Örneği | Açıklama |
|-----------|--------------|----------|
| **Aktif Enerji Tüketimi** | 70.044,66 kWh | 1.8.0 kodlu satırdaki tüketim değeri |
| **Demand / Maksimum Talep** | 327,06 kW | Demand satırındaki güç değeri |
| **Endüktif Reaktif Enerji** | 4.134,48 kVArh | 5.8.0 kodlu satırdaki tüketim |
| **Kapasitif Reaktif Enerji** | 1.298,58 kVArh | 8.8.0 kodlu satırdaki tüketim |
| **Endüktif Reaktif Oranı** | %5,90 | Yasal sınır: %20 |
| **Kapasitif Reaktif Oranı** | %1,85 | Yasal sınır: %15 |

---

## ❌ Fatura Tablosunda OLMAYAN Bilgiler

Bu değerler fatura tablosunda **doğrudan yazmaz**:

| Parametre | Neden Yok? | Çözüm |
|-----------|------------|-------|
| **Güç Faktörü (Cosφ)** | Anlık değer gerektirir | ✅ OSOS verileriyle otomatik hesaplanabilir |
| **Önceki Hafta Cosφ** | İlk kayıt olduğu için tarihçe yok | ✅ "İlk kayıt" checkbox'ı işaretlenebilir |
| **Reaktif Güç (kVAr)** | Anlık değer gerektirir | ⚠️ Manuel tahmin veya SCADA'dan alınmalı |

---

## 📝 Adım Adım Veri Girişi

### 1️⃣ **Fabrika Adı ve Tarih**
- **Fabrika Adı:** İşletmenizin adını girin
- **Hafta Dönemi:** Faturanın kapsadığı hafta (Pazartesi - Pazar)

### 2️⃣ **OSOS Özet Tablosunu Yapıştırın** ⭐ ÖNERİLEN
Fatura tablosundaki endeks verilerini kopyalayın ve "OSOS Özet Tablosu" alanına yapıştırın:

```
Endeks Kodu	Açıklama	İlk endeks	Son endeks	Endeks Farkı	Çarpan	Tüketim (kWh)	Yasal Sınır	Durum
1.8.0	Aktif enerji	3.296,18	3.346,94	50,7570	1380,0000	70.044,66		
5.8.0	Reaktif Endüktif	2,996	5,992	2,996	1380	4.134,48	%20	Limit altında, ceza yok
8.8.0	Reaktif Kapasitif	0,941	1,882	0,941	1380	1.298,58	%15	Limit altında, ceza yok
```

✅ **Yapıştırdıktan sonra:**
- Aktif enerji (70.044,66 kWh) otomatik algılanır
- Endüktif/Kapasitif reaktif enerjiler kaydedilir
- **Cosφ otomatik hesaplanır!**

### 3️⃣ **Güç Faktörü Ayarları**

#### Seçenek A: Otomatik Hesaplama (Önerilen)
1. ✅ **"OSOS verilerinden otomatik hesapla"** checkbox'ını işaretleyin
2. Sistem aktif ve reaktif enerjilerden Cosφ'yi hesaplar:
   ```
   Cosφ = P / √(P² + Q²)
   Örnek: 70.044 / √(70.044² + 4.134²) ≈ 0.998
   ```

#### Seçenek B: Manuel Giriş
- Eğer elinizde başka bir kaynaktan Cosφ değeri varsa manuel girin
- Otomatik hesaplama checkbox'ı işaretli değilse manuel alan aktiftir

### 4️⃣ **Önceki Hafta Güç Faktörü**

İlk fabrika kaydı olduğu için **önceki hafta verisi yoktur**:

1. ✅ **"Bu fabrikanın ilk kaydı"** checkbox'ını işaretleyin
2. Alan otomatik olarak devre dışı bırakılır
3. Form kaydedilirken bu alan zorunlu olmayacaktır

### 5️⃣ **Aktif ve Reaktif Güç**

#### Aktif Güç (kW) - ✅ FATURADA VAR
- Fatura tablosunda **"Demand / Tüketim"** satırını bulun
- Örnek: **327,06 kW**
- Bu değeri "Aktif Güç" alanına girin

#### Reaktif Güç (kVAr) - ⚠️ FATURADA GENELDE YOK
Reaktif güç anlık bir değerdir ve genelde faturada yazmaz. İki yöntem:

**Yöntem 1: Tahmini Hesaplama**
```
Eğer Cosφ biliniyorsa:
tan(φ) = Q / P
Q = P × tan(arccos(Cosφ))

Örnek:
Cosφ = 0.998 → arccos(0.998) = 3.6° → tan(3.6°) = 0.063
Q = 327 × 0.063 ≈ 20.6 kVAr
```

**Yöntem 2: SCADA/Anlık Ölçüm**
- Eğer SCADA sisteminiz varsa anlık kVAr değerini oradan alın
- Veya güç analizörü ile ölçüm yapın

**Yöntem 3: Ortalama Değer**
- İlk kayıtta tahmini bir değer girin (örn: 50 kVAr)
- Sonraki haftalarda gerçek verilerle güncelleyin

### 6️⃣ **Enerji Tüketimi ve Maliyet**

#### Enerji Tüketimi (kWh) - ✅ FATURADA VAR
- Fatura tablosunda **"1.8.0 - Aktif enerji"** satırındaki **Tüketim** değerini girin
- Örnek: **70.044,66 kWh**

#### Maliyet (₺)
- Faturadaki toplam elektrik bedeli
- Veya kWh × birim fiyat hesabı
- Örnek: 70.044,66 kWh × 3,5 ₺/kWh = 245.156,31 ₺

### 7️⃣ **Kompanzasyon Durumu**

Manuel bir açıklama girin:
- Örn: "Otomatik kompanzasyon aktif, 3 kademe çalışıyor"
- Örn: "Manuel kompanzasyon, 2/4 kademe devrede"
- Örn: "Kompanzasyon panosu yok, doğal güç faktörü"

### 8️⃣ **Hedef Güç Faktörü**

Türkiye'de standart hedefler:
- **Minimum:** 0.90 (Endüktif)
- **İdeal:** 0.95 (Önerilen)
- **Mükemmel:** 0.98+

Varsayılan değer: **0.95**

---

## 📊 Örnek Veri Girişi

### Fatura Tablosundan:
```
Aktif Enerji (1.8.0): 70.044,66 kWh
Demand: 327,06 kW
Endüktif Reaktif (5.8.0): 4.134,48 kVArh (%5,90)
Kapasitif Reaktif (8.8.0): 1.298,58 kVArh (%1,85)
```

### Forma Girilen Değerler:
| Alan | Değer | Kaynak |
|------|-------|--------|
| Fabrika Adı | ABC Fabrikası | Manuel |
| Hafta Başlangıç | 2026-01-20 | Manuel |
| Hafta Bitiş | 2026-01-26 | Manuel |
| Enerji Tüketimi | 70.044,66 kWh | Fatura (1.8.0) |
| Aktif Güç | 327,06 kW | Fatura (Demand) |
| Reaktif Güç | ~20 kVAr | Tahmini |
| Güç Faktörü | 0.998 | **Otomatik hesaplandı** ✅ |
| Önceki Hafta Cosφ | - | İlk kayıt ✅ |
| Hedef Cosφ | 0.95 | Varsayılan |
| Kompanzasyon | Otomatik, 3 kademe | Manuel |
| Maliyet | 245.156 ₺ | Manuel hesap |

---

## ⚙️ Otomatik Hesaplama Nasıl Çalışır?

### Cosφ Hesaplama Formülü:
```javascript
// P = Aktif Enerji (kWh)
// Q = Reaktif Enerji (kVArh) - Endüktif değer kullanılır

S = √(P² + Q²)  // Görünür Güç
Cosφ = P / S

Örnek:
P = 70.044,66 kWh
Q = 4.134,48 kVArh
S = √(70.044² + 4.134²) = 70.166 kVA
Cosφ = 70.044 / 70.166 = 0.9983 ≈ 0.998
```

### Reaktif Oranlar:
```
Endüktif Oran = (Q_endüktif / P) × 100
Kapasitif Oran = (Q_kapasitif / P) × 100

Sizin örneğiniz:
Endüktif: (4.134 / 70.044) × 100 = 5,90% ✅ (Sınır: %20)
Kapasitif: (1.298 / 70.044) × 100 = 1,85% ✅ (Sınır: %15)
```

---

## ✅ Kontrol Listesi

Kaydetmeden önce kontrol edin:

- [ ] Fabrika adı girildi
- [ ] Hafta tarihleri doğru (Pazartesi - Pazar)
- [ ] OSOS özet tablosu yapıştırıldı ve parse edildi
- [ ] "İlk kayıt" checkbox'ı işaretli (önceki hafta cosφ yok)
- [ ] "Otomatik hesapla" checkbox'ı işaretli (cosφ hesaplandı)
- [ ] Aktif güç (Demand) faturadan girildi
- [ ] Enerji tüketimi (1.8.0) faturadan girildi
- [ ] Reaktif güç tahmini verildi
- [ ] Kompanzasyon durumu açıklandı
- [ ] Maliyet hesaplandı

---

## 🚨 Sık Sorulan Sorular

### ❓ "Reaktif güç değeri neden faturada yok?"
**Cevap:** Reaktif güç (kVAr) anlık bir değerdir. Faturada sadece **reaktif enerji tüketimi** (kVArh) vardır. İki farklı kavramdır:
- **kVArh** = Zaman içinde biriken reaktif enerji (faturada var)
- **kVAr** = Anlık reaktif güç (SCADA'dan alınmalı veya tahmin edilmeli)

### ❓ "İlk kayıtta önceki hafta cosφ zorunlu mu?"
**Cevap:** Hayır. "Bu fabrikanın ilk kaydı" checkbox'ını işaretlerseniz zorunlu olmaz.

### ❓ "Otomatik hesaplanan cosφ değeri doğru mu?"
**Cevap:** Evet, **enerji bazlı cosφ** hesabı doğrudur. Ancak:
- Faturadaki veriler dönemlik (haftalık/aylık) ortalamadır
- Anlık cosφ değeri farklı olabilir
- Yeterince hassastır, fark çok küçüktür

### ❓ "Demand değeri nedir, nerede bulunur?"
**Cevap:** Demand, fatura dönemindeki **maksimum talep edilen güç**tür (kW cinsinden). Fatura tablosunda:
- "Demand" satırı
- Veya "Tüketim" sütunundaki güç değeri
- Genelde 300-500 kW aralığındadır

---

## 📚 İlgili Kaynaklar

- [HAFTALIK-RAPORLAMA-EXCEL-IMPORT.md](./HAFTALIK-RAPORLAMA-EXCEL-IMPORT.md) - Excel ile veri yükleme
- [EXCEL-ENERJI-TURU-KULLANIMI.md](./EXCEL-ENERJI-TURU-KULLANIMI.md) - Enerji türü seçimi
- [OSOS-OZET-TABLO-KULLANIMI.md](./OSOS-OZET-TABLO-KULLANIMI.md) - OSOS tablo formatı
- [Haftalık Raporlama Veritabanı Migration](./haftalik-raporlama-excel-migration.sql) - SQL şema

---

## 📞 Destek

Veri girişinde sorun yaşarsanız:
1. Yukarıdaki kontrol listesini tekrar gözden geçirin
2. OSOS özet tablosunu doğru formatta yapıştırdığınızdan emin olun
3. Otomatik hesaplama checkbox'larının durumunu kontrol edin

---

**Son Güncelleme:** 30 Ocak 2026
