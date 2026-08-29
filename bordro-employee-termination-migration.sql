-- ============================================================================
-- BORDRO PERSONEL İŞTEN AYRILIŞ (TERMINATION) MİGRATİONU
-- ============================================================================
-- AMAÇ:
--   İşten ayrılan personel VERİTABANINDAN SİLİNMEZ. Sadece "işten ayrılış
--   tarihi" (termination_date) girilerek pasif duruma alınır.
--
--   Kural:
--     - termination_date NULL          -> personel hâlâ çalışıyor, HER AYDA görünür.
--     - termination_date DOLU (örn. 2026-07-15) -> personel, bu tarihin
--       bulunduğu AY DAHİL önceki tüm aylarda (Ocak-Temmuz) bordrolarda
--       görünmeye devam eder; bu tarihten SONRAKİ aylarda (Ağustos ve
--       sonrası) yeni bordrolarda ARTIK GÖRÜNMEZ.
--     - Önceki aylardaki maaş, ödeme, mesai, prim ve gider kayıtları hiçbir
--       şekilde silinmez veya değiştirilmez; sadece uygulama arayüzünde
--       hangi ayda hangi personelin listeleneceği bu tarihe göre belirlenir.
--
-- Bu dosyayı Supabase SQL Editor'da bir kez çalıştırmanız yeterlidir.
-- ============================================================================

-- 1. KOLON EKLE
ALTER TABLE bordro_employees
  ADD COLUMN IF NOT EXISTS termination_date DATE;

COMMENT ON COLUMN bordro_employees.termination_date IS
  'İşten ayrılış tarihi. NULL ise personel aktif çalışıyor demektir. Doluysa, bu tarihin ayı DAHİL önceki aylarda personel bordrolarda görünür; sonraki aylarda görünmez. Kayıt SİLİNMEZ.';

-- 2. İNDEKS (Ay bazlı görünürlük filtrelemesi için)
CREATE INDEX IF NOT EXISTS idx_bordro_employees_termination_date
  ON bordro_employees(termination_date);

-- 3. KONTROL
-- SELECT name, active, termination_date FROM bordro_employees ORDER BY name;
