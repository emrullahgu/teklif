import React, { useState, useEffect, useRef } from 'react';
import { Printer, FileText, Save, RotateCcw, Edit3, Download, Zap, AlertTriangle, CheckCircle, Upload, X } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

export default function Osos() {
  const [printMode, setPrintMode] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [logo, setLogo] = useState(null);
  const reportRef = useRef(null);
  
  // KOSBI Login State
  const [showKosbiModal, setShowKosbiModal] = useState(false);
  const [kosbiUsers, setKosbiUsers] = useState([
    { id: 1, name: "Novatem", username: "7372509", password: "0129" },
    { id: 2, name: "Ektam", username: "7372470", password: "0129" }
  ]);
  const [selectedKosbiUser, setSelectedKosbiUser] = useState(null);
  const [isLoadingKosbi, setIsLoadingKosbi] = useState(false);
  const [kosbiData, setKosbiData] = useState([]);
  
  // Excel Import State
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [excelData, setExcelData] = useState([]);
  const [excelFileName, setExcelFileName] = useState('');
  
  // WorkTracker Entegrasyonu
  const [showWorkTrackerModal, setShowWorkTrackerModal] = useState(false);
  const [workTrackerConfig, setWorkTrackerConfig] = useState({
    url: 'http://localhost:3000',
    email: '',
    password: ''
  });
  const [workTrackerToken, setWorkTrackerToken] = useState(null);
  const [workTrackerUsers, setWorkTrackerUsers] = useState([]);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    assignedToId: '',
    dueDate: ''
  });
  const [isLoadingWorkTracker, setIsLoadingWorkTracker] = useState(false);
  
  // Form verileri
  const [formData, setFormData] = useState({
    firmaAdi: "",
    raporNo: "",
    raporTarihi: new Date().toISOString().split('T')[0],
    adres: "",
    yetkili: "",
    telefon: "",
    email: "",
    vergiNo: "",
    kontrolEdenAd: "",
    kontrolEdenUnvan: "OSOS Uzmanı",
    kontrolEdenOdaNo: "",
    kontrolTarihi: new Date().toISOString().split('T')[0],
    sonrakiKontrolTarihi: "",
    tesisGucuKW: "",
    calisanSayisi: "",
    aciklama: "",
    tespit: "",
    oneri: "",
    sonuc: "Uygun"
  });

  // Ölçüm verileri
  const [measurements, setMeasurements] = useState([
    { id: 1, olcumNoktasi: "Ana Pano", parametre: "Topraklama Direnci", deger: "", birim: "Ohm", limit: "< 10", sonuc: "Uygun" },
    { id: 2, olcumNoktasi: "Tali Pano 1", parametre: "İzolasyon Direnci", deger: "", birim: "MOhm", limit: "> 1", sonuc: "Uygun" },
    { id: 3, olcumNoktasi: "Kompresör", parametre: "Kaçak Akım", deger: "", birim: "mA", limit: "< 30", sonuc: "Uygun" }
  ]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMeasurementChange = (id, field, value) => {
    setMeasurements(prev => prev.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const addMeasurement = () => {
    const newId = measurements.length > 0 ? Math.max(...measurements.map(m => m.id)) + 1 : 1;
    setMeasurements([...measurements, {
      id: newId,
      olcumNoktasi: "",
      parametre: "",
      deger: "",
      birim: "",
      limit: "",
      sonuc: "Uygun"
    }]);
  };

  const removeMeasurement = (id) => {
    if (measurements.length > 1) {
      setMeasurements(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogo(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
  };

  const printReport = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
  };

  const exportPDF = async () => {
    try {
      setEditMode(false);
      setPrintMode(true);
      
      setTimeout(async () => {
        const element = reportRef.current;
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 0;
        
        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`OSOS_Rapor_${formData.raporNo || 'YeniRapor'}.pdf`);
        
        setPrintMode(false);
        setEditMode(true);
      }, 500);
    } catch (error) {
      console.error('PDF oluşturma hatası:', error);
      alert('PDF oluşturulurken bir hata oluştu.');
      setPrintMode(false);
      setEditMode(true);
    }
  };

  const resetForm = () => {
    if (confirm('Tüm verileri sıfırlamak istediğinizden emin misiniz?')) {
      setFormData({
        firmaAdi: "",
        raporNo: "",
        raporTarihi: new Date().toISOString().split('T')[0],
        adres: "",
        yetkili: "",
        telefon: "",
        email: "",
        vergiNo: "",
        kontrolEdenAd: "",
        kontrolEdenUnvan: "OSOS Uzmanı",
        kontrolEdenOdaNo: "",
        kontrolTarihi: new Date().toISOString().split('T')[0],
        sonrakiKontrolTarihi: "",
        tesisGucuKW: "",
        calisanSayisi: "",
        aciklama: "",
        tespit: "",
        oneri: "",
        sonuc: "Uygun"
      });
      setMeasurements([
        { id: 1, olcumNoktasi: "Ana Pano", parametre: "Topraklama Direnci", deger: "", birim: "Ohm", limit: "< 10", sonuc: "Uygun" }
      ]);
      setLogo(null);
    }
  };

  // KOSBI kullanıcı ekle/düzenle
  const addKosbiUser = () => {
    const name = prompt('Kullanıcı Adı (örn: Novatem):');
    const username = prompt('KOSBI Kullanıcı No:');
    const password = prompt('KOSBI Şifre:');
    
    if (name && username && password) {
      const newId = kosbiUsers.length > 0 ? Math.max(...kosbiUsers.map(u => u.id)) + 1 : 1;
      setKosbiUsers([...kosbiUsers, { id: newId, name, username, password }]);
      alert('✅ Kullanıcı eklendi!');
    }
  };

  const removeKosbiUser = (id) => {
    if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
      setKosbiUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  // KOSBI'den veri çekme
  const fetchKosbiData = async (user) => {
    setIsLoadingKosbi(true);
    setSelectedKosbiUser(user);
    
    try {
      console.log(`🔐 KOSBI login yapılıyor: ${user.name}`);
      
      // 1. Backend'e login yap
      const loginResponse = await fetch('http://localhost:3001/api/kosbi/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: user.username,
          password: user.password
        })
      });
      
      const loginData = await loginResponse.json();
      
      if (!loginData.success) {
        throw new Error(loginData.error || 'Login başarısız');
      }
      
      console.log(`✅ Login başarılı, session: ${loginData.sessionId}`);
      
      // 2. Sayaç verilerini çek
      const metersResponse = await fetch(
        `http://localhost:3001/api/kosbi/meters/${loginData.sessionId}`
      );
      
      const metersData = await metersResponse.json();
      
      if (!metersData.success) {
        throw new Error(metersData.error || 'Veri çekme başarısız');
      }
      
      console.log(`📊 ${metersData.count} sayaç verisi alındı`);
      
      setKosbiData(metersData.data);
      setIsLoadingKosbi(false);
      alert(`✅ ${user.name} için ${metersData.count} sayaç verisi yüklendi!`);
      
      // ÖNEMLİ NOT: Eğer backend sunucu çalışmıyorsa demo moda geç
    } catch (error) {
      console.error('❌ KOSBI veri çekme hatası:', error);
      
      setIsLoadingKosbi(false);
      alert(`❌ KOSBI Bağlantı Hatası:\n\n${error.message}\n\nBackend sunucusunun çalıştığından emin olun:\n1. cd server\n2. npm start\n\nSonra tekrar deneyin.`);
    }
  };

  // KOSBI verisini measurements'a aktar
  const importKosbiData = () => {
    if (kosbiData.length === 0) {
      alert('⚠️ Önce KOSBI\'den veri çekin!');
      return;
    }

    const newMeasurements = kosbiData.map((data, idx) => ({
      id: measurements.length + idx + 1,
      olcumNoktasi: data.ad || `Sayaç ${data.sayacNo}`,
      parametre: "Çekilen Enerji",
      deger: data.cekilen,
      birim: "kWh",
      limit: "-",
      sonuc: "Uygun"
    }));

    setMeasurements([...measurements, ...newMeasurements]);
    setShowKosbiModal(false);
    alert(`✅ ${newMeasurements.length} sayaç verisi ölçüm tablosuna eklendi!`);
  };

  // Excel/JSON Import
  const handleExcelImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setExcelFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        setExcelData(jsonData);
        setShowExcelImportModal(true);
      } catch (error) {
        alert('❌ JSON dosyası okunamadı:\n' + error.message);
      }
    };
    
    reader.readAsText(file);
  };

  const importExcelData = () => {
    if (excelData.length === 0) {
      alert('⚠️ Önce JSON dosyası yükleyin!');
      return;
    }

    // JSON verisini measurements formatına dönüştür
    const newMeasurements = excelData.map((row, idx) => {
      const tarih = row["Tarih"] || row["Tarih2"] || '';
      const tuketim = row["Tüketim ()"] || 0;
      const endeks = row["Okunan Endeks Değeri"] || 0;
      const carpan = row["Çarpan"] || 1;
      
      return {
        id: measurements.length + idx + 1,
        olcumNoktasi: `Sayaç Okuma ${tarih}`,
        parametre: "Tüketim",
        deger: tuketim.toString(),
        birim: "kWh",
        limit: "-",
        sonuc: tuketim > 500 ? "Yüksek" : tuketim > 300 ? "Dikkat" : "Normal",
        // Ek bilgiler (raporda kullanılabilir)
        ekBilgi: {
          tarih: tarih,
          endeks: endeks,
          carpan: carpan,
          okumaSuresi: row["Okuma Süresi (Saat)"] || 0
        }
      };
    });

    setMeasurements([...measurements, ...newMeasurements]);
    setShowExcelImportModal(false);
    setExcelData([]);
    setExcelFileName('');
    alert(`✅ ${newMeasurements.length} Excel kaydı ölçüm tablosuna eklendi!`);
  };

  // WorkTracker Login
  const loginToWorkTracker = async () => {
    if (!workTrackerConfig.email || !workTrackerConfig.password) {
      alert('⚠️ E-posta ve şifre giriniz!');
      return;
    }

    setIsLoadingWorkTracker(true);
    try {
      const response = await fetch(`${workTrackerConfig.url}/api/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: workTrackerConfig.email,
          password: workTrackerConfig.password
        })
      });

      if (!response.ok) {
        throw new Error('Login başarısız');
      }

      const data = await response.json();
      setWorkTrackerToken(data.token);
      
      // Kullanıcı listesini çek
      await fetchWorkTrackerUsers(data.token);
      
      alert('✅ WorkTracker\'a başarıyla bağlanıldı!');
    } catch (error) {
      console.error('WorkTracker login hatası:', error);
      alert('❌ WorkTracker bağlantı hatası. Sunucunun çalıştığından emin olun.');
    } finally {
      setIsLoadingWorkTracker(false);
    }
  };

  // WorkTracker kullanıcılarını çek
  const fetchWorkTrackerUsers = async (token) => {
    try {
      const response = await fetch(`${workTrackerConfig.url}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token || workTrackerToken}`
        }
      });

      if (response.ok) {
        const users = await response.json();
        setWorkTrackerUsers(users);
      }
    } catch (error) {
      console.error('Kullanıcı listesi çekme hatası:', error);
    }
  };

  // WorkTracker'a görev oluştur
  const createWorkTrackerTask = async () => {
    if (!workTrackerToken) {
      alert('⚠️ Önce WorkTracker\'a giriş yapın!');
      return;
    }

    if (!taskForm.title) {
      alert('⚠️ Görev başlığı giriniz!');
      return;
    }

    setIsLoadingWorkTracker(true);
    try {
      const taskData = {
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        status: 'PENDING',
        assignedToId: taskForm.assignedToId || undefined,
        dueDate: taskForm.dueDate || undefined
      };

      const response = await fetch(`${workTrackerConfig.url}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${workTrackerToken}`
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        throw new Error('Görev oluşturulamadı');
      }

      const newTask = await response.json();
      
      setShowWorkTrackerModal(false);
      setTaskForm({
        title: '',
        description: '',
        priority: 'MEDIUM',
        assignedToId: '',
        dueDate: ''
      });
      
      alert(`✅ Görev başarıyla oluşturuldu!\n\nGörev: ${newTask.title}\nDurum: ${newTask.status}\nÖncelik: ${newTask.priority}`);
    } catch (error) {
      console.error('Görev oluşturma hatası:', error);
      alert('❌ Görev oluşturma hatası: ' + error.message);
    } finally {
      setIsLoadingWorkTracker(false);
    }
  };

  // OSOS raporundan otomatik görev oluştur
  const createTaskFromReport = () => {
    if (!formData.firmaAdi || !formData.raporNo) {
      alert('⚠️ Önce rapor bilgilerini doldurun!');
      return;
    }

    // Uygun olmayan ölçümleri bul
    const problematicMeasurements = measurements.filter(m => m.sonuc !== 'Uygun');
    
    const taskTitle = `OSOS Raporu - ${formData.firmaAdi} (${formData.raporNo})`;
    let taskDescription = `📋 OSOS RAPOR DETAYLARI\n\n`;
    taskDescription += `🏢 Firma: ${formData.firmaAdi}\n`;
    taskDescription += `📄 Rapor No: ${formData.raporNo}\n`;
    taskDescription += `📅 Rapor Tarihi: ${formData.raporTarihi}\n`;
    taskDescription += `📍 Adres: ${formData.adres || '-'}\n\n`;
    
    if (problematicMeasurements.length > 0) {
      taskDescription += `⚠️ SORUNLU ÖLÇÜMLER (${problematicMeasurements.length} adet):\n`;
      problematicMeasurements.forEach((m, idx) => {
        taskDescription += `${idx + 1}. ${m.olcumNoktasi} - ${m.parametre}: ${m.deger} ${m.birim} (Limit: ${m.limit})\n`;
      });
      taskDescription += `\n`;
    }
    
    if (formData.tespit) {
      taskDescription += `🔍 TESPİTLER:\n${formData.tespit}\n\n`;
    }
    
    if (formData.oneri) {
      taskDescription += `💡 ÖNERİLER:\n${formData.oneri}\n\n`;
    }
    
    taskDescription += `📞 İletişim: ${formData.yetkili || '-'}\n`;
    taskDescription += `📱 Telefon: ${formData.telefon || '-'}\n`;
    taskDescription += `✅ Sonraki Kontrol: ${formData.sonrakiKontrolTarihi || '-'}`;

    setTaskForm({
      title: taskTitle,
      description: taskDescription,
      priority: problematicMeasurements.length > 0 ? 'HIGH' : 'MEDIUM',
      assignedToId: '',
      dueDate: formData.sonrakiKontrolTarihi || ''
    });

    setShowWorkTrackerModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className={`bg-white shadow-md rounded-lg p-4 mb-4 flex justify-between items-center no-print ${printMode ? 'hidden' : ''}`}>
        <div>
          <h1 className="text-xl font-bold text-gray-800">OSOS Rapor Sistemi</h1>
          <p className="text-xs text-gray-500">Organize Sanayi Ölçüm Sistemi</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowKosbiModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <Zap size={18} /> KOSBI Veri Çek
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer">
            <Upload size={18} /> Excel Import
            <input 
              type="file" 
              accept=".json"
              onChange={handleExcelImport}
              className="hidden"
            />
          </label>
          <button 
            onClick={createTaskFromReport}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            title="Bu rapordan WorkTracker'da görev oluştur"
          >
            <CheckCircle size={18} /> Görev Oluştur
          </button>
          <button 
            onClick={() => setEditMode(!editMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${editMode ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white`}
          >
            <Edit3 size={18} />
            {editMode ? 'Düzenleme Modu' : 'Önizleme Modu'}
          </button>
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
            <Download size={18} /> PDF İndir
          </button>
          <button onClick={printReport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <Printer size={18} /> Yazdır
          </button>
          <button onClick={resetForm} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
            <RotateCcw size={18} /> Sıfırla
          </button>
        </div>
      </div>

      {/* WorkTracker Modal */}
      {showWorkTrackerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">WorkTracker Görev Oluştur</h2>
                <p className="text-sm text-indigo-100">OSOS Raporundan Görev Takip Sistemi</p>
              </div>
              <button onClick={() => setShowWorkTrackerModal(false)} className="text-white hover:bg-indigo-700 p-2 rounded">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Bağlantı Ayarları */}
              {!workTrackerToken && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">WorkTracker Bağlantısı</h3>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">WorkTracker URL</label>
                    <input
                      type="text"
                      value={workTrackerConfig.url}
                      onChange={(e) => setWorkTrackerConfig({...workTrackerConfig, url: e.target.value})}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="http://localhost:3000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">E-posta</label>
                    <input
                      type="email"
                      value={workTrackerConfig.email}
                      onChange={(e) => setWorkTrackerConfig({...workTrackerConfig, email: e.target.value})}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Şifre</label>
                    <input
                      type="password"
                      value={workTrackerConfig.password}
                      onChange={(e) => setWorkTrackerConfig({...workTrackerConfig, password: e.target.value})}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="********"
                    />
                  </div>
                  <button
                    onClick={loginToWorkTracker}
                    disabled={isLoadingWorkTracker}
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {isLoadingWorkTracker ? 'Bağlanıyor...' : '🔐 Bağlan'}
                  </button>
                </div>
              )}

              {/* Görev Formu */}
              {workTrackerToken && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-700">
                    ✅ WorkTracker'a bağlandı!
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Görev Başlığı *</label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="Görev başlığı"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Açıklama</label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                      className="w-full p-2 border rounded text-sm"
                      rows="8"
                      placeholder="Görev detayları..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Öncelik</label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="LOW">Düşük</option>
                        <option value="MEDIUM">Orta</option>
                        <option value="HIGH">Yüksek</option>
                        <option value="URGENT">Acil</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Bitiş Tarihi</label>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                        className="w-full p-2 border rounded text-sm"
                      />
                    </div>
                  </div>

                  {workTrackerUsers.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Atanan Kişi</label>
                      <select
                        value={taskForm.assignedToId}
                        onChange={(e) => setTaskForm({...taskForm, assignedToId: e.target.value})}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="">Atama yapılmadı</option>
                        {workTrackerUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setWorkTrackerToken(null)}
                      className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Bağlantıyı Kes
                    </button>
                    <button
                      onClick={createWorkTrackerTask}
                      disabled={isLoadingWorkTracker}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                      {isLoadingWorkTracker ? 'Oluşturuluyor...' : '✅ Görevi Oluştur'}
                    </button>
                  </div>
                </div>
              )}

              {/* Bilgilendirme */}
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                <p className="font-semibold text-blue-800 mb-1">ℹ️ Kullanım</p>
                <p className="text-blue-700 text-xs">
                  Bu özellik, OSOS raporundan otomatik olarak WorkTracker görev takip sisteminde görev oluşturur. 
                  WorkTracker sunucusunun çalışıyor olması gerekmektedir.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KOSBI Modal */}
      {showKosbiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-purple-600 text-white px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">KOSBI Elektrik Sayaç Verileri</h2>
                <p className="text-sm text-purple-100">elektrik.kosbi.org.tr</p>
              </div>
              <button onClick={() => setShowKosbiModal(false)} className="text-white hover:bg-purple-700 p-2 rounded">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Kullanıcı Listesi */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-800">Kayıtlı Kullanıcılar</h3>
                  <button 
                    onClick={addKosbiUser}
                    className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    + Yeni Kullanıcı
                  </button>
                </div>
                
                <div className="space-y-2">
                  {kosbiUsers.map(user => (
                    <div key={user.id} className="border rounded p-3 flex justify-between items-center bg-gray-50">
                      <div>
                        <p className="font-semibold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">Kullanıcı: {user.username} | Şifre: {'*'.repeat(user.password.length)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchKosbiData(user)}
                          disabled={isLoadingKosbi}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {isLoadingKosbi && selectedKosbiUser?.id === user.id ? 'Yükleniyor...' : 'Veri Çek'}
                        </button>
                        <button
                          onClick={() => removeKosbiUser(user.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Çekilen Veriler */}
              {kosbiData.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Çekilen Sayaç Verileri ({kosbiData.length} adet)</h3>
                  <div className="border rounded overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">Sayaç No</th>
                          <th className="p-2 text-left">Ad</th>
                          <th className="p-2 text-right">Çekilen (kWh)</th>
                          <th className="p-2 text-right">Verilen (kWh)</th>
                          <th className="p-2 text-center">Tarih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kosbiData.map((data, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{data.sayacNo}</td>
                            <td className="p-2">{data.ad}</td>
                            <td className="p-2 text-right font-semibold">{data.cekilen}</td>
                            <td className="p-2 text-right">{data.verilen}</td>
                            <td className="p-2 text-center text-xs">{data.tarih}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => setKosbiData([])}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Temizle
                    </button>
                    <button
                      onClick={importKosbiData}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Ölçüm Tablosuna Aktar
                    </button>
                  </div>
                </div>
              )}

              {/* Bilgilendirme */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                <p className="font-semibold text-yellow-800 mb-1">⚠️ CORS Uyarısı</p>
                <p className="text-yellow-700 text-xs">
                  Tarayıcı güvenlik politikaları nedeniyle direkt veri çekmek mümkün olmayabilir. 
                  Gerçek entegrasyon için backend proxy servisi veya browser extension kullanın.
                  Şu an demo veriler gösterilmektedir.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showExcelImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Upload size={28} />
                    Excel Import - {excelFileName}
                  </h2>
                  <p className="text-sm text-green-100">JSON formatında Excel verisi</p>
                </div>
                <button 
                  onClick={() => {
                    setShowExcelImportModal(false);
                    setExcelData([]);
                    setExcelFileName('');
                  }}
                  className="text-white hover:bg-green-700 p-2 rounded-full transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✅ <strong>{excelData.length}</strong> satır veri yüklendi
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Veriler OSOS ölçüm tablosuna eklenecek
                </p>
              </div>

              {/* Veri Önizleme */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Tarih</th>
                      <th className="border p-2 text-left">Okuma Süresi</th>
                      <th className="border p-2 text-left">Endeks</th>
                      <th className="border p-2 text-left">Çarpan</th>
                      <th className="border p-2 text-left">Tüketim (kWh)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelData.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="border p-2">{row["Tarih"] || row["Tarih2"]}</td>
                        <td className="border p-2">{row["Okuma Süresi (Saat)"]} saat</td>
                        <td className="border p-2">{row["Okunan Endeks Değeri"]}</td>
                        <td className="border p-2">{row["Çarpan"]}</td>
                        <td className="border p-2 font-semibold">{row["Tüketim ()"]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {excelData.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    ... ve {excelData.length - 10} satır daha
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowExcelImportModal(false);
                  setExcelData([]);
                  setExcelFileName('');
                }}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition text-gray-700"
              >
                İptal
              </button>
              <button
                onClick={importExcelData}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition flex items-center gap-2"
              >
                <CheckCircle size={18} />
                {excelData.length} Kaydı İçe Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Section */}
      {editMode && !printMode && (
        <div className="space-y-4 mb-4">
          <div className="p-6 bg-white shadow-md rounded-lg max-w-7xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
              <FileText size={18} /> Genel Bilgiler
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Firma Adı *</label>
                <input
                  type="text"
                  value={formData.firmaAdi}
                  onChange={(e) => handleInputChange('firmaAdi', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Firma adını girin"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Rapor No *</label>
                <input
                  type="text"
                  value={formData.raporNo}
                  onChange={(e) => handleInputChange('raporNo', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Rapor numarası"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Rapor Tarihi</label>
                <input
                  type="date"
                  value={formData.raporTarihi}
                  onChange={(e) => handleInputChange('raporTarihi', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Adres</label>
                <input
                  type="text"
                  value={formData.adres}
                  onChange={(e) => handleInputChange('adres', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Tesis adresi"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Yetkili Kişi</label>
                <input
                  type="text"
                  value={formData.yetkili}
                  onChange={(e) => handleInputChange('yetkili', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Yetkili adı"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Telefon</label>
                <input
                  type="text"
                  value={formData.telefon}
                  onChange={(e) => handleInputChange('telefon', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="İletişim telefonu"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="E-posta adresi"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Vergi No</label>
                <input
                  type="text"
                  value={formData.vergiNo}
                  onChange={(e) => handleInputChange('vergiNo', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Vergi numarası"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tesis Gücü (kW)</label>
                <input
                  type="number"
                  value={formData.tesisGucuKW}
                  onChange={(e) => handleInputChange('tesisGucuKW', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="kW"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Çalışan Sayısı</label>
                <input
                  type="number"
                  value={formData.calisanSayisi}
                  onChange={(e) => handleInputChange('calisanSayisi', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Kişi"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white shadow-md rounded-lg max-w-7xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
              <Zap size={18} /> Kontrol Bilgileri
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kontrol Eden</label>
                <input
                  type="text"
                  value={formData.kontrolEdenAd}
                  onChange={(e) => handleInputChange('kontrolEdenAd', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Ad Soyad"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Unvan</label>
                <input
                  type="text"
                  value={formData.kontrolEdenUnvan}
                  onChange={(e) => handleInputChange('kontrolEdenUnvan', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Unvan"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Oda Sicil No</label>
                <input
                  type="text"
                  value={formData.kontrolEdenOdaNo}
                  onChange={(e) => handleInputChange('kontrolEdenOdaNo', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  placeholder="Sicil no"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kontrol Tarihi</label>
                <input
                  type="date"
                  value={formData.kontrolTarihi}
                  onChange={(e) => handleInputChange('kontrolTarihi', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Sonraki Kontrol Tarihi</label>
                <input
                  type="date"
                  value={formData.sonrakiKontrolTarihi}
                  onChange={(e) => handleInputChange('sonrakiKontrolTarihi', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Genel Sonuç</label>
                <select
                  value={formData.sonuc}
                  onChange={(e) => handleInputChange('sonuc', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="Uygun">✅ Uygun</option>
                  <option value="Uygun Değil">❌ Uygun Değil</option>
                  <option value="Şartlı Uygun">⚠️ Şartlı Uygun</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white shadow-md rounded-lg max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                <Zap size={18} /> Ölçüm Verileri
              </h2>
              <button
                onClick={addMeasurement}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <FileText size={14} /> Yeni Ölçüm
              </button>
            </div>
            <div className="space-y-3">
              {measurements.map((m, idx) => (
                <div key={m.id} className="p-3 bg-gray-50 rounded border grid grid-cols-7 gap-2 items-center">
                  <input
                    type="text"
                    value={m.olcumNoktasi}
                    onChange={(e) => handleMeasurementChange(m.id, 'olcumNoktasi', e.target.value)}
                    className="p-2 border rounded text-sm"
                    placeholder="Ölçüm noktası"
                  />
                  <input
                    type="text"
                    value={m.parametre}
                    onChange={(e) => handleMeasurementChange(m.id, 'parametre', e.target.value)}
                    className="p-2 border rounded text-sm"
                    placeholder="Parametre"
                  />
                  <input
                    type="text"
                    value={m.deger}
                    onChange={(e) => handleMeasurementChange(m.id, 'deger', e.target.value)}
                    className="p-2 border rounded text-sm"
                    placeholder="Değer"
                  />
                  <input
                    type="text"
                    value={m.birim}
                    onChange={(e) => handleMeasurementChange(m.id, 'birim', e.target.value)}
                    className="p-2 border rounded text-sm w-20"
                    placeholder="Birim"
                  />
                  <input
                    type="text"
                    value={m.limit}
                    onChange={(e) => handleMeasurementChange(m.id, 'limit', e.target.value)}
                    className="p-2 border rounded text-sm"
                    placeholder="Limit"
                  />
                  <select
                    value={m.sonuc}
                    onChange={(e) => handleMeasurementChange(m.id, 'sonuc', e.target.value)}
                    className="p-2 border rounded text-sm"
                  >
                    <option value="Uygun">✅ Uygun</option>
                    <option value="Uygun Değil">❌ Uygun Değil</option>
                  </select>
                  <button
                    onClick={() => removeMeasurement(m.id)}
                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                    disabled={measurements.length === 1}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white shadow-md rounded-lg max-w-7xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Tespit ve Öneriler</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tespit Edilen Durumlar</label>
                <textarea
                  value={formData.tespit}
                  onChange={(e) => handleInputChange('tespit', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  rows="4"
                  placeholder="Tespit edilen eksiklikler ve durumlar..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Öneriler</label>
                <textarea
                  value={formData.oneri}
                  onChange={(e) => handleInputChange('oneri', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  rows="4"
                  placeholder="Yapılması önerilen işlemler..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ek Açıklamalar</label>
                <textarea
                  value={formData.aciklama}
                  onChange={(e) => handleInputChange('aciklama', e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  rows="3"
                  placeholder="Ek bilgiler ve notlar..."
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white shadow-md rounded-lg max-w-7xl mx-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
              <Upload size={18} /> Logo Yükleme
            </h2>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="flex-1 p-2 border rounded text-sm"
              />
              {logo && (
                <div className="flex items-center gap-2">
                  <img src={logo} alt="Logo" className="w-16 h-16 object-contain border rounded" />
                  <button
                    onClick={removeLogo}
                    className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Print View */}
      <div ref={reportRef} className={`bg-white shadow-md rounded-lg p-8 max-w-7xl mx-auto ${!editMode || printMode ? '' : 'hidden'}`}>
        {/* Logo ve Başlık */}
        <div className="flex justify-between items-start mb-6 border-b-2 border-gray-300 pb-4">
          {logo && (
            <div className="w-32 h-32 border rounded overflow-hidden">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold text-gray-800">OSOS RAPORU</h1>
            <p className="text-base text-gray-600 mt-1">Organize Sanayi Ölçüm Sistemi</p>
            <p className="text-sm text-gray-500 mt-2">Rapor No: {formData.raporNo || '-'}</p>
          </div>
        </div>

        {/* Firma Bilgileri */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Firma Bilgileri</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><strong>Firma Adı:</strong> {formData.firmaAdi || '-'}</div>
            <div><strong>Rapor Tarihi:</strong> {formData.raporTarihi || '-'}</div>
            <div className="col-span-2"><strong>Adres:</strong> {formData.adres || '-'}</div>
            <div><strong>Yetkili Kişi:</strong> {formData.yetkili || '-'}</div>
            <div><strong>Telefon:</strong> {formData.telefon || '-'}</div>
            <div><strong>E-posta:</strong> {formData.email || '-'}</div>
            <div><strong>Vergi No:</strong> {formData.vergiNo || '-'}</div>
            <div><strong>Tesis Gücü:</strong> {formData.tesisGucuKW ? `${formData.tesisGucuKW} kW` : '-'}</div>
            <div><strong>Çalışan Sayısı:</strong> {formData.calisanSayisi || '-'}</div>
          </div>
        </div>

        {/* Kontrol Bilgileri */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Kontrol Bilgileri</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><strong>Kontrol Eden:</strong> {formData.kontrolEdenAd || '-'}</div>
            <div><strong>Unvan:</strong> {formData.kontrolEdenUnvan || '-'}</div>
            <div><strong>Oda Sicil No:</strong> {formData.kontrolEdenOdaNo || '-'}</div>
            <div><strong>Kontrol Tarihi:</strong> {formData.kontrolTarihi || '-'}</div>
            <div><strong>Sonraki Kontrol:</strong> {formData.sonrakiKontrolTarihi || '-'}</div>
            <div>
              <strong>Genel Sonuç:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                formData.sonuc === 'Uygun' ? 'bg-green-100 text-green-700' : 
                formData.sonuc === 'Uygun Değil' ? 'bg-red-100 text-red-700' : 
                'bg-yellow-100 text-yellow-700'
              }`}>
                {formData.sonuc}
              </span>
            </div>
          </div>
        </div>

        {/* Ölçüm Verileri Tablosu */}
        {measurements.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Ölçüm Verileri</h2>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">#</th>
                  <th className="border border-gray-300 p-2 text-left">Ölçüm Noktası</th>
                  <th className="border border-gray-300 p-2 text-left">Parametre</th>
                  <th className="border border-gray-300 p-2 text-center">Değer</th>
                  <th className="border border-gray-300 p-2 text-center">Birim</th>
                  <th className="border border-gray-300 p-2 text-center">Limit</th>
                  <th className="border border-gray-300 p-2 text-center">Sonuç</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((m, idx) => (
                  <tr key={m.id}>
                    <td className="border border-gray-300 p-2">{idx + 1}</td>
                    <td className="border border-gray-300 p-2">{m.olcumNoktasi || '-'}</td>
                    <td className="border border-gray-300 p-2">{m.parametre || '-'}</td>
                    <td className="border border-gray-300 p-2 text-center font-semibold">{m.deger || '-'}</td>
                    <td className="border border-gray-300 p-2 text-center">{m.birim || '-'}</td>
                    <td className="border border-gray-300 p-2 text-center">{m.limit || '-'}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        m.sonuc === 'Uygun' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {m.sonuc}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tespit ve Öneriler */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Tespit Edilen Durumlar</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {formData.tespit || 'Tespit edilen durum bulunmamaktadır.'}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Öneriler</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {formData.oneri || 'Özel öneri bulunmamaktadır.'}
          </p>
        </div>

        {formData.aciklama && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Ek Açıklamalar</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {formData.aciklama}
            </p>
          </div>
        )}

        {/* İmza Alanı */}
        <div className="mt-12 flex justify-between border-t pt-6">
          <div className="text-center">
            <div className="border-t-2 border-gray-400 w-48 pt-2 mx-auto">
              <p className="text-sm font-semibold">{formData.kontrolEdenAd || 'Kontrol Eden'}</p>
              <p className="text-xs text-gray-600">{formData.kontrolEdenUnvan}</p>
              <p className="text-xs text-gray-500">Sicil No: {formData.kontrolEdenOdaNo || '-'}</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-gray-400 w-48 pt-2 mx-auto">
              <p className="text-sm font-semibold">{formData.yetkili || 'Firma Yetkilisi'}</p>
              <p className="text-xs text-gray-600">{formData.firmaAdi || 'Firma Adı'}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-500 border-t pt-4">
          <p>Bu rapor {formData.raporTarihi} tarihinde {formData.kontrolEdenAd || 'yetkili kişi'} tarafından hazırlanmıştır.</p>
          <p className="mt-1">Organize Sanayi Ölçüm Sistemi (OSOS) - Elektronik Rapor Sistemi</p>
        </div>
      </div>
    </div>
  );
}
