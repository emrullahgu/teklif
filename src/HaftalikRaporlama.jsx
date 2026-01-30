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
  const excelInputRef = useRef(null);

  // Excel Import State'leri
  const [excelData, setExcelData] = useState(null);
  const [showExcelPreview, setShowExcelPreview] = useState(false);
  const [parsedExcelData, setParsedExcelData] = useState([]);
  const [excelColumns, setExcelColumns] = useState([]);
  const [selectedDataColumn, setSelectedDataColumn] = useState('');
  const [selectedEnergyType, setSelectedEnergyType] = useState('aktif');

  // OSOS Özet Tablosu State'leri
  const [ososOzetTablosu, setOsosOzetTablosu] = useState([]);
  const [showOsosTableInput, setShowOsosTableInput] = useState(false);
  const [ososTableText, setOsosTableText] = useState('');

  // İlk Kayıt ve Hesaplama State'leri
  const [ilkKayit, setIlkKayit] = useState(false);
  const [autoCalculateCosPhi, setAutoCalculateCosPhi] = useState(false);

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

  const handleExcelUpload = async (e) => {
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
        
        // Excel kolonlarını al
        const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
        setExcelColumns(columns);
        
        // Otomatik kolon algılama
        let dataColumn = '';
        let energyType = 'aktif';
        
        // Kolonları analiz et
        for (const col of columns) {
          const colLower = col.toLowerCase();
          if (colLower.includes('tüketim') || colLower.includes('tuketim')) {
            dataColumn = col;
            if (colLower.includes('endüktif') || colLower.includes('enduktif') || colLower.includes('induktif')) {
              energyType = 'enduktif';
            } else if (colLower.includes('kapasitif') || colLower.includes('capacitive')) {
              energyType = 'kapasitif';
            } else {
              energyType = 'aktif';
            }
            break;
          }
        }
        
        setSelectedDataColumn(dataColumn);
        setSelectedEnergyType(energyType);
        
        // Excel serial date'i JS Date'e çevir
        const parsedData = jsonData.map(row => {
          const excelDate = row['Tarih'];
          const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
          return {
            tarih: jsDate.toISOString().split('T')[0],
            saat: jsDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            okunan_endeks: row['Okunan Endeks Değeri'] || 0,
            carpan: row['Çarpan'] || 1380,
            hesaplanmis_endeks: row['Hesaplanmış Endeks'] || 0,
            tuketim: row[dataColumn] || 0,
            enerji_turu: energyType,
            raw_data: row // Tüm kolon verisini sakla
          };
        });

        setExcelData(jsonData);
        setParsedExcelData(parsedData);
        setShowExcelPreview(true);
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

      for (const line of lines) {
        // Tab veya çoklu boşluklarla ayrılmış değerleri al
        const parts = line.split(/\t+|\s{2,}/).map(p => p.trim()).filter(p => p);
        
        if (parts.length < 7) continue; // En az 7 kolon olmalı
        
        // Sayıları parse et (Türkçe format: 3.296,18 -> 3296.18)
        const parseNumber = (str) => {
          if (!str || str === 'SQL' || str === 'MAX') return 0;
          return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
        };

        const row = {
          endeks_kodu: parts[0] || '',
          aciklama: parts[1] || '',
          ilk_endeks: parseNumber(parts[2]),
          son_endeks: parseNumber(parts[3]),
          endeks_farki: parseNumber(parts[4]),
          carpan: parseNumber(parts[5]),
          tuketim: parseNumber(parts[6]),
          yasal_sinir: parts[7] || '',
          durum: parts[8] || ''
        };

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

  const applyExcelDataToForm = () => {
    if (parsedExcelData.length === 0) return;

    // İlk ve son tarih
    const firstDate = parsedExcelData[0].tarih;
    const lastDate = parsedExcelData[parsedExcelData.length - 1].tarih;

    // Toplam tüketim
    const totalConsumption = parsedExcelData.reduce((sum, row) => sum + parseFloat(row.tuketim || 0), 0);

    // Ortalama güç (Excel'den hesaplama yapılacak)
    const avgPower = (totalConsumption / parsedExcelData.length).toFixed(2);

    // Enerji türü bilgisini ekle
    const energyTypeText = selectedEnergyType === 'aktif' ? 'Aktif Enerji' : 
                           selectedEnergyType === 'enduktif' ? 'Reaktif Endüktif Enerji' : 
                           'Reaktif Kapasitif Enerji';

    // Form'a verileri aktar
    setFormData(prev => ({
      ...prev,
      hafta_baslangic: firstDate,
      hafta_bitis: lastDate,
      enerji_tuketimi: totalConsumption.toFixed(2),
      aktif_guc: avgPower,
      notlar: `${energyTypeText} verisi Excel'den aktarıldı (${selectedDataColumn})\n${prev.notlar || ''}`,
      // Diğer alanlar mevcut değerlerini korur
    }));

    setShowExcelPreview(false);
    alert(`Excel verileri forma aktarıldı!\nEnerji Türü: ${energyTypeText}\nKolon: ${selectedDataColumn}\n\nLütfen diğer alanları doldurun.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const rapor = {
        ...formData,
        guc_faktoru: parseFloat(formData.guc_faktoru),
        reaktif_guc: parseFloat(formData.reaktif_guc),
        aktif_guc: parseFloat(formData.aktif_guc),
        enerji_tuketimi: parseFloat(formData.enerji_tuketimi),
        maliyet: parseFloat(formData.maliyet),
        onceki_hafta_guc_faktoru: parseFloat(formData.onceki_hafta_guc_faktoru),
        hedef_guc_faktoru: parseFloat(formData.hedef_guc_faktoru),
        gorsel_url: uploadedImage || formData.gorsel_url || null,
        notlar: formData.notlar || null,
        excel_data: parsedExcelData.length > 0 ? JSON.stringify(parsedExcelData) : null,
        excel_enerji_turu: selectedEnergyType,
        excel_kolon: selectedDataColumn,
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
    setFormData({
      fabrika_adi: rapor.fabrika_adi,
      hafta_baslangic: rapor.hafta_baslangic,
      hafta_bitis: rapor.hafta_bitis,
      guc_faktoru: rapor.guc_faktoru,
      reaktif_guc: rapor.reaktif_guc,
      aktif_guc: rapor.aktif_guc,
      kompanzasyon_durumu: rapor.kompanzasyon_durumu,
      enerji_tuketimi: rapor.enerji_tuketimi,
      maliyet: rapor.maliyet,
      onceki_hafta_guc_faktoru: rapor.onceki_hafta_guc_faktoru,
      hedef_guc_faktoru: rapor.hedef_guc_faktoru,
      notlar: rapor.notlar || '',
      gorsel_url: rapor.gorsel_url || ''
    });
    setUploadedImage(rapor.gorsel_url || null);
    
    // Excel verisini yükle
    if (rapor.excel_data) {
      try {
        const parsedData = JSON.parse(rapor.excel_data);
        setParsedExcelData(parsedData);
        
        // Enerji türünü ve kolonu yükle
        if (rapor.excel_enerji_turu) {
          setSelectedEnergyType(rapor.excel_enerji_turu);
        }
        if (rapor.excel_kolon) {
          setSelectedDataColumn(rapor.excel_kolon);
        }
      } catch (e) {
        console.error('Excel verisi parse edilemedi:', e);
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
          scale: 2, // Yüksek kalite için
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
        
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
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
                      <p className="text-xs text-gray-500 mt-1">Önceki: {rapor.onceki_hafta_guc_faktoru}</p>
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
                      <p className="text-sm font-bold text-purple-700">{rapor.reaktif_guc} kVAr</p>
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
                      <p className="text-sm font-bold text-orange-700">{parseFloat(rapor.maliyet).toLocaleString('tr-TR')} ₺</p>
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
                  {rapor.excel_data && (
                    <button
                      onClick={() => {
                        try {
                          const excelData = JSON.parse(rapor.excel_data);
                          setParsedExcelData(excelData);
                          setSelectedRapor(rapor);
                          setShowGrafikModal(true);
                        } catch (e) {
                          alert('Excel verisi okunamadı');
                        }
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Güç Faktörü *</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      required
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
                      Reaktif Güç (kVAr) *
                      <span className="ml-2 text-xs text-gray-500">(Manuel hesap veya OSOS'tan)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.reaktif_guc}
                      onChange={(e) => setFormData({ ...formData, reaktif_guc: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="350"
                    />
                    <p className="mt-1 text-xs text-gray-500">Anlık reaktif güç - genelde faturada yoktur, OSOS verilerinden çıkarılabilir</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Maliyet (₺) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.maliyet}
                      onChange={(e) => setFormData({ ...formData, maliyet: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="75000"
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

                  {/* Excel Veri Yükleme */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        Excel Verileri Yükle (OSOS Detay Raporu)
                      </div>
                    </label>
                    <div className="space-y-3">
                      <input
                        ref={excelInputRef}
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={handleExcelUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => excelInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition"
                      >
                        <Upload className="w-5 h-5 text-green-500" />
                        <span className="text-gray-600">Excel Dosyası Yükle (grdResult.xls formatı)</span>
                      </button>
                      {parsedExcelData.length > 0 && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-sm font-medium text-green-700">
                                {parsedExcelData.length} satır veri yüklendi
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={applyExcelDataToForm}
                              className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition"
                            >
                              Forma Aktar
                            </button>
                          </div>
                        </div>
                      )}
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

        {/* Excel Önizleme Modal */}
        {showExcelPreview && parsedExcelData.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 flex justify-between items-center text-white sticky top-0 z-10 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6" />
                  <h3 className="font-bold text-lg">Excel Veri Önizleme</h3>
                </div>
                <button onClick={() => setShowExcelPreview(false)} className="hover:bg-white/20 p-1 rounded">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6">
                {/* Enerji Türü ve Kolon Seçimi */}
                <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                    Veri Türü Seçimi
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Veri Kolonu
                      </label>
                      <select
                        value={selectedDataColumn}
                        onChange={(e) => {
                          setSelectedDataColumn(e.target.value);
                          // Veriyi yeniden parse et
                          const updatedData = excelData.map(row => {
                            const excelDate = row['Tarih'];
                            const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
                            return {
                              tarih: jsDate.toISOString().split('T')[0],
                              saat: jsDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                              okunan_endeks: row['Okunan Endeks Değeri'] || 0,
                              carpan: row['Çarpan'] || 1380,
                              hesaplanmis_endeks: row['Hesaplanmış Endeks'] || 0,
                              tuketim: row[e.target.value] || 0,
                              enerji_turu: selectedEnergyType,
                              raw_data: row
                            };
                          });
                          setParsedExcelData(updatedData);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {excelColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Excel'de hangi kolon kullanılsın?</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Enerji Türü
                      </label>
                      <select
                        value={selectedEnergyType}
                        onChange={(e) => {
                          setSelectedEnergyType(e.target.value);
                          // Veriyi güncelle
                          const updatedData = parsedExcelData.map(row => ({
                            ...row,
                            enerji_turu: e.target.value
                          }));
                          setParsedExcelData(updatedData);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="aktif">⚡ Aktif Enerji (kWh)</option>
                        <option value="enduktif">🔴 Reaktif Endüktif (kVArh)</option>
                        <option value="kapasitif">🔵 Reaktif Kapasitif (kVArh)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Bu veri hangi enerji türü?</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-200">
                    <p className="text-sm font-semibold text-gray-700">
                      Seçili: <span className="text-indigo-600">{selectedDataColumn}</span> 
                      {selectedEnergyType === 'aktif' && ' (⚡ Aktif Enerji)'}
                      {selectedEnergyType === 'enduktif' && ' (🔴 Reaktif Endüktif)'}
                      {selectedEnergyType === 'kapasitif' && ' (🔵 Reaktif Kapasitif)'}
                    </p>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Toplam Satır</p>
                    <p className="text-2xl font-bold text-blue-600">{parsedExcelData.length}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Toplam Tüketim</p>
                    <p className="text-2xl font-bold text-green-600">
                      {parsedExcelData.reduce((sum, r) => sum + parseFloat(r.tuketim || 0), 0).toFixed(2)} 
                      {selectedEnergyType === 'aktif' ? ' kWh' : ' kVArh'}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Tarih Aralığı</p>
                    <p className="text-sm font-bold text-purple-600">
                      {parsedExcelData[0]?.tarih} - {parsedExcelData[parsedExcelData.length - 1]?.tarih}
                    </p>
                  </div>
                </div>

                {/* Tüketim Grafiği */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold text-gray-700 mb-3">Saatlik Tüketim Grafiği</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={parsedExcelData.slice(0, 50)}>
                      <defs>
                        <linearGradient id="colorTuketim" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="saat" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Area type="monotone" dataKey="tuketim" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorTuketim)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Veri Tablosu */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border p-2 text-left">#</th>
                        <th className="border p-2 text-left">Tarih</th>
                        <th className="border p-2 text-left">Saat</th>
                        <th className="border p-2 text-right">Okunan Endeks</th>
                        <th className="border p-2 text-right">Çarpan</th>
                        <th className="border p-2 text-right">Hesaplanmış Endeks</th>
                        <th className="border p-2 text-right">Tüketim (kWh)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedExcelData.slice(0, 100).map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border p-2">{idx + 1}</td>
                          <td className="border p-2">{row.tarih}</td>
                          <td className="border p-2">{row.saat}</td>
                          <td className="border p-2 text-right">{row.okunan_endeks}</td>
                          <td className="border p-2 text-right">{row.carpan}</td>
                          <td className="border p-2 text-right">{row.hesaplanmis_endeks.toFixed(2)}</td>
                          <td className="border p-2 text-right font-semibold">{row.tuketim.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedExcelData.length > 100 && (
                    <p className="text-center text-sm text-gray-500 mt-2">
                      İlk 100 satır gösteriliyor. Toplam: {parsedExcelData.length} satır
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                  <button
                    onClick={applyExcelDataToForm}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Verileri Forma Aktar</span>
                  </button>
                  <button
                    onClick={() => setShowExcelPreview(false)}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grafik Modal */}
        {showGrafikModal && selectedRapor && parsedExcelData.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex justify-between items-center text-white sticky top-0 z-10 rounded-t-xl">
                <div className="flex items-center gap-2">
                  <LineChart className="w-6 h-6" />
                  <h3 className="font-bold text-lg">Detaylı Tüketim Grafikleri - {selectedRapor.fabrika_adi}</h3>
                </div>
                <button onClick={() => setShowGrafikModal(false)} className="hover:bg-white/20 p-1 rounded">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Enerji Türü Badge */}
                {parsedExcelData.length > 0 && parsedExcelData[0].enerji_turu && (
                  <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg">
                    <p className="text-lg font-bold text-gray-800">
                      Enerji Türü: 
                      {parsedExcelData[0].enerji_turu === 'aktif' && ' ⚡ Aktif Enerji (kWh)'}
                      {parsedExcelData[0].enerji_turu === 'enduktif' && ' 🔴 Reaktif Endüktif (kVArh)'}
                      {parsedExcelData[0].enerji_turu === 'kapasitif' && ' 🔵 Reaktif Kapasitif (kVArh)'}
                    </p>
                  </div>
                )}

                {/* Saatlik Tüketim Grafiği */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border-2 border-blue-200">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Saatlik Enerji Tüketimi {parsedExcelData[0]?.enerji_turu === 'aktif' ? '(kWh)' : '(kVArh)'}
                  </h4>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={parsedExcelData}>
                      <defs>
                        <linearGradient id="colorTuketim2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="saat" fontSize={11} />
                      <YAxis fontSize={11} label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="tuketim" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTuketim2)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Bar Chart - Endeks Değerleri */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    Hesaplanmış Endeks Değerleri
                  </h4>
                  <ResponsiveContainer width="100%" height={350}>
                    <RechartsBar data={parsedExcelData.slice(0, 50)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="saat" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
                      <Bar dataKey="hesaplanmis_endeks" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </RechartsBar>
                  </ResponsiveContainer>
                </div>

                {/* Line Chart - Okunan Endeks */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Okunan Endeks Trendi
                  </h4>
                  <ResponsiveContainer width="100%" height={350}>
                    <RechartsLine data={parsedExcelData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="saat" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
                      <Legend />
                      <Line type="monotone" dataKey="okunan_endeks" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                    </RechartsLine>
                  </ResponsiveContainer>
                </div>

                {/* İstatistikler */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-lg text-center">
                    <p className="text-sm text-orange-700 font-medium">Max Tüketim</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {Math.max(...parsedExcelData.map(d => d.tuketim)).toFixed(2)} kWh
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg text-center">
                    <p className="text-sm text-blue-700 font-medium">Min Tüketim</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {Math.min(...parsedExcelData.map(d => d.tuketim)).toFixed(2)} kWh
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-lg text-center">
                    <p className="text-sm text-green-700 font-medium">Ortalama</p>
                    <p className="text-2xl font-bold text-green-900">
                      {(parsedExcelData.reduce((sum, d) => sum + d.tuketim, 0) / parsedExcelData.length).toFixed(2)} kWh
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-lg text-center">
                    <p className="text-sm text-purple-700 font-medium">Toplam</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {parsedExcelData.reduce((sum, d) => sum + d.tuketim, 0).toFixed(2)} kWh
                    </p>
                  </div>
                </div>

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
                                    <td className="border p-2 text-right">{row.ilk_endeks.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                    <td className="border p-2 text-right">{row.son_endeks.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                    <td className="border p-2 text-right">{row.endeks_farki.toLocaleString('tr-TR', { minimumFractionDigits: 4 })}</td>
                                    <td className="border p-2 text-right">{row.carpan.toLocaleString('tr-TR')}</td>
                                    <td className={`border p-2 text-right ${isMainRow ? 'font-bold text-orange-700' : ''}`}>{row.tuketim.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                    <td className="border p-2 text-center">{row.yasal_sinir}</td>
                                    <td className={`border p-2 text-center font-semibold ${row.durum.includes('%') ? (parseFloat(row.durum.replace('%', '').trim()) > 15 ? 'text-red-600' : 'text-green-600') : ''}`}>{row.durum}</td>
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
                    return null;
                  }
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
                    onClick={handlePDFDownload}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    İndir
                  </button>
                  <button onClick={() => {
                    setShowPdfPreview(false);
                    setSelectedRapor(null);
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
                    const gucFaktoruFark = (parseFloat(selectedRapor.guc_faktoru) - parseFloat(selectedRapor.onceki_hafta_guc_faktoru)) * 100;
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
                            <p style={{ margin: '3px 0', lineHeight: '1.6' }}><strong>Tesis Adı:</strong> {selectedRapor.fabrika_adi}</p>
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
                            Önceki haftaya göre {gucFaktoruFark >= 0 ? <strong style={{ color: '#10b981' }}>artış</strong> : <strong style={{ color: '#ef4444' }}>düşüş</strong>} göstermiştir ({Math.abs(gucFaktoruFark).toFixed(1)}%). 
                            {durum.text === 'UYGUN' ? 
                              <><strong style={{ color: '#10b981' }}> ✓ Performans hedeflerimize uygundur.</strong> Mevcut kompanzasyon sistemi etkin çalışmaktadır.</> : 
                              durum.text === 'DİKKAT' ? 
                              <><strong style={{ color: '#f59e0b' }}> ⚠ Dikkat gerektirir.</strong> Kompanzasyon sistemi gözden geçirilmeli, reaktif enerji cezası riski mevcuttur.</> : 
                              <><strong style={{ color: '#ef4444' }}> ✗ ACİL: Hedefin altındadır.</strong> Kompanzasyon sistemi yetersiz, reaktif enerji cezası alınmaktadır. Hemen iyileştirme gereklidir.</>}
                          </p>
                        </div>

                        <div style={{ marginBottom: '8mm' }}>
                          <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', margin: '0 0 5mm 0', borderBottom: '1px solid #2980b9', paddingBottom: '2mm' }}>ANA PERFORMANS GÖSTERGELERİ</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                            <div style={{ background: '#f0f9ff', border: '2px solid #2980b9', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
                              <p style={{ fontSize: '10px', color: '#555', margin: '0 0 8px 0', fontWeight: '600' }}>GÜÇ FAKTÖRÜ</p>
                              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#2980b9' }}>{selectedRapor.guc_faktoru}</p>
                              <p style={{ fontSize: '9px', color: '#777', margin: '8px 0 0 0', paddingTop: '6px', borderTop: '1px solid #ddd' }}>cosφ</p>
                              <p style={{ fontSize: '9px', color: '#777', margin: '3px 0 0 0' }}>Hedef: {selectedRapor.hedef_guc_faktoru}</p>
                            </div>
                            <div style={{ background: '#f0fdf4', border: '2px solid #10b981', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
                              <p style={{ fontSize: '10px', color: '#555', margin: '0 0 8px 0', fontWeight: '600' }}>AKTİF GÜÇ</p>
                              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#10b981' }}>{selectedRapor.aktif_guc}</p>
                              <p style={{ fontSize: '9px', color: '#777', margin: '8px 0 0 0', paddingTop: '6px', borderTop: '1px solid #ddd' }}>kW</p>
                              <p style={{ fontSize: '9px', color: '#777', margin: '3px 0 0 0' }}>Ortalama</p>
                            </div>
                            <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '8px', padding: '15px', textAlign: 'center' }}>
                              <p style={{ fontSize: '10px', color: '#555', margin: '0 0 8px 0', fontWeight: '600' }}>REAKTİF GÜÇ</p>
                              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#f59e0b' }}>{selectedRapor.reaktif_guc}</p>
                              <p style={{ fontSize: '9px', color: '#777', margin: '8px 0 0 0', paddingTop: '6px', borderTop: '1px solid #ddd' }}>kVAr</p>
                              <p style={{ fontSize: '9px', color: '#777', margin: '3px 0 0 0' }}>Ortalama</p>
                            </div>
                          </div>
                        </div>

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
                                <td style={{ padding: '10px', fontSize: '11px', color: '#64748b', border: '1px solid #e2e8f0' }}>Haftalık toplam tüketim</td>
                              </tr>
                              <tr style={{ background: 'white' }}>
                                <td style={{ padding: '10px', fontSize: '11px', fontWeight: 'bold', color: '#334155', border: '1px solid #e2e8f0' }}>Maliyet</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#1e293b', border: '1px solid #e2e8f0' }}>{parseFloat(selectedRapor.maliyet).toLocaleString('tr-TR')} ₺</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#64748b', border: '1px solid #e2e8f0' }}>Toplam enerji maliyeti</td>
                              </tr>
                              <tr style={{ background: '#f8fafc' }}>
                                <td style={{ padding: '10px', fontSize: '11px', fontWeight: 'bold', color: '#334155', border: '1px solid #e2e8f0', width: '30%' }}>Kompanzasyon Durumu</td>
                                <td colSpan="2" style={{ padding: '10px', fontSize: '11px', color: '#1e293b', border: '1px solid #e2e8f0', width: '70%', wordWrap: 'break-word' }}>{selectedRapor.kompanzasyon_durumu}</td>
                              </tr>
                              <tr style={{ background: 'white' }}>
                                <td style={{ padding: '10px', fontSize: '11px', fontWeight: 'bold', color: '#334155', border: '1px solid #e2e8f0' }}>Önceki Hafta Güç Faktörü</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#1e293b', border: '1px solid #e2e8f0' }}>{selectedRapor.onceki_hafta_guc_faktoru}</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#64748b', border: '1px solid #e2e8f0' }}>Karşılaştırma için</td>
                              </tr>
                              <tr style={{ background: '#f8fafc' }}>
                                <td style={{ padding: '10px', fontSize: '11px', fontWeight: 'bold', color: '#334155', border: '1px solid #e2e8f0' }}>Trend</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#1e293b', border: '1px solid #e2e8f0' }}>{trend.text}</td>
                                <td style={{ padding: '10px', fontSize: '11px', color: '#64748b', border: '1px solid #e2e8f0' }}>{gucFaktoruFark >= 0 ? 'Pozitif yönde' : 'Negatif yönde'}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* OSOS Özet Tablosu */}
                        {selectedRapor.osos_ozet_tablo && (() => {
                          try {
                            const ososData = JSON.parse(selectedRapor.osos_ozet_tablo);
                            return (
                              <div style={{ marginBottom: '8mm' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#2980b9', margin: '0 0 5mm 0', borderBottom: '1px solid #2980b9', paddingBottom: '2mm' }}>OSOS ÖZET TABLOSU - ENDEKS BİLGİLERİ</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd', fontSize: '8px' }}>
                                  <thead>
                                    <tr style={{ background: '#2980b9', color: 'white' }}>
                                      <th style={{ padding: '6px', fontSize: '9px', fontWeight: 'bold', textAlign: 'left', border: '1px solid #ddd' }}>Kod</th>
                                      <th style={{ padding: '6px', fontSize: '9px', fontWeight: 'bold', textAlign: 'left', border: '1px solid #ddd' }}>Açıklama</th>
                                      <th style={{ padding: '6px', fontSize: '9px', fontWeight: 'bold', textAlign: 'right', border: '1px solid #ddd' }}>İlk Endeks</th>
                                      <th style={{ padding: '6px', fontSize: '9px', fontWeight: 'bold', textAlign: 'right', border: '1px solid #ddd' }}>Son Endeks</th>
                                      <th style={{ padding: '6px', fontSize: '9px', fontWeight: 'bold', textAlign: 'right', border: '1px solid #ddd' }}>Fark</th>
                                      <th style={{ padding: '6px', fontSize: '9px', fontWeight: 'bold', textAlign: 'right', border: '1px solid #ddd' }}>Çarpan</th>
                                      <th style={{ padding: '6px', fontSize: '9px', fontWeight: 'bold', textAlign: 'right', border: '1px solid #ddd' }}>Tüketim</th>
                                      <th style={{ padding: '6px', fontSize: '9px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #ddd' }}>Yasal Sınır</th>
                                      <th style={{ padding: '6px', fontSize: '9px', fontWeight: 'bold', textAlign: 'center', border: '1px solid #ddd' }}>Durum</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ososData.map((row, idx) => {
                                      const isMainRow = ['1.8.0', '5.8.0', '8.8.0'].includes(row.endeks_kodu);
                                      return (
                                        <tr key={idx} style={{ background: isMainRow ? '#fff3cd' : (idx % 2 === 0 ? '#f8fafc' : 'white') }}>
                                          <td style={{ padding: '6px', fontSize: '9px', fontWeight: isMainRow ? 'bold' : 'normal', color: '#1e293b', border: '1px solid #e2e8f0' }}>{row.endeks_kodu}</td>
                                          <td style={{ padding: '6px', fontSize: '9px', fontWeight: isMainRow ? 'bold' : 'normal', color: '#1e293b', border: '1px solid #e2e8f0' }}>{row.aciklama}</td>
                                          <td style={{ padding: '6px', fontSize: '9px', color: '#1e293b', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.ilk_endeks.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                          <td style={{ padding: '6px', fontSize: '9px', color: '#1e293b', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.son_endeks.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                          <td style={{ padding: '6px', fontSize: '9px', color: '#1e293b', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.endeks_farki.toLocaleString('tr-TR', { minimumFractionDigits: 4 })}</td>
                                          <td style={{ padding: '6px', fontSize: '9px', color: '#1e293b', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.carpan.toLocaleString('tr-TR')}</td>
                                          <td style={{ padding: '6px', fontSize: '9px', fontWeight: isMainRow ? 'bold' : 'normal', color: isMainRow ? '#d97706' : '#1e293b', border: '1px solid #e2e8f0', textAlign: 'right' }}>{row.tuketim.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                                          <td style={{ padding: '6px', fontSize: '9px', color: '#1e293b', border: '1px solid #e2e8f0', textAlign: 'center' }}>{row.yasal_sinir}</td>
                                          <td style={{ padding: '6px', fontSize: '9px', color: row.durum.includes('%') ? (parseFloat(row.durum.replace('%', '').trim()) > 15 ? '#dc2626' : '#16a34a') : '#1e293b', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: row.durum.includes('%') ? 'bold' : 'normal' }}>{row.durum}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                                <div style={{ marginTop: '3mm', padding: '5px', background: '#f0f9ff', border: '1px solid #2980b9', borderRadius: '4px', fontSize: '8px' }}>
                                  <p style={{ margin: '0', lineHeight: '1.4' }}>
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
                            return null;
                          }
                        })()}

                        <div style={{ position: 'absolute', bottom: '8mm', left: '20mm', right: '20mm', paddingTop: '3mm', borderTop: '2px solid #2980b9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '8px', color: '#555' }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: '0', fontWeight: 'bold', fontSize: '9px' }}>KOBİNERJİ MÜHENDİSLİK</p>
                              <p style={{ margin: '2px 0 0 0', lineHeight: '1.4' }}>Kemalpaşa O.S.B. Gazi Bulv. Ceran Plaza No:177/19 35170 Kemalpaşa / İzmir</p>
                              <p style={{ margin: '2px 0 0 0' }}>Tel: +90 535 714 52 88 | www.kobinerji.com</p>
                            </div>
                            <p style={{ margin: '0', fontWeight: 'bold', color: '#2980b9', fontSize: '9px' }}>Sayfa 1/{selectedRapor.gorsel_url ? '3' : '2'}</p>
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
                            <p style={{ margin: '0', fontWeight: 'bold', color: '#2980b9', fontSize: '9px' }}>Sayfa 2/{selectedRapor.gorsel_url ? '3' : '2'}</p>
                          </div>
                        </div>
                      </div>
                    );

                    // SAYFA 3: Görsel (varsa)
                    if (selectedRapor.gorsel_url) {
                      pages.push(
                        <div key="page-3" className="haftalik-pdf-page shadow-xl" style={{ width: '210mm', height: '297mm', background: 'white', padding: '15mm 20mm 30mm 20mm', fontFamily: 'Arial, sans-serif', position: 'relative', boxSizing: 'border-box', overflow: 'hidden' }}>
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
                              <p style={{ margin: '0', fontWeight: 'bold', color: '#2980b9', fontSize: '9px' }}>Sayfa 3/3</p>
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