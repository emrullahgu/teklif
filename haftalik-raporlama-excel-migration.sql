-- Haftalık Raporlama Tablosuna Excel Verisi Kolonu Ekleme
-- Bu script, haftalik_raporlar tablosuna excel_data kolonu ekler

-- Excel verisi için JSON kolonu ekle
ALTER TABLE haftalik_raporlar 
ADD COLUMN IF NOT EXISTS excel_data JSONB;

-- Excel enerji türü kolonu ekle
ALTER TABLE haftalik_raporlar 
ADD COLUMN IF NOT EXISTS excel_enerji_turu VARCHAR(20);

-- Excel kolon adı ekle
ALTER TABLE haftalik_raporlar 
ADD COLUMN IF NOT EXISTS excel_kolon VARCHAR(100);

-- OSOS özet tablosu kolonu ekle
ALTER TABLE haftalik_raporlar 
ADD COLUMN IF NOT EXISTS osos_ozet_tablo JSONB;

-- Kolon açıklamaları ekle
COMMENT ON COLUMN haftalik_raporlar.excel_data IS 'OSOS Excel raporundan import edilen saatlik enerji tüketim verileri (JSON formatında)';
COMMENT ON COLUMN haftalik_raporlar.excel_enerji_turu IS 'Excel verisinin enerji türü: aktif, enduktif, kapasitif';
COMMENT ON COLUMN haftalik_raporlar.excel_kolon IS 'Excel dosyasında kullanılan veri kolonu adı';
COMMENT ON COLUMN haftalik_raporlar.osos_ozet_tablo IS 'OSOS özet tablosu - Endeks kodları, açıklamalar ve tüketim verileri (JSON formatında)';

-- Örnek veri yapısı:
-- [
--   {
--     "tarih": "2026-01-15",
--     "saat": "08:00",
--     "okunan_endeks": 3334.976,
--     "carpan": 1380,
--     "hesaplanmis_endeks": 4602266.88,
--     "tuketim": 77.28,
--     "enerji_turu": "aktif"
--   },
--   ...
-- ]

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_haftalik_raporlar_excel_data 
ON haftalik_raporlar USING GIN (excel_data);

CREATE INDEX IF NOT EXISTS idx_haftalik_raporlar_enerji_turu 
ON haftalik_raporlar (excel_enerji_turu);

CREATE INDEX IF NOT EXISTS idx_haftalik_raporlar_osos_tablo 
ON haftalik_raporlar USING GIN (osos_ozet_tablo);

-- Enerji türü için check constraint (önce varsa kaldır, sonra ekle)
ALTER TABLE haftalik_raporlar
DROP CONSTRAINT IF EXISTS chk_enerji_turu;

ALTER TABLE haftalik_raporlar
ADD CONSTRAINT chk_enerji_turu 
CHECK (excel_enerji_turu IS NULL OR excel_enerji_turu IN ('aktif', 'enduktif', 'kapasitif'));

-- Excel verisi olan raporları sorgulama örneği:
-- SELECT fabrika_adi, hafta_baslangic, excel_enerji_turu,
--        jsonb_array_length(excel_data) as veri_sayisi
-- FROM haftalik_raporlar 
-- WHERE excel_data IS NOT NULL;

-- Enerji türüne göre toplam tüketim:
-- SELECT excel_enerji_turu, 
--        COUNT(*) as rapor_sayisi,
--        SUM((SELECT SUM((elem->>'tuketim')::numeric) 
--             FROM jsonb_array_elements(excel_data) elem)) as toplam_tuketim
-- FROM haftalik_raporlar
-- WHERE excel_data IS NOT NULL
-- GROUP BY excel_enerji_turu;

-- Aktif, endüktif ve kapasitif enerjileri karşılaştırma:
-- SELECT fabrika_adi, hafta_baslangic,
--        CASE excel_enerji_turu
--          WHEN 'aktif' THEN 'Aktif Enerji (kWh)'
--          WHEN 'enduktif' THEN 'Reaktif Endüktif (kVArh)'
--          WHEN 'kapasitif' THEN 'Reaktif Kapasitif (kVArh)'
--        END as enerji_turu_text,
--        (SELECT SUM((elem->>'tuketim')::numeric) 
--         FROM jsonb_array_elements(excel_data) elem) as toplam_tuketim
-- FROM haftalik_raporlar
-- WHERE excel_data IS NOT NULL
-- ORDER BY hafta_baslangic DESC;

-- OSOS özet tablosundan aktif enerji çekme:
-- SELECT fabrika_adi, hafta_baslangic,
--        (SELECT (elem->>'tuketim')::numeric 
--         FROM jsonb_array_elements(osos_ozet_tablo) elem 
--         WHERE elem->>'endeks_kodu' = '1.8.0') as aktif_enerji,
--        (SELECT (elem->>'tuketim')::numeric 
--         FROM jsonb_array_elements(osos_ozet_tablo) elem 
--         WHERE elem->>'endeks_kodu' = '5.8.0') as enduktif_reaktif,
--        (SELECT (elem->>'tuketim')::numeric 
--         FROM jsonb_array_elements(osos_ozet_tablo) elem 
--         WHERE elem->>'endeks_kodu' = '8.8.0') as kapasitif_reaktif
-- FROM haftalik_raporlar
-- WHERE osos_ozet_tablo IS NOT NULL
-- ORDER BY hafta_baslangic DESC;

-- Reaktif enerji oranlarını kontrol etme:
-- SELECT fabrika_adi, hafta_baslangic,
--        (SELECT (elem->>'durum')::text 
--         FROM jsonb_array_elements(osos_ozet_tablo) elem 
--         WHERE elem->>'endeks_kodu' = '5.8.0') as enduktif_durum,
--        (SELECT (elem->>'durum')::text 
--         FROM jsonb_array_elements(osos_ozet_tablo) elem 
--         WHERE elem->>'endeks_kodu' = '8.8.0') as kapasitif_durum
-- FROM haftalik_raporlar
-- WHERE osos_ozet_tablo IS NOT NULL
-- ORDER BY hafta_baslangic DESC;
