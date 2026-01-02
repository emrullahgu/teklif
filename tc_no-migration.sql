-- TC NO KOLON EKLENMESİ (Eski tablolar için)
-- Eğer "Could not find the 'tc_no' column" hatası alıyorsanız bu SQL'i çalıştırın

-- 1. tc_no kolonunu ekle (eğer yoksa)
ALTER TABLE bordro_employees ADD COLUMN IF NOT EXISTS tc_no TEXT;

-- 2. Kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bordro_employees' 
ORDER BY ordinal_position;

-- ✅ Başarılı! Artık tc_no kolonu kullanılabilir.
