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
    try {
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
      const maxLogoWidth = 60;
      const maxLogoHeight = 24;
      const logoAspectRatio = logoInfo.width / logoInfo.height;
      let logoWidth = maxLogoWidth;
      let logoHeight = logoWidth / logoAspectRatio;
      
      if (logoHeight > maxLogoHeight) {
        logoHeight = maxLogoHeight;
        logoWidth = logoHeight * logoAspectRatio;
      }

      setSelectedRapor(rapor);
      setShowPdfPreview(true);
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const element = pdfPreviewRef.current;
      if (!element) {
        alert('PDF önizleme yüklenemedi!');
        setShowPdfPreview(false);
        return;
      }

      const logos = element.querySelectorAll('img[alt="Logo"]');
      logos.forEach(logo => { logo.style.visibility = 'hidden'; });

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        windowHeight: 1123
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.addImage(logoInfo.data, 'PNG', 15, 15, logoWidth, logoHeight, '', 'FAST');

      if (imgHeight > pageHeight) {
        let heightLeft = imgHeight - pageHeight;
        let position = -pageHeight;

        while (heightLeft > 0) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          pdf.addImage(logoInfo.data, 'PNG', 15, 15, logoWidth, logoHeight, '', 'FAST');
          position -= pageHeight;
          heightLeft -= pageHeight;
        }
      }

      const fileName = `haftalik_rapor_${rapor.fabrika_adi}_${rapor.hafta_baslangic}.pdf`;
      pdf.save(fileName);
      
      logos.forEach(logo => { logo.style.visibility = 'visible'; });
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
              <div style={{ padding: '15mm' }}>
                {/* Header with Logo and Report Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #4f46e5', paddingBottom: '20px', marginBottom: '25px' }}>
                  <div style={{ minWidth: '150px' }}>
                    <img src="/fatura_logo.png" alt="Logo" className="pdf-logo" style={{ height: '70px', maxWidth: '200px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ backgroundColor: '#4f46e5', color: 'white', padding: '8px 16px', borderRadius: '6px', marginBottom: '10px', display: 'inline-block' }}>
                      <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0' }}>HAFTALIK ENERJİ VE KOMPANZASYON RAPORU</h1>
                    </div>
                    <div style={{ backgroundColor: '#f3f4f6', padding: '10px', borderRadius: '6px', marginTop: '8px' }}>
                      <p style={{ fontSize: '11px', color: '#374151', margin: '3px 0', fontWeight: 'bold' }}>
                        📋 Rapor No: HFT-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, '0')}-{String(new Date().getDate()).padStart(2, '0')}
                      </p>
                      <p style={{ fontSize: '11px', color: '#374151', margin: '3px 0' }}>
                        📅 Tarih: {new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <p style={{ fontSize: '11px', color: '#374151', margin: '3px 0' }}>
                        🏭 Dönem: {new Date(selectedRapor.hafta_baslangic).toLocaleDateString('tr-TR')} - {new Date(selectedRapor.hafta_bitis).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fabrika Bilgisi - Prominent */}
                <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px', borderRadius: '10px', marginBottom: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      🏢
                    </div>
                    <div>
                      <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 5px 0' }}>{selectedRapor.fabrika_adi}</h2>
                      <p style={{ fontSize: '12px', margin: '0', opacity: 0.9 }}>
                        Haftalık Performans Değerlendirme Raporu
                      </p>
                    </div>
                  </div>
                </div>

                {/* Durum Badge - Large and Clear */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                  <div style={{ 
                    padding: '20px 50px', 
                    borderRadius: '12px', 
                    fontSize: '22px', 
                    fontWeight: 'bold',
                    backgroundColor: getDurum(selectedRapor).text === 'UYGUN' ? '#10b981' : getDurum(selectedRapor).text === 'DİKKAT' ? '#f59e0b' : '#ef4444',
                    color: 'white',
                    textAlign: 'center',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                    border: '3px solid rgba(255,255,255,0.8)'
                  }}>
                    {getDurum(selectedRapor).text === 'UYGUN' ? '✓ ' : getDurum(selectedRapor).text === 'DİKKAT' ? '⚠ ' : '✗ '}
                    {getDurum(selectedRapor).text}
                  </div>
                </div>

                {/* Özet Bilgiler - Enhanced Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '10px', textAlign: 'center', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '30px', marginBottom: '8px' }}>⚡</div>
                    <p style={{ fontSize: '10px', marginBottom: '8px', fontWeight: 'bold', opacity: 0.9 }}>GÜÇ FAKTÖRÜ (cosφ)</p>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0' }}>{selectedRapor.guc_faktoru}</p>
                    <p style={{ fontSize: '10px', marginTop: '8px', opacity: 0.8 }}>Hedef: {selectedRapor.hedef_guc_faktoru}</p>
                  </div>
                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '10px', textAlign: 'center', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '30px', marginBottom: '8px' }}>🔋</div>
                    <p style={{ fontSize: '10px', marginBottom: '8px', fontWeight: 'bold', opacity: 0.9 }}>AKTİF GÜÇ</p>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0' }}>{selectedRapor.aktif_guc}</p>
                    <p style={{ fontSize: '10px', marginTop: '8px', opacity: 0.8 }}>kW</p>
                  </div>
                  <div style={{ padding: '20px', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', borderRadius: '10px', textAlign: 'center', color: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontSize: '30px', marginBottom: '8px' }}>⚙️</div>
                    <p style={{ fontSize: '10px', marginBottom: '8px', fontWeight: 'bold', opacity: 0.9 }}>REAKTİF GÜÇ</p>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0' }}>{selectedRapor.reaktif_guc}</p>
                    <p style={{ fontSize: '10px', marginTop: '8px', opacity: 0.8 }}>kVAr</p>
                  </div>
                </div>

                {/* Uploaded Image Section */}
                {selectedRapor.gorsel_url && (
                  <div style={{ marginBottom: '30px', border: '2px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#4f46e5', color: 'white', padding: '10px 15px', fontSize: '12px', fontWeight: 'bold' }}>
                      📸 SAHA GÖRSELİ / TEKNİK FOTOĞRAF
                    </div>
                    <div style={{ padding: '15px', backgroundColor: '#f9fafb' }}>
                      <img 
                        src={selectedRapor.gorsel_url} 
                        alt="Saha görseli" 
                        style={{ width: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '6px', backgroundColor: 'white' }}
                      />
                    </div>
                  </div>
                )}

                {/* Detaylı Bilgiler Table - Enhanced */}
                <div style={{ marginBottom: '30px' }}>
                  <div style={{ backgroundColor: '#1f2937', color: 'white', padding: '12px 15px', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px 8px 0 0' }}>
                    📊 DETAYLI PERFORMANS VERİLERİ
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <tbody>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <td style={{ padding: '14px 15px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#374151' }}>
                          <span style={{ marginRight: '8px' }}>🔧</span>Kompanzasyon Durumu
                        </td>
                        <td style={{ padding: '14px 15px', border: '1px solid #e5e7eb', color: '#1f2937', fontWeight: '600' }}>{selectedRapor.kompanzasyon_durumu}</td>
                      </tr>
                      <tr style={{ backgroundColor: 'white' }}>
                        <td style={{ padding: '14px 15px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#374151' }}>
                          <span style={{ marginRight: '8px' }}>⚡</span>Enerji Tüketimi
                        </td>
                        <td style={{ padding: '14px 15px', border: '1px solid #e5e7eb', color: '#1f2937', fontWeight: '600' }}>{selectedRapor.enerji_tuketimi} kWh</td>
                      </tr>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <td style={{ padding: '14px 15px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#374151' }}>
                          <span style={{ marginRight: '8px' }}>📈</span>Önceki Hafta Güç Faktörü
                        </td>
                        <td style={{ padding: '14px 15px', border: '1px solid #e5e7eb', color: '#1f2937', fontWeight: '600' }}>{selectedRapor.onceki_hafta_guc_faktoru}</td>
                      </tr>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <td style={{ padding: '14px 15px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#374151' }}>
                          <span style={{ marginRight: '8px' }}>📊</span>Trend Durumu
                        </td>
                        <td style={{ padding: '14px 15px', border: '1px solid #e5e7eb', color: '#1f2937', fontWeight: '600' }}>
                          {getTrend(selectedRapor).text === 'Yükseliş' ? '📈 Yükseliş' : getTrend(selectedRapor).text === 'Düşüş' ? '📉 Düşüş' : '➡️ Sabit'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Grafik Gösterimleri */}
                <div style={{ marginBottom: '30px' }}>
                  <div style={{ backgroundColor: '#1f2937', color: 'white', padding: '12px 15px', fontSize: '13px', fontWeight: 'bold', borderRadius: '8px 8px 0 0' }}>
                    📈 GRAFİK ANALİZLER
                  </div>
                  <div style={{ backgroundColor: '#f9fafb', padding: '20px', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px' }}>
                    
                    {/* Güç Faktörü Progress Bar */}
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#374151' }}>⚡ Güç Faktörü Durumu</span>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>{selectedRapor.guc_faktoru} / {selectedRapor.hedef_guc_faktoru}</span>
                      </div>
                      <div style={{ width: '100%', height: '30px', backgroundColor: '#e5e7eb', borderRadius: '15px', overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                        <div style={{ 
                          width: `${(parseFloat(selectedRapor.guc_faktoru) / parseFloat(selectedRapor.hedef_guc_faktoru)) * 100}%`, 
                          height: '100%', 
                          background: parseFloat(selectedRapor.guc_faktoru) >= parseFloat(selectedRapor.hedef_guc_faktoru) 
                            ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' 
                            : parseFloat(selectedRapor.guc_faktoru) >= parseFloat(selectedRapor.hedef_guc_faktoru) - 0.05
                            ? 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'
                            : 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)',
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
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#374151', marginBottom: '10px' }}>📊 Haftalık Performans Karşılaştırması</div>
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', height: '120px' }}>
                        {/* Önceki Hafta */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <div style={{ 
                            width: '100%', 
                            height: `${(parseFloat(selectedRapor.onceki_hafta_guc_faktoru) / 1) * 100}px`,
                            background: 'linear-gradient(180deg, #94a3b8 0%, #64748b 100%)',
                            borderRadius: '8px 8px 0 0',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            paddingTop: '8px',
                            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
                          }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>{selectedRapor.onceki_hafta_guc_faktoru}</span>
                          </div>
                          <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '6px', textAlign: 'center' }}>Önceki Hafta</div>
                        </div>
                        
                        {/* Bu Hafta */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <div style={{ 
                            width: '100%', 
                            height: `${(parseFloat(selectedRapor.guc_faktoru) / 1) * 100}px`,
                            background: parseFloat(selectedRapor.guc_faktoru) >= parseFloat(selectedRapor.hedef_guc_faktoru)
                              ? 'linear-gradient(180deg, #34d399 0%, #10b981 100%)'
                              : 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)',
                            borderRadius: '8px 8px 0 0',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            paddingTop: '8px',
                            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
                            position: 'relative'
                          }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>{selectedRapor.guc_faktoru}</span>
                            {parseFloat(selectedRapor.guc_faktoru) > parseFloat(selectedRapor.onceki_hafta_guc_faktoru) && (
                              <span style={{ position: 'absolute', top: '-20px', fontSize: '18px' }}>📈</span>
                            )}
                            {parseFloat(selectedRapor.guc_faktoru) < parseFloat(selectedRapor.onceki_hafta_guc_faktoru) && (
                              <span style={{ position: 'absolute', top: '-20px', fontSize: '18px' }}>📉</span>
                            )}
                          </div>
                          <div style={{ fontSize: '9px', color: '#1f2937', marginTop: '6px', textAlign: 'center', fontWeight: 'bold' }}>Bu Hafta</div>
                        </div>

                        {/* Hedef */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <div style={{ 
                            width: '100%', 
                            height: `${(parseFloat(selectedRapor.hedef_guc_faktoru) / 1) * 100}px`,
                            background: 'linear-gradient(180deg, #a78bfa 0%, #7c3aed 100%)',
                            borderRadius: '8px 8px 0 0',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'center',
                            paddingTop: '8px',
                            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
                            border: '2px dashed white'
                          }}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>{selectedRapor.hedef_guc_faktoru}</span>
                          </div>
                          <div style={{ fontSize: '9px', color: '#7c3aed', marginTop: '6px', textAlign: 'center', fontWeight: 'bold' }}>🎯 Hedef</div>
                        </div>
                      </div>
                    </div>

                    {/* Enerji & Güç Dağılımı */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#374151', marginBottom: '10px' }}>⚡ Güç Dağılımı</div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {/* Aktif Güç */}
                        <div style={{ flex: 1, backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '2px solid #f472b6' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '4px' }}>AKTİF GÜÇ</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f472b6' }}>{selectedRapor.aktif_guc} kW</div>
                          <div style={{ width: '100%', height: '4px', backgroundColor: '#fce7f3', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                            <div style={{ width: '70%', height: '100%', background: 'linear-gradient(90deg, #f472b6 0%, #ec4899 100%)' }}></div>
                          </div>
                        </div>
                        
                        {/* Reaktif Güç */}
                        <div style={{ flex: 1, backgroundColor: 'white', padding: '12px', borderRadius: '8px', border: '2px solid #facc15' }}>
                          <div style={{ fontSize: '9px', color: '#9ca3af', marginBottom: '4px' }}>REAKTİF GÜÇ</div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#facc15' }}>{selectedRapor.reaktif_guc} kVAr</div>
                          <div style={{ width: '100%', height: '4px', backgroundColor: '#fef9c3', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                            <div style={{ width: '50%', height: '100%', background: 'linear-gradient(90deg, #facc15 0%, #eab308 100%)' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notlar */}
                {selectedRapor.notlar && (
                  <div style={{ padding: '18px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '10px', marginBottom: '25px', border: '2px solid #fbbf24' }}>
                    <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400e', marginBottom: '10px' }}>
                      📝 NOTLAR VE AÇIKLAMALAR
                    </p>
                    <p style={{ fontSize: '11px', color: '#78350f', margin: '0', lineHeight: '1.7' }}>{selectedRapor.notlar}</p>
                  </div>
                )}

                {/* Footer with Report Info */}
                <div style={{ marginTop: '35px', paddingTop: '20px', borderTop: '3px solid #4f46e5' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                    {selectedRapor.rapor_hazirlayan && (
                      <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '6px' }}>
                        <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '4px', fontWeight: 'bold' }}>RAPOR HAZIRLAYAN</p>
                        <p style={{ fontSize: '11px', color: '#1f2937', margin: '0', fontWeight: '600' }}>✍️ {selectedRapor.rapor_hazirlayan}</p>
                      </div>
                    )}
                    {selectedRapor.onaylayan && (
                      <div style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '6px' }}>
                        <p style={{ fontSize: '9px', color: '#6b7280', marginBottom: '4px', fontWeight: 'bold' }}>ONAYLAYAN</p>
                        <p style={{ fontSize: '11px', color: '#1f2937', margin: '0', fontWeight: '600' }}>✓ {selectedRapor.onaylayan}</p>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '10px', color: '#6b7280', paddingTop: '15px', borderTop: '1px solid #e5e7eb' }}>
                    <p style={{ margin: '3px 0', fontWeight: 'bold', color: '#1f2937' }}>KOBİNERJİ Teklif Sistemi</p>
                    <p style={{ margin: '3px 0' }}>Haftalık Enerji ve Kompanzasyon Raporu</p>
                    <p style={{ margin: '3px 0' }}>🌐 www.kobinerji.com | 📧 info@kobinerji.com | ☎️ +90 (XXX) XXX XX XX</p>
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
