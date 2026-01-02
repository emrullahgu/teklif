# HIZLI BAŞLANGIÇ

## 1️⃣ SUPABASE KURULUMU (ÖNEMLİ!)

### Adım 1: SQL Komutlarını Çalıştırın

1. https://supabase.com adresine gidin ve projenize giriş yapın
2. Sol menüden **SQL Editor** seçin
3. Yeni bir sorgu açın
4. `database-setup.sql` dosyasındaki TÜM kodu kopyalayın
5. **RUN** butonuna basın

✅ Başarılı mesajı görünce kurulum tamamdır!

---

## 2️⃣ PROJEYI BAŞLATIN

Terminal'de:

```bash
npm run dev
```

Tarayıcıda açın:
```
http://localhost:3000/bordro.html
```

---

## 3️⃣ İLK PERSONEL EKLEME

1. **"YENİ PERSONEL"** butonuna tıklayın
2. Bilgileri doldurun:
   - Ad Soyad: Ahmet Yılmaz
   - Anlaşılan Maaş: 45000
   - Resmi Maaş: 17002
3. **KAYDET**

---

## 4️⃣ PUANTAJ GİRİŞİ

1. **"PERSONEL DETAY"** sekmesine geçin
2. Personeli seçin
3. **"OTOMATİK DOLDUR"** butonuna basın
   - Tüm günler standart saatlerle doldurulur
4. İsterseniz manuel düzenleme yapın

---

## 5️⃣ AVANS İŞLEMİ

1. Sol panelde **"AVANS"** butonuna tıklayın
2. Tutarı girin: 5000
3. Otomatik maaştan düşer

---

## 6️⃣ RAPOR GÖRÜNTÜLEME

1. **"GENEL BAKIŞ"** sekmesine geçin
2. Tüm personellerin özet tablosu görünür
3. **"ÖDENECEK"** sütunu nakit ödeme miktarını gösterir

---

## ⚠️ SORUN GİDERME

### Personeller görünmüyor?
- Supabase SQL Editor'da şu komutu çalıştırın:
```sql
SELECT * FROM employees;
```
- Boşsa, SQL kurulumunu tekrar yapın

### Veriler kayboldu?
- Veritabanında kayıtlı! LocalStorage kullanılmıyor
- Sayfayı yenileyin: `Ctrl + R`

### Kayıt olmuyor?
- Browser Console'u açın: `F12`
- Network sekmesinde hata var mı kontrol edin
- Supabase URL ve Key doğru mu kontrol edin

---

## 🎯 HIZLI TEST

1. ✅ Veritabanı kurulumu yapıldı mı?
2. ✅ `npm run dev` çalışıyor mu?
3. ✅ `/bordro.html` sayfası açılıyor mu?
4. ✅ Personel ekleyebildiniz mi?
5. ✅ Puantaj girişi yapabildiniz mi?

**HEPSİ TAMAM MI? BAŞARDINIZ! 🎉**

---

Detaylı kullanım için: **BORDRO-KULLANIM.md**
