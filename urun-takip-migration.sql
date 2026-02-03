-- Ürün Takip Tablosu Migration
-- Bu dosya Supabase SQL Editor'de çalıştırılmalıdır

-- Ürün takip tablosunu oluştur
CREATE TABLE IF NOT EXISTS urun_takip (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    urun_adi TEXT NOT NULL,
    kategori TEXT NOT NULL,
    marka TEXT,
    model TEXT,
    miktar NUMERIC DEFAULT 0,
    birim TEXT DEFAULT 'Adet',
    lokasyon TEXT,
    aciklama TEXT,
    seri_no TEXT,
    tarih DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_email TEXT NOT NULL
);

-- Index'ler oluştur
CREATE INDEX IF NOT EXISTS idx_urun_takip_kategori ON urun_takip(kategori);
CREATE INDEX IF NOT EXISTS idx_urun_takip_marka ON urun_takip(marka);
CREATE INDEX IF NOT EXISTS idx_urun_takip_lokasyon ON urun_takip(lokasyon);
CREATE INDEX IF NOT EXISTS idx_urun_takip_created_at ON urun_takip(created_at);
CREATE INDEX IF NOT EXISTS idx_urun_takip_user_email ON urun_takip(user_email);

-- Full text search için index
CREATE INDEX IF NOT EXISTS idx_urun_takip_search ON urun_takip 
    USING gin(to_tsvector('turkish', coalesce(urun_adi, '') || ' ' || coalesce(marka, '') || ' ' || coalesce(model, '') || ' ' || coalesce(seri_no, '')));

-- Updated_at otomatik güncelleyen trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_urun_takip_updated_at ON urun_takip;

CREATE TRIGGER update_urun_takip_updated_at
    BEFORE UPDATE ON urun_takip
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS KAPATILDI - Uygulama seviyesinde user_email ile güvenlik sağlanıyor
-- Bu projede custom users tablosu kullanıldığı için Supabase Auth RLS kullanılamıyor
ALTER TABLE urun_takip DISABLE ROW LEVEL SECURITY;

-- Örnek veriler (isteğe bağlı)
-- INSERT INTO urun_takip (urun_adi, kategori, marka, model, miktar, birim, lokasyon, aciklama, seri_no, user_email) VALUES
-- ('Panel 600W', 'Solar Panel', 'JinkoSolar', 'Tiger Pro 600W', 50, 'Adet', 'Depo-A, Raf-3', 'Yüksek verimli monokristal panel', 'JS-600-2024', 'emrullah.gunay@kobinerji.com'),
-- ('Güç İnvertörü', 'İnvertör', 'Huawei', 'SUN2000-10KTL', 5, 'Adet', 'Depo-B, Raf-1', 'Hibrit tip, 10kW', 'HW-INV-001', 'emrullah.gunay@kobinerji.com'),
-- ('NYY Kablo 4x16', 'Kablo', 'Türk Prysmian', '4x16 NYY', 500, 'Metre', 'Depo-C, Rulo-12', 'Topraklı enerji kablosu', 'NYY-4X16-2024', 'emrullah.gunay@kobinerji.com'),
-- ('Sigorta Panosu', 'Elektrik Panosu', 'Schneider', 'PrismaSeT P', 3, 'Adet', 'Depo-A, Raf-5', '24 modül sigorta panosu', 'SCH-PAN-789', 'emrullah.gunay@kobinerji.com');

COMMENT ON TABLE urun_takip IS 'Ürün ve envanter takip sistemi - hangi ürün, nerede, hangi marka, kaç adet';
COMMENT ON COLUMN urun_takip.urun_adi IS 'Ürünün adı';
COMMENT ON COLUMN urun_takip.kategori IS 'Ürün kategorisi (Solar Panel, İnvertör, Kablo, vb.)';
COMMENT ON COLUMN urun_takip.marka IS 'Ürün markası';
COMMENT ON COLUMN urun_takip.model IS 'Ürün modeli';
COMMENT ON COLUMN urun_takip.miktar IS 'Stok miktarı';
COMMENT ON COLUMN urun_takip.birim IS 'Birim (Adet, Kg, Metre, vb.)';
COMMENT ON COLUMN urun_takip.lokasyon IS 'Ürünün bulunduğu fiziksel konum (Depo-A, Raf-3 vb.)';
COMMENT ON COLUMN urun_takip.seri_no IS 'Seri numarası veya lot numarası';
COMMENT ON COLUMN urun_takip.tarih IS 'Kayıt/stok giriş tarihi';
COMMENT ON COLUMN urun_takip.user_email IS 'Ürünü ekleyen kullanıcının email adresi';
