-- ============================================================================
-- BORDRO EKSİK ÇALIŞMA (SHORTFALL) SAATİ MİGRATİONU
-- ============================================================================
-- AMAÇ:
--   Personel planlanan çalışma süresinden AZ çalıştıysa, bu "eksik saat"
--   fazla mesai saatinden TAMAMEN AYRI bir alanda tutulmalıdır. Eksik saat,
--   saatlik ücret üzerinden (mesai katsayısı UYGULANMADAN) maaştan düşülür;
--   fazla mesai ise saatlik ücret x mesai katsayısı ile maaşa eklenir.
--   Bu iki kavram ASLA aynı kolonda veya aynı işaret (+/-) ile yönetilmez.
--
-- Bu dosyayı Supabase SQL Editor'da bir kez çalıştırmanız yeterlidir.
-- ============================================================================

ALTER TABLE bordro_daily_logs
  ADD COLUMN IF NOT EXISTS shortfall_hours DECIMAL(5,2) DEFAULT 0;

COMMENT ON COLUMN bordro_daily_logs.shortfall_hours IS
  'Planlanan çalışma süresinden eksik çalışılan saat (pozitif değer). overtime_hours alanından tamamen bağımsızdır; aynı gün için ikisi birden dolu olmaz.';

-- Mevcut kayıtlar için varsayılan değer
UPDATE bordro_daily_logs SET shortfall_hours = 0 WHERE shortfall_hours IS NULL;

-- Aylık özet tablosuna da eksik çalışma saati toplamı eklenir (overtime_hours ile simetrik)
ALTER TABLE monthly_payroll_summary
  ADD COLUMN IF NOT EXISTS shortfall_hours DECIMAL(5,2) DEFAULT 0;

COMMENT ON COLUMN monthly_payroll_summary.shortfall_hours IS
  'O ay için toplam eksik çalışma saati (overtime_hours''tan tamamen ayrı, maaştan kesinti olarak düşülür).';

-- KONTROL:
-- SELECT day, month, year, overtime_hours, shortfall_hours FROM bordro_daily_logs ORDER BY year DESC, month DESC, day;
