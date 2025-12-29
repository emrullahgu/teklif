# 🚀 Supabase Kurulum Rehberi

## 1. Supabase Hesabı Oluşturun

1. https://supabase.com adresine gidin
2. "Start your project" butonuna tıklayın
3. GitHub hesabınızla giriş yapın

## 2. Yeni Proje Oluşturun

1. "New Project" butonuna tıklayın
2. Proje adı: `teklif-kobinerji` (veya istediğiniz isim)
3. Database şifresi: Güçlü bir şifre belirleyin (kaydedin!)
4. Region: Europe West (Frankfurt) - Türkiye'ye en yakın
5. "Create new project" butonuna tıklayın
6. ⏳ 1-2 dakika bekleyin (proje hazırlanıyor)

## 3. API Bilgilerini Alın

1. Sol menüden **Settings** > **API** sekmesine gidin
2. Şu bilgileri kopyalayın:
   - **Project URL**: `https://xxxxxxxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhY....`

## 4. .env Dosyası Oluşturun

Proje kök dizininde `.env` dosyası oluşturun:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ DİKKAT:** `.env` dosyası `.gitignore`'da olmalı (gizli bilgiler!)

## 5. Veritabanı Tablosunu Oluşturun

1. Sol menüden **SQL Editor** sekmesine gidin
2. "New query" butonuna tıklayın
3. Aşağıdaki SQL kodunu yapıştırın:

```sql
-- Kullanıcılar tablosu
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  company TEXT,
  role TEXT DEFAULT 'user',
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- İndeksler (performans için)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_approved ON users(approved);
CREATE INDEX idx_users_role ON users(role);

-- Row Level Security (RLS) politikalarını devre dışı bırak (basit auth için)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Tüm işlemlere izin ver (development için, production'da düzelt!)
CREATE POLICY "Allow all operations for now" ON users FOR ALL USING (true);

-- Updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. "RUN" butonuna tıklayın
5. ✅ "Success. No rows returned" mesajını görmelisiniz

## 6. Netlify Environment Variables

Netlify'da environment variables ekleyin:

1. Netlify Dashboard > Site settings > Build & deploy > Environment
2. "Add variable" butonuna tıklayın:
   - Key: `VITE_SUPABASE_URL`
   - Value: Supabase Project URL'iniz
3. "Add variable" tekrar:
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: Supabase anon key'iniz
4. "Save" butonuna tıklayın
5. "Trigger deploy" ile yeniden deploy edin

## 7. Test Edin

1. Admin ile giriş yapın:
   - E-posta: `emrullah.gunay@kobinerji.com`
   - Şifre: `Eg8502Eg.`

2. Yeni kullanıcı oluşturun
3. Supabase Dashboard > Table Editor > users tablosuna gidin
4. Kullanıcının veritabanında göründüğünü kontrol edin

## 8. Veritabanını Görüntüleme

Sol menüden **Table Editor** > **users** tablosuna tıklayın
- Tüm kullanıcıları görebilirsiniz
- Manuel olarak düzenleyebilirsiniz
- SQL sorguları çalıştırabilirsiniz

## 🎉 Tamamlandı!

Artık authentication sisteminiz:
- ✅ Gerçek veritabanında çalışıyor
- ✅ Her cihazdan erişilebilir
- ✅ Veriler kalıcı
- ✅ Ölçeklenebilir

## 🔒 Güvenlik Notları (Production için)

1. **RLS Politikalarını düzeltin**: Şu an herkes her şeyi yapabiliyor
2. **Şifreleri hash'leyin**: bcrypt kullanın
3. **API Key'leri gizleyin**: Backend'de saklayın
4. **Rate limiting**: Supabase otomatik yapıyor
5. **HTTPS**: Netlify otomatik sağlıyor

## 🆘 Sorun Giderme

### "Supabase bilgileri eksik" hatası
- `.env` dosyasını kontrol edin
- `npm run dev` komutunu yeniden çalıştırın (env değişiklikleri için)

### "relation "users" does not exist" hatası
- SQL kodunu doğru çalıştırdınız mı?
- Table Editor'da users tablosu var mı?

### Netlify'da çalışmıyor
- Environment variables'ı eklediniz mi?
- Deploy'u tekrar tetiklediniz mi?
