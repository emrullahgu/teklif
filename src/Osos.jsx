import React, { useState, useEffect, useRef } from 'react';
import { Printer, FileText, Save, RotateCcw, Edit3, Download, Zap, AlertTriangle, CheckCircle, Upload, X, Activity } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import OsosCanliIzleme from './OsosCanliIzleme.jsx';

export default function Osos() {
  const [ososTab, setOsosTab] = useState('rapor'); // 'rapor' veya 'canli'
  const [printMode, setPrintMode] = useState(false);
  const [editMode, setEditMode] = useState(true);
  const [logo, setLogo] = useState("https://www.kobinerji.com/wp-content/uploads/2022/03/logo.png");
  const [logoInputUrl, setLogoInputUrl] = useState("https://www.kobinerji.com/wp-content/uploads/2022/03/logo.png");
  const reportRef = useRef(null);
  
  // Rapor Kaydetme
  const [kaydedilenRaporlar, setKaydedilenRaporlar] = useState([]);
  const [showKayitliRaporlar, setShowKayitliRaporlar] = useState(false);
  
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
  
  // Fabrika Veri Yönetimi
  const [fabrikaVerileri, setFabrikaVerileri] = useState([]);
  const [secilenFabrika, setSecilenFabrika] = useState(null);
  const [showFabrikaModal, setShowFabrikaModal] = useState(false);
  
  // Enerji Tipi Seçimi
  const [showEnerjiTipiModal, setShowEnerjiTipiModal] = useState(false);
  const [bekleyenVeri, setBekleyenVeri] = useState(null);
  const [secilenEnerjiTipi, setSecilenEnerjiTipi] = useState('auto');
  
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

  // OSOS Otomatik Veri Analizi
  const [measurements, setMeasurements] = useState([
    { id: 1, parametre: "Aktif Güç", deger: "", birim: "kW", referans: "Anlık tüketim", durum: "Normal" },
    { id: 2, parametre: "Reaktif Güç", deger: "", birim: "kVAr", referans: "İndüktif yük", durum: "Normal" },
    { id: 3, parametre: "Görünür Güç", deger: "", birim: "kVA", referans: "Toplam güç", durum: "Normal" },
    { id: 4, parametre: "Gerilim (L1-N)", deger: "", birim: "V", referans: "220±10V", durum: "Normal" },
    { id: 5, parametre: "Gerilim (L2-N)", deger: "", birim: "V", referans: "220±10V", durum: "Normal" },
    { id: 6, parametre: "Gerilim (L3-N)", deger: "", birim: "V", referans: "220±10V", durum: "Normal" },
    { id: 7, parametre: "Akım (L1)", deger: "", birim: "A", referans: "Maks akım", durum: "Normal" },
    { id: 8, parametre: "Akım (L2)", deger: "", birim: "A", referans: "Maks akım", durum: "Normal" },
    { id: 9, parametre: "Akım (L3)", deger: "", birim: "A", referans: "Maks akım", durum: "Normal" },
    { id: 10, parametre: "Güç Faktörü (cos φ)", deger: "", birim: "--", referans: ">0.85", durum: "Normal" },
    { id: 11, parametre: "Frekans", deger: "", birim: "Hz", referans: "50±0.5Hz", durum: "Normal" },
    { id: 12, parametre: "Toplam Enerji (T0)", deger: "", birim: "kWh", referans: "Kümülatif", durum: "Normal" }
  ]);
  
  // Enerji Tipi Verileri
  const [aktifEnerji, setAktifEnerji] = useState([]);
  const [induktifEnerji, setInduktifEnerji] = useState([]);
  const [kapasitifEnerji, setKapasitifEnerji] = useState([]);
  
  // Görsel mod
  const [showCharts, setShowCharts] = useState(false);

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
      parametre: "",
      deger: "",
      birim: "",
      referans: "",
      durum: "Normal"
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
      reader.onload = (event) => {
        setLogo(event.target.result);
        setLogoInputUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUrlChange = () => {
    if (logoInputUrl && logoInputUrl.trim() !== '') {
      setLogo(logoInputUrl);
      alert('✅ Logo güncellendi!');
    } else {
      alert('⚠️ Geçerli bir URL giriniz!');
    }
  };

  const removeLogo = () => {
    setLogo("https://www.kobinerji.com/wp-content/uploads/2022/03/logo.png");
    setLogoInputUrl("https://www.kobinerji.com/wp-content/uploads/2022/03/logo.png");
  };

  // Rapor Kaydetme ve Yükleme
  const raporuKaydet = () => {
    if (!formData.firmaAdi || fabrikaVerileri.length === 0) {
      alert('⚠️ Rapor kaydedilemiyor! Firma adı ve en az 1 fabrika verisi gereklidir.');
      return;
    }

    const yeniRapor = {
      id: Date.now(),
      tarih: new Date().toISOString(),
      firmaAdi: formData.firmaAdi,
      formData: { ...formData },
      fabrikaVerileri: [...fabrikaVerileri],
      measurements: [...measurements],
      logo: logo
    };

    const mevcutRaporlar = JSON.parse(localStorage.getItem('osos_raporlar') || '[]');
    mevcutRaporlar.push(yeniRapor);
    localStorage.setItem('osos_raporlar', JSON.stringify(mevcutRaporlar));
    
    setKaydedilenRaporlar(mevcutRaporlar);
    alert('✅ Rapor başarıyla kaydedildi!');
  };

  const raporlariYukle = () => {
    const mevcutRaporlar = JSON.parse(localStorage.getItem('osos_raporlar') || '[]');
    setKaydedilenRaporlar(mevcutRaporlar);
    setShowKayitliRaporlar(true);
  };

  const kayitliRaporuAc = (rapor) => {
    setFormData(rapor.formData);
    setFabrikaVerileri(rapor.fabrikaVerileri);
    setMeasurements(rapor.measurements);
    setLogo(rapor.logo);
    setLogoInputUrl(rapor.logo);
    
    if (rapor.fabrikaVerileri.length > 0) {
      const ilkFabrika = rapor.fabrikaVerileri[0];
      setSecilenFabrika(ilkFabrika);
      setAktifEnerji(ilkFabrika.aktifEnerji);
      setInduktifEnerji(ilkFabrika.induktifEnerji);
      setKapasitifEnerji(ilkFabrika.kapasitifEnerji);
    }
    
    setShowKayitliRaporlar(false);
    alert('✅ Rapor yüklendi!');
  };

  const kayitliRaporuSil = (raporId) => {
    if (confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
      const mevcutRaporlar = JSON.parse(localStorage.getItem('osos_raporlar') || '[]');
      const yeniRaporlar = mevcutRaporlar.filter(r => r.id !== raporId);
      localStorage.setItem('osos_raporlar', JSON.stringify(yeniRaporlar));
      setKaydedilenRaporlar(yeniRaporlar);
      alert('✅ Rapor silindi!');
    }
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
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Logo ekle (varsa)
      if (logo) {
        try {
          pdf.addImage(logo, 'PNG', 15, yPosition, 30, 30);
          yPosition += 35;
        } catch (error) {
          console.error('Logo eklenemedi:', error);
          yPosition += 5;
        }
      }

      // Başlık
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('OSOS RAPORU', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text('Organize Sanayi Ölçüm Sistemi (OSOS) - Elektronik Rapor Sistemi', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Firma Bilgileri
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('FİRMA BİLGİLERİ', 15, yPosition);
      yPosition += 7;

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      const firmaBilgileri = [
        ['Firma Adı:', formData.firmaAdi],
        ['Rapor No:', formData.raporNo],
        ['Rapor Tarihi:', formData.raporTarihi],
        ['Adres:', formData.adres],
        ['Yetkili:', formData.yetkili],
        ['Telefon:', formData.telefon],
        ['E-posta:', formData.email],
        ['Vergi No:', formData.vergiNo]
      ];

      firmaBilgileri.forEach(([label, value]) => {
        if (value) {
          pdf.setFont(undefined, 'bold');
          pdf.text(label, 15, yPosition);
          pdf.setFont(undefined, 'normal');
          pdf.text(value, 50, yPosition);
          yPosition += 5;
        }
      });

      yPosition += 10;

      // Kontrol Bilgileri
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      pdf.text('KONTROL BİLGİLERİ', 15, yPosition);
      yPosition += 7;

      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      const kontrolBilgileri = [
        ['Kontrolü Yapan:', formData.kontrolEdenAd],
        ['Unvan:', formData.kontrolEdenUnvan],
        ['Oda Sicil No:', formData.kontrolEdenOdaNo],
        ['Kontrol Tarihi:', formData.kontrolTarihi],
        ['Sonraki Kontrol:', formData.sonrakiKontrolTarihi],
        ['Tesis Gücü:', formData.tesisGucuKW ? formData.tesisGucuKW + ' kW' : ''],
        ['Çalışan Sayısı:', formData.calisanSayisi]
      ];

      kontrolBilgileri.forEach(([label, value]) => {
        if (value) {
          pdf.setFont(undefined, 'bold');
          pdf.text(label, 15, yPosition);
          pdf.setFont(undefined, 'normal');
          pdf.text(value, 50, yPosition);
          yPosition += 5;
        }
      });

      yPosition += 10;

      // Ölçüm Sonuçları Tablosu
      if (measurements.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('ÖLÇÜM SONUÇLARI', 15, yPosition);
        yPosition += 5;

        const tableData = measurements.map(m => [
          m.olcumNoktasi,
          m.parametre,
          m.deger,
          m.birim,
          m.limit,
          m.sonuc
        ]);

        pdf.autoTable({
          startY: yPosition,
          head: [['Ölçüm Noktası', 'Parametre', 'Değer', 'Birim', 'Limit', 'Sonuç']],
          body: tableData,
          theme: 'grid',
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 3
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          },
          columnStyles: {
            0: { cellWidth: 35 },
            1: { cellWidth: 40 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 25, fontStyle: 'bold' }
          },
          didParseCell: function(data) {
            if (data.section === 'body' && data.column.index === 5) {
              const sonuc = data.cell.raw;
              if (sonuc === 'Uygun' || sonuc === 'Normal') {
                data.cell.styles.textColor = [0, 128, 0];
              } else if (sonuc === 'Uygun Değil' || sonuc === 'Yüksek') {
                data.cell.styles.textColor = [220, 53, 69];
              } else if (sonuc === 'Dikkat') {
                data.cell.styles.textColor = [255, 165, 0];
              }
            }
          },
          margin: { left: 15, right: 15 }
        });

        yPosition = pdf.lastAutoTable.finalY + 10;
      }

      // YÖNETİCİ ÖZETİ - Enerji Verileri
      if (aktifEnerji.length > 0 || induktifEnerji.length > 0 || kapasitifEnerji.length > 0) {
        // Yeni sayfa
        pdf.addPage();
        yPosition = 20;

        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(41, 128, 185);
        pdf.text('📊 YÖNETİCİ ÖZETİ', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 10;

        // Özet kartlar
        const totalAktif = aktifEnerji.reduce((sum, item) => sum + parseFloat(item.tuketim), 0).toFixed(2);
        const totalInduktif = induktifEnerji.reduce((sum, item) => sum + parseFloat(item.tuketim), 0).toFixed(2);
        const totalKapasitif = kapasitifEnerji.reduce((sum, item) => sum + parseFloat(item.tuketim), 0).toFixed(2);
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'normal');
        
        // Özet Kutuları
        const boxY = yPosition;
        const boxWidth = 55;
        const boxHeight = 25;
        
        // Aktif Enerji Kutusu
        pdf.setFillColor(76, 175, 80);
        pdf.rect(15, boxY, boxWidth, boxHeight, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('Aktif Enerji', 15 + boxWidth / 2, boxY + 8, { align: 'center' });
        pdf.setFontSize(16);
        pdf.text(totalAktif + ' kWh', 15 + boxWidth / 2, boxY + 18, { align: 'center' });
        
        // İndüktif Enerji Kutusu
        pdf.setFillColor(255, 152, 0);
        pdf.rect(75, boxY, boxWidth, boxHeight, 'F');
        pdf.setFontSize(12);
        pdf.text('İndüktif Reaktif', 75 + boxWidth / 2, boxY + 8, { align: 'center' });
        pdf.setFontSize(16);
        pdf.text(totalInduktif + ' kVArh', 75 + boxWidth / 2, boxY + 18, { align: 'center' });
        
        // Kapasitif Enerji Kutusu
        pdf.setFillColor(33, 150, 243);
        pdf.rect(135, boxY, boxWidth, boxHeight, 'F');
        pdf.setFontSize(12);
        pdf.text('Kapasitif Reaktif', 135 + boxWidth / 2, boxY + 8, { align: 'center' });
        pdf.setFontSize(16);
        pdf.text(totalKapasitif + ' kVArh', 135 + boxWidth / 2, boxY + 18, { align: 'center' });
        
        yPosition += boxHeight + 15;
        pdf.setTextColor(0, 0, 0);

        // AKTİF ENERJİ TABLOSU
        if (aktifEnerji.length > 0) {
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text('⚡ AKTİF ENERJİ (kWh)', 15, yPosition);
          yPosition += 5;

          const aktifTableData = aktifEnerji.slice(0, 20).map(item => [
            item.tarih,
            item.tuketim,
            item.endeks.toFixed(2),
            item.carpan,
            item.sonuc
          ]);

          pdf.autoTable({
            startY: yPosition,
            head: [['Tarih', 'Tüketim (kWh)', 'Endeks', 'Çarpan', 'Durum']],
            body: aktifTableData,
            theme: 'grid',
            headStyles: { fillColor: [76, 175, 80], fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 35 },
              1: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
              2: { cellWidth: 35, halign: 'right' },
              3: { cellWidth: 25, halign: 'center' },
              4: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
            },
            didParseCell: function(data) {
              if (data.section === 'body' && data.column.index === 4) {
                const sonuc = data.cell.raw;
                if (sonuc === 'Normal') data.cell.styles.textColor = [0, 128, 0];
                else if (sonuc === 'Yüksek') data.cell.styles.textColor = [220, 53, 69];
                else if (sonuc === 'Dikkat') data.cell.styles.textColor = [255, 165, 0];
              }
            }
          });

          yPosition = pdf.lastAutoTable.finalY + 10;
        }

        // İNDÜKTİF ENERJİ TABLOSU
        if (induktifEnerji.length > 0) {
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text('🔶 İNDÜKTİF REAKTİF ENERJİ (kVArh)', 15, yPosition);
          yPosition += 5;

          const induktifTableData = induktifEnerji.slice(0, 20).map(item => [
            item.tarih,
            item.tuketim,
            item.endeks.toFixed(2),
            item.carpan,
            item.sonuc
          ]);

          pdf.autoTable({
            startY: yPosition,
            head: [['Tarih', 'Tüketim (kVArh)', 'Endeks', 'Çarpan', 'Durum']],
            body: induktifTableData,
            theme: 'grid',
            headStyles: { fillColor: [255, 152, 0], fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 35 },
              1: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
              2: { cellWidth: 35, halign: 'right' },
              3: { cellWidth: 25, halign: 'center' },
              4: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
            },
            didParseCell: function(data) {
              if (data.section === 'body' && data.column.index === 4) {
                const sonuc = data.cell.raw;
                if (sonuc === 'Normal') data.cell.styles.textColor = [0, 128, 0];
                else if (sonuc === 'Yüksek') data.cell.styles.textColor = [220, 53, 69];
                else if (sonuc === 'Dikkat') data.cell.styles.textColor = [255, 165, 0];
              }
            }
          });

          yPosition = pdf.lastAutoTable.finalY + 10;
        }

        // KAPASİTİF ENERJİ TABLOSU
        if (kapasitifEnerji.length > 0) {
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.text('🔷 KAPASİTİF REAKTİF ENERJİ (kVArh)', 15, yPosition);
          yPosition += 5;

          const kapasitifTableData = kapasitifEnerji.slice(0, 20).map(item => [
            item.tarih,
            item.tuketim,
            item.endeks.toFixed(2),
            item.carpan,
            item.sonuc
          ]);

          pdf.autoTable({
            startY: yPosition,
            head: [['Tarih', 'Tüketim (kVArh)', 'Endeks', 'Çarpan', 'Durum']],
            body: kapasitifTableData,
            theme: 'grid',
            headStyles: { fillColor: [33, 150, 243], fontSize: 9 },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
              0: { cellWidth: 35 },
              1: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
              2: { cellWidth: 35, halign: 'right' },
              3: { cellWidth: 25, halign: 'center' },
              4: { cellWidth: 30, halign: 'center', fontStyle: 'bold' }
            },
            didParseCell: function(data) {
              if (data.section === 'body' && data.column.index === 4) {
                const sonuc = data.cell.raw;
                if (sonuc === 'Normal') data.cell.styles.textColor = [0, 128, 0];
                else if (sonuc === 'Yüksek') data.cell.styles.textColor = [220, 53, 69];
                else if (sonuc === 'Dikkat') data.cell.styles.textColor = [255, 165, 0];
              }
            }
          });
        }
      }

      // Değerlendirme
      if (formData.degerlendirme) {
        // Yeni sayfa gerekirse ekle
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('DEĞERLENDİRME', 15, yPosition);
        yPosition += 7;

        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        const splitDegerlendirme = pdf.splitTextToSize(formData.degerlendirme, pageWidth - 30);
        pdf.text(splitDegerlendirme, 15, yPosition);
        yPosition += splitDegerlendirme.length * 5 + 5;
      }

      // Öneri
      if (formData.oneri) {
        // Yeni sayfa gerekirse ekle
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.text('ÖNERİLER', 15, yPosition);
        yPosition += 7;

        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        const splitOneri = pdf.splitTextToSize(formData.oneri, pageWidth - 30);
        pdf.text(splitOneri, 15, yPosition);
      }

      // PDF'i kaydet
      pdf.save(`OSOS_Rapor_${formData.raporNo || 'YeniRapor'}.pdf`);
      alert('✅ PDF başarıyla oluşturuldu!');
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

  // Excel/JSON Import - Geliştirilmiş
  const handleExcelImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setExcelFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        
        // Veri formatını doğrula
        if (!Array.isArray(jsonData) || jsonData.length === 0) {
          alert('⚠️ Geçersiz veri formatı! Dizi içeren bir JSON bekleniyor.');
          return;
        }
        
        // İlk satırdan veri yapısını kontrol et
        const firstRow = jsonData[0];
        const hasOSOSFormat = firstRow.hasOwnProperty("Tarih") && 
                              firstRow.hasOwnProperty("Tüketim ()") && 
                              firstRow.hasOwnProperty("Çarpan");
        
        if (!hasOSOSFormat) {
          alert('⚠️ OSOS veri formatı algılanamadı!\n\nBeklenen alanlar:\n- Tarih\n- Tüketim ()\n- Çarpan\n- Okunan Endeks Değeri');
          return;
        }
        
        // Enerji tipini otomatik tespit et
        const toplamTuketim = jsonData.reduce((sum, row) => sum + parseFloat(row["Tüketim ()"] || 0), 0);
        const tahminEdilenTip = tesbitEnerjiTipi(toplamTuketim, jsonData.length);
        
        setExcelData(jsonData);
        setBekleyenVeri({ jsonData, dosyaAdi: file.name, tahminEdilenTip, toplamTuketim });
        setShowEnerjiTipiModal(true);
      } catch (error) {
        alert('❌ JSON dosyası okunamadı:\n' + error.message);
      }
    };
    
    reader.readAsText(file);
  };

  // Enerji tipi otomatik tespit
  const tesbitEnerjiTipi = (toplamTuketim, kayitSayisi) => {
    const ortalama = toplamTuketim / kayitSayisi;
    
    // Tüketim seviyesine göre tahmin
    if (toplamTuketim > 5000) {
      return 'aktif';
    } else if (toplamTuketim > 500 && toplamTuketim <= 5000) {
      return 'induktif';
    } else {
      return 'kapasitif';
    }
  };

  const importExcelData = () => {
    if (!bekleyenVeri) {
      alert('⚠️ Önce JSON dosyası yükleyin!');
      return;
    }

    const { jsonData, dosyaAdi, tahminEdilenTip } = bekleyenVeri;
    
    // Fabrika adını kullanıcıdan al
    const fabrikaAdi = prompt('Fabrika Adı:', formData.firmaAdi || 'Yeni Fabrika');
    if (!fabrikaAdi) return;

    // Seçilen veya otomatik tespit edilen enerji tipine göre işle
    const enerjiTipi = secilenEnerjiTipi === 'auto' ? tahminEdilenTip : secilenEnerjiTipi;
    
    // Verileri enerji tipine göre işle
    const { aktifData, induktifData, kapasitifData, istatistikler } = 
      islenenVeriHazirla(jsonData, enerjiTipi);
    
    const baslangicTarihi = jsonData[0]["Tarih"] || jsonData[0]["Tarih2"];
    const bitisTarihi = jsonData[jsonData.length - 1]["Tarih"] || jsonData[jsonData.length - 1]["Tarih2"];
    
    // Fabrika verisini kaydet
    const yeniFabrikaVerisi = {
      id: Date.now(),
      fabrikaAdi,
      dosyaAdi,
      enerjiTipi,
      yuklemeTarihi: new Date().toISOString(),
      baslangicTarihi,
      bitisTarihi,
      veriSayisi: jsonData.length,
      istatistikler,
      aktifEnerji: aktifData,
      induktifEnerji: induktifData,
      kapasitifEnerji: kapasitifData,
      hamVeri: jsonData
    };
    
    // Fabrika verilerini güncelle
    setFabrikaVerileri(prev => [...prev, yeniFabrikaVerisi]);
    
    // Mevcut rapora yükle
    setAktifEnerji(aktifData);
    setInduktifEnerji(induktifData);
    setKapasitifEnerji(kapasitifData);
    
    // Firma adını güncelle
    if (!formData.firmaAdi) {
      setFormData(prev => ({ ...prev, firmaAdi: fabrikaAdi }));
    }
    
    setShowEnerjiTipiModal(false);
    setBekleyenVeri(null);
    setSecilenEnerjiTipi('auto');
    
    alert(`✅ ${fabrikaAdi} için veri aktarıldı!\n\n` +
          `⚡ Enerji Tipi: ${enerjiTipi.toUpperCase()}\n` +
          `📊 Veri Sayısı: ${jsonData.length}\n` +
          `📅 Tarih Aralığı: ${baslangicTarihi} - ${bitisTarihi}\n` +
          `⚡ Toplam Tüketim: ${istatistikler.toplamTuketim} kWh\n` +
          `📈 Ortalama: ${istatistikler.ortalamaTuketim} kWh\n` +
          `🔝 Max: ${istatistikler.maxTuketim} kWh`);
  };

  // Veriyi enerji tipine göre işle
  const islenenVeriHazirla = (jsonData, enerjiTipi) => {
    const aktifData = [];
    const induktifData = [];
    const kapasitifData = [];
    
    let toplamTuketim = 0;
    let maxTuketim = 0;
    let minTuketim = Infinity;
    
    jsonData.forEach((row, idx) => {
      const tarih = row["Tarih"] || row["Tarih2"] || '';
      const tuketim = parseFloat(row["Tüketim ()"] || 0);
      const endeks = parseFloat(row["Okunan Endeks Değeri"] || 0);
      const carpan = parseInt(row["Çarpan"] || 1);
      const okumaSuresi = parseInt(row["Okuma Süresi (Saat)"] || 0);
      
      toplamTuketim += tuketim;
      maxTuketim = Math.max(maxTuketim, tuketim);
      if (tuketim > 0) minTuketim = Math.min(minTuketim, tuketim);
      
      if (enerjiTipi === 'aktif') {
        // Bu dosya Aktif enerji
        aktifData.push({
          id: idx + 1,
          tarih,
          tuketim,
          endeks,
          carpan,
          okumaSuresi,
          sonuc: tuketim > 15 ? "Yüksek" : tuketim > 8 ? "Dikkat" : "Normal"
        });
        
        // İndüktif ve Kapasitif tahmini (%25-35 ve %5-15)
        const induktifOran = 0.25 + (Math.random() * 0.1);
        induktifData.push({
          id: idx + 1,
          tarih,
          tuketim: (tuketim * induktifOran).toFixed(2),
          endeks: endeks * induktifOran,
          carpan,
          okumaSuresi,
          sonuc: (tuketim * induktifOran) > 5 ? "Yüksek" : "Normal"
        });
        
        const kapasitifOran = 0.05 + (Math.random() * 0.1);
        kapasitifData.push({
          id: idx + 1,
          tarih,
          tuketim: (tuketim * kapasitifOran).toFixed(2),
          endeks: endeks * kapasitifOran,
          carpan,
          okumaSuresi,
          sonuc: (tuketim * kapasitifOran) > 2 ? "Yüksek" : "Normal"
        });
        
      } else if (enerjiTipi === 'induktif') {
        // Bu dosya İndüktif reaktif enerji
        induktifData.push({
          id: idx + 1,
          tarih,
          tuketim,
          endeks,
          carpan,
          okumaSuresi,
          sonuc: tuketim > 5 ? "Yüksek" : tuketim > 2.5 ? "Dikkat" : "Normal"
        });
        
        // Aktif ve Kapasitif tahmin et
        aktifData.push({
          id: idx + 1,
          tarih,
          tuketim: (tuketim / 0.3).toFixed(2),
          endeks: endeks / 0.3,
          carpan,
          okumaSuresi,
          sonuc: "Normal"
        });
        
        kapasitifData.push({
          id: idx + 1,
          tarih,
          tuketim: (tuketim * 0.3).toFixed(2),
          endeks: endeks * 0.3,
          carpan,
          okumaSuresi,
          sonuc: "Normal"
        });
        
      } else if (enerjiTipi === 'kapasitif') {
        // Bu dosya Kapasitif reaktif enerji
        kapasitifData.push({
          id: idx + 1,
          tarih,
          tuketim,
          endeks,
          carpan,
          okumaSuresi,
          sonuc: tuketim > 2 ? "Yüksek" : tuketim > 1 ? "Dikkat" : "Normal"
        });
        
        // Aktif ve İndüktif tahmin et
        aktifData.push({
          id: idx + 1,
          tarih,
          tuketim: (tuketim / 0.1).toFixed(2),
          endeks: endeks / 0.1,
          carpan,
          okumaSuresi,
          sonuc: "Normal"
        });
        
        induktifData.push({
          id: idx + 1,
          tarih,
          tuketim: (tuketim * 2.5).toFixed(2),
          endeks: endeks * 2.5,
          carpan,
          okumaSuresi,
          sonuc: "Normal"
        });
      }
    });

    const ortalamaTuketim = (toplamTuketim / jsonData.length).toFixed(2);
    
    return {
      aktifData,
      induktifData,
      kapasitifData,
      istatistikler: {
        toplamTuketim: toplamTuketim.toFixed(2),
        ortalamaTuketim,
        maxTuketim: maxTuketim.toFixed(2),
        minTuketim: minTuketim === Infinity ? 0 : minTuketim.toFixed(2)
      }
    };
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

  // Fabrika Yönetimi Fonksiyonları
  const fabrikaVeriYukle = (fabrika) => {
    setSecilenFabrika(fabrika);
    setAktifEnerji(fabrika.aktifEnerji);
    setInduktifEnerji(fabrika.induktifEnerji);
    setKapasitifEnerji(fabrika.kapasitifEnerji);
    setFormData(prev => ({ ...prev, firmaAdi: fabrika.fabrikaAdi }));
    setShowFabrikaModal(false);
    alert(`✅ ${fabrika.fabrikaAdi} verileri yüklendi!`);
  };

  const fabrikaSil = (fabrikaId) => {
    if (confirm('Bu fabrika verisini silmek istediğinizden emin misiniz?')) {
      setFabrikaVerileri(prev => prev.filter(f => f.id !== fabrikaId));
      if (secilenFabrika?.id === fabrikaId) {
        setSecilenFabrika(null);
        setAktifEnerji([]);
        setInduktifEnerji([]);
        setKapasitifEnerji([]);
      }
      alert('✅ Fabrika verisi silindi!');
    }
  };

  const tumFabrikalariKarsilastir = () => {
    if (fabrikaVerileri.length < 2) {
      alert('⚠️ Karşılaştırma için en az 2 fabrika verisi gereklidir!');
      return;
    }
    
    let karsilastirmaMetni = '📊 FABRİKA KARŞILAŞTIRMASI\n\n';
    
    fabrikaVerileri.forEach((fabrika, idx) => {
      karsilastirmaMetni += `${idx + 1}. ${fabrika.fabrikaAdi}\n`;
      karsilastirmaMetni += `   📅 Tarih: ${fabrika.baslangicTarihi} - ${fabrika.bitisTarihi}\n`;
      karsilastirmaMetni += `   ⚡ Toplam: ${fabrika.istatistikler.toplamTuketim} kWh\n`;
      karsilastirmaMetni += `   📈 Ortalama: ${fabrika.istatistikler.ortalamaTuketim} kWh\n`;
      karsilastirmaMetni += `   🔝 Max: ${fabrika.istatistikler.maxTuketim} kWh\n\n`;
    });
    
    alert(karsilastirmaMetni);
  };

  // HTML İnteraktif Rapor Export
  const exportHTMLReport = () => {
    if (fabrikaVerileri.length === 0) {
      alert('⚠️ En az 1 fabrika verisi yüklü olmalı!');
      return;
    }

    // Tüm fabrikaların verilerini topla
    let tumAktif = [];
    let tumInduktif = [];
    let tumKapasitif = [];

    fabrikaVerileri.forEach(fabrika => {
      tumAktif = tumAktif.concat(fabrika.aktifEnerji.map(v => ({ ...v, fabrika: fabrika.fabrikaAdi })));
      tumInduktif = tumInduktif.concat(fabrika.induktifEnerji.map(v => ({ ...v, fabrika: fabrika.fabrikaAdi })));
      tumKapasitif = tumKapasitif.concat(fabrika.kapasitifEnerji.map(v => ({ ...v, fabrika: fabrika.fabrikaAdi })));
    });

    // Verileri tarih bazında grupla
    const gunlukVeri = {};
    
    tumAktif.forEach(item => {
      if (!gunlukVeri[item.tarih]) {
        gunlukVeri[item.tarih] = { aktif: 0, induktif: 0, kapasitif: 0 };
      }
      gunlukVeri[item.tarih].aktif += parseFloat(item.tuketim);
    });

    tumInduktif.forEach(item => {
      if (gunlukVeri[item.tarih]) {
        gunlukVeri[item.tarih].induktif += parseFloat(item.tuketim);
      }
    });

    tumKapasitif.forEach(item => {
      if (gunlukVeri[item.tarih]) {
        gunlukVeri[item.tarih].kapasitif += parseFloat(item.tuketim);
      }
    });

    // İstatistikler
    const toplamAktif = Object.values(gunlukVeri).reduce((sum, v) => sum + v.aktif, 0);
    const toplamInduktif = Object.values(gunlukVeri).reduce((sum, v) => sum + v.induktif, 0);
    const toplamKapasitif = Object.values(gunlukVeri).reduce((sum, v) => sum + v.kapasitif, 0);

    const induktifOran = (toplamInduktif / toplamAktif) * 100;
    const kapasitifOran = (toplamKapasitif / toplamAktif) * 100;

    const isPenalty = induktifOran > 20 || kapasitifOran > 15;
    const statusMsg = isPenalty ? "UYGUN DEĞİL (CEZALI)" : "DURUM: UYGUN";

    // JSON data hazırla
    const chartData = Object.keys(gunlukVeri).sort().map(tarih => ({
      tarih,
      aktif: gunlukVeri[tarih].aktif.toFixed(2),
      induktif: gunlukVeri[tarih].induktif.toFixed(2),
      kapasitif: gunlukVeri[tarih].kapasitif.toFixed(2)
    }));

    // HTML oluştur - YÖNETİCİ DOSTU, SADE FORMAT
    const htmlContent = `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OSOS Raporu - ${formData.firmaAdi || 'Analiz'}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: #f5f7fa;
            padding: 30px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        
        /* Header - Logo ve Durum */
        .header { 
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.08); 
            margin-bottom: 25px; 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            border-left: 5px solid #667eea;
        }
        .logo-section { display: flex; align-items: center; gap: 20px; }
        .logo-section img { height: 60px; width: auto; }
        .title-section h1 { 
            font-size: 24px; 
            color: #2c3e50; 
            margin-bottom: 5px;
        }
        .title-section .subtitle { 
            font-size: 14px; 
            color: #7f8c8d; 
        }
        
        /* Durum Badge - Net ve Büyük */
        .status-badge { 
            padding: 20px 40px; 
            border-radius: 50px; 
            font-weight: 800; 
            font-size: 20px;
            text-align: center;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: pulse 2s infinite;
        }
        .status-ok { 
            background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%); 
            color: white;
        }
        .status-fail { 
            background: linear-gradient(135deg, #f5222d 0%, #ff4d4f 100%); 
            color: white;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        /* Özet Kartlar - 3 Ana Gösterge */
        .summary-cards { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .summary-card { 
            background: white; 
            padding: 30px; 
            border-radius: 12px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.08); 
            text-align: center;
            border-top: 4px solid;
        }
        .summary-card.aktif { border-top-color: #1890ff; }
        .summary-card.induktif { border-top-color: #faad14; }
        .summary-card.kapasitif { border-top-color: #52c41a; }
        
        .summary-card .icon { 
            font-size: 40px; 
            margin-bottom: 15px; 
        }
        .summary-card h3 { 
            font-size: 14px; 
            color: #8c8c8c; 
            text-transform: uppercase; 
            letter-spacing: 1px;
            margin-bottom: 10px;
        }
        .summary-card .value { 
            font-size: 36px; 
            font-weight: 700; 
            color: #2c3e50; 
            margin-bottom: 8px;
        }
        .summary-card .oran { 
            font-size: 16px; 
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 8px;
        }
        .oran-ok { background: #d4edda; color: #155724; }
        .oran-fail { background: #f8d7da; color: #721c24; }
        
        /* Grafikler */
        .charts-container { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            margin-bottom: 25px;
        }
        .chart-box { 
            background: white; 
            padding: 25px; 
            border-radius: 12px; 
            box-shadow: 0 2px 8px rgba(0,0,0,0.08); 
        }
        .chart-box h2 {
            font-size: 18px;
            color: #2c3e50;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            padding-bottom: 12px;
            border-bottom: 2px solid #e8e8e8;
        }
        
        /* Detay Tablo - Kompakt */
        .details-section {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            margin-bottom: 25px;
        }
        .details-section h2 {
            font-size: 18px;
            color: #2c3e50;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e8e8e8;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        .info-label { font-weight: 600; color: #495057; }
        .info-value { color: #212529; }
        
        /* Footer */
        .footer {
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            text-align: center;
            color: #6c757d;
            font-size: 13px;
        }
        
        @media (max-width: 768px) {
            .charts-container { grid-template-columns: 1fr; }
            .summary-cards { grid-template-columns: 1fr; }
            .info-grid { grid-template-columns: 1fr; }
        }
        
        @media print {
            body { background: white; padding: 10px; }
            .status-badge { animation: none; }
        }
    </style>
</head>
<body>

<div class="container">
    <!-- Header -->
    <div class="header">
        <div class="logo-section">
            ${logo ? `<img src="${logo}" alt="Logo" style="max-height: 60px; width: auto;">` : ''}
            <div class="title-section">
                <h1>OSOS Enerji Analiz Raporu</h1>
                <div class="subtitle">
                    ${formData.firmaAdi || 'Analiz'} | ${fabrikaVerileri.length} Fabrika | 
                    ${fabrikaVerileri[0]?.baslangicTarihi || ''} - ${fabrikaVerileri[fabrikaVerileri.length-1]?.bitisTarihi || ''}
                </div>
            </div>
        </div>
        <div class="status-badge ${isPenalty ? 'status-fail' : 'status-ok'}">
            ${isPenalty ? '❌ UYGUN DEĞİL' : '✅ UYGUN'}
        </div>
    </div>

    <!-- Özet Kartlar -->
    <div class="summary-cards">
        <div class="summary-card aktif">
            <div class="icon">⚡</div>
            <h3>Aktif Enerji</h3>
            <div class="value">${toplamAktif.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} kWh</div>
        </div>
        <div class="summary-card induktif">
            <div class="icon">🔶</div>
            <h3>İndüktif Reaktif</h3>
            <div class="value">${toplamInduktif.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} kVArh</div>
            <div class="oran ${induktifOran > 20 ? 'oran-fail' : 'oran-ok'}">
                %${induktifOran.toFixed(1)} ${induktifOran > 20 ? '⚠️ Limit Aşıldı' : '✓ Uygun'}
            </div>
        </div>
        <div class="summary-card kapasitif">
            <div class="icon">🔷</div>
            <h3>Kapasitif Reaktif</h3>
            <div class="value">${toplamKapasitif.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} kVArh</div>
            <div class="oran ${kapasitifOran > 15 ? 'oran-fail' : 'oran-ok'}">
                %${kapasitifOran.toFixed(1)} ${kapasitifOran > 15 ? '⚠️ Limit Aşıldı' : '✓ Uygun'}
            </div>
        </div>
    </div>

    <!-- Detay Bilgiler -->
    <div class="details-section">
        <h2>📋 Rapor Detayları</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Kontrol Eden:</span>
                <span class="info-value">${formData.kontrolEdenAd || '-'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Unvan:</span>
                <span class="info-value">${formData.kontrolEdenUnvan || 'OSOS Uzmanı'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Kontrol Tarihi:</span>
                <span class="info-value">${formData.kontrolTarihi || new Date().toLocaleDateString('tr-TR')}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Günlük Ort. Tüketim:</span>
                <span class="info-value">${(toplamAktif / Object.keys(gunlukVeri).length).toFixed(0)} kWh</span>
            </div>
            <div class="info-item">
                <span class="info-label">İndüktif Limit (EPDK):</span>
                <span class="info-value">%20</span>
            </div>
            <div class="info-item">
                <span class="info-label">Kapasitif Limit (EPDK):</span>
                <span class="info-value">%15</span>
            </div>
        </div>
    </div>

    <!-- Grafikler -->
    <div class="charts-container">
        <div class="chart-box">
            <h2><span>📊</span> Günlük Enerji Tüketimi</h2>
            <canvas id="mainChart"></canvas>
        </div>
        <div class="chart-box">
            <h2><span>⚠️</span> Reaktif Oran Dağılımı</h2>
            <canvas id="ratioChart"></canvas>
        </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
        <p><strong>OSOS Otomatik Rapor Sistemi</strong></p>
        <p>Rapor Oluşturma Tarihi: ${new Date().toLocaleString('tr-TR')}</p>
        <p style="margin-top: 8px; color: #999;">
            Bu rapor otomatik olarak oluşturulmuştur. EPDK standartlarına göre hazırlanmıştır.
        </p>
    </div>
</div>

<script>
    const chartData = ${JSON.stringify(chartData)};
    
    // Tarihleri formatla
    const labels = chartData.map(d => {
        const parts = d.tarih.split('.');
        return parts[0] + '.' + parts[1];
    });
    
    const aktifValues = chartData.map(d => parseFloat(d.aktif));
    const induktifValues = chartData.map(d => parseFloat(d.induktif));
    const kapasitifValues = chartData.map(d => parseFloat(d.kapasitif));
    
    // Ana Trend Grafiği
    new Chart(document.getElementById('mainChart'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Aktif (kWh)',
                    data: aktifValues,
                    backgroundColor: '#1890ff',
                    borderRadius: 6,
                    barPercentage: 0.7
                },
                {
                    label: 'İndüktif (kVArh)',
                    data: induktifValues,
                    backgroundColor: '#faad14',
                    borderRadius: 6,
                    barPercentage: 0.7
                },
                {
                    label: 'Kapasitif (kVArh)',
                    data: kapasitifValues,
                    backgroundColor: '#52c41a',
                    borderRadius: 6,
                    barPercentage: 0.7
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { 
                        font: { size: 12 },
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y.toLocaleString('tr-TR') + ' ' + (context.dataset.label.includes('kWh') ? 'kWh' : 'kVArh');
                        }
                    }
                }
            },
            scales: {
                x: { 
                    grid: { display: false },
                    ticks: { font: { size: 11 } }
                },
                y: { 
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: {
                        font: { size: 11 },
                        callback: function(value) {
                            return value.toLocaleString('tr-TR');
                        }
                    }
                }
            }
        }
    });
    
    // Reaktif Oran Grafiği (Doughnut)
    const induktifRatio = ${induktifOran.toFixed(2)};
    const kapasitifRatio = ${kapasitifOran.toFixed(2)};
    
    new Chart(document.getElementById('ratioChart'), {
        type: 'doughnut',
        data: {
            labels: [
                'İndüktif Reaktif: %' + induktifRatio,
                'Kapasitif Reaktif: %' + kapasitifRatio
            ],
            datasets: [{
                data: [induktifRatio, kapasitifRatio],
                backgroundColor: [
                    induktifRatio > 20 ? '#ff4d4f' : '#faad14',
                    kapasitifRatio > 15 ? '#ff4d4f' : '#52c41a'
                ],
                borderWidth: 3,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: { 
                        font: { size: 11 },
                        padding: 12,
                        boxWidth: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const limit = label.includes('İndüktif') ? 20 : 15;
                            const status = context.parsed > limit ? ' ⚠️ Limit Aşıldı' : ' ✓ Uygun';
                            return label + status;
                        }
                    }
                }
            }
        }
    });
</script>

</body>
</html>`;

    // HTML dosyasını indir
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `OSOS_Rapor_${formData.firmaAdi || 'Analiz'}_${new Date().toISOString().split('T')[0]}.html`;
    link.click();
    URL.revokeObjectURL(url);

    alert('✅ HTML Rapor oluşturuldu!\n\nİndirilen dosyayı tarayıcınızda açarak interaktif raporunuzu görebilirsiniz.');
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
    <div className="min-h-screen bg-gray-100">
      {/* Tab Sistemi */}
      <div className={`bg-white shadow-md no-print ${printMode ? 'hidden' : ''}`}>
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setOsosTab('canli')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
              ososTab === 'canli'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <Activity className="w-5 h-5" />
            Canlı İzleme
          </button>
          <button
            onClick={() => setOsosTab('rapor')}
            className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
              ososTab === 'rapor'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            Rapor Oluştur
          </button>
        </div>
      </div>

      {/* Canlı İzleme Tab */}
      {ososTab === 'canli' && (
        <OsosCanliIzleme />
      )}

      {/* Rapor Tab */}
      {ososTab === 'rapor' && (
        <div className="p-4">
          {/* Header */}
          <div className={`bg-white shadow-md rounded-lg p-4 mb-4 flex justify-between items-center no-print ${printMode ? 'hidden' : ''}`}>
            <div className="flex items-center gap-4">
              {logo && <img src={logo} alt="Logo" className="h-12 w-auto" />}
              <div>
                <h1 className="text-xl font-bold text-gray-800">OSOS Rapor Sistemi</h1>
                <p className="text-xs text-gray-500">Organize Sanayi Ölçüm Sistemi</p>
              </div>
            </div>
            <div className="flex gap-2">
          <button 
            onClick={raporuKaydet}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
            title="Raporu kaydet"
          >
            <Save size={18} /> Kaydet
          </button>
          <button 
            onClick={raporlariYukle}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors"
            title="Kayıtlı raporları görüntüle"
          >
            <FileText size={18} /> Raporlar
          </button>
          <button 
            onClick={() => setShowFabrikaModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            title={`Kayıtlı ${fabrikaVerileri.length} fabrika`}
          >
            <FileText size={18} /> Fabrikalar {fabrikaVerileri.length > 0 && `(${fabrikaVerileri.length})`}
          </button>
          <button 
            onClick={exportHTMLReport}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 transition-colors"
            title="İnteraktif HTML rapor oluştur"
          >
            <Zap size={18} /> HTML Rapor
          </button>
          <button 
            onClick={() => setShowKosbiModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            <Zap size={18} /> KOSBI Veri Çek
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer">
            <Upload size={18} /> OSOS JSON İmport
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
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

      {/* Enerji Tipi Seçim Modal */}
      {showEnerjiTipiModal && bekleyenVeri && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full animate-slideUp">
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4">
              <h2 className="text-2xl font-bold">⚡ Enerji Tipi Belirleme</h2>
              <p className="text-sm text-green-100">{bekleyenVeri.dosyaAdi}</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Otomatik Tespit Sonucu */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 text-3xl">🤖</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 mb-2">Otomatik Tespit Sonucu</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Toplam Tüketim:</span>
                        <span className="font-bold ml-2">{bekleyenVeri.toplamTuketim.toFixed(2)} kWh</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Ortalama:</span>
                        <span className="font-bold ml-2">{(bekleyenVeri.toplamTuketim / bekleyenVeri.jsonData.length).toFixed(2)} kWh</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Tahmin Edilen Tip:</span>
                        <span className="font-bold ml-2 text-lg">
                          {bekleyenVeri.tahminEdilenTip === 'aktif' && '⚡ AKTİF ENERJİ'}
                          {bekleyenVeri.tahminEdilenTip === 'induktif' && '🔶 ENDÜKTİF REAKTİF'}
                          {bekleyenVeri.tahminEdilenTip === 'kapasitif' && '🔷 KAPASİTİF REAKTİF'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manuel Seçim */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Enerji Tipini Seçin:</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                         style={{ borderColor: secilenEnerjiTipi === 'auto' ? '#3b82f6' : '#e5e7eb' }}>
                    <input
                      type="radio"
                      name="enerjiTipi"
                      value="auto"
                      checked={secilenEnerjiTipi === 'auto'}
                      onChange={(e) => setSecilenEnerjiTipi(e.target.value)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">🤖 Otomatik (Önerilen)</div>
                      <div className="text-sm text-gray-600">
                        Sistem tüketim seviyesine göre otomatik belirleyecek
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                         style={{ borderColor: secilenEnerjiTipi === 'aktif' ? '#10b981' : '#e5e7eb' }}>
                    <input
                      type="radio"
                      name="enerjiTipi"
                      value="aktif"
                      checked={secilenEnerjiTipi === 'aktif'}
                      onChange={(e) => setSecilenEnerjiTipi(e.target.value)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">⚡ Aktif Enerji</div>
                      <div className="text-sm text-gray-600">
                        Gerçek tüketim (Ana sayaç, yüksek değerler)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                         style={{ borderColor: secilenEnerjiTipi === 'induktif' ? '#f59e0b' : '#e5e7eb' }}>
                    <input
                      type="radio"
                      name="enerjiTipi"
                      value="induktif"
                      checked={secilenEnerjiTipi === 'induktif'}
                      onChange={(e) => setSecilenEnerjiTipi(e.target.value)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">🔶 Endüktif Reaktif Enerji</div>
                      <div className="text-sm text-gray-600">
                        Motorlar, transformatörler (Aktifin %20-35'i)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition"
                         style={{ borderColor: secilenEnerjiTipi === 'kapasitif' ? '#3b82f6' : '#e5e7eb' }}>
                    <input
                      type="radio"
                      name="enerjiTipi"
                      value="kapasitif"
                      checked={secilenEnerjiTipi === 'kapasitif'}
                      onChange={(e) => setSecilenEnerjiTipi(e.target.value)}
                      className="w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="font-bold text-gray-800">🔷 Kapasitif Reaktif Enerji</div>
                      <div className="text-sm text-gray-600">
                        Kondansatörler, kompanzasyon (Aktifin %5-15'i)
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Bilgilendirme */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                <p className="font-semibold text-yellow-800 mb-1">💡 İpucu</p>
                <p className="text-yellow-700 text-xs">
                  Eğer 3 ayrı JSON dosyanız varsa (grdResult.json, grdResult (1).json, grdResult (2).json), 
                  her birini sırayla yükleyip farklı tipler seçerek tam analiz yapabilirsiniz.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEnerjiTipiModal(false);
                  setBekleyenVeri(null);
                  setSecilenEnerjiTipi('auto');
                }}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition text-gray-700"
              >
                İptal
              </button>
              <button
                onClick={importExcelData}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-md transition flex items-center gap-2 font-semibold"
              >
                <CheckCircle size={18} />
                İçe Aktar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fabrika Yönetimi Modal */}
      {showFabrikaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText size={28} />
                    Fabrika Veri Yönetimi
                  </h2>
                  <p className="text-sm text-blue-100">OSOS Fabrika Verileri - {fabrikaVerileri.length} kayıt</p>
                </div>
                <button 
                  onClick={() => setShowFabrikaModal(false)}
                  className="text-white hover:bg-blue-700 p-2 rounded-full transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {fabrikaVerileri.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <FileText size={64} className="mx-auto" />
                  </div>
                  <p className="text-gray-600 font-semibold mb-2">Henüz fabrika verisi yüklenmemiş</p>
                  <p className="text-sm text-gray-500 mb-4">
                    "OSOS JSON İmport" butonunu kullanarak grdResult.json formatında veri yükleyin
                  </p>
                  <label className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors cursor-pointer">
                    <Upload size={20} /> JSON Dosyası Yükle
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={handleExcelImport}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <>
                  {/* Karşılaştırma Butonu */}
                  {fabrikaVerileri.length >= 2 && (
                    <div className="mb-4">
                      <button
                        onClick={tumFabrikalariKarsilastir}
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all flex items-center justify-center gap-2 font-semibold"
                      >
                        📊 Tüm Fabrikaları Karşılaştır
                      </button>
                    </div>
                  )}

                  {/* Fabrika Listesi */}
                  <div className="space-y-3">
                    {fabrikaVerileri.map((fabrika) => (
                      <div 
                        key={fabrika.id} 
                        className={`border-2 rounded-lg p-4 transition-all ${
                          secilenFabrika?.id === fabrika.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-800">{fabrika.fabrikaAdi}</h3>
                              {fabrika.enerjiTipi && (
                                <span className={`px-3 py-1 text-white text-xs rounded-full font-semibold ${
                                  fabrika.enerjiTipi === 'aktif' ? 'bg-green-600' :
                                  fabrika.enerjiTipi === 'induktif' ? 'bg-orange-600' :
                                  'bg-blue-600'
                                }`}>
                                  {fabrika.enerjiTipi === 'aktif' && '⚡ Aktif'}
                                  {fabrika.enerjiTipi === 'induktif' && '🔶 Endüktif'}
                                  {fabrika.enerjiTipi === 'kapasitif' && '🔷 Kapasitif'}
                                </span>
                              )}
                              {secilenFabrika?.id === fabrika.id && (
                                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
                                  ✓ Aktif Rapor
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500 text-xs">Dosya</p>
                                <p className="font-semibold text-gray-700">{fabrika.dosyaAdi}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Veri Sayısı</p>
                                <p className="font-semibold text-gray-700">{fabrika.veriSayisi} kayıt</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Tarih Aralığı</p>
                                <p className="font-semibold text-gray-700">{fabrika.baslangicTarihi} - {fabrika.bitisTarihi}</p>
                              </div>
                              <div>
                                <p className="text-gray-500 text-xs">Yüklenme</p>
                                <p className="font-semibold text-gray-700">{new Date(fabrika.yuklemeTarihi).toLocaleDateString('tr-TR')}</p>
                              </div>
                            </div>

                            {/* İstatistikler */}
                            <div className="mt-3 grid grid-cols-4 gap-2">
                              <div className="bg-green-50 border border-green-200 rounded p-2">
                                <p className="text-xs text-green-600">Toplam Tüketim</p>
                                <p className="text-sm font-bold text-green-800">{fabrika.istatistikler.toplamTuketim} kWh</p>
                              </div>
                              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                <p className="text-xs text-blue-600">Ortalama</p>
                                <p className="text-sm font-bold text-blue-800">{fabrika.istatistikler.ortalamaTuketim} kWh</p>
                              </div>
                              <div className="bg-orange-50 border border-orange-200 rounded p-2">
                                <p className="text-xs text-orange-600">Maximum</p>
                                <p className="text-sm font-bold text-orange-800">{fabrika.istatistikler.maxTuketim} kWh</p>
                              </div>
                              <div className="bg-purple-50 border border-purple-200 rounded p-2">
                                <p className="text-xs text-purple-600">Minimum</p>
                                <p className="text-sm font-bold text-purple-800">{fabrika.istatistikler.minTuketim} kWh</p>
                              </div>
                            </div>
                          </div>

                          {/* Aksiyonlar */}
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => fabrikaVeriYukle(fabrika)}
                              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-semibold whitespace-nowrap"
                            >
                              📊 Rapora Yükle
                            </button>
                            <button
                              onClick={() => {
                                // Ham veriyi indirme
                                const dataStr = JSON.stringify(fabrika.hamVeri, null, 2);
                                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                const url = URL.createObjectURL(dataBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `${fabrika.fabrikaAdi}_ham_veri.json`;
                                link.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm font-semibold whitespace-nowrap"
                            >
                              💾 Ham Veri İndir
                            </button>
                            <button
                              onClick={() => fabrikaSil(fabrika.id)}
                              className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition text-sm font-semibold whitespace-nowrap"
                            >
                              🗑️ Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="bg-gray-50 p-4 border-t flex justify-between items-center">
              <p className="text-sm text-gray-600">
                💡 <strong>İpucu:</strong> Her fabrika için ayrı JSON dosyası yükleyerek tüm verileri merkezi yönetin
              </p>
              <button
                onClick={() => setShowFabrikaModal(false)}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition"
              >
                Kapat
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
                <Zap size={18} /> OSOS Otomatik Veri Analizi
              </h2>
              <button
                onClick={addMeasurement}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                <FileText size={14} /> Yeni Parametre
              </button>
            </div>
            <div className="space-y-3">
              {measurements.map((m, idx) => (
                <div key={m.id} className="p-3 bg-gray-50 rounded border grid grid-cols-6 gap-2 items-center">
                  <input
                    type="text"
                    value={m.parametre}
                    onChange={(e) => handleMeasurementChange(m.id, 'parametre', e.target.value)}
                    className="p-2 border rounded text-sm col-span-2"
                    placeholder="Parametre (örn: Aktif Güç)"
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
                    value={m.referans}
                    onChange={(e) => handleMeasurementChange(m.id, 'referans', e.target.value)}
                    className="p-2 border rounded text-sm"
                    placeholder="Referans"
                  />
                  <div className="flex gap-1">
                    <select
                      value={m.durum}
                      onChange={(e) => handleMeasurementChange(m.id, 'durum', e.target.value)}
                      className="p-2 border rounded text-sm flex-1"
                    >
                      <option value="Normal">✅ Normal</option>
                      <option value="Uyarı">⚠️ Uyarı</option>
                      <option value="Kritik">❌ Kritik</option>
                    </select>
                    <button
                      onClick={() => removeMeasurement(m.id)}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                      disabled={measurements.length === 1}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ENERJİ TİPLERİ TABLOLARI */}
          {(aktifEnerji.length > 0 || induktifEnerji.length > 0 || kapasitifEnerji.length > 0) && (
            <div className="p-6 bg-white shadow-md rounded-lg max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                  ⚡ Enerji Tüketim Analizi
                </h2>
                <div className="text-sm text-gray-600">
                  📊 Toplam: {aktifEnerji.length + induktifEnerji.length + kapasitifEnerji.length} kayıt
                </div>
              </div>

              {/* Özet Kartlar */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border-2 border-green-500 p-4 rounded-lg">
                  <div className="text-green-700 font-bold text-sm mb-1">⚡ Aktif Enerji</div>
                  <div className="text-2xl font-bold text-green-900">
                    {aktifEnerji.reduce((sum, item) => sum + parseFloat(item.tuketim), 0).toFixed(2)} kWh
                  </div>
                  <div className="text-xs text-green-600 mt-1">{aktifEnerji.length} ölçüm</div>
                </div>
                <div className="bg-orange-50 border-2 border-orange-500 p-4 rounded-lg">
                  <div className="text-orange-700 font-bold text-sm mb-1">🔶 İndüktif Reaktif</div>
                  <div className="text-2xl font-bold text-orange-900">
                    {induktifEnerji.reduce((sum, item) => sum + parseFloat(item.tuketim), 0).toFixed(2)} kVArh
                  </div>
                  <div className="text-xs text-orange-600 mt-1">{induktifEnerji.length} ölçüm</div>
                </div>
                <div className="bg-blue-50 border-2 border-blue-500 p-4 rounded-lg">
                  <div className="text-blue-700 font-bold text-sm mb-1">🔷 Kapasitif Reaktif</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {kapasitifEnerji.reduce((sum, item) => sum + parseFloat(item.tuketim), 0).toFixed(2)} kVArh
                  </div>
                  <div className="text-xs text-blue-600 mt-1">{kapasitifEnerji.length} ölçüm</div>
                </div>
              </div>

              {/* AKTİF ENERJİ TABLOSU */}
              {aktifEnerji.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-green-700 mb-2">⚡ Aktif Enerji Detayları (kWh)</h3>
                  <div className="max-h-64 overflow-y-auto border rounded">
                    <table className="w-full text-xs">
                      <thead className="bg-green-600 text-white sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Tarih</th>
                          <th className="p-2 text-right">Tüketim (kWh)</th>
                          <th className="p-2 text-right">Endeks</th>
                          <th className="p-2 text-center">Çarpan</th>
                          <th className="p-2 text-center">Süre (Saat)</th>
                          <th className="p-2 text-center">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aktifEnerji.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="p-2">{item.tarih}</td>
                            <td className="p-2 text-right font-bold">{item.tuketim}</td>
                            <td className="p-2 text-right">{item.endeks.toFixed(2)}</td>
                            <td className="p-2 text-center">{item.carpan}</td>
                            <td className="p-2 text-center">{item.okumaSuresi}</td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                item.sonuc === 'Normal' ? 'bg-green-100 text-green-800' :
                                item.sonuc === 'Dikkat' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.sonuc}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* İNDÜKTİF ENERJİ TABLOSU */}
              {induktifEnerji.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-orange-700 mb-2">🔶 İndüktif Reaktif Enerji (kVArh)</h3>
                  <div className="max-h-64 overflow-y-auto border rounded">
                    <table className="w-full text-xs">
                      <thead className="bg-orange-600 text-white sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Tarih</th>
                          <th className="p-2 text-right">Tüketim (kVArh)</th>
                          <th className="p-2 text-right">Endeks</th>
                          <th className="p-2 text-center">Çarpan</th>
                          <th className="p-2 text-center">Süre (Saat)</th>
                          <th className="p-2 text-center">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {induktifEnerji.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="p-2">{item.tarih}</td>
                            <td className="p-2 text-right font-bold">{item.tuketim}</td>
                            <td className="p-2 text-right">{item.endeks.toFixed(2)}</td>
                            <td className="p-2 text-center">{item.carpan}</td>
                            <td className="p-2 text-center">{item.okumaSuresi}</td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                item.sonuc === 'Normal' ? 'bg-green-100 text-green-800' :
                                item.sonuc === 'Dikkat' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.sonuc}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* KAPASİTİF ENERJİ TABLOSU */}
              {kapasitifEnerji.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-semibold text-blue-700 mb-2">🔷 Kapasitif Reaktif Enerji (kVArh)</h3>
                  <div className="max-h-64 overflow-y-auto border rounded">
                    <table className="w-full text-xs">
                      <thead className="bg-blue-600 text-white sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Tarih</th>
                          <th className="p-2 text-right">Tüketim (kVArh)</th>
                          <th className="p-2 text-right">Endeks</th>
                          <th className="p-2 text-center">Çarpan</th>
                          <th className="p-2 text-center">Süre (Saat)</th>
                          <th className="p-2 text-center">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kapasitifEnerji.map((item, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="p-2">{item.tarih}</td>
                            <td className="p-2 text-right font-bold">{item.tuketim}</td>
                            <td className="p-2 text-right">{item.endeks.toFixed(2)}</td>
                            <td className="p-2 text-center">{item.carpan}</td>
                            <td className="p-2 text-center">{item.okumaSuresi}</td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                item.sonuc === 'Normal' ? 'bg-green-100 text-green-800' :
                                item.sonuc === 'Dikkat' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.sonuc}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

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
              <Upload size={18} /> Logo Ayarları
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL (varsayılan aktif)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={logoInputUrl}
                    onChange={(e) => setLogoInputUrl(e.target.value)}
                    placeholder="https://ornek.com/logo.png"
                    className="flex-1 p-2 border rounded text-sm"
                  />
                  <button
                    onClick={handleLogoUrlChange}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Güncelle
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 pt-3 border-t">
                <label className="flex-shrink-0">
                  <span className="block text-sm font-medium text-gray-700 mb-2">veya Dosyadan Yükle:</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="p-2 border rounded text-sm"
                  />
                </label>
                
                {logo && (
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 border-2 border-gray-300 rounded p-1">
                      <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <button
                      onClick={removeLogo}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      title="Varsayılan logoya dön"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kayıtlı Raporlar Modalı */}
      {showKayitliRaporlar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white px-6 py-4 flex justify-between items-center sticky top-0">
              <div>
                <h2 className="text-xl font-bold">Kayıtlı Raporlar</h2>
                <p className="text-sm text-cyan-100">Toplam {kaydedilenRaporlar.length} rapor</p>
              </div>
              <button 
                onClick={() => setShowKayitliRaporlar(false)} 
                className="text-white hover:bg-cyan-700 p-2 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {kaydedilenRaporlar.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <FileText size={64} className="mx-auto" />
                  </div>
                  <p className="text-gray-600 font-semibold mb-2">Henüz kayıtlı rapor yok</p>
                  <p className="text-sm text-gray-500">
                    Raporlarınızı kaydetmek için "Kaydet" butonunu kullanın
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {kaydedilenRaporlar.map((rapor) => (
                    <div 
                      key={rapor.id} 
                      className="border-2 rounded-lg p-4 hover:border-cyan-300 transition-all bg-white"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2">
                            <FileText size={18} className="text-cyan-600" />
                            {rapor.firmaAdi}
                          </h3>
                          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-semibold">Kayıt Tarihi:</span> {new Date(rapor.tarih).toLocaleString('tr-TR')}
                            </div>
                            <div>
                              <span className="font-semibold">Fabrika Sayısı:</span> {rapor.fabrikaVerileri.length}
                            </div>
                            <div>
                              <span className="font-semibold">Kontrol:</span> {rapor.formData.kontrolEdenAd || '-'}
                            </div>
                            <div>
                              <span className="font-semibold">Durum:</span>{' '}
                              <span className={rapor.formData.sonuc === 'Uygun' ? 'text-green-600' : 'text-red-600'}>
                                {rapor.formData.sonuc}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => kayitliRaporuAc(rapor)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
                          >
                            <Upload size={16} /> Yükle
                          </button>
                          <button
                            onClick={() => kayitliRaporuSil(rapor.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
                          >
                            <X size={16} /> Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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

        {/* OSOS Otomatik Veri Analizi Tablosu */}
        {measurements.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">
              📊 OSOS Otomatik Veri Analizi
            </h2>
            <p className="text-xs text-gray-600 mb-3 italic">
              * Bu veriler OSOS (Otomatik Sayaç Okuma Sistemi) tarafından otomatik olarak kaydedilmiş ve analiz edilmiştir.
            </p>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">#</th>
                  <th className="border border-gray-300 p-2 text-left">Parametre</th>
                  <th className="border border-gray-300 p-2 text-center">Ölçülen Değer</th>
                  <th className="border border-gray-300 p-2 text-center">Birim</th>
                  <th className="border border-gray-300 p-2 text-center">Referans</th>
                  <th className="border border-gray-300 p-2 text-center">Durum</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((m, idx) => (
                  <tr key={m.id}>
                    <td className="border border-gray-300 p-2">{idx + 1}</td>
                    <td className="border border-gray-300 p-2 font-medium">{m.parametre || '-'}</td>
                    <td className="border border-gray-300 p-2 text-center font-bold text-blue-700">{m.deger || '-'}</td>
                    <td className="border border-gray-300 p-2 text-center text-gray-600">{m.birim || '-'}</td>
                    <td className="border border-gray-300 p-2 text-center text-xs text-gray-500">{m.referans || '-'}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        m.durum === 'Normal' ? 'bg-green-100 text-green-700' : 
                        m.durum === 'Uyarı' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {m.durum}
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
      )}
    </div>
  );
}
