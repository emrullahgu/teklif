# AVANS TAKSİT ÖZELLİĞİ - SUPABASE KURULUM

## ⚠️ ÖNEMLİ: Veritabanı Migration Gerekli!

Avans taksit özelliğini kullanabilmek için Supabase veritabanınıza yeni kolonlar eklemeniz gerekiyor.

## Kurulum Adımları:

### 1. Supabase Dashboard'a Girin
- https://supabase.com adresine gidin
- Projenizi açın (ctylfbmukmoxpzwzeffr)

### 2. SQL Editor'ı Açın
- Sol menüden **SQL Editor** seçeneğine tıklayın
- **New query** butonuna tıklayın

### 3. Migration SQL'ini Çalıştırın
Aşağıdaki SQL kodunu kopyalayıp SQL Editor'a yapıştırın ve **RUN** butonuna basın:

```sql
-- AVANS TAKSİT ÖZELLİĞİ EKLEMESİ

-- 1. bordro_expenses tablosuna taksit kolonları ekle
ALTER TABLE bordro_expenses 
ADD COLUMN IF NOT EXISTS installment_total INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS installment_current INTEGER DEFAULT 1;

-- 2. Mevcut avansları tek taksitli yap
UPDATE bordro_expenses 
SET installment_total = 1, installment_current = 1 
WHERE installment_total IS NULL;

-- 3. Check constraint ekle (taksit numarası toplam taksit sayısından büyük olamaz)
ALTER TABLE bordro_expenses 
ADD CONSTRAINT check_installment_valid 
CHECK (installment_current <= installment_total AND installment_current > 0 AND installment_total > 0);

-- 4. Yorum ekle
COMMENT ON COLUMN bordro_expenses.installment_total IS 'Toplam taksit sayısı (örn: 3)';
COMMENT ON COLUMN bordro_expenses.installment_current IS 'Şu anki taksit numarası (örn: 1)';
```

### 4. Başarı Kontrolü
SQL çalıştıktan sonra şu mesajı görmelisiniz:
```
Success. No rows returned
```

## Özellik Kullanımı:

### Avans Taksit Ekleme:
1. Bordro sisteminde bir personel seçin
2. "AVANS" butonuna tıklayın
3. Tutar ve tarihi girin
4. **Taksit Bilgileri** bölümünde:
   - **Toplam Taksit**: Kaç taksit olacak (örn: 3)
   - **Şu Anki Taksit**: Bu kaçıncı taksit (örn: 1)
5. Kaydet butonuna basın

### Örnek:
- 15.000 TL avans, 3 taksit
- 1. Ay: 15.000 TL (1/3 taksit) → Toplam kesinti: 15.000 TL
- 2. Ay: 15.000 TL (2/3 taksit) → Toplam kesinti: 30.000 TL
- 3. Ay: 15.000 TL (3/3 taksit) → Toplam kesinti: 45.000 TL

### Görüntülenme:
- ✅ Avans listesinde taksit etiketi görünür
- ✅ HAKEDİŞ DETAYI'nda her avans ayrı satırda
- ✅ PDF'de avans detayları taksit bilgisiyle

## Sorun Giderme:

### Hata: "column 'installment_total' does not exist"
**Çözüm**: Yukarıdaki SQL migration'ını çalıştırın.

### Hata: "violates check constraint 'check_installment_valid'"
**Çözüm**: Şu anki taksit numarası toplam taksit sayısından büyük olamaz. Değerleri kontrol edin.

### Hata: "duplicate key value violates unique constraint"
**Çözüm**: Constraint zaten ekliyse, şu SQL ile kaldırıp tekrar ekleyin:
```sql
ALTER TABLE bordro_expenses DROP CONSTRAINT IF EXISTS check_installment_valid;
ALTER TABLE bordro_expenses 
ADD CONSTRAINT check_installment_valid 
CHECK (installment_current <= installment_total AND installment_current > 0 AND installment_total > 0);
```

## Yedekleme Notu:
Migration yapmadan önce veritabanınızı yedeklemeniz önerilir:
1. Supabase Dashboard → Database → Backups
2. "Create backup" ile manuel yedek alın
