# CORS Hatası Çözümü - Bordro Takip Sistemi

## Sorun
BordroTakip sisteminde Supabase'e veri kaydederken CORS hatası alınıyor:
```
Access to fetch at 'https://ctylfbmukmoxpzwzeffr.supabase.co/rest/v1/bordro_daily_logs...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

## Neden Oluyor?
Veritabanı tablolarında Row Level Security (RLS) aktif ve `auth.uid()` kontrolü yapılıyor, ancak uygulama Supabase Authentication kullanmıyor. Bu yüzden authentication olmadan yapılan istekler reddediliyor.

## Çözüm Adımları

### 1. Supabase Dashboard'a Giriş Yapın
- https://supabase.com/dashboard adresine gidin
- Projenizi seçin (ctylfbmukmoxpzwzeffr)

### 2. SQL Editor'ı Açın
- Sol menüden **SQL Editor** seçeneğine tıklayın
- **New Query** butonuna tıklayın

### 3. Migration SQL'i Çalıştırın
`disable-rls-migration.sql` dosyasının içeriğini kopyalayıp SQL Editor'a yapıştırın ve **Run** butonuna tıklayın.

Bu işlem:
- ✅ Mevcut RLS politikalarını kaldırır
- ✅ RLS'i devre dışı bırakır  
- ✅ Anon ve authenticated rollere tam erişim verir

### 4. Alternatif: Manuel RLS Kapatma

Eğer SQL dosyasını çalıştırmak istemezseniz, her tablo için manuel olarak:

1. **Table Editor** > Tablonuzu seçin
2. **⚙️ Settings** > **Policies** sekmesine gidin
3. **Disable RLS** butonuna tıklayın
4. Bunu `bordro_employees`, `bordro_daily_logs` ve `bordro_expenses` tabloları için tekrarlayın

## Güvenlik Notu

⚠️ **ÖNEMLİ**: RLS devre dışı bırakıldığında tablolarınız herkese açık olur. 

Üretim ortamı için güvenlik önerileri:
1. Supabase Authentication ekleyin
2. RLS politikalarını yeniden aktifleştirin
3. API anahtarlarını environment variables'da saklayın
4. Rate limiting ekleyin

## Doğrulama

SQL migration'ı çalıştırdıktan sonra:
1. Tarayıcıyı yenileyin (Ctrl + Shift + R ile hard refresh)
2. Console'u açın (F12)
3. BordroTakip'te bir değişiklik yapın
4. "✅ Puantaj kaydedildi" mesajını görmelisiniz

## Hala Sorun mu Yaşıyorsunuz?

Eğer hala CORS hatası alıyorsanız:

1. **Supabase API Settings Kontrolü**:
   - Dashboard > Settings > API
   - "URL Configuration" bölümünde site URL'inizi kontrol edin
   - `http://localhost:3000` ekli olduğundan emin olun

2. **Browser Cache Temizleme**:
   ```
   Ctrl + Shift + Delete > Önbelleği temizle
   ```

3. **Anon Key Kontrolü**:
   `src/supabaseClient.js` dosyasındaki anon key'in doğru olduğunu kontrol edin.

## Yardım

Sorun devam ederse konsoldan tam hata mesajını paylaşın:
```javascript
// Chrome DevTools Console (F12)
// Kırmızı hata mesajını kopyalayın
```
