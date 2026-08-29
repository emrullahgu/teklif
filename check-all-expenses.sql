-- 1. TÜM bordro_expenses kayıtlarını kontrol et
SELECT 
    id,
    employee_id,
    type,
    amount,
    description,
    date,
    month,
    year,
    installment_total,
    installment_current
FROM bordro_expenses
ORDER BY date DESC, employee_id
LIMIT 100;

-- 2. Prim kayıtları kaç tane?
SELECT 
    type,
    COUNT(*) as "Kayıt Sayısı",
    SUM(amount) as "Toplam Tutar"
FROM bordro_expenses
GROUP BY type
ORDER BY type;

-- 3. Hangi çalışanlarda kayıt var?
SELECT 
    e.name as "Çalışan",
    COUNT(be.id) as "Kayıt Sayısı",
    COUNT(CASE WHEN be.type = 'Prim' THEN 1 END) as "Prim Sayısı",
    COUNT(CASE WHEN be.type = 'Avans' THEN 1 END) as "Avans Sayısı"
FROM bordro_employees e
LEFT JOIN bordro_expenses be ON e.id = be.employee_id
GROUP BY e.id, e.name
ORDER BY e.name;
