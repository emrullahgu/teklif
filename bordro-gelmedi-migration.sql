-- BORDRO SİSTEMİNE "GELMEDI" SEÇENEĞİ EKLE
-- Tarih: 2026-02-02
-- Açıklama: bordro_daily_logs tablosuna 'Gelmedi' type'ı eklenir

-- 1. Mevcut CHECK constraint'i kaldır
ALTER TABLE bordro_daily_logs 
DROP CONSTRAINT IF EXISTS bordro_daily_logs_type_check;

-- 2. Yeni CHECK constraint ekle (Gelmedi dahil)
ALTER TABLE bordro_daily_logs 
ADD CONSTRAINT bordro_daily_logs_type_check 
CHECK (type IN ('Normal', 'Pazar', 'Resmi Tatil', 'Raporlu', 'İzinli', 'Gelmedi'));

-- ✅ Şimdi 'Gelmedi' seçeneği kullanılabilir!
