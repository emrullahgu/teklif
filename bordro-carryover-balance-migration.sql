-- ============================================================================
-- BORDRO DEVREDEN BAKİYE (CARRYOVER BALANCE) MİGRATİONU
-- ============================================================================
-- AMAÇ:
--   Her aylık bordroda şu 4 alan bulunmalıdır:
--     1. Geçmiş aydan devreden bakiye   -> previous_balance
--     2. Bu ay hesaplanan net maaş      -> net_payable (zaten mevcut)
--     3. Bu ay personele ödenen gerçek tutar -> paid_amount
--     4. Gelecek aya devreden bakiye    -> carryover_balance (zaten mevcut)
--
--   Formül: carryover_balance = previous_balance + net_payable - paid_amount
--
--   Örnek: Geçmiş bakiye 0 TL, bu ay net maaş 90.000 TL, personele fiilen
--   85.000 TL ödendiyse -> gelecek aya devreden bakiye = 5.000 TL (personele
--   borç). Bir sonraki ay bu 5.000 TL, o ayın "Geçmiş Aydan Devreden Bakiye"
--   alanına otomatik olarak taşınır.
--
-- Bu dosyayı Supabase SQL Editor'da bir kez çalıştırmanız yeterlidir.
-- ============================================================================

ALTER TABLE monthly_payroll_summary
  ADD COLUMN IF NOT EXISTS previous_balance DECIMAL(10,2) DEFAULT 0;

ALTER TABLE monthly_payroll_summary
  ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10,2) DEFAULT 0;

-- carryover_balance kolonu database-setup.sql'de zaten mevcuttur
-- (yoksa aşağıdaki satır ekler):
ALTER TABLE monthly_payroll_summary
  ADD COLUMN IF NOT EXISTS carryover_balance DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN monthly_payroll_summary.previous_balance IS
  'Geçmiş aydan devreden bakiye (bir önceki ayın carryover_balance değeri).';
COMMENT ON COLUMN monthly_payroll_summary.paid_amount IS
  'Bu ay personele fiilen ödenen tutar (hesaplanan net maaştan farklı olabilir).';
COMMENT ON COLUMN monthly_payroll_summary.carryover_balance IS
  'Gelecek aya devreden bakiye = previous_balance + net_payable - paid_amount.';

-- KONTROL:
-- SELECT employee_name, month, year, previous_balance, net_payable, paid_amount, carryover_balance
-- FROM monthly_payroll_summary ORDER BY year, month;
