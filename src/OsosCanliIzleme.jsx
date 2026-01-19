import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap, TrendingUp, Activity, DollarSign, AlertTriangle, Settings, Download, Play, Square } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from './supabaseClient';

const OsosCanliIzleme = () => {
  const [olcum, setOlcum] = useState(null);
  const [gecmisVeriler, setGecmisVeriler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false); // Başlangıçta kapalı
  const [liveCollecting, setLiveCollecting] = useState(false); // Canlı toplama durumu
  const [error, setError] = useState(null);

  useEffect(() => {
    // İlk veri yükleme
    loadData();
    
    // Otomatik yenileme
    if (autoRefresh) {
      const interval = setInterval(loadData, 5000); // 5 saniyede bir
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadData = async () => {
    try {
      // Supabase'den en son OSOS verisini çek
      const { data, error } = await supabase
        .from('osos_olcumler')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setOlcum(data);
        setError(null);
        
        // Geçmiş verilere ekle (son 20 veri)
        setGecmisVeriler(prev => {
          const updated = [...prev, {
            zaman: new Date(data.created_at).toLocaleTimeString('tr-TR'),
            aktif_guc: parseFloat(data.aktif_guc || 0),
            reaktif_guc: parseFloat(data.reaktif_guc || 0),
            gerilim: parseFloat(data.gerilim_l1 || 0)
          }].slice(-20);
          return updated;
        });
      }
      
      setLoading(false);
    } catch (err) {
      console.error('OSOS verisi yüklenemedi:', err);
      setError('OSOS bağlantısı kurulamadı. Lütfen veri kaynağını kontrol edin.');
      setLoading(false);
    }
  };

  // OSOS Portal'dan canlı veri çek
  const fetchLiveData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/osos/update-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Canlı veri çekildi!\n\n` +
              `✓ Güncellenen: ${result.updated}\n` +
              `✗ Hatalı: ${result.errors}`);
        
        // Verileri yeniden yükle
        await loadData();
      } else {
        throw new Error(result.error || 'Veri çekme başarısız');
      }
    } catch (err) {
      console.error('Canlı veri çekme hatası:', err);
      alert(`❌ Hata: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Otomatik veri toplama başlat/durdur
  const toggleLiveCollection = async (start) => {
    try {
      const endpoint = start ? '/api/osos/auto-update/start' : '/api/osos/auto-update/stop';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ intervalMinutes: 5 })
      });

      const result = await response.json();

      if (result.success) {
        setLiveCollecting(start);
        alert(result.message);
      } else {
        throw new Error(result.error || 'İşlem başarısız');
      }
    } catch (err) {
      console.error('Otomatik toplama ayar hatası:', err);
      alert(`❌ Hata: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-600">OSOS verileri yükleniyor...</p>
      </div>
    );
  }

  if (error || !olcum) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 p-6">
        <AlertTriangle className="w-16 h-16 text-orange-500" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">OSOS Verisi Bulunamadı</h3>
          <p className="text-gray-600 mb-4">{error || 'Henüz OSOS verisi kaydedilmemiş.'}</p>
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-left max-w-2xl">
            <h4 className="font-semibold text-blue-800 mb-2">📋 Veri Kaydetmek İçin:</h4>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>OSOS Portal'a giriş yapın (EDAŞ kullanıcı bilgilerinizle)</li>
              <li>Sayaç verilerinizi indirin (JSON/Excel formatında)</li>
              <li>OSOS Rapor sekmesinden "OSOS JSON İmport" butonuna tıklayın</li>
              <li>İndirdiğiniz dosyayı seçin ve yükleyin</li>
            </ol>
          </div>
          <button
            onClick={loadData}
            className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            Yeniden Dene
          </button>
        </div>
      </div>
    );
  }

  const measurements = [
    { label: 'Aktif Güç', value: olcum.aktif_guc, unit: 'kW', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Zap },
    { label: 'Reaktif Güç', value: olcum.reaktif_guc, unit: 'kVAr', color: 'text-purple-600', bgColor: 'bg-purple-50', icon: Activity },
    { label: 'Kapasitif Güç', value: olcum.kapasitif_guc, unit: 'kVAr', color: 'text-pink-600', bgColor: 'bg-pink-50', icon: TrendingUp },
    { label: 'Gerilim L1', value: olcum.gerilim_l1, unit: 'V', color: 'text-green-600', bgColor: 'bg-green-50', icon: Zap },
    { label: 'Gerilim L2', value: olcum.gerilim_l2, unit: 'V', color: 'text-green-600', bgColor: 'bg-green-50', icon: Zap },
    { label: 'Gerilim L3', value: olcum.gerilim_l3, unit: 'V', color: 'text-green-600', bgColor: 'bg-green-50', icon: Zap },
    { label: 'Akım L1', value: olcum.akim_l1, unit: 'A', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: Activity },
    { label: 'Akım L2', value: olcum.akim_l2, unit: 'A', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: Activity },
    { label: 'Akım L3', value: olcum.akim_l3, unit: 'A', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: Activity },
    { label: 'Güç Faktörü', value: olcum.guc_faktoru, unit: 'cos φ', color: 'text-indigo-600', bgColor: 'bg-indigo-50', icon: DollarSign },
    { label: 'Toplam Enerji', value: olcum.toplam_enerji, unit: 'kWh', color: 'text-red-600', bgColor: 'bg-red-50', icon: TrendingUp },
    { label: 'Frekans', value: olcum.frekans, unit: 'Hz', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Activity },
  ];

  // Durum kontrolü
  const gerilimDurumu = olcum.gerilim_l1 >= 210 && olcum.gerilim_l1 <= 240;
  const frekansDurumu = olcum.frekans >= 49.5 && olcum.frekans <= 50.5;
  const gucFaktoruDurumu = olcum.guc_faktoru >= 0.85;

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📡 OSOS Canlı İzleme</h1>
          <p className="text-gray-600 mt-1">
            {olcum.fabrika_adi || 'OSOS Sayaç'} - 
            Son güncelleme: {new Date(olcum.created_at).toLocaleString('tr-TR')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchLiveData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            OSOS'tan Çek
          </button>
          
          <button
            onClick={() => toggleLiveCollection(!liveCollecting)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              liveCollecting 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {liveCollecting ? (
              <>
                <Square className="w-4 h-4" />
                Otomatik Toplamayı Durdur
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Otomatik Toplama Başlat
              </>
            )}
          </button>
          
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Yenile
          </button>
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Görüntü Yenileme Açık' : 'Görüntü Yenileme Kapalı'}
          </button>
        </div>
      </div>

      {/* Durum Göstergeleri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl border-2 ${
          gerilimDurumu ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${gerilimDurumu ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <div>
              <h3 className="text-sm font-medium text-gray-700">Gerilim Durumu</h3>
              <p className={`text-lg font-bold ${gerilimDurumu ? 'text-green-700' : 'text-red-700'}`}>
                {gerilimDurumu ? 'Normal (210-240V)' : 'Anormal'}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border-2 ${
          frekansDurumu ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${frekansDurumu ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            <div>
              <h3 className="text-sm font-medium text-gray-700">Frekans Durumu</h3>
              <p className={`text-lg font-bold ${frekansDurumu ? 'text-green-700' : 'text-red-700'}`}>
                {frekansDurumu ? 'Normal (49.5-50.5Hz)' : 'Anormal'}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl border-2 ${
          gucFaktoruDurumu ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${gucFaktoruDurumu ? 'bg-green-500' : 'bg-orange-500'} animate-pulse`} />
            <div>
              <h3 className="text-sm font-medium text-gray-700">Güç Faktörü</h3>
              <p className={`text-lg font-bold ${gucFaktoruDurumu ? 'text-green-700' : 'text-orange-700'}`}>
                {gucFaktoruDurumu ? 'İyi (>0.85)' : 'Kompanzasyon Gerekli'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ölçüm Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {measurements.map((measurement, index) => {
          const Icon = measurement.icon;
          return (
            <div key={index} className={`${measurement.bgColor} p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">{measurement.label}</h3>
                <Icon className={`w-5 h-5 ${measurement.color}`} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${measurement.color}`}>
                  {typeof measurement.value === 'number' ? parseFloat(measurement.value).toFixed(2) : measurement.value}
                </span>
                <span className="text-sm font-medium text-gray-500">{measurement.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Güç Grafiği */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⚡ Güç Değerleri (Anlık)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={gecmisVeriler}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="zaman" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="aktif_guc" stroke="#3b82f6" strokeWidth={2} name="Aktif (kW)" />
              <Line type="monotone" dataKey="reaktif_guc" stroke="#a855f7" strokeWidth={2} name="Reaktif (kVAr)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gerilim Grafiği */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-bold text-gray-800 mb-4">⚡ Gerilim (V)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={gecmisVeriler}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="zaman" tick={{ fontSize: 11 }} />
              <YAxis domain={[200, 250]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="gerilim" fill="#10b981" name="Gerilim (V)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Uyarılar */}
      {(!gerilimDurumu || !frekansDurumu || !gucFaktoruDurumu) && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-orange-800 mb-2">⚠️ Uyarılar</h3>
              <ul className="space-y-1 text-orange-700">
                {!gerilimDurumu && <li>• Gerilim normal aralığın dışında (Beklenen: 210-240V)</li>}
                {!frekansDurumu && <li>• Frekans normal aralığın dışında (Beklenen: 49.5-50.5Hz)</li>}
                {!gucFaktoruDurumu && <li>• Güç faktörü düşük (Beklenen: >0.85), kompanzasyon önerilir</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OsosCanliIzleme;
