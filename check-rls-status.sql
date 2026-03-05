-- bordro_expenses tablosunun RLS durumunu kontrol et
SELECT 
    tablename, 
    rowsecurity as "RLS Aktif mi?"
FROM pg_tables
WHERE tablename = 'bordro_expenses';

-- Mevcut RLS politikalarını göster
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'bordro_expenses';

-- Tüm RLS politikalarını sil ve RLS'i kapat
DROP POLICY IF EXISTS "Users can view expenses" ON bordro_expenses;
DROP POLICY IF EXISTS "Users can insert expenses" ON bordro_expenses;
DROP POLICY IF EXISTS "Users can update expenses" ON bordro_expenses;
DROP POLICY IF EXISTS "Users can delete expenses" ON bordro_expenses;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON bordro_expenses;
DROP POLICY IF EXISTS "Enable read access for all users" ON bordro_expenses;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON bordro_expenses;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON bordro_expenses;

ALTER TABLE bordro_expenses DISABLE ROW LEVEL SECURITY;

-- Tekrar kontrol et
SELECT 
    tablename, 
    rowsecurity as "RLS Aktif mi (FALSE olmalı)?"
FROM pg_tables
WHERE tablename = 'bordro_expenses';
