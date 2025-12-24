import React, { useState, useMemo, useRef } from 'react';
import { Calculator, FileText, Settings, Search, Save, Download, Printer, X, Edit3, ChevronRight, CheckCircle, Lightbulb, Zap, Mail, TrendingDown, RefreshCw, UserPlus, Users, MapPin, Percent, UploadCloud, Sparkles, Copy, Type, Bold, Italic, AlignLeft, AlignCenter, AlignRight, FileSpreadsheet, Hammer, Plus, Trash2, Cable, Wrench } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import emailjs from 'emailjs-com';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';
import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Table, TableCell, TableRow, WidthType, BorderStyle, Packer } from 'docx';
import { saveAs } from 'file-saver';
import FaturaData from '../fatura/Fatura.json';
import KabloFiyatData from './serer-kablo-fiyat.json';
import HazirPaketler from './hazir-paketler.json';

// EMO 2026 Bölgesel Azaltma Katsayıları Listesi (Sabit Veri)
const REGION_LIST = [
  { name: "Adana (Merkez)", coeff: 1.00 },
  { name: "Adana (Çevre İlçeler)", coeff: 0.75 },
  { name: "Adıyaman", coeff: 0.75 },
  { name: "Afyon", coeff: 0.60 },
  { name: "Ağrı", coeff: 0.75 },
  { name: "Aksaray", coeff: 0.60 },
  { name: "Amasya", coeff: 0.75 },
  { name: "Ankara (Büyükşehir)", coeff: 1.00 },
  { name: "Antalya (Merkez)", coeff: 1.00 },
  { name: "Alanya", coeff: 1.00 },
  { name: "Artvin", coeff: 0.75 },
  { name: "Aydın (Merkez)", coeff: 1.00 },
  { name: "Aydın (Diğer İlçeler)", coeff: 0.75 },
  { name: "Balıkesir", coeff: 0.75 },
  { name: "Bartın", coeff: 0.75 },
  { name: "Batman", coeff: 0.75 },
  { name: "Bayburt", coeff: 0.75 },
  { name: "Bilecik", coeff: 0.75 },
  { name: "Bingöl", coeff: 0.75 },
  { name: "Bitlis", coeff: 0.75 },
  { name: "Bolu", coeff: 0.75 },
  { name: "Burdur", coeff: 0.75 },
  { name: "Bursa (Merkez)", coeff: 1.00 },
  { name: "Çanakkale", coeff: 0.75 },
  { name: "Çankırı", coeff: 0.60 },
  { name: "Çorum", coeff: 0.75 },
  { name: "Denizli (Merkez)", coeff: 1.00 },
  { name: "Diyarbakır (Merkez)", coeff: 1.00 },
  { name: "Düzce", coeff: 0.75 },
  { name: "Elazığ", coeff: 0.75 },
  { name: "Erzincan", coeff: 0.60 },
  { name: "Erzurum (Büyükşehir)", coeff: 0.75 },
  { name: "Eskişehir (Merkez)", coeff: 1.00 },
  { name: "Gaziantep (Merkez)", coeff: 1.00 },
  { name: "Giresun", coeff: 0.75 },
  { name: "Gümüşhane", coeff: 0.75 },
  { name: "Hakkari", coeff: 0.75 },
  { name: "Hatay", coeff: 1.00 },
  { name: "Iğdır", coeff: 0.75 },
  { name: "Isparta", coeff: 1.00 },
  { name: "İstanbul", coeff: 1.00 },
  { name: "İzmir (Merkez İlçeler)", coeff: 1.00 },
  { name: "İzmir (Aliağa/Kemalpaşa/Ödemiş)", coeff: 1.00 },
  { name: "İzmir (Diğer İlçeler)", coeff: 0.75 },
  { name: "K.Maraş", coeff: 0.75 },
  { name: "Karabük", coeff: 0.75 },
  { name: "Karaman", coeff: 0.75 },
  { name: "Kars", coeff: 0.75 },
  { name: "Kastamonu", coeff: 0.60 },
  { name: "Kayseri (Büyükşehir)", coeff: 0.75 },
  { name: "Kırıkkale", coeff: 0.60 },
  { name: "Kırşehir", coeff: 0.60 },
  { name: "Kilis", coeff: 0.75 },
  { name: "Kocaeli (Merkez)", coeff: 1.00 },
  { name: "Konya (Büyükşehir)", coeff: 0.75 },
  { name: "Kütahya", coeff: 0.75 },
  { name: "Malatya", coeff: 0.75 },
  { name: "Manisa (Merkez/Akhisar)", coeff: 1.00 },
  { name: "Manisa (Diğer İlçeler)", coeff: 0.75 },
  { name: "Mardin", coeff: 0.75 },
  { name: "Mersin (Merkez)", coeff: 1.00 },
  { name: "Muğla", coeff: 1.00 },
  { name: "Muş", coeff: 0.75 },
  { name: "Nevşehir", coeff: 0.60 },
  { name: "Niğde", coeff: 0.75 },
  { name: "Ordu", coeff: 0.75 },
  { name: "Osmaniye", coeff: 0.75 },
  { name: "Rize", coeff: 0.75 },
  { name: "Sakarya", coeff: 0.75 },
  { name: "Samsun (Merkez)", coeff: 1.00 },
  { name: "Siirt", coeff: 0.75 },
  { name: "Sinop", coeff: 0.75 },
  { name: "Sivas", coeff: 0.60 },
  { name: "Şanlıurfa", coeff: 0.75 },
  { name: "Şırnak", coeff: 0.75 },
  { name: "Tekirdağ (Trakya)", coeff: 0.75 },
  { name: "Tokat", coeff: 0.60 },
  { name: "Trabzon (Merkez)", coeff: 1.00 },
  { name: "Trabzon (İlçeler)", coeff: 0.75 },
  { name: "Tunceli", coeff: 0.75 },
  { name: "Uşak (Merkez)", coeff: 1.00 },
  { name: "Van", coeff: 0.75 },
  { name: "Yalova", coeff: 0.75 },
  { name: "Yozgat", coeff: 0.60 },
  { name: "Zonguldak", coeff: 0.75 },
  { name: "Diğer (Varsayılan)", coeff: 1.00 }
];

// EMO 2026 Periyodik Kontrol Fiyat Sabitleri (Kısım V - Test ve Ölçüm Hizmetleri)
const PERIODIC_PRICES = {
  // YG/TM Gözle Kontrol (Kısım V, Sıra 16) - Bina Tipi 2 Hücreli Baz Alındı
  yg_base_limit: 400, // kVA
  yg_base_price: 53997.00,
  yg_tier1_limit: 5000, // kVA
  yg_tier1_increment: 16.37, // 401-5000 arası artış
  yg_tier2_increment: 7.27,  // 5000 üzeri artış

  // AG İç Tesisat (Kısım V, Sıra 1.5 - 5. Sınıf Yapılar)
  ag_area_limit: 500, // m2
  ag_base_price: 42748.00,
  ag_increment: 7.89, // m2 başına artış

  // Topraklama (Kısım V, Sıra 2.2 - AG Tesisleri)
  topraklama_base_limit: 3, // nokta
  topraklama_base_price: 7041.00,
  topraklama_increment: 645.00, // nokta başına (50'ye kadar)

  // Yıldırımdan Korunma (Kısım V, Sıra 11)
  paratoner_base_limit: 1, // tesisat
  paratoner_base_price: 10832.00,
  paratoner_increment: 5282.00,

  // RCD Testleri (Kısım V, Sıra 9)
  rcd_base_limit: 3, // adet
  rcd_base_price: 6960.00,
  rcd_increment: 410.00, 

  // Keşif Bedeli
  kesif_bedeli: 6500.00
};

