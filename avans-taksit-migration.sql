-- AVANS TAKSİT ÖZELLİĞİ EKLEMESİ
-- Bu SQL kodlarını Supabase SQL Editor'da çalıştırın

-- 1. bordro_expenses tablosuna taksit kolonları ekle
ALTER TABLE bordro_expenses 
ADD COLUMN IF NOT EXISTS installment_total INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS installment_current INTEGER DEFAULT 1;

-- 2. Mevcut avansları tek taksitli yap
UPDATE bordro_expenses 
SET installment_total = 1, installment_current = 1 
WHERE installment_total IS NULL;

-- 3. Check constraint ekle (taksit numarası toplam taksit sayısından büyük olamaz)
ALTER TABLE bordro_expenses 
ADD CONSTRAINT check_installment_valid 
CHECK (installment_current <= installment_total AND installment_current > 0 AND installment_total > 0);

-- 4. Yorum ekle
COMMENT ON COLUMN bordro_expenses.installment_total IS 'Toplam taksit sayısı (örn: 3)';
COMMENT ON COLUMN bordro_expenses.installment_current IS 'Şu anki taksit numarası (örn: 1)';
