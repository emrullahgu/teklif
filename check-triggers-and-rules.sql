-- 🔍 BORDRO_EXPENSES tablosunda trigger veya rule var mı kontrol et

-- 1. Tüm trigger'ları göster
SELECT 
    tgname AS trigger_name,
    tgtype AS trigger_type,
    tgenabled AS enabled,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgrelid = 'public.bordro_expenses'::regclass
  AND tgisinternal = false;

-- 2. Tüm rule'ları göster  
SELECT 
    rulename AS rule_name,
    ev_type AS event_type,
    ev_enabled AS enabled,
    pg_get_ruledef(oid) AS rule_definition
FROM pg_rewrite
WHERE ev_class = 'public.bordro_expenses'::regclass
  AND rulename != '_RETURN';

-- 3. Table'ın owner'ını kontrol et
SELECT tableowner 
FROM pg_tables 
WHERE tablename = 'bordro_expenses' AND schemaname = 'public';

-- 4. DİREKT SQL DELETE DENEMESİ (manuel test için)
-- ÖNCE bir test kaydı seç:
SELECT id, type, amount, description 
FROM bordro_expenses 
WHERE type = 'Prim' 
LIMIT 1;

-- Sonra o ID'yi buraya yaz ve çalıştır:
-- DELETE FROM bordro_expenses WHERE id = 'BURAYA-ID-YAZ' RETURNING *;
