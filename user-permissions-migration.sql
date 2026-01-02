-- KULLANICI YETKİLERİ İÇİN MIGRATION
-- Supabase SQL Editor'da çalıştırın

-- 1. users tablosuna bordro yetkisi kolonu ekle
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_access_bordro BOOLEAN DEFAULT false;

-- 2. Mevcut admin kullanıcılara otomatik bordro yetkisi ver
UPDATE users 
SET can_access_bordro = true 
WHERE role = 'admin' OR email = 'emrullah.gunay@kobinerji.com';

-- 3. Kontrol et
SELECT email, role, approved, can_access_bordro 
FROM users 
ORDER BY created_at DESC;

-- ✅ Başarılı! Artık kullanıcılar için bordro yetkisi yönetilebilir.
