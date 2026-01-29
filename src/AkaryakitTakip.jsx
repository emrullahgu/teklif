import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, Download, FileText, Fuel, Car, Calendar, TrendingUp, DollarSign, Filter } from 'lucide-react';
import { supabase } from './supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function AkaryakitTakip() {
  const [kayitlar, setKayitlar] = useState([]);
  const [araclar, setAraclar] = useState([]);
  const [suruculer, setSuruculer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAracModal, setShowAracModal] = useState(false);
  const [showSurucuModal, setShowSurucuModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Ay filtresi - Varsayılan olarak güncel ay
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  const [secilenAy, setSecilenAy] = useState(getCurrentMonth());
  const [aylikGoruntule, setAylikGoruntule] = useState(true);
  
  // Filtreler
  const [filtreArac, setFiltreArac] = useState('');
  const [filtreSurucu, setFiltreSurucu] = useState('');
  const [filtreBaslangic, setFiltreBaslangic] = useState('');
  const [filtreBitis, setFiltreBitis] = useState('');

  // Form state'leri
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    arac_id: '',
    surucu_id: '',
    litre: '',
    litre_fiyat: '',
    toplam_tutar: '',
    km: '',
    istasyon: '',
    yakit_tipi: 'Dizel',
    odeme_sekli: 'Nakit',
    aciklama: ''
  });

  const [aracForm, setAracForm] = useState({
    plaka: '',
    marka: '',
    model: '',
    yil: '',
    renk: '',
    aktif: true
  });

  const [surucuForm, setSurucuForm] = useState({
    ad_soyad: '',
    telefon: '',
    tc_no: '',
    ehliyet_no: '',
    aktif: true
  });

  // Verileri yükle
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Kayıtları yükle
      const { data: kayitlarData, error: kayitlarError } = await supabase
        .from('fuel_records')
        .select(`
          *,
          vehicles:vehicle_id (id, plate, brand, model),
          drivers:driver_id (id, full_name)
        `)
        .order('date', { ascending: false });

      if (kayitlarError) throw kayitlarError;

      // Araçları yükle
      const { data: araclarData, error: araclarError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('active', true)
        .order('plate');

      if (araclarError) throw araclarError;

      // Sürücüleri yükle
      const { data: suruculerData, error: suruculerError } = await supabase
        .from('drivers')
        .select('*')
        .eq('active', true)
        .order('full_name');

      if (suruculerError) throw suruculerError;

      setKayitlar(kayitlarData || []);
      setAraclar(araclarData || []);
      setSuruculer(suruculerData || []);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      alert('Veriler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Toplam tutarı otomatik hesapla
  useEffect(() => {
    if (formData.litre && formData.litre_fiyat) {
      const toplam = (parseFloat(formData.litre) * parseFloat(formData.litre_fiyat)).toFixed(2);
      setFormData(prev => ({ ...prev, toplam_tutar: toplam }));
    }
  }, [formData.litre, formData.litre_fiyat]);

  // Kayıt ekle/güncelle
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const kayitData = {
        date: formData.tarih,
        vehicle_id: formData.arac_id,
        driver_id: formData.surucu_id,
        liters: parseFloat(formData.litre),
        price_per_liter: parseFloat(formData.litre_fiyat),
        total_amount: parseFloat(formData.toplam_tutar),
        km: formData.km ? parseInt(formData.km) : null,
        station: formData.istasyon || null,
        fuel_type: formData.yakit_tipi,
        payment_method: formData.odeme_sekli,
        description: formData.aciklama || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('fuel_records')
          .update(kayitData)
          .eq('id', editingId);

        if (error) throw error;
        alert('Kayıt güncellendi!');
      } else {
        const { error } = await supabase
          .from('fuel_records')
          .insert([kayitData]);

        if (error) throw error;
        alert('Kayıt eklendi!');
      }

      setShowModal(false);
      setEditingId(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Kayıt hatası:', error);
      alert('Kayıt işlemi sırasında bir hata oluştu: ' + error.message);
    }
  };

  // Araç ekle
  const handleAracSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('vehicles')
        .insert([{
          plate: aracForm.plaka,
          brand: aracForm.marka,
          model: aracForm.model,
          year: aracForm.yil ? parseInt(aracForm.yil) : null,
          color: aracForm.renk || null,
          active: true
        }]);

      if (error) throw error;
      
      alert('Araç eklendi!');
      setShowAracModal(false);
      setAracForm({ plaka: '', marka: '', model: '', yil: '', renk: '', aktif: true });
      loadData();
    } catch (error) {
      console.error('Araç ekleme hatası:', error);
      alert('Araç eklenirken bir hata oluştu: ' + error.message);
    }
  };

  // Sürücü ekle
  const handleSurucuSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('drivers')
        .insert([{
          full_name: surucuForm.ad_soyad,
          phone: surucuForm.telefon || null,
          tc_no: surucuForm.tc_no || null,
          license_no: surucuForm.ehliyet_no || null,
          active: true
        }]);

      if (error) throw error;
      
      alert('Sürücü eklendi!');
      setShowSurucuModal(false);
      setSurucuForm({ ad_soyad: '', telefon: '', tc_no: '', ehliyet_no: '', aktif: true });
      loadData();
    } catch (error) {
      console.error('Sürücü ekleme hatası:', error);
      alert('Sürücü eklenirken bir hata oluştu: ' + error.message);
    }
  };

  // Kayıt sil
  const handleDelete = async (id) => {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const { error } = await supabase
        .from('fuel_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      alert('Kayıt silindi!');
      loadData();
    } catch (error) {
      console.error('Silme hatası:', error);
      alert('Kayıt silinirken bir hata oluştu: ' + error.message);
    }
  };

  // Düzenle
  const handleEdit = (kayit) => {
    setFormData({
      tarih: kayit.date,
      arac_id: kayit.vehicle_id,
      surucu_id: kayit.driver_id,
      litre: kayit.liters.toString(),
      litre_fiyat: kayit.price_per_liter.toString(),
      toplam_tutar: kayit.total_amount.toString(),
      km: kayit.km ? kayit.km.toString() : '',
      istasyon: kayit.station || '',
      yakit_tipi: kayit.fuel_type || 'Dizel',
      odeme_sekli: kayit.payment_method || 'Nakit',
      aciklama: kayit.description || ''
    });
    setEditingId(kayit.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      tarih: new Date().toISOString().split('T')[0],
      arac_id: '',
      surucu_id: '',
      litre: '',
      litre_fiyat: '',
      toplam_tutar: '',
      km: '',
      istasyon: '',
      yakit_tipi: 'Dizel',
      odeme_sekli: 'Nakit',
      aciklama: ''
    });
  };

  // Filtreleme
  const filtreliKayitlar = kayitlar.filter(kayit => {
    // Ay bazında filtreleme
    if (aylikGoruntule && secilenAy) {
      const kayitAy = kayit.date.substring(0, 7); // YYYY-MM formatı
      if (kayitAy !== secilenAy) return false;
    }
    
    // Diğer filtreler
    if (filtreArac && kayit.vehicle_id !== filtreArac) return false;
    if (filtreSurucu && kayit.driver_id !== filtreSurucu) return false;
    if (filtreBaslangic && kayit.date < filtreBaslangic) return false;
    if (filtreBitis && kayit.date > filtreBitis) return false;
    return true;
  });

  // İstatistikler
  const istatistikler = {
    toplamKayit: filtreliKayitlar.length,
    toplamLitre: filtreliKayitlar.reduce((sum, k) => sum + (k.liters || 0), 0),
    toplamTutar: filtreliKayitlar.reduce((sum, k) => sum + (k.total_amount || 0), 0),
    ortalamaBirimFiyat: filtreliKayitlar.length > 0 
      ? filtreliKayitlar.reduce((sum, k) => sum + (k.price_per_liter || 0), 0) / filtreliKayitlar.length 
      : 0
  };

  // Excel'e aktar
  const exportToExcel = () => {
    const data = filtreliKayitlar.map(kayit => ({
      'Tarih': kayit.date,
      'Araç': kayit.vehicles?.plate || '-',
      'Sürücü': kayit.drivers?.full_name || '-',
      'Yakıt Tipi': kayit.fuel_type,
      'Litre': kayit.liters,
      'Birim Fiyat': kayit.price_per_liter,
      'Toplam Tutar': kayit.total_amount,
      'KM': kayit.km || '-',
      'İstasyon': kayit.station || '-',
      'Ödeme': kayit.payment_method,
      'Açıklama': kayit.description || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Akaryakıt Kayıtları');
    XLSX.writeFile(wb, `akaryakıt_kayıtları_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // PDF'e aktar
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Akaryakıt Takip Raporu', 14, 15);
    
    doc.setFontSize(10);
    doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 14, 22);
    
    const tableData = filtreliKayitlar.map(kayit => [
      kayit.date,
      kayit.vehicles?.plate || '-',
      kayit.drivers?.full_name || '-',
      kayit.fuel_type,
      kayit.liters,
      kayit.price_per_liter.toFixed(2),
      kayit.total_amount.toFixed(2)
    ]);

    doc.autoTable({
      startY: 30,
      head: [['Tarih', 'Araç', 'Sürücü', 'Yakıt', 'Litre', 'Birim', 'Tutar']],
      body: tableData,
      foot: [[
        'TOPLAM',
        '',
        '',
        '',
        istatistikler.toplamLitre.toFixed(2),
        '',
        istatistikler.toplamTutar.toFixed(2)
      ]],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      footStyles: { fillColor: [229, 231, 235], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.save(`akaryakıt_raporu_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Fuel className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">Akaryakıt Takip Sistemi</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowAracModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                <Car className="w-5 h-5" />
                <span>Araç Ekle</span>
              </button>
              <button
                onClick={() => { setShowSurucuModal(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                <span>Sürücü Ekle</span>
              </button>
              <button
                onClick={() => { setShowModal(true); setEditingId(null); resetForm(); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                <Plus className="w-5 h-5" />
                <span>Yakıt Kaydı Ekle</span>
              </button>
            </div>
          </div>

          {/* Ay Seçici ve Görüntüleme Modu */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-700">Görüntüleme:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setAylikGoruntule(true); setSecilenAy(getCurrentMonth()); }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  aylikGoruntule 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Aylık
              </button>
              <button
                onClick={() => { setAylikGoruntule(false); setFiltreBaslangic(''); setFiltreBitis(''); }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  !aylikGoruntule 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                Tüm Veriler
              </button>
            </div>
            {aylikGoruntule && (
              <>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center gap-2">
                  <label className="font-medium text-gray-700">Ay Seç:</label>
                  <input
                    type="month"
                    value={secilenAy}
                    onChange={(e) => setSecilenAy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  />
                  <button
                    onClick={() => setSecilenAy(getCurrentMonth())}
                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-sm font-medium"
                    title="Güncel aya dön"
                  >
                    Bugün
                  </button>
                </div>
              </>
            )}
          </div>

          {/* İstatistikler */}
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-700">
              {aylikGoruntule 
                ? `${new Date(secilenAy + '-01').toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })} İstatistikleri`
                : 'Genel İstatistikler'
              }
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Toplam Kayıt</p>
                  <p className="text-2xl font-bold">{istatistikler.toplamKayit}</p>
                </div>
                <FileText className="w-10 h-10 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Toplam Litre</p>
                  <p className="text-2xl font-bold">{istatistikler.toplamLitre.toFixed(2)}</p>
                </div>
                <Fuel className="w-10 h-10 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Toplam Tutar</p>
                  <p className="text-2xl font-bold">{istatistikler.toplamTutar.toFixed(2)} ₺</p>
                </div>
                <DollarSign className="w-10 h-10 opacity-80" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Ort. Birim Fiyat</p>
                  <p className="text-2xl font-bold">{istatistikler.ortalamaBirimFiyat.toFixed(2)} ₺</p>
                </div>
                <TrendingUp className="w-10 h-10 opacity-80" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-800">Filtrele</h2>
            {aylikGoruntule && (
              <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                {new Date(secilenAy + '-01').toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Araç</label>
              <select
                value={filtreArac}
                onChange={(e) => setFiltreArac(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tüm Araçlar</option>
                {araclar.map(arac => (
                  <option key={arac.id} value={arac.id}>{arac.plate} - {arac.brand} {arac.model}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sürücü</label>
              <select
                value={filtreSurucu}
                onChange={(e) => setFiltreSurucu(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tüm Sürücüler</option>
                {suruculer.map(surucu => (
                  <option key={surucu.id} value={surucu.id}>{surucu.full_name}</option>
                ))}
              </select>
            </div>
            {!aylikGoruntule && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Başlangıç Tarihi</label>
                  <input
                    type="date"
                    value={filtreBaslangic}
                    onChange={(e) => setFiltreBaslangic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
                  <input
                    type="date"
                    value={filtreBitis}
                    onChange={(e) => setFiltreBitis(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                setFiltreArac('');
                setFiltreSurucu('');
                setFiltreBaslangic('');
                setFiltreBitis('');
              }}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Filtreleri Temizle
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Excel'e Aktar
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              PDF'e Aktar
            </button>
          </div>
        </div>

        {/* Kayıtlar Tablosu */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Tarih</th>
                  <th className="px-4 py-3 text-left">Araç</th>
                  <th className="px-4 py-3 text-left">Sürücü</th>
                  <th className="px-4 py-3 text-left">Yakıt Tipi</th>
                  <th className="px-4 py-3 text-right">Litre</th>
                  <th className="px-4 py-3 text-right">Birim Fiyat</th>
                  <th className="px-4 py-3 text-right">Toplam</th>
                  <th className="px-4 py-3 text-right">KM</th>
                  <th className="px-4 py-3 text-left">İstasyon</th>
                  <th className="px-4 py-3 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtreliKayitlar.map((kayit, index) => (
                  <tr key={kayit.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3">{new Date(kayit.date).toLocaleDateString('tr-TR')}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{kayit.vehicles?.plate || '-'}</div>
                      <div className="text-sm text-gray-500">{kayit.vehicles?.brand} {kayit.vehicles?.model}</div>
                    </td>
                    <td className="px-4 py-3">{kayit.drivers?.full_name || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        kayit.fuel_type === 'Dizel' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {kayit.fuel_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{kayit.liters} L</td>
                    <td className="px-4 py-3 text-right">{kayit.price_per_liter.toFixed(2)} ₺</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">{kayit.total_amount.toFixed(2)} ₺</td>
                    <td className="px-4 py-3 text-right">{kayit.km || '-'}</td>
                    <td className="px-4 py-3">{kayit.station || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(kayit)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition"
                          title="Düzenle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(kayit.id)}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kayıt Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {editingId ? 'Kayıt Güncelle' : 'Yeni Yakıt Kaydı'}
                  </h2>
                  <button
                    onClick={() => { setShowModal(false); setEditingId(null); resetForm(); }}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tarih *</label>
                    <input
                      type="date"
                      required
                      value={formData.tarih}
                      onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Araç *</label>
                    <select
                      required
                      value={formData.arac_id}
                      onChange={(e) => setFormData({ ...formData, arac_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Araç Seçin</option>
                      {araclar.map(arac => (
                        <option key={arac.id} value={arac.id}>
                          {arac.plaka} - {arac.marka} {arac.model}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sürücü *</label>
                    <select
                      required
                      value={formData.surucu_id}
                      onChange={(e) => setFormData({ ...formData, surucu_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sürücü Seçin</option>
                      {suruculer.map(surucu => (
                        <option key={surucu.id} value={surucu.id}>{surucu.ad_soyad}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Yakıt Tipi *</label>
                    <select
                      required
                      value={formData.yakit_tipi}
                      onChange={(e) => setFormData({ ...formData, yakit_tipi: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Dizel">Dizel</option>
                      <option value="Benzin">Benzin</option>
                      <option value="LPG">LPG</option>
                      <option value="Elektrik">Elektrik</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Litre *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.litre}
                      onChange={(e) => setFormData({ ...formData, litre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Litre Fiyat *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.litre_fiyat}
                      onChange={(e) => setFormData({ ...formData, litre_fiyat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Toplam Tutar</label>
                    <input
                      type="number"
                      step="0.01"
                      readOnly
                      value={formData.toplam_tutar}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 font-bold"
                      placeholder="Otomatik hesaplanır"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">KM</label>
                    <input
                      type="number"
                      value={formData.km}
                      onChange={(e) => setFormData({ ...formData, km: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Araç KM'si"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">İstasyon</label>
                    <input
                      type="text"
                      value={formData.istasyon}
                      onChange={(e) => setFormData({ ...formData, istasyon: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Petrol istasyonu adı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Şekli</label>
                    <select
                      value={formData.odeme_sekli}
                      onChange={(e) => setFormData({ ...formData, odeme_sekli: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Nakit">Nakit</option>
                      <option value="Kredi Kartı">Kredi Kartı</option>
                      <option value="Fuel Kart">Fuel Kart</option>
                      <option value="Havale">Havale</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                    <textarea
                      value={formData.aciklama}
                      onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows="3"
                      placeholder="Ek notlar..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition"
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

        {/* Araç Modal */}
        {showAracModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Yeni Araç Ekle</h2>
                  <button
                    onClick={() => { setShowAracModal(false); setAracForm({ plaka: '', marka: '', model: '', yil: '', renk: '', aktif: true }); }}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleAracSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plaka *</label>
                  <input
                    type="text"
                    required
                    value={aracForm.plaka}
                    onChange={(e) => setAracForm({ ...aracForm, plaka: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="34 ABC 123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marka *</label>
                  <input
                    type="text"
                    required
                    value={aracForm.marka}
                    onChange={(e) => setAracForm({ ...aracForm, marka: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ford"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                  <input
                    type="text"
                    required
                    value={aracForm.model}
                    onChange={(e) => setAracForm({ ...aracForm, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Transit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yıl</label>
                  <input
                    type="number"
                    value={aracForm.yil}
                    onChange={(e) => setAracForm({ ...aracForm, yil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="2020"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Renk</label>
                  <input
                    type="text"
                    value={aracForm.renk}
                    onChange={(e) => setAracForm({ ...aracForm, renk: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Beyaz"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition"
                  >
                    <Save className="w-5 h-5" />
                    <span>Kaydet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAracModal(false); setAracForm({ plaka: '', marka: '', model: '', yil: '', renk: '', aktif: true }); }}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Sürücü Modal */}
        {showSurucuModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Yeni Sürücü Ekle</h2>
                  <button
                    onClick={() => { setShowSurucuModal(false); setSurucuForm({ ad_soyad: '', telefon: '', tc_no: '', ehliyet_no: '', aktif: true }); }}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleSurucuSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad *</label>
                  <input
                    type="text"
                    required
                    value={surucuForm.ad_soyad}
                    onChange={(e) => setSurucuForm({ ...surucuForm, ad_soyad: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ahmet Yılmaz"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={surucuForm.telefon}
                    onChange={(e) => setSurucuForm({ ...surucuForm, telefon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0532 123 45 67"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">TC Kimlik No</label>
                  <input
                    type="text"
                    maxLength="11"
                    value={surucuForm.tc_no}
                    onChange={(e) => setSurucuForm({ ...surucuForm, tc_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="12345678901"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ehliyet No</label>
                  <input
                    type="text"
                    value={surucuForm.ehliyet_no}
                    onChange={(e) => setSurucuForm({ ...surucuForm, ehliyet_no: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="A12345"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition"
                  >
                    <Save className="w-5 h-5" />
                    <span>Kaydet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowSurucuModal(false); setSurucuForm({ ad_soyad: '', telefon: '', tc_no: '', ehliyet_no: '', aktif: true }); }}
                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
