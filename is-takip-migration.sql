-- İş Takip Sistemi için tablolar

-- Çalışanlar tablosu
CREATE TABLE IF NOT EXISTS is_takip_calisanlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_soyad TEXT NOT NULL,
  telefon TEXT,
  email TEXT,
  pozisyon TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lokasyonlar/Şantiyeler tablosu
CREATE TABLE IF NOT EXISTS is_takip_lokasyonlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad TEXT NOT NULL,
  adres TEXT,
  koordinat TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Malzemeler/Ekipmanlar tablosu
CREATE TABLE IF NOT EXISTS is_takip_malzemeler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad TEXT NOT NULL,
  kategori TEXT,
  birim TEXT DEFAULT 'Adet',
  stok_durumu INTEGER DEFAULT 0,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İş Kayıtları tablosu
CREATE TABLE IF NOT EXISTS is_takip_kayitlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tarih DATE NOT NULL,
  calisan_id UUID REFERENCES is_takip_calisanlar(id) ON DELETE CASCADE,
  lokasyon_id UUID REFERENCES is_takip_lokasyonlar(id) ON DELETE CASCADE,
  baslangic_saat TIME NOT NULL,
  bitis_saat TIME NOT NULL,
  toplam_sure DECIMAL(10,2),
  yapilan_is TEXT NOT NULL,
  kullanilan_malzemeler UUID[] DEFAULT '{}',
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_is_takip_kayitlar_tarih ON is_takip_kayitlar(tarih);
CREATE INDEX IF NOT EXISTS idx_is_takip_kayitlar_calisan ON is_takip_kayitlar(calisan_id);
CREATE INDEX IF NOT EXISTS idx_is_takip_kayitlar_lokasyon ON is_takip_kayitlar(lokasyon_id);

-- RLS (Row Level Security) - Devre dışı (basit kullanım için)
ALTER TABLE is_takip_calisanlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE is_takip_lokasyonlar DISABLE ROW LEVEL SECURITY;
ALTER TABLE is_takip_malzemeler DISABLE ROW LEVEL SECURITY;
ALTER TABLE is_takip_kayitlar DISABLE ROW LEVEL SECURITY;

-- Örnek veri ekle
INSERT INTO is_takip_calisanlar (ad_soyad, telefon, pozisyon) VALUES
  ('Ahmet Yılmaz', '0532 111 2233', 'Elektrikçi'),
  ('Mehmet Demir', '0533 444 5566', 'Teknisyen'),
  ('Ayşe Kaya', '0534 777 8899', 'Mühendis')
ON CONFLICT DO NOTHING;

INSERT INTO is_takip_lokasyonlar (ad, adres) VALUES
  ('Fabrika A', 'Kemalpaşa OSB, İzmir'),
  ('Şantiye B', 'Çiğli, İzmir'),
  ('Depo C', 'Bornova, İzmir')
ON CONFLICT DO NOTHING;

INSERT INTO is_takip_malzemeler (ad, kategori, birim) VALUES
  ('Kablo', 'Elektrik', 'Metre'),
  ('Sigorta', 'Elektrik', 'Adet'),
  ('Soket', 'Elektrik', 'Adet'),
  ('El Aletleri', 'Alet', 'Set'),
  ('Test Cihazı', 'Ölçüm', 'Adet')
ON CONFLICT DO NOTHING;
