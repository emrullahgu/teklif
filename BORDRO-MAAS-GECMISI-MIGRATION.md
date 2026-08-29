# 🔒 Bordro Maaş Geçmişi (Salary History) - Veritabanı Kurulumu

## ⚠️ ÖNEMLİ: Bu Migration Çalıştırılmadan Maaş Değişiklikleri ESKİ AYLARI ETKİLER!

## 🎯 Ne Değişti?

**Eski Sistem (Hatalı):**
- Personelin maaşı `bordro_employees` tablosunda TEK bir değer olarak tutuluyordu.
- Bir personelin maaşı güncellendiğinde (örn. Haziran'da zam), sistem **HER AY** için
  bu güncel maaşı kullanıyordu.
- Sonuç: Haziran'da girilen zam, geriye dönük olarak Ocak-Mayıs aylarındaki
  hesaplamaları da yanlış şekilde etkiliyordu.

**Yeni Sistem (Doğru):**
- Her maaş değişikliği, "hangi aydan itibaren geçerli" bilgisiyle birlikte
  `bordro_salary_history` tablosunda AYRI bir satır olarak saklanır.
- Bir ayın maaş hesaplaması yapılırken, o ay için **geçerli olan** (o tarihe kadar
  girilmiş en son) maaş kaydı kullanılır.
- Haziran'da girilen zam SADECE Haziran ve sonraki aylar için geçerli olur;
  Ocak-Mayıs kayıtları ve hesaplamaları **DEĞİŞMEZ**.

## 🚀 Kurulum Adımları

### 1. Supabase Dashboard'a Git
- https://app.supabase.com/ adresine git ve projeni seç.

### 2. SQL Editor'u Aç
- Sol menüden **SQL Editor** → **New query**

### 3. Migration'ı Çalıştır
`bordro-salary-history-migration.sql` dosyasının tüm içeriğini kopyalayıp SQL
Editor'e yapıştır ve **RUN** butonuna bas (veya Ctrl+Enter).

Bu migration:
- `bordro_salary_history` tablosunu oluşturur,
- Gerekli index ve RLS politikalarını ekler,
- **Mevcut tüm personellerin güncel maaşını**, personelin oluşturulma tarihinden
  itibaren geçerliymiş gibi otomatik olarak bu tabloya "başlangıç kaydı" olarak
  ekler (böylece migration sonrası hiçbir personel için veri eksikliği olmaz).

### 4. Kontrol Et
```sql
SELECT e.name, h.agreed_salary, h.official_salary, h.effective_month, h.effective_year
FROM bordro_salary_history h
JOIN bordro_employees e ON e.id = h.employee_id
ORDER BY e.name, h.effective_year, h.effective_month;
```
Her personel için en az bir satır görmelisin.

## ✅ Kullanım

Personel Düzenle modalinde artık maaş değiştirdiğinizde **"Maaş değişikliği hangi
aydan itibaren geçerli olsun?"** alanı çıkar (varsayılan: o an ekranda
görüntülediğiniz ay). Bu tarih seçildikten sonra:

- Seçilen ay ve **sonraki** aylar → yeni maaşla hesaplanır.
- Seçilen aydan **önceki** aylar → eski maaşla hesaplanmaya devam eder, hiçbir
  şekilde değişmez.

## 🆘 Migration Çalıştırılmazsa Ne Olur?

Uygulama, `bordro_salary_history` tablosunu bulamazsa otomatik olarak eski
davranışa (personelin güncel/tek maaşı tüm aylarda kullanılır) geri döner ve
personel kaydı sırasında bunu bildiren bir uyarı gösterir. Geçmiş ayların doğru
korunması için migration'ın çalıştırılması **zorunludur**.
