# 🚀 BORDRO TAKİP SİSTEMİ - SUPABASE KURULUM REHBERİ

## 📋 ÖNEMLİ NOT

Şu anda **400 Bad Request** hataları alıyorsunuz çünkü Supabase veritabanı tabloları henüz oluşturulmamış veya yanlış isimlendirilmiş.

## ⚠️ HATALAR

```
Failed to load resource: the server responded with a status of 400
bordro_daily_logs - Puantaj kayıt hatası
bordro_employees - Personel kayıt hatası
```

## ✅ ÇÖZÜM: VERITABANI TABLOLARINI OLUŞTURUN

### Adım 1: Supabase Dashboard'a Gidin

1. [https://supabase.com](https://supabase.com) adresine gidin
2. Projenizi açın (`ctylfbmukmoxpzwzeffr`)
3. Sol menüden **SQL Editor** seçeneğini tıklayın

### Adım 2: SQL Komutlarını Çalıştırın

`database-setup.sql` dosyasındaki SQL kodlarını **sırayla** çalıştırın:

#### 1. PERSONEL TABLOSU

```sql
CREATE TABLE IF NOT EXISTS bordro_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  tc_no TEXT,
  agreed_salary DECIMAL(10,2) NOT NULL,
  official_salary DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
```

#### 2. GÜNLÜK PUANTAJ KAYITLARI

```sql
CREATE TABLE IF NOT EXISTS bordro_daily_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES bordro_employees(id) ON DELETE CASCADE,
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
```

#### 3. GİDERLER VE AVANSLAR

```sql
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
```

#### 4. AYLIK BORDRO ÖZETİ (Geçmiş Bordrolar)

```sql
CREATE TABLE IF NOT EXISTS monthly_payroll_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES bordro_employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  employee_name TEXT NOT NULL,
  agreed_salary DECIMAL(10,2),
  official_salary DECIMAL(10,2),
  days_worked INTEGER,
  sunday_days INTEGER,
  overtime_hours DECIMAL(5,2),
  advances DECIMAL(10,2),
  expenses DECIMAL(10,2),
  bonuses DECIMAL(10,2),
  net_payable DECIMAL(10,2),
  hand_pay DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, month, year)
);
```

#### 5. AKTİVİTE LOGLARI

```sql
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  action_type TEXT NOT NULL,
  module TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. İNDEKSLER (Performans)

```sql
CREATE INDEX IF NOT EXISTS idx_bordro_daily_logs_employee ON bordro_daily_logs(employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_bordro_expenses_employee ON bordro_expenses(employee_id, year, month);
CREATE INDEX IF NOT EXISTS idx_bordro_employees_active ON bordro_employees(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_payroll_summary ON monthly_payroll_summary(employee_id, year, month);
```

#### 7. ROW LEVEL SECURITY (RLS)

```sql
-- RLS Aktifleştir
ALTER TABLE bordro_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE bordro_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bordro_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_payroll_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Politikalar (Herkes kendi verilerini görebilir)
CREATE POLICY "Users can manage their own employees" ON bordro_employees
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can manage daily logs" ON bordro_daily_logs
  FOR ALL USING (
    employee_id IN (SELECT id FROM bordro_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can manage expenses" ON bordro_expenses
  FOR ALL USING (
    employee_id IN (SELECT id FROM bordro_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can view monthly summaries" ON monthly_payroll_summary
  FOR SELECT USING (
    employee_id IN (SELECT id FROM bordro_employees WHERE user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can manage activity logs" ON activity_logs
  FOR ALL USING (auth.uid() = user_id);
```

#### 8. TRIGGER (Otomatik Tarih Güncelleme)

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bordro_employees_updated_at 
  BEFORE UPDATE ON bordro_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bordro_daily_logs_updated_at 
  BEFORE UPDATE ON bordro_daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bordro_expenses_updated_at 
  BEFORE UPDATE ON bordro_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Adım 3: Tabloları Kontrol Edin

SQL Editor'da şu komutu çalıştırarak tabloların oluştuğunu doğrulayın:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'bordro_%';
```

**Beklenen Çıktı:**
- bordro_employees
- bordro_daily_logs
- bordro_expenses
- monthly_payroll_summary
- activity_logs

### Adım 4: Uygulamayı Yenileyin

1. Tarayıcıyı tamamen yenileyin (Ctrl+F5 veya Cmd+Shift+R)
2. Tekrar giriş yapın
3. Personel ekleyip test edin

## 🔍 SORUN GİDERME

### Hala Hata Alıyorsanız:

#### 1. RLS Politikalarını Geçici Olarak Devre Dışı Bırakın

```sql
ALTER TABLE bordro_employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE bordro_daily_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE bordro_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_payroll_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
```

#### 2. API Anahtarlarını Kontrol Edin

`src/supabaseClient.js` dosyasındaki:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

değerlerinin doğru olduğundan emin olun.

#### 3. Eski Tabloları Temizleyin (Varsa)

```sql
-- DİKKAT: Bu komut tüm verileri SİLER!
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS daily_logs CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
```

## 📊 VERİTABANI YAPISI

```
bordro_employees (Personel)
├── id (UUID)
├── name (TEXT)
├── tc_no (TEXT)
├── agreed_salary (DECIMAL)
├── official_salary (DECIMAL)
└── active (BOOLEAN)

bordro_daily_logs (Puantaj)
├── id (UUID)
├── employee_id (UUID → bordro_employees)
├── day, month, year (INTEGER)
├── type (TEXT: Normal/Pazar/Tatil/Raporlu/İzinli)
├── start_time, end_time (TEXT)
├── overtime_hours (DECIMAL)
└── description (TEXT)

bordro_expenses (Gider/Avans/Prim)
├── id (UUID)
├── employee_id (UUID → bordro_employees)
├── type (TEXT: Avans/Gider/Prim)
├── amount (DECIMAL)
└── date (DATE)

monthly_payroll_summary (Geçmiş Bordrolar)
├── id (UUID)
├── employee_id (UUID → bordro_employees)
├── month, year (INTEGER)
├── days_worked, overtime_hours (INTEGER/DECIMAL)
└── net_payable, hand_pay (DECIMAL)

activity_logs (Kullanıcı Hareketleri)
├── id (UUID)
├── user_id (UUID → auth.users)
├── action_type (TEXT: login/create/update/export)
└── created_at (TIMESTAMP)
```

## ✅ BAŞARILI KURULUM KONTROL LİSTESİ

- [ ] 5 tablo oluşturuldu
- [ ] İndeksler eklendi
- [ ] RLS politikaları ayarlandı
- [ ] Trigger fonksiyonları çalışıyor
- [ ] Uygulama yenilendi ve hata yok

## 📞 DESTEK

Hala sorun yaşıyorsanız, Supabase Dashboard'da:
1. **Database** → **Tables** bölümünden tabloları manuel kontrol edin
2. **Logs** → **API** bölümünden detaylı hata mesajlarını inceleyin
