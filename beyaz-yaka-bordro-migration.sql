-- BEYAZ YAKA BORDRO SİSTEMİ - Maaşlı Çalışanlar için
-- Bu SQL kodlarını Supabase SQL Editor'da çalıştırın
-- ÖNEMLİ: Admin ve yetkililer tüm çalışanları görebilir ve yönetebilir!

-- 1. BEYAZ YAKA ÇALIŞANLAR TABLOSU
CREATE TABLE IF NOT EXISTS beyaz_yaka_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tc_no TEXT,
  email TEXT,
  phone TEXT,
  position TEXT, -- Pozisyon/Ünvan
  department TEXT, -- Departman
  start_date DATE NOT NULL, -- İşe Başlama Tarihi
  monthly_salary DECIMAL(10,2) NOT NULL, -- Aylık Net Maaş
  gross_salary DECIMAL(10,2), -- Brüt Maaş
  sgk_base DECIMAL(10,2), -- SGK Matrahı
  active BOOLEAN DEFAULT true,
  bank_name TEXT, -- Banka Adı
  iban TEXT, -- IBAN
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. AYLIK BORDRO KAYITLARI
CREATE TABLE IF NOT EXISTS beyaz_yaka_monthly_payroll (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES beyaz_yaka_employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  
  -- Hakediş Kalemleri
  base_salary DECIMAL(10,2) NOT NULL, -- Temel Maaş
  overtime_pay DECIMAL(10,2) DEFAULT 0, -- Mesai Ücreti
  bonus DECIMAL(10,2) DEFAULT 0, -- Prim
  meal_allowance DECIMAL(10,2) DEFAULT 0, -- Yemek Yardımı
  transport_allowance DECIMAL(10,2) DEFAULT 0, -- Ulaşım Yardımı
  other_earnings DECIMAL(10,2) DEFAULT 0, -- Diğer Kazançlar
  
  -- Kesinti Kalemleri
  advance_deduction DECIMAL(10,2) DEFAULT 0, -- Avans Kesintisi
  sgk_employee DECIMAL(10,2) DEFAULT 0, -- SGK İşçi Payı
  unemployment_employee DECIMAL(10,2) DEFAULT 0, -- İşsizlik İşçi Payı
  income_tax DECIMAL(10,2) DEFAULT 0, -- Gelir Vergisi
  stamp_tax DECIMAL(10,2) DEFAULT 0, -- Damga Vergisi
  other_deductions DECIMAL(10,2) DEFAULT 0, -- Diğer Kesintiler
  
  -- Net Ödeme
  net_payment DECIMAL(10,2) NOT NULL, -- Net Ödenen Tutar
  
  -- İşveren Maliyeti
  sgk_employer DECIMAL(10,2) DEFAULT 0, -- SGK İşveren Payı
  unemployment_employer DECIMAL(10,2) DEFAULT 0, -- İşsizlik İşveren Payı
  total_employer_cost DECIMAL(10,2), -- Toplam İşveren Maliyeti
  
  -- Çalışma Bilgileri
  worked_days INTEGER DEFAULT 0, -- Çalışılan Gün
  total_days INTEGER DEFAULT 30, -- Toplam Gün
  paid_leave_days INTEGER DEFAULT 0, -- Ücretli İzin Günü
  unpaid_leave_days INTEGER DEFAULT 0, -- Ücretsiz İzin Günü
  sick_leave_days INTEGER DEFAULT 0, -- Raporlu Gün
  
  -- Ödeme Bilgileri
  payment_date DATE, -- Ödeme Tarihi
  payment_method TEXT, -- Ödeme Yöntemi (Banka, Nakit, vb.)
  is_paid BOOLEAN DEFAULT false, -- Ödendi mi?
  
  notes TEXT, -- Notlar
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(employee_id, month, year)
);

