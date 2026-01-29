import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, Download, FileText, Fuel, Car, Calendar, TrendingUp, DollarSign, Filter } from 'lucide-react';
import { supabase } from './supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function AkaryakitTakip() {
  const [kayitlar, setKayitlar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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

  // Form state'leri - Basitleştirilmiş
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    plaka: '',
    surucu: '',
    litre: '',
    litre_fiyat: '',
    toplam_tutar: '',
    aciklama: ''
  });



  // Verileri yükle
  useEffect(() => {
    loadData();
  }, []);
  // Veri yükleme - Sadece yakıt kayıtları
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Sadece kayıtları yükle - basit
      const { data: kayitlarData, error: kayitlarError } = await supabase
        .from('fuel_records')
        .select(`
          *,
          vehicles:vehicle_id (plate),
          drivers:driver_id (full_name)
        `)
        .order('date', { ascending: false });

      if (kayitlarError) throw kayitlarError;

      setKayitlar(kayitlarData || []);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      alert('Veriler yüklenirken bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);

  // Toplam tutarı otomatik hesapla
  useEffect(() => {
    const litre = parseFloat(formData.litre) || 0;
    const litreFiyat = parseFloat(formData.litre_fiyat) || 0;
    setFormData(prev => ({ ...prev, toplam_tutar: (litre * litreFiyat).toFixed(2) }));
  }, [formData.litre, formData.litre_fiyat]);

  // Kayıt ekle/güncelle - Basitleştirilmiş (406 hatası düzeltildi)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 1. Plaka varsa araç bul, yoksa oluştur
      let vehicleId;
      const { data: existingVehicle, error: vehicleSelectError } = await supabase
        .from('vehicles')
        .select('id')
        .eq('plate', formData.plaka.toUpperCase())
        .maybeSingle(); // single() yerine maybeSingle() - 406 hatasını önler

      if (vehicleSelectError) throw vehicleSelectError;

      if (existingVehicle) {
        vehicleId = existingVehicle.id;
      } else {
        const { data: newVehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .insert([{ plate: formData.plaka.toUpperCase(), brand: '-', model: '-' }])
          .select()
          .single();
        
        if (vehicleError) throw vehicleError;
        vehicleId = newVehicle.id;
      }

      // 2. Sürücü varsa bul, yoksa oluştur
      let driverId;
      const { data: existingDriver, error: driverSelectError } = await supabase
        .from('drivers')
        .select('id')
        .eq('full_name', formData.surucu)
        .maybeSingle(); // single() yerine maybeSingle() - 406 hatasını önler

      if (driverSelectError) throw driverSelectError;

      if (existingDriver) {
        driverId = existingDriver.id;
      } else {
        const { data: newDriver, error: driverError } = await supabase
          .from('drivers')
          .insert([{ full_name: formData.surucu, active: true }])
          .select()
          .single();
        
        if (driverError) throw driverError;
        driverId = newDriver.id;
      }

      // 3. Yakıt kaydını oluştur
      const kayitData = {
        date: formData.tarih,
        vehicle_id: vehicleId,
        driver_id: driverId,
        liters: parseFloat(formData.litre),
        price_per_liter: parseFloat(formData.litre_fiyat),
        total_amount: parseFloat(formData.toplam_tutar),
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
      resetForm();
      loadData();
    } catch (error) {
      console.error('Kayıt hatası:', error);
      alert('Kayıt işlemi sırasında bir hata oluştu: ' + error.message);
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

  // Düzenle - Basitleştirilmiş
  const handleEdit = (kayit) => {
    setFormData({
      tarih: kayit.date,
      plaka: kayit.vehicles?.plate || '',
      surucu: kayit.drivers?.full_name || '',
      litre: kayit.liters.toString(),
      litre_fiyat: kayit.price_per_liter.toString(),
      toplam_tutar: kayit.total_amount.toString(),
      aciklama: kayit.description || ''
    });
    setEditingId(kayit.id);
    setShowModal(true);
  };

  // Form sıfırlama - Basitleştirilmiş
  const resetForm = () => {
    setFormData({
      tarih: new Date().toISOString().split('T')[0],
      plaka: '',
      surucu: '',
      litre: '',
      litre_fiyat: '',
      toplam_tutar: '',
      aciklama: ''
    });
  };

  // Filtreleme - Basitleştirilmiş
  const filtreliKayitlar = kayitlar.filter(kayit => {
    // Ay bazında filtreleme
    if (aylikGoruntule && secilenAy) {
      const kayitAy = kayit.date.substring(0, 7);
      if (kayitAy !== secilenAy) return false;
    }
    
    // Tarih aralığı
    if (!aylikGoruntule) {
      if (filtreBaslangic && kayit.date < filtreBaslangic) return false;
      if (filtreBitis && kayit.date > filtreBitis) return false;
    }

    // Plaka filtresi
    if (filtreArac && !kayit.vehicles?.plate?.includes(filtreArac.toUpperCase())) return false;
    
    // Sürücü filtresi
    if (filtreSurucu && !kayit.drivers?.full_name?.toLowerCase().includes(filtreSurucu.toLowerCase())) return false;
    
    return true;
  });

  // İstatistik hesaplama
  const istatistikler = {
    toplamKayit: filtreliKayitlar.length,
    toplamLitre: filtreliKayitlar.reduce((sum, k) => sum + k.liters, 0),
    toplamTutar: filtreliKayitlar.reduce((sum, k) => sum + k.total_amount, 0),
    ortalamaBirimFiyat: filtreliKayitlar.length > 0 
      ? filtreliKayitlar.reduce((sum, k) => sum + k.price_per_liter, 0) / filtreliKayitlar.length 
      : 0
  };

  // Excel'e aktar - Basitleştirilmiş
  const exportToExcel = () => {
    const data = filtreliKayitlar.map(kayit => ({
      'Tarih': new Date(kayit.date).toLocaleDateString('tr-TR'),
      'Plaka': kayit.vehicles?.plate || '-',
      'Sürücü': kayit.drivers?.full_name || '-',
      'Litre': kayit.liters,
      'Birim Fiyat': kayit.price_per_liter,
      'Toplam Tutar': kayit.total_amount,
      'Açıklama': kayit.description || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Akaryakıt Kayıtları');
    XLSX.writeFile(wb, `akaryakıt_kayıtları_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // PDF'e aktar - Profesyonel
  const exportToPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Sayfa boyutları
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Header - Şirket Bilgileri ve Logo Alanı
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    // Başlık
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AKARYAKIT TAKIP RAPORU', pageWidth / 2, 20, { align: 'center' });
    
    // Alt başlık
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const dateStr = new Date().toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(`Rapor Tarihi: ${dateStr}`, pageWidth / 2, 28, { align: 'center' });
    
    // Dönem bilgisi
    if (aylikGoruntule && secilenAy) {
      const monthYear = new Date(secilenAy + '-01').toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'long' 
      });
      doc.text(`Donem: ${monthYear}`, pageWidth / 2, 36, { align: 'center' });
    }
    
    // İstatistik kutuları
    doc.setTextColor(0, 0, 0);
    let startY = 55;
    
    const stats = [
      { label: 'Toplam Kayit', value: istatistikler.toplamKayit.toString(), icon: '📊' },
      { label: 'Toplam Litre', value: istatistikler.toplamLitre.toFixed(2) + ' L', icon: '⛽' },
      { label: 'Toplam Tutar', value: istatistikler.toplamTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL', icon: '💰' },
      { label: 'Ort. Birim Fiyat', value: istatistikler.ortalamaBirimFiyat.toFixed(2) + ' TL/L', icon: '📈' }
    ];
    
    const boxWidth = 45;
    const boxHeight = 18;
    const gap = 5;
    const totalWidth = (boxWidth * 4) + (gap * 3);
    const startX = (pageWidth - totalWidth) / 2;
    
    stats.forEach((stat, index) => {
      const x = startX + (index * (boxWidth + gap));
      
      // Kutu arka planı
      doc.setFillColor(248, 250, 252); // Gray-50
      doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, 'F');
      
      // Çerçeve
      doc.setDrawColor(226, 232, 240); // Gray-200
      doc.setLineWidth(0.5);
      doc.roundedRect(x, startY, boxWidth, boxHeight, 2, 2, 'S');
      
      // Label
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139); // Gray-500
      doc.text(stat.label, x + boxWidth / 2, startY + 6, { align: 'center' });
      
      // Value
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(stat.value, x + boxWidth / 2, startY + 14, { align: 'center' });
      doc.setFont('helvetica', 'normal');
    });
    
    // Tablo
    const tableData = filtreliKayitlar.map(kayit => [
      new Date(kayit.date).toLocaleDateString('tr-TR'),
      kayit.vehicles?.plate || '-',
      kayit.drivers?.full_name || '-',
      kayit.liters.toFixed(2) + ' L',
      kayit.price_per_liter.toFixed(2) + ' TL',
      kayit.total_amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL'
    ]);

    doc.autoTable({
      startY: startY + boxHeight + 10,
      head: [['Tarih', 'Plaka', 'Surucu', 'Litre', 'Birim Fiyat', 'Toplam Tutar']],
      body: tableData,
      foot: [[
        { content: 'TOPLAM', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } },
        istatistikler.toplamLitre.toFixed(2) + ' L',
        '',
        istatistikler.toplamTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL'
      ]],
      theme: 'striped',
      headStyles: { 
        fillColor: [37, 99, 235],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      footStyles: { 
        fillColor: [226, 232, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 10
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'left', cellWidth: 40 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'right', cellWidth: 30 },
        5: { halign: 'right', cellWidth: 35 }
      },
      margin: { left: 10, right: 10 },
      didDrawPage: function (data) {
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Sayfa ${data.pageNumber} / ${doc.internal.getNumberOfPages()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    });
    
    // Dosya adını Türkçe karakterler olmadan oluştur
    const fileName = `akaryakıt_raporu_${new Date().toISOString().split('T')[0]}.pdf`
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'G')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'U')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 'S')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'O')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C');
    
    doc.save(fileName);
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
        {/* Header - Basitleştirilmiş */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Fuel className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Akaryakıt Takip</h1>
                <p className="text-sm text-gray-500">Hangi plaka, hangi gün, kim, ne kadar</p>
              </div>
            </div>
            <button
              onClick={() => { setShowModal(true); setEditingId(null); resetForm(); }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span className="font-semibold">Yakıt Kaydı Ekle</span>
            </button>
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

        {/* Filtreler - Basitleştirilmiş */}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Plaka</label>
              <input
                type="text"
                value={filtreArac}
                onChange={(e) => setFiltreArac(e.target.value)}
                placeholder="34 ABC 123"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sürücü</label>
              <input
                type="text"
                value={filtreSurucu}
                onChange={(e) => setFiltreSurucu(e.target.value)}
                placeholder="Ahmet Yılmaz"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
                  <th className="px-4 py-3 text-left">Plaka</th>
                  <th className="px-4 py-3 text-left">Sürücü</th>
                  <th className="px-4 py-3 text-right">Litre</th>
                  <th className="px-4 py-3 text-right">Birim Fiyat</th>
                  <th className="px-4 py-3 text-right">Toplam</th>
                  <th className="px-4 py-3 text-center">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtreliKayitlar.map((kayit, index) => (
                  <tr key={kayit.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-3">{new Date(kayit.date).toLocaleDateString('tr-TR')}</td>
                    <td className="px-4 py-3 font-medium">{kayit.vehicles?.plate || '-'}</td>
                    <td className="px-4 py-3">{kayit.drivers?.full_name || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium">{kayit.liters} L</td>
                    <td className="px-4 py-3 text-right">{kayit.price_per_liter.toFixed(2)} ₺</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600">{kayit.total_amount.toFixed(2)} ₺</td>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plaka *</label>
                    <input
                      type="text"
                      required
                      value={formData.plaka}
                      onChange={(e) => setFormData({ ...formData, plaka: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="34 ABC 123"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sürücü *</label>
                    <input
                      type="text"
                      required
                      value={formData.surucu}
                      onChange={(e) => setFormData({ ...formData, surucu: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ahmet Yılmaz"
                    />
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


      </div>
    </div>
  );
}
