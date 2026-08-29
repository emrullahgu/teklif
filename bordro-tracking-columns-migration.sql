-- Bordro Daily Logs tablosuna takip kolonları ekleme
-- Bu migration, veri güvenlik sistemi için gerekli alanları ekler

-- 1. Session takip alanı (kim değiştirdi)
ALTER TABLE bordro_daily_logs 
ADD COLUMN IF NOT EXISTS last_modified_by TEXT;

-- 2. Son değişiklik zamanı
ALTER TABLE bordro_daily_logs 
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ;

-- 3. Kayıt oluşturulma zamanı
ALTER TABLE bordro_daily_logs 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Mevcut kayıtlar için created_at'i güncelle
UPDATE bordro_daily_logs 
SET created_at = NOW() 
WHERE created_at IS NULL;

-- 5. Index'ler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_bordro_daily_logs_modified_at 
ON bordro_daily_logs(last_modified_at DESC);

CREATE INDEX IF NOT EXISTS idx_bordro_daily_logs_created_at 
ON bordro_daily_logs(created_at DESC);

-- 6. Yorum ekle
COMMENT ON COLUMN bordro_daily_logs.last_modified_by IS 'Session ID - hangi oturumun değiştirdiğini takip eder';
COMMENT ON COLUMN bordro_daily_logs.last_modified_at IS 'Son değişiklik zamanı - spontan silme tespiti için';
COMMENT ON COLUMN bordro_daily_logs.created_at IS 'Kayıt oluşturulma zamanı - audit trail için';

-- Başarı mesajı
DO $$
BEGIN
  RAISE NOTICE '✅ Bordro tracking kolonları başarıyla eklendi!';
  RAISE NOTICE '   - last_modified_by: Session ID takibi';
  RAISE NOTICE '   - last_modified_at: Değişiklik zamanı';
  RAISE NOTICE '   - created_at: Oluşturulma zamanı';
  RAISE NOTICE '   - Index''ler oluşturuldu';
END $$;
