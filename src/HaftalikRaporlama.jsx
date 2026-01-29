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
    setFormData({
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
    setUploadedImage(null);
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
      const maxLogoWidth = 60; // mm
      const maxLogoHeight = 24; // mm
      const logoAspectRatio = logoInfo.width / logoInfo.height;
      let logoWidth = maxLogoWidth;
      let logoHeight = logoWidth / logoAspectRatio;
      
      if (logoHeight > maxLogoHeight) {
        logoHeight = maxLogoHeight;
        logoWidth = logoHeight * logoAspectRatio;
      }

      setSelectedRapor(rapor);
      setShowPdfPreview(true);
      
      // React component'in render olması için kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const element = pdfPreviewRef.current;
      if (!element) {
        alert('PDF önizleme yüklenemedi!');
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
      
      const imgWidth = 210; // A4 genişlik mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297; // A4 yükseklik mm

      // İlk sayfayı ekle
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST');
      
      // Logo'yu yüksek kalitede ekle (sol üst köşe, aspect ratio korunarak)
      pdf.addImage(logoInfo.data, 'PNG', 10, 10, logoWidth, logoHeight, '', 'FAST');

      // Eğer içerik bir sayfadan fazlaysa, otomatik olarak ikinci sayfa ekle
      if (imgHeight > pageHeight) {
        let position = -pageHeight;
        while (position > -imgHeight) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
          pdf.addImage(logoInfo.data, 'PNG', 10, 10, logoWidth, logoHeight, '', 'FAST'); // Her sayfada logo
          position -= pageHeight;
        }
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
      
      setShowPdfPreview(false);
      setSelectedRapor(null);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
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
                onClick={() => { 
                  setShowModal(true); 
                  setEditingId(null); 
                  resetForm(); 
                }}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hafta Başlangıç *</label>
                    <input
                      type="date"
                      required
                      value={formData.hafta_baslangic}
                      onChange={(e) => setFormData({ ...formData, hafta_baslangic: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hafta Bitiş *</label>
                    <input
                      type="date"
                      required
                      value={formData.hafta_bitis}
                      onChange={(e) => setFormData({ ...formData, hafta_bitis: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
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
            <div ref={pdfPreviewRef} style={{ width: '210mm', backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
              <div style={{ padding: '10mm', paddingBottom: '12mm' }}>
                {/* Header with Logo and Report Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #9ca3af', paddingBottom: '12px', marginBottom: '15px' }}>
                  <div style={{ minWidth: '150px' }}>
                    <img src="/fatura_logo.png" alt="Logo" className="pdf-logo" style={{ height: '45px', maxWidth: '140px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ backgroundColor: '#f3f4f6', padding: '6px 12px', borderRadius: '4px', border: '1px solid #e5e7eb', height: '45px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <p style={{ fontSize: '8px', color: '#374151', margin: '1px 0', fontWeight: '600' }}>
                        Rapor No: HFT-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}-{String(new Date().getDate()).padStart(2, '0')}
                      </p>
                      <p style={{ fontSize: '8px', color: '#6b7280', margin: '1px 0' }}>
                        Tarih: {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p style={{ fontSize: '8px', color: '#6b7280', margin: '1px 0' }}>
                        Dönem: {new Date(selectedRapor.hafta_baslangic).toLocaleDateString('tr-TR')} - {new Date(selectedRapor.hafta_bitis).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fabrika Bilgisi - Prominent */}
                <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '15px 18px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #059669' }}>
                  <h2 style={{ fontSize: '13.5px', fontWeight: 'bold', margin: '0 0 5px 0', letterSpacing: '0.3px' }}>{selectedRapor.fabrika_adi}</h2>
                  <p style={{ fontSize: '8.25px', margin: '0', opacity: 0.9 }}>
                    Haftalık Performans Değerlendirme Raporu
                  </p>
                </div>

                {/* Durum Badge - Large and Clear */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <div style={{ 
                    padding: '10px 30px', 
                    borderRadius: '4px', 
                    fontSize: '14px', 
                    fontWeight: 'bold',
                    backgroundColor: getDurum(selectedRapor).text === 'UYGUN' ? '#059669' : getDurum(selectedRapor).text === 'DİKKAT' ? '#d97706' : '#dc2626',
                    color: 'white',
                    textAlign: 'center',
                    letterSpacing: '1px'
                  }}>
                    {getDurum(selectedRapor).text}
                  </div>
                </div>

                {/* Özet Bilgiler - Enhanced Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ padding: '10px', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'center' }}>
                    <p style={{ fontSize: '8px', marginBottom: '5px', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Güç Faktörü (cosφ)</p>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: '#1f2937' }}>{selectedRapor.guc_faktoru}</p>
                    <p style={{ fontSize: '7px', marginTop: '3px', color: '#6b7280' }}>Hedef: {selectedRapor.hedef_guc_faktoru}</p>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'center' }}>
                    <p style={{ fontSize: '8px', marginBottom: '5px', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Aktif Güç</p>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: '#1f2937' }}>{selectedRapor.aktif_guc}</p>
                    <p style={{ fontSize: '7px', marginTop: '3px', color: '#6b7280' }}>kW</p>
                  </div>
                  <div style={{ padding: '10px', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '4px', textAlign: 'center' }}>
                    <p style={{ fontSize: '8px', marginBottom: '5px', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Reaktif Güç</p>
                    <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', color: '#1f2937' }}>{selectedRapor.reaktif_guc}</p>
                    <p style={{ fontSize: '7px', marginTop: '3px', color: '#6b7280' }}>kVAr</p>
                  </div>
                </div>

                {/* Uploaded Image Section */}
                {selectedRapor.gorsel_url && (
                  <div style={{ marginBottom: '12px', border: '1px solid #d1d5db', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '6px 10px', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.3px' }}>
                      SAHA GÖRSELİ / TEKNİK FOTOĞRAF
                    </div>
                    <div style={{ padding: '10px', backgroundColor: '#f9fafb' }}>
                      <img 
                        src={selectedRapor.gorsel_url} 
                        alt="Saha görseli" 
                        style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '4px', backgroundColor: 'white' }}
                      />
                    </div>
                  </div>
                )}

                {/* Detaylı Bilgiler Table - Enhanced */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '6px 10px', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.3px', borderRadius: '4px 4px 0 0' }}>
                    DETAYLI PERFORMANS VERİLERİ
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    <tbody>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#374151' }}>
                          Kompanzasyon Durumu
                        </td>
                        <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', color: '#1f2937', fontWeight: '600' }}>{selectedRapor.kompanzasyon_durumu}</td>
                      </tr>
                      <tr style={{ backgroundColor: 'white' }}>
                        <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#374151' }}>
                          Enerji Tüketimi
                        </td>
                        <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', color: '#1f2937', fontWeight: '600' }}>{selectedRapor.enerji_tuketimi} kWh</td>
                      </tr>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#374151' }}>
                          Önceki Hafta Güç Faktörü
                        </td>
                        <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', color: '#1f2937', fontWeight: '600' }}>{selectedRapor.onceki_hafta_guc_faktoru}</td>
                      </tr>
                      <tr style={{ backgroundColor: 'white' }}>
                        <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#374151' }}>
                          Trend Durumu
                        </td>
                        <td style={{ padding: '8px 10px', border: '1px solid #e5e7eb', color: '#1f2937', fontWeight: '600' }}>
                          {getTrend(selectedRapor).text}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Grafik Gösterimleri */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '6px 10px', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.3px', borderRadius: '4px 4px 0 0' }}>
                    GRAFİK ANALİZLER
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '12px', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
                    
                    {/* Güç Faktörü Progress Bar */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#374151' }}>Güç Faktörü Durumu</span>
                        <span style={{ fontSize: '8px', color: '#6b7280' }}>{selectedRapor.guc_faktoru} / {selectedRapor.hedef_guc_faktoru}</span>
                      </div>
                      <div style={{ width: '100%', height: '18px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden', position: 'relative', border: '1px solid #d1d5db' }}>
                        <div style={{ 
                          width: `${(parseFloat(selectedRapor.guc_faktoru) / parseFloat(selectedRapor.hedef_guc_faktoru)) * 100}%`, 
                          height: '100%', 
                          backgroundColor: parseFloat(selectedRapor.guc_faktoru) >= parseFloat(selectedRapor.hedef_guc_faktoru) 
                            ? '#059669' 
                            : parseFloat(selectedRapor.guc_faktoru) >= parseFloat(selectedRapor.hedef_guc_faktoru) - 0.05
                            ? '#d97706'
                            : '#dc2626',
                          borderRadius: '15px',
                          transition: 'width 0.3s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: '10px'
                        }}>
                          <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'white' }}>
                            {((parseFloat(selectedRapor.guc_faktoru) / parseFloat(selectedRapor.hedef_guc_faktoru)) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Haftalık Karşılaştırma - Bar Chart */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Haftalık Performans Karşılaştırması</div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', height: '80px' }}>
                        {/* Önceki Hafta */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <div style={{ 
                            width: '100%', 
                            height: `${(parseFloat(selectedRapor.onceki_hafta_guc_faktoru) / 1) * 70}px`,
                            backgroundColor: '#94a3b8',
                            borderRadius: '3px 3px 0 0',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            paddingTop: '6px',
                            border: '1px solid #64748b'
                          }}>
                            <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'white' }}>{selectedRapor.onceki_hafta_guc_faktoru}</span>
                          </div>
                          <div style={{ fontSize: '8px', color: '#64748b', marginTop: '4px', textAlign: 'center', fontWeight: '600' }}>Önceki Hafta</div>
                        </div>
                        
                        {/* Bu Hafta */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <div style={{ 
                            width: '100%', 
                            height: `${(parseFloat(selectedRapor.guc_faktoru) / 1) * 70}px`,
                            backgroundColor: parseFloat(selectedRapor.guc_faktoru) >= parseFloat(selectedRapor.hedef_guc_faktoru)
                              ? '#059669'
                              : '#d97706',
                            borderRadius: '3px 3px 0 0',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            paddingTop: '6px',
                            border: parseFloat(selectedRapor.guc_faktoru) >= parseFloat(selectedRapor.hedef_guc_faktoru)
                              ? '1px solid #047857'
                              : '1px solid #b45309',
                            position: 'relative'
                          }}>
                            <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'white' }}>{selectedRapor.guc_faktoru}</span>
                          </div>
                          <div style={{ fontSize: '8px', color: '#1f2937', marginTop: '4px', textAlign: 'center', fontWeight: 'bold' }}>Bu Hafta</div>
                        </div>

                        {/* Hedef */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <div style={{ 
                            width: '100%', 
                            height: `${(parseFloat(selectedRapor.hedef_guc_faktoru) / 1) * 70}px`,
                            backgroundColor: '#6b7280',
                            borderRadius: '3px 3px 0 0',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            paddingTop: '6px',
                            border: '1px dashed #4b5563'
                          }}>
                            <span style={{ fontSize: '9px', fontWeight: 'bold', color: 'white' }}>{selectedRapor.hedef_guc_faktoru}</span>
                          </div>
                          <div style={{ fontSize: '8px', color: '#4b5563', marginTop: '4px', textAlign: 'center', fontWeight: 'bold' }}>Hedef</div>
                        </div>
                      </div>
                    </div>

                    {/* Enerji & Güç Dağılımı */}
                    <div>
                      <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#374151', marginBottom: '6px' }}>Güç Dağılımı</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Aktif Güç */}
                        <div style={{ flex: 1, backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                          <div style={{ fontSize: '7px', color: '#6b7280', marginBottom: '2px', fontWeight: '600' }}>AKTİF GÜÇ</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>{selectedRapor.aktif_guc} kW</div>
                          <div style={{ width: '100%', height: '2px', backgroundColor: '#e5e7eb', borderRadius: '1px', marginTop: '5px', overflow: 'hidden' }}>
                            <div style={{ width: '70%', height: '100%', backgroundColor: '#059669' }}></div>
                          </div>
                        </div>
                        
                        {/* Reaktif Güç */}
                        <div style={{ flex: 1, backgroundColor: '#f9fafb', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}>
                          <div style={{ fontSize: '7px', color: '#6b7280', marginBottom: '2px', fontWeight: '600' }}>REAKTİF GÜÇ</div>
                          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1f2937' }}>{selectedRapor.reaktif_guc} kVAr</div>
                          <div style={{ width: '100%', height: '2px', backgroundColor: '#e5e7eb', borderRadius: '1px', marginTop: '5px', overflow: 'hidden' }}>
                            <div style={{ width: '50%', height: '100%', backgroundColor: '#d97706' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notlar */}
                {selectedRapor.notlar && (
                  <div style={{ padding: '10px', backgroundColor: '#f9fafb', borderRadius: '4px', marginBottom: '12px', border: '1px solid #d1d5db' }}>
                    <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#374151', marginBottom: '5px', letterSpacing: '0.3px' }}>
                      NOTLAR VE AÇIKLAMALAR
                    </p>
                    <p style={{ fontSize: '8px', color: '#4b5563', margin: '0', lineHeight: '1.5' }}>{selectedRapor.notlar}</p>
                  </div>
                )}

                {/* Footer */}
                <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #d1d5db' }}>
                  <div style={{ textAlign: 'center', fontSize: '7px', color: '#6b7280' }}>
                    <p style={{ margin: '2px 0', fontWeight: 'bold', color: '#1f2937' }}>KOBİNERJİ Teklif Sistemi</p>
                    <p style={{ margin: '2px 0' }}>Haftalık Enerji ve Kompanzasyon Raporu</p>
                    <p style={{ margin: '2px 0' }}>www.kobinerji.com | info@kobinerji.com | +90 (XXX) XXX XX XX</p>
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
