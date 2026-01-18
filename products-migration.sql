-- Ürünler tablosu oluştur
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  original_name TEXT, -- Güncellenen ürünler için orijinal isim
  is_new BOOLEAN DEFAULT false, -- Yeni eklenen ürün mü?
  is_active BOOLEAN DEFAULT true, -- Silinmiş mi?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- RLS (Row Level Security) politikaları
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Herkes ürünleri görüntüleyebilir"
  ON products FOR SELECT
  USING (true);

-- Herkes ekleyebilir
CREATE POLICY "Herkes ürün ekleyebilir"
  ON products FOR INSERT
  WITH CHECK (true);

-- Herkes güncelleyebilir
CREATE POLICY "Herkes ürün güncelleyebilir"
  ON products FOR UPDATE
  USING (true);

-- Herkes silebilir (soft delete)
CREATE POLICY "Herkes ürün silebilir"
  ON products FOR DELETE
  USING (true);
