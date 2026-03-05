-- ✅ KESIN ÇÖZÜM: bordro_expenses tablosuna tam yetki ver

-- 1. RLS'i kapat
ALTER TABLE bordro_expenses DISABLE ROW LEVEL SECURITY;

-- 2. Tüm yetkiler ver (authenticated role'e)
GRANT ALL PRIVILEGES ON TABLE bordro_expenses TO authenticated;
GRANT ALL PRIVILEGES ON TABLE bordro_expenses TO anon;
GRANT ALL PRIVILEGES ON TABLE bordro_expenses TO service_role;

-- 3. Sequence'lere de yetki ver (varsa)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'bordro_expenses_id_seq') THEN
        GRANT ALL ON SEQUENCE bordro_expenses_id_seq TO authenticated;
        GRANT ALL ON SEQUENCE bordro_expenses_id_seq TO anon;
    END IF;
END $$;

-- 4. Schema'ya da yetki ver
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 5. Kontrol et
SELECT 
    grantee, 
    privilege_type,
    table_schema,
    table_name
FROM information_schema.role_table_grants
WHERE table_name = 'bordro_expenses'
ORDER BY grantee, privilege_type;

-- Sonuç: authenticated ve anon için tüm yetkileri görmelisiniz
-- (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER)
