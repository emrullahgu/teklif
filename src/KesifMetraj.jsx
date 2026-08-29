import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calculator, ShoppingCart, Trash2, Copy, FileText, Plus, X, Sparkles, MessageSquare, Send, Loader2, Mail, Download, Building2, Eye, ExternalLink, Save, Clock, Cable, Percent, Banknote, Edit3, CheckCircle, User } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import FaturaData from '../fatura/Fatura.json';
import FaturaData2 from '../fatura/Fatura2.json';
import { supabase } from './supabaseClient';

const KesifMetraj = ({ onCustomerUpdate, onNavigateToPreview }) => {
  // Fatura verilerini birleştir ve kategorize et
  const initialData = useMemo(() => {
    const products = [];
    
    // Hizmet/İşçilik kalemlerini filtrele (sadece fiziksel malzemeleri al)
    const isServiceItem = (name) => {
      const n = name.toUpperCase();
      return n.includes('İŞÇİLİK') || 
             n.includes('MONTAJ') || 
             n.includes('DEVREYE ALMA') ||
             n.includes('PERİYODİK KONTROL') ||
             n.includes('KALİBRASYON') ||
             n.includes('ÖLÇÜM') ||
             n.includes('TEST') ||
             n.includes('DENETİM') ||
             n.includes('ULAŞIM') ||
             n.includes('SARF MALZEME') ||
             n.match(/^\d+\s*(ARALIK|OCAK|ŞUBAT|MART|NİSAN|MAYIS|HAZİRAN|TEMMUZ|AĞUSTOS|EYLÜL|EKİM|KASIM)/);
    };
    
    // Kategori belirleme fonksiyonu
    const categorize = (name) => {
      const n = name.toUpperCase();
      if (n.includes('NYY') || n.includes('YVV')) return 'Kablo - NYY';
      if (n.includes('NYM') || n.includes('NVV')) return 'Kablo - NYM';
      if (n.includes('TTR') || n.includes('H05VV')) return 'Kablo - TTR';
      if (n.includes('NYAF') || n.includes('H05V-K')) return 'Kablo - NYAF';
      if (n.includes('NYA') || n.includes('H05V-U')) return 'Kablo - NYA';
      if (n.includes('AER')) return 'Kablo - AER';
      if (n.includes('YAVV') || n.includes('NAYY')) return 'Kablo - YAVV';
      if (n.includes('NHXMH')) return 'Kablo - NHXMH';
      if (n.includes('KABLO') || n.includes('KORDON')) return 'Kablo - Diğer';
      if (n.includes('OTOMAT') || n.includes('SİGORTA') || n.includes('KAÇAK AKIM') || n.includes('RCD') || n.includes('ŞALTER')) return 'Otomat ve Sigorta';
      if (n.includes('PRİZ') || n.includes('ANAHTAR') || n.includes('SOKET')) return 'Priz ve Anahtar';
      if (n.includes('KUTU') || n.includes('PANO')) return 'Kutu ve Pano';
      if (n.includes('ARMATÜR') || n.includes('LED') || n.includes('LAMBA') || n.includes('SPOT') || n.includes('PROJEKTÖR') || n.includes('TRAFO')) return 'Aydınlatma';
      if (n.includes('KANAL') || n.includes('BORU') || n.includes('HORTUM') || n.includes('TAVA') || n.includes('KONSOL')) return 'Kablo Kanalı';
      if (n.includes('KLEMENS') || n.includes('PABUÇ') || n.includes('BAĞLANTI') || n.includes('KONNEKTÖR')) return 'Bağlantı Elemanları';
      if (n.includes('TOPRAKLAMA') || n.includes('PARATONER')) return 'Topraklama';
      if (n.includes('CIVATA') || n.includes('SOMUN') || n.includes('PUL') || n.includes('ZİNCİR') || n.includes('KELEPÇE')) return 'Montaj Malzemeleri';
      if (n.includes('REAKTÖR') || n.includes('REAKTIF') || n.includes('KVAR') || n.includes('SÜREÇ')) return 'Güç Elektroniği';
      return 'Diğer Malzemeler';
    };
    
    // Fatura1'den ürünleri ekle
    FaturaData.forEach(item => {
      const urun = item.ÜRÜN?.trim();
      const fiyat = item['BİRİM FİYAT'];
      if (urun && fiyat && fiyat > 0 && !isServiceItem(urun)) {
        products.push({
          category: categorize(urun),
          name: urun,
          price: fiyat
        });
      }
    });
    
    // Fatura2'den ürünleri ekle
    FaturaData2.forEach(item => {
      const urun = item['Ürün/hizmet']?.trim();
      const fiyat = parseFloat(item['Birim fiyatı']) || 0;
      if (urun && fiyat > 0 && !isServiceItem(urun)) {
        products.push({
          category: categorize(urun),
          name: urun,
          price: fiyat
        });
      }
    });
    
    // Unique ürünleri al (isim bazlı)
    const uniqueMap = new Map();
    products.forEach(p => {
      const key = p.name.toUpperCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, p);
      }
    });
    
    return Array.from(uniqueMap.values());
  }, []);

  const [discount, setDiscount] = useState(45);
  const [profit, setProfit] = useState(15);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  
  // AI States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isTeklifModalOpen, setIsTeklifModalOpen] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isSavedTeklifModalOpen, setIsSavedTeklifModalOpen] = useState(false);
  const [isMusteriModalOpen, setIsMusteriModalOpen] = useState(false);
  const [isProductEditModalOpen, setIsProductEditModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [customProducts, setCustomProducts] = useState([]);
  const [savedTeklifler, setSavedTeklifler] = useState([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [companyLogo, setCompanyLogo] = useState('/fatura_logo.png');
  const [editorMode, setEditorMode] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  
  // Teklif Form States
  const [teklifForm, setTeklifForm] = useState({
    musteriAdi: '',
    firmaAdi: '',
    yetkili: '',
    telefon: '',
    email: '',
    adres: '',
    projeAdi: '',
    aciklama: '• Ödeme Şekli: %50 Peşin, %50 İş Bitiminde\n• Teslimat: Ödeme sonrası 5-7 iş günü içinde\n• Garanti: Tüm malzemeler 2 yıl garantilidir\n• Fiyatlar KDV dahildir\n• Teklif 30 gün geçerlidir',
    kdvOrani: 20,
    teklifNo: `TKL-${Date.now().toString().slice(-6)}`,
    tarih: new Date().toLocaleDateString('tr-TR'),
    gecerlilikSuresi: '30 gün'
  });

  // Hazır Senaryolar
  const scenarios = [
    {
      id: 1,
      name: "Trafo Değişimi (100 kVA)",
      icon: "⚡",
      description: "100 kVA transformatör değişimi için gerekli malzemeler",
      items: [
        { search: "NYY 4x25", quantity: 50 },
        { search: "NYY 4x16", quantity: 30 },
        { search: "Otomat", quantity: 5 },
        { search: "Topraklama", quantity: 5 },
        { search: "Bağlantı", quantity: 20 }
      ]
    },
    {
      id: 2,
      name: "Trafo Değişimi (250 kVA)",
      icon: "⚡",
      description: "250 kVA transformatör değişimi ve bağlantı malzemeleri",
      items: [
        { search: "NYY 4x50", quantity: 80 },
        { search: "NYY 4x35", quantity: 50 },
        { search: "Otomat", quantity: 6 },
        { search: "Topraklama", quantity: 8 },
        { search: "Bağlantı", quantity: 30 }
      ]
    },
    {
      id: 3,
      name: "Trafo Yükseltimi (100→250 kVA)",
      icon: "📈",
      description: "Mevcut trafo yükseltme ve altyapı güçlendirme",
      items: [
        { search: "NYY 4x70", quantity: 100 },
        { search: "NYY 4x50", quantity: 60 },
        { search: "Otomat", quantity: 5 },
        { search: "Pano", quantity: 1 },
        { search: "Topraklama", quantity: 10 }
      ]
    },
    {
      id: 4,
      name: "Ana Pano Değişimi",
      icon: "🔧",
      description: "Tam ana dağıtım panosu yenileme projesi",
      items: [
        { search: "Pano", quantity: 2 },
        { search: "Otomat", quantity: 18 },
        { search: "NYY 4x35", quantity: 100 },
        { search: "NYY 4x25", quantity: 150 },
        { search: "Bağlantı", quantity: 50 }
      ]
    },
    {
      id: 5,
      name: "Kompanzasyon Panosu Revizyonu",
      icon: "⚙️",
      description: "Reaktif güç kompanzasyonu ve pano revizyonu",
      items: [
        { search: "Kondansatör", quantity: 6 },
        { search: "Otomat", quantity: 4 },
        { search: "NYY 4x16", quantity: 80 },
        { search: "Kontaktör", quantity: 6 },
        { search: "Pano", quantity: 1 }
      ]
    },
    {
      id: 6,
      name: "Dağıtım Panosu (10 Kolon)",
      icon: "📊",
      description: "10 kolonlu alt dağıtım panosu kurulumu",
      items: [
        { search: "Pano", quantity: 10 },
        { search: "Otomat", quantity: 65 },
        { search: "NYM 3x2.5", quantity: 200 },
        { search: "Topraklama", quantity: 10 }
      ]
    },
    {
      id: 7,
      name: "Fabrika Aydınlatma Revizyonu",
      icon: "💡",
      description: "Endüstriyel alan LED aydınlatma yenileme",
      items: [
        { search: "LED", quantity: 50 },
        { search: "NYM 3x1.5", quantity: 500 },
        { search: "Anahtar", quantity: 20 },
        { search: "Kutu", quantity: 30 },
        { search: "Kablo Kanalı", quantity: 100 }
      ]
    },
    {
      id: 8,
      name: "Ofis Aydınlatma Projesi",
      icon: "🏢",
      description: "Modern ofis alanı için LED aydınlatma",
      items: [
        { search: "LED Panel", quantity: 40 },
        { search: "LED Downlight", quantity: 30 },
        { search: "NYM 3x1.5", quantity: 300 },
        { search: "Dimmer", quantity: 10 },
        { search: "Anahtar", quantity: 50 }
      ]
    },
    {
      id: 9,
      name: "Topraklama Sistemi Yenileme",
      icon: "🌍",
      description: "Komple topraklama sistemi kurulumu",
      items: [
        { search: "Topraklama Çubuğu", quantity: 15 },
        { search: "Bakır Kablo", quantity: 100 },
        { search: "Topraklama", quantity: 10 },
        { search: "Bağlantı", quantity: 50 },
        { search: "Test", quantity: 5 }
      ]
    },
    {
      id: 10,
      name: "Kablo Kanalı Altyapısı",
      icon: "📦",
      description: "Komple kablo taşıma sistemi kurulumu",
      items: [
        { search: "Kablo Kanalı 100", quantity: 100 },
        { search: "Kablo Kanalı 80", quantity: 150 },
        { search: "Dirsek", quantity: 50 },
        { search: "T Bağlantı", quantity: 30 },
        { search: "Montaj", quantity: 200 }
      ]
    },
    {
      id: 11,
      name: "Acil Aydınlatma Sistemi",
      icon: "🚨",
      description: "Yangın ve acil durum aydınlatması",
      items: [
        { search: "Acil Aydınlatma", quantity: 30 },
        { search: "Exit", quantity: 15 },
        { search: "NYM 3x1.5", quantity: 200 },
        { search: "Akü", quantity: 10 },
        { search: "Test", quantity: 20 }
      ]
    },
    {
      id: 12,
      name: "Jeneratör Entegrasyonu",
      icon: "🔌",
      description: "Yedek güç kaynağı bağlantısı ve otomasyonu",
      items: [
        { search: "NYY 4x95", quantity: 50 },
        { search: "Otomat", quantity: 4 },
        { search: "Kontaktör", quantity: 2 },
        { search: "Şalter", quantity: 1 },
        { search: "Pano", quantity: 1 }
      ]
    },
    {
      id: 13,
      name: "UPS Odası Kurulumu",
      icon: "🔋",
      description: "Kesintisiz güç kaynağı odası elektrik altyapısı",
      items: [
        { search: "NYY 4x70", quantity: 60 },
        { search: "NYY 4x35", quantity: 80 },
        { search: "Otomat", quantity: 6 },
        { search: "Topraklama", quantity: 8 },
        { search: "Pano", quantity: 2 }
      ]
    },
    {
      id: 14,
      name: "Priz Hattı Yenileme (Ofis)",
      icon: "🔌",
      description: "Ofis alanı priz ve data hattı yenileme",
      items: [
        { search: "Priz Topraklı", quantity: 80 },
        { search: "NYM 3x2.5", quantity: 300 },
        { search: "Kutu", quantity: 80 },
        { search: "Otomat", quantity: 40 },
        { search: "Kablo Kanalı", quantity: 100 }
      ]
    },
    {
      id: 15,
      name: "Motor Kontrol Panosu",
      icon: "⚙️",
      description: "Endüstriyel motor kontrol ve koruma sistemi",
      items: [
        { search: "Kontaktör", quantity: 5 },
        { search: "Termik", quantity: 5 },
        { search: "NYY 4x16", quantity: 100 },
        { search: "Buton", quantity: 10 },
        { search: "Pano", quantity: 1 }
      ]
    },
    {
      id: 16,
      name: "Şantiye Elektrik Sistemi",
      icon: "🏗️",
      description: "İnşaat sahası geçici elektrik altyapısı",
      items: [
        { search: "NYY 4x25", quantity: 200 },
        { search: "Otomat", quantity: 15 },
        { search: "Priz", quantity: 30 },
        { search: "Kutu", quantity: 20 },
        { search: "Kablo Kanalı", quantity: 50 }
      ]
    },
    {
      id: 17,
      name: "Saha Aydınlatması (Dış Mekan)",
      icon: "🌙",
      description: "Park ve bahçe LED projektör aydınlatma",
      items: [
        { search: "Projektör", quantity: 20 },
        { search: "NYY 3x2.5", quantity: 250 },
        { search: "Direk", quantity: 10 },
        { search: "Fotoselli Anahtar", quantity: 5 },
        { search: "Topraklama", quantity: 10 }
      ]
    },
    {
      id: 18,
      name: "Soğuk Hava Deposu Elektrikleri",
      icon: "❄️",
      description: "Soğuk oda ve klimatik sistem elektrik tesisatı",
      items: [
        { search: "NYY 4x16", quantity: 120 },
        { search: "Otomat", quantity: 8 },
        { search: "Kontaktör", quantity: 6 },
        { search: "Termik", quantity: 6 },
        { search: "Pano", quantity: 1 }
      ]
    },
    {
      id: 19,
      name: "Asansör Elektrik Tesisatı",
      icon: "🛗",
      description: "Asansör besleme ve kontrol sistemi",
      items: [
        { search: "NYY 4x35", quantity: 80 },
        { search: "NYM 5x1.5", quantity: 100 },
        { search: "Otomat", quantity: 5 },
        { search: "Pano", quantity: 1 },
        { search: "Topraklama", quantity: 5 }
      ]
    },
    {
      id: 20,
      name: "Havuz Elektrik Sistemi",
      icon: "🏊",
      description: "Havuz pompa, filtrasyon ve aydınlatma",
      items: [
        { search: "NYY 4x16", quantity: 100 },
        { search: "Su Altı LED", quantity: 12 },
        { search: "Otomat", quantity: 6 },
        { search: "Pano Su Geçirmez", quantity: 1 },
        { search: "Topraklama", quantity: 8 }
      ]
    },
    {
      id: 21,
      name: "Güvenlik Kamera Altyapısı",
      icon: "📹",
      description: "CCTV ve güvenlik sistemi kablolama",
      items: [
        { search: "Kablo Veri", quantity: 500 },
        { search: "NYM 2x1.5", quantity: 300 },
        { search: "Kutu Bağlantı", quantity: 25 },
        { search: "Kablo Kanalı", quantity: 150 },
        { search: "Priz", quantity: 20 }
      ]
    },
    {
      id: 22,
      name: "Depo Aydınlatma ve Priz Hattı",
      icon: "📦",
      description: "Endüstriyel depo elektrik tesisatı",
      items: [
        { search: "LED Armatür", quantity: 60 },
        { search: "NYM 3x2.5", quantity: 400 },
        { search: "Priz Endüstriyel", quantity: 40 },
        { search: "Otomat", quantity: 20 },
        { search: "Kablo Kanalı", quantity: 200 }
      ]
    },
    {
      id: 23,
      name: "Klima Santrali Besleme",
      icon: "🌡️",
      description: "Merkezi klima sistemi elektrik altyapısı",
      items: [
        { search: "NYY 4x25", quantity: 150 },
        { search: "Otomat", quantity: 10 },
        { search: "Kontaktör", quantity: 8 },
        { search: "Pano", quantity: 2 },
        { search: "Termik", quantity: 8 }
      ]
    },
    {
      id: 24,
      name: "Yangın Alarm Sistemi",
      icon: "🚨",
      description: "Yangın algılama ve alarm tesisatı",
      items: [
        { search: "Yangın Kablosu", quantity: 300 },
        { search: "Dedektör", quantity: 30 },
        { search: "Siren", quantity: 10 },
        { search: "Buton Yangın", quantity: 15 },
        { search: "Santral", quantity: 1 }
      ]
    },
    {
      id: 25,
      name: "Atölye Elektrik Revizyonu",
      icon: "🔨",
      description: "Küçük sanayi atölyesi komple elektrik yenileme",
      items: [
        { search: "Pano", quantity: 3 },
        { search: "Otomat", quantity: 25 },
        { search: "NYY 4x16", quantity: 200 },
        { search: "Priz Endüstriyel", quantity: 50 },
        { search: "LED Armatür", quantity: 40 }
      ]
    }
  ];

  const categories = useMemo(() => ["Tümü", ...new Set(initialData.map(d => d.category))], []);

  // Supabase'den özel ürünleri yükle
  useEffect(() => {
    loadProductsFromSupabase();
  }, []);

  const loadProductsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        // 404 hatası = tablo henüz oluşturulmamış
        if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
          console.warn('⚠️ Supabase\'de products tablosu henüz oluşturulmamış. products-migration.sql dosyasını çalıştırın.');
          console.info('📋 SQL Editor: https://supabase.com/dashboard/project/ctylfbmukmoxpzwzeffr/editor');
        } else {
          throw error;
        }
      }

      if (data && data.length > 0) {
        // Supabase formatını custom products formatına çevir
        const customProds = data.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: parseFloat(item.price),
          originalName: item.original_name || item.name,
          isNew: item.is_new || false
        }));
        setCustomProducts(customProds);
      }
    } catch (error) {
      console.error('❌ Supabase bağlantı hatası:', error);
      // Hata durumunda localStorage'dan yükle
      const saved = localStorage.getItem('customProducts');
      if (saved) {
        try {
          setCustomProducts(JSON.parse(saved));
        } catch (e) {
          console.error('localStorage ürünler yüklenemedi:', e);
        }
      }
    }
  };

  // Tüm ürünleri birleştir (orijinal + özel)
  const allProducts = useMemo(() => {
    const products = [...initialData];
    
    // Özel ürünleri ekle
    customProducts.forEach(custom => {
      if (custom.isNew) {
        // Yeni eklenen ürün
        products.push(custom);
      } else {
        // Güncellenmiş ürün - orijinali bul ve değiştir
        const index = products.findIndex(p => 
          p.name.toUpperCase().trim() === custom.originalName.toUpperCase().trim()
        );
        if (index !== -1) {
          products[index] = { ...custom };
        }
      }
    });
    
    return products;
  }, [initialData, customProducts]);

  // Ürün ekleme/güncelleme fonksiyonu - Supabase
  const saveProduct = async (productData) => {
    try {
      const productToSave = {
        name: productData.name,
        category: productData.category,
        price: productData.price,
        original_name: productData.originalName || productData.name,
        is_new: productData.isNew || false,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (productData.id && !productData.isNew) {
        // Mevcut ürünü güncelle
        result = await supabase
          .from('products')
          .update(productToSave)
          .eq('id', productData.id)
          .select()
          .single();
      } else {
        // Yeni ürün ekle
        result = await supabase
          .from('products')
          .insert([productToSave])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Local state'i güncelle
      await loadProductsFromSupabase();
      
      // localStorage'a da yedek kaydet
      const updated = [...customProducts];
      if (productData.isNew) {
        updated.push({
          ...productData,
          id: result.data.id,
          isNew: true
        });
      } else {
        const existingIndex = updated.findIndex(p => p.id === productData.id);
        if (existingIndex !== -1) {
          updated[existingIndex] = { ...productData, id: result.data.id };
        } else {
          updated.push({ ...productData, id: result.data.id });
        }
      }
      localStorage.setItem('customProducts', JSON.stringify(updated));

      alert('Ürün başarıyla kaydedildi! ✅');
    } catch (error) {
      console.error('Ürün kaydedilemedi:', error);
      alert('Ürün kaydedilirken hata oluştu: ' + error.message);
    }
  };

  // Ürün silme fonksiyonu - Supabase (Soft Delete)
  const deleteProduct = async (productId, productName) => {
    try {
      // Önce ID ile bul
      const product = customProducts.find(p => p.id === productId || p.name === productName);
      
      if (product && product.id) {
        // Supabase'den soft delete
        const { error } = await supabase
          .from('products')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', product.id);

        if (error) throw error;
      }

      // Local state'i güncelle
      await loadProductsFromSupabase();
      
      // localStorage'dan da sil
      const updated = customProducts.filter(p => p.id !== productId && p.name !== productName);
      setCustomProducts(updated);
      localStorage.setItem('customProducts', JSON.stringify(updated));

      alert('Ürün başarıyla silindi! 🗑️');
    } catch (error) {
      console.error('Ürün silinemedi:', error);
      alert('Ürün silinirken hata oluştu: ' + error.message);
    }
  };

  const filteredData = useMemo(() => {
    return allProducts.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Tümü" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const calculateDiscountedPrice = (price) => {
    return price * (1 - discount / 100);
  };

  const addToCart = (item, qty = 1) => {
    const existingItem = cart.find(c => c.name === item.name && c.category === item.category);
    if (existingItem) {
      setCart(cart.map(c => 
        c.name === item.name && c.category === item.category 
        ? { ...c, quantity: c.quantity + qty } 
        : c
      ));
    } else {
      setCart([...cart, { 
        ...item, 
        quantity: qty,
        description: '',
        kdvOrani: 20
      }]);
    }
  };

  const updateQuantity = (index, newQty) => {
    if (newQty < 1) return;
    const newCart = [...cart];
    newCart[index].quantity = parseInt(newQty);
    setCart(newCart);
  };

  const updateItemDescription = (index, description) => {
    const newCart = [...cart];
    newCart[index].description = description;
    setCart(newCart);
  };

  const updateItemKdv = (index, kdv) => {
    const newCart = [...cart];
    newCart[index].kdvOrani = parseFloat(kdv) || 20;
    setCart(newCart);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  // Toplam hesaplamaları
  const cartTotal = cart.reduce((sum, item) => {
    const unitPrice = parseFloat(item.alis_fiyati) || parseFloat(item.price) || 0;
    return sum + (unitPrice * item.quantity);
  }, 0);
  
  const discountedTotal = cartTotal * (1 - discount / 100);
  
  const grandTotal = discountedTotal * (1 + profit / 100);

  const copyToClipboard = () => {
    let text = `PROJE KEŞİF LİSTESİ (İskonto: %${discount})\n--------------------------------\n`;
    cart.forEach(item => {
      const lineTotal = calculateDiscountedPrice(item.price) * item.quantity;
      text += `${item.category} - ${item.name} | ${item.quantity}mt | Birim: ${calculateDiscountedPrice(item.price).toFixed(2)} TL | Toplam: ${lineTotal.toFixed(2)} TL\n`;
    });
    text += `--------------------------------\nGENEL TOPLAM: ${grandTotal.toFixed(2)} TL`;
    
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert("Liste panoya kopyalandı!");
  };

  // Senaryo Uygulama Fonksiyonu (Düzeltilmiş - Tüm malzemeleri ekler)
  const applyScenario = (scenario) => {
    let addedCount = 0;
    let notFoundItems = [];
    
    scenario.items.forEach(scenarioItem => {
      // Her senaryo item için en uygun malzemeyi bul
      const matchingItems = initialData.filter(item => 
        item.name.toLowerCase().includes(scenarioItem.search.toLowerCase()) ||
        item.category.toLowerCase().includes(scenarioItem.search.toLowerCase())
      );
      
      if (matchingItems.length > 0) {
        // İlk eşleşen malzemeyi sepete ekle
        addToCart(matchingItems[0], scenarioItem.quantity);
        addedCount++;
      } else {
        notFoundItems.push(scenarioItem.search);
      }
    });
    
    setIsScenarioModalOpen(false);
    
    let message = `✅ Senaryo uygulandı!\n${addedCount}/${scenario.items.length} malzeme sepetinize eklendi.`;
    if (notFoundItems.length > 0) {
      message += `\n\n⚠️ Bulunamayan malzemeler:\n${notFoundItems.join(', ')}`;
    }
    alert(message);
  };
  
  // Teklif Kaydetme
  const saveTeklif = () => {
    if (!teklifForm.musteriAdi || cart.length === 0) {
      alert('Lütfen müşteri adı girin ve sepete en az bir ürün ekleyin.');
      return;
    }
    
    const teklifData = {
      id: Date.now(),
      date: new Date().toLocaleString('tr-TR'),
      teklifForm: { ...teklifForm },
      cart: [...cart],
      discount: discount,
      profit: profit,
      logo: companyLogo
    };
    
    const existingTeklifler = JSON.parse(localStorage.getItem('kesifTeklifler') || '[]');
    existingTeklifler.push(teklifData);
    localStorage.setItem('kesifTeklifler', JSON.stringify(existingTeklifler));
    
    setSavedTeklifler(existingTeklifler);
    alert(`✅ Teklif kaydedildi!\nTeklif No: ${teklifForm.teklifNo}`);
  };
  
  // Kaydedilmiş Teklifleri Yükle
  const loadSavedTeklifler = () => {
    const saved = JSON.parse(localStorage.getItem('kesifTeklifler') || '[]');
    setSavedTeklifler(saved);
    setIsSavedTeklifModalOpen(true);
  };
  
  // Teklif Yükle
  const loadTeklif = (teklif) => {
    setTeklifForm(teklif.teklifForm);
    setCart(teklif.cart);
    setDiscount(teklif.discount);
    setProfit(teklif.profit);
    if (teklif.logo) setCompanyLogo(teklif.logo);
    setIsSavedTeklifModalOpen(false);
    alert(`✅ Teklif yüklendi!\nTeklif No: ${teklif.teklifForm.teklifNo}`);
  };
  
  // Teklif Sil
  const deleteTeklif = (id) => {
    if (!confirm('Bu teklifi silmek istediğinizden emin misiniz?')) return;
    
    const updated = savedTeklifler.filter(t => t.id !== id);
    localStorage.setItem('kesifTeklifler', JSON.stringify(updated));
    setSavedTeklifler(updated);
    alert('✅ Teklif silindi!');
  };

  // --- GEMINI API INTEGRATION ---
  
  const callGemini = async (prompt, systemInstruction) => {
    const apiKey = "AIzaSyD-s_cP_3jY35zDqHQ3T8ceLy0g4Lh1-Aw"; // Runtime environment provides this
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: "application/json"
          }
        }),
      }
    );

    if (!response.ok) throw new Error("API call failed");
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text;
  };

  const callGeminiText = async (prompt, systemInstruction) => {
      const apiKey = "AIzaSyD-s_cP_3jY35zDqHQ3T8ceLy0g4Lh1-Aw"; // Runtime environment provides this
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
          }),
        }
      );
  
      if (!response.ok) throw new Error("API call failed");
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text;
    };

  const handleAiEstimation = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    
    const catalogSummary = JSON.stringify(initialData.map(d => ({name: d.name, category: d.category})));
    const systemPrompt = `
      Sen uzman bir elektrik proje mühendisisin. Kullanıcının tarif ettiği yapı projesi için gerekli kablo metrajlarını ve çeşitlerini tahmin edeceksin.
      Elinizdeki Katalog Verisi: ${catalogSummary}
      
      Kural 1: Sadece bu katalogdaki "name" ve "category" değerlerini kullanabilirsin. Eşleşmeyen ürün uydurma.
      Kural 2: Miktarları (metre cinsinden) gerçekçi tahmin et (örneğin 3+1 daire için yaklaşık priz linyesi, aydınlatma linyesi vb.).
      Kural 3: Çıktı SADECE JSON formatında bir dizi olmalı: [{"category": "...", "name": "...", "quantity": 100}, ...]
    `;

    try {
      const responseText = await callGemini(aiPrompt, systemPrompt);
      const items = JSON.parse(responseText);
      
      // Bulunan öğeleri sepete ekle (fiyat eşleştirmesi yaparak)
      const newItemsCount = items.length;
      items.forEach(suggested => {
        const matched = initialData.find(d => d.name === suggested.name && d.category === suggested.category);
        if (matched) {
          addToCart(matched, suggested.quantity);
        }
      });
      
      setAiPrompt("");
      setIsAiModalOpen(false);
      alert(`${newItemsCount} kalem malzeme listeye eklendi!`);
    } catch (error) {
      console.error(error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateEmail = async () => {
    if (cart.length === 0) return;
    setIsEmailModalOpen(true);
    setAiLoading(true);
    setGeneratedEmail("");

    const cartDetails = cart.map(c => `${c.category} ${c.name}: ${c.quantity}m (Birim İskontolu: ${calculateDiscountedPrice(c.price).toFixed(2)} TL)`).join("\n");
    const systemPrompt = "Sen profesyonel bir satış mühendisisin. Müşteriye sunulmak üzere kibar, ikna edici ve profesyonel bir fiyat teklifi e-postası yaz. Türkçe dilinde yaz.";
    const userPrompt = `
      Aşağıdaki malzemeler için bir teklif mektubu taslağı oluştur:
      Malzemeler:
      ${cartDetails}
      
      Toplam Tutar: ${grandTotal.toFixed(2)} TL
      Uygulanan İskonto Oranı: %${discount}
      
      Not: Sadece mail içeriğini yaz, başlık ekle.
    `;

    try {
      const emailText = await callGeminiText(userPrompt, systemPrompt);
      setGeneratedEmail(emailText);
    } catch (error) {
      console.error(error);
      setGeneratedEmail("E-posta oluşturulurken hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setAiLoading(false);
    }
  };

  // --- PDF TEKLİF HAZIRLAMA ---
  const generatePDF = async (downloadNow = false) => {
    if (cart.length === 0) {
      alert('Sepetiniz boş! Lütfen önce malzeme ekleyin.');
      return;
    }

    if (downloadNow) {
      // Direkt indirme - eski jsPDF yöntemi
      await generateSimplePDF();
    } else {
      // Önizleme modu - yeni HTML-based PDF
      await generateHTMLPDF();
    }
  };

  // Basit jsPDF indirme (hızlı)
  const generateSimplePDF = async () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica");
    
    let currentY = 20;
    
    if (companyLogo) {
      try {
        doc.addImage(companyLogo, 'PNG', 20, currentY, 30, 30);
        currentY += 35;
      } catch (e) {
        console.error("Logo eklenemedi:", e);
        currentY = 20;
      }
    }
    
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("FIYAT TEKLIFI", 105, currentY, { align: 'center' });
    currentY += 5;
    
    doc.setLineWidth(0.5);
    doc.line(20, currentY, 190, currentY);
    currentY += 10;
    
    // Firma Bilgileri (Sol)
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("SATICI FIRMA:", 20, currentY);
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("Kobinerji Muhendislik", 20, currentY + 5);
    doc.text("Adres: Izmir, Turkiye", 20, currentY + 10);
    doc.text("Tel: +90 535 714 52 88", 20, currentY + 15);
    doc.text("E-posta: info@kobinerji.com.tr", 20, currentY + 20);
    
    // Müşteri Bilgileri (Sağ)
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("MUSTERI:", 120, currentY);
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(teklifForm.firmaAdi || "...", 120, currentY + 5);
    doc.text(teklifForm.yetkiliKisi || "...", 120, currentY + 10);
    doc.text(teklifForm.telefon || "...", 120, currentY + 15);
    doc.text(teklifForm.email || "...", 120, currentY + 20);
    doc.text(teklifForm.adres || "...", 120, currentY + 25, { maxWidth: 70 });
    
    currentY += 35;
    
    // Teklif Detayları
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(`Teklif No: ${teklifForm.teklifNo}`, 20, currentY);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, currentY + 5);
    doc.text(`Proje: ${teklifForm.projeAdi || "Genel"}`, 20, currentY + 10);
    doc.text(`Gecerlilik: ${teklifForm.gecerlilikSuresi}`, 20, currentY + 15);
    
    currentY += 25;
    
    // Tablo
    const tableData = cart.map((item, idx) => [
      idx + 1,
      item.category,
      item.name,
      item.quantity,
      `${item.price.toFixed(2)} TL`,
      `%${discount}`,
      `${calculateDiscountedPrice(item.price).toFixed(2)} TL`,
      `${(calculateDiscountedPrice(item.price) * item.quantity).toFixed(2)} TL`
    ]);
    
    doc.autoTable({
      startY: currentY,
      head: [['#', 'Kategori', 'Malzeme Adi', 'Miktar', 'Birim Fiyat', 'Iskonto', 'Isk. Fiyat', 'Toplam']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 25 },
        2: { cellWidth: 60 },
        3: { cellWidth: 15 },
        4: { cellWidth: 20 },
        5: { cellWidth: 15 },
        6: { cellWidth: 20 },
        7: { cellWidth: 25 }
      },
      margin: { left: 10, right: 10 }
    });
    
    // Toplam Hesaplamalar
    const finalY = doc.lastAutoTable.finalY + 10;
    const araTopla = cart.reduce((sum, item) => sum + (calculateDiscountedPrice(item.price) * item.quantity), 0);
    const kdvTutari = araTopla * (teklifForm.kdvOrani / 100);
    const genelToplam = araTopla + kdvTutari;
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Ara Toplam:`, 130, finalY);
    doc.text(`${araTopla.toFixed(2)} TL`, 175, finalY, { align: 'right' });
    
    doc.text(`KDV (%${teklifForm.kdvOrani}):`, 130, finalY + 6);
    doc.text(`${kdvTutari.toFixed(2)} TL`, 175, finalY + 6, { align: 'right' });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`GENEL TOPLAM:`, 130, finalY + 14);
    doc.text(`${genelToplam.toFixed(2)} TL`, 175, finalY + 14, { align: 'right' });
    
    // Müşteri Notu (Varsa)
    let notesY = finalY + 25;
    if (teklifForm.aciklama && teklifForm.aciklama.trim()) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("OZEL NOTLAR:", 20, notesY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(teklifForm.aciklama, 20, notesY + 5, { maxWidth: 170 });
      notesY += 20;
    }
    
    // GENEL ŞARTLAR VE ÖDEME KOŞULLARI
    doc.addPage();
    let y = 20;
    
    // Başlık
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 128, 185);
    doc.text("GENEL SARTLAR VE ODEME KOSULLARI", 105, y, { align: 'center' });
    y += 10;
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;
    
    // 1. Ödeme Planı
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("1. ODEME PLANI", 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const odemeText = "Isbu teklif bedeli; %50 siparis onayi ile birlikte avans (pesin), kalan %50 bakiye is tesliminde vadesiz (pesin) olarak tahsil edilecek sekilde hesaplanmistir.";
    doc.text(odemeText, 20, y, { maxWidth: 170 });
    y += 15;
    
    // 2. Fiyatlandırma Esası
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("2. FIYATLANDIRMA ESASI", 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const fiyatText = "Birim fiyatlarimiz nakit/havale odeme kosuluna gore iskontolu olarak sunulmustur. Cek, senet veya vadeli odeme taleplerinde, guncel finansal maliyetler ve vade farki oranlari fiyata ayrica yansitilir.";
    doc.text(fiyatText, 20, y, { maxWidth: 170 });
    y += 15;
    
    // 3. Teklif Geçerliliği
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("3. TEKLIF GECERLILIGI", 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const gecerlilikText = `Teklifimizde yer alan kablo ve trafo gibi emtia piyasalarina (Bakir/LME ve Doviz) endeksli urunler nedeniyle, teklifimiz ${teklifForm.gecerlilikSuresi} sureyle gecerlidir. Bu sureden sonra olusabilecek maliyet artislarini revize etme hakkimiz saklidir.`;
    doc.text(gecerlilikText, 20, y, { maxWidth: 170 });
    y += 18;
    
    // 4. Teslimat Süresi
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("4. TESLIMAT SURESI", 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const teslimatText = "Malzeme termin ve is teslim suresi, avans odemesinin sirket hesaplarimiza gecmesiyle baslar. Standart teslimat suresi 10-15 is gunudur.";
    doc.text(teslimatText, 20, y, { maxWidth: 170 });
    y += 15;
    
    // 5. Montaj ve Sorumluluk
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("5. MONTAJ VE SORUMLULUK", 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const montajText = "Montaj sahasinin is guvenligine uygun ve calismaya hazir hale getirilmesi (hafriyat, insaat isleri vb.) isverenin sorumlulugundadir. Montaj oncesi gerekli altyapi hazirliklari tamamlanmis olmalidir.";
    doc.text(montajText, 20, y, { maxWidth: 170 });
    y += 18;
    
    // 6. Garanti ve Servis
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("6. GARANTI VE SERVIS", 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const garantiText = "Tum ekipmanlar orijinal, sifir ve gerekli kalite sertifikalari ile teslim edilir. Iscilik garantisi 1 (bir) yil, ekipman garantileri uretici firma garantileri cercevesindedir.";
    doc.text(garantiText, 20, y, { maxWidth: 170 });
    y += 15;
    
    // 7. Kapsam
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("7. KAPSAM", 20, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("- Tum malzemelerin tedariki", 20, y);
    y += 5;
    doc.text("- Profesyonel montaj ve kurulum", 20, y);
    y += 5;
    doc.text("- Sistem devreye alma ve test islemleri", 20, y);
    y += 5;
    doc.text("- Teknik destek ve danismanlik", 20, y);
    y += 10;
    
    // Footer - Genel Şartlar Sayfası
    const pageHeight = doc.internal.pageSize.height;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 25, 190, pageHeight - 25);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(41, 128, 185);
    doc.text("KOBINERJI MUHENDISLIK", 105, pageHeight - 20, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Izmir, Turkiye | Tel: +90 535 714 52 88", 105, pageHeight - 16, { align: 'center' });
    doc.text("www.kobinerji.com.tr | info@kobinerji.com.tr", 105, pageHeight - 12, { align: 'center' });
    doc.setFontSize(7);    
    doc.save(`Teklif_${teklifForm.teklifNo}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`);
    alert('PDF indiriliyor! ✅ İndirme klasörünüzü kontrol edin.');
    setIsTeklifModalOpen(false);
  };

  // HTML-based PDF (önizleme için - App.jsx GES PDF tarzı)
  const generateHTMLPDF = async () => {
    if (!teklifForm.musteriAdi || !teklifForm.firmaAdi || !teklifForm.yetkili || cart.length === 0) {
      if (!teklifForm.musteriAdi || !teklifForm.firmaAdi || !teklifForm.yetkili) {
        setIsMusteriModalOpen(true);
      } else {
        alert('Lütfen ürün ekleyin.');
      }
      return;
    }
    
    // Önizleme açmadan önce PDF içeriğini hazırla
    setIsPdfPreviewOpen(true);
    setIsTeklifModalOpen(false);
    
    // DOM'un render olması için bekle
    await new Promise(resolve => setTimeout(resolve, 100));
  };
  
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCompanyLogo(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="bg-blue-800 text-white p-3 md:p-4 shadow-lg shrink-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
            <div>
              <h1 className="text-lg md:text-2xl font-bold">KabloMetraj Pro</h1>
              <p className="text-[10px] md:text-xs text-blue-200">Serer Fiyat Listesi Baz Alınmıştır</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex items-center gap-2 bg-blue-700 p-2 rounded-lg border border-blue-600">
              <label className="text-xs md:text-sm font-semibold whitespace-nowrap">İskonto (%):</label>
              <input 
                type="number" 
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-12 md:w-16 p-1.5 md:p-2 text-black text-center font-bold text-sm md:text-base rounded shadow-inner outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div className="flex items-center gap-2 bg-green-700 p-2 rounded-lg border border-green-600">
              <label className="text-xs md:text-sm font-semibold whitespace-nowrap">Kâr (%):</label>
              <input 
                type="number" 
                value={profit}
                onChange={(e) => setProfit(parseFloat(e.target.value) || 0)}
                className="w-12 md:w-16 p-1.5 md:p-2 text-black text-center font-bold text-sm md:text-base rounded shadow-inner outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full h-full p-2 md:p-4 flex flex-col lg:flex-row gap-3 md:gap-6 overflow-hidden">
        
        {/* Sol Panel: Ürün Seçimi */}
        <div className="flex-1 flex flex-col space-y-3 md:space-y-4 overflow-hidden">
          
          {/* Arama ve Filtre */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-3">
            {/* Arama Alanı - Üstte tam genişlik */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 md:w-6 md:h-6" />
              <input
                type="text"
                placeholder="🔍 Malzeme ara... (örn: NYY 4x25, Otomat, LED)"
                className="w-full pl-12 md:pl-14 pr-12 py-3 md:py-3.5 text-sm md:text-base rounded-lg border-2 border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {/* Butonlar - Grid düzende */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              <button 
                onClick={() => setIsNewProductModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium shadow-md transition-colors"
                title="Listede Olmayan Özel Ürün Ekle - Kendi ürününüzü manuel olarak ekleyin"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Ürün</span>
              </button>
              <button 
                onClick={() => setIsMusteriModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium shadow-md transition-colors"
                title="Müşteri Bilgilerini Düzenle"
              >
                <User className="w-4 h-4" />
                <span>Müşteri Bilgileri</span>
              </button>
              <button 
                onClick={() => setIsScenarioModalOpen(true)}
                className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium shadow-md transition-colors"
                title="Hazır Senaryolar - Trafo değişimi, pano revizyonu gibi hazır paketleri yükle"
              >
                <FileText className="w-4 h-4" />
                <span>Hazır Senaryolar</span>
              </button>
              <button 
                onClick={loadSavedTeklifler}
                className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium shadow-md transition-colors"
                title="Kaydedilmiş Teklifler - Daha önce kaydetmiş olduğunuz teklifleri görüntüle ve yükle"
              >
                <Save className="w-4 h-4" />
                <span>Teklifler</span>
              </button>
              <button 
                onClick={() => setIsAiModalOpen(true)}
                className="col-span-2 sm:col-span-3 lg:col-span-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold shadow-lg transition-all"
                title="Yapay Zeka ile Akıllı Keşif - Proje tanımınızı yazın, gerekli malzemeleri otomatik bulsun!"
              >
                <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                <span>AI Akıllı Keşif</span>
              </button>
            </div>

            {/* Kategori Filtreleri */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Ürün Listesi Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-3 pb-4">
            {filteredData.map((item, index) => {
              const discountedPrice = calculateDiscountedPrice(item.price);
              return (
                <div key={index} className="bg-white p-3 md:p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow group flex flex-col justify-between relative">
                  {/* Düzenle Butonu - Sağ üst köşe */}
                  <button
                    onClick={() => {
                      setEditingProduct({ ...item, originalName: item.name });
                      setIsProductEditModalOpen(true);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Ürünü Düzenle"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-gray-600" />
                  </button>

                  <div>
                    <span className="text-[10px] md:text-xs font-bold text-blue-600 bg-blue-50 px-1.5 md:px-2 py-0.5 rounded mb-1 inline-block">
                      {item.category}
                    </span>
                    <h3 className="font-bold text-gray-800 text-sm md:text-base leading-tight pr-8">{item.name}</h3>
                  </div>
                  
                  <div className="mt-2 md:mt-3 flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[10px] md:text-xs text-gray-400 line-through">Liste: {item.price.toFixed(2)} TL</span>
                      <span className="text-base md:text-xl font-bold text-green-600">{discountedPrice.toFixed(2)} TL</span>
                    </div>
                    <button 
                      onClick={() => addToCart(item)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 md:p-2 rounded-full shadow-lg active:scale-95 transition-transform"
                    >
                      <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Sağ Panel: Hesap/Metraj Listesi */}
        <div className="lg:w-96 flex flex-col shrink-0 h-full">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-full flex flex-col">
            <div className="bg-gray-800 text-white p-3 md:p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <h2 className="font-bold">Keşif Listesi</h2>
              </div>
              <span className="bg-gray-700 px-2 py-0.5 rounded-full text-xs">
                {cart.length} Kalem
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center py-10 opacity-50 flex flex-col items-center">
                  <FileText className="w-12 h-12 mb-2" />
                  <p>Liste boş.</p>
                  <p className="text-sm">Kabloları ekleyerek metrajı girin.</p>
                </div>
              ) : (
                cart.map((item, index) => {
                  const unitPrice = parseFloat(item.alis_fiyati) || parseFloat(item.price) || 0;
                  const lineTotal = unitPrice * item.quantity;
                  return (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.category}</p>
                        </div>
                        <button onClick={() => removeFromCart(index)} className="text-red-400 hover:text-red-600 ml-2">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Açıklama Alanı */}
                      <div className="mb-2">
                        <input
                          type="text"
                          placeholder="Açıklama ekle (opsiyonel)..."
                          value={item.description || ''}
                          onChange={(e) => updateItemDescription(index, e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 bg-white border rounded px-1">
                          <input 
                            type="number" 
                            className="w-16 p-1 text-center font-bold outline-none"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(index, e.target.value)}
                          />
                          <span className="text-xs text-gray-400 select-none">adet</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">KDV:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.kdvOrani || 20}
                            onChange={(e) => updateItemKdv(index, e.target.value)}
                            className="w-12 px-1 py-0.5 text-xs text-center border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">{unitPrice.toFixed(2)} x {item.quantity}</div>
                          <div className="font-bold text-gray-800">{lineTotal.toFixed(2)} TL</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 md:p-4 bg-gray-100 border-t border-gray-200 space-y-2 md:space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Ara Toplam:</span>
                  <span className="font-semibold">{cartTotal.toFixed(2)} TL</span>
                </div>
                <div className="flex justify-between items-center text-red-600">
                  <span>İskonto (%{discount}):</span>
                  <span className="font-semibold">-{(cartTotal * (discount / 100)).toFixed(2)} TL</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>İskonto Sonrası:</span>
                  <span className="font-semibold">{discountedTotal.toFixed(2)} TL</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span>Kâr (%{profit}):</span>
                  <span className="font-semibold">+{(discountedTotal * (profit / 100)).toFixed(2)} TL</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <span className="font-bold text-gray-800">Genel Toplam:</span>
                  <span className="text-xl font-bold text-blue-700">{grandTotal.toFixed(2)} TL</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200">
                 <button 
                  onClick={() => {
                    if (cart.length > 0) {
                      // Müşteri bilgilerini kontrol et
                      if (!teklifForm.musteriAdi || !teklifForm.firmaAdi || !teklifForm.yetkili) {
                        setIsMusteriModalOpen(true);
                        return;
                      }
                      setIsPdfPreviewOpen(true);
                    }
                  }}
                  disabled={cart.length === 0}
                  className={`flex items-center justify-center gap-1 py-2 rounded-lg font-bold text-xs md:text-sm transition-colors ${
                    cart.length === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Önizle</span>
                  <span className="sm:hidden">PDF</span>
                </button>
                <button 
                  onClick={saveTeklif}
                  disabled={cart.length === 0}
                  className={`flex items-center justify-center gap-1 py-2 rounded-lg font-bold text-xs md:text-sm transition-colors ${
                    cart.length === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                  }`}
                >
                  <Save className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">Kaydet</span>
                  <span className="sm:hidden">💾</span>
                </button>
                <button 
                  onClick={copyToClipboard}
                  disabled={cart.length === 0}
                  className={`flex items-center justify-center gap-1 py-2 rounded-lg font-bold text-xs md:text-sm transition-colors ${
                    cart.length === 0 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  Kopyala
                </button>
              </div>
              <button 
                onClick={handleGenerateEmail}
                disabled={cart.length === 0}
                className={`w-full flex items-center justify-center gap-1 py-2 rounded-lg font-bold text-xs md:text-sm transition-colors ${
                  cart.length === 0 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden sm:inline">AI E-posta Oluştur</span>
                <span className="sm:hidden">AI E-posta</span>
              </button>
            </div>
          </div>
        </div>

      </div>
      </div>

      {/* Teklif Hazırlama Modal */}
      {isTeklifModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-4 md:my-8">
            <div className="bg-red-600 p-3 md:p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 md:w-6 md:h-6" />
                <h3 className="font-bold text-base md:text-lg">Profesyonel Teklif Hazırla</h3>
              </div>
              <button onClick={() => setIsTeklifModalOpen(false)}><X className="w-5 h-5 md:w-6 md:h-6" /></button>
            </div>
            <div className="p-4 md:p-6 space-y-3 md:space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200">
                <p className="text-xs md:text-sm text-blue-800 font-medium">
                  📋 Müşteri ve proje bilgilerini girin, ardından PDF olarak indirebilirsiniz.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri Adı *</label>
                  <input
                    type="text"
                    value={teklifForm.musteriAdi}
                    onChange={(e) => setTeklifForm({...teklifForm, musteriAdi: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Şirket veya Kişi Adı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firma Adı *</label>
                  <input
                    type="text"
                    value={teklifForm.firmaAdi}
                    onChange={(e) => setTeklifForm({...teklifForm, firmaAdi: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="ABC Mühendislik Ltd."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yetkili Kişi *</label>
                  <input
                    type="text"
                    value={teklifForm.yetkili}
                    onChange={(e) => setTeklifForm({...teklifForm, yetkili: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Ahmet Yılmaz"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="tel"
                    value={teklifForm.telefon}
                    onChange={(e) => setTeklifForm({...teklifForm, telefon: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="+90 555 123 45 67"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    value={teklifForm.email}
                    onChange={(e) => setTeklifForm({...teklifForm, email: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="info@firma.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <input
                  type="text"
                  value={teklifForm.adres}
                  onChange={(e) => setTeklifForm({...teklifForm, adres: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="İstanbul, Türkiye"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proje Adı</label>
                  <input
                    type="text"
                    value={teklifForm.projeAdi}
                    onChange={(e) => setTeklifForm({...teklifForm, projeAdi: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Fabrika Elektrik İşleri"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KDV Oranı (%)</label>
                  <input
                    type="number"
                    value={teklifForm.kdvOrani}
                    onChange={(e) => setTeklifForm({...teklifForm, kdvOrani: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teklif No</label>
                  <input
                    type="text"
                    value={teklifForm.teklifNo}
                    onChange={(e) => setTeklifForm({...teklifForm, teklifNo: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Geçerlilik Süresi</label>
                  <input
                    type="text"
                    value={teklifForm.gecerlilikSuresi}
                    onChange={(e) => setTeklifForm({...teklifForm, gecerlilikSuresi: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="30 gün"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama / Notlar</label>
                <textarea
                  value={teklifForm.aciklama}
                  onChange={(e) => setTeklifForm({...teklifForm, aciklama: e.target.value})}
                  rows="3"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="Ek bilgiler, ödeme koşulları, teslim süresi vb."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firma Logosu</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => setCompanyLogo(e.target.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-red-100 file:text-red-700 file:hover:bg-red-200 file:cursor-pointer"
                />
                {companyLogo && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-gray-50 rounded-lg border">
                    <img src={companyLogo} alt="Logo" className="w-16 h-16 object-contain" />
                    <div className="flex-1 text-xs text-gray-600">
                      Logo yüklendi ✓
                    </div>
                    <button
                      onClick={() => setCompanyLogo('/fatura_logo.png')}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                      title="Varsayılan logoya dön"
                    >
                      Sıfırla
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-bold text-gray-700 mb-2">Teklif Özeti</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam Kalem:</span>
                    <span className="font-semibold">{cart.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ara Toplam:</span>
                    <span className="font-semibold">{grandTotal.toFixed(2)} TL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">KDV ({teklifForm.kdvOrani}%):</span>
                    <span className="font-semibold">{(grandTotal * teklifForm.kdvOrani / 100).toFixed(2)} TL</span>
                  </div>
                  <div className="flex justify-between text-lg pt-2 border-t">
                    <span className="text-gray-800 font-bold">Genel Toplam:</span>
                    <span className="font-bold text-red-600">{(grandTotal * (1 + teklifForm.kdvOrani / 100)).toFixed(2)} TL</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => generatePDF(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  <span className="hidden sm:inline">Önizle</span>
                </button>
                <button
                  onClick={() => generatePDF(true)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                  <span className="hidden sm:inline">İndir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Müşteri Bilgileri Modal - İlk Açılış */}
      {isMusteriModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 md:p-6 text-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-xl md:text-2xl">Müşteri Bilgileri</h3>
                  <p className="text-sm text-blue-100">Teklif hazırlamadan önce müşteri bilgilerini girin</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Bilgi:</strong> Bu bilgiler PDF teklifinizde görünecektir. Zorunlu alanları doldurun.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Müşteri Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={teklifForm.musteriAdi}
                    onChange={(e) => setTeklifForm({...teklifForm, musteriAdi: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="Örn: ABC İnşaat Ltd. Şti."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Firma Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={teklifForm.firmaAdi}
                    onChange={(e) => setTeklifForm({...teklifForm, firmaAdi: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Sizin firma adınız"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Yetkili Kişi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={teklifForm.yetkili}
                    onChange={(e) => setTeklifForm({...teklifForm, yetkili: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Sizin adınız"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={teklifForm.telefon}
                    onChange={(e) => setTeklifForm({...teklifForm, telefon: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="+90 555 123 45 67"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">E-posta</label>
                  <input
                    type="email"
                    value={teklifForm.email}
                    onChange={(e) => setTeklifForm({...teklifForm, email: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="info@firma.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Proje Adı</label>
                  <input
                    type="text"
                    value={teklifForm.projeAdi}
                    onChange={(e) => setTeklifForm({...teklifForm, projeAdi: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Örn: Fabrika Elektrik İşleri"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Adres</label>
                  <input
                    type="text"
                    value={teklifForm.adres}
                    onChange={(e) => setTeklifForm({...teklifForm, adres: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="İstanbul, Türkiye"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    if (!teklifForm.musteriAdi || !teklifForm.firmaAdi || !teklifForm.yetkili) {
                      alert('⚠️ Lütfen zorunlu alanları doldurun (Müşteri Adı, Firma Adı, Yetkili Kişi)');
                      return;
                    }
                    setIsMusteriModalOpen(false);
                    // Eğer callback sağlanmışsa, müşteri bilgilerini güncelle
                    if (onCustomerUpdate && typeof onCustomerUpdate === 'function') {
                      onCustomerUpdate(teklifForm);
                    }
                    // Keşif Metraj'ın kendi PDF önizlemesini aç
                    if (cart.length > 0) {
                      setTimeout(() => setIsPdfPreviewOpen(true), 300);
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl"
                >
                  ✓ Kaydet ve Önizle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Estimation Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-purple-700 p-3 md:p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-300" />
                <h3 className="font-bold text-base md:text-lg">Akıllı Keşif Sihirbazı</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)}><X className="w-5 h-5 md:w-6 md:h-6" /></button>
            </div>
            <div className="p-4 md:p-6">
              <p className="text-gray-600 mb-3 md:mb-4 text-xs md:text-sm">
                Projenizi kısaca anlatın, sizin için tahmini bir kablo listesi oluşturalım.
                <br/>
                <span className="italic text-gray-400">Örn: "150 metrekare, 3+1 daire elektrik tesisatı için gerekli malzemeler."</span>
              </p>
              
              <textarea 
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none mb-4"
                placeholder="Proje detaylarını buraya yazın..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              
              <button 
                onClick={handleAiEstimation}
                disabled={aiLoading || !aiPrompt.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                {aiLoading ? "Analiz Ediliyor..." : "Listeyi Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hazır Senaryolar Modal */}
      {isScenarioModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-4 md:my-8">
            <div className="bg-green-700 p-3 md:p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 md:w-6 md:h-6" />
                <h3 className="font-bold text-base md:text-lg">Hazır Proje Senaryoları</h3>
              </div>
              <button onClick={() => setIsScenarioModalOpen(false)}>
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
              <div className="bg-blue-50 p-3 md:p-4 rounded-lg border border-blue-200 mb-4">
                <p className="text-xs md:text-sm text-blue-800">
                  <strong>💡 İpucu:</strong> Aşağıdaki hazır senaryolardan birini seçin ve tüm gerekli malzemeler otomatik olarak sepetinize eklensin!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {scenarios.map(scenario => {
                  // Senaryo maliyeti hesapla
                  let estimatedCost = 0;
                  scenario.items.forEach(item => {
                    const matches = initialData.filter(d => 
                      d.name.toLowerCase().includes(item.search.toLowerCase())
                    );
                    if (matches.length > 0) {
                      estimatedCost += calculateDiscountedPrice(matches[0].price) * item.quantity;
                    }
                  });

                  return (
                    <div 
                      key={scenario.id}
                      className="bg-white border-2 border-gray-200 hover:border-green-500 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg group"
                      onClick={() => applyScenario(scenario)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="text-3xl">{scenario.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-sm md:text-base group-hover:text-green-600 transition-colors">
                            {scenario.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {scenario.description}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-2 mb-3">
                        <div className="text-xs text-gray-600 mb-1">
                          <strong>{scenario.items.length}</strong> farklı malzeme türü
                        </div>
                        <div className="text-xs text-gray-500 max-h-16 overflow-y-auto">
                          {scenario.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>• {item.search}</span>
                              <span className="font-medium">{item.quantity}mt</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500">Tahmini Maliyet:</div>
                        <div className="text-base font-bold text-green-600">
                          {estimatedCost > 0 ? `${estimatedCost.toFixed(2)} TL` : 'Hesaplanıyor...'}
                        </div>
                      </div>

                      <button className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 group-hover:bg-green-700">
                        <Plus className="w-4 h-4" />
                        Sepete Ekle
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kaydedilmiş Teklifler Modal */}
      {isSavedTeklifModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-4 md:my-8">
            <div className="bg-blue-700 p-3 md:p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Save className="w-5 h-5 md:w-6 md:h-6" />
                <h3 className="font-bold text-base md:text-lg">Kaydedilmiş Teklifler ({savedTeklifler.length})</h3>
              </div>
              <button onClick={() => setIsSavedTeklifModalOpen(false)}>
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
            <div className="p-4 md:p-6 max-h-[70vh] overflow-y-auto">
              {savedTeklifler.length === 0 ? (
                <div className="text-center py-12">
                  <Save className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg mb-2">Henüz kaydedilmiş teklif yok</p>
                  <p className="text-gray-400 text-sm">Sepetinize ürün ekleyip "Kaydet" butonuna tıklayarak teklif kaydedebilirsiniz.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedTeklifler.map(teklif => (
                    <div key={teklif.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-all shadow-sm hover:shadow-md">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h4 className="font-bold text-lg text-gray-800">{teklif.teklifForm.musteriAdi}</h4>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                              {teklif.teklifForm.teklifNo}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{teklif.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Cable className="w-4 h-4 text-gray-400" />
                              <span>{teklif.cart.length} ürün</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Percent className="w-4 h-4 text-gray-400" />
                              <span>İskonto: %{teklif.discount}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Banknote className="w-4 h-4 text-green-600" />
                              <span className="font-bold text-green-600">
                                {(teklif.cart.reduce((sum, item) => {
                                  const unitPrice = parseFloat(item.alis_fiyati) || 0;
                                  const totalPrice = unitPrice * item.quantity;
                                  const discounted = totalPrice * (1 - teklif.discount / 100);
                                  return sum + (discounted * (1 + teklif.profit / 100));
                                }, 0)).toFixed(2)} TL
                              </span>
                            </div>
                          </div>
                          {teklif.teklifForm.firmaAdi && (
                            <div className="mt-2 text-xs text-gray-500">
                              Firma: {teklif.teklifForm.firmaAdi}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-row md:flex-col gap-2">
                          <button
                            onClick={() => loadTeklif(teklif)}
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Yükle
                          </button>
                          <button
                            onClick={() => deleteTeklif(teklif.id)}
                            className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full my-4 md:my-8">
            <div className="bg-purple-700 p-3 md:p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 md:w-6 md:h-6" />
                <h3 className="font-bold text-base md:text-lg">AI Teklif E-postası</h3>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)}><X className="w-5 h-5 md:w-6 md:h-6" /></button>
            </div>
            <div className="p-4 md:p-6">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-16">
                  <Loader2 className="animate-spin w-12 h-12 md:w-16 md:h-16 text-purple-600 mb-4" />
                  <p className="text-gray-600 text-sm md:text-base">E-posta oluşturuluyor...</p>
                </div>
              ) : (
                <div>
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg border mb-3 md:mb-4 max-h-64 md:max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-xs md:text-sm text-gray-800 font-sans">{generatedEmail}</pre>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedEmail);
                      alert("E-posta panoya kopyalandı!");
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 md:py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors text-sm md:text-base"
                  >
                    <Copy className="w-4 h-4 md:w-5 md:h-5" />
                    E-postayı Kopyala
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
            <div className="bg-indigo-700 p-4 flex justify-between items-center text-white shrink-0">
              <div className="flex items-center gap-2">
                <Mail className="w-6 h-6" />
                <h3 className="font-bold text-lg">Teklif Mektubu Oluşturucu</h3>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)}><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {aiLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-indigo-600">
                  <Loader2 className="w-12 h-12 animate-spin mb-4" />
                  <p className="font-medium">Profesyonel teklifiniz yazılıyor...</p>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <textarea 
                    className="w-full h-96 p-4 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm leading-relaxed"
                    value={generatedEmail}
                    onChange={(e) => setGeneratedEmail(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-xl">
               <button 
                onClick={() => {
                   navigator.clipboard.writeText(generatedEmail);
                   alert("Teklif metni kopyalandı!");
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Metni Kopyala
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden PDF Preview Pages (App.jsx GES tarzı) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0' }}>
        {/* Sayfa 1: Teklif Ana Sayfa */}
        <div className="kesif-pdf-page" style={{ width: '210mm', height: '297mm', background: 'white', padding: '15mm 20mm 30mm 20mm', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box' }}>
          {/* Header Atlet - Logo ve Başlık */}
          <div style={{ marginBottom: '5mm', paddingBottom: '3mm', borderBottom: '2px solid #2980b9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6mm' }}>
              <div style={{ width: '40mm', flexShrink: 0 }}>
                {companyLogo && (
                  <img src={companyLogo} alt="Logo" style={{ width: '100%', height: 'auto', maxHeight: '20mm', objectFit: 'contain' }} />
                )}
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50', margin: '0 0 2mm 0', lineHeight: '1.1' }}>FİYAT TEKLİFİ</h1>
                <p style={{ fontSize: '10px', color: '#7f8c8d', margin: 0, lineHeight: '1.2' }}>Elektrik Malzeme Keşfi ve Metraj Teklifi</p>
              </div>
            </div>
          </div>

          {/* Firma ve Müşteri Bilgileri */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10mm', fontSize: '11px' }}>
            <div style={{ width: '48%' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2980b9', marginBottom: '5px' }}>FİRMA BİLGİLERİ</h3>
              <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Firma Adı:</strong> {teklifForm.firmaAdi || 'Kobinerji Mühendislik'}</p>
              <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Yetkili:</strong> {teklifForm.yetkili || 'Emrullah Günay'}</p>
              <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Telefon:</strong> {teklifForm.telefon || '+90 535 714 52 88'}</p>
              <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>E-posta:</strong> {teklifForm.email || 'info@kobinerji.com.tr'}</p>
              {teklifForm.adres && teklifForm.adres.trim() && (
                <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Adres:</strong> {teklifForm.adres}</p>
              )}
            </div>
            <div style={{ width: '48%' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2980b9', marginBottom: '5px' }}>MÜŞTERİ BİLGİLERİ</h3>
              <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Müşteri Adı:</strong> {teklifForm.musteriAdi}</p>
              {teklifForm.projeAdi && teklifForm.projeAdi.trim() && (
                <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Proje:</strong> {teklifForm.projeAdi}</p>
              )}
              <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Teklif No:</strong> {teklifForm.teklifNo}</p>
              <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Tarih:</strong> {teklifForm.tarih}</p>
              <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Geçerlilik:</strong> {teklifForm.gecerlilikSuresi}</p>
            </div>
          </div>

          {/* Ürün Tablosu */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px', marginBottom: '10mm' }}>
            <thead>
              <tr style={{ backgroundColor: '#2980b9', color: 'white' }}>
                <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'left', width: '4%' }}>No</th>
                <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'left', width: '42%' }}>Malzeme Adı</th>
                <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center', width: '9%' }}>Birim</th>
                <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center', width: '8%' }}>Miktar</th>
                <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right', width: '15%' }}>Birim Fiyat</th>
                <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'right', width: '17%' }}>Genel Toplam</th>
                <th style={{ border: '1px solid #ddd', padding: '4px', textAlign: 'center', width: '5%' }}>KDV</th>
              </tr>
            </thead>
            <tbody>
              {cart.slice(0, 150).map((item, index) => {
                const unitPrice = parseFloat(item.alis_fiyati) || 0;
                const totalPrice = unitPrice * item.quantity;
                const discountedPrice = totalPrice * (1 - (discount / 100));
                const finalTotal = discountedPrice * (1 + (profit / 100));
                
                return (
                  <React.Fragment key={index}>
                    <tr style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white', pageBreakInside: 'avoid' }}>
                      <td style={{ border: '1px solid #ddd', padding: '3px', textAlign: 'center', fontSize: '8px' }}>{index + 1}</td>
                      <td style={{ border: '1px solid #ddd', padding: '3px', fontSize: '8px', lineHeight: '1.3' }}>{item.malzeme_adi}</td>
                      <td style={{ border: '1px solid #ddd', padding: '3px', textAlign: 'center', fontSize: '8px' }}>{item.birim}</td>
                      <td style={{ border: '1px solid #ddd', padding: '3px', textAlign: 'center', fontSize: '8px' }}>{item.quantity}</td>
                      <td style={{ border: '1px solid #ddd', padding: '3px', textAlign: 'right', fontSize: '8px' }}>{unitPrice.toFixed(2)} TL</td>
                      <td style={{ border: '1px solid #ddd', padding: '3px', textAlign: 'right', fontWeight: 'bold', fontSize: '8px' }}>{finalTotal.toFixed(2)} TL</td>
                      <td style={{ border: '1px solid #ddd', padding: '3px', textAlign: 'center', fontSize: '7.5px' }}>%{item.kdvOrani || 20}</td>
                    </tr>
                    {item.description && item.description.trim() && (
                      <tr style={{ backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white', pageBreakInside: 'avoid' }}>
                        <td colSpan="7" style={{ border: '1px solid #ddd', borderTop: 'none', padding: '3px 3px 5px 20px', fontSize: '7.5px', fontStyle: 'italic', color: '#555', lineHeight: '1.2' }}>
                          <strong>Açıklama:</strong> {item.description}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {cart.length > 150 && (
                <tr>
                  <td colSpan="7" style={{ padding: '8px', textAlign: 'center', fontSize: '9px', backgroundColor: '#fff3cd', color: '#856404', fontWeight: 'bold' }}>
                    ⚠️ Gösterim sınırı: İlk 150 ürün gösteriliyor. Toplam {cart.length} ürün var.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Özet */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}>
            <div style={{ width: '45%', fontSize: '10px', border: '1px solid #ddd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #ecf0f1', backgroundColor: '#f9f9f9' }}>
                <span>Ara Toplam:</span>
                <span style={{ fontWeight: 'bold' }}>{cartTotal.toFixed(2)} TL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #ecf0f1', color: '#e74c3c' }}>
                <span>İskonto (%{discount}):</span>
                <span style={{ fontWeight: 'bold' }}>-{(cartTotal * (discount / 100)).toFixed(2)} TL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #ecf0f1', backgroundColor: '#f9f9f9' }}>
                <span>İskonto Sonrası:</span>
                <span style={{ fontWeight: 'bold' }}>{discountedTotal.toFixed(2)} TL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #ecf0f1', color: '#e67e22' }}>
                <span>KDV (%20):</span>
                <span style={{ fontWeight: 'bold' }}>+{(grandTotal * 0.20).toFixed(2)} TL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#2980b9', color: 'white' }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>GENEL TOPLAM:</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '10px' }}>{(grandTotal * 1.20).toFixed(2)} TL</span>
              </div>
            </div>
          </div>

          {/* Özel Notlar */}
          {teklifForm.aciklama && teklifForm.aciklama.trim() && (
            <div style={{ marginTop: '10mm', padding: '10px', backgroundColor: '#f8f9fa', borderLeft: '4px solid #2980b9' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>ÖZEL NOTLAR:</h3>
              <p style={{ fontSize: '10px', lineHeight: '1.6', color: '#555', margin: 0 }}>{teklifForm.aciklama}</p>
            </div>
          )}

          {/* Footer Atlet - Sayfa 1 */}
          <div style={{ position: 'absolute', bottom: '8mm', left: '20mm', right: '20mm', borderTop: '2px solid #2980b9', paddingTop: '4mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '8.5px', color: '#555', lineHeight: '1.4' }}>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#2980b9', fontSize: '9.5px' }}>Kobinerji Mühendislik</p>
                <p style={{ margin: '0 0 1px 0' }}>Tel: +90 535 714 52 88</p>
                <p style={{ margin: 0 }}>E-posta: info@kobinerji.com.tr</p>
              </div>
              <div style={{ textAlign: 'right', flex: 1 }}>
                <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '10px', color: '#2980b9' }}>Sayfa 1/2</p>
                <p style={{ margin: 0, fontSize: '8px', color: '#777' }}>{new Date().toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sayfa 2: Açıklamalar ve Şartlar */}
        <div className="kesif-pdf-page" style={{ width: '210mm', height: '297mm', background: 'white', padding: '12mm 20mm 25mm 20mm', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ marginBottom: '8mm', paddingBottom: '3mm', borderBottom: '2px solid #2980b9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6mm' }}>
              <div style={{ width: '40mm', flexShrink: 0 }}>
                {companyLogo && (
                  <img src={companyLogo} alt="Logo" style={{ width: '100%', height: 'auto', maxHeight: '20mm', objectFit: 'contain' }} />
                )}
              </div>
              <div style={{ flex: 1, textAlign: 'right' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2980b9', margin: '0 0 2mm 0', lineHeight: '1.1' }}>AÇIKLAMALAR VE GENEL ŞARTLAR</h1>
                <p style={{ fontSize: '9px', color: '#7f8c8d', margin: 0, lineHeight: '1.2' }}>Teklif No: {teklifForm.teklifNo}</p>
              </div>
            </div>
          </div>

          {/* Özel Açıklamalar */}
          {teklifForm.aciklama && teklifForm.aciklama.trim() && (
            <div style={{ marginBottom: '10mm', padding: '10px 12px', backgroundColor: '#f8f9fa', borderLeft: '4px solid #2980b9', borderRadius: '4px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '6px' }}>ÖZEL NOTLAR VE AÇIKLAMALAR</h3>
              <div style={{ fontSize: '11px', lineHeight: '1.8', color: '#555', whiteSpace: 'pre-line' }}>
                {teklifForm.aciklama}
              </div>
            </div>
          )}

          {/* 1. Ödeme Planı */}
          <div style={{ marginBottom: '8mm' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px', paddingBottom: '3px', borderBottom: '1px solid #e0e0e0' }}>1. ÖDEME PLANI</h3>
            <p style={{ fontSize: '10.5px', lineHeight: '1.8', color: '#555', textAlign: 'justify' }}>
              İşbu teklif bedeli; %50 sipariş onayı ile birlikte avans (peşin), kalan %50 bakiye iş tesliminde vadesiz (peşin) olarak tahsil edilecek şekilde hesaplanmıştır.
            </p>
          </div>

          {/* 2. Fiyatlandırma Esası */}
          <div style={{ marginBottom: '8mm' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px', paddingBottom: '3px', borderBottom: '1px solid #e0e0e0' }}>2. FİYATLANDIRMA ESASI</h3>
            <p style={{ fontSize: '10.5px', lineHeight: '1.8', color: '#555', textAlign: 'justify' }}>
              Birim fiyatlarımız nakit/havale ödeme koşuluna göre iskontolu olarak sunulmuştur. Çek, senet veya vadeli ödeme taleplerinde, güncel finansal maliyetler ve vade farkı oranları fiyata ayrıca yansıtılır.
            </p>
          </div>

          {/* 3. Teklif Geçerliliği */}
          <div style={{ marginBottom: '8mm' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>3. TEKLİF GEÇERLİLİĞİ</h3>
            <p style={{ fontSize: '11px', lineHeight: '1.8', color: '#555', textAlign: 'justify' }}>
              Teklifimizde yer alan kablo ve trafo gibi emtia piyasalarına (Bakır/LME ve Döviz) endeksli ürünler nedeniyle, teklifimiz {teklifForm.gecerlilikSuresi} süreyle geçerlidir. Bu süreden sonra oluşabilecek maliyet artışlarını revize etme hakkımız saklıdır.
            </p>
          </div>

          {/* 4. Teslimat Süresi */}
          <div style={{ marginBottom: '8mm' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>4. TESLİMAT SÜRESİ</h3>
            <p style={{ fontSize: '11px', lineHeight: '1.8', color: '#555', textAlign: 'justify' }}>
              Malzemeler sipariş onayı ve ön ödeme alındıktan sonra 7-14 iş günü içinde teslim edilecektir. Stokta olmayan özel ürünler için süre ayrıca bildirilecektir.
            </p>
          </div>

          {/* 5. Montaj ve Sorumluluk */}
          <div style={{ marginBottom: '8mm' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>5. MONTAJ HİZMETİ</h3>
            <p style={{ fontSize: '11px', lineHeight: '1.8', color: '#555', textAlign: 'justify' }}>
              Bu teklif sadece malzeme bedelini içermektedir. Montaj, işçilik ve sarf malzemesi hizmetleri talep edilmesi halinde ayrıca fiyatlandırılacaktır.
            </p>
          </div>

          {/* 6. Garanti ve Servis */}
          <div style={{ marginBottom: '8mm' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>6. GARANTİ</h3>
            <p style={{ fontSize: '11px', lineHeight: '1.8', color: '#555', textAlign: 'justify' }}>
              Tüm ürünler için üretici firma garantisi geçerlidir. Garanti süreleri ürün bazında farklılık gösterebilir ve ürün ile birlikte teslim edilecek garanti belgesi ekinde belirtilmiştir.
            </p>
          </div>

          {/* 7. Kapsam Dışı */}
          <div style={{ marginBottom: '10mm' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>7. KAPSAM DIŞI</h3>
            <p style={{ fontSize: '11px', lineHeight: '1.8', color: '#555', textAlign: 'justify' }}>
              Hafriyat, nakliye, vinç, iskele ve benzeri inşaat işleri bu teklif kapsamı dışındadır. İhtiyaç duyulması halinde ayrıca değerlendirilecektir.
            </p>
          </div>

          {/* Footer Atlet - Sayfa 2 */}
          <div style={{ position: 'absolute', bottom: '8mm', left: '20mm', right: '20mm', borderTop: '2px solid #2980b9', paddingTop: '4mm' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '8.5px', color: '#555', lineHeight: '1.4' }}>
              <div style={{ textAlign: 'left', flex: 1 }}>
                <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', color: '#2980b9', fontSize: '9.5px' }}>Kobinerji Mühendislik</p>
                <p style={{ margin: '0 0 1px 0' }}>Tel: +90 535 714 52 88</p>
                <p style={{ margin: 0 }}>E-posta: info@kobinerji.com.tr</p>
              </div>
              <div style={{ textAlign: 'right', flex: 1 }}>
                <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '10px', color: '#2980b9' }}>Sayfa 2/2</p>
                <p style={{ margin: 0, fontSize: '8px', color: '#777' }}>{new Date().toLocaleDateString('tr-TR')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      {/* PDF Ön İzleme Modal (App.jsx tarzı - YG İşletme Sorumluluğu gibi) */}
      {isPdfPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-3 md:p-4 flex justify-between items-center text-white shrink-0 rounded-t-xl">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 md:w-6 md:h-6" />
                <h3 className="font-bold text-base md:text-lg">Elektrik Malzeme Keşif Teklifi - Ön İzleme</h3>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                {!editorMode && (
                  <button
                    onClick={() => {
                      setEditorMode(true);
                      const paperElement = document.getElementById('kesif-printable-paper');
                      if (paperElement) {
                        setEditableContent(paperElement.innerHTML);
                      }
                    }}
                    className="px-2 md:px-3 py-1.5 md:py-2 bg-yellow-500 hover:bg-yellow-600 rounded-lg font-medium flex items-center gap-1 md:gap-2 transition-colors text-sm md:text-base"
                  >
                    <Edit3 className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">Düzenle</span>
                  </button>
                )}
                {editorMode && (
                  <button
                    onClick={() => {
                      const paperElement = document.getElementById('kesif-printable-paper');
                      if (paperElement) {
                        paperElement.innerHTML = editableContent;
                      }
                      setEditorMode(false);
                    }}
                    className="px-2 md:px-3 py-1.5 md:py-2 bg-green-500 hover:bg-green-600 rounded-lg font-medium flex items-center gap-1 md:gap-2 transition-colors text-sm md:text-base"
                  >
                    <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                    Kaydet
                  </button>
                )}
                <button
                  onClick={async () => {
                    const paperElement = document.getElementById('kesif-printable-paper');
                    if (!paperElement) return;
                    
                    try {
                      const pages = paperElement.querySelectorAll('.kesif-pdf-page');
                      const pdf = new jsPDF('p', 'mm', 'a4');
                      
                      for (let i = 0; i < pages.length; i++) {
                        if (i > 0) pdf.addPage();
                        const canvas = await html2canvas(pages[i], {
                          scale: 2,
                          useCORS: true,
                          logging: false,
                          backgroundColor: '#ffffff'
                        });
                        const imgData = canvas.toDataURL('image/jpeg', 0.95);
                        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
                      }
                      
                      pdf.save(`Kesif_Teklif_${teklifForm.teklifNo}_${new Date().toLocaleDateString('tr-TR').replace(/\\./g, '-')}.pdf`);
                      alert('PDF indiriliyor! ✅ İndirme klasörünüzü kontrol edin.');
                    } catch (error) {
                      console.error('PDF oluşturma hatası:', error);
                      alert('PDF oluşturulurken bir hata oluştu.');
                    }
                  }}
                  className="px-2 md:px-3 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center gap-1 md:gap-2 transition-colors text-sm md:text-base"
                >
                  <Download className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">İndir</span>
                </button>
                <button
                  onClick={() => {
                    saveTeklif();
                  }}
                  className="px-2 md:px-3 py-1.5 md:py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium flex items-center gap-1 md:gap-2 transition-colors text-sm md:text-base"
                >
                  <Save className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="hidden sm:inline">Kaydet</span>
                </button>
                <button onClick={() => {
                  setIsPdfPreviewOpen(false);
                  setEditorMode(false);
                }} className="hover:bg-white/20 p-1 rounded">
                  <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </div>
            </div>
            
            {/* Editor Toolbar (Edit Mode) */}
            {editorMode && (
              <div className="bg-yellow-50 border-b border-yellow-200 p-2 md:p-3">
                <div className="flex items-center gap-2 text-xs md:text-sm text-yellow-800">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">Düzenleme Modu Aktif</span>
                  <span className="hidden md:inline">- PDF içeriğini doğrudan düzenleyebilirsiniz</span>
                </div>
              </div>
            )}
            
            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-2 md:p-4">
              <div 
                id="kesif-printable-paper"
                contentEditable={editorMode}
                suppressContentEditableWarning={true}
                className={`mx-auto ${editorMode ? 'outline-2 outline-dashed outline-yellow-400' : ''}`}
                style={editorMode ? { minHeight: '297mm' } : {}}
                onInput={(e) => {
                  if (editorMode) {
                    setEditableContent(e.currentTarget.innerHTML);
                  }
                }}
              >
                {(() => {
                  // Ürünleri sayfalara böl - her sayfa 20 ürün
                  const ITEMS_PER_PAGE = 20;
                  const productPages = [];
                  
                  for (let i = 0; i < cart.length; i += ITEMS_PER_PAGE) {
                    productPages.push(cart.slice(i, i + ITEMS_PER_PAGE));
                  }
                  
                  // En az 1 sayfa olsun
                  if (productPages.length === 0) {
                    productPages.push([]);
                  }
                  
                  const totalPages = productPages.length + 1; // +1 açıklamalar sayfası
                  
                  return (
                    <>
                      {productPages.map((pageItems, pageIndex) => (
                        <div key={`product-page-${pageIndex}`} className="kesif-pdf-page" style={{ width: '210mm', height: '297mm', background: 'white', padding: '12mm 20mm 25mm 20mm', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box', overflow: 'hidden', marginBottom: '10px' }}>
                          {/* Header - Sadece ilk sayfada tam */}
                          {pageIndex === 0 ? (
                            <>
                              <div style={{ marginBottom: '5mm', paddingBottom: '3mm', borderBottom: '2px solid #2980b9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6mm' }}>
                                  <div style={{ width: '40mm', flexShrink: 0 }}>
                                    {companyLogo && (
                                      <img src={companyLogo} alt="Logo" style={{ width: '100%', height: 'auto', maxHeight: '20mm', objectFit: 'contain' }} />
                                    )}
                                  </div>
                                  <div style={{ flex: 1, textAlign: 'right' }}>
                                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50', margin: '0 0 2mm 0', lineHeight: '1.1' }}>FİYAT TEKLİFİ</h1>
                                    <p style={{ fontSize: '10px', color: '#7f8c8d', margin: 0, lineHeight: '1.2' }}>Elektrik Malzeme Keşfi ve Metraj Teklifi</p>
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6mm', fontSize: '10px' }}>
                                <div style={{ width: '48%' }}>
                                  <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#2980b9', marginBottom: '4px' }}>FİRMA BİLGİLERİ</h3>
                                  <p style={{ margin: '2px 0', lineHeight: '1.5' }}><strong>Firma:</strong> {teklifForm.firmaAdi || 'Kobinerji Mühendislik'}</p>
                                  <p style={{ margin: '2px 0', lineHeight: '1.5' }}><strong>Yetkili:</strong> {teklifForm.yetkili || 'Emrullah Günay'}</p>
                                  <p style={{ margin: '2px 0', lineHeight: '1.5' }}><strong>Tel:</strong> {teklifForm.telefon || '+90 535 714 52 88'}</p>
                                  <p style={{ margin: '2px 0', lineHeight: '1.5' }}><strong>E-posta:</strong> {teklifForm.email || 'info@kobinerji.com.tr'}</p>
                                  {teklifForm.adres && teklifForm.adres.trim() && (
                                    <p style={{ margin: '2px 0', lineHeight: '1.5' }}><strong>Adres:</strong> {teklifForm.adres}</p>
                                  )}
                                </div>
                                <div style={{ width: '48%' }}>
                                  <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#2980b9', marginBottom: '4px' }}>MÜŞTERİ BİLGİLERİ</h3>
                                  <p style={{ margin: '2px 0', lineHeight: '1.5' }}><strong>Müşteri:</strong> {teklifForm.musteriAdi || '-'}</p>
                                  {teklifForm.projeAdi && teklifForm.projeAdi.trim() && (
                                    <p style={{ margin: '2px 0', lineHeight: '1.5' }}><strong>Proje:</strong> {teklifForm.projeAdi}</p>
                                  )}
                                  <p style={{ margin: '2px 0', lineHeight: '1.5' }}><strong>Teklif No:</strong> {teklifForm.teklifNo}</p>
                                  <p style={{ margin: '2px 0', lineHeight: '1.5' }}><strong>Tarih:</strong> {teklifForm.tarih}</p>
                                  <p style={{ margin: '2px 0', lineHeight: '1.5' }}><strong>Geçerlilik:</strong> {teklifForm.gecerlilikSuresi}</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div style={{ marginBottom: '5mm', paddingBottom: '3mm', borderBottom: '2px solid #2980b9' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6mm' }}>
                                <div style={{ width: '40mm', flexShrink: 0 }}>
                                  {companyLogo && (
                                    <img src={companyLogo} alt="Logo" style={{ width: '100%', height: 'auto', maxHeight: '20mm', objectFit: 'contain' }} />
                                  )}
                                </div>
                                <div style={{ flex: 1, textAlign: 'right' }}>
                                  <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2c3e50', margin: '0 0 2mm 0', lineHeight: '1.1' }}>FİYAT TEKLİFİ - Devam</h2>
                                  <p style={{ fontSize: '10px', color: '#555', margin: 0 }}><strong>Teklif No:</strong> {teklifForm.teklifNo} | <strong>Müşteri:</strong> {teklifForm.musteriAdi}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Ürün Tablosu */}
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: pageIndex === productPages.length - 1 ? '6mm' : '0' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#2980b9', color: 'white' }}>
                                <th style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'left', width: '4%' }}>No</th>
                                <th style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'left', width: '42%' }}>Malzeme Adı</th>
                                <th style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'center', width: '9%' }}>Birim</th>
                                <th style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'center', width: '8%' }}>Miktar</th>
                                <th style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'right', width: '15%' }}>Birim Fiyat</th>
                                <th style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'right', width: '17%' }}>Toplam</th>
                                <th style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'center', width: '5%' }}>KDV</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageItems.map((item, idx) => {
                                const globalIndex = pageIndex * ITEMS_PER_PAGE + idx;
                                const unitPrice = parseFloat(item.alis_fiyati) || parseFloat(item.price) || 0;
                                const totalPrice = unitPrice * item.quantity;
                                const discountedPrice = totalPrice * (1 - (discount / 100));
                                const finalTotal = discountedPrice * (1 + (profit / 100));
                                
                                return (
                                  <React.Fragment key={globalIndex}>
                                    <tr style={{ backgroundColor: globalIndex % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                      <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'center', fontSize: '10px' }}>{globalIndex + 1}</td>
                                      <td style={{ border: '1px solid #ddd', padding: '5px', fontSize: '10px', lineHeight: '1.4' }}>{item.name || item.malzeme_adi}</td>
                                      <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'center', fontSize: '10px' }}>{item.birim || 'Adet'}</td>
                                      <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'center', fontSize: '10px' }}>{item.quantity}</td>
                                      <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'right', fontSize: '10px' }}>{unitPrice.toFixed(2)} TL</td>
                                      <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'right', fontWeight: 'bold', fontSize: '10px' }}>{finalTotal.toFixed(2)} TL</td>
                                      <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'center', fontSize: '9px' }}>%{item.kdvOrani || 20}</td>
                                    </tr>
                                    {item.description && item.description.trim() && (
                                      <tr style={{ backgroundColor: globalIndex % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                        <td colSpan="7" style={{ border: '1px solid #ddd', borderTop: 'none', padding: '5px 5px 7px 20px', fontSize: '9px', fontStyle: 'italic', color: '#555', lineHeight: '1.4' }}>
                                          <strong>Açıklama:</strong> {item.description}
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>

                          {/* Özet - Sadece son ürün sayfasında */}
                          {pageIndex === productPages.length - 1 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6mm' }}>
                              <div style={{ width: '45%', fontSize: '11px', border: '1px solid #ddd' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', borderBottom: '1px solid #ecf0f1', backgroundColor: '#f9f9f9' }}>
                                  <span>Ara Toplam:</span>
                                  <span style={{ fontWeight: 'bold' }}>{cartTotal.toFixed(2)} TL</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', borderBottom: '1px solid #ecf0f1', color: '#e74c3c' }}>
                                  <span>İskonto (%{discount}):</span>
                                  <span style={{ fontWeight: 'bold' }}>-{(cartTotal * (discount / 100)).toFixed(2)} TL</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', borderBottom: '1px solid #ecf0f1', backgroundColor: '#f9f9f9' }}>
                                  <span>İskonto Sonrası:</span>
                                  <span style={{ fontWeight: 'bold' }}>{discountedTotal.toFixed(2)} TL</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px', borderBottom: '1px solid #ecf0f1', color: '#e67e22' }}>
                                  <span>Ortalama KDV (%20):</span>
                                  <span style={{ fontWeight: 'bold' }}>+{(grandTotal * 0.20).toFixed(2)} TL</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: '#2980b9', color: 'white' }}>
                                  <span style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>GENEL TOPLAM:</span>
                                  <span style={{ fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '10px' }}>{(grandTotal * 1.20).toFixed(2)} TL</span>
                                  <span style={{ fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '10px' }}>{(grandTotal * 1.20).toFixed(2)} TL</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Footer */}
                          <div style={{ position: 'absolute', bottom: '8mm', left: '20mm', right: '20mm', borderTop: '2px solid #2980b9', paddingTop: '3mm' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555', lineHeight: '1.3' }}>
                              <div style={{ textAlign: 'left', flex: 1 }}>
                                <p style={{ margin: '0 0 1px 0', fontWeight: 'bold', color: '#2980b9', fontSize: '10px' }}>Kobinerji Mühendislik</p>
                                <p style={{ margin: '0 0 1px 0' }}>Tel: +90 535 714 52 88</p>
                                <p style={{ margin: 0 }}>E-posta: info@kobinerji.com.tr</p>
                              </div>
                              <div style={{ textAlign: 'right', flex: 1 }}>
                                <p style={{ margin: '0 0 1px 0', fontWeight: 'bold', fontSize: '10px', color: '#2980b9' }}>Sayfa {pageIndex + 1}/{totalPages}</p>
                                <p style={{ margin: 0, fontSize: '9px', color: '#777' }}>{new Date().toLocaleDateString('tr-TR')}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Açıklamalar Sayfası */}
                      <div className="kesif-pdf-page" style={{ width: '210mm', height: '297mm', background: 'white', padding: '15mm 20mm 25mm 20mm', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
                        {/* Header */}
                        <div style={{ marginBottom: '10mm', paddingBottom: '4mm', borderBottom: '3px solid #2980b9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6mm' }}>
                            <div style={{ width: '45mm', flexShrink: 0 }}>
                              {companyLogo && (
                                <img src={companyLogo} alt="Logo" style={{ width: '100%', height: 'auto', maxHeight: '22mm', objectFit: 'contain' }} />
                              )}
                            </div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#2980b9', margin: '0 0 3mm 0', lineHeight: '1.2' }}>GENEL ŞARTLAR VE ÖDEME KOŞULLARI</h1>
                              <p style={{ fontSize: '11px', color: '#7f8c8d', margin: 0, lineHeight: '1.3' }}>Teklif No: {teklifForm.teklifNo}</p>
                            </div>
                          </div>
                        </div>
                        {/* İçerik */}
                        <div style={{ fontSize: '12px', lineHeight: '2', color: '#2c3e50' }}>
                          {/* Ödeme Planı */}
                          <div style={{ marginBottom: '10mm' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: '8px', fontSize: '16px' }}>•</span> Ödeme Planı
                            </h3>
                            <p style={{ fontSize: '12px', lineHeight: '2', color: '#444', textAlign: 'justify', paddingLeft: '20px' }}>
                              İşbu teklif bedeli; %50 sipariş onayı ile birlikte avans (peşin), kalan %50 bakiye iş tesliminde vadesiz (peşin) olarak tahsil edilecek şekilde hesaplanmıştır.
                            </p>
                          </div>

                          {/* Fiyatlandırma Esası */}
                          <div style={{ marginBottom: '10mm' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: '8px', fontSize: '16px' }}>•</span> Fiyatlandırma Esası
                            </h3>
                            <p style={{ fontSize: '12px', lineHeight: '2', color: '#444', textAlign: 'justify', paddingLeft: '20px' }}>
                              Birim fiyatlarımız nakit/havale ödeme koşuluna göre iskontolu olarak sunulmuştur. Çek, senet veya vadeli ödeme taleplerinde, güncel finansal maliyetler ve vade farkı oranları fiyata ayrıca yansıtılır.
                            </p>
                          </div>

                          {/* Teklif Geçerliliği */}
                          <div style={{ marginBottom: '10mm' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: '8px', fontSize: '16px' }}>•</span> Teklif Geçerliliği
                            </h3>
                            <p style={{ fontSize: '12px', lineHeight: '2', color: '#444', textAlign: 'justify', paddingLeft: '20px' }}>
                              Teklifimizde yer alan kablo ve trafo gibi emtia piyasalarına (Bakır/LME ve Döviz) endeksli ürünler nedeniyle, teklifimiz 3 iş günü süreyle geçerlidir. Bu süreden sonra oluşabilecek maliyet artışlarını revize etme hakkımız saklıdır.
                            </p>
                          </div>

                          {/* Teslimat Süresi */}
                          <div style={{ marginBottom: '10mm' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: '8px', fontSize: '16px' }}>•</span> Teslimat Süresi
                            </h3>
                            <p style={{ fontSize: '12px', lineHeight: '2', color: '#444', textAlign: 'justify', paddingLeft: '20px' }}>
                              Malzeme termin ve iş teslim süresi, avans ödemesinin şirket hesaplarımıza geçmesiyle başlar.
                            </p>
                          </div>

                          {/* Montaj */}
                          <div style={{ marginBottom: '10mm' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', marginBottom: '6px', display: 'flex', alignItems: 'center' }}>
                              <span style={{ marginRight: '8px', fontSize: '16px' }}>•</span> Montaj
                            </h3>
                            <p style={{ fontSize: '12px', lineHeight: '2', color: '#444', textAlign: 'justify', paddingLeft: '20px' }}>
                              Montaj sahasının iş güvenliğine uygun ve çalışmaya hazır hale getirilmesi (hafriyat, inşaat işleri vb.) işverenin sorumluluğundadır.
                            </p>
                          </div>
                        </div>

                        {/* Footer */}
                        <div style={{ position: 'absolute', bottom: '8mm', left: '20mm', right: '20mm', borderTop: '2px solid #2980b9', paddingTop: '3mm' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#555', lineHeight: '1.3' }}>
                            <div style={{ textAlign: 'left', flex: 1 }}>
                              <p style={{ margin: '0 0 1px 0', fontWeight: 'bold', color: '#2980b9', fontSize: '10px' }}>Kobinerji Mühendislik</p>
                              <p style={{ margin: '0 0 1px 0' }}>Tel: +90 535 714 52 88</p>
                              <p style={{ margin: 0 }}>E-posta: info@kobinerji.com.tr</p>
                            </div>
                            <div style={{ textAlign: 'right', flex: 1 }}>
                              <p style={{ margin: '0 0 1px 0', fontWeight: 'bold', fontSize: '10px', color: '#2980b9' }}>Sayfa {totalPages}/{totalPages}</p>
                              <p style={{ margin: 0, fontSize: '9px', color: '#777' }}>{new Date().toLocaleDateString('tr-TR')}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            
            
            {/* Footer Info */}
            <div className="p-2 md:p-3 bg-gray-50 border-t flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0 rounded-b-xl text-xs md:text-sm">
              <p className="text-gray-600 text-center sm:text-left">
                💡 İpucu: <span className="font-medium">Düzenle</span> ile içeriği değiştirin, <span className="font-medium">İndir</span> ile PDF kaydedin
              </p>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Toplam: {cart.length} kalem</span>
                <span className="text-gray-300">|</span>
                <span className="font-bold text-red-600">{grandTotal.toFixed(2)} TL</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ürün Düzenleme Modalı */}
      {isProductEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Edit3 className="w-6 h-6" />
                Ürün Düzenle
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Ürün Adı</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ürün adını girin..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Kategori</label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {categories.filter(c => c !== 'Tümü').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Fiyat (TL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={async () => {
                    await saveProduct(editingProduct);
                    setIsProductEditModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Kaydet
                </button>
                <button
                  onClick={async () => {
                    if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
                      await deleteProduct(editingProduct.id, editingProduct.name);
                      setIsProductEditModalOpen(false);
                      setEditingProduct(null);
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Sil
                </button>
                <button
                  onClick={() => {
                    setIsProductEditModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Ürün Ekleme Modalı */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-xl">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Plus className="w-6 h-6" />
                Yeni Ürün Ekle
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Ürün Adı *</label>
                <input
                  type="text"
                  id="newProductName"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Örn: NYY 4x25 Kablo"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Kategori *</label>
                <select
                  id="newProductCategory"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  {categories.filter(c => c !== 'Tümü').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Fiyat (TL) *</label>
                <input
                  type="number"
                  step="0.01"
                  id="newProductPrice"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={async () => {
                    const name = document.getElementById('newProductName').value.trim();
                    const category = document.getElementById('newProductCategory').value;
                    const price = parseFloat(document.getElementById('newProductPrice').value) || 0;

                    if (!name) {
                      alert('Ürün adı zorunludur!');
                      return;
                    }
                    if (price <= 0) {
                      alert('Geçerli bir fiyat girin!');
                      return;
                    }

                    await saveProduct({
                      name,
                      category,
                      price,
                      isNew: true
                    });

                    setIsNewProductModalOpen(false);
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Ürün Ekle
                </button>
                <button
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg font-semibold"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* PDF Page Styling */
        .kesif-pdf-page {
          page-break-after: always;
          page-break-inside: avoid;
        }
        
        @media print {
          .kesif-pdf-page {
            margin: 0;
            box-shadow: none;
            page-break-after: always;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default KesifMetraj;
