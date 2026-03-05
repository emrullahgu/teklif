-- TÜM RLS POLİTİKALARINI SİL VE RLS'Yİ KAPAT
-- Bu sorunu kesin çözer

-- Önce tüm politikaları sil
DROP POLICY IF EXISTS bordro_employees_all_access ON public.bordro_employees;
DROP POLICY IF EXISTS bordro_employees_all_authenticated ON public.bordro_employees;
DROP POLICY IF EXISTS bordro_daily_logs_all_access ON public.bordro_daily_logs;
DROP POLICY IF EXISTS bordro_daily_logs_all_authenticated ON public.bordro_daily_logs;
DROP POLICY IF EXISTS bordro_expenses_all_access ON public.bordro_expenses;
DROP POLICY IF EXISTS bordro_expenses_all_authenticated ON public.bordro_expenses;
DROP POLICY IF EXISTS bordro_payment_records_all_access ON public.bordro_payment_records;
DROP POLICY IF EXISTS bordro_payment_records_all_authenticated ON public.bordro_payment_records;

DROP POLICY IF EXISTS vehicles_all_access ON public.vehicles;
DROP POLICY IF EXISTS vehicles_all_authenticated ON public.vehicles;
DROP POLICY IF EXISTS drivers_all_access ON public.drivers;
DROP POLICY IF EXISTS drivers_all_authenticated ON public.drivers;
DROP POLICY IF EXISTS fuel_records_all_access ON public.fuel_records;
DROP POLICY IF EXISTS fuel_records_all_authenticated ON public.fuel_records;

DROP POLICY IF EXISTS is_takip_kayitlar_all_access ON public.is_takip_kayitlar;
DROP POLICY IF EXISTS is_takip_kayitlar_all_authenticated ON public.is_takip_kayitlar;
DROP POLICY IF EXISTS is_takip_calisanlar_all_access ON public.is_takip_calisanlar;
DROP POLICY IF EXISTS is_takip_calisanlar_all_authenticated ON public.is_takip_calisanlar;
DROP POLICY IF EXISTS is_takip_lokasyonlar_all_access ON public.is_takip_lokasyonlar;
DROP POLICY IF EXISTS is_takip_lokasyonlar_all_authenticated ON public.is_takip_lokasyonlar;
DROP POLICY IF EXISTS is_takip_malzemeler_all_access ON public.is_takip_malzemeler;
DROP POLICY IF EXISTS is_takip_malzemeler_all_authenticated ON public.is_takip_malzemeler;

DROP POLICY IF EXISTS haftalik_raporlar_all_access ON public.haftalik_raporlar;
DROP POLICY IF EXISTS haftalik_raporlar_all_authenticated ON public.haftalik_raporlar;
DROP POLICY IF EXISTS urun_takip_all_access ON public.urun_takip;
DROP POLICY IF EXISTS urun_takip_all_authenticated ON public.urun_takip;

-- Sonra RLS'yi kapat
ALTER TABLE public.bordro_employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordro_daily_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordro_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordro_payment_records DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_records DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.is_takip_kayitlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.is_takip_calisanlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.is_takip_lokasyonlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.is_takip_malzemeler DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.haftalik_raporlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.urun_takip DISABLE ROW LEVEL SECURITY;

-- Kontrol: RLS'nin kapalı olduğunu doğrula
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'bordro_employees', 'bordro_daily_logs', 'bordro_expenses', 'bordro_payment_records',
  'vehicles', 'drivers', 'fuel_records',
  'is_takip_kayitlar', 'is_takip_calisanlar', 'is_takip_lokasyonlar', 'is_takip_malzemeler',
  'haftalik_raporlar', 'urun_takip'
)
ORDER BY tablename;
-- Hepsi rowsecurity = false olmalı
