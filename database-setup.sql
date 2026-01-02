-- KOBİNERJİ BORDRO TAKİP SİSTEMİ - SUPABASE TABLOLARI
-- Bu SQL kodlarını Supabase SQL Editor'da çalıştırın

-- 1. PERSONEL TABLOSU
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  agreed_salary DECIMAL(10,2) NOT NULL, -- Anlaşılan Net Maaş
  official_salary DECIMAL(10,2) NOT NULL, -- Resmi SGK Maaşı
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 2. GÜNLÜK PUANTAJ KAYITLARI
CREATE TABLE IF NOT EXISTS daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  day INTEGER NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Normal', 'Pazar', 'Resmi Tatil', 'Raporlu', 'İzinli')),
  start_time TEXT,
  end_time TEXT,
  overtime_hours DECIMAL(5,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, day, month, year)
);

-- 3. GİDERLER VE AVANSLAR
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_daily_logs_employee ON daily_logs(employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_expenses_employee ON expenses(employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(active) WHERE active = true;

-- 5. ROW LEVEL SECURITY (RLS) AKTİFLEŞTİRME
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLİTİKALARI
-- Herkes kendi oluşturduğu verileri görebilir/düzenleyebilir
CREATE POLICY "Users can view their own employees" ON employees
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own employees" ON employees
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own employees" ON employees
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own employees" ON employees
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);

-- Daily logs politikaları
CREATE POLICY "Users can view daily logs" ON daily_logs
  FOR SELECT USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can insert daily logs" ON daily_logs
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update daily logs" ON daily_logs
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete daily logs" ON daily_logs
  FOR DELETE USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

-- Expenses politikaları
CREATE POLICY "Users can view expenses" ON expenses
  FOR SELECT USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can insert expenses" ON expenses
  FOR INSERT WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can update expenses" ON expenses
  FOR UPDATE USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete expenses" ON expenses
  FOR DELETE USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid() OR user_id IS NULL)
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
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. BAŞLANGIÇ VERİLERİ (Örnek - İsteğe bağlı)
-- INSERT INTO employees (name, agreed_salary, official_salary) VALUES
-- ('Azad Balkın', 45000, 17002),
-- ('Harun Hoşaf', 45000, 17002),
-- ('Recep Nurlu', 45000, 17683.74),
-- ('Sercan Tener', 45000, 5894.58),
-- ('Ufuk Güneş', 45000, 17002),
-- ('Mehmet Yılmaz', 45000, 17002),
-- ('Ayşe Demir', 45000, 17002);
