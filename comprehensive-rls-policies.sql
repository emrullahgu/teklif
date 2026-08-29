-- COMPREHENSIVE RLS POLICIES FOR ALL TABLES
-- This migration enables RLS and creates policies for all tables flagged in the security report

-- ============================================================================
-- BORDRO TABLES
-- ============================================================================

-- 1. bordro_employees
ALTER TABLE public.bordro_employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bordro_employees_all_authenticated ON public.bordro_employees;

CREATE POLICY bordro_employees_all_authenticated
  ON public.bordro_employees
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. bordro_daily_logs
ALTER TABLE public.bordro_daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bordro_daily_logs_all_authenticated ON public.bordro_daily_logs;

CREATE POLICY bordro_daily_logs_all_authenticated
  ON public.bordro_daily_logs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. bordro_expenses
ALTER TABLE public.bordro_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bordro_expenses_all_authenticated ON public.bordro_expenses;

CREATE POLICY bordro_expenses_all_authenticated
  ON public.bordro_expenses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. bordro_payment_records
ALTER TABLE public.bordro_payment_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bordro_payment_records_all_authenticated ON public.bordro_payment_records;

CREATE POLICY bordro_payment_records_all_authenticated
  ON public.bordro_payment_records
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- VEHICLE/FUEL TRACKING TABLES
-- ============================================================================

-- 5. vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vehicles_all_authenticated ON public.vehicles;

-- Simple policy: all authenticated users can access all vehicles
CREATE POLICY vehicles_all_authenticated
  ON public.vehicles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. drivers
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS drivers_all_authenticated ON public.drivers;

CREATE POLICY drivers_all_authenticated
  ON public.drivers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. fuel_records
ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fuel_records_all_authenticated ON public.fuel_records;

CREATE POLICY fuel_records_all_authenticated
  ON public.fuel_records
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- WORK TRACKING TABLES
-- ============================================================================

-- 8. is_takip_kayitlar
ALTER TABLE public.is_takip_kayitlar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS is_takip_kayitlar_all_authenticated ON public.is_takip_kayitlar;

CREATE POLICY is_takip_kayitlar_all_authenticated
  ON public.is_takip_kayitlar
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 9. is_takip_calisanlar
ALTER TABLE public.is_takip_calisanlar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS is_takip_calisanlar_all_authenticated ON public.is_takip_calisanlar;

CREATE POLICY is_takip_calisanlar_all_authenticated
  ON public.is_takip_calisanlar
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 10. is_takip_lokasyonlar
ALTER TABLE public.is_takip_lokasyonlar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS is_takip_lokasyonlar_all_authenticated ON public.is_takip_lokasyonlar;

CREATE POLICY is_takip_lokasyonlar_all_authenticated
  ON public.is_takip_lokasyonlar
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 11. is_takip_malzemeler
ALTER TABLE public.is_takip_malzemeler ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS is_takip_malzemeler_all_authenticated ON public.is_takip_malzemeler;

CREATE POLICY is_takip_malzemeler_all_authenticated
  ON public.is_takip_malzemeler
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- OTHER TABLES
-- ============================================================================

-- 12. haftalik_raporlar
ALTER TABLE public.haftalik_raporlar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS haftalik_raporlar_all_authenticated ON public.haftalik_raporlar;

CREATE POLICY haftalik_raporlar_all_authenticated
  ON public.haftalik_raporlar
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 13. urun_takip
ALTER TABLE public.urun_takip ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS urun_takip_all_authenticated ON public.urun_takip;

CREATE POLICY urun_takip_all_authenticated
  ON public.urun_takip
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify RLS is enabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename LIKE 'bordro%' OR tablename LIKE 'is_takip%' OR tablename IN ('vehicles', 'drivers', 'fuel_records', 'haftalik_raporlar', 'urun_takip')
-- ORDER BY tablename;

-- Run this to see all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

