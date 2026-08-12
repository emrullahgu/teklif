-- ============================================================================
-- BORDRO SİSTEMİ - BU SOHBETTE YAPILAN TÜM DEĞİŞİKLİKLER İÇİN TOPLU MİGRATİON
-- ============================================================================
-- Bu dosyayı Supabase Dashboard > SQL Editor içinde TEK SEFERDE çalıştırın.
-- Tüm ALTER/CREATE komutları "IF NOT EXISTS" kullandığı için güvenle
-- birden fazla kez de çalıştırılabilir (hata vermez).
--
-- İçerik:
--   1) Maaş Geçmişi (bordro_salary_history)
--   2) Personel İşten Ayrılış (bordro_employees.termination_date)
--   3) Eksik Çalışma Saati (bordro_daily_logs / monthly_payroll_summary)
--   4) Devreden Bakiye (monthly_payroll_summary)
-- ============================================================================


-- ============================================================================
-- 1) MAAŞ GEÇMİŞİ
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_bordro_salary_history_lookup
  ON bordro_salary_history(employee_id, effective_year DESC, effective_month DESC);

ALTER TABLE bordro_salary_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bordro_salary_history_all_authenticated ON bordro_salary_history;

CREATE POLICY bordro_salary_history_all_authenticated
  ON bordro_salary_history
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Mevcut personellerin şu anki maaşını geriye dönük başlangıç kaydı olarak ekle
-- (agreed_salary/official_salary/effective_month/effective_year henüz NULL olan
-- veya hiç kaydı olmayan personeller için)
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


-- ============================================================================
-- 2) PERSONEL İŞTEN AYRILIŞ
-- ============================================================================
ALTER TABLE bordro_employees
  ADD COLUMN IF NOT EXISTS termination_date DATE;

COMMENT ON COLUMN bordro_employees.termination_date IS
  'İşten ayrılış tarihi. NULL ise personel aktif çalışıyor demektir. Doluysa, bu tarihin ayı DAHİL önceki aylarda personel bordrolarda görünür; sonraki aylarda görünmez. Kayıt SİLİNMEZ.';

CREATE INDEX IF NOT EXISTS idx_bordro_employees_termination_date
  ON bordro_employees(termination_date);


-- ============================================================================
-- 3) EKSİK ÇALIŞMA SAATİ (Fazla mesaiden tamamen ayrı alan)
-- ============================================================================
ALTER TABLE bordro_daily_logs
  ADD COLUMN IF NOT EXISTS shortfall_hours DECIMAL(5,2) DEFAULT 0;

COMMENT ON COLUMN bordro_daily_logs.shortfall_hours IS
  'Planlanan çalışma süresinden eksik çalışılan saat (pozitif değer). overtime_hours alanından tamamen bağımsızdır; aynı gün için ikisi birden dolu olmaz.';

UPDATE bordro_daily_logs SET shortfall_hours = 0 WHERE shortfall_hours IS NULL;

ALTER TABLE monthly_payroll_summary
  ADD COLUMN IF NOT EXISTS shortfall_hours DECIMAL(5,2) DEFAULT 0;

COMMENT ON COLUMN monthly_payroll_summary.shortfall_hours IS
  'O ay için toplam eksik çalışma saati (overtime_hours''tan tamamen ayrı, maaştan kesinti olarak düşülür).';


-- ============================================================================
-- 4) DEVREDEN BAKİYE
-- ============================================================================
ALTER TABLE monthly_payroll_summary
  ADD COLUMN IF NOT EXISTS previous_balance DECIMAL(10,2) DEFAULT 0;

ALTER TABLE monthly_payroll_summary
  ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0;

ALTER TABLE monthly_payroll_summary
  ADD COLUMN IF NOT EXISTS carryover_balance DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN monthly_payroll_summary.previous_balance IS
  'Geçmiş aydan devreden bakiye (bir önceki ayın carryover_balance değeri).';
COMMENT ON COLUMN monthly_payroll_summary.paid_amount IS
  'Bu ay personele fiilen ödenen tutar (hesaplanan net maaştan farklı olabilir).';
COMMENT ON COLUMN monthly_payroll_summary.carryover_balance IS
  'Gelecek aya devreden bakiye = previous_balance + net_payable - paid_amount.';


-- ============================================================================
-- KONTROL SORGULARI (isteğe bağlı, yorum satırlarını kaldırıp çalıştırabilirsiniz)
-- ============================================================================
-- SELECT e.name, h.agreed_salary, h.official_salary, h.effective_month, h.effective_year
-- FROM bordro_salary_history h JOIN bordro_employees e ON e.id = h.employee_id
-- ORDER BY e.name, h.effective_year, h.effective_month;

-- SELECT name, active, termination_date FROM bordro_employees ORDER BY name;

-- SELECT day, month, year, overtime_hours, shortfall_hours FROM bordro_daily_logs ORDER BY year DESC, month DESC, day;

-- SELECT employee_name, month, year, previous_balance, net_payable, paid_amount, carryover_balance
-- FROM monthly_payroll_summary ORDER BY year, month;
