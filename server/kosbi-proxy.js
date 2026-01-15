const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// KOSBI Base URL
const KOSBI_BASE_URL = 'https://elektrik.kosbi.org.tr';

// Session storage (production'da Redis kullanın)
const sessions = new Map();

/**
 * KOSBI Login
 * POST /api/kosbi/login
 * Body: { username, password }
 */
app.post('/api/kosbi/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`🔐 KOSBI Login denemesi: ${username}`);
    
    // İlk olarak login sayfasını al (ViewState ve EventValidation için)
    const loginPageResponse = await axios.get(`${KOSBI_BASE_URL}/Login.aspx`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(loginPageResponse.data);
    const viewState = $('input[name="__VIEWSTATE"]').val();
    const eventValidation = $('input[name="__EVENTVALIDATION"]').val();
    const viewStateGenerator = $('input[name="__VIEWSTATEGENERATOR"]').val();
    
    console.log('📄 ViewState alındı');
    
    // Login formunu gönder
    const loginData = new URLSearchParams({
      '__VIEWSTATE': viewState,
      '__EVENTVALIDATION': eventValidation,
      '__VIEWSTATEGENERATOR': viewStateGenerator,
      'txtKullaniciAdi': username,
      'txtSifre': password,
      'btnGiris': 'Giriş'
    });
    
    const loginResponse = await axios.post(`${KOSBI_BASE_URL}/Login.aspx`, loginData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': `${KOSBI_BASE_URL}/Login.aspx`,
        'Cookie': loginPageResponse.headers['set-cookie']?.join('; ') || ''
      },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    });
    
    // Cookie'leri al
    const cookies = loginResponse.headers['set-cookie'];
    
    if (!cookies || loginResponse.status !== 302) {
      console.log('❌ Login başarısız - Yanlış kullanıcı adı veya şifre');
      return res.status(401).json({ 
        success: false, 
        error: 'Kullanıcı adı veya şifre hatalı' 
      });
    }
    
    // Session ID oluştur
    const sessionId = `${username}_${Date.now()}`;
    sessions.set(sessionId, {
      username,
      cookies: cookies.map(c => c.split(';')[0]).join('; '),
      loginTime: Date.now()
    });
    
    console.log('✅ Login başarılı');
    
    res.json({
      success: true,
      sessionId,
      message: 'Giriş başarılı'
    });
    
  } catch (error) {
    console.error('❌ Login hatası:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * KOSBI Sayaç Verileri
 * GET /api/kosbi/meters/:sessionId
 */
app.get('/api/kosbi/meters/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(401).json({ 
        success: false, 
        error: 'Session bulunamadı. Lütfen tekrar giriş yapın.' 
      });
    }
    
    console.log(`📊 Sayaç verileri çekiliyor: ${session.username}`);
    
    // Sayaç verilerini çek (sayfa adı değişebilir, kontrol edilmeli)
    const metersResponse = await axios.get(`${KOSBI_BASE_URL}/SayacOkumalari.aspx`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': session.cookies,
        'Referer': `${KOSBI_BASE_URL}/Default.aspx`
      }
    });
    
    // HTML'i parse et
    const $ = cheerio.load(metersResponse.data);
    const meters = [];
    
    // Tablodaki verileri çek (tablo yapısı siteye göre değişebilir)
    $('table tr').each((index, element) => {
      if (index === 0) return; // Header'ı atla
      
      const cells = $(element).find('td');
      if (cells.length >= 5) {
        meters.push({
          sayacNo: $(cells[0]).text().trim(),
          ad: $(cells[1]).text().trim(),
          cekilen: $(cells[2]).text().trim(),
          verilen: $(cells[3]).text().trim(),
          reaktifCekilen: $(cells[4]).text().trim() || '0',
          reaktifVerilen: $(cells[5]).text().trim() || '0',
          tarih: new Date().toISOString().split('T')[0]
        });
      }
    });
    
    console.log(`✅ ${meters.length} sayaç verisi bulundu`);
    
    res.json({
      success: true,
      data: meters,
      count: meters.length
    });
    
  } catch (error) {
    console.error('❌ Sayaç verisi çekme hatası:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * Session temizleme
 * DELETE /api/kosbi/logout/:sessionId
 */
app.delete('/api/kosbi/logout/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  sessions.delete(sessionId);
  console.log(`🚪 Session silindi: ${sessionId}`);
  res.json({ success: true });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    activeSessions: sessions.size,
    timestamp: new Date().toISOString()
  });
});

// Session temizleme (her 1 saatte bir, 2 saatten eski sessionları sil)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.loginTime > 2 * 60 * 60 * 1000) { // 2 saat
      sessions.delete(sessionId);
      console.log(`🧹 Eski session temizlendi: ${sessionId}`);
    }
  }
}, 60 * 60 * 1000); // Her 1 saatte bir

app.listen(PORT, () => {
  console.log(`🚀 KOSBI Proxy Server çalışıyor: http://localhost:${PORT}`);
  console.log(`📡 CORS enabled for: http://localhost:3000, http://localhost:5173`);
  console.log(`🔐 Endpoints:`);
  console.log(`   POST   /api/kosbi/login`);
  console.log(`   GET    /api/kosbi/meters/:sessionId`);
  console.log(`   DELETE /api/kosbi/logout/:sessionId`);
  console.log(`   GET    /health`);
});

module.exports = app;
