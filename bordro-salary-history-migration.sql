-- ============================================================================
-- BORDRO MAAŞ GEÇMİŞİ (SALARY HISTORY) MİGRATİONU
-- ============================================================================
-- AMAÇ:
--   Personel maaşı güncellendiğinde SADECE değişikliğin yapıldığı ay ve
--   sonraki aylar etkilensin; ocak-mayıs gibi ÖNCEKİ aylardaki maaş ve
--   hesaplamalar kesinlikle DEĞİŞMESİN.
--
--   Bunun için her maaş değişikliği "geçerlilik başlangıç tarihi" (ay/yıl)
--   ile birlikte ayrı bir satır olarak bordro_salary_history tablosuna
--   kaydedilir. bordro_employees.agreed_salary / official_salary alanları
--   sadece "en güncel/şu anki" maaşı gösteren bir önbellek olarak kalmaya
--   devam eder; hesaplama motoru artık HER ZAMAN bordro_salary_history'den
--   ilgili ay için geçerli olan maaşı okur.
--
-- Bu dosyayı Supabase SQL Editor'da bir kez çalıştırmanız yeterlidir.
-- ============================================================================

-- 1. TABLO
-- 🔒 NOT: CREATE TABLE IF NOT EXISTS + ayrı ayrı ADD COLUMN IF NOT EXISTS
-- kullanılıyor. Böylece tablo daha önce (eksik/farklı kolonlarla) kısmen
-- oluşturulmuş olsa bile eksik kolonlar güvenle tamamlanır ve
-- "column ... does not exist" hatası alınmaz.
CREATE TABLE IF NOT EXISTS bordro_salary_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES bordro_employees(id) ON DELETE CASCADE
);

ALTER TABLE bordro_salary_history ADD COLUMN IF NOT EXISTS agreed_salary DECIMAL(10,2);
ALTER TABLE bordro_salary_history ADD COLUMN IF NOT EXISTS official_salary DECIMAL(10,2);
ALTER TABLE bordro_salary_history ADD COLUMN IF NOT EXISTS effective_month INTEGER;
ALTER TABLE bordro_salary_history ADD COLUMN IF NOT EXISTS effective_year INTEGER;
ALTER TABLE bordro_salary_history ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE bordro_salary_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE bordro_salary_history ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 🔒 GENEL GÜVENLİK: Tablo daha önce (bizim bilmediğimiz) FARKLI bir şemayla
-- oluşturulmuş olabilir ve "effective_date" gibi bizim doldurmadığımız,
-- NOT NULL + varsayılan değersiz ekstra bir kolona sahip olabilir (bu durumda
-- INSERT "null value ... violates not-null constraint" hatası verir).
-- Aşağıdaki blok, id/employee_id DIŞINDA varsayılan değeri olmayan TÜM
-- NOT NULL kolonları otomatik olarak nullable yapar; böylece hangi ekstra
-- kolon olursa olsun INSERT güvenle çalışır.
DO $$
DECLARE
  col RECORD;
BEGIN
  FOR col IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'bordro_salary_history'
      AND is_nullable = 'NO'
      AND column_default IS NULL
      AND column_name NOT IN ('id', 'employee_id')
  LOOP
    EXECUTE format('ALTER TABLE bordro_salary_history ALTER COLUMN %I DROP NOT NULL', col.column_name);
  END LOOP;
END $$;

-- effective_month için CHECK kısıtı (yoksa ekle)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bordro_salary_history_effective_month_check'
  ) THEN
    ALTER TABLE bordro_salary_history
      ADD CONSTRAINT bordro_salary_history_effective_month_check
      CHECK (effective_month BETWEEN 0 AND 11);
  END IF;
END $$;

-- Personel + ay + yıl için UNIQUE kısıtı (yoksa ekle)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bordro_salary_history_unique'
  ) THEN
    ALTER TABLE bordro_salary_history
      ADD CONSTRAINT bordro_salary_history_unique
      UNIQUE (employee_id, effective_month, effective_year);
  END IF;
END $$;

-- 2. İNDEKS (Bir personelin belirli bir ay için geçerli maaşını hızlı bulmak için)
CREATE INDEX IF NOT EXISTS idx_bordro_salary_history_lookup
  ON bordro_salary_history(employee_id, effective_year DESC, effective_month DESC);

-- 3. ROW LEVEL SECURITY
ALTER TABLE bordro_salary_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bordro_salary_history_all_authenticated ON bordro_salary_history;

CREATE POLICY bordro_salary_history_all_authenticated
  ON bordro_salary_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. GEÇMİŞ VERİ TAŞIMA (BACKFILL)
-- Mevcut personellerin ŞU ANKİ maaşını, personelin oluşturulma tarihinden
-- itibaren geçerliymiş gibi başlangıç (baseline) kaydı olarak ekle.
-- Böylece migration öncesi oluşturulmuş personeller için de sistem hemen
-- doğru çalışmaya başlar; ilk zam/güncelleme yapıldığında yeni bir satır
-- eklenecek ve sadece o tarihten sonrası etkilenecektir.
INSERT INTO bordro_salary_history (employee_id, agreed_salary, official_salary, effective_month, effective_year, note)
SELECT
  e.id,
  e.agreed_salary,
  e.official_salary,
  (EXTRACT(MONTH FROM COALESCE(e.created_at, NOW()))::INTEGER - 1),
  EXTRACT(YEAR FROM COALESCE(e.created_at, NOW()))::INTEGER,
  'Otomatik: Migration ile oluşturulan başlangıç kaydı'
FROM bordro_employees e
WHERE NOT EXISTS (
  SELECT 1 FROM bordro_salary_history h WHERE h.employee_id = e.id
);

-- 5. KONTROL
-- SELECT e.name, h.agreed_salary, h.official_salary, h.effective_month, h.effective_year
-- FROM bordro_salary_history h JOIN bordro_employees e ON e.id = h.employee_id
-- ORDER BY e.name, h.effective_year, h.effective_month;
