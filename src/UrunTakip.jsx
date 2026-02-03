import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Edit2, Trash2, Save, X, MapPin, Tag, Hash, Calendar, Building2, Filter, Download, Upload, RefreshCw, AlertCircle, Database } from 'lucide-react';
import { supabase } from './supabaseClient';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const UrunTakip = () => {
  const [urunler, setUrunler] = useState([]);
  const [filteredUrunler, setFilteredUrunler] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUrun, setEditingUrun] = useState(null);
  const [filterKategori, setFilterKategori] = useState('');
  const [filterMarka, setFilterMarka] = useState('');
  const [filterLokasyon, setFilterLokasyon] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState(null);

  const [formData, setFormData] = useState({
    urun_adi: '',
    kategori: '',
    marka: '',
    model: '',
    miktar: 0,
    birim: 'Adet',
    lokasyon: '',
    aciklama: '',
    seri_no: '',
    tarih: new Date().toISOString().split('T')[0]
  });

  // Ürünleri yükle - session dinleyicisi ile
  useEffect(() => {
    // Session dinleyicisi
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth durumu değişti:', event, session?.user?.id);
        if (session?.user) {
          // Kullanıcı giriş yaptı veya session kuruldu
          loadUrunler();
        } else {
          // Kullanıcı çıkış yaptı
          setUrunler([]);
          setDbError(null);
        }
      }
    );

    // İlk yük
    loadUrunler();

    // Cleanup
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Arama ve filtreleme
  useEffect(() => {
    let filtered = [...urunler];

    // Arama
    if (searchTerm) {
      filtered = filtered.filter(urun =>
        urun.urun_adi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        urun.marka?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        urun.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        urun.seri_no?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Kategori filtresi
    if (filterKategori) {
      filtered = filtered.filter(urun => urun.kategori === filterKategori);
    }

    // Marka filtresi
    if (filterMarka) {
      filtered = filtered.filter(urun => urun.marka === filterMarka);
    }

    // Lokasyon filtresi
    if (filterLokasyon) {
      filtered = filtered.filter(urun => urun.lokasyon === filterLokasyon);
    }

    setFilteredUrunler(filtered);
  }, [searchTerm, filterKategori, filterMarka, filterLokasyon, urunler]);

  const loadUrunler = async () => {
    try {
      setLoading(true);
      setDbError(null);
      
      // Session'dan user al (getUser yerine)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.warn('Oturum bulunamadı, ürünler yüklenmedi');
        setUrunler([]);
        return;
      }

      console.log('✅ Oturum var, ürünler yükleniyor:', session.user.id);

      const { data, error } = await supabase
        .from('urun_takip')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase hatası:', error);
        
        // Tablo yoksa özel hata mesajı
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          setDbError('table_not_found');
        } else if (error.message?.includes('permission')) {
          setDbError('permission_denied');
        } else {
          setDbError('general_error');
        }
        throw error;
      }
      
      console.log('✅ Ürünler yüklendi:', data?.length || 0);
      setUrunler(data || []);
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdate = async () => {
    if (!formData.urun_adi || !formData.kategori) {
      alert('Lütfen ürün adı ve kategori alanlarını doldurun');
      return;
    }

    try {
      setLoading(true);

      // Session'dan user al
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session hatası:', sessionError);
        alert('Oturum hatası. Lütfen yeniden giriş yapın.');
        return;
      }
      
      if (!session?.user) {
        alert('Lütfen önce giriş yapın.');
        return;
      }

      console.log('✅ Kullanıcı oturumu var:', session.user.id);

      if (editingUrun) {
        // Güncelleme
        const { data, error } = await supabase
          .from('urun_takip')
          .update(formData)
          .eq('id', editingUrun.id)
          .select();

        if (error) {
          console.error('Güncelleme hatası:', error);
          throw error;
        }
        
        console.log('✅ Güncelleme başarılı:', data);
        alert('Ürün başarıyla güncellendi');
      } else {
        // Yeni ekleme - user_id ekle
        const dataToInsert = {
          ...formData,
          user_id: session.user.id
        };
        
        console.log('📝 Eklenecek veri:', dataToInsert);
        
        const { data, error } = await supabase
          .from('urun_takip')
          .insert([dataToInsert])
          .select();

        if (error) {
          console.error('Ekleme hatası:', error);
          console.error('Hata detayları:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        
        console.log('✅ Ekleme başarılı:', data);
        alert('Ürün başarıyla eklendi');
      }

      resetForm();
      loadUrunler();
    } catch (error) {
      console.error('Ürün kaydedilirken hata:', error);
      
      if (error.code === '42501') {
        alert('Yetki hatası: Bu işlemi yapmaya yetkiniz yok. Lütfen yöneticinizle iletişime geçin.');
      } else if (error.code === 'PGRST116') {
        alert('Tablo bulunamadı. Lütfen migration dosyasını Supabase\'de çalıştırın.');
      } else if (error.message?.includes('JWT')) {
        alert('Oturum süresi dolmuş. Lütfen yeniden giriş yapın.');
      } else {
        alert('Ürün kaydedilirken hata oluştu: ' + (error.message || 'Bilinmeyen hata'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('urun_takip')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Ürün başarıyla silindi');
      loadUrunler();
    } catch (error) {
      console.error('Ürün silinirken hata:', error);
      alert('Ürün silinirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (urun) => {
    setEditingUrun(urun);
    setFormData({
      urun_adi: urun.urun_adi || '',
      kategori: urun.kategori || '',
      marka: urun.marka || '',
      model: urun.model || '',
      miktar: urun.miktar || 0,
      birim: urun.birim || 'Adet',
      lokasyon: urun.lokasyon || '',
      aciklama: urun.aciklama || '',
      seri_no: urun.seri_no || '',
      tarih: urun.tarih || new Date().toISOString().split('T')[0]
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      urun_adi: '',
      kategori: '',
      marka: '',
      model: '',
      miktar: 0,
      birim: 'Adet',
      lokasyon: '',
      aciklama: '',
      seri_no: '',
      tarih: new Date().toISOString().split('T')[0]
    });
    setEditingUrun(null);
    setShowAddModal(false);
  };

  // Benzersiz değerleri al
  const uniqueKategoriler = [...new Set(urunler.map(u => u.kategori).filter(Boolean))];
  const uniqueMarkalar = [...new Set(urunler.map(u => u.marka).filter(Boolean))];
  const uniqueLokasyonlar = [...new Set(urunler.map(u => u.lokasyon).filter(Boolean))];

  // Kategori bazında özet
  const kategoriOzet = uniqueKategoriler.map(kategori => {
    const kategoriUrunler = urunler.filter(u => u.kategori === kategori);
    return {
      kategori,
      toplam: kategoriUrunler.reduce((sum, u) => sum + (u.miktar || 0), 0),
      adet: kategoriUrunler.length
    };
  });

  // PDF Export Fonksiyonu
  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape format
    
    // Başlık
    doc.setFontSize(20);
    doc.setTextColor(88, 80, 236); // Purple color
    doc.text('Ürün Takip Sistemi - Envanter Raporu', 20, 20);
    
    // Tarih
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, 28);
    
    // İstatistikler
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Genel İstatistikler:', 20, 38);
    
    doc.setFontSize(10);
    const stats = [
      `Toplam Ürün Çeşidi: ${filteredUrunler.length}`,
      `Toplam Miktar: ${filteredUrunler.reduce((sum, u) => sum + (u.miktar || 0), 0)}`,
      `Kategori Sayısı: ${uniqueKategoriler.length}`,
      `Lokasyon Sayısı: ${uniqueLokasyonlar.length}`
    ];
    
    let yPos = 45;
    stats.forEach(stat => {
      doc.text(stat, 25, yPos);
      yPos += 6;
    });
    
    // Kategori Özeti
    if (kategoriOzet.length > 0) {
      yPos += 5;
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Kategori Özeti:', 20, yPos);
      yPos += 7;
      
      const kategoriData = kategoriOzet.map(k => [
        k.kategori,
        k.adet.toString(),
        k.toplam.toString()
      ]);
      
      doc.autoTable({
        startY: yPos,
        head: [['Kategori', 'Ürün Çeşidi', 'Toplam Miktar']],
        body: kategoriData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [88, 80, 236], textColor: 255, fontStyle: 'bold' },
        margin: { left: 20 },
        tableWidth: 100
      });
      
      yPos = doc.lastAutoTable.finalY + 10;
    }
    
    // Ürün Listesi
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Ürün Listesi:', 20, yPos);
    yPos += 7;
    
    // Filtre bilgisi
    if (searchTerm || filterKategori || filterMarka || filterLokasyon) {
      doc.setFontSize(9);
      doc.setTextColor(150);
      let filterText = 'Aktif Filtreler: ';
      const filters = [];
      if (searchTerm) filters.push(`Arama: "${searchTerm}"`);
      if (filterKategori) filters.push(`Kategori: "${filterKategori}"`);
      if (filterMarka) filters.push(`Marka: "${filterMarka}"`);
      if (filterLokasyon) filters.push(`Lokasyon: "${filterLokasyon}"`);
      filterText += filters.join(', ');
      doc.text(filterText, 20, yPos);
      yPos += 5;
      doc.setTextColor(0);
    }
    
    // Ürün tablosu
    const tableData = filteredUrunler.map(urun => [
      urun.urun_adi || '',
      urun.kategori || '',
      urun.marka || '-',
      urun.model || '-',
      `${urun.miktar || 0} ${urun.birim || 'Adet'}`,
      urun.lokasyon || '-',
      urun.seri_no || '-'
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [['Ürün Adı', 'Kategori', 'Marka', 'Model', 'Miktar', 'Lokasyon', 'Seri No']],
      body: tableData,
      theme: 'striped',
      styles: { 
        fontSize: 8, 
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [88, 80, 236], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 9
      },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 40 },
        6: { cellWidth: 35 }
      }
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Sayfa ${i} / ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }
    
    // PDF'i indir
    const fileName = `Urun_Takip_Raporu_${new Date().toLocaleDateString('tr-TR').replace(/\./g, '-')}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Veritabanı Hata Uyarısı */}
      {dbError === 'table_not_found' && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-6 rounded-lg shadow-md">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Veritabanı Tablosu Bulunamadı
              </h3>
              <p className="text-red-700 mb-4">
                <code className="bg-red-100 px-2 py-1 rounded">urun_takip</code> tablosu henüz oluşturulmamış. 
                Lütfen aşağıdaki adımları takip edin:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-red-700 mb-4">
                <li>
                  <a 
                    href="https://app.supabase.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Supabase Dashboard
                  </a>'a gidin
                </li>
                <li>Sol menüden <strong>SQL Editor</strong> seçeneğine tıklayın</li>
                <li><code className="bg-red-100 px-2 py-1 rounded">urun-takip-migration.sql</code> dosyasının içeriğini kopyalayın</li>
                <li>SQL Editor'e yapıştırıp <strong>Run</strong> butonuna tıklayın</li>
                <li>Bu sayfayı yenileyin</li>
              </ol>
              <div className="flex gap-3">
                <button
                  onClick={() => window.open('https://app.supabase.com', '_blank')}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  Supabase'i Aç
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sayfayı Yenile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {dbError === 'permission_denied' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-6 rounded-lg shadow-md">
          <div className="flex items-start">
            <AlertCircle className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Yetki Hatası
              </h3>
              <p className="text-yellow-700 mb-3">
                Bu verilere erişim yetkiniz yok. Lütfen giriş yaptığınızdan emin olun.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
              >
                Sayfayı Yenile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center">
              <Package className="mr-3 h-8 w-8" />
              Ürün Takip Sistemi
            </h1>
            <p className="text-purple-100 mt-2">Envanter yönetimi ve ürün takibi</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToPDF}
              disabled={filteredUrunler.length === 0}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="PDF olarak indir"
            >
              <Download className="w-5 h-5" />
              PDF İndir
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Yeni Ürün Ekle
            </button>
          </div>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Toplam Ürün</p>
              <p className="text-2xl font-bold text-gray-800">{urunler.length}</p>
            </div>
            <Package className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Toplam Miktar</p>
              <p className="text-2xl font-bold text-gray-800">
                {urunler.reduce((sum, u) => sum + (u.miktar || 0), 0)}
              </p>
            </div>
            <Hash className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Kategori</p>
              <p className="text-2xl font-bold text-gray-800">{uniqueKategoriler.length}</p>
            </div>
            <Tag className="w-10 h-10 text-orange-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Lokasyon</p>
              <p className="text-2xl font-bold text-gray-800">{uniqueLokasyonlar.length}</p>
            </div>
            <MapPin className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Arama ve Filtreler */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Arama */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Ürün, marka, model, seri no ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Kategori Filtresi */}
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Tüm Kategoriler</option>
            {uniqueKategoriler.map(kat => (
              <option key={kat} value={kat}>{kat}</option>
            ))}
          </select>

          {/* Marka Filtresi */}
          <select
            value={filterMarka}
            onChange={(e) => setFilterMarka(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Tüm Markalar</option>
            {uniqueMarkalar.map(marka => (
              <option key={marka} value={marka}>{marka}</option>
            ))}
          </select>

          {/* Lokasyon Filtresi */}
          <select
            value={filterLokasyon}
            onChange={(e) => setFilterLokasyon(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Tüm Lokasyonlar</option>
            {uniqueLokasyonlar.map(lok => (
              <option key={lok} value={lok}>{lok}</option>
            ))}
          </select>
        </div>

        {(searchTerm || filterKategori || filterMarka || filterLokasyon) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterKategori('');
              setFilterMarka('');
              setFilterLokasyon('');
            }}
            className="mt-3 text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Filtreleri Temizle
          </button>
        )}
      </div>

      {/* Kategori Özet */}
      {kategoriOzet.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Tag className="w-5 h-5 mr-2 text-purple-600" />
            Kategori Özeti
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {kategoriOzet.map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-lg border border-purple-200">
                <p className="text-sm font-semibold text-gray-800">{item.kategori}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {item.adet} ürün • {item.toplam} toplam miktar
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ürün Listesi */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Yükleniyor...</p>
            </div>
          ) : filteredUrunler.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Henüz ürün eklenmemiş</p>
              <p className="text-gray-400 text-sm mt-2">Yeni ürün eklemek için yukarıdaki butonu kullanın</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Ürün Adı</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Kategori</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Marka</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Model</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">Miktar</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Lokasyon</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Seri No</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUrunler.map((urun, index) => (
                  <tr key={urun.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{urun.urun_adi}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                        {urun.kategori}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{urun.marka || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{urun.model || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="font-semibold text-gray-800">{urun.miktar}</span>
                      <span className="text-gray-500 text-xs ml-1">{urun.birim}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {urun.lokasyon ? (
                        <span className="flex items-center text-xs">
                          <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                          {urun.lokasyon}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">{urun.seri_no || '-'}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(urun)}
                          className="text-blue-600 hover:text-blue-800 transition p-1"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(urun.id)}
                          className="text-red-600 hover:text-red-800 transition p-1"
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
          )}
        </div>
      </div>

      {/* Ekleme/Düzenleme Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Package className="mr-2 h-6 w-6" />
                {editingUrun ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </h3>
              <button
                onClick={resetForm}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Ürün Adı */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ürün Adı *
                </label>
                <input
                  type="text"
                  value={formData.urun_adi}
                  onChange={(e) => setFormData({ ...formData, urun_adi: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Örn: Panel, Trafo, Kablo vb."
                />
              </div>

              {/* Kategori ve Marka */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori *
                  </label>
                  <input
                    type="text"
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Örn: Elektrik Malzemesi"
                    list="kategoriler"
                  />
                  <datalist id="kategoriler">
                    {uniqueKategoriler.map(kat => (
                      <option key={kat} value={kat} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marka
                  </label>
                  <input
                    type="text"
                    value={formData.marka}
                    onChange={(e) => setFormData({ ...formData, marka: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Örn: Schneider"
                    list="markalar"
                  />
                  <datalist id="markalar">
                    {uniqueMarkalar.map(marka => (
                      <option key={marka} value={marka} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Model ve Seri No */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Örn: ABC-123"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seri No
                  </label>
                  <input
                    type="text"
                    value={formData.seri_no}
                    onChange={(e) => setFormData({ ...formData, seri_no: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Örn: SN12345"
                  />
                </div>
              </div>

              {/* Miktar ve Birim */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Miktar
                  </label>
                  <input
                    type="number"
                    value={formData.miktar}
                    onChange={(e) => setFormData({ ...formData, miktar: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Birim
                  </label>
                  <select
                    value={formData.birim}
                    onChange={(e) => setFormData({ ...formData, birim: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              </div>

              {/* Lokasyon ve Tarih */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lokasyon
                  </label>
                  <input
                    type="text"
                    value={formData.lokasyon}
                    onChange={(e) => setFormData({ ...formData, lokasyon: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Örn: Depo-A, Raf-12"
                    list="lokasyonlar"
                  />
                  <datalist id="lokasyonlar">
                    {uniqueLokasyonlar.map(lok => (
                      <option key={lok} value={lok} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={formData.tarih}
                    onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama
                </label>
                <textarea
                  value={formData.aciklama}
                  onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                  placeholder="Ek bilgiler, notlar..."
                />
              </div>

              {/* Butonlar */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleAddOrUpdate}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Kaydediliyor...' : editingUrun ? 'Güncelle' : 'Kaydet'}
                </button>
                <button
                  onClick={resetForm}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrunTakip;
