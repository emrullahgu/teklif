import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit3, Trash2, Save, X, Download, FileDown, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Calendar, BarChart3, PieChart, Activity, Upload, Image as ImageIcon, Zap, Building2 } from 'lucide-react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function HaftalikRaporlama() {
  const [raporlar, setRaporlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const pdfPreviewRef = useRef(null);
  const [selectedRapor, setSelectedRapor] = useState(null);

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
    gorsel_url: '',
    rapor_hazırlayan: '',
    onaylayan: ''
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const fileInputRef = useRef(null);

  // Filtreleme
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
      alert('Veriler yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Base64'e çevir
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result);
      setFormData({ ...formData, gorsel_url: reader.result });
    };
    reader.readAsDataURL(file);
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
        gorsel_url: uploadedImage || formData.gorsel_url || null
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
      gorsel_url: rapor.gorsel_url || '',
      rapor_hazırlayan: rapor.rapor_hazırlayan || '',
      onaylayan: rapor.onaylayan || ''
    });
    setUploadedImage(rapor.gorsel_url || null);
    setEditingId(rapor.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu raporu silmek istediğinize emin misiniz?')) return;
    
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
    // Bu haftanın Pazartesi ve Pazar tarihlerini hesapla
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
    const monday = new Date(today);
    const sunday = new Date(today);
    
    // Pazartesi'ye git (dayOfWeek === 0 ise Pazar, -6 gün; dayOfWeek === 1 ise Pazartesi, 0 gün)
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + daysToMonday);
    
    // Pazar'a git (Pazartesiden +6 gün)
    sunday.setDate(monday.getDate() + 6);
    
    // YYYY-MM-DD formatına çevir
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
      kompanzasyon_durumu: '',
      enerji_tuketimi: '',
      maliyet: '',
      onceki_hafta_guc_faktoru: '',
      hedef_guc_faktoru: '0.95',
      notlar: '',
      gorsel_url: '',
      rapor_hazırlayan: '',
      onaylayan: ''
    });
    setUploadedImage(null);
  };

  const handleYeniRapor = async () => {
    setEditingId(null);
    resetForm();
    
    // Son rapordan önceki hafta güç faktörünü al
    if (raporlar.length > 0) {
      const sonRapor = raporlar[0]; // En son rapor (zaten tarihe göre sıralı)
      setFormData(prev => ({
        ...prev,
        onceki_hafta_guc_faktoru: sonRapor.guc_faktoru,
        fabrika_adi: sonRapor.fabrika_adi // Aynı fabrika için devam et
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

  const exportToPDF = async (rapor) => {
    const targetWidthPx = 793;
    const SCALE_FACTOR = 2;
    
    try {
      // Loading indicator ekle
      const loadingDiv = document.createElement('div');
      loadingDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center; flex-direction: column;">
          <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
            <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 20px; font-size: 16px; font-weight: bold;">PDF oluşturuluyor...</p>
            <p style="margin-top: 10px; font-size: 14px; color: #666;">Lütfen bekleyin</p>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      document.body.appendChild(loadingDiv);
      
      // Logo yükle ve base64'e çevir (boyutlarıyla birlikte)
      const loadLogo = async () => {
        return new Promise((resolve) => {
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
          img.onerror = () => {
            resolve({
              data: '',
              width: 0,
              height: 0
            });
          };
          img.src = '/fatura_logo.png';
        });
      };

      const logoInfo = await loadLogo();
      
      // Logo boyutlarını hesapla (aspect ratio koruyarak)
      const maxLogoWidth = 60; // mm
      const maxLogoHeight = 24; // mm
      let logoWidth = 0;
      let logoHeight = 0;
      
      if (logoInfo.width > 0 && logoInfo.height > 0) {
        const logoAspectRatio = logoInfo.width / logoInfo.height;
        logoWidth = maxLogoWidth;
        logoHeight = logoWidth / logoAspectRatio;
        
        if (logoHeight > maxLogoHeight) {
          logoHeight = maxLogoHeight;
          logoWidth = logoHeight * logoAspectRatio;
        }
      }

      setSelectedRapor(rapor);
      setShowPdfPreview(true);
      
      // React component'in render olması için kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const element = pdfPreviewRef.current;
      if (!element) {
        alert('PDF önizleme yüklenemedi!');
        document.body.removeChild(loadingDiv);
        setShowPdfPreview(false);
        setSelectedRapor(null);
        return;
      }

      // Logoları gizle
      const logos = element.querySelectorAll('.pdf-logo');
      logos.forEach(logo => { logo.style.visibility = 'hidden'; });

      // Geçici stil ayarları
      const originalWidth = element.style.width;
      const originalMargin = element.style.margin;
      const originalBoxShadow = element.style.boxShadow;
      
      element.style.width = '210mm';
      element.style.margin = '0 auto';
      element.style.boxShadow = 'none';
      element.classList.add('pdf-exporting');

      // html2canvas ile component'i görüntüye çevir
      const canvas = await html2canvas(element, {
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
      
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      });
      
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Görüntüyü ekle
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST');
      
      // Logo ekle
      if (logoInfo.data && logoWidth > 0 && logoHeight > 0) {
        pdf.addImage(logoInfo.data, 'PNG', 10, 10, logoWidth, logoHeight, '', 'FAST');
      }

      const fileName = `haftalik_rapor_${rapor.fabrika_adi}_${rapor.hafta_baslangic}.pdf`;
      pdf.save(fileName);
      
      // Logoları tekrar göster
      logos.forEach(logo => { logo.style.visibility = 'visible'; });

      // Stil ayarlarını geri al
      element.style.width = originalWidth;
      element.style.margin = originalMargin;
      element.style.boxShadow = originalBoxShadow;
      element.classList.remove('pdf-exporting');
      
      // Loading indicator'ı kaldır
      document.body.removeChild(loadingDiv);
      
      setShowPdfPreview(false);
      setSelectedRapor(null);
      
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      
      // Loading indicator'ı kaldır
      const loadingDiv = document.querySelector('[style*="z-index: 10000"]');
      if (loadingDiv && document.body.contains(loadingDiv)) {
        document.body.removeChild(loadingDiv);
      }
      
      alert('PDF oluşturulurken bir hata oluştu: ' + error.message);
      setShowPdfPreview(false);
      setSelectedRapor(null);
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
      return { icon: Activity, color: 'text-gray-600', text: 'Sabit' };
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

  const fabrikalar = [...new Set(raporlar.map(r => r.fabrika_adi))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
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
          <div className="flex items-center justify-between mb-4">
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
                <p className="text-sm font-medium opacity-90 mb-1">Ort. Güç Faktörü</p>
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
              <div key={rapor.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
                {/* Header */}
                <div className={`p-4 ${durum.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{rapor.fabrika_adi}</h3>
                    <DurumIcon className={`w-6 h-6 ${durum.textColor}`} />
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(rapor.hafta_baslangic).toLocaleDateString('tr-TR')} - {new Date(rapor.hafta_bitis).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Güç Faktörü */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500">Güç Faktörü</p>
                      <p className="text-2xl font-bold text-indigo-600">{rapor.guc_faktoru}</p>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center gap-1 ${trend.color}`}>
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
                    <p className="text-sm font-semibold text-gray-800">{rapor.kompanzasyon_durumu}</p>
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
                  <div className={`p-3 rounded-lg text-center font-bold ${durum.bg} ${durum.textColor}`}>
                    {durum.text}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() => exportToPDF(rapor)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
                  >
                    <FileDown className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleEdit(rapor)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm"
                  >
                    <Edit3 className="w-4 h-4" />
                    Düzenle
                  </button>
                  <button
                    onClick={() => handleDelete(rapor.id)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filtreliRaporlar.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Henüz rapor eklenmemiş</p>
            <p className="text-gray-400 text-sm mt-2">Yeni rapor eklemek için yukarıdaki butonu kullanın</p>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
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
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      required
                      value={formData.guc_faktoru}
                      onChange={(e) => setFormData({ ...formData, guc_faktoru: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0.920"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Önceki Hafta Güç Faktörü *</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      max="1"
                      required
                      value={formData.onceki_hafta_guc_faktoru}
                      onChange={(e) => setFormData({ ...formData, onceki_hafta_guc_faktoru: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="0.910"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aktif Güç (kW) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.aktif_guc}
                      onChange={(e) => setFormData({ ...formData, aktif_guc: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="1500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reaktif Güç (kVAr) *</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enerji Tüketimi (kWh) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.enerji_tuketimi}
                      onChange={(e) => setFormData({ ...formData, enerji_tuketimi: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="25000"
                    />
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

                  {/* Rapor Hazırlayan ve Onaylayan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rapor Hazırlayan</label>
                    <input
                      type="text"
                      value={formData.rapor_hazırlayan}
                      onChange={(e) => setFormData({ ...formData, rapor_hazırlayan: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Örn: Ahmet Yılmaz"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Onaylayan</label>
                    <input
                      type="text"
                      value={formData.onaylayan}
                      onChange={(e) => setFormData({ ...formData, onaylayan: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Örn: Mehmet Demir - Genel Müdür"
                    />
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

        {/* PDF Preview Modal */}
        {showPdfPreview && selectedRapor && (
          <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <div ref={pdfPreviewRef} style={{ width: '210mm', minHeight: '297mm', backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif', position: 'relative' }}>
              <div style={{ padding: '15mm' }}>
                {/* Header - Logo ve Başlık */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15mm', paddingBottom: '5mm', borderBottom: '2px solid #2563eb' }}>
                  <div>
                    <img src="/fatura_logo.png" alt="Logo" className="pdf-logo" style={{ height: '40px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h1 style={{ fontSize: '21.6px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#1e3a8a' }}>HAFTALIK ENERJİ RAPORU</h1>
                    <p style={{ fontSize: '10.8px', color: '#6b7280', margin: '2px 0' }}>
                      Dönem: {new Date(selectedRapor.hafta_baslangic).toLocaleDateString('tr-TR')} - {new Date(selectedRapor.hafta_bitis).toLocaleDateString('tr-TR')}
                    </p>
                    <p style={{ fontSize: '10.8px', color: '#6b7280', margin: '2px 0' }}>
                      Rapor No: HFT-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}-{String(new Date().getDate()).padStart(2, '0')}
                    </p>
                  </div>
                </div>

                {/* Fabrika ve Durum */}
                <div style={{ marginBottom: '10mm' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '8mm', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 3px 0' }}>Tesis</p>
                      <h2 style={{ fontSize: '19.2px', fontWeight: 'bold', margin: '0', color: '#0f172a' }}>{selectedRapor.fabrika_adi}</h2>
                    </div>
                    <div style={{ 
                      padding: '6px 18px', 
                      borderRadius: '20px', 
                      fontSize: '13.2px', 
                      fontWeight: 'bold',
                      backgroundColor: getDurum(selectedRapor).text === 'UYGUN' ? '#10b981' : getDurum(selectedRapor).text === 'DİKKAT' ? '#f59e0b' : '#ef4444',
                      color: 'white'
                    }}>
                      {getDurum(selectedRapor).text}
                    </div>
                  </div>
                </div>

                {/* Ana Metrikler */}
                <div style={{ marginBottom: '10mm' }}>
                  <h3 style={{ fontSize: '14.4px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 4mm 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Enerji Metrikleri</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5mm' }}>
                    {/* Güç Faktörü */}
                    <div style={{ backgroundColor: '#ffffff', border: '2px solid #2563eb', borderRadius: '4px', padding: '5mm', textAlign: 'center' }}>
                      <p style={{ fontSize: '10.8px', color: '#64748b', margin: '0 0 3mm 0', fontWeight: '600' }}>GÜÇ FAKTÖRÜ (cosφ)</p>
                      <p style={{ fontSize: '33.6px', fontWeight: 'bold', margin: '0', color: '#1e3a8a' }}>{selectedRapor.guc_faktoru}</p>
                      <div style={{ marginTop: '3mm', paddingTop: '3mm', borderTop: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '9.6px', color: '#64748b', margin: '0' }}>Hedef: {selectedRapor.hedef_guc_faktoru}</p>
                      </div>
                    </div>
                    {/* Aktif Güç */}
                    <div style={{ backgroundColor: '#ffffff', border: '2px solid #10b981', borderRadius: '4px', padding: '5mm', textAlign: 'center' }}>
                      <p style={{ fontSize: '10.8px', color: '#64748b', margin: '0 0 3mm 0', fontWeight: '600' }}>AKTİF GÜÇ</p>
                      <p style={{ fontSize: '33.6px', fontWeight: 'bold', margin: '0', color: '#059669' }}>{selectedRapor.aktif_guc}</p>
                      <div style={{ marginTop: '3mm', paddingTop: '3mm', borderTop: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '9.6px', color: '#64748b', margin: '0' }}>kW</p>
                      </div>
                    </div>
                    {/* Reaktif Güç */}
                    <div style={{ backgroundColor: '#ffffff', border: '2px solid #f59e0b', borderRadius: '4px', padding: '5mm', textAlign: 'center' }}>
                      <p style={{ fontSize: '10.8px', color: '#64748b', margin: '0 0 3mm 0', fontWeight: '600' }}>REAKTİF GÜÇ</p>
                      <p style={{ fontSize: '33.6px', fontWeight: 'bold', margin: '0', color: '#d97706' }}>{selectedRapor.reaktif_guc}</p>
                      <div style={{ marginTop: '3mm', paddingTop: '3mm', borderTop: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '9.6px', color: '#64748b', margin: '0' }}>kVAr</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performans Tablosu */}
                <div style={{ marginBottom: '10mm' }}>
                  <h3 style={{ fontSize: '14.4px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 4mm 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Performans Detayları</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0' }}>
                    <tbody>
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td style={{ padding: '3mm 4mm', fontSize: '10.8px', fontWeight: 'bold', color: '#475569', border: '1px solid #e2e8f0' }}>Kompanzasyon Durumu</td>
                        <td style={{ padding: '3mm 4mm', fontSize: '12px', color: '#0f172a', border: '1px solid #e2e8f0' }}>{selectedRapor.kompanzasyon_durumu}</td>
                      </tr>
                      <tr style={{ backgroundColor: '#ffffff' }}>
                        <td style={{ padding: '3mm 4mm', fontSize: '10.8px', fontWeight: 'bold', color: '#475569', border: '1px solid #e2e8f0' }}>Enerji Tüketimi</td>
                        <td style={{ padding: '3mm 4mm', fontSize: '12px', color: '#0f172a', border: '1px solid #e2e8f0' }}>{selectedRapor.enerji_tuketimi} kWh</td>
                      </tr>
                      <tr style={{ backgroundColor: '#f8fafc' }}>
                        <td style={{ padding: '3mm 4mm', fontSize: '10.8px', fontWeight: 'bold', color: '#475569', border: '1px solid #e2e8f0' }}>Önceki Hafta Güç Faktörü</td>
                        <td style={{ padding: '3mm 4mm', fontSize: '12px', color: '#0f172a', border: '1px solid #e2e8f0' }}>{selectedRapor.onceki_hafta_guc_faktoru}</td>
                      </tr>
                      <tr style={{ backgroundColor: '#ffffff' }}>
                        <td style={{ padding: '3mm 4mm', fontSize: '10.8px', fontWeight: 'bold', color: '#475569', border: '1px solid #e2e8f0' }}>Trend</td>
                        <td style={{ padding: '3mm 4mm', fontSize: '12px', color: '#0f172a', border: '1px solid #e2e8f0' }}>{getTrend(selectedRapor).text}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Görsel */}
                {selectedRapor.gorsel_url && (
                  <div style={{ marginBottom: '10mm' }}>
                    <h3 style={{ fontSize: '14.4px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 4mm 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saha Görseli</h3>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '5mm', backgroundColor: '#f8fafc', textAlign: 'center' }}>
                      <img 
                        src={selectedRapor.gorsel_url} 
                        alt="Saha görseli" 
                        style={{ maxWidth: '100%', maxHeight: '120mm', objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                )}

                {/* Notlar */}
                {selectedRapor.notlar && (
                  <div style={{ marginBottom: '10mm' }}>
                    <h3 style={{ fontSize: '14.4px', fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 4mm 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notlar</h3>
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '5mm', backgroundColor: '#fffbeb' }}>
                      <p style={{ fontSize: '10.8px', color: '#422006', margin: '0', lineHeight: '1.6' }}>{selectedRapor.notlar}</p>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div style={{ position: 'absolute', bottom: '15mm', left: '15mm', right: '15mm', paddingTop: '5mm', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '9.6px', color: '#64748b', margin: '0' }}>
                      © KOBİNERJİ - Enerji Yönetim Sistemi
                    </p>
                    <p style={{ fontSize: '9.6px', color: '#64748b', margin: '0' }}>
                      {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}