-- RLS POLİTİKALARI - ANON VE AUTHENTICATED ROLLER İÇİN
-- Bu hem giriş yapan hem yapmayan kullanıcılar için çalışır

-- BORDRO TABLOLARI
ALTER TABLE public.bordro_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordro_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordro_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordro_payment_records ENABLE ROW LEVEL SECURITY;

-- Eski politikaları sil
DROP POLICY IF EXISTS bordro_employees_all_authenticated ON public.bordro_employees;
DROP POLICY IF EXISTS bordro_daily_logs_all_authenticated ON public.bordro_daily_logs;
DROP POLICY IF EXISTS bordro_expenses_all_authenticated ON public.bordro_expenses;
DROP POLICY IF EXISTS bordro_payment_records_all_authenticated ON public.bordro_payment_records;

-- Yeni politikalar - anon ve authenticated için
CREATE POLICY bordro_employees_all_access ON public.bordro_employees
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY bordro_daily_logs_all_access ON public.bordro_daily_logs
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY bordro_expenses_all_access ON public.bordro_expenses
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY bordro_payment_records_all_access ON public.bordro_payment_records
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ARAÇ/YAKIT TAKİP TABLOLARI
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vehicles_all_authenticated ON public.vehicles;
DROP POLICY IF EXISTS drivers_all_authenticated ON public.drivers;
DROP POLICY IF EXISTS fuel_records_all_authenticated ON public.fuel_records;

CREATE POLICY vehicles_all_access ON public.vehicles
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY drivers_all_access ON public.drivers
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY fuel_records_all_access ON public.fuel_records
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- İŞ TAKİP TABLOLARI
ALTER TABLE public.is_takip_kayitlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.is_takip_calisanlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.is_takip_lokasyonlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.is_takip_malzemeler ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS is_takip_kayitlar_all_authenticated ON public.is_takip_kayitlar;
DROP POLICY IF EXISTS is_takip_calisanlar_all_authenticated ON public.is_takip_calisanlar;
DROP POLICY IF EXISTS is_takip_lokasyonlar_all_authenticated ON public.is_takip_lokasyonlar;
DROP POLICY IF EXISTS is_takip_malzemeler_all_authenticated ON public.is_takip_malzemeler;

CREATE POLICY is_takip_kayitlar_all_access ON public.is_takip_kayitlar
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY is_takip_calisanlar_all_access ON public.is_takip_calisanlar
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY is_takip_lokasyonlar_all_access ON public.is_takip_lokasyonlar
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY is_takip_malzemeler_all_access ON public.is_takip_malzemeler
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- DİĞER TABLOLAR
ALTER TABLE public.haftalik_raporlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urun_takip ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS haftalik_raporlar_all_authenticated ON public.haftalik_raporlar;
DROP POLICY IF EXISTS urun_takip_all_authenticated ON public.urun_takip;

CREATE POLICY haftalik_raporlar_all_access ON public.haftalik_raporlar
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY urun_takip_all_access ON public.urun_takip
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- BAŞARILI! Artık hem giriş yapan hem yapmayan kullanıcılar erişebilir
