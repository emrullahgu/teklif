# 🚪 Bordro Personel İşten Ayrılış (Termination) - Veritabanı Kurulumu

## 🎯 Ne Değişti?

**Eski Sistem (Hatalı):**
- Personel "sil" butonuna basıldığında `active=false` yapılıyordu.
- Personel listesi HER ZAMAN sadece `active=true` olanları çekiyordu.
- Sonuç: İşten ayrılan bir personel, **TÜM aylardan** (geçmiş dahil) anında
  kayboluyordu. Örneğin Temmuz'da işten çıkarılan bir personel, Ocak-Haziran
  bordrolarında da artık görünmüyordu — bu, geçmiş kayıtların "kaybolmuş gibi"
  görünmesine yol açıyordu (veri veritabanında duruyordu ama arayüzde
  gösterilmiyordu).

**Yeni Sistem (Doğru):**
- Personel silinmez; "İşten Çıkar" işlemiyle bir **işten ayrılış tarihi**
  (`termination_date`) girilir.
- Personel, bu tarihin bulunduğu **AY DAHİL önceki tüm aylarda** bordrolarda
  görünmeye devam eder.
- Bu tarihten **SONRAKİ** aylarda (yeni bordrolarda) artık görünmez.
- Örnek: Personel 15 Temmuz 2026'da işten ayrıldıysa → Ocak-Temmuz 2026
  bordrolarında görünmeye devam eder; Ağustos 2026 ve sonrasında görünmez.
- Maaş, mesai, prim, avans/gider kayıtları ASLA silinmez veya değiştirilmez.

## 🚀 Kurulum Adımları

### 1. Supabase Dashboard'a Git
- https://app.supabase.com/ adresine git ve projeni seç.

### 2. SQL Editor'u Aç
- Sol menüden **SQL Editor** → **New query**

### 3. Migration'ı Çalıştır
`bordro-employee-termination-migration.sql` dosyasının tüm içeriğini kopyalayıp
SQL Editor'e yapıştır ve **RUN** butonuna bas.

Bu migration:
- `bordro_employees` tablosuna `termination_date` (DATE, nullable) kolonu ekler,
- Performans için bir index ekler.

Mevcut hiçbir veriyi silmez veya değiştirmez; sadece yeni bir kolon ekler.

### 4. Kontrol Et
```sql
SELECT name, active, termination_date FROM bordro_employees ORDER BY name;
```

## ✅ Kullanım

### Personeli İşten Çıkarma
Özet tablosunda personel satırındaki 🗑️ **"İşten Çıkar"** butonuna basınca açılan
modalde işten ayrılış tarihini girin. Onay adımlarından sonra:
- Personel pasif duruma alınır (`active=false`, `termination_date` set edilir).
- Girilen tarihin ayı dahil önceki aylarda bordrolarda görünmeye devam eder.
- Sonraki aylarda personel listesinde/dropdown'da artık görünmez.

### Yeniden Aktif Etme
Personelin hâlâ göründüğü bir aya gidip (örn. ayrılış ayı veya öncesi),
✏️ **Düzenle** butonuna basın. Eğer personel işten çıkarılmışsa modalde
"🚪 İşten Ayrılış Tarihi" bilgisi ve **"✅ Yeniden Aktif Et"** butonu görünür.
Bu butona basıldığında `termination_date` temizlenir ve personel tekrar tüm
aylarda görünür hale gelir.

## 🆘 Migration Çalıştırılmazsa Ne Olur?

`termination_date` kolonu yoksa, "İşten Çıkar" işlemi veritabanı hatası
verecektir (kolon bulunamadı). Bu özelliği kullanabilmek için migration'ın
çalıştırılması gerekir.
