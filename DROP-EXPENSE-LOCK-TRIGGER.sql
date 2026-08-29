-- 🔧 EXPENSE_LOCK_TRIGGER'ı kaldır veya devre dışı bırak

-- ÇÖZÜM 1: Trigger'ı tamamen SİL (önerilen)
DROP TRIGGER IF EXISTS expense_lock_trigger ON public.bordro_expenses;

-- ÇÖZÜM 2: Trigger'ı sadece DEVRE DIŞI BIRAK (geçici)
-- ALTER TABLE public.bordro_expenses DISABLE TRIGGER expense_lock_trigger;

-- ÇÖZÜM 3: check_expense_lock() fonksiyonunu kontrol et ve değiştir
-- SELECT pg_get_functiondef('check_expense_lock'::regproc);

-- Test: Trigger silindikten sonra DELETE çalışıyor mu?
-- DELETE FROM bordro_expenses WHERE id = 'fcb50c02-1b84-4d4b-9e92-e6b4a2741f4d' RETURNING *;
