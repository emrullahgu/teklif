import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit3, Trash2, Save, X, Download, FileDown, 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, 
  Calendar, BarChart3, PieChart, Activity, Upload, 
  Image as ImageIcon, Loader2, Minus, FileSpreadsheet, LineChart 
} from 'lucide-react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart as RechartsBar, Bar } from 'recharts';

export default function HaftalikRaporlama() {
  const [raporlar, setRaporlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [selectedRapor, setSelectedRapor] = useState(null);
  const [showGrafikModal, setShowGrafikModal] = useState(false);

  const [formData, setFormData] = useState({
    fabrika_adi: '',
    hafta_baslangic: '',
    hafta_bitis: '',
    guc_faktoru: '',
    reaktif_guc: '',
    aktif_guc: '',
    kompanzasyon_durumu: '',
    enerji_tuketimi: '',
    maliyet: '',
    onceki_hafta_guc_faktoru: '',
    hedef_guc_faktoru: '0.95',
    notlar: '',
    gorsel_url: ''
  });
  
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);
  const excelInputRefAktif = useRef(null);
  const excelInputRefEnduktif = useRef(null);
  const excelInputRefKapasitif = useRef(null);

  // 3 Ayrı Excel Import State'leri
  const [excelDataAktif, setExcelDataAktif] = useState([]);
  const [excelDataEnduktif, setExcelDataEnduktif] = useState([]);
  const [excelDataKapasitif, setExcelDataKapasitif] = useState([]);

  // OSOS Özet Tablosu State'leri
  const [ososOzetTablosu, setOsosOzetTablosu] = useState([]);
  const [showOsosTableInput, setShowOsosTableInput] = useState(false);
  const [ososTableText, setOsosTableText] = useState('');

  // İlk Kayıt ve Hesaplama State'leri
  const [ilkKayit, setIlkKayit] = useState(false);
  const [autoCalculateCosPhi, setAutoCalculateCosPhi] = useState(false);

  // PDF Düzenleme Modu
  const [pdfEditMode, setPdfEditMode] = useState(false);
  const [editedPdfData, setEditedPdfData] = useState(null);

  // Filtreleme State'leri
  const [filtreFabrika, setFiltreFabrika] = useState('');
  const [filtreTarihBaslangic, setFiltreTarihBaslangic] = useState('');
  const [filtreTarihBitis, setFiltreTarihBitis] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('haftalik_raporlar')
        .select('*')
        .order('hafta_baslangic', { ascending: false });
      
      if (error) throw error;
      setRaporlar(data || []);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      // alert('Veriler yüklenirken hata oluştu: ' + error.message); // Hata mesajını production'da gizleyebilirsiniz
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result);
      setFormData({ ...formData, gorsel_url: reader.result });
    };
    reader.readAsDataURL(file);
  };

  // Güç faktörü hesaplama fonksiyonu (P ve Q'dan cos φ hesapla)
  const calculateCosPhi = (aktifEnerji, reaktifEnerji) => {
    const P = parseFloat(aktifEnerji);
    const Q = parseFloat(reaktifEnerji);
    if (!P || !Q || P <= 0) return null;
    const S = Math.sqrt(P * P + Q * Q);
    const cosPhi = P / S;
    return Math.min(Math.max(cosPhi, 0), 1).toFixed(3);
  };

  // Saatlik verileri günlük bazda gruplama fonksiyonu
  const groupDataByDay = (data) => {
    if (!data || data.length === 0) return [];
    
    const dayMap = {};
    
    data.forEach(row => {
      const tarih = row.tarih; // YYYY-MM-DD formatında
      if (!dayMap[tarih]) {
        dayMap[tarih] = {
          tarih: tarih,
          gun: new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }),
          tuketim: 0,
          okunan_endeks: 0,
          hesaplanmis_endeks: 0,
          count: 0
        };
      }
      
      dayMap[tarih].tuketim += parseFloat(row.tuketim || 0);
      dayMap[tarih].okunan_endeks += parseFloat(row.okunan_endeks || 0);
      dayMap[tarih].hesaplanmis_endeks += parseFloat(row.hesaplanmis_endeks || 0);
      dayMap[tarih].count += 1;
    });
    
    // Ortalama hesapla ve array'e çevir
    return Object.values(dayMap).map(day => ({
      ...day,
      okunan_endeks: day.okunan_endeks / day.count,
      hesaplanmis_endeks: day.hesaplanmis_endeks / day.count
    })).sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
  };

  // Aktif/Reaktif enerji değiştiğinde güç faktörünü otomatik hesapla
  useEffect(() => {
    if (autoCalculateCosPhi && formData.enerji_tuketimi && ososOzetTablosu.length > 0) {
      const aktifRow = ososOzetTablosu.find(r => r.endeks_kodu === '1.8.0');
      const enduktifRow = ososOzetTablosu.find(r => r.endeks_kodu === '5.8.0');
      
      if (aktifRow && enduktifRow && aktifRow.tuketim > 0 && enduktifRow.tuketim > 0) {
        const calculated = calculateCosPhi(aktifRow.tuketim, enduktifRow.tuketim);
        if (calculated) {
          setFormData(prev => ({ ...prev, guc_faktoru: calculated }));
        }
      }
    }
  }, [autoCalculateCosPhi, formData.enerji_tuketimi, ososOzetTablosu]);

  // Eski tek Excel upload fonksiyonu - Artık kullanılmıyor
  // 3 ayrı Excel upload fonksiyonları: handleExcelUploadAktif, handleExcelUploadEnduktif, handleExcelUploadKapasitif

  // 'Tarih' kolonu Excel serial numarası, Date nesnesi veya "2026.09.08 10:17:00" gibi
  // metin (SayacSorgu export formatı) olabilir; hepsini destekle.
  const parseTarihValue = (excelDate) => {
    if (excelDate instanceof Date) return excelDate;
    if (typeof excelDate === 'number') {
      return new Date((excelDate - 25569) * 86400 * 1000);
    }
    if (typeof excelDate === 'string') {
      const trimmed = excelDate.trim();
      const match = trimmed.match(/^(\d{4})[.\-\/](\d{2})[.\-\/](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        const [, y, mo, d, h, mi, s] = match;
        return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s || 0));
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };

  // Ortak Excel satır parse fonksiyonu: hem eski format (Okunan Endeks Değeri,
  // Hesaplanmış Endeks, Tüketim kolonları) hem de yeni SayacSorgu.xlsx formatını
  // (Okunan Değer, Endeks Değeri, tüketim kolonu yok) destekler.
  const parseEnergyExcelRows = (jsonData) => {
    const rows = jsonData.map((row, idx) => {
      const jsDate = parseTarihValue(row['Tarih']);
      const okunanEndeks = row['Okunan Endeks Değeri'] ?? row['Okunan Değer'] ?? 0;
      const carpan = row['Çarpan'] || 1380;
      const hesaplanmisEndeks = row['Hesaplanmış Endeks'] ?? row['Endeks Değeri'] ?? (okunanEndeks * carpan);

      // Tüketim kolonunu bul (eski format bunu doğrudan içerir)
      let tuketim = null;
      for (const key in row) {
        if (key.toLowerCase().includes('tüketim') || key.toLowerCase().includes('tuketim')) {
          tuketim = row[key] || 0;
          break;
        }
      }

      const gunAdi = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][jsDate.getDay()];
      const gun = jsDate.getDate().toString().padStart(2, '0');
      const ay = (jsDate.getMonth() + 1).toString().padStart(2, '0');
      const saatDk = jsDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

      return {
        _idx: idx,
        _jsDate: jsDate,
        tarih: jsDate.toISOString().split('T')[0],
        saat: `${gunAdi} ${gun}.${ay} ${saatDk}`,
        okunan_endeks: okunanEndeks,
        carpan,
        hesaplanmis_endeks: hesaplanmisEndeks,
        tuketim,
        raw_data: row
      };
    });

    // Tüketim kolonu hiç yoksa (yeni SayacSorgu formatı), ardışık endeks
    // değerleri farkından tüketimi hesapla
    if (rows.every(r => r.tuketim === null)) {
      const sorted = [...rows].sort((a, b) => a._jsDate - b._jsDate);
      sorted.forEach((r, i) => {
        r.tuketim = i === 0 ? 0 : Math.max(0, r.hesaplanmis_endeks - sorted[i - 1].hesaplanmis_endeks);
      });
    } else {
      rows.forEach(r => { if (r.tuketim === null) r.tuketim = 0; });
    }

    rows.sort((a, b) => a._idx - b._idx);
    return rows.map(({ _jsDate, _idx, ...rest }) => rest);
  };

  // 3 Ayrı Excel Upload Handler'ları
  const handleExcelUploadAktif = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsedData = parseEnergyExcelRows(jsonData);

        setExcelDataAktif(parsedData);
        alert(`AKTİF Enerji Excel verisi yüklendi! (${parsedData.length} satır)`);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Excel okuma hatası:', error);
      alert('Excel dosyası okunurken hata oluştu: ' + error.message);
    }
  };

  const handleExcelUploadEnduktif = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsedData = parseEnergyExcelRows(jsonData);

        setExcelDataEnduktif(parsedData);
        alert(`ENDÜKTİF Reaktif Excel verisi yüklendi! (${parsedData.length} satır)`);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Excel okuma hatası:', error);
      alert('Excel dosyası okunurken hata oluştu: ' + error.message);
    }
  };

  const handleExcelUploadKapasitif = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsedData = parseEnergyExcelRows(jsonData);

        setExcelDataKapasitif(parsedData);
        alert(`KAPASİTİF Reaktif Excel verisi yüklendi! (${parsedData.length} satır)`);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Excel okuma hatası:', error);
      alert('Excel dosyası okunurken hata oluştu: ' + error.message);
    }
  };

  const parseOsosTable = (text) => {
    try {
      // Satırlara böl
      const lines = text.split('\n').filter(line => line.trim());
      const parsedData = [];

      // Sayıları parse et (Türkçe format: 3.296,18 -> 3296.18)
      const parseNumber = (str) => {
        if (!str || str === 'SQL' || str === 'MAX') return 0;
        return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
      };

      for (const line of lines) {
        // Tab ile ayrılmış veriyi tek '\t' üzerinden böl ki boş hücreler (örn. boş
        // "Sınır" kolonu) kaybolmasın; tab yoksa çoklu boşlukla ayrılmış kabul et.
        const rawParts = line.includes('\t') ? line.split('\t') : line.split(/\s{2,}/);
        const parts = rawParts.map(p => p.trim());
        while (parts.length && parts[parts.length - 1] === '') parts.pop(); // sondaki boş hücreleri at

        if (parts.length < 5) continue; // En az kod, açıklama, ilk/son endeks ve tüketim olmalı
        if (!/^\d+\.\d+\.\d+$/.test(parts[0])) continue; // İlk kolon OBIS kodu olmalı (örn: 1.8.0)

        const ilkEndeks = parseNumber(parts[2]);
        const sonEndeks = parseNumber(parts[3]);
        const beklenenFark = sonEndeks - ilkEndeks;
        const dorduncuKolon = parseNumber(parts[4]);

        // Eski format: Endeks Kodu, Açıklama, İlk, Son, Endeks Farkı, Çarpan, Tüketim, [Yasal Sınır], [Durum]
        // 4. kolon (Endeks Farkı) Son-İlk farkına yakınsa eski format kabul edilir.
        const eskiFormat = parts.length >= 6 && Math.abs(dorduncuKolon - beklenenFark) < Math.max(1, Math.abs(beklenenFark) * 0.05);

        let row;
        if (eskiFormat) {
          row = {
            endeks_kodu: parts[0] || '',
            aciklama: parts[1] || '',
            ilk_endeks: ilkEndeks,
            son_endeks: sonEndeks,
            endeks_farki: dorduncuKolon,
            carpan: parseNumber(parts[5]),
            tuketim: parseNumber(parts[6]),
            yasal_sinir: parts[7] || '',
            durum: parts[8] || ''
          };
        } else {
          // Yeni format (SayacSorgu/OSOS özet): Endeks Kodu, Açıklama, İlk, Son, Tüketim, [Sınır], [Ceza Oranı]
          row = {
            endeks_kodu: parts[0] || '',
            aciklama: parts[1] || '',
            ilk_endeks: ilkEndeks,
            son_endeks: sonEndeks,
            endeks_farki: beklenenFark,
            carpan: 0,
            tuketim: dorduncuKolon,
            yasal_sinir: parts[5] || '',
            durum: parts[6] || ''
          };
        }

        parsedData.push(row);
      }

      return parsedData;
    } catch (error) {
      console.error('OSOS tablo parse hatası:', error);
      return [];
    }
  };

  const handleOsosTablePaste = () => {
    const parsed = parseOsosTable(ososTableText);
    if (parsed.length === 0) {
      alert('Tablo parse edilemedi. Lütfen formatı kontrol edin.');
      return;
    }

    setOsosOzetTablosu(parsed);
    
    // Toplam aktif enerjiyi hesapla (1.8.0)
    const aktifEnerji = parsed.find(r => r.endeks_kodu === '1.8.0');
    if (aktifEnerji) {
      setFormData(prev => ({
        ...prev,
        enerji_tuketimi: aktifEnerji.tuketim.toFixed(2)
      }));
    }

    setShowOsosTableInput(false);
    alert(`${parsed.length} satır OSOS verisi yüklendi!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (autoCalculateCosPhi && !formData.guc_faktoru) {
      alert('Güç faktörü otomatik hesaplanamadı. Lütfen önce OSOS özet tablosunu (1.8.0 ve 5.8.0 satırları tüketimli) yapıştırın ya da otomatik hesaplamayı kapatıp manuel girin.');
      return;
    }
    if (isNaN(parseFloat(formData.guc_faktoru)) || isNaN(parseFloat(formData.aktif_guc)) || isNaN(parseFloat(formData.enerji_tuketimi)) || isNaN(parseFloat(formData.hedef_guc_faktoru))) {
      alert('Lütfen zorunlu sayısal alanları (Güç Faktörü, Aktif Güç, Enerji Tüketimi, Hedef Güç Faktörü) geçerli bir değerle doldurun.');
      return;
    }
    if (!ilkKayit && isNaN(parseFloat(formData.onceki_hafta_guc_faktoru))) {
      alert('Önceki hafta güç faktörünü girin ya da "Bu fabrikanın ilk kaydı" seçeneğini işaretleyin.');
      return;
    }

    try {
      const rapor = {
        ...formData,
        guc_faktoru: parseFloat(formData.guc_faktoru),
        reaktif_guc: formData.reaktif_guc ? parseFloat(formData.reaktif_guc) : null,
        aktif_guc: parseFloat(formData.aktif_guc),
        enerji_tuketimi: parseFloat(formData.enerji_tuketimi),
        maliyet: formData.maliyet ? parseFloat(formData.maliyet) : null,
        onceki_hafta_guc_faktoru: formData.onceki_hafta_guc_faktoru ? parseFloat(formData.onceki_hafta_guc_faktoru) : null,
        hedef_guc_faktoru: parseFloat(formData.hedef_guc_faktoru),
        gorsel_url: uploadedImage || formData.gorsel_url || null,
        notlar: formData.notlar || null,
        excel_data_aktif: excelDataAktif.length > 0 ? JSON.stringify(excelDataAktif) : null,
        excel_data_enduktif: excelDataEnduktif.length > 0 ? JSON.stringify(excelDataEnduktif) : null,
        excel_data_kapasitif: excelDataKapasitif.length > 0 ? JSON.stringify(excelDataKapasitif) : null,
        osos_ozet_tablo: ososOzetTablosu.length > 0 ? JSON.stringify(ososOzetTablosu) : null
      };

      if (editingId) {
        const { error } = await supabase
          .from('haftalik_raporlar')
          .update(rapor)
          .eq('id', editingId);
        
        if (error) throw error;
        alert('Rapor güncellendi!');
      } else {
        const { error } = await supabase
          .from('haftalik_raporlar')
          .insert([rapor]);
        
        if (error) throw error;
        alert('Rapor eklendi!');
      }

      setShowModal(false);
      setEditingId(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kayıt sırasında hata oluştu: ' + error.message);
    }
  };

  const handleEdit = (rapor) => {
    setAutoCalculateCosPhi(false);
    setIlkKayit(rapor.onceki_hafta_guc_faktoru === null || rapor.onceki_hafta_guc_faktoru === undefined);
    setFormData({
      fabrika_adi: rapor.fabrika_adi,
      hafta_baslangic: rapor.hafta_baslangic,
      hafta_bitis: rapor.hafta_bitis,
      guc_faktoru: rapor.guc_faktoru,
      reaktif_guc: rapor.reaktif_guc ?? '',
      aktif_guc: rapor.aktif_guc,
      kompanzasyon_durumu: rapor.kompanzasyon_durumu,
      enerji_tuketimi: rapor.enerji_tuketimi,
      maliyet: rapor.maliyet ?? '',
      onceki_hafta_guc_faktoru: rapor.onceki_hafta_guc_faktoru ?? '',
      hedef_guc_faktoru: rapor.hedef_guc_faktoru,
      notlar: rapor.notlar || '',
      gorsel_url: rapor.gorsel_url || ''
    });
    setUploadedImage(rapor.gorsel_url || null);
    
    // 3 ayrı Excel verisini yükle
    if (rapor.excel_data_aktif) {
      try {
        const parsedData = JSON.parse(rapor.excel_data_aktif);
        setExcelDataAktif(parsedData);
      } catch (e) {
        console.error('Aktif Excel verisi parse edilemedi:', e);
      }
    }

    if (rapor.excel_data_enduktif) {
      try {
        const parsedData = JSON.parse(rapor.excel_data_enduktif);
        setExcelDataEnduktif(parsedData);
      } catch (e) {
        console.error('Endüktif Excel verisi parse edilemedi:', e);
      }
    }

    if (rapor.excel_data_kapasitif) {
      try {
        const parsedData = JSON.parse(rapor.excel_data_kapasitif);
        setExcelDataKapasitif(parsedData);
      } catch (e) {
        console.error('Kapasitif Excel verisi parse edilemedi:', e);
      }
    }

    // OSOS özet tablosunu yükle
    if (rapor.osos_ozet_tablo) {
      try {
        const ososData = JSON.parse(rapor.osos_ozet_tablo);
        setOsosOzetTablosu(ososData);
      } catch (e) {
        console.error('OSOS tablo parse edilemedi:', e);
      }
    }
    
    setEditingId(rapor.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu raporu silmek istediğinize emin misiniz?')) return;
    
    try {
      const { error } = await supabase
        .from('haftalik_raporlar')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      alert('Rapor silindi!');
      loadData();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme sırasında hata oluştu: ' + error.message);
    }
  };

  const resetForm = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const monday = new Date(today);
    const sunday = new Date(today);
    
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + daysToMonday);
    sunday.setDate(monday.getDate() + 6);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setFormData({
      fabrika_adi: '',
      hafta_baslangic: formatDate(monday),
      hafta_bitis: formatDate(sunday),
      guc_faktoru: '',
      reaktif_guc: '',
      aktif_guc: '',
      kompanzasyon_durumu: 'Otomatik Kompanzasyon Aktif',
      enerji_tuketimi: '',
      maliyet: '',
      onceki_hafta_guc_faktoru: '',
      hedef_guc_faktoru: '0.95',
      notlar: '',
      gorsel_url: ''
    });
    setUploadedImage(null);
    setExcelDataAktif([]);
    setExcelDataEnduktif([]);
    setExcelDataKapasitif([]);
    setOsosOzetTablosu([]);
    setIlkKayit(false);
    setAutoCalculateCosPhi(false);
  };

  const handleYeniRapor = () => {
    setEditingId(null);
    resetForm();

    if (raporlar.length > 0) {
      const sonRapor = raporlar[0];
      setFormData(prev => ({
        ...prev,
        onceki_hafta_guc_faktoru: sonRapor.guc_faktoru,
        fabrika_adi: sonRapor.fabrika_adi
      }));
    } else {
      // Sistemde hiç rapor yoksa referans al\u0131nacak bir "\u00f6nceki hafta" de\u011feri olamaz
      setIlkKayit(true);
    }
    setShowModal(true);
  };

  const exportToExcel = () => {
    const data = filtreliRaporlar.map(rapor => ({
      'Fabrika': rapor.fabrika_adi,
      'Hafta Başlangıç': new Date(rapor.hafta_baslangic).toLocaleDateString('tr-TR'),
      'Hafta Bitiş': new Date(rapor.hafta_bitis).toLocaleDateString('tr-TR'),
      'Güç Faktörü': rapor.guc_faktoru,
      'Reaktif Güç (kVAr)': rapor.reaktif_guc,
      'Aktif Güç (kW)': rapor.aktif_guc,
      'Kompanzasyon': rapor.kompanzasyon_durumu,
      'Enerji Tüketimi (kWh)': rapor.enerji_tuketimi,
      'Maliyet (₺)': rapor.maliyet,
      'Durum': getDurum(rapor).text,
      'Notlar': rapor.notlar || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Haftalık Raporlar');
    XLSX.writeFile(wb, `haftalik_raporlar_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = (rapor) => {
    if (!rapor) return;
    setSelectedRapor(rapor);
    setShowPdfPreview(true);
  };

  const handlePDFDownload = async () => {
    const paperElement = document.getElementById('haftalik-rapor-printable');
    if (!paperElement) {
      alert('PDF içeriği bulunamadı!');
      return;
    }

    try {
      const pages = paperElement.querySelectorAll('.haftalik-pdf-page');
      // A4 Boyutu: 210mm x 297mm
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowHeight: pages[i].scrollHeight
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Sayfa yüksekliğini aşmayacak şekilde sınırla
        if (imgHeight > pageHeight) {
          const ratio = pageHeight / imgHeight;
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth * ratio, pageHeight);
        } else {
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
        }
      }
      
      const fileName = `Haftalik_Rapor_${selectedRapor.fabrika_adi.replace(/\s+/g, '_')}_${selectedRapor.hafta_baslangic}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu.');
    }
  };

  const getDurum = (rapor) => {
    const gucFaktoru = parseFloat(rapor.guc_faktoru);
    const hedef = parseFloat(rapor.hedef_guc_faktoru);
    
    if (gucFaktoru >= hedef) {
      return { text: 'UYGUN', color: 'green', icon: CheckCircle, bg: 'bg-green-100', textColor: 'text-green-700' };
    } else if (gucFaktoru >= hedef - 0.05) {
      return { text: 'DİKKAT', color: 'yellow', icon: AlertTriangle, bg: 'bg-yellow-100', textColor: 'text-yellow-700' };
    } else {
      return { text: 'UYGUN DEĞİL', color: 'red', icon: TrendingDown, bg: 'bg-red-100', textColor: 'text-red-700' };
    }
  };

  const getTrend = (rapor) => {
    const current = parseFloat(rapor.guc_faktoru);
    const previous = parseFloat(rapor.onceki_hafta_guc_faktoru);

    if (rapor.onceki_hafta_guc_faktoru === null || rapor.onceki_hafta_guc_faktoru === undefined || isNaN(previous)) {
      return { icon: Minus, color: 'text-gray-500', text: 'İlk Kayıt' };
    }
    if (current > previous) {
      return { icon: TrendingUp, color: 'text-green-600', text: 'Yükseliş' };
    } else if (current < previous) {
      return { icon: TrendingDown, color: 'text-red-600', text: 'Düşüş' };
    } else {
      return { icon: Minus, color: 'text-gray-600', text: 'Sabit' };
    }
  };

  // Filtreleme
  const filtreliRaporlar = raporlar.filter(rapor => {
    if (filtreFabrika && !rapor.fabrika_adi.toLowerCase().includes(filtreFabrika.toLowerCase())) return false;
    if (filtreTarihBaslangic && rapor.hafta_baslangic < filtreTarihBaslangic) return false;
    if (filtreTarihBitis && rapor.hafta_bitis > filtreTarihBitis) return false;
    return true;
  });

  // İstatistikler
  const istatistikler = {
    toplamRapor: filtreliRaporlar.length,
    uygunRapor: filtreliRaporlar.filter(r => getDurum(r).text === 'UYGUN').length,
    dikkatRapor: filtreliRaporlar.filter(r => getDurum(r).text === 'DİKKAT').length,
    uygunDegilRapor: filtreliRaporlar.filter(r => getDurum(r).text === 'UYGUN DEĞİL').length,
    ortalamaGucFaktoru: filtreliRaporlar.length > 0 
      ? (filtreliRaporlar.reduce((sum, r) => sum + parseFloat(r.guc_faktoru), 0) / filtreliRaporlar.length).toFixed(3)
      : 0,
    toplamMaliyet: filtreliRaporlar.reduce((sum, r) => sum + (parseFloat(r.maliyet) || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-16 w-16 text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Haftalık Raporlama</h1>
                <p className="text-sm text-gray-500">Güç kompanzasyonu ve enerji yönetimi raporları</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                <Download className="w-5 h-5" />
                <span>Excel</span>
              </button>
              <button
                onClick={handleYeniRapor}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg transition shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">Yeni Rapor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fabrika</label>
              <input
                type="text"
                value={filtreFabrika}
                onChange={(e) => setFiltreFabrika(e.target.value)}
                placeholder="Fabrika adı..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
              <input
                type="date"
                value={filtreTarihBaslangic}
                onChange={(e) => setFiltreTarihBaslangic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
              <input
                type="date"
                value={filtreTarihBitis}
                onChange={(e) => setFiltreTarihBitis(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90 mb-1">Toplam Rapor</p>
                <p className="text-2xl font-bold">{istatistikler.toplamRapor}</p>
              </div>
              <BarChart3 className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90 mb-1">Uygun</p>
                <p className="text-2xl font-bold">{istatistikler.uygunRapor}</p>
              </div>
              <CheckCircle className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90 mb-1">Dikkat</p>
                <p className="text-2xl font-bold">{istatistikler.dikkatRapor}</p>
              </div>
              <AlertTriangle className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90 mb-1">Uygun Değil</p>
                <p className="text-2xl font-bold">{istatistikler.uygunDegilRapor}</p>
              </div>
              <TrendingDown className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90 mb-1">Ort. Cosφ</p>
                <p className="text-2xl font-bold">{istatistikler.ortalamaGucFaktoru}</p>
              </div>
              <Activity className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-5 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90 mb-1">Toplam Maliyet</p>
                <p className="text-xl font-bold">{istatistikler.toplamMaliyet.toLocaleString('tr-TR')} ₺</p>
              </div>
              <PieChart className="w-10 h-10 opacity-80" />
            </div>
          </div>
        </div>

        {/* Raporlar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtreliRaporlar.map((rapor) => {
            const durum = getDurum(rapor);
            const trend = getTrend(rapor);
            const DurumIcon = durum.icon;
            const TrendIcon = trend.icon;

            return (
              <div key={rapor.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow flex flex-col h-full">
                {/* Header */}
                <div className={`p-4 ${durum.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800 truncate" title={rapor.fabrika_adi}>{rapor.fabrika_adi}</h3>
                    <DurumIcon className={`w-6 h-6 ${durum.textColor}`} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(rapor.hafta_baslangic).toLocaleDateString('tr-TR')} - {new Date(rapor.hafta_bitis).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 flex-grow">
                  {/* Güç Faktörü */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Güç Faktörü</p>
                      <p className="text-2xl font-bold text-indigo-600">{rapor.guc_faktoru}</p>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center justify-end gap-1 ${trend.color}`}>
                        <TrendIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">{trend.text}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Önceki: {rapor.onceki_hafta_guc_faktoru ?? 'İlk kayıt'}</p>
                    </div>
                  </div>

                  {/* Güç Bilgileri */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-xs text-gray-600">Aktif Güç</p>
                      <p className="text-sm font-bold text-blue-700">{rapor.aktif_guc} kW</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <p className="text-xs text-gray-600">Reaktif Güç</p>
                      <p className="text-sm font-bold text-purple-700">{rapor.reaktif_guc ? `${rapor.reaktif_guc} kVAr` : '-'}</p>
                    </div>
                  </div>

                  {/* Kompanzasyon */}
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Kompanzasyon</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{rapor.kompanzasyon_durumu}</p>
                  </div>

                  {/* Enerji ve Maliyet */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-green-50 rounded">
                      <p className="text-xs text-gray-600">Tüketim</p>
                      <p className="text-sm font-bold text-green-700">{rapor.enerji_tuketimi} kWh</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded">
                      <p className="text-xs text-gray-600">Maliyet</p>
                      <p className="text-sm font-bold text-orange-700">{rapor.maliyet ? `${parseFloat(rapor.maliyet).toLocaleString('tr-TR')} ₺` : '-'}</p>
                    </div>
                  </div>

                  {/* Durum Badge */}
                  <div className={`p-2 rounded-lg text-center font-bold text-sm ${durum.bg} ${durum.textColor}`}>
                    {durum.text}
                  </div>

                  {/* Enerji Türü Badge (Excel verisi varsa) */}
                  {rapor.excel_enerji_turu && (
                    <div className="p-2 rounded-lg text-center text-xs font-semibold bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700">
                      {rapor.excel_enerji_turu === 'aktif' && '⚡ Aktif Enerji'}
                      {rapor.excel_enerji_turu === 'enduktif' && '🔴 Reaktif Endüktif'}
                      {rapor.excel_enerji_turu === 'kapasitif' && '🔵 Reaktif Kapasitif'}
                    </div>
                  )}

                  {/* OSOS Tablo Badge */}
                  {rapor.osos_ozet_tablo && (
                    <div className="p-2 rounded-lg text-center text-xs font-semibold bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700">
                      📋 OSOS Özet Tablo Mevcut
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                  {(rapor.excel_data_aktif || rapor.excel_data_enduktif || rapor.excel_data_kapasitif || rapor.osos_ozet_tablo) && (
                    <button
                      onClick={() => {
                        setSelectedRapor(rapor);
                        setShowGrafikModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm"
                    >
                      <LineChart className="w-4 h-4" />
                      Grafik
                    </button>
                  )}
                  <button
                    onClick={() => exportToPDF(rapor)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
                  >
                    <FileDown className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleEdit(rapor)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(rapor.id)}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtreliRaporlar.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center mt-6">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Henüz rapor eklenmemiş</p>
            <p className="text-gray-400 text-sm mt-2">Yeni rapor eklemek için yukarıdaki butonu kullanın</p>
          </div>
        )}

        {/* Ekleme / Düzenleme Modalı */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {editingId ? 'Raporu Düzenle' : 'Yeni Haftalık Rapor'}
                  </h2>
                  <button
                    onClick={() => { setShowModal(false); setEditingId(null); resetForm(); }}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {/* Fatura Verisi Bilgilendirmesi */}
                <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Fatura/Okuma Endeks Tablosundan Veri Girişi</h4>
                      <p className="text-xs text-blue-800 mb-2">Fatura tablonuzda şu bilgiler mevcut:</p>
                      <ul className="text-xs text-blue-800 space-y-1">
                        <li>✅ <strong>Aktif Enerji Tüketimi (kWh)</strong> → "Enerji Tüketimi" alanına girin</li>
                        <li>✅ <strong>Demand / Maksimum Talep (kW)</strong> → "Aktif Güç" alanına girin</li>
                        <li>✅ <strong>Endüktif Reaktif (kVArh)</strong> → OSOS özet tablosuna yapıştırın</li>
                        <li>✅ <strong>Kapasitif Reaktif (kVArh)</strong> → OSOS özet tablosuna yapıştırın</li>
                        <li>✅ <strong>Reaktif Oranları (%)</strong> → Raporda otomatik gösterilecek</li>
                        <li>⚠️ <strong>Güç Faktörü (Cosφ)</strong> → Manuel girin veya otomatik hesaplat</li>
                        <li>⚠️ <strong>Önceki Hafta Cosφ</strong> → İlk kayıtta "İlk kayıt" seçeneğini işaretleyin</li>
                      </ul>
                      <p className="text-xs text-blue-700 mt-2 font-medium">💡 İpucu: OSOS özet tablosunu yapıştırın, Cosφ otomatik hesaplanacak!</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fabrika Adı */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Fabrika Adı *</label>
                    <input
                      type="text"
                      required
                      value={formData.fabrika_adi}
                      onChange={(e) => setFormData({ ...formData, fabrika_adi: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Örn: ABC Fabrikası"
                    />
                  </div>

                  {/* Hafta Tarihleri */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Hafta Dönemi *</label>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date();
                          const dayOfWeek = today.getDay();
                          const monday = new Date(today);
                          const sunday = new Date(today);
                          
                          const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                          monday.setDate(today.getDate() + daysToMonday);
                          sunday.setDate(monday.getDate() + 6);
                          
                          const formatDate = (date) => {
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          };
                          
                          setFormData({
                            ...formData,
                            hafta_baslangic: formatDate(monday),
                            hafta_bitis: formatDate(sunday)
                          });
                        }}
                        className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition"
                      >
                        Bu Hafta
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <input
                          type="date"
                          required
                          value={formData.hafta_baslangic}
                          onChange={(e) => setFormData({ ...formData, hafta_baslangic: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Pazartesi</p>
                      </div>
                      <div>
                        <input
                          type="date"
                          required
                          value={formData.hafta_bitis}
                          onChange={(e) => setFormData({ ...formData, hafta_bitis: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Pazar</p>
                      </div>
                    </div>
                  </div>

                  {/* Güç Faktörü */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Güç Faktörü (cosφ) *</label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="autoCalculate"
                        checked={autoCalculateCosPhi}
                        onChange={(e) => setAutoCalculateCosPhi(e.target.checked)}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="autoCalculate" className="text-sm text-gray-600">
                        OSOS verilerinden otomatik hesapla (Aktif/Reaktif enerjiden)
                      </label>
                    </div>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      required
                      disabled={autoCalculateCosPhi}
                      value={formData.guc_faktoru}
                      onChange={(e) => setFormData({ ...formData, guc_faktoru: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-green-50 disabled:cursor-not-allowed"
                      placeholder="0.920"
                    />
                    {autoCalculateCosPhi && formData.guc_faktoru && (
                      <p className="mt-1 text-xs text-green-600">✓ Otomatik hesaplandı</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Önceki Hafta Güç Faktörü
                      {ilkKayit && <span className="ml-2 text-xs text-blue-600">(İlk kayıtta boş bırakılabilir)</span>}
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="ilkKayit"
                        checked={ilkKayit}
                        onChange={(e) => {
                          setIlkKayit(e.target.checked);
                          if (e.target.checked) {
                            setFormData({ ...formData, onceki_hafta_guc_faktoru: '' });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="ilkKayit" className="text-sm text-gray-600">Bu fabrikanın ilk kaydı</label>
                    </div>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      required={!ilkKayit}
                      disabled={ilkKayit}
                      value={formData.onceki_hafta_guc_faktoru}
                      onChange={(e) => setFormData({ ...formData, onceki_hafta_guc_faktoru: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder={ilkKayit ? "İlk kayıt - veri yok" : "0.910"}
                    />
                  </div>

                  {/* Hedef Güç Faktörü */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hedef Güç Faktörü
                      <span className="ml-2 text-xs text-gray-500">(Varsayılan: 0.95 - Türkiye için ideal)</span>
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      value={formData.hedef_guc_faktoru}
                      onChange={(e) => setFormData({ ...formData, hedef_guc_faktoru: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0.950"
                    />
                  </div>

                  {/* Güç Bilgileri */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aktif Güç (kW) *
                      <span className="ml-2 text-xs text-gray-500">(Faturadaki Demand değeri)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.aktif_guc}
                      onChange={(e) => setFormData({ ...formData, aktif_guc: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="327.06"
                    />
                    <p className="mt-1 text-xs text-gray-500">Fatura tablosunda "Demand / Tüketim" satırındaki değer</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reaktif Güç (kVAr)
                      <span className="ml-2 text-xs text-gray-500">(Opsiyonel - genelde faturada yoktur)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.reaktif_guc}
                      onChange={(e) => setFormData({ ...formData, reaktif_guc: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="350"
                    />
                    <p className="mt-1 text-xs text-gray-500">Anlık reaktif güç - manuel hesap veya OSOS verilerinden çıkarılabilir</p>
                  </div>

                  {/* Kompanzasyon */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kompanzasyon Durumu *</label>
                    <input
                      type="text"
                      required
                      value={formData.kompanzasyon_durumu}
                      onChange={(e) => setFormData({ ...formData, kompanzasyon_durumu: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Örn: Otomatik kompanzasyon aktif, 3 kademe çalışıyor"
                    />
                  </div>

                  {/* Enerji ve Maliyet */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enerji Tüketimi (kWh) *
                      <span className="ml-2 text-xs text-gray-500">(Faturadaki aktif enerji)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.enerji_tuketimi}
                      onChange={(e) => setFormData({ ...formData, enerji_tuketimi: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="70044.66"
                    />
                    <p className="mt-1 text-xs text-gray-500">Fatura tablosunda "1.8.0 - Aktif enerji" tüketim değeri</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maliyet (₺)
                      <span className="ml-2 text-xs text-gray-500">(Opsiyonel)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.maliyet}
                      onChange={(e) => setFormData({ ...formData, maliyet: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="245156"
                    />
                  </div>

                  {/* Notlar */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                    <textarea
                      value={formData.notlar}
                      onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      rows="3"
                      placeholder="Ek açıklamalar..."
                    />
                  </div>

                  {/* OSOS Özet Tablosu Manuel Giriş */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        OSOS Özet Tablosu (Manuel Yapıştır)
                        <span className="text-xs font-normal text-green-600">⭐ Önerilen</span>
                      </div>
                    </label>
                    <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-800">
                        <strong>💡 Fatura tablosundan bu bilgiler buraya yapıştırılmalı:</strong>
                      </p>
                      <ul className="text-xs text-green-700 mt-1 space-y-0.5 ml-4">
                        <li>• <strong>1.8.0</strong> - Aktif enerji tüketimi (70.044,66 kWh)</li>
                        <li>• <strong>5.8.0</strong> - Endüktif reaktif enerji (4.134,48 kVArh - %5,90)</li>
                        <li>• <strong>8.8.0</strong> - Kapasitif reaktif enerji (1.298,58 kVArh - %1,85)</li>
                      </ul>
                      <p className="text-xs text-green-800 mt-2">
                        ✅ Bu tabloyu yapıştırdığınızda <strong>Cosφ otomatik hesaplanacak!</strong>
                      </p>
                    </div>
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setShowOsosTableInput(!showOsosTableInput)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-orange-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition"
                      >
                        <BarChart3 className="w-5 h-5 text-orange-500" />
                        <span className="text-gray-600">OSOS Özet Tablosunu Yapıştır (Endeks Kodları)</span>
                      </button>
                      
                      {showOsosTableInput && (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">
                            OSOS'tan kopyaladığınız özet tabloyu (Endeks Kodu, Açıklama, İlk endeks, vb.) aşağıya yapıştırın:
                          </p>
                          <textarea
                            value={ososTableText}
                            onChange={(e) => setOsosTableText(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono text-xs"
                            rows="8"
                            placeholder="Endeks Kodu\tAçıklama\tİlk endeks\tSon endeks\tEndeks Farkı\tÇarpan\tTüketim (kWh)\tYasal Sınır\tDurum\n1.8.0\tAktif enerji\t3.296,18\t3.346,94\t50,7570\t1380,0000\t70.044,66\t\t\n..."
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              type="button"
                              onClick={handleOsosTablePaste}
                              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition font-semibold"
                            >
                              Parse Et ve Yükle
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowOsosTableInput(false);
                                setOsosTableText('');
                              }}
                              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
                            >
                              İptal
                            </button>
                          </div>
                        </div>
                      )}

                      {ososOzetTablosu.length > 0 && (
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-orange-600" />
                              <span className="text-sm font-medium text-orange-700">
                                {ososOzetTablosu.length} satır OSOS özet verisi yüklendi
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowOsosTableInput(true)}
                              className="text-xs px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded transition"
                            >
                              Düzenle
                            </button>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            Aktif: {ososOzetTablosu.find(r => r.endeks_kodu === '1.8.0')?.tuketim.toFixed(2) || 0} kWh |
                            Endüktif: {ososOzetTablosu.find(r => r.endeks_kodu === '5.8.0')?.tuketim.toFixed(2) || 0} kVArh |
                            Kapasitif: {ososOzetTablosu.find(r => r.endeks_kodu === '8.8.0')?.tuketim.toFixed(2) || 0} kVArh
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Excel Veri Yükleme - 3 Ayrı Dosya */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel Verileri Yükle (OSOS Detay Raporları)
                      </div>
                    </label>
                    <div className="space-y-3">
                      {/* Aktif Enerji Excel */}
                      <div>
                        <input
                          ref={excelInputRefAktif}
                          type="file"
                          accept=".xls,.xlsx"
                          onChange={handleExcelUploadAktif}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => excelInputRefAktif.current?.click()}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
                        >
                          <Upload className="w-5 h-5 text-green-500" />
                          <span className="text-gray-600">
                            {excelDataAktif.length > 0 ? `✓ Aktif Enerji (1.8.0) - ${excelDataAktif.length} satır` : 'Aktif Enerji Excel Yükle (1.8.0)'}
                          </span>
                        </button>
                      </div>

                      {/* Endüktif Reaktif Excel */}
                      <div>
                        <input
                          ref={excelInputRefEnduktif}
                          type="file"
                          accept=".xls,.xlsx"
                          onChange={handleExcelUploadEnduktif}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => excelInputRefEnduktif.current?.click()}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-yellow-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition"
                        >
                          <Upload className="w-5 h-5 text-yellow-500" />
                          <span className="text-gray-600">
                            {excelDataEnduktif.length > 0 ? `✓ Endüktif Reaktif (5.8.0) - ${excelDataEnduktif.length} satır` : 'Endüktif Reaktif Excel Yükle (5.8.0)'}
                          </span>
                        </button>
                      </div>

                      {/* Kapasitif Reaktif Excel */}
                      <div>
                        <input
                          ref={excelInputRefKapasitif}
                          type="file"
                          accept=".xls,.xlsx"
                          onChange={handleExcelUploadKapasitif}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => excelInputRefKapasitif.current?.click()}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-pink-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition"
                        >
                          <Upload className="w-5 h-5 text-pink-500" />
                          <span className="text-gray-600">
                            {excelDataKapasitif.length > 0 ? `✓ Kapasitif Reaktif (8.8.0) - ${excelDataKapasitif.length} satır` : 'Kapasitif Reaktif Excel Yükle (8.8.0)'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Görsel Yükleme */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Görsel / Fotoğraf Ekle
                      </div>
                    </label>
                    <div className="space-y-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition"
                      >
                        <Upload className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-600">Görsel Yükle (Kompanzasyon panosu, ölçüm cihazı vb.)</span>
                      </button>
                      {uploadedImage && (
                        <div className="relative">
                          <img 
                            src={uploadedImage} 
                            alt="Yüklenen görsel" 
                            className="w-full h-48 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedImage(null);
                              setFormData({ ...formData, gorsel_url: '' });
                            }}
                            className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition"
                  >
                    <Save className="w-5 h-5" />
                    <span>{editingId ? 'Güncelle' : 'Kaydet'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); setEditingId(null); resetForm(); }}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Grafik Modal - rapora ait 3 enerji türü (Aktif/Endüktif/Kapasitif) ve OSOS tablosunu gösterir */}
        {showGrafikModal && selectedRapor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex justify-between items-center text-white sticky top-0 z-10 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <LineChart className="w-6 h-6" />
                  <h3 className="font-bold text-lg">Detaylı Tüketim Grafikleri - {selectedRapor.fabrika_adi}</h3>
                </div>
                <button onClick={() => { setShowGrafikModal(false); setSelectedRapor(null); }} className="hover:bg-white/20 p-1 rounded">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {(() => {
                  const excelSets = [
                    { data: selectedRapor.excel_data_aktif, type: 'aktif', title: 'Aktif Enerji', code: '1.8.0', unit: 'kWh', color: '#10b981', emoji: '⚡' },
                    { data: selectedRapor.excel_data_enduktif, type: 'enduktif', title: 'Reaktif Endüktif Enerji', code: '5.8.0', unit: 'kVArh', color: '#f59e0b', emoji: '🔴' },
                    { data: selectedRapor.excel_data_kapasitif, type: 'kapasitif', title: 'Reaktif Kapasitif Enerji', code: '8.8.0', unit: 'kVArh', color: '#ec4899', emoji: '🔵' }
                  ]
                    .filter(s => s.data)
                    .map(s => {
                      try {
                        return { ...s, rows: JSON.parse(s.data) };
                      } catch (e) {
                        console.error(`${s.type} Excel verisi parse edilemedi:`, e);
                        return { ...s, rows: [] };
                      }
                    })
                    .filter(s => s.rows.length > 0);

                  if (excelSets.length === 0 && !selectedRapor.osos_ozet_tablo) {
                    return (
                      <div className="text-center py-16 text-gray-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                        <p>Bu rapor için görselleştirilecek Excel veya OSOS verisi bulunamadı.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {excelSets.map((excelSet) => {
                        const gunlukVeri = groupDataByDay(excelSet.rows);
                        if (gunlukVeri.length === 0) return null;
                        const toplam = gunlukVeri.reduce((sum, d) => sum + d.tuketim, 0);
                        const maxVal = Math.max(...gunlukVeri.map(d => d.tuketim));
                        const minVal = Math.min(...gunlukVeri.map(d => d.tuketim));
                        const ortalama = toplam / gunlukVeri.length;

                        return (
                          <div key={excelSet.type} className="space-y-4">
                            <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2 border-b-2 pb-2" style={{ borderColor: excelSet.color }}>
                              <span>{excelSet.emoji}</span> {excelSet.title} <span className="text-sm font-normal text-gray-500">(OBIS {excelSet.code} · {excelSet.unit})</span>
                            </h4>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <h5 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
                                  <Activity className="w-4 h-4" style={{ color: excelSet.color }} /> Günlük Tüketim
                                </h5>
                                <ResponsiveContainer width="100%" height={260}>
                                  <AreaChart data={gunlukVeri}>
                                    <defs>
                                      <linearGradient id={`color-${excelSet.type}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={excelSet.color} stopOpacity={0.7} />
                                        <stop offset="95%" stopColor={excelSet.color} stopOpacity={0.05} />
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="gun" fontSize={11} />
                                    <YAxis fontSize={11} />
                                    <Tooltip formatter={(v) => [`${Number(v).toFixed(2)} ${excelSet.unit}`, 'Tüketim']} contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
                                    <Area type="monotone" dataKey="tuketim" stroke={excelSet.color} strokeWidth={2} fillOpacity={1} fill={`url(#color-${excelSet.type})`} />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>

                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                                <h5 className="font-semibold text-gray-700 mb-3 text-sm flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" style={{ color: excelSet.color }} /> Okunan Endeks Trendi
                                </h5>
                                <ResponsiveContainer width="100%" height={260}>
                                  <RechartsLine data={gunlukVeri}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="gun" fontSize={11} />
                                    <YAxis fontSize={11} />
                                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
                                    <Line type="monotone" dataKey="okunan_endeks" stroke={excelSet.color} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                                  </RechartsLine>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div className="p-3 rounded-lg text-center border" style={{ backgroundColor: `${excelSet.color}14`, borderColor: `${excelSet.color}40` }}>
                                <p className="text-xs text-gray-600">Toplam</p>
                                <p className="text-lg font-bold" style={{ color: excelSet.color }}>{toplam.toFixed(2)} {excelSet.unit}</p>
                              </div>
                              <div className="p-3 rounded-lg text-center bg-gray-100">
                                <p className="text-xs text-gray-600">Günlük Ortalama</p>
                                <p className="text-lg font-bold text-gray-800">{ortalama.toFixed(2)} {excelSet.unit}</p>
                              </div>
                              <div className="p-3 rounded-lg text-center bg-red-50">
                                <p className="text-xs text-gray-600">Max</p>
                                <p className="text-lg font-bold text-red-600">{maxVal.toFixed(2)} {excelSet.unit}</p>
                              </div>
                              <div className="p-3 rounded-lg text-center bg-emerald-50">
                                <p className="text-xs text-gray-600">Min</p>
                                <p className="text-lg font-bold text-emerald-600">{minVal.toFixed(2)} {excelSet.unit}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* OSOS Özet Tablosu */}
                      {selectedRapor.osos_ozet_tablo && (() => {
                        try {
                          const ososData = JSON.parse(selectedRapor.osos_ozet_tablo);
                          return (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border-2 border-orange-200">
                              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-orange-600" />
                                OSOS Özet Tablosu - Endeks Bilgileri
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border-collapse">
                                  <thead className="bg-orange-600 text-white">
                                    <tr>
                                      <th className="border p-2 text-left">Kod</th>
                                      <th className="border p-2 text-left">Açıklama</th>
                                      <th className="border p-2 text-right">İlk Endeks</th>
                                      <th className="border p-2 text-right">Son Endeks</th>
                                      <th className="border p-2 text-right">Fark</th>
                                      <th className="border p-2 text-right">Çarpan</th>
                                      <th className="border p-2 text-right">Tüketim</th>
                                      <th className="border p-2 text-center">Yasal Sınır</th>
                                      <th className="border p-2 text-center">Durum</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ososData.map((row, idx) => {
                                      const isMainRow = ['1.8.0', '5.8.0', '8.8.0'].includes(row.endeks_kodu);
                                      return (
                                        <tr key={idx} className={isMainRow ? 'bg-yellow-100' : (idx % 2 === 0 ? 'bg-white' : 'bg-gray-50')}>
                                          <td className={`border p-2 ${isMainRow ? 'font-bold' : ''}`}>{row.endeks_kodu}</td>
                                          <td className={`border p-2 ${isMainRow ? 'font-bold' : ''}`}>{row.aciklama}</td>
                                          <td className="border p-2 text-right">{(row.ilk_endeks || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                          <td className="border p-2 text-right">{(row.son_endeks || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                          <td className="border p-2 text-right">{(row.endeks_farki || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                          <td className="border p-2 text-right">{row.carpan ? row.carpan.toLocaleString('tr-TR') : '-'}</td>
                                          <td className={`border p-2 text-right ${isMainRow ? 'font-bold text-orange-700' : ''}`}>{(row.tuketim || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                          <td className="border p-2 text-center">{row.yasal_sinir || '-'}</td>
                                          <td className={`border p-2 text-center font-semibold ${(row.durum || '').includes('%') ? (parseFloat((row.durum || '').replace('%', '').trim()) > 15 ? 'text-red-600' : 'text-green-600') : ''}`}>{row.durum || '-'}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200">
                                <p className="text-xs text-gray-600">
                                  <strong>Açıklama:</strong>
                                  1.8.x: Aktif enerji tüketimi (Gündüz, Puant, Gece dönemleri) |
                                  5.8.0: Endüktif reaktif enerji (Yasal sınır: %20) |
                                  8.8.0: Kapasitif reaktif enerji (Yasal sınır: %15) |
                                  2.8.0: Ters yön aktif enerji (veriş)
                                </p>
                              </div>
                            </div>
                          );
                        } catch (e) {
                          console.error('OSOS tablo parse hatası:', e);
                          return null;
                        }
                      })()}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* PDF Preview Modal */}
        {showPdfPreview && selectedRapor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white shrink-0 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-6 h-6" />
                  <h3 className="font-bold text-lg">Haftalık Enerji Raporu - Ön İzleme</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setPdfEditMode(!pdfEditMode);
                      if (!pdfEditMode) {
                        setEditedPdfData({...selectedRapor});
                      }
                    }}
                    className={`px-3 py-2 ${pdfEditMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} rounded-lg font-medium flex items-center gap-2 transition-colors`}
                  >
                    <Edit3 className="w-5 h-5" />
                    {pdfEditMode ? 'Düzenleme Modu' : 'Düzenle'}
                  </button>
                  {pdfEditMode && (
                    <button
                      onClick={async () => {
                        // Düzenlenmiş veriyi veritabanına kaydet
                        const { error } = await supabase
                          .from('haftalik_raporlar')
                          .update(editedPdfData)
                          .eq('id', selectedRapor.id);
                        
                        if (error) {
                          alert('Kaydetme hatası: ' + error.message);
                        } else {
                          alert('Değişiklikler kaydedildi!');
                          setSelectedRapor(editedPdfData);
                          setPdfEditMode(false);
                          loadData(); // Listeyi güncelle
                        }
                      }}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                      Kaydet
                    </button>
                  )}
                  <button
                    onClick={handlePDFDownload}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    PDF İndir
                  </button>
                  <button onClick={() => {
                    setShowPdfPreview(false);
                    setSelectedRapor(null);
                    setPdfEditMode(false);
                  }} className="hover:bg-white/20 p-1 rounded">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
                <div id="haftalik-rapor-printable" className="mx-auto flex flex-col items-center gap-4">
                  {/* PDF Sayfa Render Mantığı - IIFE */}
                  {(() => {
                    const durum = getDurum(selectedRapor);
                    const trend = getTrend(selectedRapor);
                    const hasOncekiHafta = selectedRapor.onceki_hafta_guc_faktoru !== null && selectedRapor.onceki_hafta_guc_faktoru !== undefined && !isNaN(parseFloat(selectedRapor.onceki_hafta_guc_faktoru));
                    const gucFaktoruFark = hasOncekiHafta ? (parseFloat(selectedRapor.guc_faktoru) - parseFloat(selectedRapor.onceki_hafta_guc_faktoru)) * 100 : 0;
                    const gucFaktoruYuzde = ((parseFloat(selectedRapor.guc_faktoru) / parseFloat(selectedRapor.hedef_guc_faktoru)) * 100).toFixed(1);

                    const pages = [];
                    
                    // SAYFA 1
                    pages.push(
                      <div key="page-1" className="haftalik-pdf-page" style={{ width: '210mm', height: '297mm', background: 'white', padding: '15mm 20mm 30mm 20mm', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box' }}>
                        {/* Header - Logo and Report Number */}
                        <div style={{ marginBottom: '5mm', paddingBottom: '3mm', borderBottom: '2px solid #2980b9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6mm' }}>
                            <div style={{ width: '40mm', flexShrink: 0 }}>
                              <img src="/fatura_logo.png" alt="Logo" style={{ width: '100%', height: 'auto', maxHeight: '20mm', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                            </div>
                            <div style={{ flex: 1, textAlign: 'right' }}>
                              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', margin: 0 }}>Rapor No: HFT-{String(selectedRapor.id).substring(0, 6).toUpperCase()}</p>
                              <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', margin: '2px 0 0 0' }}>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                          </div>
                        </div>

                        {/* Rapor Bilgileri */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10mm', fontSize: '11px' }}>
                          <div style={{ width: '48%' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2980b9', marginBottom: '5px' }}>TESİS BİLGİLERİ</h3>
                            <p style={{ margin: '3px 0', lineHeight: '1.6' }}>
                              <strong>Tesis Adı:</strong> 
                              <span 
                                contentEditable={pdfEditMode}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => pdfEditMode && setEditedPdfData({...editedPdfData, fabrika_adi: e.target.textContent})}
                                style={{ outline: pdfEditMode ? '1px dashed #2980b9' : 'none', padding: pdfEditMode ? '2px' : '0', display: 'inline-block', minWidth: '100px' }}
                              >
                                {pdfEditMode ? (editedPdfData?.fabrika_adi || selectedRapor.fabrika_adi) : selectedRapor.fabrika_adi}
                              </span>
                            </p>
                            <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Rapor Dönemi:</strong> {new Date(selectedRapor.hafta_baslangic).toLocaleDateString('tr-TR')} - {new Date(selectedRapor.hafta_bitis).toLocaleDateString('tr-TR')}</p>
                            <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Durum:</strong> <span style={{ color: durum.text === 'UYGUN' ? '#10b981' : durum.text === 'DİKKAT' ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>{durum.text}</span></p>
                          </div>
                          <div style={{ width: '48%' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: '#2980b9', marginBottom: '5px' }}>ÖLÇÜM VE ANALİZ</h3>
                            <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Hedef Güç Faktörü:</strong> {selectedRapor.hedef_guc_faktoru}</p>
                            <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Rapor Hazırlayan:</strong> Kobinerji Mühendislik</p>
                            <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Onaylayan:</strong> Teknik Müdür</p>
                          </div>
                        </div>

                        {/* Haftalık Özet */}
                        <div style={{ marginTop: '6mm', marginBottom: '6mm', padding: '10px', backgroundColor: '#f8f9fa', borderLeft: '4px solid #2980b9' }}>
                          <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>Haftalık Özet</h3>
                          <p style={{ fontSize: '10px', lineHeight: '1.6', color: '#555', margin: 0 }}>
                            Bu hafta güç faktörü <strong>{selectedRapor.guc_faktoru}</strong> seviyesinde ölçülmüştür. 
                            Bu değer hedef <strong>{selectedRapor.hedef_guc_faktoru}</strong> değerinin <strong>%{gucFaktoruYuzde}</strong>'sine karşılık gelmektedir. 
                            {hasOncekiHafta ? (
                              <>Önceki haftaya göre {gucFaktoruFark >= 0 ? <strong style={{ color: '#10b981' }}>artış</strong> : <strong style={{ color: '#ef4444' }}>düşüş</strong>} göstermiştir ({Math.abs(gucFaktoruFark).toFixed(1)}%). </>
                            ) : (
                              <>Bu tesis için ilk rapor kaydıdır, önceki haftayla karşılaştırma bulunmamaktadır. </>
                            )}
                            {durum.text === 'UYGUN' ? 
                              <><strong style={{ color: '#10b981', fontSize: '12px' }}> ✓ Performans hedeflerimize uygundur.</strong> Mevcut kompanzasyon sistemi etkin çalışmaktadır.</> : 
                              durum.text === 'DİKKAT' ? 
                              <><strong style={{ color: '#f59e0b', fontSize: '12px' }}> ⚠ Dikkat gerektirir.</strong> Kompanzasyon sistemi gözden geçirilmeli, reaktif enerji cezası riski mevcuttur.</> : 
                              <><strong style={{ color: '#ef4444', fontSize: '12px' }}> ✗ ACİL: Hedefin altındadır.</strong> Kompanzasyon sistemi yetersiz, reaktif enerji cezası alınmaktadır. Hemen iyileştirme gereklidir.</>}
                          </p>
                        </div>

                        {!!(selectedRapor.guc_faktoru || selectedRapor.aktif_guc || selectedRapor.reaktif_guc) && (
                        <div style={{ marginBottom: '8mm' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', margin: '0 0 5mm 0', borderBottom: '1px solid #2980b9', paddingBottom: '2mm' }}>ANA PERFORMANS GÖSTERGELERİ</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${[selectedRapor.guc_faktoru, selectedRapor.aktif_guc, selectedRapor.reaktif_guc].filter(v => v).length}, 1fr)`, gap: '10px' }}>
                            {!!selectedRapor.guc_faktoru && (
                            <div style={{ background: '#f0f9ff', border: '2px solid #2980b9', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
                              <p style={{ fontSize: '10px', color: '#555', margin: '0 0 8px 0', fontWeight: '600' }}>GÜÇ FAKTÖRÜ</p>
                              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#2980b9' }}>{selectedRapor.guc_faktoru}</p>
                              <p style={{ fontSize: '9px', color: '#777', margin: '8px 0 0 0', paddingTop: '6px', borderTop: '1px solid #ddd' }}>cosφ</p>
                              <p style={{ fontSize: '9px', color: '#777', margin: '3px 0 0 0' }}>Hedef: {selectedRapor.hedef_guc_faktoru}</p>
                            </div>
                            )}
                            {!!selectedRapor.aktif_guc && (
                            <div style={{ background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
                              <p style={{ fontSize: '10px', color: '#555', margin: '0 0 8px 0', fontWeight: '600' }}>AKTİF GÜÇ</p>
                              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#10b981' }}>{selectedRapor.aktif_guc}</p>
                              <p style={{ fontSize: '9px', color: '#777', margin: '8px 0 0 0', paddingTop: '6px', borderTop: '1px solid #ddd' }}>kW</p>
                              <p style={{ fontSize: '9px', color: '#777', margin: '3px 0 0 0' }}>Ortalama</p>
                            </div>
                            )}
                            {!!selectedRapor.reaktif_guc && (
                            <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
                              <p style={{ fontSize: '10px', color: '#555', margin: '0 0 8px 0', fontWeight: '600' }}>REAKTİF GÜÇ</p>
                              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#f59e0b' }}>{selectedRapor.reaktif_guc}</p>
                              <p style={{ fontSize: '9px', color: '#777', margin: '8px 0 0 0', paddingTop: '6px', borderTop: '1px solid #ddd' }}>kVAr</p>
                              <p style={{ fontSize: '9px', color: '#777', margin: '3px 0 0 0' }}>Ortalama</p>
                            </div>
                            )}
                          </div>
                        </div>
                        )}

                        <div style={{ marginBottom: '8mm' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', margin: '0 0 5mm 0', borderBottom: '1px solid #2980b9', paddingBottom: '2mm' }}>DETAYLI PERFORMANS ANALİZİ</h3>
                          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', fontSize: '9px' }}>
                            <thead>
                              <tr style={{ background: '#2980b9', color: 'white' }}>
                                <th style={{ padding: '8px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', border: '1px solid #ddd' }}>PARAMETRE</th>
                                <th style={{ padding: '8px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', border: '1px solid #ddd' }}>DEĞER</th>
                                <th style={{ padding: '8px', fontSize: '10px', fontWeight: 'bold', textAlign: 'left', border: '1px solid #ddd' }}>AÇIKLAMA</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ background: '#f8fafc' }}>
                                <td style={{ padding: '10px', fontSize: '11px', fontWeight: 'bold', color: '#334155', border: '1px solid #e2e8f0' }}>Enerji Tüketimi</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#1e293b', border: '1px solid #e2e8f0' }}>{selectedRapor.enerji_tuketimi} kWh</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#64748b', border: '1px solid #e2e8f0' }}>Ayın ilk gününden bu güne kadar kümülatif toplam</td>
                              </tr>
                              <tr style={{ background: 'white' }}>
                                <td style={{ padding: '10px', fontSize: '11px', fontWeight: 'bold', color: '#334155', border: '1px solid #e2e8f0' }}>Maliyet</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#1e293b', border: '1px solid #e2e8f0' }}>{selectedRapor.maliyet ? `${parseFloat(selectedRapor.maliyet).toLocaleString('tr-TR')} ₺` : '-'}</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#64748b', border: '1px solid #e2e8f0' }}>Toplam enerji maliyeti</td>
                              </tr>
                              <tr style={{ background: '#f8fafc' }}>
                                <td style={{ padding: '10px', fontSize: '11px', fontWeight: 'bold', color: '#334155', border: '1px solid #e2e8f0', width: '30%' }}>Kompanzasyon Durumu</td>
                                <td colSpan="2" style={{ padding: '10px', fontSize: '11px', color: '#1e293b', border: '1px solid #e2e8f0', width: '70%', wordWrap: 'break-word' }}>
                                  <span 
                                    contentEditable={pdfEditMode}
                                    suppressContentEditableWarning={true}
                                    onBlur={(e) => pdfEditMode && setEditedPdfData({...editedPdfData, kompanzasyon_durumu: e.target.textContent})}
                                    style={{ outline: pdfEditMode ? '1px dashed #2980b9' : 'none', padding: pdfEditMode ? '2px' : '0', display: 'block', minHeight: '20px' }}
                                  >
                                    {pdfEditMode ? (editedPdfData?.kompanzasyon_durumu || selectedRapor.kompanzasyon_durumu) : selectedRapor.kompanzasyon_durumu}
                                  </span>
                                </td>
                              </tr>
                              <tr style={{ background: 'white' }}>
                                <td style={{ padding: '10px', fontSize: '11px', fontWeight: 'bold', color: '#334155', border: '1px solid #e2e8f0' }}>Önceki Hafta Güç Faktörü</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#1e293b', border: '1px solid #e2e8f0' }}>{selectedRapor.onceki_hafta_guc_faktoru ?? 'İlk kayıt'}</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#64748b', border: '1px solid #e2e8f0' }}>Karşılaştırma için</td>
                              </tr>
                              <tr style={{ background: '#f8fafc' }}>
                                <td style={{ padding: '10px', fontSize: '11px', fontWeight: 'bold', color: '#334155', border: '1px solid #e2e8f0' }}>Trend</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#1e293b', border: '1px solid #e2e8f0' }}>{trend.text}</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#64748b', border: '1px solid #e2e8f0' }}>{hasOncekiHafta ? (gucFaktoruFark >= 0 ? 'Pozitif yönde' : 'Negatif yönde') : 'İlk kayıt, kıyaslama yok'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* OSOS Özet Tablosu ilk sayfadan kaldırıldı - Detaylı tablo son sayfada */}

                        <div style={{ position: 'absolute', bottom: '8mm', left: '20mm', right: '20mm', paddingTop: '3mm', borderTop: '2px solid #2980b9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '8px', color: '#555' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: '0', fontWeight: 'bold', fontSize: '9px' }}>KOBİNERJİ MÜHENDİSLİK</p>
                              <p style={{ margin: '2px 0 0 0', lineHeight: '1.4' }}>Kemalpaşa O.S.B. Gazi Bulv. Ceran Plaza No:177/19 35170 Kemalpaşa / İzmir</p>
                              <p style={{ margin: '2px 0 0 0' }}>Tel: +90 535 714 52 88 | www.kobinerji.com</p>
                            </div>
                            {(() => {
                              const excelPageCount = [selectedRapor.excel_data_aktif, selectedRapor.excel_data_enduktif, selectedRapor.excel_data_kapasitif].filter(Boolean).length;
                              const hasOsosTable = selectedRapor.osos_ozet_tablo ? 1 : 0;
                              const hasImage = selectedRapor.gorsel_url ? 1 : 0;
                              const totalPages = 2 + excelPageCount + hasOsosTable + hasImage;
                              return <p style={{ margin: '0', fontWeight: 'bold', color: '#2980b9', fontSize: '9px' }}>Sayfa 1/{totalPages}</p>;
                            })()}
                          </div>
                        </div>
                      </div>
                    );

                    // SAYFA 2
                    pages.push(
                      <div key="page-2" className="haftalik-pdf-page shadow-xl" style={{ width: '210mm', height: '297mm', background: 'white', padding: '15mm 20mm 30mm 20mm', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10mm', paddingBottom: '5mm', borderBottom: '2px solid #2980b9' }}>
                          <div style={{ width: '40mm', maxHeight: '20mm', display: 'flex', alignItems: 'center' }}>
                            <img src="/fatura_logo.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '20mm', objectFit: 'contain' }} />
                          </div>
                          <div style={{ flex: 1, textAlign: 'right', paddingLeft: '10mm' }}>
                            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#2c3e50' }}>ANALİZ VE ÖNERİLER</h2>
                            <p style={{ fontSize: '11px', color: '#555', margin: '0' }}>{selectedRapor.fabrika_adi}</p>
                          </div>
                        </div>

                        <div style={{ marginBottom: '8mm' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', margin: '0 0 5mm 0', borderBottom: '1px solid #2980b9', paddingBottom: '2mm' }}>KOMPANZASYON ANALİZİ VE ÖNERİLER</h3>
                          <div style={{ background: '#f0f9ff', border: '2px solid #2980b9', borderRadius: '8px', padding: '15px' }}>
                            <div style={{ fontSize: '11px', color: '#2c3e50', lineHeight: '1.8' }}>
                              {durum.text === 'UYGUN' ? (
                                <>
                                  <p style={{ margin: '0 0 10px 0' }}><strong style={{ color: '#10b981' }}>✓ Kompanzasyon sisteminiz optimal çalışıyor.</strong></p>
                                  <p style={{ margin: '0 0 10px 0' }}>✓ Mevcut bakım planına devam ediniz.</p>
                                  <p style={{ margin: '0' }}>✓ Periyodik ölçüm ve raporlamaya devam edilmeli.</p>
                                </>
                              ) : durum.text === 'DİKKAT' ? (
                                <>
                                  <p style={{ margin: '0 0 10px 0' }}><strong style={{ color: '#f59e0b' }}>⚠ Kompanzasyon sistemi kontrol edilmeli.</strong></p>
                                  <p style={{ margin: '0 0 10px 0' }}>⚠ Arıza durumundaki kademeler onarılmalı.</p>
                                  <p style={{ margin: '0 0 10px 0' }}>⚠ Reaktör ve kapasitör değerleri test edilmeli.</p>
                                  <p style={{ margin: '0' }}>⚠ Bir sonraki hafta yakın takip gerekli.</p>
                                </>
                              ) : (
                                <>
                                  <p style={{ margin: '0 0 10px 0' }}><strong style={{ color: '#ef4444' }}>✗ ACİL: Ek kompanzasyon ekipmanı gerekli.</strong></p>
                                  <p style={{ margin: '0 0 10px 0' }}>✗ Mevcut sistem yetersiz, kapasite artırılmalı.</p>
                                  <p style={{ margin: '0 0 10px 0' }}>✗ Reaktif enerji cezası ödeniyor.</p>
                                  <p style={{ margin: '0 0 10px 0' }}>✗ Elektrik mühendisi değerlendirmesi yapılmalı.</p>
                                  <p style={{ margin: '0' }}>✗ Yatırım getirisi (ROI) hesaplaması için iletişime geçiniz.</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {selectedRapor.notlar && (
                          <div style={{ marginBottom: '8mm' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', margin: '0 0 5mm 0', borderBottom: '1px solid #2980b9', paddingBottom: '2mm' }}>TEKNİK NOTLAR</h3>
                            <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '8px', padding: '15px' }}>
                              <p style={{ fontSize: '11px', color: '#422006', margin: '0', lineHeight: '1.8' }}>{selectedRapor.notlar}</p>
                            </div>
                          </div>
                        )}

                        <div style={{ marginBottom: '8mm' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', margin: '0 0 5mm 0', borderBottom: '1px solid #2980b9', paddingBottom: '2mm' }}>SONRAKİ ADIMLAR VE TAKİP</h3>
                          <div style={{ background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', padding: '12px' }}>
                            <div style={{ fontSize: '10px', color: '#2c3e50', lineHeight: '1.8' }}>
                              <p style={{ margin: '0 0 8px 0' }}><strong>📅 Bir Sonraki Rapor:</strong> {new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('tr-TR')}</p>
                              <p style={{ margin: '0 0 8px 0' }}><strong>🔧 Önerilen Bakım:</strong> {durum.text === 'UYGUN' ? 'Rutin kontrol yeterli' : durum.text === 'DİKKAT' ? 'Önümüzdeki 2 hafta içinde kontrol' : 'Acil müdahale gerekli'}</p>
                              <p style={{ margin: '0 0 8px 0' }}><strong>📞 Destek İletişim:</strong> Teknik destek için +90 535 714 52 88 numaralı telefonu arayabilirsiniz.</p>
                              <p style={{ margin: '0' }}><strong>📧 Rapor Gönderimi:</strong> Bu rapor otomatik olarak kayıt altına alınmıştır.</p>
                            </div>
                          </div>
                        </div>

                        <div style={{ position: 'absolute', bottom: '8mm', left: '20mm', right: '20mm', paddingTop: '3mm', borderTop: '2px solid #2980b9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '8px', color: '#555' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: '0', fontWeight: 'bold', fontSize: '9px' }}>KOBİNERJİ MÜHENDİSLİK</p>
                              <p style={{ margin: '2px 0 0 0', lineHeight: '1.4' }}>Kemalpaşa O.S.B. Gazi Bulv. Ceran Plaza No:177/19 35170 Kemalpaşa / İzmir</p>
                              <p style={{ margin: '2px 0 0 0' }}>Tel: +90 535 714 52 88 | www.kobinerji.com</p>
                            </div>
                            {(() => {
                              const excelPageCount = [selectedRapor.excel_data_aktif, selectedRapor.excel_data_enduktif, selectedRapor.excel_data_kapasitif].filter(Boolean).length;
                              const hasOsosTable = selectedRapor.osos_ozet_tablo ? 1 : 0;
                              const hasImage = selectedRapor.gorsel_url ? 1 : 0;
                              const totalPages = 2 + excelPageCount + hasOsosTable + hasImage;
                              return <p style={{ margin: '0', fontWeight: 'bold', color: '#2980b9', fontSize: '9px' }}>Sayfa 2/{totalPages}</p>;
                            })()}
                          </div>
                        </div>
                      </div>
                    );

                    // SAYFA 3-5: 3 Ayrı Excel Grafikleri (varsa)
                    const excelDataSets = [
                      { data: selectedRapor.excel_data_aktif, type: 'aktif', title: 'Aktif Enerji', code: '1.8.0', color: '#10b981' },
                      { data: selectedRapor.excel_data_enduktif, type: 'enduktif', title: 'Reaktif Endüktif Enerji', code: '5.8.0', color: '#f59e0b' },
                      { data: selectedRapor.excel_data_kapasitif, type: 'kapasitif', title: 'Reaktif Kapasitif Enerji', code: '8.8.0', color: '#ec4899' }
                    ];

                    let excelPageCount = 0;
                    excelDataSets.forEach((excelSet, setIndex) => {
                      if (excelSet.data) {
                        try {
                          const excelData = JSON.parse(excelSet.data);
                          if (excelData.length === 0) return;
                          
                          excelPageCount++;
                          const currentPageNum = 2 + excelPageCount;
                          const hasImage = selectedRapor.gorsel_url;
                          const hasOsosTable = selectedRapor.osos_ozet_tablo ? 1 : 0;
                          const totalPages = 2 + excelDataSets.filter(s => s.data).length + hasOsosTable + (hasImage ? 1 : 0);
                          
                          pages.push(
                            <div key={`page-excel-${setIndex}`} className="haftalik-pdf-page shadow-xl" style={{ width: '210mm', height: '297mm', background: 'white', padding: '15mm 20mm 30mm 20mm', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8mm', paddingBottom: '5mm', borderBottom: `2px solid ${excelSet.color}` }}>
                                <div style={{ width: '40mm', maxHeight: '20mm', display: 'flex', alignItems: 'center' }}>
                                  <img src="/fatura_logo.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '20mm', objectFit: 'contain' }} />
                                </div>
                                <div style={{ flex: 1, textAlign: 'right', paddingLeft: '10mm' }}>
                                  <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#2c3e50' }}>{excelSet.title.toUpperCase()} ANALİZ GRAFİĞİ</h2>
                                  <p style={{ fontSize: '11px', color: '#555', margin: '0' }}>{selectedRapor.fabrika_adi} - OBIS Kodu: {excelSet.code}</p>
                                </div>
                              </div>

                              {/* Excel Grafiği - Recharts ile render edilecek */}
                              <div style={{ height: '235mm' }}>
                                <div style={{ marginBottom: '5mm' }}>
                                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', color: excelSet.color, margin: '0 0 3mm 0' }}>Günlük {excelSet.title} Tüketimi</h3>
                                  <ResponsiveContainer width="100%" height={280}>
                                    <RechartsLine data={groupDataByDay(excelData)}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                      <XAxis 
                                        dataKey="gun" 
                                        angle={-45} 
                                        textAnchor="end" 
                                        height={60} 
                                        tick={{ fontSize: 10 }}
                                      />
                                      <YAxis tick={{ fontSize: 10 }} label={{ value: `Tüketim (${excelSet.type === 'aktif' ? 'kWh' : 'kVArh'})`, angle: -90, position: 'insideLeft', style: { fontSize: 10 } }} />
                                      <Tooltip 
                                        contentStyle={{ fontSize: '10px', backgroundColor: '#fff', border: '1px solid #ccc' }}
                                        formatter={(value) => [value.toFixed(2) + ` ${excelSet.type === 'aktif' ? 'kWh' : 'kVArh'}`, 'Tüketim']}
                                      />
                                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                                      <Line type="monotone" dataKey="tuketim" stroke={excelSet.color} strokeWidth={2} dot={{ r: 3 }} name="Günlük Tüketim" />
                                    </RechartsLine>
                                  </ResponsiveContainer>
                                </div>

                                {/* 5 Satırlık Özet Tablo */}
                                <div style={{ marginTop: '8mm' }}>
                                  <h3 style={{ fontSize: '12px', fontWeight: 'bold', color: excelSet.color, margin: '0 0 3mm 0' }}>Detaylı İstatistik Tablosu</h3>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', border: `2px solid ${excelSet.color}` }}>
                                    <thead>
                                      <tr style={{ backgroundColor: excelSet.color, color: 'white' }}>
                                        <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 'bold' }}>Parametre</th>
                                        <th style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>Değer</th>
                                        <th style={{ padding: '6px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 'bold' }}>Açıklama</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 'bold' }}>Toplam Tüketim</td>
                                        <td style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd' }}>{excelData.reduce((sum, d) => sum + (d.tuketim || 0), 0).toFixed(2)} {excelSet.type === 'aktif' ? 'kWh' : 'kVArh'}</td>
                                        <td style={{ padding: '6px', border: '1px solid #ddd', fontSize: '8px' }}>Haftalık toplam {excelSet.title.toLowerCase()}</td>
                                      </tr>
                                      <tr style={{ backgroundColor: 'white' }}>
                                        <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 'bold' }}>Günlük Ortalama</td>
                                        <td style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd' }}>{(groupDataByDay(excelData).reduce((sum, d) => sum + (d.tuketim || 0), 0) / groupDataByDay(excelData).length).toFixed(2)} {excelSet.type === 'aktif' ? 'kWh' : 'kVArh'}</td>
                                        <td style={{ padding: '6px', border: '1px solid #ddd', fontSize: '8px' }}>Günlük ortalama tüketim</td>
                                      </tr>
                                      <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 'bold' }}>Max Günlük Tüketim</td>
                                        <td style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd', color: '#dc2626', fontWeight: 'bold' }}>{Math.max(...groupDataByDay(excelData).map(d => d.tuketim || 0)).toFixed(2)} {excelSet.type === 'aktif' ? 'kWh' : 'kVArh'}</td>
                                        <td style={{ padding: '6px', border: '1px solid #ddd', fontSize: '8px' }}>En yüksek günlük tüketim</td>
                                      </tr>
                                      <tr style={{ backgroundColor: 'white' }}>
                                        <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 'bold' }}>Min Günlük Tüketim</td>
                                        <td style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd', color: '#16a34a' }}>{Math.min(...groupDataByDay(excelData).map(d => d.tuketim || 0)).toFixed(2)} {excelSet.type === 'aktif' ? 'kWh' : 'kVArh'}</td>
                                        <td style={{ padding: '6px', border: '1px solid #ddd', fontSize: '8px' }}>En düşük günlük tüketim</td>
                                      </tr>
                                      <tr style={{ backgroundColor: '#f8fafc' }}>
                                        <td style={{ padding: '6px', border: '1px solid #ddd', fontWeight: 'bold' }}>Gün Sayısı</td>
                                        <td style={{ padding: '6px', textAlign: 'right', border: '1px solid #ddd' }}>{groupDataByDay(excelData).length} gün</td>
                                        <td style={{ padding: '6px', border: '1px solid #ddd', fontSize: '8px' }}>Rapor dönemi gün sayısı (1 hafta = 7 gün)</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <div style={{ position: 'absolute', bottom: '8mm', left: '20mm', right: '20mm', paddingTop: '3mm', borderTop: `2px solid ${excelSet.color}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '8px', color: '#555' }}>
                                  <div style={{ flex: 1 }}>
                                    <p style={{ margin: '0', fontWeight: 'bold', fontSize: '9px' }}>KOBİNERJİ MÜHENDİSLİK</p>
                                    <p style={{ margin: '2px 0 0 0', lineHeight: '1.4' }}>Kemalpaşa O.S.B. Gazi Bulv. Ceran Plaza No:177/19 35170 Kemalpaşa / İzmir</p>
                                    <p style={{ margin: '2px 0 0 0' }}>Tel: +90 535 714 52 88 | www.kobinerji.com</p>
                                  </div>
                                  <p style={{ margin: '0', fontWeight: 'bold', color: excelSet.color, fontSize: '9px' }}>Sayfa {currentPageNum}/{totalPages}</p>
                                </div>
                              </div>
                            </div>
                          );
                        } catch (e) {
                          console.error(`${excelSet.type} Excel data parse error:`, e);
                        }
                      }
                    });

                    // OSOS DETAY TABLOSU SAYFASI (varsa)
                    if (selectedRapor.osos_ozet_tablo) {
                      try {
                        const ososData = JSON.parse(selectedRapor.osos_ozet_tablo);
                        const excelPageCount = excelDataSets.filter(s => s.data).length;
                        const currentPageNum = 2 + excelPageCount + 1;
                        const hasImage = selectedRapor.gorsel_url;
                        const totalPages = 2 + excelPageCount + 1 + (hasImage ? 1 : 0);
                        
                        pages.push(
                          <div key="page-osos-table" className="haftalik-pdf-page shadow-xl" style={{ width: '210mm', height: '297mm', background: 'white', padding: '15mm 20mm 30mm 20mm', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8mm', paddingBottom: '5mm', borderBottom: '2px solid #2980b9' }}>
                              <div style={{ width: '40mm', maxHeight: '20mm', display: 'flex', alignItems: 'center' }}>
                                <img src="/fatura_logo.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '20mm', objectFit: 'contain' }} />
                              </div>
                              <div style={{ flex: 1, textAlign: 'right', paddingLeft: '10mm' }}>
                                <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#2c3e50' }}>OSOS ÖZET TABLO - DETAYLI ANALİZ</h2>
                                <p style={{ fontSize: '10px', color: '#e74c3c', margin: '0 0 3px 0', fontStyle: 'italic' }}>* Bu tablo ayın ilk gününden itibaren kümülatif (toplam) verileri göstermektedir</p>
                                <p style={{ fontSize: '11px', color: '#555', margin: '0' }}>{selectedRapor.fabrika_adi} - Hafta: {new Date(selectedRapor.hafta_baslangic).toLocaleDateString('tr-TR')} - {new Date(selectedRapor.hafta_bitis).toLocaleDateString('tr-TR')}</p>
                              </div>
                            </div>

                            <div style={{ height: '240mm', overflow: 'hidden' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8px', marginTop: '5mm' }}>
                                <thead>
                                  <tr style={{ backgroundColor: '#2980b9', color: 'white' }}>
                                    <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left', fontWeight: 'bold' }}>Endeks Kodu</th>
                                    <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left', fontWeight: 'bold' }}>Açıklama</th>
                                    <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>İlk Endeks</th>
                                    <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>Son Endeks</th>
                                    <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>Endeks Farkı</th>
                                    <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>Çarpan</th>
                                    <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', fontWeight: 'bold' }}>Tüketim</th>
                                    <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>Yasal Sınır</th>
                                    <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', fontWeight: 'bold' }}>Durum</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {ososData.map((row, index) => {
                                    // Önemli satırları vurgula
                                    const isImportant = ['1.8.0', '5.8.0', '8.8.0', '2.8.0'].includes(row.endeks_kodu);
                                    const bgColor = isImportant ? '#e8f4f8' : 'white';
                                    const fontWeight = isImportant ? 'bold' : 'normal';
                                    
                                    return (
                                      <tr key={index} style={{ backgroundColor: bgColor }}>
                                        <td style={{ border: '1px solid #ddd', padding: '5px', fontWeight }}>{row.endeks_kodu}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px', fontSize: '7px' }}>{row.aciklama}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'right' }}>{row.ilk_endeks?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'right' }}>{row.son_endeks?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'right' }}>{row.endeks_farki?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'right' }}>{row.carpan?.toLocaleString('tr-TR')}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'right', fontWeight }}>{row.tuketim?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'center', fontSize: '7px' }}>{row.yasal_sinir || '-'}</td>
                                        <td style={{ border: '1px solid #ddd', padding: '5px', textAlign: 'center', fontSize: '7px', color: row.durum?.includes('AŞILDI') ? '#c0392b' : '#27ae60', fontWeight: row.durum?.includes('AŞILDI') ? 'bold' : 'normal' }}>{row.durum || '-'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>

                              <div style={{ marginTop: '8mm', padding: '8px', background: '#f0f9ff', border: '1px solid #2980b9', borderRadius: '4px' }}>
                                <h3 style={{ fontSize: '11px', fontWeight: 'bold', color: '#2980b9', margin: '0 0 5px 0' }}>Tablo Açıklamaları</h3>
                                <div style={{ fontSize: '8px', lineHeight: '1.6', color: '#2c3e50' }}>
                                  <p style={{ margin: '3px 0' }}><strong>1.8.0 (Aktif Çekilen):</strong> Tesiste tüketilen toplam aktif enerji (kWh)</p>
                                  <p style={{ margin: '3px 0' }}><strong>5.8.0 (Endüktif Reaktif Çekilen):</strong> İndüktif yüklerden kaynaklanan reaktif enerji (kVArh) - Kompanzasyon gerektirir</p>
                                  <p style={{ margin: '3px 0' }}><strong>8.8.0 (Kapasitif Reaktif Çekilen):</strong> Kapasitif yüklerden veya aşırı kompanzasyondan kaynaklanan reaktif enerji (kVArh)</p>
                                  <p style={{ margin: '3px 0' }}><strong>2.8.0 (Aktif Verilen):</strong> Şebekeye verilen enerji (varsa)</p>
                                  <p style={{ margin: '3px 0' }}><strong>Yasal Sınır:</strong> Reaktif enerjinin aktif enerjiye oranı için %20 yasal limit (EPDK)</p>
                                </div>
                              </div>
                            </div>

                            <div style={{ position: 'absolute', bottom: '8mm', left: '20mm', right: '20mm', paddingTop: '3mm', borderTop: '2px solid #2980b9' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '8px', color: '#555' }}>
                                <div style={{ flex: 1 }}>
                                  <p style={{ margin: '0', fontWeight: 'bold', fontSize: '9px' }}>KOBİNERJİ MÜHENDİSLİK</p>
                                  <p style={{ margin: '2px 0 0 0', lineHeight: '1.4' }}>Kemalpaşa O.S.B. Gazi Bulv. Ceran Plaza No:177/19 35170 Kemalpaşa / İzmir</p>
                                  <p style={{ margin: '2px 0 0 0' }}>Tel: +90 535 714 52 88 | www.kobinerji.com</p>
                                </div>
                                <p style={{ margin: '0', fontWeight: 'bold', color: '#2980b9', fontSize: '9px' }}>Sayfa {currentPageNum}/{totalPages}</p>
                              </div>
                            </div>
                          </div>
                        );
                      } catch (e) {
                        console.error('OSOS tablo parse hatası:', e);
                      }
                    }

                    // SON SAYFA: Görsel (varsa)
                    if (selectedRapor.gorsel_url) {
                      const excelPageCount = excelDataSets.filter(s => s.data).length;
                      const hasOsosTable = selectedRapor.osos_ozet_tablo ? 1 : 0;
                      const currentPageNum = 2 + excelPageCount + hasOsosTable + 1;
                      const totalPages = 2 + excelPageCount + hasOsosTable + 1;
                      
                      pages.push(
                        <div key="page-image" className="haftalik-pdf-page shadow-xl" style={{ width: '210mm', height: '297mm', background: 'white', padding: '15mm 20mm 30mm 20mm', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10mm', paddingBottom: '5mm', borderBottom: '2px solid #2980b9' }}>
                            <div style={{ width: '40mm', maxHeight: '20mm', display: 'flex', alignItems: 'center' }}>
                              <img src="/fatura_logo.png" alt="Logo" style={{ maxWidth: '100%', maxHeight: '20mm', objectFit: 'contain' }} />
                            </div>
                            <div style={{ flex: 1, textAlign: 'right', paddingLeft: '10mm' }}>
                              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#2c3e50' }}>SAHA GÖRSELİ / TEKNİK FOTOĞRAF</h2>
                              <p style={{ fontSize: '11px', color: '#555', margin: '0' }}>{selectedRapor.fabrika_adi}</p>
                            </div>
                          </div>

                          <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '10px', background: '#f8fafc', textAlign: 'center' }}>
                            <img src={selectedRapor.gorsel_url} alt="Saha Görseli" style={{ maxWidth: '100%', maxHeight: '220mm', objectFit: 'contain' }} />
                          </div>

                          <div style={{ position: 'absolute', bottom: '8mm', left: '20mm', right: '20mm', paddingTop: '3mm', borderTop: '2px solid #2980b9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '8px', color: '#555' }}>
                              <div style={{ flex: 1 }}>
                                <p style={{ margin: '0', fontWeight: 'bold', fontSize: '9px' }}>KOBİNERJİ MÜHENDİSLİK</p>
                                <p style={{ margin: '2px 0 0 0', lineHeight: '1.4' }}>Kemalpaşa O.S.B. Gazi Bulv. Ceran Plaza No:177/19 35170 Kemalpaşa / İzmir</p>
                                <p style={{ margin: '2px 0 0 0' }}>Tel: +90 535 714 52 88 | www.kobinerji.com</p>
                              </div>
                              <p style={{ margin: '0', fontWeight: 'bold', color: '#2980b9', fontSize: '9px' }}>Sayfa {currentPageNum}/{totalPages}</p>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return pages;
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}