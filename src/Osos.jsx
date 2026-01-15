import React, { useState } from 'react';
import { Printer, FileText, Save, RotateCcw } from 'lucide-react';

export default function Osos() {
  const [printMode, setPrintMode] = useState(false);
  const [logo, setLogo] = useState(null);
  
  // Form verileri
  const [formData, setFormData] = useState({
    firmaAdi: "",
    raporNo: "",
    raporTarihi: new Date().toISOString().split('T')[0],
    adres: "",
    yetkili: "",
    telefon: "",
    aciklama: ""
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogo(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const printReport = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 100);
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
        aciklama: ""
      });
      setLogo(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className={`bg-white shadow-md rounded-lg p-4 mb-4 flex justify-between items-center ${printMode ? 'hidden' : ''}`}>
        <div>
          <h1 className="text-xl font-bold text-gray-800">OSOS Rapor Sistemi</h1>
          <p className="text-xs text-gray-500">Organize Sanayi Ölçüm Sistemi</p>
        </div>
        <div className="flex gap-2">
          <button onClick={printReport} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <Printer size={18} /> Yazdır / PDF
          </button>
          <button onClick={resetForm} className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
            <RotateCcw size={18} /> Sıfırla
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className={`p-6 bg-white shadow-md rounded-lg max-w-7xl mx-auto mb-4 ${printMode ? 'hidden' : ''}`}>
        <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
          <FileText size={18} /> Genel Bilgiler
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Firma Adı</label>
            <input
              type="text"
              value={formData.firmaAdi}
              onChange={(e) => handleInputChange('firmaAdi', e.target.value)}
              className="w-full p-2 border rounded text-sm"
              placeholder="Firma adını girin"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Rapor No</label>
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
              placeholder="Tespit adresi"
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Logo Yükle</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Açıklama / Notlar</label>
            <textarea
              value={formData.aciklama}
              onChange={(e) => handleInputChange('aciklama', e.target.value)}
              className="w-full p-2 border rounded text-sm"
              rows="3"
              placeholder="Ek bilgiler ve notlar"
            />
          </div>
        </div>
      </div>

      {/* Print View */}
      <div className={`bg-white shadow-md rounded-lg p-8 max-w-7xl mx-auto ${printMode ? '' : 'hidden'}`}>
        {/* Logo ve Başlık */}
        <div className="flex justify-between items-start mb-6 border-b-2 border-gray-300 pb-4">
          {logo && (
            <div className="w-32 h-32 border rounded overflow-hidden">
              <img src={logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-gray-800">OSOS RAPORU</h1>
            <p className="text-sm text-gray-600">Organize Sanayi Ölçüm Sistemi</p>
          </div>
        </div>

        {/* Firma Bilgileri */}
        <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Firma Adı:</strong> {formData.firmaAdi || '-'}
          </div>
          <div>
            <strong>Rapor No:</strong> {formData.raporNo || '-'}
          </div>
          <div>
            <strong>Tarih:</strong> {formData.raporTarihi || '-'}
          </div>
          <div>
            <strong>Yetkili:</strong> {formData.yetkili || '-'}
          </div>
          <div className="col-span-2">
            <strong>Adres:</strong> {formData.adres || '-'}
          </div>
          <div>
            <strong>Telefon:</strong> {formData.telefon || '-'}
          </div>
        </div>

        {/* Rapor İçeriği */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 border-b border-gray-300 pb-1">Rapor Detayları</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {formData.aciklama || 'Rapor içeriği burada görüntülenecek.'}
          </p>
        </div>

        {/* İmza Alanı */}
        <div className="mt-12 flex justify-between">
          <div className="text-center">
            <div className="border-t border-gray-400 w-48 pt-2">
              <p className="text-sm font-semibold">Hazırlayan</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 w-48 pt-2">
              <p className="text-sm font-semibold">Onaylayan</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
