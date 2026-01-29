-- Haftalık Raporlama Tablosu
CREATE TABLE IF NOT EXISTS haftalik_raporlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fabrika_adi TEXT NOT NULL,
  hafta_baslangic DATE NOT NULL,
  hafta_bitis DATE NOT NULL,
  guc_faktoru DECIMAL(5,3) NOT NULL,
  onceki_hafta_guc_faktoru DECIMAL(5,3) NOT NULL,
  hedef_guc_faktoru DECIMAL(5,3) DEFAULT 0.950,
  reaktif_guc DECIMAL(10,2) NOT NULL,
  aktif_guc DECIMAL(10,2) NOT NULL,
  kompanzasyon_durumu TEXT NOT NULL,
  enerji_tuketimi DECIMAL(12,2) NOT NULL,
  maliyet DECIMAL(12,2) NOT NULL,
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_haftalik_raporlar_fabrika ON haftalik_raporlar(fabrika_adi);
CREATE INDEX IF NOT EXISTS idx_haftalik_raporlar_tarih ON haftalik_raporlar(hafta_baslangic, hafta_bitis);
CREATE INDEX IF NOT EXISTS idx_haftalik_raporlar_guc_faktoru ON haftalik_raporlar(guc_faktoru);

-- RLS (Row Level Security) - Basit kurulum için devre dışı
ALTER TABLE haftalik_raporlar DISABLE ROW LEVEL SECURITY;

-- Örnek veriler
INSERT INTO haftalik_raporlar (fabrika_adi, hafta_baslangic, hafta_bitis, guc_faktoru, onceki_hafta_guc_faktoru, hedef_guc_faktoru, reaktif_guc, aktif_guc, kompanzasyon_durumu, enerji_tuketimi, maliyet, notlar) VALUES
('ABC Tekstil Fabrikası', '2026-01-20', '2026-01-26', 0.965, 0.952, 0.950, 280.5, 1850.0, 'Otomatik kompanzasyon sistemi aktif - 4 kademe çalışıyor', 31500.00, 94500.00, 'Güç faktörü hedefin üzerinde, sistem stabil çalışıyor'),
('XYZ Plastik A.Ş.', '2026-01-20', '2026-01-26', 0.923, 0.918, 0.950, 420.8, 2150.0, '3 kademe kompanzasyon devrede, 1 kademe bakımda', 45200.00, 135600.00, 'Bakımdaki kademe hafta sonuna kadar devreye alınacak'),
('DEF Metal Sanayi', '2026-01-20', '2026-01-26', 0.888, 0.895, 0.950, 550.2, 1680.0, 'Manuel kompanzasyon, 2 kademe aktif', 28900.00, 86700.00, 'Güç faktörü düşük, ek kompanzasyon panosu öneriliyor. Reaktif enerji cezası riski mevcut');
