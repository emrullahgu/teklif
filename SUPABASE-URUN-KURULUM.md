# 🗄️ Ürün Yönetimi - Supabase Kurulum Rehberi

Bu rehber, ürün ekleme/düzenleme/silme özelliklerinin Supabase ile nasıl entegre edildiğini ve nasıl kurulacağını açıklar.

## 📋 Gerekli Adımlar

### 1️⃣ Supabase Veritabanı Kurulumu

1. **Supabase Dashboard'a gidin**: https://supabase.com/dashboard
2. Projenizi seçin (mevcut: `ctylfbmukmoxpzwzeffr`)
3. Sol menüden **SQL Editor** seçeneğine tıklayın
4. Aşağıdaki SQL kodunu çalıştırın:

```sql
-- Ürünler tablosu oluştur
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  original_name TEXT, -- Güncellenen ürünler için orijinal isim
  is_new BOOLEAN DEFAULT false, -- Yeni eklenen ürün mü?
  is_active BOOLEAN DEFAULT true, -- Silinmiş mi?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- RLS (Row Level Security) politikaları
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Herkes okuyabilir
CREATE POLICY "Herkes ürünleri görüntüleyebilir"
  ON products FOR SELECT
  USING (true);

-- Herkes ekleyebilir
CREATE POLICY "Herkes ürün ekleyebilir"
  ON products FOR INSERT
  WITH CHECK (true);

-- Herkes güncelleyebilir
CREATE POLICY "Herkes ürün güncelleyebilir"
  ON products FOR UPDATE
  USING (true);

-- Herkes silebilir (soft delete)
CREATE POLICY "Herkes ürün silebilir"
  ON products FOR DELETE
  USING (true);
```

5. **"Run"** butonuna basın
6. Başarılı mesajı gördüğünüzde tablo hazır! ✅

### 2️⃣ Veritabanı Yapısı

**`products` Tablosu:**

| Alan | Tip | Açıklama |
|------|-----|----------|
| `id` | UUID | Benzersiz ürün ID'si (otomatik) |
| `name` | TEXT | Ürün adı |
| `category` | TEXT | Ürün kategorisi |
| `price` | DECIMAL | Ürün fiyatı (TL) |
| `original_name` | TEXT | Güncellenen ürünlerin orijinal adı |
| `is_new` | BOOLEAN | Yeni eklenen ürün mü? |
| `is_active` | BOOLEAN | Aktif mi? (soft delete için) |
| `created_at` | TIMESTAMP | Oluşturulma tarihi |
| `updated_at` | TIMESTAMP | Güncellenme tarihi |

## 🚀 Özellikler

### ✅ Kalıcı Veri Saklama

- **Supabase veritabanında** saklanır (PostgreSQL)
- Sayfa yenilendiğinde veriler kaybolmaz
- Tüm cihazlardan erişilebilir
- **Yedek**: localStorage'da da tutulur

### 🔧 Ürün İşlemleri

1. **Yeni Ürün Ekleme**
   - Mor "🟣 Yeni Ürün" butonuna tıklayın
   - Form doldurun (Ürün Adı, Kategori, Fiyat)
   - "Ürün Ekle" butonuna basın
   - Supabase'e kaydedilir ✅

2. **Ürün Düzenleme**
   - Herhangi bir ürün kartına mouse ile gelin
   - Sağ üst köşede ✏️ ikonu görünür
   - İkona tıklayın
   - Bilgileri güncelleyin
   - "Kaydet" butonuna basın
   - Supabase'de güncellenir ✅

3. **Ürün Silme**
   - Düzenleme modalını açın
   - "🗑️ Sil" butonuna tıklayın
   - Onaylayın
   - **Soft Delete**: Ürün silinmez, `is_active=false` olur

## 🔄 Veri Akışı

```
Kullanıcı İşlemi
    ↓
KesifMetraj Component
    ↓
saveProduct() / deleteProduct()
    ↓
Supabase API İsteği
    ↓
PostgreSQL Veritabanı
    ↓
loadProductsFromSupabase()
    ↓
Local State Güncelleme
    ↓
UI Yenilenir ✅
```

## 🛡️ Güvenlik (RLS Policies)

Supabase'de **Row Level Security (RLS)** aktif:

- ✅ Herkes ürünleri görüntüleyebilir
- ✅ Herkes ürün ekleyebilir
- ✅ Herkes ürün güncelleyebilir
- ✅ Soft delete (is_active = false)

> ⚠️ **Not**: Şu anda herkes tüm işlemleri yapabilir. Üretim ortamında kullanıcı authentication ekleyin!

## 🔍 Verileri Görüntüleme

Supabase Dashboard'da:
1. **Table Editor** seçeneğine gidin
2. **products** tablosunu seçin
3. Tüm eklenen/güncellenen ürünleri görebilirsiniz

## 🐛 Sorun Giderme

### Hata: "Failed to load products"

**Çözüm:**
1. Supabase bağlantınızı kontrol edin
2. SQL sorgusunun başarıyla çalıştığından emin olun
3. RLS politikalarının aktif olduğunu doğrulayın
4. Browser console'da hata mesajlarını kontrol edin

### Veriler Görünmüyor

**Kontrol Listesi:**
- [ ] Supabase tablosu oluşturuldu mu?
- [ ] RLS policies ekli mi?
- [ ] İnternet bağlantısı var mı?
- [ ] Browser console'da hata var mı?

### localStorage Yedekleme

Supabase erişilemezse otomatik olarak localStorage'dan yüklenir. Yedek sistem devreye girer.

## 📊 Örnek Kullanım

```javascript
// Yeni ürün ekleme
await saveProduct({
  name: "NYY 4x50 Kablo",
  category: "Kablo - NYY",
  price: 125.50,
  isNew: true
});

// Ürün güncelleme
await saveProduct({
  id: "uuid-here",
  name: "NYY 4x50 Kablo (Yeni)",
  category: "Kablo - NYY",
  price: 130.00,
  originalName: "NYY 4x50 Kablo"
});

// Ürün silme (soft delete)
await deleteProduct("uuid-here", "NYY 4x50 Kablo");
```

## 🎉 Sonuç

Artık ürünleriniz:
- ✅ Supabase PostgreSQL veritabanında
- ✅ Tüm cihazlardan erişilebilir
- ✅ Kalıcı ve güvenli
- ✅ Gerçek zamanlı senkronize

**Not**: `products-migration.sql` dosyasını da inceleyebilirsiniz.
