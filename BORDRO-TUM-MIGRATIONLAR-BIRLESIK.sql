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
CREATE TABLE IF NOT EXISTS bordro_salary_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES bordro_employees(id) ON DELETE CASCADE,
  agreed_salary DECIMAL(10,2) NOT NULL,
  official_salary DECIMAL(10,2) NOT NULL,
  effective_month INTEGER NOT NULL CHECK (effective_month BETWEEN 0 AND 11),
  effective_year INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  UNIQUE(employee_id, effective_month, effective_year)
);

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
