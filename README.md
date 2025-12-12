# YG İşletme Sorumluluğu Teklif Otomasyonu

Yüksek Gerilim İşletme Sorumluluğu teklifleri hazırlama ve yönetimi için modern web uygulaması.

## 🚀 Özellikler

- ✅ **Manuel Teklif Girişi**: Firma bilgileri ve teknik detayları kolay giriş
- 📊 **EMO 2026 Hesaplamaları**: Güncel EMO tarifelerine göre otomatik hesaplama
- 🗺️ **87 Şehir/Bölge Desteği**: Otomatik bölgesel azaltma katsayıları
- 💰 **Esnek İskonto Sistemi**: Firma bazlı özelleştirilebilir iskonto oranları
- ⚡ **Bina & Direk Tipi**: Her iki trafo merkezi tipini destekler
- 📄 **Profesyonel Önizleme**: A4 boyutunda gerçek zamanlı teklif önizlemesi
- 📥 **Çoklu Export**: PDF ve Word formatında indirme
- 🤖 **Gemini AI Entegrasyonu**: Teklif özeti ve rekabetçi analiz oluşturma

## 📦 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm run dev

# Production build
npm run build
```

## 🖥️ Kullanım

1. Uygulamayı başlatın: `npm run dev`
2. Tarayıcıda açın: `http://localhost:3000`
3. "Teklif Bilgileri" sekmesinden firma bilgilerini girin
4. Bölge ve iskonto oranını ayarlayın
5. "Hesapla ve Teklif Oluştur" butonuna tıklayın
6. Teklifi PDF veya Word olarak indirin

## ⚙️ EMO 2026 Parametreleri

- **Sabit Ücret (0-400 kVA)**: 8.802,00 TL
- **Birim Fiyat (401-5000 kVA)**: 5,34 TL/kVA
- **Birim Fiyat (>5000 kVA)**: 4,10 TL/kVA
- **Direk Tipi Tarifeler**: 3.887 - 6.770 TL arası

## 🔧 Teknolojiler

- **React 18** - Modern UI framework
- **Vite** - Hızlı build tool
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - İkonlar
- **html2pdf.js** - PDF export
- **html-docx-js** - Word export
- **Google Gemini AI** - Akıllı metin oluşturma

## 📸 Logo Ayarları

Logolar `public/` klasöründe bulunmalıdır:
- `logo.png` - Üst başlık logosu (tavsiye edilen: 200x80px)
- `antet.png` - Alt antet logosu (tavsiye edilen: 400x100px)

## 🌐 Deployment

### Vercel / Netlify
Proje otomatik olarak deploy edilmeye hazır. Sadece GitHub repo'nuzu bağlayın.

### Manuel Deploy
```bash
npm run build
# dist/ klasörünü sunucunuza yükleyin
```

## 📝 Lisans

Bu proje KOBİNERJİ Mühendislik ve Enerji Verimliliği Danışmanlık A.Ş. için geliştirilmiştir.

## 🤝 Destek

Sorularınız için: [info@kobinerji.com]

---

**v2026.0.0** - EMO 2026 Tarifelerine Uyumlu
