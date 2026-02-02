-- KOBİNERJİ BORDRO TAKİP SİSTEMİ - SUPABASE TABLOLARI
-- Bu SQL kodlarını Supabase SQL Editor'da çalıştırın

-- 1. PERSONEL TABLOSU
CREATE TABLE IF NOT EXISTS bordro_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tc_no TEXT,
  agreed_salary DECIMAL(10,2) NOT NULL, -- Anlaşılan Net Maaş
  official_salary DECIMAL(10,2) NOT NULL, -- Resmi SGK Maaşı
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. GÜNLÜK PUANTAJ KAYITLARI
CREATE TABLE IF NOT EXISTS bordro_daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES bordro_employees(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Normal', 'Pazar', 'Resmi Tatil', 'Raporlu', 'İzinli', 'Gelmedi')),
  start_time TEXT,
  end_time TEXT,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, day, month, year)
);

-- 3. GİDERLER VE AVANSLAR
CREATE TABLE IF NOT EXISTS bordro_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES bordro_employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Avans', 'Gider', 'Prim')),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. İNDEKSLER (Performans için)
CREATE INDEX IF NOT EXISTS idx_bordro_daily_logs_employee ON bordro_daily_logs(employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_bordro_expenses_employee ON bordro_expenses(employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_bordro_employees_active ON bordro_employees(active) WHERE active = true;

-- 5. ROW LEVEL SECURITY (RLS) AKTİFLEŞTİRME
ALTER TABLE bordro_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE bordro_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bordro_expenses ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLİTİKALARI
-- Herkes kendi oluşturduğu verileri görebilir/düzenleyebilir
CREATE POLICY "Users can view their own employees" ON bordro_employees
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own employees" ON bordro_employees
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own employees" ON bordro_employees
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own employees" ON bordro_employees
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Daily logs politikaları
CREATE POLICY "Users can view daily logs" ON bordro_daily_logs
  FOR SELECT USING (
    employee_id IN (SELECT id FROM bordro_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can insert daily logs" ON bordro_daily_logs
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM bordro_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update daily logs" ON bordro_daily_logs
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM bordro_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete daily logs" ON bordro_daily_logs
  FOR DELETE USING (
    employee_id IN (SELECT id FROM bordro_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- Expenses politikaları
CREATE POLICY "Users can view expenses" ON bordro_expenses
  FOR SELECT USING (
    employee_id IN (SELECT id FROM bordro_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can insert expenses" ON bordro_expenses
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM bordro_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update expenses" ON bordro_expenses
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM bordro_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete expenses" ON bordro_expenses
  FOR DELETE USING (
    employee_id IN (SELECT id FROM bordro_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- 7. TRIGGER FONKSİYONU (Updated_at otomatik güncelleme)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger'ları oluştur
CREATE TRIGGER update_bordro_employees_updated_at BEFORE UPDATE ON bordro_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bordro_daily_logs_updated_at BEFORE UPDATE ON bordro_daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bordro_expenses_updated_at BEFORE UPDATE ON bordro_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. AYLIK BORDRO ÖZETİ TABLOSU (Geçmiş bordroları kaydetmek için)
CREATE TABLE IF NOT EXISTS monthly_payroll_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES bordro_employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  employee_name TEXT NOT NULL,
  agreed_salary DECIMAL(10,2) NOT NULL,
  official_salary DECIMAL(10,2) NOT NULL,
  days_worked INTEGER DEFAULT 0,
  sunday_days INTEGER DEFAULT 0,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  advances DECIMAL(10,2) DEFAULT 0,
  expenses DECIMAL(10,2) DEFAULT 0,
  bonuses DECIMAL(10,2) DEFAULT 0,
  net_payable DECIMAL(10,2) NOT NULL,
  hand_pay DECIMAL(10,2) NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(employee_id, month, year)
);

-- İndeks oluştur
CREATE INDEX IF NOT EXISTS idx_monthly_payroll_date ON monthly_payroll_summary(year, month);
CREATE INDEX IF NOT EXISTS idx_monthly_payroll_employee ON monthly_payroll_summary(employee_id);

-- RLS aktifleştir
ALTER TABLE monthly_payroll_summary ENABLE ROW LEVEL SECURITY;

-- RLS politikaları
CREATE POLICY "Users can view their own payroll summary" ON monthly_payroll_summary
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own payroll summary" ON monthly_payroll_summary
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own payroll summary" ON monthly_payroll_summary
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own payroll summary" ON monthly_payroll_summary
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- 10. AKTİVİTE LOG TABLOSU (Tüm kullanıcı işlemlerini kaydet)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  module TEXT NOT NULL, -- 'bordro', 'teklif', 'fatura', 'login' vs.
  related_id TEXT, -- İlgili kayıt ID'si (opsiyonel)
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON activity_logs(module, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(created_at DESC);

-- RLS aktifleştir
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS politikaları - Herkes kendi loglarını görebilir
CREATE POLICY "Users can view their own logs" ON activity_logs
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 11. BAŞLANGIÇ VERİLERİ (Örnek - İsteğe bağlı)
-- INSERT INTO employees (name, agreed_salary, official_salary) VALUES
-- ('Azad Balkın', 45000, 17002),
-- ('Harun Hoşaf', 45000, 17002),
-- ('Recep Nurlu', 45000, 17683.74),
-- ('Sercan Tener', 45000, 5894.58),
-- ('Ufuk Güneş', 45000, 17002),
-- ('Mehmet Yılmaz', 45000, 17002),
-- ('Ayşe Demir', 45000, 17002);
