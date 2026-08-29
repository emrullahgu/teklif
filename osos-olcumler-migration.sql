-- OSOS Ölçüm Verileri Tablosu
CREATE TABLE IF NOT EXISTS osos_olcumler (
  id BIGSERIAL PRIMARY KEY,
  fabrika_adi TEXT,
  sayac_no TEXT,
  
  -- Güç Parametreleri
  aktif_guc DECIMAL(10, 2),           -- kW
  reaktif_guc DECIMAL(10, 2),         -- kVAr
  kapasitif_guc DECIMAL(10, 2),       -- kVAr
  gorunen_guc DECIMAL(10, 2),         -- kVA
  
  -- Gerilim (3 Faz)
  gerilim_l1 DECIMAL(10, 2),          -- Volt
  gerilim_l2 DECIMAL(10, 2),          -- Volt
  gerilim_l3 DECIMAL(10, 2),          -- Volt
  
  -- Akım (3 Faz)
  akim_l1 DECIMAL(10, 2),             -- Amper
  akim_l2 DECIMAL(10, 2),             -- Amper
  akim_l3 DECIMAL(10, 2),             -- Amper
  
  -- Diğer Parametreler
  guc_faktoru DECIMAL(5, 3),          -- cos φ (0-1)
  frekans DECIMAL(5, 2),              -- Hz
  toplam_enerji DECIMAL(15, 2),       -- kWh (kümülatif)
  
  -- Metadata
  olcum_zamani TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler (hızlı sorgulama için)
CREATE INDEX IF NOT EXISTS idx_osos_fabrika ON osos_olcumler(fabrika_adi);
CREATE INDEX IF NOT EXISTS idx_osos_sayac ON osos_olcumler(sayac_no);
CREATE INDEX IF NOT EXISTS idx_osos_tarih ON osos_olcumler(olcum_zamani DESC);
CREATE INDEX IF NOT EXISTS idx_osos_created ON osos_olcumler(created_at DESC);

-- RLS (Row Level Security) politikalarını etkinleştir
ALTER TABLE osos_olcumler ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Herkes OSOS verilerini görebilir" 
  ON osos_olcumler FOR SELECT 
  USING (true);

-- Herkes ekleyebilir (OSOS API'si için)
CREATE POLICY "Herkes OSOS verisi ekleyebilir" 
  ON osos_olcumler FOR INSERT 
  WITH CHECK (true);

-- Herkes güncelleyebilir
CREATE POLICY "Herkes OSOS verisi güncelleyebilir" 
  ON osos_olcumler FOR UPDATE 
  USING (true);

-- Herkes silebilir
CREATE POLICY "Herkes OSOS verisi silebilir" 
  ON osos_olcumler FOR DELETE 
  USING (true);

-- Updated_at otomatik güncellemesi için trigger
CREATE OR REPLACE FUNCTION update_osos_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_osos_olcumler_updated_at BEFORE UPDATE ON osos_olcumler
FOR EACH ROW EXECUTE FUNCTION update_osos_updated_at_column();

-- Örnek veri (test için)
-- INSERT INTO osos_olcumler (
--   fabrika_adi, sayac_no,
--   aktif_guc, reaktif_guc, kapasitif_guc, gorunen_guc,
--   gerilim_l1, gerilim_l2, gerilim_l3,
--   akim_l1, akim_l2, akim_l3,
--   guc_faktoru, frekans, toplam_enerji,
--   olcum_zamani
-- ) VALUES (
--   'Test Fabrika', '123456789',
--   125.50, 35.20, 15.80, 135.75,
--   228.5, 227.8, 229.2,
--   155.3, 158.7, 152.1,
--   0.92, 50.02, 25432.75,
--   NOW()
-- );
