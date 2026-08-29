-- Migration to enable Row Level Security (RLS) on all public tables
-- This fixes Supabase linter errors for RLS Disabled in Public and Policy Exists RLS Disabled

-- Enable RLS on bordro tables
-- Note: bordro_balance might be an alias or view - see bordro-balance-rls-fix.sql if needed
ALTER TABLE public.bordro_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordro_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordro_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bordro_payment_records ENABLE ROW LEVEL SECURITY;

-- Enable RLS on vehicle/fuel tracking tables
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on work tracking tables
ALTER TABLE public.is_takip_kayitlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.is_takip_calisanlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.is_takip_lokasyonlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.is_takip_malzemeler ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other tables
ALTER TABLE public.haftalik_raporlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.urun_takip ENABLE ROW LEVEL SECURITY;

-- Note: This migration ONLY enables RLS. You must also create policies!
-- See comprehensive-rls-policies.sql for complete policy definitions

-- WARNING: After running this migration, tables without policies will block all access
-- Run comprehensive-rls-policies.sql immediately after to add the necessary policies

-- For more information on RLS policies, see:
-- https://supabase.com/docs/guides/database/database-linter