const App = () => {
  // --- State Definitions ---
  const [activeTab, setActiveTab] = useState('manual');
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // AI States
  const [aiOutput, setAiOutput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiActiveFeature, setAiActiveFeature] = useState(null); // 'email' or 'tips'

  const [logo, setLogo] = useState(null); // Logo state
  
  // Teklif Sayacı ve Sabit Sicil No
  const [proposalCount, setProposalCount] = useState(1);
  const ODA_SICIL_NO = "92558";
  
  // Para Birimi Seçeneği
  const [currency, setCurrency] = useState('TRY'); // 'TRY', 'USD', 'EUR'
  const [previousCurrency, setPreviousCurrency] = useState('TRY');
  const [exchangeRates, setExchangeRates] = useState({
    USD: 40.00, // TL/USD
    EUR: 49.00  // TL/EUR
  });

  const apiKey = "AIzaSyBMTNck0O4t_zFGoojvqseM1KX3OSxCy2s"; // Gemini API key
  
  // Editor Mode States
  const [editorMode, setEditorMode] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [emailConfig, setEmailConfig] = useState({
    serviceId: '',
    templateId: '',
    userId: '',
    recipientEmail: ''
  });
  
  const proposalRef = useRef(null); // PDF/Word export için referans

  // Manuel Giriş Form State
  const [manualForm, setManualForm] = useState({
    name: '',
    sector: '',
    contactName: '',
    powerStr: '',
    type: 'bina', // 'bina' or 'direk'
    region: 'İzmir (Aliağa/Kemalpaşa/Ödemiş)', // Varsayılan görüntülenen isim
    regionCoeff: 1.00, // Varsayılan katsayı
    customDiscount: 70 // Kullanıcıya özel iskonto
  });

  // Default Parameters (EMO 2026)
  const [params, setParams] = useState({
    baseFee: 8802.00,        // 400 kVA (2 hücre) Sabit
    rate1: 5.34,             // 401-5000 kVA birim fiyat
    rate2: 4.10,             // >5000 kVA birim fiyat
    
    // Direk Tipi / Küçük Güçler (EMO 2026 Kısım III - Madde 3.1)
    poleFee1: 3887.00,       // 0-50 kVA
    poleFee2: 4921.00,       // 51-160 kVA
    poleFee3: 6770.00,       // 161-400 kVA

    discountRate: 70,        // % (Varsayılan)
    regionCoeff: 1.00,       // Bölge Katsayısı (BK) (Varsayılan)
    year: 2026
  });

  // Periyodik Kontrol States
  const [periodicCustomer, setPeriodicCustomer] = useState({
    name: '',
    city: '',
    contactName: '',
    date: new Date().toLocaleDateString('tr-TR')
  });

  const [periodicInputs, setPeriodicInputs] = useState({
    trafoGucu: 0,
    yapiAlani: 0,
    topraklamaAdet: 0,
    paratonerAdet: 0,
    rcdAdet: 0,
    iskonto: 70
  });

  const [periodicResults, setPeriodicResults] = useState({
    yg: { total: 0, desc: "" },
    ag: { total: 0, desc: "" },
    topraklama: { total: 0, desc: "" },
    paratoner: { total: 0, desc: "" },
    rcd: { total: 0, desc: "" },
    subTotal: 0,
    kesif: PERIODIC_PRICES.kesif_bedeli,
    grandTotal: 0,
    discountAmount: 0,
    finalPrice: 0
  });

  // Periyodik Kontrol Edit Mode
  const [periodicEditorMode, setPeriodicEditorMode] = useState(false);
  const [periodicEditableContent, setPeriodicEditableContent] = useState('');

  // Keşif Metraj States
  const [kesifCustomer, setKesifCustomer] = useState({
    name: '',
    address: '',
    contactName: '',
    phone: '',
    date: new Date().toLocaleDateString('tr-TR')
  });

  const [kesifProducts, setKesifProducts] = useState([]);
  const [kesifSettings, setKesifSettings] = useState({
    iskonto: 0,
    kdvOrani: 20
  });

  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  // Ürün Tipi: 'normal', 'kablo' veya 'hizmet'
  const [productType, setProductType] = useState('normal');
  const [selectedCategoryForKesif, setSelectedCategoryForKesif] = useState('');
  const [selectedCableForKesif, setSelectedCableForKesif] = useState(null);
  const [kesifFiyatSecimi, setKesifFiyatSecimi] = useState('fiyat1');
  
  // Hizmet/İşçilik için state'ler
  const [hizmetAdi, setHizmetAdi] = useState('');
  const [hizmetFiyat, setHizmetFiyat] = useState(0);
  const [hizmetMiktar, setHizmetMiktar] = useState(1);
  const [hizmetBirim, setHizmetBirim] = useState('Gün');
  const [hizmetAciklama, setHizmetAciklama] = useState('');

  // Hazır Paket States
  const [showHazirPaketModal, setShowHazirPaketModal] = useState(false);
  const [selectedHazirPaket, setSelectedHazirPaket] = useState(null);
  const [paketKarMarji, setPaketKarMarji] = useState(30); // %30 varsayılan kar marjı

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!productSearch) return [];
    const searchLower = productSearch.toLowerCase();
    return FaturaData.filter(p => 
      p.ÜRÜN?.toLowerCase().includes(searchLower) || 
      p.MARKA?.toLowerCase().includes(searchLower)
    ).slice(0, 20);
  }, [productSearch]);

  // Keşif Metraj Editor Mode
  const [kesifEditorMode, setKesifEditorMode] = useState(false);
  const [kesifEditableContent, setKesifEditableContent] = useState('');

  // --- Helpers ---

  // Helper to parse power string "2000+2000+1600" -> 5600
  const parsePower = (str) => {
    if (!str) return 0;
    return str.toString().split('+').reduce((acc, curr) => acc + parseInt(curr.trim() || 0), 0);
  };

  // Keşif Metraj Fonksiyonları
  const addProductToKesif = () => {
    if (productType === 'normal') {
      // Normal ürün ekleme
      if (!selectedProduct || productQuantity <= 0) return;
      
      const newProduct = {
        id: Date.now(),
        sira: kesifProducts.length + 1,
        type: 'normal',
        urun: selectedProduct.ÜRÜN,
        marka: selectedProduct.MARKA,
        birimFiyat: selectedProduct["BİRİM FİYAT"],
        miktar: productQuantity,
        olcu: selectedProduct.ÖLÇÜ,
        toplam: selectedProduct["BİRİM FİYAT"] * productQuantity
      };

      setKesifProducts([...kesifProducts, newProduct]);
      setSelectedProduct(null);
      setProductSearch('');
      setProductQuantity(1);
      setShowProductDropdown(false);
    } else if (productType === 'kablo') {
      // Kablo ekleme
      if (!selectedCableForKesif || productQuantity <= 0) return;
      
      const fiyat = kesifFiyatSecimi === 'fiyat1' ? selectedCableForKesif.fiyat1 : (selectedCableForKesif.fiyat2 || selectedCableForKesif.fiyat1);
      const kategori = KabloFiyatData.kategoriler.find(k => k.urunler.some(u => u.kod === selectedCableForKesif.kod));
      
      const newProduct = {
        id: Date.now(),
        sira: kesifProducts.length + 1,
        type: 'kablo',
        urun: selectedCableForKesif.ad,
        marka: `${kategori?.ad || 'Kablo'} - ${selectedCableForKesif.kesit} mm²`,
        birimFiyat: fiyat,
        miktar: productQuantity,
        olcu: selectedCableForKesif.birim,
        toplam: fiyat * productQuantity,
        kategori: kategori?.ad || '',
        kesit: selectedCableForKesif.kesit
      };

      setKesifProducts([...kesifProducts, newProduct]);
      setSelectedCableForKesif(null);
      setSelectedCategoryForKesif('');
      setProductQuantity(1);
    } else if (productType === 'hizmet') {
      // Hizmet/İşçilik ekleme
      if (!hizmetAdi || hizmetFiyat <= 0 || hizmetMiktar <= 0) return;
      
      const newProduct = {
        id: Date.now(),
        sira: kesifProducts.length + 1,
        type: 'hizmet',
        urun: hizmetAdi,
        marka: 'Hizmet/İşçilik',
        birimFiyat: hizmetFiyat,
        miktar: hizmetMiktar,
        olcu: hizmetBirim,
        toplam: hizmetFiyat * hizmetMiktar,
        aciklama: hizmetAciklama
      };

      setKesifProducts([...kesifProducts, newProduct]);
      setHizmetAdi('');
      setHizmetFiyat(0);
      setHizmetMiktar(1);
      setHizmetBirim('Gün');
      setHizmetAciklama('');
    }
  };

  const removeProductFromKesif = (id) => {
    const updated = kesifProducts.filter(p => p.id !== id);
    // Re-number the rows
    const reNumbered = updated.map((p, idx) => ({ ...p, sira: idx + 1 }));
    setKesifProducts(reNumbered);
  };

  const updateProductQuantity = (id, newQuantity) => {
    const updated = kesifProducts.map(p => 
      p.id === id ? { ...p, miktar: newQuantity, toplam: p.birimFiyat * newQuantity } : p
    );
    setKesifProducts(updated);
  };

  const updateProductPrice = (id, newPrice) => {
    const updated = kesifProducts.map(p => 
      p.id === id ? { ...p, birimFiyat: newPrice, toplam: newPrice * p.miktar } : p
    );
    setKesifProducts(updated);
  };

  const updateProductName = (id, newName) => {
    const updated = kesifProducts.map(p => 
      p.id === id ? { ...p, urun: newName } : p
    );
    setKesifProducts(updated);
  };

  const updateProductDetail = (id, newDetail) => {
    const updated = kesifProducts.map(p => 
      p.id === id ? { ...p, marka: newDetail } : p
    );
    setKesifProducts(updated);
  };

  const applyBulkPriceAdjustment = (percentage) => {
    if (percentage === 0) return;
    const updated = kesifProducts.map(p => {
      const newPrice = p.birimFiyat * (1 + percentage / 100);
      return { ...p, birimFiyat: newPrice, toplam: newPrice * p.miktar };
    });
    setKesifProducts(updated);
  };

  // Hazır Paket Ekleme Fonksiyonu
  const addHazirPaketToKesif = () => {
    if (!selectedHazirPaket) return;

    const paket = HazirPaketler.paketler.find(p => p.id === selectedHazirPaket);
    if (!paket) return;

    let addedCount = 0;
    const newProducts = [];

    paket.urunler.forEach((paketUrun) => {
      // Fatura.json'dan ürünü ara
      const foundProduct = FaturaData.find(fp => 
        fp.ÜRÜN?.toLowerCase().includes(paketUrun.urun.toLowerCase()) ||
        paketUrun.urun.toLowerCase().includes(fp.ÜRÜN?.toLowerCase())
      );

      if (foundProduct) {
        // Liste fiyatına (iskontosuz) kar marjı ekle
        const listeFiyat = foundProduct['BİRİM FİYAT'] || 0;
        const satisFiyat = listeFiyat * (1 + paketKarMarji / 100);

        const newProduct = {
          id: Date.now() + addedCount,
          sira: kesifProducts.length + addedCount + 1,
          type: 'normal',
          urun: foundProduct.ÜRÜN,
          birim: paketUrun.birim || foundProduct.ÖLÇÜ || 'Adet',
          miktar: paketUrun.miktar,
          birimFiyat: parseFloat(satisFiyat.toFixed(2)),
          toplam: parseFloat((satisFiyat * paketUrun.miktar).toFixed(2)),
          aciklama: paketUrun.aciklama || '',
          marka: foundProduct.MARKA || '',
          paketAdi: paket.ad
        };
        newProducts.push(newProduct);
        addedCount++;
      } else {
        // Ürün bulunamadıysa, varsayılan fiyat ile ekle
        const defaultPrice = 100 * (1 + paketKarMarji / 100);
        const newProduct = {
          id: Date.now() + addedCount,
          sira: kesifProducts.length + addedCount + 1,
          type: 'normal',
          urun: paketUrun.urun,
          birim: paketUrun.birim || 'Adet',
          miktar: paketUrun.miktar,
          birimFiyat: parseFloat(defaultPrice.toFixed(2)),
          toplam: parseFloat((defaultPrice * paketUrun.miktar).toFixed(2)),
          aciklama: paketUrun.aciklama || '',
          marka: '---',
          paketAdi: paket.ad
        };
        newProducts.push(newProduct);
        addedCount++;
      }
    });

    setKesifProducts([...kesifProducts, ...newProducts]);
    setShowHazirPaketModal(false);
    setSelectedHazirPaket(null);
    alert(`${paket.ad} paketi eklendi! ${addedCount} ürün listeye eklendi.`);
  };

  const calculateKesifTotals = () => {
    const subTotal = kesifProducts.reduce((sum, p) => sum + p.toplam, 0);
    const iskontoAmount = subTotal * (kesifSettings.iskonto / 100);
    const afterDiscount = subTotal - iskontoAmount;
    const kdvAmount = afterDiscount * (kesifSettings.kdvOrani / 100);
    const grandTotal = afterDiscount + kdvAmount;

    return {
      subTotal,
      iskontoAmount,
      afterDiscount,
      kdvAmount,
      grandTotal
    };
  };

  const handleKesifSubmit = (e) => {
    e.preventDefault();
    if (kesifProducts.length === 0) {
      alert('Lütfen en az bir ürün ekleyin!');
      return;
    }
    setSelectedCompany({
      ...kesifCustomer,
      type: 'kesif',
      products: kesifProducts,
      settings: kesifSettings,
      totals: calculateKesifTotals()
    });
    setActiveTab('proposal');
  };

  // Periyodik Kontrol Hesaplama Motoru
  const calculatePeriodicPrices = () => {
    // 1. YG/TM Kontrolü
    let ygTotal = 0;
    let ygDesc = "";
    if (periodicInputs.trafoGucu <= PERIODIC_PRICES.yg_base_limit) {
      ygTotal = PERIODIC_PRICES.yg_base_price;
      ygDesc = `${PERIODIC_PRICES.yg_base_limit} kVA'ya kadar sabit.`;
    } else {
      ygTotal = PERIODIC_PRICES.yg_base_price;
      let remaining = periodicInputs.trafoGucu - PERIODIC_PRICES.yg_base_limit;
      
      if (periodicInputs.trafoGucu <= PERIODIC_PRICES.yg_tier1_limit) {
        ygTotal += remaining * PERIODIC_PRICES.yg_tier1_increment;
        ygDesc = `Sabit + (${remaining} kVA x ${PERIODIC_PRICES.yg_tier1_increment} TL)`;
      } else {
        const tier1Amount = (PERIODIC_PRICES.yg_tier1_limit - PERIODIC_PRICES.yg_base_limit);
        ygTotal += tier1Amount * PERIODIC_PRICES.yg_tier1_increment;
        const tier2Amount = periodicInputs.trafoGucu - PERIODIC_PRICES.yg_tier1_limit;
        ygTotal += tier2Amount * PERIODIC_PRICES.yg_tier2_increment;
        ygDesc = `Sabit + (4600 kVA x ${PERIODIC_PRICES.yg_tier1_increment}) + (${tier2Amount} kVA x ${PERIODIC_PRICES.yg_tier2_increment})`;
      }
    }

    // 2. AG İç Tesisat
    let agTotal = 0;
    let agDesc = "";
    if (periodicInputs.yapiAlani <= PERIODIC_PRICES.ag_area_limit) {
      agTotal = PERIODIC_PRICES.ag_base_price;
      agDesc = `${PERIODIC_PRICES.ag_area_limit} m²'ye kadar sabit.`;
    } else {
      const extraArea = periodicInputs.yapiAlani - PERIODIC_PRICES.ag_area_limit;
      agTotal = PERIODIC_PRICES.ag_base_price + (extraArea * PERIODIC_PRICES.ag_increment);
      agDesc = `Sabit + (${extraArea} m² x ${PERIODIC_PRICES.ag_increment} TL)`;
    }

    // 3. Topraklama
    let topTotal = 0;
    let topDesc = "";
    if (periodicInputs.topraklamaAdet <= PERIODIC_PRICES.topraklama_base_limit) {
      topTotal = PERIODIC_PRICES.topraklama_base_price;
      topDesc = `${PERIODIC_PRICES.topraklama_base_limit} noktaya kadar sabit.`;
    } else {
      const extraPoints = periodicInputs.topraklamaAdet - PERIODIC_PRICES.topraklama_base_limit;
      topTotal = PERIODIC_PRICES.topraklama_base_price + (extraPoints * PERIODIC_PRICES.topraklama_increment);
      topDesc = `Sabit + (${extraPoints} nokta x ${PERIODIC_PRICES.topraklama_increment} TL)`;
    }

    // 4. Paratoner
    let paraTotal = 0;
    let paraDesc = "";
    if (periodicInputs.paratonerAdet <= PERIODIC_PRICES.paratoner_base_limit) {
      paraTotal = PERIODIC_PRICES.paratoner_base_price;
      paraDesc = "1 tesisat sabit.";
    } else {
      const extraPara = periodicInputs.paratonerAdet - PERIODIC_PRICES.paratoner_base_limit;
      paraTotal = PERIODIC_PRICES.paratoner_base_price + (extraPara * PERIODIC_PRICES.paratoner_increment);
      paraDesc = `Sabit + (${extraPara} tesisat x ${PERIODIC_PRICES.paratoner_increment} TL)`;
    }

    // 5. RCD Testleri
    let rcdTotal = 0;
    let rcdDesc = "";
    if (periodicInputs.rcdAdet <= PERIODIC_PRICES.rcd_base_limit) {
      rcdTotal = PERIODIC_PRICES.rcd_base_price;
      rcdDesc = `${PERIODIC_PRICES.rcd_base_limit} adete kadar sabit.`;
    } else {
      const extraRcd = periodicInputs.rcdAdet - PERIODIC_PRICES.rcd_base_limit;
      rcdTotal = PERIODIC_PRICES.rcd_base_price + (extraRcd * PERIODIC_PRICES.rcd_increment);
      rcdDesc = `Sabit + (${extraRcd} adet x ${PERIODIC_PRICES.rcd_increment} TL)`;
    }

    const subTotal = ygTotal + agTotal + topTotal + paraTotal + rcdTotal;
    const grandTotal = subTotal + PERIODIC_PRICES.kesif_bedeli;
    const discountVal = (grandTotal * periodicInputs.iskonto) / 100;
    const final = grandTotal - discountVal;

    setPeriodicResults({
      yg: { total: ygTotal, desc: ygDesc },
      ag: { total: agTotal, desc: agDesc },
      topraklama: { total: topTotal, desc: topDesc },
      paratoner: { total: paraTotal, desc: paraDesc },
      rcd: { total: rcdTotal, desc: rcdDesc },
      subTotal: subTotal,
      kesif: PERIODIC_PRICES.kesif_bedeli,
      grandTotal: grandTotal,
      discountAmount: discountVal,
      finalPrice: final
    });
  };

  // Para birimi değişikliği işleyicisi
  const handleCurrencyChange = (newCurrency) => {
    if (newCurrency === previousCurrency) return;
    
    // Dönüşüm oranını hesapla
    let conversionRate = 1;
    if (previousCurrency === 'TRY' && newCurrency === 'USD') {
      conversionRate = 1 / exchangeRates.USD;
    } else if (previousCurrency === 'TRY' && newCurrency === 'EUR') {
      conversionRate = 1 / exchangeRates.EUR;
    } else if (previousCurrency === 'USD' && newCurrency === 'TRY') {
      conversionRate = exchangeRates.USD;
    } else if (previousCurrency === 'EUR' && newCurrency === 'TRY') {
      conversionRate = exchangeRates.EUR;
    } else if (previousCurrency === 'USD' && newCurrency === 'EUR') {
      conversionRate = exchangeRates.USD / exchangeRates.EUR;
    } else if (previousCurrency === 'EUR' && newCurrency === 'USD') {
      conversionRate = exchangeRates.EUR / exchangeRates.USD;
    }
    
    // Tüm params fiyatlarını dönüştür
    setParams(prev => ({
      ...prev,
      baseFee: parseFloat((prev.baseFee * conversionRate).toFixed(2)),
      rate1: parseFloat((prev.rate1 * conversionRate).toFixed(2)),
      rate2: parseFloat((prev.rate2 * conversionRate).toFixed(2)),
      poleFee1: parseFloat((prev.poleFee1 * conversionRate).toFixed(2)),
      poleFee2: parseFloat((prev.poleFee2 * conversionRate).toFixed(2)),
      poleFee3: parseFloat((prev.poleFee3 * conversionRate).toFixed(2))
    }));
    
    // Eğer seçili firma varsa, onun fiyatlarını da güncelle
    if (selectedCompany) {
      setSelectedCompany(prev => ({
        ...prev,
        nominalFee: parseFloat((prev.nominalFee * conversionRate).toFixed(2)),
        discountAmount: parseFloat((prev.discountAmount * conversionRate).toFixed(2)),
        offerPrice: parseFloat((prev.offerPrice * conversionRate).toFixed(2))
      }));
    }
    
    setPreviousCurrency(newCurrency);
    setCurrency(newCurrency);
  };
  
  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "0,00";
    const currencySymbols = { 'TRY': 'TL', 'USD': '$', 'EUR': '€' };
    const symbol = currencySymbols[currency] || 'TL';
    if (val < 100) return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' ' + symbol;
    const formatted = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    return formatted + ' ' + symbol;
  };
  
  const formatNumber = (val) => {
    if (val === null || val === undefined || isNaN(val)) return "0";
    return new Intl.NumberFormat('tr-TR').format(val);
  };

  // Helper to calculate fees for a single company object
  const calculateCompanyFees = (companyData) => {
      const totalKVA = parsePower(companyData.powerStr);
      let nominalFee = 0;
      
      // EMO 2026 Hesaplama Mantığı
      if (companyData.type === 'direk' || (totalKVA < 400 && companyData.type !== 'bina')) {
          // Direk Tipi Trafo Merkezleri (EMO 2026 Kısım III - Madde 3.1)
          if (totalKVA <= 50) {
              nominalFee = params.poleFee1;
          } else if (totalKVA <= 160) {
              nominalFee = params.poleFee2;
          } else if (totalKVA <= 400) {
              nominalFee = params.poleFee3;
          } else {
              // 400 kVA üzeri direk tipi EMO listesinde net değilse bina tipi baz alınır
              nominalFee = params.baseFee + ((totalKVA - 400) * params.rate1);
          }
      } else {
          // Bina Tipi Trafo Merkezleri (EMO 2026 - Kısım III - Madde 5.2)
          if (totalKVA <= 400) {
             // Madde 5.2.1: İlk 400 kVA (2 hücre)
             nominalFee = params.baseFee;
          } else if (totalKVA <= 5000) {
             // Madde 5.2.2: 401 kVA - 5 MVA arası artan her kVA için
             nominalFee = params.baseFee + ((totalKVA - 400) * params.rate1);
          } else {
             // Madde 5.2.3: 5 MVA üzeri artan her kVA için
             // İlk 400 sabit + (4600 * rate1) + (kalan * rate2)
             nominalFee = params.baseFee + (4600 * params.rate1) + ((totalKVA - 5000) * params.rate2);
          }
      }

      // Bölge Katsayısı Uygulaması
      const appliedRegionCoeff = companyData.regionCoeff !== undefined ? companyData.regionCoeff : params.regionCoeff;
      nominalFee = nominalFee * appliedRegionCoeff;

      // İskonto Uygulaması
      const appliedDiscountRate = companyData.discountRate !== undefined ? companyData.discountRate : params.discountRate;

      const discountAmount = nominalFee * (appliedDiscountRate / 100);
      const offerPrice = nominalFee - discountAmount;

      return {
        ...companyData,
        totalKVA,
        nominalFee,
        discountAmount,
        offerPrice,
        regionCoeff: appliedRegionCoeff,
        appliedDiscountRate,
        refNo: `${params.year}-YG-${ODA_SICIL_NO}-${proposalCount.toString().padStart(3, '0')}` // Referans Numarası Oluşturma
      };
  };

  // --- Handlers ---
  const generateProposal = (company) => {
    setSelectedCompany(company);
    setAiOutput(""); 
    setAiActiveFeature(null);
    setActiveTab('proposal');
    setProposalCount(prev => prev + 1);
  };

  const handleDownloadPDF = async () => {
    if (!selectedCompany) return;
    
    const pages = document.querySelectorAll('.pdf-page');
    if (!pages || pages.length === 0) {
      alert('İçerik bulunamadı.');
      return;
    }
    
    const fileName = `YG_Teklif_${selectedCompany.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`;
    const targetWidthPx = 793;
    const SCALE_FACTOR = 2;

    try {
      // Logo yükle ve base64'e çevir (boyutlarıyla birlikte)
      const loadLogo = async () => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve({
              data: canvas.toDataURL('image/png'),
              width: img.width,
              height: img.height
            });
          };
          img.onerror = reject;
          img.src = '/fatura_logo.png';
        });
      };

      const logoInfo = await loadLogo();
      
      // Logo boyutlarını hesapla (aspect ratio koruyarak)
      const maxLogoWidth = 60; // mm (1.5x)
      const maxLogoHeight = 24; // mm (1.5x)
      const logoAspectRatio = logoInfo.width / logoInfo.height;
      let logoWidth = maxLogoWidth;
      let logoHeight = logoWidth / logoAspectRatio;
      
      if (logoHeight > maxLogoHeight) {
        logoHeight = maxLogoHeight;
        logoWidth = logoHeight * logoAspectRatio;
      }

      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      });

      // Her sayfayı ayrı yakalayıp PDF'e ekle
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        // Logoları gizle
        const logos = page.querySelectorAll('img[src="/fatura_logo.png"]');
        logos.forEach(logo => { logo.style.visibility = 'hidden'; });
        
        // Geçici stil ayarları
        const originalWidth = page.style.width;
        const originalMargin = page.style.margin;
        const originalBoxShadow = page.style.boxShadow;
        
        page.style.width = '210mm';
        page.style.margin = '0 auto';
        page.style.boxShadow = 'none';
        page.classList.add('pdf-exporting');

        // html2canvas ile yakalama
        const canvas = await html2canvas(page, {
          scale: SCALE_FACTOR,
          width: targetWidthPx,
          windowWidth: targetWidthPx,
          useCORS: true,
          allowTaint: false,
          letterRendering: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgWidth = 210; // A4 genişlik mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // İlk sayfa için yeni sayfa ekleme
        if (i > 0) {
          pdf.addPage();
        }

        // Görseli PDF'e ekle
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST');
        
        // Logoyu yüksek kalitede ekle (sol üst köşe, aspect ratio korunarak)
        pdf.addImage(logoInfo.data, 'PNG', 10, 10, logoWidth, logoHeight, '', 'FAST');

        // Logoları tekrar göster
        logos.forEach(logo => { logo.style.visibility = 'visible'; });

        // Stil ayarlarını geri al
        page.style.width = originalWidth;
        page.style.margin = originalMargin;
        page.style.boxShadow = originalBoxShadow;
        page.classList.remove('pdf-exporting');
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handleDownloadWord = async () => {
    if (!selectedCompany) return;
    
    try {
      const fileName = `YG_Teklif_${selectedCompany.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.docx`;
      
      // Tablo satırlarını oluştur
      const createTableRow = (label, value) => {
        return new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: label })],
              width: { size: 40, type: WidthType.PERCENTAGE }
            }),
            new TableCell({
              children: [new Paragraph({ text: value })],
              width: { size: 60, type: WidthType.PERCENTAGE }
            })
          ]
        });
      };

      // Detaylı hesaplama tablosu
      const calculationRows = [];
      
      if (selectedCompany.type !== 'direk' && selectedCompany.totalKVA >= 400) {
        calculationRows.push(createTableRow('İlk 400 kVA (Sabit)', formatCurrency(params.baseFee)));
        
        if (selectedCompany.totalKVA > 400 && selectedCompany.totalKVA <= 5000) {
          calculationRows.push(createTableRow(
            `401 - ${selectedCompany.totalKVA} kVA Arası`, 
            formatCurrency((selectedCompany.totalKVA - 400) * params.rate1)
          ));
        } else if (selectedCompany.totalKVA > 5000) {
          calculationRows.push(createTableRow('401 - 5000 kVA Arası', formatCurrency(4600 * params.rate1)));
          calculationRows.push(createTableRow('5000 kVA Üzeri', formatCurrency((selectedCompany.totalKVA - 5000) * params.rate2)));
        }
      } else {
        const poleType = selectedCompany.totalKVA <= 50 ? '0-50 kVA' : 
                        selectedCompany.totalKVA <= 160 ? '51-160 kVA' : '161-400 kVA';
        calculationRows.push(createTableRow(poleType + ' Sabit Bedel', formatCurrency(selectedCompany.nominalFee / selectedCompany.regionCoeff)));
      }

      if (selectedCompany.regionCoeff !== 1) {
        calculationRows.push(createTableRow(
          `Bölgesel Katsayı (x${selectedCompany.regionCoeff.toFixed(2)})`,
          formatCurrency(selectedCompany.nominalFee - (selectedCompany.nominalFee / selectedCompany.regionCoeff))
        ));
      }

      // Word belgesi oluştur
      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch = 1440 twips
                right: 1440,
                bottom: 1440,
                left: 1440
              }
            }
          },
          children: [
            // Başlık
            new Paragraph({
              text: "FİYAT TEKLİFİ",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 }
            }),
            new Paragraph({
              text: `Ref: ${selectedCompany.refNo}`,
              alignment: AlignmentType.RIGHT,
              spacing: { after: 100 }
            }),
            new Paragraph({
              text: new Date().toLocaleDateString('tr-TR'),
              alignment: AlignmentType.RIGHT,
              spacing: { after: 300 }
            }),
            
            // Giriş
            new Paragraph({
              children: [
                new TextRun({
                  text: `Sayın ${selectedCompany.contactName ? `${selectedCompany.contactName} - ` : ''}${selectedCompany.name} Yetkilisi,`,
                  bold: true
                })
              ],
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: `Tesisinize yönelik YG İşletme Sorumluluğu hizmeti fiyat teklifi, talep ettiğiniz trafo kurulu gücü ve TMMOB Elektrik Mühendisleri Odası'nın (EMO) ${params.year} yılı Ücret Tanımları (KISIM III) esas alınarak, rekabetçi piyasa koşulları doğrultusunda aşağıda sunulmuştur.`,
              spacing: { after: 400 }
            }),
            
            // 1. Bölüm: Tesis Bilgileri
            new Paragraph({
              text: "1. Tesis Bilgileri ve Toplam Kurulu Güç",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              text: `• Trafo Güçleri Dağılımı: ${selectedCompany.powerStr} kVA`,
              spacing: { after: 100 }
            }),
            new Paragraph({
              text: `• Toplam Kurulu Güç: ${selectedCompany.totalKVA} kVA (${(selectedCompany.totalKVA / 1000).toFixed(2)} MVA)`,
              spacing: { after: 100 }
            }),
            new Paragraph({
              text: `• Tesis Tipi: ${selectedCompany.type === 'direk' ? 'Direk Tipi Trafo Merkezi' : 'Bina Tipi Trafo Merkezi'}`,
              spacing: { after: 100 }
            }),
            new Paragraph({
              text: `• Bölge/Katsayı: ${selectedCompany.region || 'Belirtilmemiş'} (x${selectedCompany.regionCoeff.toFixed(2)})`,
              spacing: { after: 100 }
            }),
            new Paragraph({
              text: `• Sektör: ${selectedCompany.sector}`,
              spacing: { after: 400 }
            }),
            
            // 2. Bölüm: Hesaplama
            new Paragraph({
              text: `2. EMO ${params.year} Yılı Aylık Asgari Ücret Hesaplaması`,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 200 }
            }),
            
            // Hesaplama Tablosu
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: "Kapasite Aralığı", bold: true })],
                      shading: { fill: "bbdefb" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: "Tutar (TL)", bold: true })],
                      shading: { fill: "bbdefb" }
                    })
                  ]
                }),
                ...calculationRows,
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: `EMO ${params.year} TOPLAM NOMİNAL TARİFE`, bold: true })],
                      shading: { fill: "c8f0c8" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: formatCurrency(selectedCompany.nominalFee), bold: true })],
                      shading: { fill: "c8f0c8" }
                    })
                  ]
                })
              ],
              width: { size: 100, type: WidthType.PERCENTAGE }
            }),
            
            new Paragraph({ text: "", spacing: { after: 400 } }),
            
            // 3. Bölüm: İskonto ve Teklif
            new Paragraph({
              text: "3. Uygulanan İskonto ve Nihai Teklif",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              text: `Piyasa koşullarına uyum sağlamak amacıyla, işletmenize özel %${selectedCompany.appliedDiscountRate || params.discountRate} iskonto uygulanmıştır.`,
              spacing: { after: 300 }
            }),
            
            // Nihai Teklif Tablosu
            new Table({
              rows: [
                createTableRow('EMO Nominal Tarife:', formatCurrency(selectedCompany.nominalFee)),
                createTableRow(`İskonto Tutarı (%${selectedCompany.appliedDiscountRate || params.discountRate}):`, `- ${formatCurrency(selectedCompany.discountAmount)}`),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: "AYLIK TEKLİF FİYATI:", bold: true })],
                      shading: { fill: "c8e6c9" }
                    }),
                    new TableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ text: `${formatCurrency(selectedCompany.offerPrice)} + KDV`, bold: true, color: "1b5e20" })]
                      })],
                      shading: { fill: "c8e6c9" }
                    })
                  ]
                })
              ],
              width: { size: 100, type: WidthType.PERCENTAGE }
            }),
            
            new Paragraph({ text: "", spacing: { after: 400 } }),
            
            // Açıklamalar
            new Paragraph({
              text: "Açıklamalar:",
              bold: true,
              spacing: { before: 400, after: 200 }
            }),
            new Paragraph({
              text: `1. Bu teklif ${params.year} yılı boyunca geçerli olmak üzere aylık periyotlarla hazırlanmıştır.`,
              spacing: { after: 100 }
            }),
            new Paragraph({
              text: "2. İşletme sorumluluğu hizmetinin SMM tarafından üstlenilmesi halinde YG tesisi en az ayda bir kez denetlenmelidir.",
              spacing: { after: 100 }
            }),
            new Paragraph({
              text: "3. Enerji tüketiminin izlenmesi ve kompanzasyon tesisinin sağlıklı çalışıp çalışmadığının denetlenmesi bu hizmetin SORUMLULUK KAPSAMINDADIR.",
              spacing: { after: 100 }
            }),
            new Paragraph({
              text: "4. EMO tarafından hazırlanan Elektrik Yüksek Gerilim Tesisleri İşletme Sorumluluğu Yönetmeliği bu sözleşmenin ayrılmaz bir parçasıdır.",
              spacing: { after: 100 }
            }),
            new Paragraph({
              text: "5. İşveren olarak sizin yükümlülüğünüz, İşletme Sorumlusunun görevlerini yerine getirebilmesi için gerekli imalatları/hizmetleri sağlamak, talep edilen güvenlik malzemelerini almak ve uyarılarına riayet etmektir.",
              spacing: { after: 400 }
            }),
            
            // Footer
            new Paragraph({
              text: "Saygılarımızla,",
              spacing: { before: 600, after: 100 }
            }),
            new Paragraph({
              text: "Kobinerji Mühendislik",
              bold: true,
              spacing: { after: 100 }
            }),
            new Paragraph({
              text: "www.kobinerji.com.tr • info@kobinerji.com.tr",
              spacing: { after: 50 }
            }),
            new Paragraph({
              text: "Tel: +90 535 714 52 88 | İzmir, Türkiye"
            })
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Word belgesi oluşturma hatası:', error);
      alert('Word belgesi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const manualCompany = {
        id: 'MANUEL', 
        name: manualForm.name,
        sector: manualForm.sector,
        powerStr: manualForm.powerStr,
        contactName: manualForm.contactName,
        type: manualForm.type,
        region: manualForm.region, // Bölge adı
        regionCoeff: manualForm.regionCoeff, // Manuel formdan gelen özel katsayı
        discountRate: manualForm.customDiscount // Manuel formdan gelen özel iskonto
    };
    const calculated = calculateCompanyFees(manualCompany);
    generateProposal(calculated);
  };

  const handleRegionChange = (e) => {
    const selectedRegionName = e.target.value;
    const selectedRegion = REGION_LIST.find(r => r.name === selectedRegionName);
    if (selectedRegion) {
        setManualForm({
            ...manualForm,
            region: selectedRegionName,
            regionCoeff: selectedRegion.coeff
        });
    }
  };

  // --- Logo Upload Handler ---
  const handleLogoUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setLogo(reader.result);
          };
          reader.readAsDataURL(file);
      }
  };

  // --- Gemini API Handler ---
  const handleGeminiCall = async (type) => {
    if (!selectedCompany) return;
    
    setAiLoading(true);
    setAiError(null);
    setAiActiveFeature(type);
    setAiOutput("");

    const systemPrompt = "Sen Kobinerji Mühendislik şirketinin deneyimli bir satış mühendisisin. Dilin Türkçe, kurumsal, nazik ve profesyonel olmalı.";
    let userPrompt = "";

    if (type === 'email') {
        userPrompt = `
          Aşağıdaki bilgilerle müşteriye gönderilmek üzere bir e-posta taslağı hazırla.
          Müşteri Firma: ${selectedCompany.name}
          Yetkili Kişi: ${selectedCompany.contactName || 'İlgili Yetkili'}
          Hizmet: Yüksek Gerilim İşletme Sorumluluğu
          Toplam Güç: ${selectedCompany.totalKVA} kVA
          Teklif Tutarı: ${formatCurrency(selectedCompany.offerPrice)} + KDV (Aylık)
          
          E-posta, teklifin ekte sunulduğunu belirtmeli, Kobinerji'nin uzmanlığına vurgu yapmalı ve işbirliği temennisiyle bitmeli. Konu satırı da ekle.
        `;
    } else if (type === 'tips') {
        userPrompt = `
          ${selectedCompany.sector} sektöründe faaliyet gösteren ve ${selectedCompany.totalKVA} kVA trafo gücüne sahip bir işletme için;
          Yüksek Gerilim işletme güvenliği, enerji verimliliği ve bakım konularında 3 adet kısa, çarpıcı ve teknik tavsiye maddesi yaz.
          Bu tavsiyeler müşteriye katma değer sağladığımızı hissettirmeli.
        `;
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });

        if (!response.ok) throw new Error('API Hatası');

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "İçerik oluşturulamadı.";
        setAiOutput(text);
    } catch (error) {
        console.error("AI Error:", error);
        setAiError("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
    } finally {
        setAiLoading(false);
    }
  };

  const copyToClipboard = () => {
      if (aiOutput) {
          navigator.clipboard.writeText(aiOutput);
          alert("Metin kopyalandı!");
      }
  };

  // --- Excel Export Handler ---
  const handleExcelExport = () => {
    if (!selectedCompany) return;
    
    const workbook = XLSX.utils.book_new();
    
    // Teklif Bilgileri Sayfası
    const proposalData = [
      ['YÜKSEKKGERİLİM İŞLETME SORUMLULUĞU TEKLİFİ'],
      [],
      ['Referans No:', selectedCompany.refNo],
      ['Tarih:', new Date().toLocaleDateString('tr-TR')],
      [],
      ['FİRMA BİLGİLERİ'],
      ['Firma Unvanı:', selectedCompany.name],
      ['Yetkili:', selectedCompany.contactName],
      ['Sektör:', selectedCompany.sector],
      ['Tesis Tipi:', selectedCompany.type === 'direk' ? 'Direk Tipi' : 'Bina Tipi'],
      ['Bölge:', selectedCompany.region || 'Belirtilmemiş'],
      ['Bölge Katsayısı:', selectedCompany.regionCoeff],
      [],
      ['GÜÇ BİLGİLERİ'],
      ['Trafo Güçleri:', selectedCompany.powerStr + ' kVA'],
      ['Toplam Kurulu Güç:', selectedCompany.totalKVA + ' kVA'],
      ['Toplam Kurulu Güç (MVA):', (selectedCompany.totalKVA / 1000).toFixed(2)],
      [],
      ['MALİ BİLGİLER'],
      ['EMO Nominal Ücret:', formatCurrency(selectedCompany.nominalFee)],
      ['İskonto Oranı:', '%' + (selectedCompany.appliedDiscountRate || params.discountRate)],
      ['İskonto Tutarı:', formatCurrency(selectedCompany.discountAmount)],
      ['AYLIK TEKLİF FİYATI:', formatCurrency(selectedCompany.offerPrice) + ' + KDV'],
      [],
      ['Kobinerji Mühendislik'],
      ['www.kobinerji.com.tr • info@kobinerji.com.tr'],
      ['Tel: +90 535 714 52 88 | İzmir, Türkiye']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(proposalData);
    
    // Sütun genişlikleri
    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 50 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Teklif');
    
    // Dosya adı
    const fileName = `YG_Teklif_${selectedCompany.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  // --- Email Gönderme Handler ---
  const handleSendEmail = async () => {
    if (!selectedCompany) {
      alert('Lütfen önce bir teklif oluşturun.');
      return;
    }
    
    const recipientEmail = prompt('Alıcı e-posta adresini girin:');
    if (!recipientEmail) return;
    
    try {
      // EmailJS yapılandırması - Kullanıcının kendi hesabını oluşturması gerekir
      const serviceID = 'service_xxxxxxx'; // EmailJS Service ID
      const templateID = 'template_xxxxxxx'; // EmailJS Template ID
      const userID = 'user_xxxxxxxxxx'; // EmailJS User ID
      
      const templateParams = {
        to_email: recipientEmail,
        company_name: selectedCompany.name,
        contact_name: selectedCompany.contactName,
        ref_no: selectedCompany.refNo,
        total_power: selectedCompany.totalKVA,
        offer_price: formatCurrency(selectedCompany.offerPrice),
        date: new Date().toLocaleDateString('tr-TR')
      };
      
      await emailjs.send(serviceID, templateID, templateParams, userID);
      alert('E-posta başarıyla gönderildi!');
    } catch (error) {
      console.error('Email Error:', error);
      alert('E-posta gönderilemedi. Lütfen EmailJS yapılandırmasını kontrol edin.');
    }
  };

  // --- Editor Toggle Handler ---
  const toggleEditorMode = () => {
    if (!editorMode && selectedCompany) {
      // Editor moduna geçerken mevcut içeriği al
      const element = document.getElementById('printable-paper');
      if (element) {
        setEditableContent(element.innerHTML);
      }
    }
    setEditorMode(!editorMode);
  };

  // Periyodik Kontrol Edit Mode Toggle
  const togglePeriodicEditorMode = () => {
    if (!periodicEditorMode) {
      const element = document.getElementById('periodic-proposal-area');
      if (element) {
        setPeriodicEditableContent(element.innerHTML);
      }
    }
    setPeriodicEditorMode(!periodicEditorMode);
  };

  // Periyodik Kontrol PDF Export
  const handlePeriodicPDFExport = async () => {
    if (!periodicCustomer.name) {
      alert('Lütfen müşteri bilgilerini doldurun.');
      return;
    }
    
    const pages = document.querySelectorAll('.periodic-pdf-page');
    if (!pages || pages.length === 0) {
      alert('İçerik bulunamadı.');
      return;
    }
    
    const fileName = `Periyodik_Kontrol_Teklif_${periodicCustomer.name.replace(/[^a-z0-9ğüşıöçĞÜŞİÖÇ]/gi, '_')}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`;
    const targetWidthPx = 793;
    const SCALE_FACTOR = 2;

    try {
      // Logo yükle ve base64'e çevir (boyutlarıyla birlikte)
      const loadLogo = async () => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve({
              data: canvas.toDataURL('image/png'),
              width: img.width,
              height: img.height
            });
          };
          img.onerror = reject;
          img.src = '/fatura_logo.png';
        });
      };

      const logoInfo = await loadLogo();
      
      // Logo boyutlarını hesapla (aspect ratio koruyarak)
      const maxLogoWidth = 60; // mm (1.5x)
      const maxLogoHeight = 24; // mm (1.5x)
      const logoAspectRatio = logoInfo.width / logoInfo.height;
      let logoWidth = maxLogoWidth;
      let logoHeight = logoWidth / logoAspectRatio;
      
      if (logoHeight > maxLogoHeight) {
        logoHeight = maxLogoHeight;
        logoWidth = logoHeight * logoAspectRatio;
      }

      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      });

      // Her sayfayı ayrı yakalayıp PDF'e ekle
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        // Logoları gizle
        const logos = page.querySelectorAll('img[src="/fatura_logo.png"]');
        logos.forEach(logo => { logo.style.visibility = 'hidden'; });
        
        // Geçici stil ayarları
        const originalWidth = page.style.width;
        const originalMargin = page.style.margin;
        const originalBoxShadow = page.style.boxShadow;
        
        page.style.width = '210mm';
        page.style.margin = '0 auto';
        page.style.boxShadow = 'none';
        page.classList.add('pdf-exporting');

        // html2canvas ile yakalama
        const canvas = await html2canvas(page, {
          scale: SCALE_FACTOR,
          width: targetWidthPx,
          windowWidth: targetWidthPx,
          useCORS: true,
          allowTaint: false,
          letterRendering: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0
        });

        const imgData = canvas.toDataURL('image/png', 1.0);
        const imgWidth = 210; // A4 genişlik mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // İlk sayfa için yeni sayfa ekleme
        if (i > 0) {
          pdf.addPage();
        }

        // Görseli PDF'e ekle
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST');
        
        // Logoyu yüksek kalitede ekle (sol üst köşe, aspect ratio korunarak)
        pdf.addImage(logoInfo.data, 'PNG', 10, 10, logoWidth, logoHeight, '', 'FAST');

        // Logoları tekrar göster
        logos.forEach(logo => { logo.style.visibility = 'visible'; });

        // Stil ayarlarını geri al
        page.style.width = originalWidth;
        page.style.margin = originalMargin;
        page.style.boxShadow = originalBoxShadow;
        page.classList.remove('pdf-exporting');
      }

      pdf.save(fileName);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  // --- Gelişmiş PDF Export ---
  const handleAdvancedPDFExport = () => {
    if (!selectedCompany) return;
    
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    // Başlık
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FİYAT TEKLİFİ', pageWidth / 2, margin, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ref: ${selectedCompany.refNo}`, pageWidth - margin, margin + 10, { align: 'right' });
    doc.text(new Date().toLocaleDateString('tr-TR'), pageWidth - margin, margin + 15, { align: 'right' });
    
    // Firma Bilgileri
    let yPos = margin + 30;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Sayın ${selectedCompany.contactName || ''} - ${selectedCompany.name} Yetkilisi,`, margin, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const introText = `Tesisinize yönelik YG İşletme Sorumluluğu hizmeti fiyat teklifi, EMO ${params.year} yılı Ücret Tanımları esas alınarak sunulmuştur.`;
    const splitText = doc.splitTextToSize(introText, pageWidth - 2 * margin);
    doc.text(splitText, margin, yPos);
    
    yPos += splitText.length * 5 + 10;
    
    // Tablo
    doc.autoTable({
      startY: yPos,
      head: [['Özellik', 'Değer']],
      body: [
        ['Toplam Kurulu Güç', `${selectedCompany.totalKVA} kVA`],
        ['Tesis Tipi', selectedCompany.type === 'direk' ? 'Direk Tipi' : 'Bina Tipi'],
        ['Bölge', selectedCompany.region || 'Belirtilmemiş'],
        ['Sektör', selectedCompany.sector],
        ['EMO Nominal Ücret', formatCurrency(selectedCompany.nominalFee)],
        ['İskonto Oranı', `%${selectedCompany.appliedDiscountRate || params.discountRate}`],
        ['İskonto Tutarı', formatCurrency(selectedCompany.discountAmount)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] }
    });
    
    // Nihai Teklif
    yPos = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('AYLIK TEKLİF FİYATI:', margin, yPos);
    doc.text(`${formatCurrency(selectedCompany.offerPrice)} + KDV`, pageWidth - margin, yPos, { align: 'right' });
    
    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Kobinerji Mühendislik', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text('www.kobinerji.com.tr • info@kobinerji.com.tr | Tel: +90 535 714 52 88 | İzmir, Türkiye', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Kaydet
    const fileName = `YG_Teklif_${selectedCompany.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`;
    doc.save(fileName);
  };

  // --- UI Components ---

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <style>{`
        @media print {
          @page { 
            margin: 0; 
            size: A4 portrait; 
          }
          body * { 
            visibility: hidden; 
          }
          #printable-paper, #printable-paper * { 
            visibility: visible; 
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #printable-paper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
            z-index: 9999;
          }
          #printable-paper > div {
            box-shadow: none !important;
            margin: 0 !important;
            max-width: 100% !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
          }
          .page-break { 
            page-break-before: always !important;
            page-break-after: always !important;
            margin: 0 !important;
          }
          .no-print, .no-print-border { 
            display: none !important; 
            border: none !important;
          }
        }
        
        /* PDF Export specific styles */
        .pdf-page {
          page-break-after: always;
          page-break-inside: avoid;
        }

        /* PDF export quality tweaks (html2pdf) */
        .pdf-exporting {
          background: #ffffff !important;
        }
        .pdf-exporting#printable-paper {
          width: 210mm !important;
          margin: 0 auto !important;
          padding: 0 !important;
        }
        .pdf-exporting .pdf-page {
          box-shadow: none !important;
          margin: 0 auto !important;
          width: 210mm !important;
          min-height: 297mm !important;
          background: #ffffff !important;
        }
        .pdf-exporting .no-print,
        .pdf-exporting .print-hide {
          display: none !important;
        }
      `}</style>
      
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg no-print">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Calculator className="h-8 w-8 text-yellow-400" />
            <div>
              <h1 className="text-xl font-bold">YG İşletme Sorumluluğu</h1>
              <p className="text-xs text-blue-200">Teklif Hazırlama Otomasyonu v2026</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-blue-800 rounded-full text-xs text-blue-200 flex items-center">
                <Sparkles className="w-3 h-3 mr-1 text-yellow-400"/>
                Gemini AI Destekli
            </div>
            <button 
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="flex items-center space-x-2 bg-blue-800 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
            >
              <Settings className="h-4 w-4" />
              <span>Parametreler</span>
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel (Collapsible) */}
      {isSettingsOpen && (
        <div className="bg-white border-b border-gray-200 shadow-inner">
          <div className="container mx-auto px-6 py-6">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
              <Edit3 className="h-4 w-4 mr-2" />
              Hesaplama Parametreleri (EMO 2026)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Sabit Ücret (Bina 0-400)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={params.baseFee} 
                    onChange={(e) => setParams({...params, baseFee: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">TL</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Birim Fiyat (401-5000)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={params.rate1} 
                    onChange={(e) => setParams({...params, rate1: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">TL/kVA</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Birim Fiyat (&gt;5000 kVA)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={params.rate2} 
                    onChange={(e) => setParams({...params, rate2: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">TL/kVA</span>
                </div>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Global Bölge Katsayısı (BK)</label>
                <div className="relative">
                  <input 
                    type="number"
                    step="0.05"
                    value={params.regionCoeff} 
                    onChange={(e) => setParams({...params, regionCoeff: parseFloat(e.target.value) || 1.0})}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">x</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Örn: İzmir: 1.00, Adana: 0.75 (Liste dışı için)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Global İskonto</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={params.discountRate} 
                    onChange={(e) => setParams({...params, discountRate: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-blue-700 font-bold" 
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Para Birimi</label>
                <select 
                  value={currency} 
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-blue-700"
                >
                  <option value="TRY">🇹🇷 Türk Lirası (TL)</option>
                  <option value="USD">🇺🇸 Dolar ($)</option>
                  <option value="EUR">🇪🇺 Euro (€)</option>
                </select>
              </div>
              {/* Kur Oranları */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-2">💱 Kur Oranları (1 TL = ? Yabancı Para)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">USD Kuru</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.01"
                        value={exchangeRates.USD} 
                        onChange={(e) => setExchangeRates({...exchangeRates, USD: parseFloat(e.target.value) || 1})}
                        className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                      />
                      <span className="absolute right-3 top-2 text-gray-400 text-xs">TL/$</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">EUR Kuru</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        step="0.01"
                        value={exchangeRates.EUR} 
                        onChange={(e) => setExchangeRates({...exchangeRates, EUR: parseFloat(e.target.value) || 1})}
                        className="w-full border rounded px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" 
                      />
                      <span className="absolute right-3 top-2 text-gray-400 text-xs">TL/€</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-yellow-600 mt-1">⚠️ Para birimini değiştirdiğinizde tüm fiyatlar otomatik dönüştürülecektir.</p>
              </div>
              {/* Direk Tipi Ayarları */}
              <div className="md:col-span-3 border-t pt-4 mt-2">
                 <p className="text-xs font-bold text-gray-500 mb-2">DİREK TİPİ TRAFOLAR (EMO Madde 3.1)</p>
                 <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-gray-500">0-50 kVA</label>
                        <input type="number" value={params.poleFee1} onChange={(e) => setParams({...params, poleFee1: parseFloat(e.target.value) || 0})} className="w-full border p-1 rounded text-xs" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">51-160 kVA</label>
                        <input type="number" value={params.poleFee2} onChange={(e) => setParams({...params, poleFee2: parseFloat(e.target.value) || 0})} className="w-full border p-1 rounded text-xs" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">161-400 kVA</label>
                        <input type="number" value={params.poleFee3} onChange={(e) => setParams({...params, poleFee3: parseFloat(e.target.value) || 0})} className="w-full border p-1 rounded text-xs" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        
        {/* Tabs */}
        <div className="flex space-x-2 bg-gray-200 p-1 rounded-xl w-fit mb-6 no-print">
          <button 
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition flex items-center ${activeTab === 'manual' ? 'bg-white shadow text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <UserPlus className="w-4 h-4 mr-2"/>
            YG İşletme Sorumluluğu
          </button>
          <button 
            onClick={() => setActiveTab('periodic')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition flex items-center ${activeTab === 'periodic' ? 'bg-white shadow text-green-700' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <RefreshCw className="w-4 h-4 mr-2"/>
            Periyodik Kontrol
          </button>
          <button 
            onClick={() => setActiveTab('kesif')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition flex items-center ${activeTab === 'kesif' ? 'bg-white shadow text-orange-700' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Hammer className="w-4 h-4 mr-2"/>
            Keşif Metraj (Malzeme + Kablo)
          </button>
          <button 
            onClick={() => setActiveTab('proposal')}
            disabled={!selectedCompany}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition flex items-center ${activeTab === 'proposal' ? 'bg-white shadow text-blue-700' : 'text-gray-400 cursor-not-allowed'}`}
          >
            Teklif Önizleme
            {selectedCompany && <span className="ml-2 text-xs bg-blue-100 px-2 py-0.5 rounded-full text-blue-700">{selectedCompany.name.substring(0, 15)}...</span>}
          </button>
        </div>

        {/* Tab Content: Manuel Giriş */}
        {activeTab === 'manual' && (
           <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
             <div className="bg-blue-900 px-6 py-4 border-b border-blue-800">
                <h2 className="text-lg font-bold text-white flex items-center">
                    <UserPlus className="mr-2 h-5 w-5"/>
                    Teklif Bilgileri Girişi
                </h2>
                <p className="text-blue-200 text-xs mt-1">Firma bilgilerini ve EMO parametrelerini girerek teklif hesaplayın.</p>
             </div>
             
             <form onSubmit={handleManualSubmit} className="p-8 space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Firma Unvanı</label>
                        <input 
                            required
                            type="text" 
                            placeholder="Örn: ABC Endüstri San. ve Tic. A.Ş."
                            value={manualForm.name}
                            onChange={(e) => setManualForm({...manualForm, name: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Yetkili Adı Soyadı</label>
                        <input 
                            required
                            type="text" 
                            placeholder="Örn: Ahmet Yılmaz"
                            value={manualForm.contactName}
                            onChange={(e) => setManualForm({...manualForm, contactName: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-blue-50"
                        />
                        <p className="text-xs text-gray-500 mt-1">Teklif mektubunda "Sayın [Ad Soyad] Yetkilisi" şeklinde kullanılacaktır.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Sektör</label>
                        <input 
                            required
                            type="text" 
                            placeholder="Örn: Tekstil, Gıda"
                            value={manualForm.sector}
                            onChange={(e) => setManualForm({...manualForm, sector: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        />
                    </div>

                    <div>
                         <label className="block text-sm font-semibold text-gray-700 mb-2">Trafo Merkezi Tipi</label>
                         <select 
                            value={manualForm.type}
                            onChange={(e) => setManualForm({...manualForm, type: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                         >
                             <option value="bina">Bina Tipi (Sanayi Tesisleri)</option>
                             <option value="direk">Direk Tipi</option>
                         </select>
                         <p className="text-xs text-gray-500 mt-1">Not: 400 kVA altı bina tipi merkezler, direk tipi olarak da değerlendirilebilir.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Toplam Kurulu Güç (kVA)</label>
                        <div className="relative">
                            <input 
                                required
                                type="text" 
                                placeholder="Örn: 1600 veya 1000+630"
                                value={manualForm.powerStr}
                                onChange={(e) => setManualForm({...manualForm, powerStr: e.target.value})}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono"
                            />
                            <Zap className="absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Birden fazla trafo için '+' ile ayırabilirsiniz.</p>
                    </div>

                     {/* Yeni Eklenen Alan: Bölge/Şehir Seçimi */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <MapPin className="w-4 h-4 mr-1 text-blue-600"/>
                            Bölge/Şehir (Katsayı)
                        </label>
                        <div className="relative">
                            <select 
                                value={manualForm.region}
                                onChange={handleRegionChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none bg-white"
                            >
                                {REGION_LIST.map((r, index) => (
                                    <option key={index} value={r.name}>
                                        {r.name} (x{r.coeff.toFixed(2)})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                        <p className="text-xs text-green-600 mt-1 font-semibold">
                            Seçili Katsayı: {manualForm.regionCoeff.toFixed(2)}
                        </p>
                    </div>

                    {/* Yeni Eklenen Alan: İskonto Oranı */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <Percent className="w-4 h-4 mr-1 text-blue-600"/>
                            İskonto Oranı (%)
                        </label>
                        <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={manualForm.customDiscount}
                            onChange={(e) => setManualForm({...manualForm, customDiscount: parseFloat(e.target.value) || 0})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-bold text-blue-800"
                        />
                         <p className="text-xs text-gray-500 mt-1">Varsayılan: %{params.discountRate}</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        <span className="font-bold text-blue-900">Not:</span> EMO {params.year} tarifeleri, {manualForm.region} katsayısı ve %{manualForm.customDiscount} iskonto uygulanacaktır.
                    </div>
                    <button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform active:scale-95 transition flex items-center"
                    >
                        <Calculator className="mr-2 h-5 w-5"/>
                        Hesapla ve Teklif Oluştur
                    </button>
                </div>

             </form>
           </div>
        )}

        {/* Tab Content: Periyodik Kontrol */}
        {activeTab === 'periodic' && (
          <div className="flex gap-6 flex-col lg:flex-row">
            
            {/* Sol Panel: Veri Girişi */}
            <div className="lg:w-1/3 bg-white p-6 rounded-xl shadow-lg border border-gray-200 overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <RefreshCw className="text-green-600" />
                Periyodik Kontrol Teklif Robotu
              </h2>
              
              <div className="space-y-4">
                {/* Müşteri Bilgileri */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h3 className="text-sm font-semibold text-blue-800 mb-2">Müşteri Bilgileri</h3>
                  <div className="grid gap-3">
                    <input 
                      type="text" 
                      placeholder="Firma Adı" 
                      value={periodicCustomer.name} 
                      onChange={e => setPeriodicCustomer({...periodicCustomer, name: e.target.value})} 
                      className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    <input 
                      type="text" 
                      placeholder="Şehir / Lokasyon" 
                      value={periodicCustomer.city} 
                      onChange={e => setPeriodicCustomer({...periodicCustomer, city: e.target.value})} 
                      className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                    <input 
                      type="text" 
                      placeholder="Yetkili Kişi" 
                      value={periodicCustomer.contactName} 
                      onChange={e => setPeriodicCustomer({...periodicCustomer, contactName: e.target.value})} 
                      className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    />
                  </div>
                </div>

                {/* Teknik Veriler */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Tesis Verileri (EMO 2026)</h3>
                  
                  <label className="block text-xs font-medium text-gray-600 mb-1">Toplam Trafo Gücü (kVA)</label>
                  <input 
                    type="number" 
                    value={periodicInputs.trafoGucu} 
                    onChange={e => setPeriodicInputs({...periodicInputs, trafoGucu: Number(e.target.value)})} 
                    className="w-full border p-2 rounded mb-3 focus:ring-2 focus:ring-green-500 outline-none" 
                  />

                  <label className="block text-xs font-medium text-gray-600 mb-1">Kapalı Alan (m²)</label>
                  <input 
                    type="number" 
                    value={periodicInputs.yapiAlani} 
                    onChange={e => setPeriodicInputs({...periodicInputs, yapiAlani: Number(e.target.value)})} 
                    className="w-full border p-2 rounded mb-3 focus:ring-2 focus:ring-green-500 outline-none" 
                  />

                  <label className="block text-xs font-medium text-gray-600 mb-1">Topraklama Ölçüm Sayısı</label>
                  <input 
                    type="number" 
                    value={periodicInputs.topraklamaAdet} 
                    onChange={e => setPeriodicInputs({...periodicInputs, topraklamaAdet: Number(e.target.value)})} 
                    className="w-full border p-2 rounded mb-3 focus:ring-2 focus:ring-green-500 outline-none" 
                  />

                  <label className="block text-xs font-medium text-gray-600 mb-1">Paratoner Tesisat Sayısı</label>
                  <input 
                    type="number" 
                    value={periodicInputs.paratonerAdet} 
                    onChange={e => setPeriodicInputs({...periodicInputs, paratonerAdet: Number(e.target.value)})} 
                    className="w-full border p-2 rounded mb-3 focus:ring-2 focus:ring-green-500 outline-none" 
                  />

                  <label className="block text-xs font-medium text-gray-600 mb-1">RCD Test Sayısı</label>
                  <input 
                    type="number" 
                    value={periodicInputs.rcdAdet} 
                    onChange={e => setPeriodicInputs({...periodicInputs, rcdAdet: Number(e.target.value)})} 
                    className="w-full border p-2 rounded mb-3 focus:ring-2 focus:ring-green-500 outline-none" 
                  />
                </div>

                {/* İskonto Ayarı */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">Fiyatlandırma</h3>
                  <label className="block text-xs font-medium text-green-700 mb-1">İskonto Oranı (%)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="range" 
                      min="0" 
                      max="95" 
                      step="1" 
                      value={periodicInputs.iskonto} 
                      onChange={e => setPeriodicInputs({...periodicInputs, iskonto: Number(e.target.value)})} 
                      className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="font-bold text-green-800 w-12 text-right">%{periodicInputs.iskonto}</span>
                  </div>
                </div>

                {/* Hesapla Butonu */}
                <button 
                  onClick={calculatePeriodicPrices}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition shadow-md flex justify-center items-center gap-2"
                >
                  <Calculator className="h-5 w-5"/>
                  Hesapla
                </button>

                {/* İşlem Butonları */}
                <div className="space-y-3">
                  <button 
                    onClick={togglePeriodicEditorMode}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition shadow-md flex justify-center items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4"/>
                    {periodicEditorMode ? 'Düzenleme Modundan Çık' : 'Düzenleme Modu'}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => window.print()} 
                      className="bg-gray-700 text-white py-3 rounded-lg font-bold hover:bg-gray-800 transition shadow-md flex justify-center items-center gap-2"
                    >
                      <Printer className="h-4 w-4"/>
                      Yazdır
                    </button>
                    <button 
                      onClick={handlePeriodicPDFExport} 
                      className="bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md flex justify-center items-center gap-2"
                    >
                      <Download className="h-4 w-4"/>
                      PDF İndir
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-xs text-gray-400">
                * Hesaplamalar EMO 2026 Kısım V Test ve Ölçüm Hizmetleri tarifesine göre yapılmaktadır. KDV Hariçtir.
              </div>
            </div>

            {/* Sağ Panel: Teklif Önizleme */}
            <div className="lg:w-2/3 bg-gray-200 p-8 rounded-xl overflow-auto">
              {/* Editor Mode Banner */}
              {periodicEditorMode && (
                <div className="mb-4 bg-indigo-600 text-white p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-5 w-5"/>
                    <span className="font-bold">Düzenleme Modu Aktif - Metinleri doğrudan düzenleyebilirsiniz</span>
                  </div>
                  <button 
                    onClick={togglePeriodicEditorMode}
                    className="bg-white text-indigo-600 px-4 py-2 rounded hover:bg-gray-100 transition font-bold flex items-center gap-2"
                  >
                    <X className="h-4 w-4"/>
                    Kapat
                  </button>
                </div>
              )}
              
              {/* Periyodik Kontrol Paper Structure */}
              <div 
                id="periodic-printable-paper"
                contentEditable={periodicEditorMode}
                suppressContentEditableWarning={true}
                className={periodicEditorMode ? 'outline-2 outline-dashed outline-indigo-400' : ''}
                style={periodicEditorMode ? { minHeight: '297mm' } : {}}
              >
                
                {/* SAYFA 1 */}
                <div className="bg-white max-w-[210mm] mx-auto min-h-[297mm] p-[10mm] pb-[35mm] shadow-2xl relative text-[10pt] leading-tight text-gray-800 periodic-pdf-page" style={{pageBreakAfter: 'always', pageBreakInside: 'avoid'}}>
                  <div>
                
                {/* Header */}
                <div className="flex justify-between items-center border-b pb-6 mb-6">
                  {/* Logo Area */}
                  <div className="flex items-start justify-start min-w-[150px]">
                    <img src="/fatura_logo.png" alt="Kobinerji Logo" className="h-24 max-w-[210px] object-contain" />
                  </div>
                  <div className="text-center flex-1">
                    <h1 className="text-2xl font-bold text-gray-800">TEKLİF MEKTUBU</h1>
                    <p className="text-gray-500 text-sm mt-1">Periyodik Kontrol ve Test Hizmetleri</p>
                  </div>
                  <div className="text-right w-48">
                    <p className="text-xs text-gray-500">İzmir, Türkiye</p>
                    <p className="text-xs text-gray-500 mt-1">Tarih: {periodicCustomer.date}</p>
                  </div>
                </div>

                {/* Müşteri Başlığı */}
                <div className="mb-8">
                  <h3 className="text-md font-bold text-gray-800 mb-2">
                    Sayın {periodicCustomer.contactName ? `${periodicCustomer.contactName} - ` : ''}{periodicCustomer.name || '[Firma Adı]'} Yetkilisi,
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    İşletmenizde talep edilen tüm elektrik sistemleri periyodik kontrol ve yasal test hizmetlerine yönelik fiyat teklifimiz, 
                    <strong> TMMOB Elektrik Mühendisleri Odası (EMO) 2026 yılı Ücret Tanımları</strong> esas alınarak aşağıda sunulmuştur.
                  </p>
                </div>

                {/* Tesis Bilgileri Özeti */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-700 border-b border-gray-200 mb-2 pb-1">1. Tesis Bilgileri</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-gray-500 block text-xs">Kurulu Trafo Gücü</span>
                      <span className="font-semibold text-gray-800">{periodicInputs.trafoGucu} kVA</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-gray-500 block text-xs">Kapalı Alan</span>
                      <span className="font-semibold text-gray-800">{periodicInputs.yapiAlani} m²</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-gray-500 block text-xs">Tesis Yeri</span>
                      <span className="font-semibold text-gray-800">{periodicCustomer.city || '[Şehir]'}</span>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <span className="text-gray-500 block text-xs">Kapsam</span>
                      <span className="font-semibold text-gray-800">Yıllık Yasal Periyodik Kontrol</span>
                    </div>
                  </div>
                </div>

                {/* Fiyat Tablosu */}
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-gray-700 border-b border-gray-200 mb-2 pb-1">2. Hizmet Bedelleri (EMO 2026 Kısım V)</h4>
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600">
                        <th className="p-2 rounded-l">Hizmet Kalemi</th>
                        <th className="p-2">Detay / Hesaplama</th>
                        <th className="p-2 text-right rounded-r">Nominal Bedel (TL)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="p-2 font-medium">1. YG/TM Gözle Kontrolü</td>
                        <td className="p-2 text-xs text-gray-500">{periodicResults.yg.desc || 'Henüz hesaplanmadı'}</td>
                        <td className="p-2 text-right">{formatCurrency(periodicResults.yg.total)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">2. AG İç Tesisat Kontrolü</td>
                        <td className="p-2 text-xs text-gray-500">{periodicResults.ag.desc || 'Henüz hesaplanmadı'}</td>
                        <td className="p-2 text-right">{formatCurrency(periodicResults.ag.total)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">3. Topraklama Ölçümü</td>
                        <td className="p-2 text-xs text-gray-500">{periodicResults.topraklama.desc || 'Henüz hesaplanmadı'}</td>
                        <td className="p-2 text-right">{formatCurrency(periodicResults.topraklama.total)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">4. Yıldırımdan Korunma</td>
                        <td className="p-2 text-xs text-gray-500">{periodicResults.paratoner.desc || 'Henüz hesaplanmadı'}</td>
                        <td className="p-2 text-right">{formatCurrency(periodicResults.paratoner.total)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">5. RCD Testleri</td>
                        <td className="p-2 text-xs text-gray-500">{periodicResults.rcd.desc || 'Henüz hesaplanmadı'}</td>
                        <td className="p-2 text-right">{formatCurrency(periodicResults.rcd.total)}</td>
                      </tr>
                      <tr className="bg-gray-50 font-semibold text-gray-700">
                        <td className="p-2" colSpan="2">Ara Toplam (Hizmetler)</td>
                        <td className="p-2 text-right">{formatCurrency(periodicResults.subTotal)}</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">Test Ölçüm Keşif Bedeli</td>
                        <td className="p-2 text-xs text-gray-500">Sabit Bedel</td>
                        <td className="p-2 text-right">{formatCurrency(periodicResults.kesif)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Toplam ve İskonto Alanı */}
                <div className="flex justify-end mb-8">
                  <div className="w-full md:w-1/2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>EMO Liste Fiyatı Toplamı:</span>
                      <span className="font-semibold">{formatCurrency(periodicResults.grandTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-700 mb-2">
                      <span>Uygulanan İskonto (%{periodicInputs.iskonto}):</span>
                      <span>- {formatCurrency(periodicResults.discountAmount)}</span>
                    </div>
                    <div className="border-t-2 border-blue-300 my-3"></div>
                    <div className="flex justify-between text-lg font-bold text-blue-900">
                      <span>TEKLİF EDİLEN TOPLAM:</span>
                      <span>{formatCurrency(periodicResults.finalPrice)}</span>
                    </div>
                    <div className="text-right text-xs text-gray-500 mt-1">+ KDV</div>
                  </div>
                </div>

                  </div>
                </div>
                {/* SAYFA 1 SONU */}

                {/* SAYFA 2 */}
                <div className="bg-white max-w-[210mm] mx-auto min-h-[297mm] p-[10mm] pb-[35mm] shadow-2xl relative text-[10pt] leading-tight text-gray-800 periodic-pdf-page" style={{pageBreakBefore: 'always', pageBreakInside: 'avoid', pageBreakAfter: 'auto'}}>
                  <div>

                {/* Header - Sayfa 2 */}
                <div className="flex justify-between items-start border-b pb-6 mb-6">
                  <div className="flex items-start justify-start min-w-[150px]">
                    <img src="/fatura_logo.png" alt="Kobinerji Logo" className="h-24 max-w-[210px] object-contain" />
                  </div>
                </div>

                {/* İndirim Gerekçesi */}
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="text-[10pt] font-bold text-blue-900 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2"/>
                    İndirim Uygulamasının Gerekçesi ve Katma Değer
                  </h4>
                  <p className="text-[9pt] text-gray-700 leading-tight mb-3">
                    Bu hizmetler normalde EMO'nun asgari ücret yönetmeliğine tabi olsa da, Kobinerji olarak size sağladığımız rekabetçi avantajlar ve taahhütlerimiz şunlardır:
                  </p>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <h5 className="text-[9pt] font-bold text-gray-800 mb-1">1. Stratejik Müşteri Ölçeği</h5>
                      <p className="text-[9pt] text-gray-600 leading-tight">
                        {periodicCustomer.name || 'Müşteriniz'}, sanayi tesisi olarak büyük bir potansiyele sahiptir. Kobinerji'nin {periodicCustomer.city || 'bölgedeki'} konumlanması ve bölgedeki büyük endüstriyel müşterilere odaklanma hedefi, bu ölçekteki bir firmayla uzun vadeli iş birliği için yüksek indirim oranını haklı kılmaktadır.
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-green-500">
                      <h5 className="text-[9pt] font-bold text-gray-800 mb-1">2. Yasal Uyum ve Güvenlik</h5>
                      <p className="text-[9pt] text-gray-600 leading-tight">
                        Teklif kapsamındaki tüm hizmetler (Topraklama, RCD Testleri, Yıldırımdan Korunma ve İç Tesisat Gözle Kontrolü), İş Ekipmanlarının Kullanımında Sağlık ve Güvenlik Şartları Yönetmeliği uyarınca zorunlu olan yıllık periyodik kontrol gerekliliklerini eksiksiz yerine getirecektir.
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                      <h5 className="text-[9pt] font-bold text-gray-800 mb-1">3. Tekrar Eden Hizmet Olanakları</h5>
                      <p className="text-[9pt] text-gray-600 leading-tight">
                        EMO mevzuatı, tekrarlanan ölçüm ve denetim hizmetlerinde bedellerin %50'sinin uygulanabileceğini belirtmektedir. Sizin talep ettiğiniz %{periodicInputs.iskonto} iskonto oranı, bu yasal alt sınırın çok üzerinde, Kobinerji'nin rekabetçi konumlanmasını göstermektedir.
                      </p>
                    </div>
                    <div className="bg-white p-3 rounded border-l-4 border-yellow-500">
                      <h5 className="text-[9pt] font-bold text-gray-800 mb-1">4. Enerji Verimliliği Odaklı Yaklaşım</h5>
                      <p className="text-[9pt] text-gray-600 leading-tight">
                        Kobinerji'nin temel uzmanlığı enerji verimliliği ve sanayideki bu potansiyeli ortaya çıkarmaktır. Fabrikanızda yapılacak bu kontroller, sadece yasal zorunluluğu değil, aynı zamanda enerji tasarruf potansiyeli olan alanların belirlenmesine de ön ayak olacaktır, zira Kobinerji bu alanda Enerji Bakanlığı'na bağlı olarak enerji etütleri yapmaktadır.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alt Bilgi */}
                <div className="text-[9pt] text-gray-500 border-t pt-4 mb-6">
                  <p className="mb-2"><strong>Notlar:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Fiyatlara KDV dahil değildir.</li>
                    <li>Tüm hizmetler EMO dokümanlarına (ZPKK01, ZPKK03, vb.) uygun raporlanacaktır.</li>
                    <li>Kobinerji Mühendislik, MÜSİAD Enerji ve Çevre Sektör Kurulu üyesidir.</li>
                    <li>Enerji Yönetim Sistemi (ISO 50001) ve VAP konularında ayrıca destek sağlanabilir.</li>
                  </ul>
                </div>

                {/* Footer - Sayfa 2 */}
                <div className="absolute bottom-[10mm] left-[10mm] right-[10mm] text-center text-[8pt] text-gray-500 border-t pt-2">
                  <p className="font-bold text-gray-800">Kobinerji Mühendislik</p>
                  <p>www.kobinerji.com.tr • info@kobinerji.com.tr</p>
                  <p>Tel: +90 535 714 52 88 | İzmir, Türkiye</p>
                  <p className="mt-1 text-gray-400">Sayfa 2/2</p>
                </div>

                  </div>
                </div>
                {/* SAYFA 2 SONU */}

              </div>
            </div>

          </div>
        )}

        {/* Keşif Metraj Fiyat Teklifi Tab */}
        {activeTab === 'kesif' && (
          <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 border-b border-orange-800">
              <h2 className="text-lg font-bold text-white flex items-center">
                <Hammer className="mr-2 h-5 w-5"/>
                Keşif Metraj Fiyat Teklifi
              </h2>
              <p className="text-orange-100 text-xs mt-1">Elektrik malzemesi ve kablo için keşif metraj listesi oluşturun. Kablo fiyatları: Serer Kablo (İzmir)</p>
            </div>

            <form onSubmit={handleKesifSubmit} className="p-8 space-y-6">
              
              {/* Serer Kablo Bilgi Kutusu */}
              {productType === 'kablo' && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-start">
                    <Cable className="w-5 h-5 mr-2 text-purple-600 mt-0.5"/>
                    <div>
                      <h3 className="text-sm font-bold text-purple-800 mb-1">Kablo Fiyatları: Serer Kablo (İzmir)</h3>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-700">
                        <div><span className="font-semibold">Tel:</span> {KabloFiyatData.telefon}</div>
                        <div><span className="font-semibold">Web:</span> {KabloFiyatData.web}</div>
                        <div><span className="font-semibold text-red-600">⚠️ KDV Hariç</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Müşteri Bilgileri */}
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-orange-600"/>
                  Müşteri Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Firma/Kurum Adı *</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Örn: XYZ İnşaat Ltd. Şti."
                      value={kesifCustomer.name}
                      onChange={(e) => setKesifCustomer({...kesifCustomer, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Yetkili Adı Soyadı</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Ahmet Yılmaz"
                      value={kesifCustomer.contactName}
                      onChange={(e) => setKesifCustomer({...kesifCustomer, contactName: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Adres</label>
                    <input 
                      type="text" 
                      placeholder="Örn: Ankara, Çankaya"
                      value={kesifCustomer.address}
                      onChange={(e) => setKesifCustomer({...kesifCustomer, address: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Telefon</label>
                    <input 
                      type="text" 
                      placeholder="Örn: 0555 123 45 67"
                      value={kesifCustomer.phone}
                      onChange={(e) => setKesifCustomer({...kesifCustomer, phone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Hazır Paket Ekle Butonu */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200 mb-6">
                <button
                  type="button"
                  onClick={() => setShowHazirPaketModal(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-lg font-bold transition shadow-lg flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-6 h-6"/>
                  ⚡ Hazır Paket Ekle (Hızlı Teklif)
                </button>
                <p className="text-xs text-center text-gray-600 mt-2">
                  Kompanzasyon, ADP, Aydınlatma gibi hazır paketlerle hızlı teklif oluşturun
                </p>
              </div>

              {/* Ürün Tipi Seçimi */}
              <div className="bg-gradient-to-r from-orange-50 to-purple-50 p-6 rounded-lg border border-orange-200">
                <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center">
                  <Plus className="w-5 h-5 mr-2 text-orange-600"/>
                  Malzeme/Kablo Ekle
                </h3>
                
                {/* Ürün Tipi Seçimi */}
                <div className="mb-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setProductType('normal');
                      setSelectedCableForKesif(null);
                      setSelectedCategoryForKesif('');
                    }}
                    className={`px-6 py-3 rounded-lg font-semibold transition flex-1 ${
                      productType === 'normal'
                        ? 'bg-orange-600 text-white shadow-lg'
                        : 'bg-white text-gray-600 border border-gray-300 hover:border-orange-400'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 inline mr-2"/>
                    Normal Ürün/Malzeme
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProductType('kablo');
                      setSelectedProduct(null);
                      setProductSearch('');
                    }}
                    className={`px-6 py-3 rounded-lg font-semibold transition flex-1 ${
                      productType === 'kablo'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-600 border border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    <Cable className="w-4 h-4 inline mr-2"/>
                    Kablo (Serer Kablo)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProductType('hizmet');
                      setSelectedProduct(null);
                      setProductSearch('');
                      setSelectedCableForKesif(null);
                      setSelectedCategoryForKesif('');
                    }}
                    className={`px-6 py-3 rounded-lg font-semibold transition flex-1 ${
                      productType === 'hizmet'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-white text-gray-600 border border-gray-300 hover:border-green-400'
                    }`}
                  >
                    <Wrench className="w-4 h-4 inline mr-2"/>
                    Hizmet/İşçilik
                  </button>
                </div>

                {/* Normal Ürün Ekleme Formu */}
                {productType === 'normal' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="md:col-span-2 relative">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ürün Ara</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Ürün adı veya marka ile arayın..."
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                      />
                      <Search className="absolute right-3 top-3.5 h-5 w-5 text-gray-400"/>
                    </div>
                    
                    {/* Dropdown */}
                    {showProductDropdown && filteredProducts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredProducts.map((product, idx) => (
                          <div 
                            key={idx}
                            onClick={() => {
                              setSelectedProduct(product);
                              setProductSearch(product.ÜRÜN);
                              setShowProductDropdown(false);
                            }}
                            className="px-4 py-3 hover:bg-orange-50 cursor-pointer border-b border-gray-100 last:border-0"
                          >
                            <div className="font-semibold text-sm text-gray-800">{product.ÜRÜN}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">{product.MARKA}</span> • {product["BİRİM FİYAT"]} TL/{product.ÖLÇÜ}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Miktar</label>
                    <input 
                      type="number" 
                      min="0.01"
                      step="0.01"
                      placeholder="Miktar"
                      value={productQuantity}
                      onChange={(e) => setProductQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    />
                  </div>
                  
                  <div className="md:col-span-3">
                    <button 
                      type="button"
                      onClick={addProductToKesif}
                      disabled={!selectedProduct}
                      className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5 mr-2"/>
                      Listeye Ekle
                    </button>
                  </div>
                </div>
                )}

                {/* Kablo Ekleme Formu */}
                {productType === 'kablo' && (
                <div className="grid grid-cols-1 gap-4">
                  {/* Kategori Seçimi */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Kablo Kategorisi *</label>
                    <select 
                      value={selectedCategoryForKesif}
                      onChange={(e) => {
                        setSelectedCategoryForKesif(e.target.value);
                        setSelectedCableForKesif(null);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                    >
                      <option value="">-- Kategori Seçiniz --</option>
                      {KabloFiyatData.kategoriler.map((kategori) => (
                        <option key={kategori.id} value={kategori.id}>
                          {kategori.ad}
                        </option>
                      ))}
                    </select>
                    {selectedCategoryForKesif && (
                      <p className="text-xs text-gray-600 mt-1">
                        {KabloFiyatData.kategoriler.find(k => k.id === selectedCategoryForKesif)?.aciklama}
                      </p>
                    )}
                  </div>

                  {/* Kablo Seçimi */}
                  {selectedCategoryForKesif && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Kablo Tipi ve Kesit *</label>
                      <select 
                        value={selectedCableForKesif ? selectedCableForKesif.kod : ''}
                        onChange={(e) => {
                          const kategori = KabloFiyatData.kategoriler.find(k => k.id === selectedCategoryForKesif);
                          const cable = kategori?.urunler.find(u => u.kod === e.target.value);
                          setSelectedCableForKesif(cable || null);
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                      >
                        <option value="">-- Kablo Seçiniz --</option>
                        {KabloFiyatData.kategoriler
                          .find(k => k.id === selectedCategoryForKesif)
                          ?.urunler.map((urun) => (
                            <option key={urun.kod} value={urun.kod}>
                              {urun.ad} - {kesifFiyatSecimi === 'fiyat1' ? urun.fiyat1 : (urun.fiyat2 || urun.fiyat1)} TL/{urun.birim}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Fiyat Seçimi */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Fiyat Seçimi</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input 
                          type="radio" 
                          name="kesifFiyatSecimi" 
                          value="fiyat1"
                          checked={kesifFiyatSecimi === 'fiyat1'}
                          onChange={(e) => setKesifFiyatSecimi(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Fiyat 1</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="radio" 
                          name="kesifFiyatSecimi" 
                          value="fiyat2"
                          checked={kesifFiyatSecimi === 'fiyat2'}
                          onChange={(e) => setKesifFiyatSecimi(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Fiyat 2 (varsa)</span>
                      </label>
                    </div>
                  </div>

                  {/* Miktar ve Özet */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Miktar (Metre) *</label>
                      <input 
                        type="number" 
                        min="0.01"
                        step="0.01"
                        placeholder="Örn: 100"
                        value={productQuantity}
                        onChange={(e) => setProductQuantity(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                      />
                    </div>
                    
                    {selectedCableForKesif && (
                      <div className="bg-purple-100 p-4 rounded-lg flex flex-col justify-center">
                        <div className="text-xs text-gray-600">Birim Fiyat</div>
                        <div className="text-xl font-bold text-purple-700">
                          {(kesifFiyatSecimi === 'fiyat1' ? selectedCableForKesif.fiyat1 : (selectedCableForKesif.fiyat2 || selectedCableForKesif.fiyat1)).toFixed(2)} TL
                        </div>
                        <div className="text-xs text-gray-600 mt-1">Toplam: {((kesifFiyatSecimi === 'fiyat1' ? selectedCableForKesif.fiyat1 : (selectedCableForKesif.fiyat2 || selectedCableForKesif.fiyat1)) * productQuantity).toFixed(2)} TL</div>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    type="button"
                    onClick={addProductToKesif}
                    disabled={!selectedCableForKesif || productQuantity <= 0}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5 mr-2"/>
                    Listeye Ekle
                  </button>
                </div>
                )}

                {/* Hizmet/İşçilik Ekleme Formu */}
                {productType === 'hizmet' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Hizmet/İşçilik Adı *</label>
                    <input 
                      type="text" 
                      placeholder="Örn: İşçilik, Devreye Alma, Mühendislik Hizmeti"
                      value={hizmetAdi}
                      onChange={(e) => setHizmetAdi(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Birim Fiyat (TL) *</label>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        placeholder="Örn: 5000"
                        value={hizmetFiyat || ''}
                        onChange={(e) => setHizmetFiyat(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Birim</label>
                      <select
                        value={hizmetBirim}
                        onChange={(e) => setHizmetBirim(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                      >
                        <option value="Gün">Gün</option>
                        <option value="Saat">Saat</option>
                        <option value="Adet">Adet</option>
                        <option value="Takım">Takım</option>
                        <option value="Proje">Proje</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Miktar *</label>
                    <input 
                      type="number" 
                      min="0.01"
                      step="0.01"
                      placeholder="Örn: 1"
                      value={hizmetMiktar}
                      onChange={(e) => setHizmetMiktar(parseFloat(e.target.value) || 1)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Açıklama (Opsiyonel)</label>
                    <textarea 
                      rows="2"
                      placeholder="Örn: Panel devreye alma ve test"
                      value={hizmetAciklama}
                      onChange={(e) => setHizmetAciklama(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
                    />
                  </div>

                  {hizmetAdi && hizmetFiyat > 0 && hizmetMiktar > 0 && (
                    <div className="bg-green-100 p-4 rounded-lg">
                      <div className="text-xs text-gray-600">Toplam Tutar</div>
                      <div className="text-xl font-bold text-green-700">
                        {(hizmetFiyat * hizmetMiktar).toFixed(2)} TL
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {hizmetFiyat.toFixed(2)} TL × {hizmetMiktar} {hizmetBirim}
                      </div>
                    </div>
                  )}
                  
                  <button 
                    type="button"
                    onClick={addProductToKesif}
                    disabled={!hizmetAdi || hizmetFiyat <= 0 || hizmetMiktar <= 0}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition flex items-center justify-center"
                  >
                    <Plus className="w-5 h-5 mr-2"/>
                    Listeye Ekle
                  </button>
                </div>
                )}
              </div>

              {/* Ürün Listesi */}
              {kesifProducts.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 px-4 py-3 flex justify-between items-center">
                    <h3 className="text-md font-bold text-white flex items-center">
                      <FileSpreadsheet className="w-5 h-5 mr-2"/>
                      Malzeme/Kablo/Hizmet Listesi ({kesifProducts.length} kalem)
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => applyBulkPriceAdjustment(10)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold transition"
                      >
                        +10% Toplu Artış
                      </button>
                      <button 
                        type="button"
                        onClick={() => applyBulkPriceAdjustment(20)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold transition"
                      >
                        +20% Toplu Artış
                      </button>
                      <button 
                        type="button"
                        onClick={() => applyBulkPriceAdjustment(-10)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold transition"
                      >
                        -10% Toplu İndirim
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">SIRA</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">TİP</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">ÜRÜN ADI</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">DETAY</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">BİRİM FİYAT</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">MİKTAR</th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-gray-700">TOPLAM</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-gray-700">İŞLEM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kesifProducts.map((product) => (
                          <tr key={product.id} className={`border-b border-gray-200 hover:bg-gray-50 ${
                            product.type === 'kablo' ? 'bg-purple-50' : ''
                          }`}>
                            <td className="px-4 py-3 text-gray-700">{product.sira}</td>
                            <td className="px-4 py-3">
                              {product.type === 'kablo' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                                  <Cable className="w-3 h-3 mr-1"/>
                                  Kablo
                                </span>
                              ) : product.type === 'hizmet' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <Wrench className="w-3 h-3 mr-1"/>
                                  Hizmet
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                                  <FileSpreadsheet className="w-3 h-3 mr-1"/>
                                  Malzeme
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                type="text"
                                value={product.urun}
                                onChange={(e) => updateProductName(product.id, e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                type="text"
                                value={product.marka}
                                onChange={(e) => updateProductDetail(product.id, e.target.value)}
                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input 
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={product.birimFiyat}
                                onChange={(e) => updateProductPrice(product.id, parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              />
                              <span className="text-xs text-gray-500 ml-1">TL</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input 
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={product.miktar}
                                onChange={(e) => updateProductQuantity(product.id, parseFloat(e.target.value) || 0)}
                                className="w-20 px-2 py-1 text-right border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                              />
                              <span className="text-xs text-gray-500 ml-1">{product.olcu}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-800">{product.toplam.toFixed(2)} TL</td>
                            <td className="px-4 py-3 text-center">
                              <button 
                                type="button"
                                onClick={() => removeProductFromKesif(product.id)}
                                className="text-red-600 hover:text-red-800 transition"
                              >
                                <Trash2 className="w-4 h-4"/>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* İskonto ve KDV Ayarları */}
              {kesifProducts.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Percent className="w-4 h-4 mr-2 text-blue-600"/>
                      İskonto Oranı (%)
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      step="0.01"
                      value={kesifSettings.iskonto}
                      onChange={(e) => setKesifSettings({...kesifSettings, iskonto: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-lg font-semibold"
                    />
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Percent className="w-4 h-4 mr-2 text-green-600"/>
                      KDV Oranı (%)
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      step="0.01"
                      value={kesifSettings.kdvOrani}
                      onChange={(e) => setKesifSettings({...kesifSettings, kdvOrani: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition text-lg font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Özet ve Toplamlar */}
              {kesifProducts.length > 0 && (
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg border-2 border-gray-300">
                  <h3 className="text-md font-bold text-gray-800 mb-4">Teklif Özeti</h3>
                  {(() => {
                    const totals = calculateKesifTotals();
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-300">
                          <span className="text-sm font-medium text-gray-700">Ara Toplam:</span>
                          <span className="text-lg font-semibold text-gray-800">{totals.subTotal.toFixed(2)} TL</span>
                        </div>
                        {kesifSettings.iskonto > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-300">
                            <span className="text-sm font-medium text-blue-700">İskonto (% {kesifSettings.iskonto}):</span>
                            <span className="text-lg font-semibold text-blue-700">- {totals.iskontoAmount.toFixed(2)} TL</span>
                          </div>
                        )}
                        {kesifSettings.iskonto > 0 && (
                          <div className="flex justify-between items-center py-2 border-b border-gray-300">
                            <span className="text-sm font-medium text-gray-700">İskonto Sonrası:</span>
                            <span className="text-lg font-semibold text-gray-800">{totals.afterDiscount.toFixed(2)} TL</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-gray-300">
                          <span className="text-sm font-medium text-green-700">KDV (% {kesifSettings.kdvOrani}):</span>
                          <span className="text-lg font-semibold text-green-700">+ {totals.kdvAmount.toFixed(2)} TL</span>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-orange-600 text-white px-4 rounded-lg mt-4">
                          <span className="text-base font-bold">GENEL TOPLAM:</span>
                          <span className="text-2xl font-bold">{totals.grandTotal.toFixed(2)} TL</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={kesifProducts.length === 0}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white py-4 px-6 rounded-lg font-bold text-lg transition shadow-lg flex items-center justify-center"
              >
                <FileText className="w-6 h-6 mr-3"/>
                Teklif Önizlemesine Git
              </button>

            </form>
          </div>
        )}

        {/* Kablo Keşif Metraj Tab */}
        {/* Proposal View */}
        {activeTab === 'proposal' && selectedCompany && (
          <div className="flex gap-6 flex-col lg:flex-row">
            
            {/* Sidebar (No Print) */}
            <div className="lg:w-1/3 space-y-4 no-print">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                  Gemini AI Asistanı
                </h3>

                <button 
                  onClick={() => handleGeminiCall('email')}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-lg mb-3 transition shadow disabled:opacity-50"
                >
                  <Mail className="h-5 w-5" />
                  <span>✨ Teklif Sunum E-postası Yaz</span>
                </button>

                <button 
                  onClick={() => handleGeminiCall('tips')}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 rounded-lg mb-3 transition shadow disabled:opacity-50"
                >
                  <TrendingDown className="h-5 w-5" />
                  <span>✨ Sektörel Enerji İpuçları</span>
                </button>

                {aiLoading && (
                    <div className="text-center py-4 text-gray-500 text-sm animate-pulse">
                        Gemini düşünüyor...
                    </div>
                )}

                {aiOutput && (
                    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 relative group">
                        <button 
                            onClick={copyToClipboard}
                            className="absolute top-2 right-2 p-1 bg-white border rounded hover:bg-gray-100 text-gray-500 transition"
                            title="Kopyala"
                        >
                            <Copy className="h-4 w-4" />
                        </button>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
                            {aiActiveFeature === 'email' ? 'E-posta Taslağı' : 'Sektörel Tavsiyeler'}
                        </h4>
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                            {aiOutput}
                        </pre>
                    </div>
                )}
                
                {/* Export & Actions */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 mt-4">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                      <Download className="w-4 h-4 mr-2"/>
                      Export & İşlemler
                    </h3>
                    
                    {/* Editor Mode Toggle */}
                    <button 
                      onClick={toggleEditorMode}
                      className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg mb-2 transition"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>{editorMode ? '📝 Düzenleme Modundan Çık' : '✏️ Düzenleme Modu'}</span>
                    </button>
                    
                    {/* PDF Export */}
                    <button 
                      onClick={handleDownloadPDF}
                      className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg mb-2 transition"
                    >
                      <FileText className="h-4 w-4" />
                      <span>📄 PDF İndir</span>
                    </button>

                    {/* Word Export */}
                    <button 
                      onClick={handleDownloadWord}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg mb-2 transition"
                    >
                      <FileText className="h-4 w-4" />
                      <span>📝 Word İndir</span>
                    </button>

                    {/* Excel Export */}
                    <button 
                      onClick={handleExcelExport}
                      className="w-full flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg mb-2 transition"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>📊 Excel İndir</span>
                    </button>

                    {/* Email Send */}
                    <button 
                      onClick={handleSendEmail}
                      className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg mb-2 transition"
                    >
                      <Mail className="h-4 w-4" />
                      <span>📧 E-posta Gönder</span>
                    </button>

                    {/* Print */}
                    <button 
                      onClick={handlePrint}
                      className="w-full flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-800 text-white py-2.5 rounded-lg transition"
                    >
                      <Printer className="h-4 w-4" />
                      <span>🖨️ Yazdır</span>
                    </button>
                </div>

                {/* Hızlı Düzenleme */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-4">
                    <h3 className="font-bold text-blue-900 mb-2">Hızlı Düzenleme</h3>
                    
                    {/* Para Birimi Seçici */}
                    <div className="mb-3">
                      <label className="text-xs font-bold text-blue-800 uppercase">💱 Para Birimi</label>
                      <select 
                        value={currency} 
                        onChange={(e) => handleCurrencyChange(e.target.value)}
                        className="w-full mt-1 p-2 border border-blue-200 rounded text-sm font-semibold text-blue-700"
                      >
                        <option value="TRY">🇹🇷 Türk Lirası (TL)</option>
                        <option value="USD">🇺🇸 Dolar ($)</option>
                        <option value="EUR">🇪🇺 Euro (€)</option>
                      </select>
                      <p className="text-xs text-blue-600 mt-1">Tüm fiyatlar otomatik dönüştürülür</p>
                    </div>
                    
                    <div className="mb-3">
                    <label className="text-xs font-bold text-blue-800 uppercase">Özel İskonto (%)</label>
                    <input 
                        type="number" 
                        value={params.discountRate} 
                        onChange={(e) => setParams({...params, discountRate: parseFloat(e.target.value) || 0})}
                        className="w-full mt-1 p-2 border border-blue-200 rounded text-sm"
                    />
                    </div>
                </div>
              </div>
            </div>
            

            {/* Proposal Preview (A4 Paper Style) - Right Side */}
            <div className="lg:w-2/3 bg-gray-200 p-8 rounded-xl overflow-auto lg:h-[calc(100vh-200px)] flex-grow flex justify-center">
              
              {/* Editor Mode Banner */}
              {editorMode && (
                <div className="mb-4 space-y-2">
                  <div className="bg-indigo-600 text-white px-4 py-3 rounded-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <Edit3 className="w-5 h-5 mr-2"/>
                      <span className="font-semibold">Düzenleme Modu Aktif - Metinleri doğrudan düzenleyebilirsiniz</span>
                    </div>
                    <button 
                      onClick={toggleEditorMode}
                      className="bg-white text-indigo-600 px-4 py-1 rounded hover:bg-indigo-50 transition"
                    >
                      Kaydet ve Çık
                    </button>
                  </div>
                  
                  {/* Formatting Toolbar */}
                  <div className="bg-white border border-gray-300 rounded-lg p-3 flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => document.execCommand('bold')}
                      className="p-2 hover:bg-gray-100 rounded border border-gray-300"
                      title="Kalın"
                    >
                      <Bold className="w-4 h-4"/>
                    </button>
                    <button 
                      onClick={() => document.execCommand('italic')}
                      className="p-2 hover:bg-gray-100 rounded border border-gray-300"
                      title="İtalik"
                    >
                      <Italic className="w-4 h-4"/>
                    </button>
                    <button 
                      onClick={() => document.execCommand('underline')}
                      className="p-2 hover:bg-gray-100 rounded border border-gray-300"
                      title="Altı Çizili"
                    >
                      <Type className="w-4 h-4"/>
                    </button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <select 
                      onChange={(e) => document.execCommand('fontSize', false, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Yazı Boyutu</option>
                      <option value="1">Çok Küçük</option>
                      <option value="2">Küçük</option>
                      <option value="3">Normal</option>
                      <option value="4">Büyük</option>
                      <option value="5">Çok Büyük</option>
                      <option value="6">Dev</option>
                    </select>
                    <select 
                      onChange={(e) => document.execCommand('foreColor', false, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Renk</option>
                      <option value="#000000">Siyah</option>
                      <option value="#1E3A8A">Mavi</option>
                      <option value="#DC2626">Kırmızı</option>
                      <option value="#059669">Yeşil</option>
                      <option value="#D97706">Turuncu</option>
                    </select>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <button 
                      onClick={() => document.execCommand('justifyLeft')}
                      className="p-2 hover:bg-gray-100 rounded border border-gray-300"
                      title="Sola Hizala"
                    >
                      <AlignLeft className="w-4 h-4"/>
                    </button>
                    <button 
                      onClick={() => document.execCommand('justifyCenter')}
                      className="p-2 hover:bg-gray-100 rounded border border-gray-300"
                      title="Ortala"
                    >
                      <AlignCenter className="w-4 h-4"/>
                    </button>
                    <button 
                      onClick={() => document.execCommand('justifyRight')}
                      className="p-2 hover:bg-gray-100 rounded border border-gray-300"
                      title="Sağa Hizala"
                    >
                      <AlignRight className="w-4 h-4"/>
                    </button>
                  </div>
                </div>
              )}
              
              {/* A4 Paper Structure (Yazdırılacak Alan) */}
              <div 
                id="printable-paper"
                contentEditable={editorMode}
                suppressContentEditableWarning={true}
                className={editorMode ? 'outline-2 outline-dashed outline-indigo-400' : ''}
                style={editorMode ? { minHeight: '297mm' } : {}}
              >
                  
                  {/* KEŞİF METRAJ TEKLİF - Conditional Render */}
                  {selectedCompany.type === 'kesif' ? (
                    <>
                      {(() => {
                        const products = selectedCompany.products;
                        const itemsPerPage = 8;
                        const totalPages = Math.ceil(products.length / itemsPerPage);
                        
                        return Array.from({ length: totalPages }, (_, pageIndex) => {
                          const startIdx = pageIndex * itemsPerPage;
                          const endIdx = Math.min(startIdx + itemsPerPage, products.length);
                          const pageProducts = products.slice(startIdx, endIdx);
                          const isLastPage = pageIndex === totalPages - 1;
                          
                          return (
                            <div key={pageIndex} className="bg-white max-w-[210mm] mx-auto min-h-[297mm] p-[10mm] pb-[35mm] shadow-2xl relative text-[10pt] leading-tight text-gray-800 pdf-page" style={{pageBreakAfter: isLastPage ? 'auto' : 'always', pageBreakInside: 'avoid'}}>
                              <div>
                                {/* Header */}
                                <div className="flex justify-between items-start mb-6 border-b border-gray-300 pb-4">
                                  <div className="w-1/3 flex items-start">
                                    <img src="/fatura_logo.png" alt="Kobinerji Logo" className="h-24 max-w-[210px] object-contain" />
                                  </div>
                                  <div className="text-right">
                                    <h1 className="text-xl font-bold text-orange-700 tracking-wide uppercase">
                                      KEŞİF METRAJ FİYAT TEKLİFİ
                                    </h1>
                                    <p className="text-[9pt] text-gray-500 mt-2">Referans No: KM-{new Date().getTime().toString().slice(-6)}</p>
                                    <p className="text-[9pt] text-gray-600 mt-0.5">{selectedCompany.date}</p>
                                  </div>
                                </div>

                                {/* Müşteri Bilgileri - Sadece İlk Sayfa */}
                                {pageIndex === 0 && (
                                  <>
                                    <div className="mb-6 bg-orange-50 p-4 rounded-lg border border-orange-200">
                                      <h3 className="text-[10pt] font-bold text-orange-800 mb-3 uppercase tracking-wide">Müşteri Bilgileri</h3>
                                      <div className="grid grid-cols-2 gap-3 text-[9pt]">
                                        <div><strong>Firma/Kurum:</strong> {selectedCompany.name}</div>
                                        {selectedCompany.contactName && <div><strong>Yetkili:</strong> {selectedCompany.contactName}</div>}
                                        {selectedCompany.address && <div><strong>Adres:</strong> {selectedCompany.address}</div>}
                                        {selectedCompany.phone && <div><strong>Telefon:</strong> {selectedCompany.phone}</div>}
                                      </div>
                                    </div>

                                    <p className="mb-4 text-[9.5pt] leading-tight">
                                      <strong>Sayın {selectedCompany.contactName ? `${selectedCompany.contactName} - ` : ''}{selectedCompany.name} Yetkilisi,</strong>
                                    </p>
                                    <p className="mb-6 text-justify text-[9.5pt] leading-tight">
                                      Talep ettiğiniz elektrik malzemeleri ve kablolarına ilişkin keşif metraj fiyat teklifimiz aşağıda detaylandırılmıştır. 
                                      Tüm fiyatlar güncel piyasa koşulları göz önünde bulundurularak hazırlanmıştır.
                                    </p>
                                  </>
                                )}

                                {/* Ürün Tablosu */}
                                <h3 className="text-[10pt] font-bold text-gray-800 mb-3 uppercase tracking-wide">
                                  {pageIndex === 0 ? 'Malzeme Listesi ve Fiyatlandırma' : 'Malzeme Listesi (Devam)'}
                                </h3>
                                <div className="overflow-x-auto mb-6">
                                  <table className="w-full text-[8pt] border-collapse border border-gray-300">
                                    <thead style={{backgroundColor: '#fb8c00'}}>
                                      <tr>
                                        <th className="border border-gray-300 p-2 text-center text-white font-semibold">SIRA</th>
                                        <th className="border border-gray-300 p-2 text-left text-white font-semibold">TİP</th>
                                        <th className="border border-gray-300 p-2 text-left text-white font-semibold">ÜRÜN/KABLO ADI</th>
                                        <th className="border border-gray-300 p-2 text-left text-white font-semibold">DETAY/KESİT</th>
                                        <th className="border border-gray-300 p-2 text-right text-white font-semibold">BİRİM FİYAT</th>
                                        <th className="border border-gray-300 p-2 text-right text-white font-semibold">MİKTAR</th>
                                        <th className="border border-gray-300 p-2 text-center text-white font-semibold">ÖLÇÜ</th>
                                        <th className="border border-gray-300 p-2 text-right text-white font-semibold">TOPLAM (TL)</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {pageProducts.map((product, idx) => (
                                        <tr key={product.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                          <td className="border border-gray-300 p-2 text-center">{product.sira}</td>
                                          <td className="border border-gray-300 p-2 text-center">
                                            {product.type === 'kablo' ? (
                                              <span className="text-[7pt] font-semibold text-purple-700">KABLO</span>
                                            ) : (
                                              <span className="text-[7pt] font-semibold text-orange-700">MALZEME</span>
                                            )}
                                          </td>
                                          <td className="border border-gray-300 p-2">{product.urun}</td>
                                          <td className="border border-gray-300 p-2 text-gray-600">{product.marka}</td>
                                          <td className="border border-gray-300 p-2 text-right">{product.birimFiyat.toFixed(2)} TL</td>
                                          <td className="border border-gray-300 p-2 text-right font-semibold">{product.miktar}</td>
                                          <td className="border border-gray-300 p-2 text-center">{product.olcu}</td>
                                          <td className="border border-gray-300 p-2 text-right font-semibold">{product.toplam.toFixed(2)} TL</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Özet Tablo ve Şartlar - Sadece Son Sayfa */}
                                {isLastPage && (
                                  <>
                                    <div className="flex justify-end mb-6">
                                      <div className="w-1/2 bg-gray-50 border border-gray-300 rounded-lg overflow-hidden">
                                        <table className="w-full text-[9pt]">
                                          <tbody>
                                            <tr className="border-b border-gray-300">
                                              <td className="p-3 font-semibold">Ara Toplam:</td>
                                              <td className="p-3 text-right font-bold">{selectedCompany.totals.subTotal.toFixed(2)} TL</td>
                                            </tr>
                                            {selectedCompany.settings.iskonto > 0 && (
                                              <tr className="border-b border-gray-300 bg-blue-50">
                                                <td className="p-3 font-semibold text-blue-700">İskonto (% {selectedCompany.settings.iskonto}):</td>
                                                <td className="p-3 text-right font-bold text-blue-700">- {selectedCompany.totals.iskontoAmount.toFixed(2)} TL</td>
                                              </tr>
                                            )}
                                            {selectedCompany.settings.iskonto > 0 && (
                                              <tr className="border-b border-gray-300">
                                                <td className="p-3 font-semibold">İskonto Sonrası:</td>
                                                <td className="p-3 text-right font-bold">{selectedCompany.totals.afterDiscount.toFixed(2)} TL</td>
                                              </tr>
                                            )}
                                            <tr className="border-b border-gray-300 bg-green-50">
                                              <td className="p-3 font-semibold text-green-700">KDV (% {selectedCompany.settings.kdvOrani}):</td>
                                              <td className="p-3 text-right font-bold text-green-700">+ {selectedCompany.totals.kdvAmount.toFixed(2)} TL</td>
                                            </tr>
                                            <tr className="bg-orange-600 text-white">
                                              <td className="p-4 font-bold text-lg">GENEL TOPLAM:</td>
                                              <td className="p-4 text-right font-bold text-xl">{selectedCompany.totals.grandTotal.toFixed(2)} TL</td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>

                                    <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                      <h3 className="text-[10pt] font-bold text-gray-800 mb-3">Genel Şartlar ve Notlar</h3>
                                      <ul className="list-disc list-inside text-[9pt] leading-relaxed space-y-2">
                                        <li>Teklif geçerlilik süresi: 15 gündür.</li>
                                        <li>Fiyatlara KDV dahil edilmiştir.</li>
                                        <li>Teslimat süresi: Sipariş onayından sonra 7-10 iş günüdür.</li>
                                        <li>Ödeme şartları: Görüşülerek belirlenecektir.</li>
                                        <li>Fiyatlar hammadde ve döviz kurundaki değişikliklere bağlı olarak revize edilebilir.</li>
                                        <li>Malzemeler kaliteli ve orijinaldir, gerekli belge ve sertifikalarla birlikte teslim edilir.</li>
                                      </ul>
                                    </div>
                                  </>
                                )}

                              </div>

                              {/* Footer */}
                              <div className="absolute bottom-[15mm] left-[10mm] right-[10mm] border-t border-gray-300 pt-3 text-[8pt] text-gray-600 flex justify-between items-center">
                                <div>
                                  <p className="font-semibold">Kobinerji Mühendislik</p>
                                  <p>www.kobinerji.com.tr • info@kobinerji.com.tr</p>
                                </div>
                                <div className="text-right">
                                  <p>Tel: +90 535 714 52 88</p>
                                  <p>İzmir, Türkiye</p>
                                  <p className="text-gray-400 mt-1">Sayfa {pageIndex + 1}/{totalPages}</p>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </>
                  ) : (
                    <>
                  {/* SAYFA 1 - YG İŞLETME SORUMLULUĞU */}
                  <div className="bg-white max-w-[210mm] mx-auto min-h-[297mm] p-[10mm] pb-[35mm] shadow-2xl relative text-[10pt] leading-tight text-gray-800 pdf-page" style={{pageBreakAfter: 'always', pageBreakInside: 'avoid'}}>
                    <div>
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6 border-b border-gray-300 pb-4">
                            {/* Top Left Logo */}
                            <div className="w-1/3 flex items-start">
                                <img src="/fatura_logo.png" alt="Kobinerji Logo" className="h-24 max-w-[210px] object-contain" />
                            </div>
                            <div className="text-right">
                                <h1 className="text-lg font-bold text-gray-800 tracking-wide uppercase">FİYAT TEKLİFİ</h1>
                                <p className="text-[9pt] text-gray-500 mt-2">Referans No: {selectedCompany.refNo}</p>
                                <p className="text-[9pt] text-gray-600 mt-0.5">{new Date().toLocaleDateString('tr-TR', {day: '2-digit', month: 'long', year: 'numeric'})}</p>
                            </div>
                        </div>

                        {/* Body Content */}
                        <p className="mb-4 text-[9.5pt] leading-tight">
                          <strong>Sayın {selectedCompany.contactName ? `${selectedCompany.contactName} - ` : ''}{selectedCompany.name} Yetkilisi,</strong>
                        </p>
                    <p className="mb-4 text-justify text-[9.5pt] leading-tight">
                      Tesisinize yönelik <strong>YG İşletme Sorumluluğu</strong> hizmeti fiyat teklifi, talep ettiğiniz trafo kurulu gücü ve 
                      TMMOB Elektrik Mühendisleri Odası'nın (EMO) {params.year} yılı Ücret Tanımları (KISIM III) esas alınarak, 
                      rekabetçi piyasa koşulları doğrultusunda önceki tekliflerimizde uyguladığımız indirim oranıyla aşağıda sunulmuştur.
                    </p>

                    <h3 className="text-[10pt] font-bold text-gray-800 mt-5 mb-2 uppercase tracking-wide">1. Tesis Bilgileri ve Toplam Kurulu Güç</h3>
                    <p className="mb-2 text-[9.5pt] leading-tight">Tesisinizde bulunan transformatörlerin toplam kurulu gücü (Yüksek Gerilim Tesisleri) aşağıdaki gibidir:</p>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-3">
                      <ul className="list-disc list-inside text-[9.5pt] leading-tight">
                        <li>Trafo Güçleri Dağılımı: <strong>{selectedCompany.powerStr} kVA</strong></li>
                        <li>Toplam Kurulu Güç: <strong>{selectedCompany.totalKVA} kVA ({(selectedCompany.totalKVA / 1000).toFixed(2)} MVA)</strong></li>
                        <li>Tesis Tipi: <strong>{selectedCompany.type === 'direk' ? 'Direk Tipi Trafo Merkezi' : 'Bina Tipi Trafo Merkezi'}</strong></li>
                        <li>Bölge/Katsayı: <strong>{selectedCompany.region || 'Belirtilmemiş'} (x{selectedCompany.regionCoeff.toFixed(2)})</strong></li>
                        <li>Sektör: <strong>{selectedCompany.sector}</strong></li>
                      </ul>
                    </div>

                    <h3 className="text-[10pt] font-bold text-gray-800 mt-5 mb-2 uppercase tracking-wide">2. EMO {params.year} Yılı Aylık Asgari Ücret Hesaplaması</h3>
                    <p className="mb-2 text-[9.5pt] leading-tight">EMO {params.year} Yılı Ücret Tanımları'nda (Kısım III), bina ve direk tipi trafo merkezleri için aylık işletme sorumluluğu bedelleri kapasiteye göre belirlenmektedir.</p>
                    
                    <table className="w-full text-[9pt] border-collapse border border-gray-300 mb-3">
                      <thead style={{backgroundColor: '#bbdefb'}}>
                        <tr>
                          <th className="border border-gray-300 p-2 text-left font-semibold text-[9pt]" style={{color: '#1565c0'}}>Kapasite Aralığı</th>
                          <th className="border border-gray-300 p-2 text-left font-semibold text-[9pt]" style={{color: '#1565c0'}}>Birim Fiyat</th>
                          <th className="border border-gray-300 p-2 text-right font-semibold text-[9pt]" style={{color: '#1565c0'}}>Tutar (TL)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* BİNA TİPİ GÖSTERİMİ */}
                        {selectedCompany.type !== 'direk' && selectedCompany.totalKVA >= 400 && (
                          <>
                            <tr>
                              <td className="border border-gray-300 p-2">İlk 400 kVA (Sabit)</td>
                              <td className="border border-gray-300 p-2">{formatCurrency(params.baseFee)}</td>
                              <td className="border border-gray-300 p-2 text-right">{formatCurrency(params.baseFee)}</td>
                            </tr>
                            {selectedCompany.totalKVA > 400 && selectedCompany.totalKVA <= 5000 && (
                              <tr>
                                <td className="border border-gray-300 p-2">401 - {selectedCompany.totalKVA} kVA Arası (Artan)</td>
                                <td className="border border-gray-300 p-2">{params.rate1} TL/kVA</td>
                                <td className="border border-gray-300 p-2 text-right">
                                  {formatCurrency((selectedCompany.totalKVA - 400) * params.rate1)}
                                </td>
                              </tr>
                            )}
                            {selectedCompany.totalKVA > 5000 && (
                              <>
                              <tr>
                                <td className="border border-gray-300 p-2">401 - 5000 kVA Arası (Artan)</td>
                                <td className="border border-gray-300 p-2">{params.rate1} TL/kVA</td>
                                <td className="border border-gray-300 p-2 text-right">
                                  {formatCurrency(4600 * params.rate1)}
                                </td>
                              </tr>
                              <tr>
                                <td className="border border-gray-300 p-2">5000 kVA Üzeri (Artan)</td>
                                <td className="border border-gray-300 p-2">{params.rate2} TL/kVA</td>
                                <td className="border border-gray-300 p-2 text-right">
                                  {formatCurrency((selectedCompany.totalKVA - 5000) * params.rate2)}
                                </td>
                              </tr>
                              </>
                            )}
                          </>
                        )}

                        {/* DİREK TİPİ VEYA <400 BİNA GÖSTERİMİ */}
                        {(selectedCompany.type === 'direk' || (selectedCompany.type === 'bina' && selectedCompany.totalKVA < 400)) && (
                          <tr>
                              <td className="border border-gray-300 p-2">
                                  {selectedCompany.totalKVA <= 50 ? '0-50 kVA' : 
                                  selectedCompany.totalKVA <= 160 ? '51-160 kVA' : '161-400 kVA'} Sabit Bedel
                              </td>
                              <td className="border border-gray-300 p-2">Sabit</td>
                              <td className="border border-gray-300 p-2 text-right">
                                  {formatCurrency(selectedCompany.nominalFee / (selectedCompany.regionCoeff || 1))}
                              </td>
                          </tr>
                        )}
                        
                        {(selectedCompany.regionCoeff || params.regionCoeff) !== 1 && (
                          <tr style={{backgroundColor: '#d4f5d4'}}>
                            <td className="border border-gray-300 p-2" colSpan="2">Bölgesel Azaltma Katsayısı (x {(selectedCompany.regionCoeff || params.regionCoeff)})</td>
                            <td className="border border-gray-300 p-2 text-right font-bold" style={{color: '#2e7d32'}}>
                                {(selectedCompany.regionCoeff || params.regionCoeff) < 1 ? '-' : '+'}{formatCurrency(Math.abs(selectedCompany.nominalFee - (selectedCompany.nominalFee / (selectedCompany.regionCoeff || params.regionCoeff))))}
                            </td>
                          </tr>
                        )}

                        <tr className="font-bold" style={{backgroundColor: '#c8f0c8'}}>
                          <td className="border border-gray-300 p-2" colSpan="2">EMO {params.year} TOPLAM NOMİNAL TARİFE (KDV Hariç)</td>
                          <td className="border border-gray-300 p-2 text-right">{formatCurrency(selectedCompany.nominalFee)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <h3 className="text-[10pt] font-bold text-gray-800 mt-5 mb-2 uppercase tracking-wide">3. Uygulanan İskonto ve Nihai Teklif</h3>
                    <p className="mb-4 text-[9.5pt] leading-tight">Piyasa koşullarına uyum sağlamak amacıyla, işletmenize özel <strong>%{selectedCompany.appliedDiscountRate || params.discountRate}</strong> iskonto uygulanmıştır.</p>
                    
                    <div className="rounded p-4 border-2 mb-1" style={{backgroundColor: '#c8e6c9', borderColor: '#81c784'}}>
                      <div className="flex justify-between items-center mb-1.5 text-[9.5pt]" style={{color: '#2e7d32'}}>
                        <span>EMO Nominal Tarife:</span>
                        <span>{formatCurrency(selectedCompany.nominalFee)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3 text-[9.5pt]" style={{color: '#2e7d32'}}>
                        <span>İskonto Tutarı (%{selectedCompany.appliedDiscountRate || params.discountRate}):</span>
                        <span>- {formatCurrency(selectedCompany.discountAmount)}</span>
                      </div>
                      <div className="pt-3 flex justify-between items-center text-[11pt] font-bold" style={{borderTop: '1px solid #66bb6a', color: '#1b5e20'}}>
                        <span>AYLIK TEKLİF FİYATI:</span>
                        <span>{formatCurrency(selectedCompany.offerPrice)} + KDV</span>
                      </div>
                    </div>

                    <div className="text-[9pt] text-gray-600 border-t pt-1 mt-0" style={{pageBreakInside: 'avoid'}}>
                      <h4 className="font-bold mb-1 text-[9.5pt]">Açıklamalar:</h4>
                      <ul className="list-disc list-inside space-y-0.5 text-[9pt] leading-tight">
                        <li>1. Bu teklif {params.year} yılı boyunca geçerli olmak üzere aylık periyotlarla hazırlanmıştır.</li>
                        <li>2. İşletme sorumluluğu hizmetinin SMM tarafından üstlenilmesi halinde YG tesisi en az ayda bir kez denetlenmelidir.</li>
                        <li>3. Enerji tüketiminin izlenmesi ve kompanzasyon tesisinin sağlıklı çalışıp çalışmadığının denetlenmesi bu hizmetin SORUMLULUK KAPSAMINDADIR.</li>
                        <li>4. EMO tarafından hazırlanan Elektrik Yüksek Gerilim Tesisleri İşletme Sorumluluğu Yönetmeliği bu sözleşmenin ayrılmaz bir parçasıdır. YG İşletme Sorumluluğunu üstlenecek mühendisin EMO tarafından verilen YGTİS belgesine sahip olması gerekir.</li>
                        <li>5. İşveren olarak sizin yükümlülüğünüz, İşletme Sorumlusunun görevlerini yerine getirebilmesi için gerekli imalatları/hizmetleri sağlamak, talep edilen güvenlik malzemelerini almak ve uyarılarına riayet etmektir.</li>
                      </ul>
                    </div>
                    </div>
                  </div>
                  
                  {/* SAYFA 2 - Ücretsiz Ek Hizmetler */}
                  <div className="bg-white max-w-[210mm] mx-auto min-h-[297mm] p-[10mm] pb-[35mm] shadow-2xl relative text-[9.5pt] leading-tight text-gray-800 page-break pdf-page" style={{pageBreakBefore: 'always', pageBreakInside: 'avoid', pageBreakAfter: 'auto'}}>
                    <div>
                      <div className="flex justify-between items-start mb-6 border-b border-gray-300 pb-4">
                            {/* Page 2 Header - Logo */}
                            <div className="w-1/3 flex items-start">
                              <img src="/fatura_logo.png" alt="Kobinerji Logo" className="h-24 max-w-[210px] object-contain" />
                            </div>
                            <div className="text-right">
                            </div>
                      </div>

                      <h3 className="text-[10pt] font-bold text-gray-800 mb-2 uppercase tracking-wide border-b border-gray-300 pb-2">Kobinerji Mühendislik İçin Artı Değer Katacak Ücretsiz Hizmetler</h3>
                      <p className="mb-3 text-justify text-[9.5pt] leading-tight">
                        YG İşletme Sorumluluğu hizmeti kapsamında enerji tüketiminin izlenmesi ve kompanzasyon tesisinin sağlıklı çalışıp çalışmadığının denetlenmesi sorumluğunuzun dışında tutulmuştur. Ancak, Kobinerji Mühendislik olarak satın alma birimi için maliyet kontrolü ve operasyonel güvenliği artıracak bu kritik alanlarda ücretsiz ek hizmetler sunabiliriz:
                      </p>

                      <div className="space-y-2 pb-8">
                          <div className="bg-gray-50 p-2.5 rounded border-l-2 border-gray-400">
                            <h4 className="font-bold text-gray-800 text-[9.5pt] mb-1">1. Arıza Önleme Odaklı Termal Görüntüleme</h4>
                            <p className="text-[9pt] text-gray-600 mb-0.5 leading-tight">
                              Üretim sürekliliğinin kritik olduğu büyük tesislerde, YG tesisatında (trafolar, OG hücreleri ve bara bağlantıları) meydana gelebilecek gevşek bağlantılar, aşırı ısınmaya ve ciddi arızalara neden olabilir.
                            </p>
                            <ul className="list-disc list-inside text-[9pt] text-gray-600 pl-2 space-y-0.5 leading-tight">
                              <li><strong>Ücretsiz Hizmet:</strong> Yıl içinde 12 kez (Örneğin aylık periyotlarla) transformatörlerin ve yüksek gerilim hücrelerinin termal kamera ile kontrol edilmesi ve bu kontrollerin raporlanması.</li>
                              <li><strong>Artı Değer:</strong> Bu denetim, YG ekipmanlarında arıza potansiyeli olan aşırı ısınmaları ve kontak gevşekliklerini (seri ark) erkenden belirleyerek, üretim kesintisi kaynaklı büyük ekonomik kayıpların önüne geçer.</li>
                            </ul>
                          </div>

                          <div className="bg-gray-50 p-2.5 rounded border-l-2 border-gray-400">
                            <h4 className="font-bold text-gray-800 text-[9.5pt] mb-1">2. Reaktif Güç ve Enerji Kalitesi Takibi</h4>
                            <p className="text-[9pt] text-gray-600 mb-0.5 leading-tight">
                              Yüksek enerji tüketicisi olan sanayi firmaları için reaktif güç cezaları önemli bir maliyet kalemidir. EMO yönetmelikleri bu takibi kapsamaz.
                            </p>
                            <ul className="list-disc list-inside text-[9pt] text-gray-600 pl-2 space-y-0.5 leading-tight">
                              <li><strong>Ücretsiz Hizmet:</strong> Tesisin reaktif güç durumunun ve güç faktörünün (PF) uzaktan izlenmesi ve çeyreklik dönemlerde (her ayda bir) kompanzasyon sisteminin durumu ve olası ceza riskleri hakkında özet rapor sunulması.</li>
                              <li><strong>Artı Değer:</strong> Yasal sınırların (genellikle 0.95 seviyesine yakın) dışına çıkılmasını önleyerek, yüksek kompanzasyon cezası riskini ortadan kaldırmaya yardımcı olur ve görünür güç talebini iyileştirir.</li>
                            </ul>
                          </div>

                          <div className="bg-gray-50 p-2.5 rounded border-l-2 border-gray-400">
                            <h4 className="font-bold text-gray-800 text-[9.5pt] mb-1">3. Enerji Verimliliği ve Sürdürülebilirlik Ön Analizi</h4>
                            <p className="text-[9pt] text-gray-600 mb-0.5 leading-tight">
                              Büyük firmalar GES ve enerji verimliliği (IE3/IE4 motorlar, VSD uygulamaları) konusunda aktif yatırımlar yapmaktadır.
                            </p>
                            <ul className="list-disc list-inside text-[9pt] text-gray-600 pl-2 space-y-0.5 leading-tight">
                              <li><strong>Ücretsiz Hizmet:</strong> Tesisinizdeki enerji yoğun alanların (fanlar, pompalar, motorlar) ön analizi ve Yüksek Verimli Motorlar (IE3/IE4/IE5) veya Değişken Hızlı Sürücü (VSD) kullanım potansiyelinin belirlenmesi için başlangıç danışmanlığı.</li>
                              <li><strong>Artı Değer:</strong> Enerji (kW) tüketimini ve karbon ayak izini azaltma hedeflerine ulaşılmasına yardımcı olurken, aynı zamanda motorların daha iyi güç faktörleri (PF) ile çalışmasını sağlayarak trafo üzerindeki reaktif yükü azaltır ve kapasiteyi daha etkin kullanır.</li>
                            </ul>
                          </div>

                          <div className="bg-gray-50 p-2.5 rounded border-l-2 border-gray-400">
                            <h4 className="font-bold text-gray-800 text-[9.5pt] mb-1">4. Yedek Malzeme ve Kritik Stok Listesi Danışmanlığı</h4>
                            <p className="text-[9pt] text-gray-600 mb-0.5 leading-tight">
                              Gıda sanayinde kritik arızalara hızlı müdahale esastır. Yedek parça yönetimi, arıza süresini (downtime) doğrudan etkiler.
                            </p>
                            <ul className="list-disc list-inside text-[9pt] text-gray-600 pl-2 space-y-0.5 leading-tight">
                              <li><strong>Ücretsiz Hizmet:</strong> Tesisinizdeki YG ve AG kritik ekipmanlar (trafo buşingleri, parafudr, sekonder koruma röleleri, OG hücre mekanizmaları vb.) için risk ve tedarik sürelerine dayalı acil durum yedek parça listesi ve önerilen minimum stok seviyelerinin belirlenmesi konusunda danışmanlık sağlanması.</li>
                              <li><strong>Artı Değer:</strong> Arıza durumunda gerekli yedek parçaların hızlı teminini sağlayarak arıza onarım süresini (MTTR) minimize eder ve işletme sürekliliğini destekler.</li>
                            </ul>
                          </div>
                      </div>
                      
                      <p className="mt-2 mb-16 text-[9pt] italic text-gray-600 border-t border-gray-300 pt-2 leading-tight">
                        Bu ücretsiz ek hizmetler, Kobinerji Mühendislik'in sadece yasal zorunlulukları karşılayan bir tedarikçi değil, aynı zamanda maliyet optimizasyonuna ve operasyonel güvenliğe odaklanan stratejik bir çözüm ortağı olduğunu göstermektedir.
                      </p>
                    </div>

                    {/* Footer - Page 2 - Always at bottom */}
                    <div className="absolute bottom-[10mm] left-[10mm] right-[10mm] border-t border-gray-300 pt-2" style={{pageBreakInside: 'avoid'}}>
                        <div className="flex justify-between items-end">
                            {/* Bottom Left Logo/Antet */}
                            <div className="w-2/3">
                                <div className="text-[9pt] text-gray-600">
                                    <p className="font-bold text-gray-800 text-[9.5pt]">KOBİNERJİ MÜHENDİSLİK</p>
                                    <p className="text-[9pt] mt-0.5">Kemalpaşa O.S.B. Gazi Bulv. Ceran Plaza No:177/19 35170 Kemalpaşa / İzmir</p>
                                    <p className="text-[9pt]">Tel: +90 535 714 52 88 | www.kobinerji.com</p>
                                </div>
                            </div>
                            {/* Bottom Right - Page Number */}
                            <div className="text-right">
                                <p className="text-[9pt] text-gray-500">Sayfa 2/2</p>
                            </div>
                        </div>
                    </div>
                  </div>
                  </>
                  )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Hazır Paket Modal */}
      {showHazirPaketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-yellow-300"/>
                <h2 className="text-xl font-bold text-white">Hazır Paket Seçimi - Hızlı Teklif</h2>
              </div>
              <button
                onClick={() => {
                  setShowHazirPaketModal(false);
                  setSelectedHazirPaket(null);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
              >
                <X className="w-6 h-6"/>
              </button>
            </div>

            {/* Kar Marjı Ayarı */}
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-green-600"/>
                  <label className="text-sm font-semibold text-gray-700">Kar Marjı (%)</label>
                </div>
                <div className="flex items-center gap-4">
                  <input 
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={paketKarMarji}
                    onChange={(e) => setPaketKarMarji(parseInt(e.target.value))}
                    className="w-48"
                  />
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={paketKarMarji}
                    onChange={(e) => setPaketKarMarji(parseInt(e.target.value) || 30)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-green-700"
                  />
                  <span className="text-sm text-gray-600">Alış fiyatlarına %{paketKarMarji} kar eklenir</span>
                </div>
              </div>
            </div>

            {/* Paket Listesi */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {HazirPaketler.paketler.map((paket) => (
                  <div
                    key={paket.id}
                    onClick={() => setSelectedHazirPaket(paket.id)}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition transform hover:scale-105 ${
                      selectedHazirPaket === paket.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-gray-800 text-sm">{paket.ad}</h3>
                      {selectedHazirPaket === paket.id && (
                        <CheckCircle className="w-5 h-5 text-blue-600"/>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{paket.kategori}</p>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{paket.aciklama}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <FileSpreadsheet className="w-4 h-4"/>
                      <span className="font-semibold">{paket.urunler.length} kalem ürün</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seçili Paket Detayları */}
            {selectedHazirPaket && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 mb-3">
                  📋 {HazirPaketler.paketler.find(p => p.id === selectedHazirPaket)?.ad} - Ürün Listesi
                </h3>
                <div className="max-h-48 overflow-y-auto bg-white rounded-lg border border-gray-200 p-3">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left">Ürün</th>
                        <th className="px-2 py-1 text-center">Miktar</th>
                        <th className="px-2 py-1 text-left">Açıklama</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HazirPaketler.paketler
                        .find(p => p.id === selectedHazirPaket)
                        ?.urunler.map((urun, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="px-2 py-2 font-medium">{urun.urun}</td>
                            <td className="px-2 py-2 text-center">{urun.miktar} {urun.birim}</td>
                            <td className="px-2 py-2 text-gray-600">{urun.aciklama}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-100 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-800">{HazirPaketler.paketler.length}</span> farklı hazır paket mevcut
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowHazirPaketModal(false);
                    setSelectedHazirPaket(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-200 transition"
                >
                  İptal
                </button>
                <button
                  onClick={addHazirPaketToKesif}
                  disabled={!selectedHazirPaket}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition flex items-center gap-2"
                >
                  <Plus className="w-5 h-5"/>
                  Paketi Listeye Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
