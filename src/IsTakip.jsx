import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, Download, FileText, Clock, MapPin, User, Wrench, Calendar, Filter, Users, Building, Package, FileDown } from 'lucide-react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function IsTakip() {
  const [activeTab, setActiveTab] = useState('kayitlar'); // 'kayitlar', 'calisanlar', 'lokasyonlar', 'malzemeler'
  const [kayitlar, setKayitlar] = useState([]);
  const [calisanlar, setCalisanlar] = useState([]);
  const [lokasyonlar, setLokasyonlar] = useState([]);
  const [malzemeler, setMalzemeler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalType, setModalType] = useState(''); // 'kayit', 'calisan', 'lokasyon', 'malzeme'
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    calisan_id: '',
    lokasyon_id: '',
    baslangic_saat: '',
    bitis_saat: '',
    toplam_sure: 0,
    yapilan_is: '',
    kullanilan_malzemeler: [],
    notlar: ''
  });

  // Yönetim formları için state'ler
  const [calisanForm, setCalisanForm] = useState({ ad_soyad: '', telefon: '', email: '', pozisyon: '' });
  const [lokasyonForm, setLokasyonForm] = useState({ ad: '', adres: '', koordinat: '' });
  const [malzemeForm, setMalzemeForm] = useState({ ad: '', kategori: '', birim: 'Adet', stok_durumu: 0 });

  // Filtreleme için state'ler
  const [filtreCalisan, setFiltreCalisan] = useState('');
  const [filtreLokasyon, setFiltreLokasyon] = useState('');
  const [filtreTarihBaslangic, setFiltreTarihBaslangic] = useState('');
  const [filtreTarihBitis, setFiltreTarihBitis] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Çalışanları yükle
      const { data: calisanData, error: calisanError } = await supabase
        .from('is_takip_calisanlar')
        .select('*')
        .order('ad_soyad');
      
      if (calisanError) throw calisanError;
      setCalisanlar(calisanData || []);

      // Lokasyonları yükle
      const { data: lokasyonData, error: lokasyonError } = await supabase
        .from('is_takip_lokasyonlar')
        .select('*')
        .order('ad');
      
      if (lokasyonError) throw lokasyonError;
      setLokasyonlar(lokasyonData || []);

      // Malzemeleri yükle
      const { data: malzemeData, error: malzemeError } = await supabase
        .from('is_takip_malzemeler')
        .select('*')
        .order('ad');
      
      if (malzemeError) throw malzemeError;
      setMalzemeler(malzemeData || []);

      // İş kayıtlarını yükle
      const { data: kayitData, error: kayitError } = await supabase
        .from('is_takip_kayitlar')
        .select(`
          *,
          calisan:is_takip_calisanlar(ad_soyad),
          lokasyon:is_takip_lokasyonlar(ad, adres)
        `)
        .order('tarih', { ascending: false });
      
      if (kayitError) throw kayitError;
      setKayitlar(kayitData || []);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      alert('Veri yüklenirken hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalSure = (baslangic, bitis) => {
    if (!baslangic || !bitis) return 0;
    const [bH, bM] = baslangic.split(':').map(Number);
    const [eH, eM] = bitis.split(':').map(Number);
    const baslangicDk = bH * 60 + bM;
    const bitisDk = eH * 60 + eM;
    const fark = bitisDk - baslangicDk;
    return fark > 0 ? (fark / 60).toFixed(2) : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const toplam_sure = calculateTotalSure(formData.baslangic_saat, formData.bitis_saat);
      
      const kayit = {
        ...formData,
        toplam_sure: parseFloat(toplam_sure)
      };

      if (editingId) {
        const { error } = await supabase
          .from('is_takip_kayitlar')
          .update(kayit)
          .eq('id', editingId);
        
        if (error) throw error;
        alert('Kayıt güncellendi!');
      } else {
        const { error } = await supabase
          .from('is_takip_kayitlar')
          .insert([kayit]);
        
        if (error) throw error;
        alert('Kayıt eklendi!');
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

  const handleEdit = (kayit) => {
    setFormData({
      tarih: kayit.tarih,
      calisan_id: kayit.calisan_id,
      lokasyon_id: kayit.lokasyon_id,
      baslangic_saat: kayit.baslangic_saat,
      bitis_saat: kayit.bitis_saat,
      toplam_sure: kayit.toplam_sure,
      yapilan_is: kayit.yapilan_is,
      kullanilan_malzemeler: kayit.kullanilan_malzemeler || [],
      notlar: kayit.notlar || ''
    });
    setEditingId(kayit.id);
    setModalType('kayit');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    
    try {
      const { error } = await supabase
        .from('is_takip_kayitlar')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      alert('Kayıt silindi!');
      loadData();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme sırasında hata oluştu: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      tarih: new Date().toISOString().split('T')[0],
      calisan_id: '',
      lokasyon_id: '',
      baslangic_saat: '',
      bitis_saat: '',
      toplam_sure: 0,
      yapilan_is: '',
      kullanilan_malzemeler: [],
      notlar: ''
    });
  };

  // Çalışan yönetimi fonksiyonları
  const handleCalisanSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('is_takip_calisanlar')
          .update(calisanForm)
          .eq('id', editingId);
        if (error) throw error;
        alert('Çalışan güncellendi!');
      } else {
        const { error } = await supabase
          .from('is_takip_calisanlar')
          .insert([calisanForm]);
        if (error) throw error;
        alert('Çalışan eklendi!');
      }
      setShowModal(false);
      setEditingId(null);
      setCalisanForm({ ad_soyad: '', telefon: '', email: '', pozisyon: '' });
      loadData();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kayıt sırasında hata oluştu: ' + error.message);
    }
  };

  const handleCalisanEdit = (calisan) => {
    setCalisanForm({
      ad_soyad: calisan.ad_soyad,
      telefon: calisan.telefon || '',
      email: calisan.email || '',
      pozisyon: calisan.pozisyon || ''
    });
    setEditingId(calisan.id);
    setModalType('calisan');
    setShowModal(true);
  };

  const handleCalisanDelete = async (id) => {
    if (!confirm('Bu çalışanı silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase
        .from('is_takip_calisanlar')
        .delete()
        .eq('id', id);
      if (error) throw error;
      alert('Çalışan silindi!');
      loadData();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme sırasında hata oluştu: ' + error.message);
    }
  };

  // Lokasyon yönetimi fonksiyonları
  const handleLokasyonSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('is_takip_lokasyonlar')
          .update(lokasyonForm)
          .eq('id', editingId);
        if (error) throw error;
        alert('Lokasyon güncellendi!');
      } else {
        const { error } = await supabase
          .from('is_takip_lokasyonlar')
          .insert([lokasyonForm]);
        if (error) throw error;
        alert('Lokasyon eklendi!');
      }
      setShowModal(false);
      setEditingId(null);
      setLokasyonForm({ ad: '', adres: '', koordinat: '' });
      loadData();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kayıt sırasında hata oluştu: ' + error.message);
    }
  };

  const handleLokasyonEdit = (lokasyon) => {
    setLokasyonForm({
      ad: lokasyon.ad,
      adres: lokasyon.adres || '',
      koordinat: lokasyon.koordinat || ''
    });
    setEditingId(lokasyon.id);
    setModalType('lokasyon');
    setShowModal(true);
  };

  const handleLokasyonDelete = async (id) => {
    if (!confirm('Bu lokasyonu silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase
        .from('is_takip_lokasyonlar')
        .delete()
        .eq('id', id);
      if (error) throw error;
      alert('Lokasyon silindi!');
      loadData();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme sırasında hata oluştu: ' + error.message);
    }
  };

  // Malzeme yönetimi fonksiyonları
  const handleMalzemeSubmit = async (e) => {
    e.preventDefault();
    try {
      const malzemeData = {
        ...malzemeForm,
        stok_durumu: parseInt(malzemeForm.stok_durumu) || 0
      };
      
      if (editingId) {
        const { error } = await supabase
          .from('is_takip_malzemeler')
          .update(malzemeData)
          .eq('id', editingId);
        if (error) throw error;
        alert('Malzeme güncellendi!');
      } else {
        const { error } = await supabase
          .from('is_takip_malzemeler')
          .insert([malzemeData]);
        if (error) throw error;
        alert('Malzeme eklendi!');
      }
      setShowModal(false);
      setEditingId(null);
      setMalzemeForm({ ad: '', kategori: '', birim: 'Adet', stok_durumu: 0 });
      loadData();
    } catch (error) {
      console.error('Kaydetme hatası:', error);
      alert('Kayıt sırasında hata oluştu: ' + error.message);
    }
  };

  const handleMalzemeEdit = (malzeme) => {
    setMalzemeForm({
      ad: malzeme.ad,
      kategori: malzeme.kategori || '',
      birim: malzeme.birim || 'Adet',
      stok_durumu: malzeme.stok_durumu || 0
    });
    setEditingId(malzeme.id);
    setModalType('malzeme');
    setShowModal(true);
  };

  const handleMalzemeDelete = async (id) => {
    if (!confirm('Bu malzemeyi silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase
        .from('is_takip_malzemeler')
        .delete()
        .eq('id', id);
      if (error) throw error;
      alert('Malzeme silindi!');
      loadData();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Silme sırasında hata oluştu: ' + error.message);
    }
  };

  const exportToExcel = () => {
    const data = filtreliKayitlar.map(kayit => ({
      'Tarih': new Date(kayit.tarih).toLocaleDateString('tr-TR'),
      'Çalışan': kayit.calisan?.ad_soyad || '-',
      'Lokasyon': kayit.lokasyon?.ad || '-',
      'Başlangıç': kayit.baslangic_saat,
      'Bitiş': kayit.bitis_saat,
      'Süre (Saat)': kayit.toplam_sure,
      'Yapılan İş': kayit.yapilan_is,
      'Malzemeler': Array.isArray(kayit.kullanilan_malzemeler) 
        ? kayit.kullanilan_malzemeler.map(m => malzemeler.find(mal => mal.id === m)?.ad || m).join(', ')
        : '-',
      'Notlar': kayit.notlar || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'İş Takip');
    XLSX.writeFile(wb, `is_takip_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = async () => {
    try {
      const loadingDiv = document.createElement('div');
      loadingDiv.innerHTML = '<div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); z-index: 9999;">PDF oluşturuluyor...</div>';
      document.body.appendChild(loadingDiv);

      const SCALE_FACTOR = 2;
      const A4_WIDTH_MM = 210;
      const targetWidthPx = (A4_WIDTH_MM / 25.4) * 96;

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
            const altImg = new Image();
            altImg.crossOrigin = 'anonymous';
            altImg.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = altImg.width;
              canvas.height = altImg.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(altImg, 0, 0);
              resolve({
                data: canvas.toDataURL('image/png'),
                width: altImg.width,
                height: altImg.height
              });
            };
            altImg.onerror = () => {
              resolve({ data: '', width: 0, height: 0 });
            };
            altImg.src = '/kobinerji_logo.png';
          };
          img.src = '/fatura_logo.png';
        });
      };

      const logoInfo = await loadLogo();
      
      const maxLogoWidth = 60;
      const maxLogoHeight = 24;
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

      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true
      });

      const printArea = document.getElementById('is-takip-print-area');
      if (!printArea) {
        alert('Yazdırılacak alan bulunamadı!');
        document.body.removeChild(loadingDiv);
        return;
      }

      // Logoları gizle
      const logos = printArea.querySelectorAll('img');
      logos.forEach(logo => { logo.style.visibility = 'hidden'; });
      
      printArea.style.width = '210mm';
      printArea.style.margin = '0 auto';
      printArea.style.boxShadow = 'none';

      const canvas = await html2canvas(printArea, {
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
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST');
      
      if (logoInfo.data && logoWidth > 0 && logoHeight > 0) {
        pdf.addImage(logoInfo.data, 'PNG', 10, 10, logoWidth, logoHeight, '', 'FAST');
      }

      // Sayfa taşması varsa yeni sayfalar ekle
      if (imgHeight > pageHeight) {
        let heightLeft = imgHeight - pageHeight;
        let position = -pageHeight;

        while (heightLeft > 0) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
          
          if (logoInfo.data && logoWidth > 0 && logoHeight > 0) {
            pdf.addImage(logoInfo.data, 'PNG', 10, 10, logoWidth, logoHeight, '', 'FAST');
          }
          
          position -= pageHeight;
          heightLeft -= pageHeight;
        }
      }

      // Logoları tekrar göster
      logos.forEach(logo => { logo.style.visibility = 'visible'; });
      printArea.style.width = '';
      printArea.style.margin = '';
      printArea.style.boxShadow = '';

      pdf.save(`is_takip_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.removeChild(loadingDiv);
      
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken hata oluştu: ' + error.message);
    }
  };

  // Filtreleme
  const filtreliKayitlar = kayitlar.filter(kayit => {
    if (filtreCalisan && kayit.calisan_id !== filtreCalisan) return false;
    if (filtreLokasyon && kayit.lokasyon_id !== filtreLokasyon) return false;
    if (filtreTarihBaslangic && kayit.tarih < filtreTarihBaslangic) return false;
    if (filtreTarihBitis && kayit.tarih > filtreTarihBitis) return false;
    return true;
  });

  // İstatistikler
  const istatistikler = {
    toplamKayit: filtreliKayitlar.length,
    toplamSure: filtreliKayitlar.reduce((sum, k) => sum + (k.toplam_sure || 0), 0).toFixed(2),
    aktifCalisan: [...new Set(filtreliKayitlar.map(k => k.calisan_id))].length,
    aktifLokasyon: [...new Set(filtreliKayitlar.map(k => k.lokasyon_id))].length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">İş Takip Sistemi</h1>
                <p className="text-sm text-gray-500">Kim, nerede, ne, ne kadar, ne kullanarak</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                <FileDown className="w-5 h-5" />
                <span>PDF İndir</span>
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                <Download className="w-5 h-5" />
                <span>Excel İndir</span>
              </button>
              <button
                onClick={() => { 
                  setModalType('kayit'); 
                  setShowModal(true); 
                  setEditingId(null); 
                  resetForm(); 
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">İş Kaydı Ekle</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mt-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('kayitlar')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition ${
                activeTab === 'kayitlar'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              İş Kayıtları
            </button>
            <button
              onClick={() => setActiveTab('calisanlar')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition ${
                activeTab === 'calisanlar'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Çalışanlar ({calisanlar.length})
            </button>
            <button
              onClick={() => setActiveTab('lokasyonlar')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition ${
                activeTab === 'lokasyonlar'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Building className="w-4 h-4" />
              Lokasyonlar ({lokasyonlar.length})
            </button>
            <button
              onClick={() => setActiveTab('malzemeler')}
              className={`flex items-center gap-2 px-4 py-2 font-medium transition ${
                activeTab === 'malzemeler'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Package className="w-4 h-4" />
              Malzemeler ({malzemeler.length})
            </button>
          </div>
        </div>

        {/* İş Kayıtları Tab */}
        {activeTab === 'kayitlar' && (
          <>
          <div id="is-takip-print-area">
          {/* Filtreler */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Çalışan</label>
              <select
                value={filtreCalisan}
                onChange={(e) => setFiltreCalisan(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Tümü</option>
                {calisanlar.map(c => (
                  <option key={c.id} value={c.id}>{c.ad_soyad}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasyon</label>
              <select
                value={filtreLokasyon}
                onChange={(e) => setFiltreLokasyon(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Tümü</option>
                {lokasyonlar.map(l => (
                  <option key={l.id} value={l.id}>{l.ad}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
              <input
                type="date"
                value={filtreTarihBaslangic}
                onChange={(e) => setFiltreTarihBaslangic(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
              <input
                type="date"
                value={filtreTarihBitis}
                onChange={(e) => setFiltreTarihBitis(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            {(filtreCalisan || filtreLokasyon || filtreTarihBaslangic || filtreTarihBitis) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFiltreCalisan('');
                    setFiltreLokasyon('');
                    setFiltreTarihBaslangic('');
                    setFiltreTarihBitis('');
                  }}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition text-sm"
                >
                  Filtreleri Temizle
                </button>
              </div>
            )}
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Toplam Kayıt</p>
                <p className="text-2xl font-bold">{istatistikler.toplamKayit}</p>
              </div>
              <FileText className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Toplam Süre</p>
                <p className="text-2xl font-bold">{istatistikler.toplamSure} saat</p>
              </div>
              <Clock className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Aktif Çalışan</p>
                <p className="text-2xl font-bold">{istatistikler.aktifCalisan}</p>
              </div>
              <User className="w-10 h-10 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Aktif Lokasyon</p>
                <p className="text-2xl font-bold">{istatistikler.aktifLokasyon}</p>
              </div>
              <MapPin className="w-10 h-10 opacity-80" />
            </div>
          </div>
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Tarih</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Çalışan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Lokasyon</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Saat Aralığı</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Süre</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Yapılan İş</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtreliKayitlar.map((kayit, index) => (
                  <tr key={kayit.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm">
                      {new Date(kayit.tarih).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {kayit.calisan?.ad_soyad || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {kayit.lokasyon?.ad || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      {kayit.baslangic_saat} - {kayit.bitis_saat}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-bold text-purple-600">
                      {kayit.toplam_sure} saat
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-xs truncate" title={kayit.yapilan_is}>
                        {kayit.yapilan_is}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(kayit)}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                          title="Düzenle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(kayit.id)}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtreliKayitlar.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      Kayıt bulunamadı
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </div>
        </>
        )}

        {/* Çalışanlar Tab */}
        {activeTab === 'calisanlar' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Çalışan Yönetimi</h2>
              <button
                onClick={() => {
                  setModalType('calisan');
                  setEditingId(null);
                  setCalisanForm({ ad_soyad: '', telefon: '', email: '', pozisyon: '' });
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Yeni Çalışan
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ad Soyad</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Telefon</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pozisyon</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {calisanlar.map((calisan, index) => (
                    <tr key={calisan.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium">{calisan.ad_soyad}</td>
                      <td className="px-4 py-3 text-sm">{calisan.telefon || '-'}</td>
                      <td className="px-4 py-3 text-sm">{calisan.email || '-'}</td>
                      <td className="px-4 py-3 text-sm">{calisan.pozisyon || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleCalisanEdit(calisan)}
                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                            title="Düzenle"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCalisanDelete(calisan.id)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {calisanlar.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        Henüz çalışan eklenmemiş
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Lokasyonlar Tab */}
        {activeTab === 'lokasyonlar' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Lokasyon Yönetimi</h2>
              <button
                onClick={() => {
                  setModalType('lokasyon');
                  setEditingId(null);
                  setLokasyonForm({ ad: '', adres: '', koordinat: '' });
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Yeni Lokasyon
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Lokasyon Adı</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Adres</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Koordinat</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lokasyonlar.map((lokasyon, index) => (
                    <tr key={lokasyon.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium">{lokasyon.ad}</td>
                      <td className="px-4 py-3 text-sm">{lokasyon.adres || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lokasyon.koordinat || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleLokasyonEdit(lokasyon)}
                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                            title="Düzenle"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleLokasyonDelete(lokasyon.id)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {lokasyonlar.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                        Henüz lokasyon eklenmemiş
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Malzemeler Tab */}
        {activeTab === 'malzemeler' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Malzeme Yönetimi</h2>
              <button
                onClick={() => {
                  setModalType('malzeme');
                  setEditingId(null);
                  setMalzemeForm({ ad: '', kategori: '', birim: 'Adet', stok_durumu: 0 });
                  setShowModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                Yeni Malzeme
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-purple-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Malzeme Adı</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Kategori</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Birim</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Stok</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {malzemeler.map((malzeme, index) => (
                    <tr key={malzeme.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-4 py-3 text-sm font-medium">{malzeme.ad}</td>
                      <td className="px-4 py-3 text-sm">{malzeme.kategori || '-'}</td>
                      <td className="px-4 py-3 text-sm">{malzeme.birim || 'Adet'}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className={`px-2 py-1 rounded ${malzeme.stok_durumu > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {malzeme.stok_durumu || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleMalzemeEdit(malzeme)}
                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                            title="Düzenle"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMalzemeDelete(malzeme.id)}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {malzemeler.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                        Henüz malzeme eklenmemiş
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {modalType === 'kayit' && (editingId ? 'İş Kaydını Düzenle' : 'Yeni İş Kaydı')}
                    {modalType === 'calisan' && (editingId ? 'Çalışanı Düzenle' : 'Yeni Çalışan')}
                    {modalType === 'lokasyon' && (editingId ? 'Lokasyonu Düzenle' : 'Yeni Lokasyon')}
                    {modalType === 'malzeme' && (editingId ? 'Malzemeyi Düzenle' : 'Yeni Malzeme')}
                  </h2>
                  <button
                    onClick={() => { 
                      setShowModal(false); 
                      setEditingId(null); 
                      resetForm();
                      setCalisanForm({ ad_soyad: '', telefon: '', email: '', pozisyon: '' });
                      setLokasyonForm({ ad: '', adres: '', koordinat: '' });
                      setMalzemeForm({ ad: '', kategori: '', birim: 'Adet', stok_durumu: 0 });
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* İş Kaydı Formu */}
              {modalType === 'kayit' && (
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarih *</label>
                    <input
                      type="date"
                      required
                      value={formData.tarih}
                      onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Çalışan *</label>
                    <select
                      required
                      value={formData.calisan_id}
                      onChange={(e) => setFormData({ ...formData, calisan_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Seçiniz</option>
                      {calisanlar.map(c => (
                        <option key={c.id} value={c.id}>{c.ad_soyad}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lokasyon *</label>
                    <select
                      required
                      value={formData.lokasyon_id}
                      onChange={(e) => setFormData({ ...formData, lokasyon_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Seçiniz</option>
                      {lokasyonlar.map(l => (
                        <option key={l.id} value={l.id}>{l.ad}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Saati *</label>
                    <input
                      type="time"
                      required
                      value={formData.baslangic_saat}
                      onChange={(e) => setFormData({ ...formData, baslangic_saat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Saati *</label>
                    <input
                      type="time"
                      required
                      value={formData.bitis_saat}
                      onChange={(e) => setFormData({ ...formData, bitis_saat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Toplam Süre (Otomatik)</label>
                    <input
                      type="text"
                      readOnly
                      value={calculateTotalSure(formData.baslangic_saat, formData.bitis_saat) + ' saat'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-bold"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Yapılan İş *</label>
                    <textarea
                      required
                      value={formData.yapilan_is}
                      onChange={(e) => setFormData({ ...formData, yapilan_is: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows="3"
                      placeholder="Yapılan işi detaylı açıklayınız..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kullanılan Malzemeler</label>
                    <select
                      multiple
                      value={formData.kullanilan_malzemeler}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        kullanilan_malzemeler: Array.from(e.target.selectedOptions, option => option.value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      size="5"
                    >
                      {malzemeler.map(m => (
                        <option key={m.id} value={m.id}>{m.ad}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Ctrl/Cmd tuşu ile birden fazla seçim yapabilirsiniz</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                    <textarea
                      value={formData.notlar}
                      onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows="2"
                      placeholder="Ekstra notlar..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition"
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
              )}

              {/* Çalışan Formu */}
              {modalType === 'calisan' && (
              <form onSubmit={handleCalisanSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad *</label>
                    <input
                      type="text"
                      required
                      value={calisanForm.ad_soyad}
                      onChange={(e) => setCalisanForm({ ...calisanForm, ad_soyad: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Örn: Ahmet Yılmaz"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                    <input
                      type="tel"
                      value={calisanForm.telefon}
                      onChange={(e) => setCalisanForm({ ...calisanForm, telefon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0555 123 45 67"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={calisanForm.email}
                      onChange={(e) => setCalisanForm({ ...calisanForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="ornek@email.com"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pozisyon</label>
                    <input
                      type="text"
                      value={calisanForm.pozisyon}
                      onChange={(e) => setCalisanForm({ ...calisanForm, pozisyon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Örn: Teknisyen, Usta, Mühendis"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition"
                  >
                    <Save className="w-5 h-5" />
                    <span>{editingId ? 'Güncelle' : 'Kaydet'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { 
                      setShowModal(false); 
                      setEditingId(null); 
                      setCalisanForm({ ad_soyad: '', telefon: '', email: '', pozisyon: '' });
                    }}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                  >
                    İptal
                  </button>
                </div>
              </form>
              )}

              {/* Lokasyon Formu */}
              {modalType === 'lokasyon' && (
              <form onSubmit={handleLokasyonSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lokasyon Adı *</label>
                    <input
                      type="text"
                      required
                      value={lokasyonForm.ad}
                      onChange={(e) => setLokasyonForm({ ...lokasyonForm, ad: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Örn: Fabrika 1, Şantiye A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                    <textarea
                      value={lokasyonForm.adres}
                      onChange={(e) => setLokasyonForm({ ...lokasyonForm, adres: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows="2"
                      placeholder="Tam adres giriniz..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Koordinat</label>
                    <input
                      type="text"
                      value={lokasyonForm.koordinat}
                      onChange={(e) => setLokasyonForm({ ...lokasyonForm, koordinat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="41.0082,28.9784 (opsiyonel)"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition"
                  >
                    <Save className="w-5 h-5" />
                    <span>{editingId ? 'Güncelle' : 'Kaydet'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { 
                      setShowModal(false); 
                      setEditingId(null); 
                      setLokasyonForm({ ad: '', adres: '', koordinat: '' });
                    }}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                  >
                    İptal
                  </button>
                </div>
              </form>
              )}

              {/* Malzeme Formu */}
              {modalType === 'malzeme' && (
              <form onSubmit={handleMalzemeSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Malzeme Adı *</label>
                    <input
                      type="text"
                      required
                      value={malzemeForm.ad}
                      onChange={(e) => setMalzemeForm({ ...malzemeForm, ad: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Örn: Vida, Boya, Kablo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                    <input
                      type="text"
                      value={malzemeForm.kategori}
                      onChange={(e) => setMalzemeForm({ ...malzemeForm, kategori: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Örn: Elektrik, Boya, Yapı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Birim *</label>
                    <select
                      required
                      value={malzemeForm.birim}
                      onChange={(e) => setMalzemeForm({ ...malzemeForm, birim: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="Adet">Adet</option>
                      <option value="Kg">Kg</option>
                      <option value="Metre">Metre</option>
                      <option value="Litre">Litre</option>
                      <option value="Paket">Paket</option>
                      <option value="Kutu">Kutu</option>
                      <option value="Rulo">Rulo</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stok Durumu</label>
                    <input
                      type="number"
                      min="0"
                      value={malzemeForm.stok_durumu}
                      onChange={(e) => setMalzemeForm({ ...malzemeForm, stok_durumu: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition"
                  >
                    <Save className="w-5 h-5" />
                    <span>{editingId ? 'Güncelle' : 'Kaydet'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { 
                      setShowModal(false); 
                      setEditingId(null); 
                      setMalzemeForm({ ad: '', kategori: '', birim: 'Adet', stok_durumu: 0 });
                    }}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                  >
                    İptal
                  </button>
                </div>
              </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
