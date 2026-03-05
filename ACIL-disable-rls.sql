-- ACİL: RLS'yi devre dışı bırak - Kayıtları geri getir
-- Bu SQL'i Supabase'de hemen çalıştırın!

ALTER TABLE public.bordro_daily_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordro_employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordro_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordro_payment_records DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.is_takip_kayitlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.is_takip_calisanlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.is_takip_lokasyonlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.is_takip_malzemeler DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.haftalik_raporlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.urun_takip DISABLE ROW LEVEL SECURITY;

-- Kayıtlarınız şimdi geri gelmelidir!
