-- RLS'i devre dışı bırak (Supabase Auth kullanmadığımız için)
-- Bu dosyayı Supabase Dashboard > SQL Editor'de çalıştırın

-- Önce mevcut politikaları kaldır
DROP POLICY IF EXISTS "Users can view their own employees" ON bordro_employees;
DROP POLICY IF EXISTS "Users can insert their own employees" ON bordro_employees;
DROP POLICY IF EXISTS "Users can update their own employees" ON bordro_employees;
DROP POLICY IF EXISTS "Users can delete their own employees" ON bordro_employees;

DROP POLICY IF EXISTS "Users can view daily logs" ON bordro_daily_logs;
DROP POLICY IF EXISTS "Users can insert daily logs" ON bordro_daily_logs;
DROP POLICY IF EXISTS "Users can update daily logs" ON bordro_daily_logs;
DROP POLICY IF EXISTS "Users can delete daily logs" ON bordro_daily_logs;

DROP POLICY IF EXISTS "Users can view expenses" ON bordro_expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON bordro_expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON bordro_expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON bordro_expenses;

-- RLS'i devre dışı bırak
ALTER TABLE bordro_employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE bordro_daily_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE bordro_expenses DISABLE ROW LEVEL SECURITY;

-- Herkes için tam erişim sağla (public schema üzerinden)
-- Not: Bu sadece anon key ile yapılan isteklerde çalışır
GRANT ALL ON bordro_employees TO anon;
GRANT ALL ON bordro_daily_logs TO anon;
GRANT ALL ON bordro_expenses TO anon;

GRANT ALL ON bordro_employees TO authenticated;
GRANT ALL ON bordro_daily_logs TO authenticated;
GRANT ALL ON bordro_expenses TO authenticated;
