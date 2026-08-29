# 🛡️ Bordro Veri Güvenlik Sistemi - Veritabanı Kurulumu

## ⚠️ ACİL: Migration Çalıştırılması Gerekiyor!

Yeni güvenlik katmanları için veritabanına yeni kolonlar eklenmesi gerekiyor.

## 🚀 Kurulum Adımları

### 1. Supabase Dashboard'a Git
- https://app.supabase.com/ adresine git
- Projeyi seç: `ctylfbmukmoxpzwzeffr`

### 2. SQL Editor'u Aç
- Sol menüden **SQL Editor** tıkla
- **New query** butonuna tıkla

### 3. Migration SQL'i Yapıştır
Aşağıdaki dosyanın içeriğini kopyala ve SQL Editor'e yapıştır:
```
bordro-tracking-columns-migration.sql
```

Veya direkt bu SQL'i çalıştır:

```sql
-- Bordro Daily Logs tablosuna takip kolonları ekleme
ALTER TABLE bordro_daily_logs 
ADD COLUMN IF NOT EXISTS last_modified_by TEXT;

ALTER TABLE bordro_daily_logs 
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ;

ALTER TABLE bordro_daily_logs 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Mevcut kayıtlar için created_at'i güncelle
UPDATE bordro_daily_logs 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_bordro_daily_logs_modified_at 
ON bordro_daily_logs(last_modified_at DESC);

CREATE INDEX IF NOT EXISTS idx_bordro_daily_logs_created_at 
ON bordro_daily_logs(created_at DESC);
```

### 4. Çalıştır
- **RUN** butonuna tıkla (veya Ctrl+Enter)
- Başarılı olduğunu doğrula

### 5. Kontrol Et
Kolonların eklendiğini doğrula:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bordro_daily_logs' 
AND column_name IN ('last_modified_by', 'last_modified_at', 'created_at');
```

Sonuç şöyle olmalı:
```
last_modified_by    | text
last_modified_at    | timestamp with time zone
created_at          | timestamp with time zone
```

## ✅ Tamamlandıktan Sonra

Migration tamamlandıktan sonra:
1. Sayfayı yenile (F5)
2. Bordro sistemini aç
3. Bir puantaj gir ve kaydet
4. Hata almamalısın!

## 🛡️ Yeni Özellikler

Migration'dan sonra aktif olacak özellikler:
- ✅ Her değişiklik için session ID kaydı
- ✅ Değişiklik zamanı takibi
- ✅ Kayıt oluşturulma zamanı
- ✅ Spontan silme algılama (10 saniyede bir)
- ✅ Otomatik geri yükleme
- ✅ Değişiklik geçmişi

## 🆘 Sorun Giderme

**Hata: "permission denied"**
- Supabase'de admin yetkileriniz olduğundan emin olun

**Hata: "relation does not exist"**
- Tablo adını kontrol edin: `bordro_daily_logs`
- Doğru projeye bağlandığınızdan emin olun

**Hata: "column already exists"**
- Normal, kolon zaten varsa hata vermeden devam eder (IF NOT EXISTS)

## 📊 Migration Detayları

**Eklenen Kolonlar:**
- `last_modified_by` (TEXT) - Session ID'yi saklar
- `last_modified_at` (TIMESTAMPTZ) - Son değişiklik zamanı
- `created_at` (TIMESTAMPTZ) - Kayıt oluşturulma zamanı

**Eklenen Index'ler:**
- `idx_bordro_daily_logs_modified_at` - Hızlı değişiklik sorguları için
- `idx_bordro_daily_logs_created_at` - Hızlı tarih sorguları için

**Etkilenen Kayıtlar:**
- Mevcut tüm kayıtlar `created_at = NOW()` ile güncellenir
- Yeni kayıtlar otomatik olarak timestamp alır
