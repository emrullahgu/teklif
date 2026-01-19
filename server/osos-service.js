/**
 * OSOS Otomatik Veri Çekme Servisi
 * Python osos_collector.py ile entegre çalışır
 */

const { spawn } = require('child_process');
const path = require('path');
const express = require('express');
const router = express.Router();

// Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Python script yolu
const PYTHON_SCRIPT = path.join(__dirname, '../Gunay/osos_collector.py');

/**
 * Python OSOS collector'ı çalıştır ve verileri Supabase'e kaydet
 */
async function runOSOSCollector() {
  return new Promise((resolve, reject) => {
    console.log('🔄 OSOS veri toplama başlatılıyor...');
    
    const python = spawn('python', [PYTHON_SCRIPT]);
    
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(`[OSOS] ${text.trim()}`);
    });
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`[OSOS Error] ${data}`);
    });
    
    python.on('close', (code) => {
      if (code === 0) {
        console.log('✅ OSOS veri toplama tamamlandı');
        resolve({ success: true, output });
      } else {
        console.error('❌ OSOS veri toplama başarısız:', errorOutput);
        reject(new Error(`Python script exited with code ${code}`));
      }
    });
  });
}

/**
 * OSOS Portal'dan canlı veri çek
 * @param {string} fabrikaAdi - Fabrika adı
 * @param {string} sayacNo - Sayaç numarası
 */
async function fetchLiveOSOSData(fabrikaAdi, sayacNo) {
  try {
    console.log(`📡 Canlı OSOS verisi çekiliyor: ${fabrikaAdi} - ${sayacNo}`);
    
    // Python script'i çalıştır
    await runOSOSCollector();
    
    // Supabase'den son veriyi al
    const { data, error } = await supabase
      .from('osos_olcumler')
      .select('*')
      .eq('fabrika_adi', fabrikaAdi)
      .eq('sayac_no', sayacNo)
      .order('olcum_zamani', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('❌ OSOS veri çekme hatası:', error);
    throw error;
  }
}

/**
 * Tüm fabrikalar için OSOS verilerini güncelle
 */
async function updateAllFactories() {
  try {
    console.log('🏭 Tüm fabrikalar için OSOS güncelleniyor...');
    
    // Supabase'den fabrika listesini al
    const { data: fabrikalar, error } = await supabase
      .from('osos_fabrikalar')
      .select('*')
      .eq('aktif', true);
    
    if (error) {
      throw error;
    }
    
    if (!fabrikalar || fabrikalar.length === 0) {
      console.log('⚠️ Aktif fabrika bulunamadı');
      return { updated: 0, errors: 0 };
    }
    
    let updated = 0;
    let errors = 0;
    
    for (const fabrika of fabrikalar) {
      try {
        await fetchLiveOSOSData(fabrika.fabrika_adi, fabrika.sayac_no);
        updated++;
        console.log(`✅ ${fabrika.fabrika_adi} güncellendi`);
      } catch (err) {
        errors++;
        console.error(`❌ ${fabrika.fabrika_adi} güncellenemedi:`, err.message);
      }
      
      // Rate limiting - API'yi yormamak için
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`📊 Güncelleme tamamlandı: ${updated} başarılı, ${errors} hatalı`);
    
    return { updated, errors };
  } catch (error) {
    console.error('❌ Fabrika güncelleme hatası:', error);
    throw error;
  }
}

// API Endpoints

/**
 * GET /api/osos/live/:fabrikaAdi/:sayacNo
 * Belirli bir fabrika için canlı OSOS verisi çek
 */
router.get('/live/:fabrikaAdi/:sayacNo', async (req, res) => {
  try {
    const { fabrikaAdi, sayacNo } = req.params;
    const data = await fetchLiveOSOSData(fabrikaAdi, sayacNo);
    
    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/osos/update-all
 * Tüm fabrikalar için OSOS verilerini güncelle
 */
router.post('/update-all', async (req, res) => {
  try {
    const result = await updateAllFactories();
    
    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/osos/manual-collect
 * Manuel veri toplama tetikle
 */
router.post('/manual-collect', async (req, res) => {
  try {
    const result = await runOSOSCollector();
    
    res.json({
      success: true,
      message: 'OSOS veri toplama başarılı',
      output: result.output
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/osos/status
 * OSOS servis durumunu kontrol et
 */
router.get('/status', async (req, res) => {
  try {
    // Son 5 dakikadaki verileri kontrol et
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data, error, count } = await supabase
      .from('osos_olcumler')
      .select('*', { count: 'exact', head: true })
      .gte('olcum_zamani', fiveMinutesAgo);
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      status: count > 0 ? 'active' : 'idle',
      recentMeasurements: count || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Otomatik güncelleme (her 5 dakikada bir)
let autoUpdateInterval = null;

function startAutoUpdate(intervalMinutes = 5) {
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
  }
  
  console.log(`🔄 Otomatik OSOS güncelleme başlatıldı (${intervalMinutes} dakikada bir)`);
  
  autoUpdateInterval = setInterval(async () => {
    try {
      console.log('⏰ Otomatik güncelleme zamanı...');
      await updateAllFactories();
    } catch (error) {
      console.error('❌ Otomatik güncelleme hatası:', error);
    }
  }, intervalMinutes * 60 * 1000);
  
  // İlk çalıştırmayı hemen yap
  setTimeout(() => {
    updateAllFactories().catch(console.error);
  }, 5000);
}

function stopAutoUpdate() {
  if (autoUpdateInterval) {
    clearInterval(autoUpdateInterval);
    autoUpdateInterval = null;
    console.log('⏹️ Otomatik OSOS güncelleme durduruldu');
  }
}

/**
 * POST /api/osos/auto-update/start
 * Otomatik güncellemeyi başlat
 */
router.post('/auto-update/start', (req, res) => {
  const { intervalMinutes = 5 } = req.body;
  
  startAutoUpdate(intervalMinutes);
  
  res.json({
    success: true,
    message: `Otomatik güncelleme başlatıldı (${intervalMinutes} dakika)`,
    intervalMinutes
  });
});

/**
 * POST /api/osos/auto-update/stop
 * Otomatik güncellemeyi durdur
 */
router.post('/auto-update/stop', (req, res) => {
  stopAutoUpdate();
  
  res.json({
    success: true,
    message: 'Otomatik güncelleme durduruldu'
  });
});

module.exports = {
  router,
  fetchLiveOSOSData,
  updateAllFactories,
  startAutoUpdate,
  stopAutoUpdate
};