-- 3. AVANS VE EK ÖDEMELER
CREATE TABLE IF NOT EXISTS beyaz_yaka_advances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES beyaz_yaka_employees(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  advance_date DATE NOT NULL,
  description TEXT,
  
  -- Taksit Bilgileri
  installment_count INTEGER DEFAULT 1, -- Toplam Taksit Sayısı
  remaining_installments INTEGER, -- Kalan Taksit Sayısı
  monthly_deduction DECIMAL(10,2), -- Aylık Kesinti Tutarı
  
  is_fully_paid BOOLEAN DEFAULT false, -- Tamamen Ödendi mi?
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. İZİN TAKİBİ
CREATE TABLE IF NOT EXISTS beyaz_yaka_leaves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES beyaz_yaka_employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('Yıllık İzin', 'Mazeret İzni', 'Ücretsiz İzin', 'Hastalık İzni', 'Doğum İzni', 'Evlilik İzni', 'Vefat İzni')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT true,
  description TEXT,
  status TEXT DEFAULT 'Onaylandı' CHECK (status IN ('Beklemede', 'Onaylandı', 'Reddedildi')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PRİM VE BONUS KAYITLARI
CREATE TABLE IF NOT EXISTS beyaz_yaka_bonuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES beyaz_yaka_employees(id) ON DELETE CASCADE,
  bonus_type TEXT NOT NULL, -- Prim Türü (Performans, Satış, Yıl Sonu, vb.)
  amount DECIMAL(10,2) NOT NULL,
  bonus_date DATE NOT NULL,
  month INTEGER, -- Hangi ayın bordrosuna eklenecek
  year INTEGER,
  description TEXT,
  is_applied BOOLEAN DEFAULT false, -- Bordroya eklendi mi?
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. İNDEKSLER (Performans için)
CREATE INDEX IF NOT EXISTS idx_beyaz_yaka_payroll_employee ON beyaz_yaka_monthly_payroll(employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_beyaz_yaka_advances_employee ON beyaz_yaka_advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_beyaz_yaka_leaves_employee ON beyaz_yaka_leaves(employee_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_beyaz_yaka_bonuses_employee ON beyaz_yaka_bonuses(employee_id, month, year);
CREATE INDEX IF NOT EXISTS idx_beyaz_yaka_employees_active ON beyaz_yaka_employees(active) WHERE active = true;

-- 7. ROW LEVEL SECURITY (RLS) AKTİFLEŞTİRME
ALTER TABLE beyaz_yaka_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyaz_yaka_monthly_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyaz_yaka_advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyaz_yaka_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE beyaz_yaka_bonuses ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLİTİKALARI (Admin ve yetkililer tüm kayıtları görebilir)
-- Employees tablosu
CREATE POLICY "Users can view white collar employees" ON beyaz_yaka_employees
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert white collar employees" ON beyaz_yaka_employees
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update white collar employees" ON beyaz_yaka_employees
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete white collar employees" ON beyaz_yaka_employees
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Payroll tablosu
CREATE POLICY "Users can view white collar payroll" ON beyaz_yaka_monthly_payroll
  FOR SELECT USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can insert white collar payroll" ON beyaz_yaka_monthly_payroll
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update white collar payroll" ON beyaz_yaka_monthly_payroll
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete white collar payroll" ON beyaz_yaka_monthly_payroll
  FOR DELETE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- Advances tablosu
CREATE POLICY "Users can view white collar advances" ON beyaz_yaka_advances
  FOR SELECT USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can insert white collar advances" ON beyaz_yaka_advances
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update white collar advances" ON beyaz_yaka_advances
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete white collar advances" ON beyaz_yaka_advances
  FOR DELETE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- Leaves tablosu
CREATE POLICY "Users can view white collar leaves" ON beyaz_yaka_leaves
  FOR SELECT USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can insert white collar leaves" ON beyaz_yaka_leaves
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update white collar leaves" ON beyaz_yaka_leaves
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete white collar leaves" ON beyaz_yaka_leaves
  FOR DELETE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- Bonuses tablosu
CREATE POLICY "Users can view white collar bonuses" ON beyaz_yaka_bonuses
  FOR SELECT USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can insert white collar bonuses" ON beyaz_yaka_bonuses
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update white collar bonuses" ON beyaz_yaka_bonuses
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete white collar bonuses" ON beyaz_yaka_bonuses
  FOR DELETE USING (
    employee_id IN (SELECT id FROM beyaz_yaka_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- 9. GÜNCELLENMİŞ ZAMANI OTOMATİK GÜNCELLEME FONKSİYONU
CREATE OR REPLACE FUNCTION update_beyaz_yaka_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. TRİGGERLAR
CREATE TRIGGER update_beyaz_yaka_employees_updated_at
  BEFORE UPDATE ON beyaz_yaka_employees
  FOR EACH ROW EXECUTE FUNCTION update_beyaz_yaka_updated_at();

CREATE TRIGGER update_beyaz_yaka_payroll_updated_at
  BEFORE UPDATE ON beyaz_yaka_monthly_payroll
  FOR EACH ROW EXECUTE FUNCTION update_beyaz_yaka_updated_at();

CREATE TRIGGER update_beyaz_yaka_advances_updated_at
  BEFORE UPDATE ON beyaz_yaka_advances
  FOR EACH ROW EXECUTE FUNCTION update_beyaz_yaka_updated_at();

CREATE TRIGGER update_beyaz_yaka_leaves_updated_at
  BEFORE UPDATE ON beyaz_yaka_leaves
  FOR EACH ROW EXECUTE FUNCTION update_beyaz_yaka_updated_at();

CREATE TRIGGER update_beyaz_yaka_bonuses_updated_at
  BEFORE UPDATE ON beyaz_yaka_bonuses
  FOR EACH ROW EXECUTE FUNCTION update_beyaz_yaka_updated_at();

-- Kurulum Tamamlandı!
-- Artık beyaz yaka bordro sistemini kullanmaya başlayabilirsiniz.
