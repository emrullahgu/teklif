# ⏱️ Bordro Eksik Çalışma / Fazla Mesai Ayrımı ve Devreden Bakiye - Kurulum

## 1️⃣ Eksik Çalışma ile Fazla Mesai Ayrımı

### Ne Değişti?

**Eski Sistem (Hatalı):**
- Sadece "Mesai Saati" (`overtimeHours`) alanı vardı.
- Bu alan otomatik olarak SADECE çıkış saati planlanandan GEÇ olduğunda hesaplanıyordu.
- Personel planlanandan ERKEN çıkarsa veya GEÇ gelirse hiçbir kesinti yapılmıyordu -
  "eksik çalışma" kavramı tamamen yoktu.

**Yeni Sistem (Doğru):**
- İki tamamen ayrı alan: `overtimeHours` (fazla mesai) ve `shortfallHours` (eksik çalışma).
- Aynı gün için ikisi ASLA birlikte dolu olmaz (biri girilince diğeri otomatik sıfırlanır).
- Giriş/çıkış saatleri planlanan çalışma süresiyle (08:00-18:00 hafta içi,
  08:00-13:00 Cumartesi) karşılaştırılır:
  - Gerçek çalışma süresi PLANLANANDAN FAZLA ise → **fazla mesai** oluşur ve
    `saatlik ücret × mesai katsayısı (varsayılan 1.5)` ile maaşa **eklenir**.
  - Gerçek çalışma süresi PLANLANANDAN AZ ise → **eksik çalışma** oluşur ve
    `saatlik ücret × 1` (katsayı YOK) ile maaştan **düşülür**.
  - Örnek: Personel 2 saat eksik çalıştıysa → `2 × saatlik ücret` maaştan düşülür.
- Kullanıcı her iki alanı da manuel olarak düzenleyebilir (Puantaj tablosunda
  "MESAİ" ve "EKSİK" olarak iki ayrı sütun).
- Mesai katsayısı `OVERTIME_MULTIPLIER` sabiti ile tek bir yerden yönetilir.

### Kurulum

`bordro-shortfall-hours-migration.sql` dosyasını Supabase SQL Editor'da çalıştırın.
Bu migration:
- `bordro_daily_logs` tablosuna `shortfall_hours` kolonu ekler.
- `monthly_payroll_summary` tablosuna `shortfall_hours` (aylık toplam) kolonu ekler.

## 2️⃣ Devreden Bakiye

### Ne Eklendi?

Her aylık bordroda (hem canlı görünümde hem "Ayı Kapat" sonrası kayıtta) şu 4 alan bulunur:

1. **Geçmiş Aydan Devreden Bakiye** (`previous_balance`) - bir önceki ayın
   "gelecek aya devreden bakiyesi".
2. **Bu Ay Hesaplanan Net Maaş** (`net_payable`) - zaten mevcut olan hesaplama.
3. **Bu Ay Personele Ödenen Gerçek Tutar** (`paid_amount`) - "Ayı Kapat" sırasında
   girilir (varsayılan: tam ödeme).
4. **Gelecek Aya Devreden Bakiye** (`carryover_balance`) =
   `previous_balance + net_payable - paid_amount`.

### Kullanım

- **Canlı görünüm (HAKEDİŞ DETAYI paneli):** Seçili personel için geçmiş aydan
  devreden bakiye (varsa) ve "Toplam Borç" (bakiye + net maaş) gösterilir.
- **Ayı Kapat & Kaydet:** Artık tek bir onay kutusu yerine, her personel için
  Geçmiş Bakiye / Bu Ay Net Maaş / Toplam Borç / **Ödenen Tutar (düzenlenebilir)**
  / Yeni Bakiye gösteren bir tablo açılır. Varsayılan olarak "Ödenen Tutar" =
  "Toplam Borç" (tam ödeme). Kısmi ödeme yapıldıysa tutarı değiştirin; kalan
  fark otomatik olarak gelecek aya devreden bakiye olarak kaydedilir.
- **Geçmiş Bordrolar:** Tabloya "Geçmiş Bakiye", "Ödenen Tutar" ve "Yeni Bakiye"
  kolonları eklendi.

### Kurulum

`bordro-carryover-balance-migration.sql` dosyasını Supabase SQL Editor'da çalıştırın.
Bu migration `monthly_payroll_summary` tablosuna `previous_balance` ve
`paid_amount` kolonlarını ekler (`carryover_balance` zaten mevcuttur).

## 🆘 Migration Çalıştırılmazsa Ne Olur?

- Eksik çalışma migration'ı çalıştırılmazsa: `shortfall_hours` kolonu bulunamadığı
  için puantaj kaydetme/yükleme hata verebilir.
- Devreden bakiye migration'ı çalıştırılmazsa: geçmiş bakiye sorgusu sessizce 0
  döner (uygulama çökmez), ancak "Ayı Kapat" sırasında `previous_balance` /
  `paid_amount` kaydı hata verebilir.

Her iki migration'ın da çalıştırılması gerekmektedir.
