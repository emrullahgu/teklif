-- ============================================================================
-- KULLANICI SİLME: Burkay Doğan (+ Görkem TANIR henüz silinmediyse)
-- ============================================================================
-- Bu dosyayı Supabase Dashboard > SQL Editor içinde çalıştırın.
-- ============================================================================

-- 1) KONTROL (isteğe bağlı, silmeden önce doğrulamak için)
SELECT id, name, email, company, role, approved
FROM users
WHERE id IN ('cb7e2d43-8fc0-417b-b4ba-d134f3f493cd', '043f8e6c-bea1-4cd0-b7e4-c9be6b322e0d');

-- 2) SİLME İŞLEMİ (id ile - en güvenli yöntem, isim eşleşmesine bağlı değil)
DELETE FROM users
WHERE id IN (
  'cb7e2d43-8fc0-417b-b4ba-d134f3f493cd', -- Burkay Doğan
  '043f8e6c-bea1-4cd0-b7e4-c9be6b322e0d'  -- Görkem TANIR (önceki istekten - hâlâ duruyorsa)
);

-- 3) KONTROL: Güncel kullanıcı listesi
SELECT id, name, email, company, role, approved
FROM users
ORDER BY created_at DESC;
