# Haftalık Raporlama - Görsel Geliştirmeler

## 🎨 Yeni Özellikler

### 1. Görsel/Fotoğraf Yükleme
- **Kompanzasyon panosu**, **ölçüm cihazı** veya **saha görselleri** yüklenebilir
- Base64 formatında veritabanında saklanır (harici depolama gerekmez)
- Yüklenen görsel:
  - Form modalında önizleme
  - PDF raporunda otomatik olarak görüntülenir
  - İstediğiniz zaman silinip değiştirilebilir

### 2. Rapor Hazırlayan ve Onaylayan Bilgileri
- **Rapor Hazırlayan**: Raporu hazırlayan kişinin adı ve ünvanı
  - Örn: "Ahmet Yılmaz - Elektrik Mühendisi"
- **Onaylayan**: Raporu onaylayan yöneticinin bilgileri
  - Örn: "Mehmet Demir - Genel Müdür"

### 3. Gelişmiş PDF Export Özellikleri

#### 🎯 Profesyonel Tasarım
- **Renkli gradyan başlıklar** (mor-mavi-pembe tonları)
- **Büyük ve belirgin durum badge'leri** (UYGUN ✓, DİKKAT ⚠, UYGUN DEĞİL ✗)
- **Emoji ve simgeler** ile görsel zenginlik
- **Gölge ve derinlik efektleri**

#### 📊 Görsel Veri Kartları
- **Güç Faktörü**: Mor gradyan, ⚡ simgesi
- **Aktif Güç**: Pembe gradyan, 🔋 simgesi
- **Reaktif Güç**: Sarı-pembe gradyan, ⚙️ simgesi
- Her kart üzerinde hedef/birim bilgileri

#### 📸 Görsel Entegrasyonu
- Yüklenen görsel PDF'te otomatik gösterilir
- "📸 SAHA GÖRSELİ / TEKNİK FOTOĞRAF" başlıklı bölüm
- Uygun boyutlarda ve çerçeveli görüntüleme

#### 📋 Rapor Meta Bilgileri
**Üst Kısım:**
- Logo (sol üst)
- Rapor başlığı (sağ üst, mor arka plan)
- Rapor numarası: `HFT-YYYY-MM-DD` formatında
- Raporlama tarihi: Türkçe tarih formatı
- Rapor dönemi (hafta başlangıç-bitiş)

**Alt Kısım:**
- Rapor hazırlayan bilgisi (✍️ simgesi ile)
- Onaylayan bilgisi (✓ simgesi ile)
- Firma bilgileri (web, email, telefon)

#### 📊 Geliştirilmiş Tablo
- Başlıklı tablo (koyu gri başlık)
- Her satırda ilgili emoji/simge
- Alternatif satır renkleri (daha kolay okuma)
- Maliyet satırı vurgulanmış (sarı arka plan)

#### ⚙️ Teknik İyileştirmeler
- **Yüksek çözünürlük**: `scale: 2.5` (daha net baskı)
- **A4 boyutu**: 794x1123 piksel (standart sayfa)
- **Render gecikmesi**: 800ms (karmaşık içerik için)
- **Logo görünürlük kontrolü**: Otomatik gizleme/gösterme

## 📝 Kullanım

### Yeni Rapor Oluşturma
1. "Yeni Rapor Ekle" butonuna tıklayın
2. Tüm zorunlu alanları doldurun:
   - Fabrika adı
   - Hafta başlangıç/bitiş tarihleri
   - Güç faktörü ve enerji verileri
3. **Görsel Yükle** butonuna tıklayın ve fotoğraf seçin
4. **Rapor Hazırlayan** ve **Onaylayan** bilgilerini girin
5. Notlar ekleyin
6. Kaydedin

### PDF İndirme
1. Rapor kartında "PDF" butonuna tıklayın
2. PDF otomatik olarak indirilir
3. Dosya adı: `haftalik_rapor_[fabrika_adi]_[tarih].pdf`

## 🗄️ Veritabanı Güncellemesi

Mevcut veritabanınızı güncellemek için `haftalik-raporlama-migration.sql` dosyasını çalıştırın:

```sql
-- Yeni alanlar otomatik eklenecek:
- gorsel_url TEXT (Base64 kodlanmış görsel)
- rapor_hazirlayan TEXT (Rapor hazırlayan kişi)
- onaylayan TEXT (Onaylayan kişi)
```

Migration dosyası mevcut verileri korur ve sadece yeni alanları ekler.

## 🎨 Görsel Örnekler

### PDF Çıktısı İçeriği:
1. **Başlık Bölümü**: Logo + Rapor bilgileri (mor kutu)
2. **Fabrika Kartı**: Gradyan arka plan, emoji ile
3. **Durum Badge**: Büyük, renkli, simgeli
4. **Veri Kartları**: 3 adet gradyan kartlar
5. **Görsel Bölümü**: Yüklenen fotoğraf (varsa)
6. **Detaylı Tablo**: Emoji'li, alternatif renkli
7. **Notlar**: Sarı kutuda
8. **Alt Bilgi**: Hazırlayan, onaylayan, firma bilgileri

## 💡 İpuçları

- **Görsel Boyutu**: PDF'de otomatik olarak optimize edilir
- **Görsel Formatı**: JPG, PNG, WebP desteklenir
- **Rapor Numarası**: Otomatik olarak bugünün tarihiyle oluşturulur
- **Türkçe Tarih**: PDF'te Türkçe tarih formatı kullanılır
- **Base64 Saklama**: Görseller veritabanında saklanır, ek depolama gerekmez

## 🔄 Güncellemeler

**v2.0 - Görsel Geliştirmeler**
- Görsel/fotoğraf yükleme özelliği eklendi
- Rapor hazırlayan ve onaylayan alanları eklendi
- PDF tasarımı tamamen yenilendi
- Gradyan kartlar ve simgeler eklendi
- Export kalitesi yükseltildi (scale 2.5)
- A4 sayfa boyutu optimizasyonu yapıldı

## 📞 Destek

Sorularınız için: info@kobinerji.com
