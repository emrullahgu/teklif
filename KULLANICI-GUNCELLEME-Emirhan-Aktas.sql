-- ============================================================================
-- KULLANICI GİRİŞ BİLGİLERİ GÜNCELLEMESİ
-- ============================================================================
-- AMAÇ:
--   1) "Görkem Tanır" ve "İbrahim Çağdaş" isimli kullanıcıların giriş
--      bilgilerini (users tablosundaki kayıtlarını) SİL.
--   2) Yeni bir kullanıcı ekle: Emirhan Aktaş
--        E-posta : aktasemrhn43@gmail.com
--        Şifre   : Kobinerji2026
--
-- Bu dosyayı Supabase Dashboard > SQL Editor içinde çalıştırın.
-- ============================================================================

-- 1) KONTROL: Silmeden önce hangi kayıtların silineceğini görmek isterseniz
-- önce bu SELECT'i çalıştırıp isim/e-posta eşleşmesini doğrulayın:
SELECT id, name, email, company, role, approved
FROM users
WHERE name ILIKE '%Görkem Tanır%' OR name ILIKE '%İbrahim Çağdaş%';

-- 2) SİLME İŞLEMİ
DELETE FROM users
WHERE name ILIKE '%Görkem Tanır%' OR name ILIKE '%İbrahim Çağdaş%';

-- 3) YENİ KULLANICI EKLE: Emirhan Aktaş
-- (Aynı e-posta ile daha önce kayıt varsa hata almamak için önce siliyoruz)
DELETE FROM users WHERE email = 'aktasemrhn43@gmail.com';

INSERT INTO users (name, email, password, company, role, approved)
VALUES (
  'Emirhan Aktaş',
  'aktasemrhn43@gmail.com',
  'Kobinerji2026',
  'Kobinerji',
  'user',
  true
);

-- 4) KONTROL: Sonucu doğrulayın
SELECT id, name, email, company, role, approved
FROM users
ORDER BY created_at DESC;
