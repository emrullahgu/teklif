import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Calculator, 
  Users, 
  FileSpreadsheet, 
  Save, 
  ChevronLeft, 
  ChevronRight,
  PlusCircle,
  Trash2,
  Banknote,
  AlertCircle,
  X,
  UserPlus,
  LayoutGrid,
  List,
  ArrowRightCircle,
  Pencil,
  RefreshCw,
  Download,
  Upload,
  UploadCloud,
  FileDown,
  FileText
} from 'lucide-react';
import { supabase } from './supabaseClient';
import ActivityLogger from './activityLogger';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- SABİTLER ---
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// --- TİP TANIMLAMALARI ---

type DayType = 'Normal' | 'Pazar' | 'Resmi Tatil' | 'Raporlu' | 'İzinli';
type TabType = 'detail' | 'summary';

interface DailyLog {
  day: number;
  type: DayType;
  startTime: string;
  endTime: string;
  overtimeHours: number;
  description: string;
}

interface Expense {
  id: string;
  type: 'Avans' | 'Gider' | 'Prim';
  amount: number;
  description: string;
  date: string;
  installment_total?: number;  // Toplam taksit sayısı
  installment_current?: number; // Şu anki taksit numarası
}

interface Employee {
  id: string;
  name: string;
  tc_no?: string;
  agreedSalary: number;
  officialSalary: number;
}

interface MonthlyData {
  month: number;
  year: number;
  logs: Record<number, DailyLog>;
  expenses: Expense[];
}

const DEFAULT_START_TIME = "08:00";
const DEFAULT_END_TIME_WEEKDAY = "18:00";
const DEFAULT_END_TIME_SATURDAY = "13:00";

// --- YARDIMCI FONKSİYONLAR ---

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
};

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getDayName = (day: number, month: number, year: number) => {
  const date = new Date(year, month, day);
  return date.toLocaleDateString('tr-TR', { weekday: 'long' });
};

const isWeekend = (day: number, month: number, year: number) => {
  const date = new Date(year, month, day);
  const dayIndex = date.getDay();
  return { isSaturday: dayIndex === 6, isSunday: dayIndex === 0 };
};

// --- HESAPLAMA MOTORU (BASİTLEŞTİRİLMİŞ MANTIK) ---
const calculateEmployeeStats = (employee: Employee, data: MonthlyData | undefined, daysInMonth: number) => {
    let totalWorkDays = 0;
    let totalSundayDays = 0;
    let totalOvertimeHours = 0;
    let totalSundayPay = 0;
    let totalAdvances = 0;
    let totalExpenses = 0;
    let totalBonuses = 0;
    let totalAbsentDays = 0; // Gelmediği günler

    if (!data) {
        return {
            dailyRate: employee.agreedSalary / daysInMonth,
            hourlyRate: (employee.agreedSalary / daysInMonth) / 8,
            totalWorkDays: 0,
            totalSundayDays: 0,
            totalOvertimeHours: 0,
            overtimePay: 0,
            totalSundayPay: 0,
            totalAbsentDays: 0,
            absentDeduction: 0,
            totalAdvances: 0,
            totalExpenses: 0,
            totalBonuses: 0,
            totalExtras: 0,
            grossTotal: 0,
            netPayable: 0,
            officialPay: employee.officialSalary,
            remainingHandPay: 0
        };
    }

    // HESAPLAMA MANTIĞI
    // Günlük Ücret = Anlaşılan Net Maaş / 30 (sabit)
    // Mesai Saatlik Ücret = Anlaşılan Net Maaş / 30 / 8 (HER ZAMAN 30 güne göre, sabit)
    // Pazar/Tatil = Normal gün + 1 günlük ek fark (sabit 30 güne göre: 90,000/30 = 3,000 TL)
    // Gelmedi = Anlaşılan Maaş'tan KESİNTİ (90,000/30 = 3,000 TL/gün)
    // Fazla Mesai = Saatlik Ücret (30 güne göre) × 1.5
    // BÖYLECE: 
    //   - 30 gün tam çalışırsa = 90,000 TL
    //   - 2 gün gelmedi = 90,000 - 6,000 = 84,000 TL
    //   - Pazar çalışma: 90,000 + 3,000 TL (ek fark)
    //   - Mesai: 5 saat × 375 TL × 1.5 = 2,812.50 TL
    
    const dailyRate = employee.agreedSalary / daysInMonth; // Normal günler için (değişken)
    const dailyRateFixed = employee.agreedSalary / 30; // Pazar/Tatil farkı ve kesinti için sabit (90,000/30 = 3,000 TL)
    const hourlyRateForOvertime = (employee.agreedSalary / 30) / 8; // Mesai için sabit (90,000/30/8 = 375 TL)
    const hourlyRate = dailyRate / 8; // Gösterim için

    // PUANTAJ VERİLERİNİ TOPLA
    for (let i = 1; i <= daysInMonth; i++) {
        const log = data.logs[i];
        if (log) {
            if (log.type === 'Normal') {
                totalWorkDays += 1;
            } else if (log.type === 'Pazar' || log.type === 'Resmi Tatil') {
                // Pazar/Tatil = Normal gün sayılır + 1 günlük EK fark (sabit 30 güne göre)
                totalWorkDays += 1; // Normal gün olarak say
                totalSundayDays += 1;
                totalSundayPay += dailyRateFixed; // Ek fark: 90,000/30 = 3,000 TL
            } else if (log.type === 'İzinli' || log.type === 'Raporlu') {
                // İzinli ve Raporlu günler çalışılan güne sayılmaz, kesinti de yapılmaz
            }
            // Boş günler (gelmedi) için kesinti yapılacak

            if (log.overtimeHours > 0) {
                totalOvertimeHours += log.overtimeHours;
            }
        } else {
            // Eğer log yoksa, o gün boş demektir (Gelmedi)
            totalAbsentDays += 1;
        }
    }

    // GİDER/AVANS/PRİM TOPLA
    data.expenses.forEach(exp => {
        if (exp.type === 'Avans') {
            // Taksitli avans ise toplam tutarı taksit sayısına böl
            const installmentTotal = exp.installment_total || 1;
            const monthlyAmount = exp.amount / installmentTotal;
            totalAdvances += monthlyAmount;
        }
        else if (exp.type === 'Gider') totalExpenses += exp.amount;
        else if (exp.type === 'Prim') totalBonuses += exp.amount;
    });

    // TOPLAM HESAPLAMALAR
    const totalExtras = totalExpenses + totalBonuses;
    const overtimePay = totalOvertimeHours * hourlyRateForOvertime * 1.5; // Mesai: Sabit saatlik × 1.5
    const absentDeduction = totalAbsentDays * dailyRateFixed; // Gelmediği günler için kesinti: 2 gün × 3,000 = 6,000 TL
    const grossTotal = employee.agreedSalary + totalSundayPay + overtimePay + totalExtras - absentDeduction; // Anlaşılan Maaş - Gelmedi + Ekstralar
    const netPayable = grossTotal - totalAdvances;
    
    // ÖDENECEK ÖDENECEK = NET ELE GEÇEN (officialSalary sadece gösterim için)
    const remainingHandPay = netPayable;

    return {
        dailyRate: employee.agreedSalary / 30,  // Mesai hesabı için gösterim (sabit 30 güne göre)
        hourlyRate: hourlyRateForOvertime,  // Mesai saatlik ücreti (sabit, 375 TL)
        totalWorkDays,
        totalSundayDays,
        totalOvertimeHours,
        overtimePay,
        totalSundayPay,
        totalAbsentDays,
        absentDeduction,
        totalAdvances,
        totalExpenses,
        totalBonuses,
        totalExtras,
        grossTotal,
        netPayable,
        officialPay: employee.officialSalary,
        remainingHandPay
    };
};

// --- ANA BİLEŞEN ---

export default function BordroTakip() {
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1)); 
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logo, setLogo] = useState<string | null>(() => {
    // Logo'yu localStorage'dan yükle, yoksa default logo
    const DEFAULT_LOGO = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFFM0E4QSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjQ4IiBmb250LWZhbWlseT0iQXJpYWwiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC13ZWlnaHQ9ImJvbGQiPktCPC90ZXh0Pjwvc3ZnPg==';
    return localStorage.getItem('bordro_logo') || DEFAULT_LOGO;
  });
  
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeForm, setEmployeeForm] = useState({ name: '', tcNo: '', agreedSalary: '', officialSalary: '' });

  const [appData, setAppData] = useState<Record<string, Record<string, MonthlyData>>>({});
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Avans Modal
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ 
    amount: '', 
    date: new Date().toISOString().split('T')[0], 
    type: 'Avans' as 'Avans' | 'Gider' | 'Prim',
    installmentTotal: '1', // Toplam taksit sayısı
    installmentCurrent: '1' // Şu anki taksit numarası
  });
  
  // Geçmiş bordro görüntüleme
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyYear, setHistoryYear] = useState(currentDate.getFullYear());
  const [historyMonth, setHistoryMonth] = useState(currentDate.getMonth());
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const monthKey = `${currentYear}-${currentMonth}`;

  // --- SUPABASE CRUD FONKSİYONLARI ---

  // Personelleri Yükle
  const loadEmployees = async () => {
    try {
      setLoading(true);
      console.log('📋 Personeller yükleniyor...');
      
      const { data, error } = await supabase
        .from('bordro_employees')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('❌ Supabase hatası:', error);
        
        // Tablo yoksa kullanıcıya açık mesaj göster
        if (error.code === '42P01') {
          alert('⚠️ VERİTABANI HATASI\n\n"bordro_employees" tablosu bulunamadı!\n\n👉 Çözüm:\n1. Supabase Dashboard\'a gidin\n2. SQL Editor\'ı açın\n3. database-setup.sql dosyasındaki SQL\'leri çalıştırın\n\nDetaylı bilgi için BORDRO-SUPABASE-KURULUM.md dosyasına bakın.');
        } else if (error.code === 'PGRST116' || error.message?.includes('RLS')) {
          alert('⚠️ ERİŞİM HATASI\n\nRow Level Security (RLS) politikaları hatalı!\n\n👉 Çözüm:\n1. Supabase Dashboard → Database → Policies\n2. bordro_employees tablosu için politikaları kontrol edin\n3. Geçici olarak RLS\'i devre dışı bırakabilirsiniz:\n\nALTER TABLE bordro_employees DISABLE ROW LEVEL SECURITY;');
        } else {
          alert('❌ Personel listesi yüklenemedi!\n\nHata: ' + error.message + '\n\nSupabase bağlantınızı kontrol edin.');
        }
        throw error;
      }

      console.log('✅ Personeller yüklendi:', data?.length || 0, 'kişi');

      const formattedEmployees = data.map(emp => ({
        id: emp.id,
        name: emp.name,
        tc_no: emp.tc_no,
        agreedSalary: parseFloat(emp.agreed_salary),
        officialSalary: parseFloat(emp.official_salary)
      }));

      setEmployees(formattedEmployees);
      
      if (formattedEmployees.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(formattedEmployees[0].id);
      }
    } catch (error) {
      console.error('❌ Personel yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Aylık Verileri Yükle
  const loadMonthlyData = async (employeeId: string) => {
    try {
      console.log('📥 Aylık veri yükleniyor:', employeeId, monthKey);
      
      // Puantaj Kayıtları
      const { data: logsData, error: logsError } = await supabase
        .from('bordro_daily_logs')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('month', currentMonth)
        .eq('year', currentYear);

      if (logsError) {
        console.error('❌ Puantaj yükleme hatası:', logsError);
        // Hata olsa bile devam et, boş veri ile
      }

      // Giderler
      const { data: expensesData, error: expensesError } = await supabase
        .from('bordro_expenses')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('month', currentMonth)
        .eq('year', currentYear);

      if (expensesError) {
        console.error('❌ Gider yükleme hatası:', expensesError);
        // Hata olsa bile devam et, boş veri ile
      }

      // State'e Dönüştür
      const logs: Record<number, DailyLog> = {};
      (logsData || []).forEach(log => {
        logs[log.day] = {
          day: log.day,
          type: log.type,
          startTime: log.start_time || '',
          endTime: log.end_time || '',
          overtimeHours: parseFloat(log.overtime_hours) || 0,
          description: log.description || ''
        };
      });

      const expenses: Expense[] = (expensesData || []).map(exp => ({
        id: exp.id,
        type: exp.type,
        amount: parseFloat(exp.amount),
        description: exp.description || '',
        date: exp.date,
        installment_total: exp.installment_total || 1,
        installment_current: exp.installment_current || 1
      }));

      console.log('✅ Veri yüklendi:', Object.keys(logs).length, 'gün,', expenses.length, 'gider');

      setAppData(prev => ({
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          [monthKey]: { month: currentMonth, year: currentYear, logs, expenses }
        }
      }));

    } catch (error) {
      console.error('❌ Aylık veri yükleme hatası:', error);
    }
  };

  // Personel Kaydet/Güncelle
  const saveEmployee = async () => {
    if (!employeeForm.name || !employeeForm.agreedSalary || !employeeForm.officialSalary) {
      alert("⚠️ Lütfen tüm zorunlu alanları doldurunuz:\n• Personel Adı\n• Ödenecek Maaş\n• Göstermelik Maaş");
      return;
    }

    try {
      setLoading(true);
      console.log('💾 Personel kaydediliyor...', employeeForm);
      
      const employeeData = {
        name: employeeForm.name,
        tc_no: employeeForm.tcNo || null,
        agreed_salary: parseFloat(employeeForm.agreedSalary),
        official_salary: parseFloat(employeeForm.officialSalary),
        updated_at: new Date().toISOString()
      };

      if (editingEmployeeId) {
        // GÜNCELLEME
        console.log('🔄 Güncelleniyor:', editingEmployeeId);
        const { error } = await supabase
          .from('bordro_employees')
          .update(employeeData)
          .eq('id', editingEmployeeId);

        if (error) {
          console.error('❌ Güncelleme hatası:', error);
          throw error;
        }
        console.log('✅ Personel güncellendi');
        await ActivityLogger.bordroEmployeeUpdate(employeeForm.name);
      } else {
        // YENİ EKLEME
        console.log('➕ Yeni personel ekleniyor...');
        const { data, error } = await supabase
          .from('bordro_employees')
          .insert([{ ...employeeData, active: true }])
          .select();

        if (error) {
          console.error('❌ Ekleme hatası:', error);
          
          if (error.code === '42P01') {
            alert('⚠️ VERİTABANI HATASI\n\nbordro_employees tablosu bulunamadı!\n\nÇözüm: BORDRO-SUPABASE-KURULUM.md dosyasını okuyun.');
          } else if (error.code === 'PGRST204' && error.message?.includes('tc_no')) {
            alert('⚠️ KOLON EKSİK HATASI\n\ntc_no kolonu bordro_employees tablosunda bulunamadı!\n\nÇözüm (Supabase SQL Editor):\nALTER TABLE bordro_employees ADD COLUMN IF NOT EXISTS tc_no TEXT;\n\nDetaylı bilgi: BORDRO-SUPABASE-KURULUM.md');
          } else {
            alert('❌ Personel eklenemedi!\n\nHata: ' + error.message);
          }
          throw error;
        }
        
        console.log('✅ Personel eklendi:', data);
        if (data && data[0]) {
          setSelectedEmployeeId(data[0].id);
        }
        await ActivityLogger.bordroEmployeeCreate(employeeForm.name);
      }

      await loadEmployees();
      setShowEmployeeModal(false);
      setEmployeeForm({ name: '', tcNo: '', agreedSalary: '', officialSalary: '' });
      setEditingEmployeeId(null);
      
      alert('✅ Personel başarıyla kaydedildi!');
      
    } catch (error) {
      console.error('❌ Personel kayıt hatası:', error);
      // Hata mesajı zaten yukarıda gösterildi
    } finally {
      setLoading(false);
    }
  };

  // Personel Sil
  const deleteEmployee = async (empId: string, empName: string) => {
    if (!confirm(`${empName} isimli personeli silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve tüm puantaj kayıtları da silinecektir.`)) {
      return;
    }

    try {
      setLoading(true);
      
      // Personeli pasif yap (soft delete)
      const { error } = await supabase
        .from('bordro_employees')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', empId);

      if (error) throw error;
      
      await ActivityLogger.bordroEmployeeDelete(empName);
      await loadEmployees();
      
      // Silinen personel seçiliyse, seçimi temizle
      if (selectedEmployeeId === empId) {
        setSelectedEmployeeId(employees.length > 1 ? employees[0].id : '');
      }
      
      alert(`✅ ${empName} başarıyla silindi.`);
      
    } catch (error) {
      console.error('Personel silme hatası:', error);
      alert('Personel silinirken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  // Puantaj Kaydı Kaydet
  const saveDailyLog = async (day: number, log: DailyLog) => {
    try {
      // Geçersiz/boş kayıtları kaydetme
      if (!log.type) {
        console.log('⏭️ Boş kayıt atlandı:', day);
        return;
      }

      setSaveStatus('saving');
      
      const logData = {
        employee_id: selectedEmployeeId,
        day,
        month: currentMonth,
        year: currentYear,
        type: log.type,
        start_time: log.startTime,
        end_time: log.endTime,
        overtime_hours: log.overtimeHours,
        description: log.description
      };

      console.log('📝 Puantaj kaydediliyor:', logData);

      const { data, error } = await supabase
        .from('bordro_daily_logs')
        .upsert(logData, { 
          onConflict: 'employee_id,day,month,year'
        })
        .select();

      if (error) {
        console.error('❌ Supabase hatası:', error);
        throw error;
      }
      
      console.log('✅ Puantaj kaydedildi:', data);
      
      // Kayıt başarılı, pending listesinden kaldır
      setPendingSaves(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${selectedEmployeeId}-${day}`);
        return newSet;
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      
    } catch (error) {
      console.error('❌ Puantaj kayıt hatası:', error);
      alert('⚠️ Puantaj kaydedilemedi! Veritabanı bağlantısını kontrol edin.\n\nHata: ' + (error as any)?.message);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  // Gider Kaydet
  const saveExpense = async (expense: Expense) => {
    try {
      const expenseData = {
        id: expense.id,
        employee_id: selectedEmployeeId,
        month: currentMonth,
        year: currentYear,
        type: expense.type,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        installment_total: expense.installment_total || 1,
        installment_current: expense.installment_current || 1
      };

      const { error } = await supabase
        .from('bordro_expenses')
        .upsert(expenseData);

      if (error) throw error;
      
    } catch (error) {
      console.error('Gider kayıt hatası:', error);
      alert('Gider kaydedilirken bir hata oluştu!');
    }
  };

  // Gider Sil
  const deleteExpenseFromDB = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bordro_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
    } catch (error) {
      console.error('Gider silme hatası:', error);
      alert('Gider silinirken bir hata oluştu!');
    }
  };

  // Puantaj Sil (Boş bırakılan günler için)
  const deleteDailyLog = async (day: number) => {
    try {
      const { error } = await supabase
        .from('bordro_daily_logs')
        .delete()
        .eq('employee_id', selectedEmployeeId)
        .eq('day', day)
        .eq('month', currentMonth)
        .eq('year', currentYear);

      if (error) throw error;
      console.log('✅ Puantaj silindi:', day);
      
    } catch (error) {
      console.error('Puantaj silme hatası:', error);
    }
  };

  // --- AYLIK BORDRO KAYDET ---
  const saveMonthlyPayroll = async () => {
    // Bekleyen kayıtları kontrol et
    if (pendingSaves.size > 0) {
      alert('⚠️ Lütfen bekleyin! Kaydedilmemiş değişiklikler var. Tüm değişiklikler kaydedildikten sonra tekrar deneyin.');
      return;
    }

    if (!confirm(`${currentYear} yılı ${MONTHS[currentMonth]} ayı bordrosunu kaydetmek istediğinize emin misiniz?\n\n✅ Tüm puantaj verileri, mesai saatleri ve notlar veritabanında güvenle saklanmıştır.\n✅ Bu işlem sadece aylık özet raporu oluşturur.\n✅ Verileriniz kaybolmaz, istediğiniz zaman tekrar görüntüleyebilirsiniz.`)) {
      return;
    }

    try {
      setLoading(true);
      
      // Önce tüm güncel verilerin kaydedildiğinden emin ol
      console.log('📝 Ay kapatılıyor, son kontrol yapılıyor...');
      
      // Her personel için tüm günlük logları ve giderleri tekrar kaydet (güvenlik için)
      for (const emp of employees) {
        const empData = appData[emp.id]?.[monthKey];
        if (empData) {
          // Logs'u kaydet
          for (const [dayStr, log] of Object.entries(empData.logs)) {
            if (log.type) { // Sadece dolu kayıtları kaydet
              await saveDailyLog(parseInt(dayStr), log);
            }
          }
          
          // Expenses'i kontrol et (zaten kaydedilmiş olmalı)
          console.log(`✅ ${emp.name}: ${Object.keys(empData.logs).length} gün, ${empData.expenses.length} gider kaydedildi`);
        }
      }
      
      // Şimdi özet raporu oluştur
      for (const emp of employees) {
        const empData = appData[emp.id]?.[monthKey];
        const stats = calculateEmployeeStats(emp, empData, daysInMonth);

        const payrollData = {
          employee_id: emp.id,
          month: currentMonth,
          year: currentYear,
          employee_name: emp.name,
          agreed_salary: emp.agreedSalary,
          official_salary: emp.officialSalary,
          days_worked: stats.totalWorkDays,
          sunday_days: stats.totalSundayDays,
          overtime_hours: stats.totalOvertimeHours,
          advances: stats.totalAdvances,
          expenses: stats.totalExpenses,
          bonuses: stats.totalBonuses,
          net_payable: stats.netPayable,
          hand_pay: stats.remainingHandPay
        };

        const { error } = await supabase
          .from('monthly_payroll_summary')
          .upsert(payrollData, { onConflict: 'employee_id,month,year' });

        if (error) throw error;
      }

      await ActivityLogger.bordroMonthlySave(currentMonth + 1, currentYear, employees.length);
      alert(`✅ ${MONTHS[currentMonth]} ${currentYear} bordrosu başarıyla kapatıldı!\n\n📊 Özet rapor oluşturuldu\n💾 Tüm detaylı veriler güvenle saklandı\n📂 Geçmiş Bordrolar'dan görüntüleyebilirsiniz\n\n⚠️ Not: Bu ay için girdiğiniz tüm puantaj, mesai ve not bilgileri veritabanında saklanmıştır. İstediğiniz zaman bu aya geri dönüp verileri görüntüleyebilirsiniz.`);
    } catch (error) {
      console.error('Bordro kaydetme hatası:', error);
      alert('❌ Bordro kaydedilirken bir hata oluştu!\n\nHata: ' + (error as any)?.message);
    } finally {
      setLoading(false);
    }
  };

  // --- GEÇMİŞ BORDROLARI YÜKLE ---
  const loadHistoricalPayroll = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('monthly_payroll_summary')
        .select('*')
        .eq('month', historyMonth)
        .eq('year', historyYear)
        .order('employee_name');

      if (error) throw error;
      
      setHistoricalData(data || []);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Geçmiş bordro yükleme hatası:', error);
      alert('❌ Geçmiş bordro yüklenirken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  // --- İLK YÜKLEME ---
  useEffect(() => {
    loadEmployees();
  }, []);

  // Personel listesi yüklendiğinde, tüm personeller için aylık verileri yükle
  useEffect(() => {
    if (employees.length > 0) {
      console.log('👥 Tüm personeller için veri yükleniyor...');
      employees.forEach(emp => {
        loadMonthlyData(emp.id);
      });
    }
  }, [employees.length, monthKey]);

  // Personel veya Ay Değiştiğinde Verileri Yükle
  useEffect(() => {
    if (selectedEmployeeId) {
      loadMonthlyData(selectedEmployeeId);
    }
  }, [selectedEmployeeId, monthKey]);

  // Veri İlklendirme
  useEffect(() => {
    if (employees.length > 0 && !employees.find(e => e.id === selectedEmployeeId)) {
        setSelectedEmployeeId(employees[0].id);
    }
    
    if (selectedEmployeeId && (!appData[selectedEmployeeId] || !appData[selectedEmployeeId][monthKey])) {
      setAppData(prev => ({
        ...prev,
        [selectedEmployeeId]: {
          ...prev[selectedEmployeeId],
          [monthKey]: { month: currentMonth, year: currentYear, logs: {}, expenses: [] }
        }
      }));
      
      // Otomatik olarak tüm günleri Normal/08:00-18:00 ile doldur
      setTimeout(() => {
        fillMonthDefaults();
      }, 300);
    }
  }, [selectedEmployeeId, monthKey, employees]);

  const currentData = appData[selectedEmployeeId]?.[monthKey] || { month: currentMonth, year: currentYear, logs: {}, expenses: [] };
  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId) || { id: '0', name: '', agreedSalary: 0, officialSalary: 0 };

  const currentStats = useMemo(() => 
    calculateEmployeeStats(selectedEmployee, currentData, daysInMonth), 
  [selectedEmployee, currentData, daysInMonth]);

  // --- HANDLERS ---

  const handleLogChange = (day: number, field: keyof DailyLog, value: any) => {
    console.log(`📝 Değişiklik: Gün ${day}, Alan: ${field}, Değer:`, value);
    
    setAppData(prev => {
      const newData = { ...prev };
      if(!newData[selectedEmployeeId]) newData[selectedEmployeeId] = {};
      if(!newData[selectedEmployeeId][monthKey]) {
        newData[selectedEmployeeId][monthKey] = { month: currentMonth, year: currentYear, logs: {}, expenses: [] };
      }

      // Mevcut logs'u al veya yeni oluştur
      const currentLogs = { ...newData[selectedEmployeeId][monthKey].logs };
      
      if (!currentLogs[day]) {
        const { isSaturday, isSunday } = isWeekend(day, currentMonth, currentYear);
        currentLogs[day] = {
          day,
          type: isSunday ? 'Pazar' : 'Normal',
          startTime: DEFAULT_START_TIME,
          endTime: isSaturday ? DEFAULT_END_TIME_SATURDAY : DEFAULT_END_TIME_WEEKDAY,
          overtimeHours: 0,
          description: ''
        };
      } else {
        // Mevcut log'u clone et
        currentLogs[day] = { ...currentLogs[day] };
      }

      // Alan güncelle
      (currentLogs[day] as any)[field] = value;

      // Otomatik Mesai Hesaplama
      if (field === 'endTime' || field === 'startTime' || field === 'type') {
        const log = currentLogs[day];
        const { isSaturday, isSunday } = isWeekend(day, currentMonth, currentYear);
        
        const endHour = parseInt(log.endTime.split(':')[0]);
        let autoOvertime = 0;

        if (log.type === 'Normal') {
            if (isSaturday && endHour > 13) autoOvertime = endHour - 13;
            else if (!isSaturday && !isSunday && endHour > 18) autoOvertime = endHour - 18;
        }
        currentLogs[day].overtimeHours = autoOvertime > 0 ? autoOvertime : 0;
      }

      console.log('📊 Güncellenmiş log:', currentLogs[day]);
      
      // Eğer type boş/null yapıldıysa, günü tamamen sil
      if (field === 'type' && (!value || value === '')) {
        delete currentLogs[day];
        
        // IMMUTABILITY: Yeni nested object oluştur (silme ile)
        newData[selectedEmployeeId] = {
          ...newData[selectedEmployeeId],
          [monthKey]: {
            ...newData[selectedEmployeeId][monthKey],
            logs: currentLogs
          }
        };
        
        // Database'den de sil
        setTimeout(() => deleteDailyLog(day), 100);
      } else {
        // IMMUTABILITY: Yeni nested object oluştur
        newData[selectedEmployeeId] = {
          ...newData[selectedEmployeeId],
          [monthKey]: {
            ...newData[selectedEmployeeId][monthKey],
            logs: currentLogs
          }
        };
        
        // Pending kayıt listesine ekle
        setPendingSaves(prev => new Set(prev).add(`${selectedEmployeeId}-${day}`));
        
        // Debounced kaydet (önceki timeout'u iptal et)
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = setTimeout(() => {
          saveDailyLog(day, currentLogs[day]);
        }, 2000); // 2 saniye bekle
      }

      return newData;
    });
  };

  const addExpense = (type: 'Avans' | 'Gider' | 'Prim') => {
    setAdvanceForm({ 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      type,
      installmentTotal: '1',
      installmentCurrent: '1'
    });
    setShowAdvanceModal(true);
  };

  const handleAdvanceSubmit = async () => {
    if (!advanceForm.amount || isNaN(parseFloat(advanceForm.amount))) {
      alert('⚠️ Lütfen geçerli bir tutar giriniz!');
      return;
    }

    const amount = parseFloat(advanceForm.amount);
    const installmentTotal = parseInt(advanceForm.installmentTotal) || 1;
    const installmentCurrent = parseInt(advanceForm.installmentCurrent) || 1;

    if (installmentCurrent > installmentTotal || installmentCurrent < 1) {
      alert('⚠️ Geçersiz taksit numarası! Şu anki taksit, toplam taksit sayısından büyük olamaz.');
      return;
    }
    
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      type: advanceForm.type,
      amount,
      description: `Manuel ${advanceForm.type} (${advanceForm.date})`,
      date: advanceForm.date,
      installment_total: installmentTotal,
      installment_current: installmentCurrent
    };

    // State güncellemesi - IMMUTABILITY KORUNARAK
    setAppData(prev => {
       const newData = {...prev};
       
       // Eğer personel verisi yoksa oluştur
       if(!newData[selectedEmployeeId]) {
         newData[selectedEmployeeId] = {};
       }
       
       // Eğer ay verisi yoksa oluştur
       if(!newData[selectedEmployeeId][monthKey]) {
         newData[selectedEmployeeId][monthKey] = { month: currentMonth, year: currentYear, logs: {}, expenses: [] };
       }
       
       // IMMUTABILITY: Yeni nested object ve array oluştur
       newData[selectedEmployeeId] = {
         ...newData[selectedEmployeeId],
         [monthKey]: {
           ...newData[selectedEmployeeId][monthKey],
           expenses: [...newData[selectedEmployeeId][monthKey].expenses, newExpense]
         }
       };
       
       return newData;
    });

    // Veritabanına Kaydet
    await saveExpense(newExpense);
    
    // Modal'ı kapat ve formu sıfırla
    setShowAdvanceModal(false);
    setAdvanceForm({ 
      amount: '', 
      date: new Date().toISOString().split('T')[0], 
      type: 'Avans',
      installmentTotal: '1',
      installmentCurrent: '1'
    });
    
    const installmentText = installmentTotal > 1 ? ` (${installmentCurrent}/${installmentTotal} taksit)` : '';
    alert(`✅ ${advanceForm.type} başarıyla eklendi!${installmentText}`);
  };

  const deleteExpense = async (id: string) => {
    if (window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
      // State güncellemesi - IMMUTABILITY KORUNARAK
      setAppData(prev => {
          const newData = {...prev};
          
          // IMMUTABILITY: Yeni nested object ve filtered array oluştur
          newData[selectedEmployeeId] = {
            ...newData[selectedEmployeeId],
            [monthKey]: {
              ...newData[selectedEmployeeId][monthKey],
              expenses: newData[selectedEmployeeId][monthKey].expenses.filter(e => e.id !== id)
            }
          };
          
          return newData;
      });

      await deleteExpenseFromDB(id);
    }
  };

  const fillMonthDefaults = () => {
    // Otomatik olarak TÜM günleri Normal/08:00-18:00 ile doldur
    for (let i = 1; i <= daysInMonth; i++) {
      if (!currentData.logs[i] || !currentData.logs[i].type) {
        handleLogChange(i, 'type', 'Normal');
        handleLogChange(i, 'startTime', '08:00');
        handleLogChange(i, 'endTime', '18:00');
      }
    }
  };

  const openAddModal = () => {
    setEmployeeForm({ name: '', tcNo: '', agreedSalary: '', officialSalary: '' });
    setEditingEmployeeId(null);
    setShowEmployeeModal(true);
  };

  const openEditModal = (emp: Employee) => {
    setEmployeeForm({ 
        name: emp.name,
        tcNo: emp.tc_no || '',
        agreedSalary: emp.agreedSalary.toString(), 
        officialSalary: emp.officialSalary.toString() 
    });
    setEditingEmployeeId(emp.id);
    setShowEmployeeModal(true);
  };

  const goToDetail = (empId: string) => {
      setSelectedEmployeeId(empId);
      setActiveTab('detail');
  };

  // --- EXCEL & PDF EXPORT FONKSİYONLARI ---

  // Excel Export - Tüm Personel
  const exportToExcel = async () => {
    try {
      const exportData = employees.map(emp => {
        const empData = appData[emp.id]?.[monthKey];
        const stats = calculateEmployeeStats(emp, empData, daysInMonth);
        
        return {
          'Personel': emp.name,
          'TC No': emp.tc_no || '',
          'Anlaşılan Maaş': emp.agreedSalary,
          'Resmi Maaş': emp.officialSalary,
          'Günlük Mesai Ücret (30 güne göre)': stats.dailyRate.toFixed(2),
          'Saatlik Mesai Ücret (x1.5)': (stats.hourlyRate * 1.5).toFixed(2),
          'Çalışılan Gün': stats.totalWorkDays,
          'Mesai Saati': stats.totalOvertimeHours,
          'Mesai Ücreti': stats.overtimePay.toFixed(2),
          'Pazar Farkı': stats.totalSundayPay.toFixed(2),
          'Ekstra Ödemeler': stats.totalExtras.toFixed(2),
          'Brüt Hakediş': stats.grossTotal.toFixed(2),
          'Avanslar': stats.totalAdvances.toFixed(2),
          'Net Hakediş': stats.netPayable.toFixed(2),
          'Resmi Maaş (Ödenecek)': stats.officialPay.toFixed(2),
          'Ek Ödeme': (stats.netPayable - stats.officialPay).toFixed(2),
          'TOPLAM ÖDENECEK': stats.netPayable.toFixed(2)
        };
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${currentYear}-${currentMonth + 1}`);
      
      // Kolon genişlikleri
      ws['!cols'] = [
        { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, 
        { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
      ];

      XLSX.writeFile(wb, `Bordro_${currentYear}_${currentMonth + 1}.xlsx`);
      await ActivityLogger.bordroExportExcel(currentMonth + 1, currentYear);
      alert('✅ Excel dosyası başarıyla indirildi!');
    } catch (error) {
      console.error('Excel export hatası:', error);
      alert('❌ Excel oluşturulurken hata oluştu!');
    }
  };

  // PDF Export - Tek Personel Bordrosu
  const exportSinglePDF = async (employee: Employee) => {
    try {
      const empData = appData[employee.id]?.[monthKey];
      const stats = calculateEmployeeStats(employee, empData, daysInMonth);
      
      const doc = new jsPDF();
      
      // Logo (eğer varsa)
      let startY = 20;
      if (logo) {
        try {
          // Otomatik format tespiti
          const format = logo.startsWith('data:image/png') ? 'PNG' : 
                        logo.startsWith('data:image/jpeg') || logo.startsWith('data:image/jpg') ? 'JPEG' :
                        logo.startsWith('data:image/svg') ? 'PNG' : 'PNG';
          
          // Logo boyutunu optimize et - aspect ratio korunsun
          const logoWidth = 40;
          const logoHeight = 40;
          doc.addImage(logo, format, 15, 10, logoWidth, logoHeight, undefined, 'FAST');
          startY = 55;
          console.log('✅ Logo PDF\'e eklendi!');
        } catch (e) {
          console.error('Logo eklenemedi:', e);
        }
      }
      
      // Header - Türkçe karakter desteği için Unicode kullan
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(30, 58, 138);
      const title = 'KOBINERJI MUHENDISLIK';
      doc.text(title, 105, startY, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text('PERSONEL BORDROSU', 105, startY + 8, { align: 'center' });
      
      // Çizgi
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.5);
      doc.line(20, startY + 12, 190, startY + 12);
      
      // Personel Bilgileri
      doc.setFontSize(10);
      doc.setTextColor(0);
      const employeeName = employee.name.replace(/İ/g, 'I').replace(/ı/g, 'i').replace(/Ş/g, 'S').replace(/ş/g, 's')
        .replace(/Ğ/g, 'G').replace(/ğ/g, 'g').replace(/Ü/g, 'U').replace(/ü/g, 'u')
        .replace(/Ö/g, 'O').replace(/ö/g, 'o').replace(/Ç/g, 'C').replace(/ç/g, 'c');
      doc.text(`Personel: ${employeeName}`, 20, startY + 22);
      
      const monthNames = ['Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran', 'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'];
      doc.text(`Donem: ${monthNames[currentMonth]} ${currentYear}`, 20, startY + 28);
      
      // Avans detayları için body oluştur
      const bordroBody: any[] = [
        ['Anlasilan Net Maas', `${stats.dailyRate.toFixed(2)} TL x ${stats.totalWorkDays} gun = ${(stats.dailyRate * stats.totalWorkDays).toFixed(2)} TL`],
        ['Mesai Ucreti (x1.5)', `${stats.hourlyRate.toFixed(2)} TL x ${stats.totalOvertimeHours} saat x 1.5 = ${stats.overtimePay.toFixed(2)} TL`],
        ['Pazar/Tatil Farki', stats.totalSundayDays > 0 ? `${stats.totalSundayDays} gun x ${(stats.dailyRate * 2).toFixed(2)} TL = ${stats.totalSundayPay.toFixed(2)} TL` : `${stats.totalSundayPay.toFixed(2)} TL`],
        ['Ekstra Odemeler (Prim/Gider)', `${stats.totalExtras.toFixed(2)} TL`],
        ['', ''],
        ['BRUT HAKEDIS', `${stats.grossTotal.toFixed(2)} TL`],
        ['Kesinti (Avanslar)', `- ${stats.totalAdvances.toFixed(2)} TL`]
      ];
      
      // Avans detaylarını ekle
      if (empData && empData.expenses) {
        const avanslar = empData.expenses.filter((e: Expense) => e.type === 'Avans');
        avanslar.forEach((avans: Expense) => {
          const dateStr = new Date(avans.date).toLocaleDateString('tr-TR').replace(/İ/g, 'I').replace(/ı/g, 'i');
          const installmentInfo = (avans.installment_total || 1) > 1 
            ? ` (${avans.installment_current}/${avans.installment_total} taksit)` 
            : '';
          bordroBody.push([`  - Avans ${dateStr}${installmentInfo}`, `- ${avans.amount.toFixed(2)} TL`]);
        });
      }
      
      bordroBody.push(
        ['', ''],
        ['NET HAKEDIS', `${stats.netPayable.toFixed(2)} TL`],
        ['', ''],
        ['Resmi Maas', `${stats.officialPay.toFixed(2)} TL`],
        ['Ek Odeme', `${(stats.netPayable - stats.officialPay).toFixed(2)} TL`],
        ['', ''],
        ['TOPLAM ODENECEK', `${stats.netPayable.toFixed(2)} TL`]
      );
      
      // Bordro Tablosu
      (doc as any).autoTable({
        startY: startY + 35,
        head: [['ACIKLAMA', 'TUTAR']],
        body: bordroBody,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3, font: 'helvetica' },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100 },
          1: { halign: 'right', cellWidth: 70 }
        },
        didParseCell: function(data: any) {
          // Avans detay satırlarını daha küçük fontla göster
          if (data.cell.text[0] && data.cell.text[0].startsWith('  - Avans')) {
            data.cell.styles.fontSize = 8;
            data.cell.styles.textColor = [220, 38, 38];
          }
          // Ana başlıkları vurgula (BRUT HAKEDIS, NET HAKEDIS, TOPLAM ODENECEK)
          if (data.cell.text[0] && (
            data.cell.text[0].includes('BRUT HAKEDIS') || 
            data.cell.text[0].includes('NET HAKEDIS') || 
            data.cell.text[0].includes('TOPLAM ODENECEK')
          )) {
            data.cell.styles.fillColor = [239, 246, 255];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 10;
          }
        }
      });

      // Puantaj Detayları
      if (empData && Object.keys(empData.logs).length > 0) {
        let finalY = (doc as any).lastAutoTable.finalY + 10;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 58, 138);
        doc.text('PUANTAJ DETAYLARI', 20, finalY);
        
        const dayNames = ['Pazar', 'Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi'];
        const puantajData = Object.values(empData.logs).map((log: any) => {
          const date = new Date(currentYear, currentMonth, log.day);
          const dayName = dayNames[date.getDay()];
          const typeClean = log.type.replace(/ş/g, 's').replace(/İ/g, 'I').replace(/ı/g, 'i');
          const descClean = (log.description || '').replace(/İ/g, 'I').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g');
          
          return [
            log.day,
            dayName,
            typeClean,
            log.startTime || '-',
            log.endTime || '-',
            log.overtimeHours || 0,
            descClean
          ];
        });

        (doc as any).autoTable({
          startY: finalY + 5,
          head: [['Gun', 'Gun Adi', 'Durum', 'Giris', 'Cikis', 'Mesai', 'Aciklama']],
          body: puantajData,
          theme: 'striped',
          headStyles: { fillColor: [30, 58, 138], fontSize: 8, fontStyle: 'bold' },
          styles: { fontSize: 7, cellPadding: 2, font: 'helvetica' },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 25 },
            2: { cellWidth: 30 },
            3: { cellWidth: 20, halign: 'center' },
            4: { cellWidth: 20, halign: 'center' },
            5: { cellWidth: 20, halign: 'center' },
            6: { cellWidth: 40 }
          }
        });
        
        finalY = (doc as any).lastAutoTable.finalY + 10;
      } else {
        let finalY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Gelmediği Günler (Absent Days)
      if (empData) {
        const absentDays = [];
        for (let i = 1; i <= daysInMonth; i++) {
          if (!empData.logs[i]) {
            const date = new Date(currentYear, currentMonth, i);
            const dayNames = ['Pazar', 'Pazartesi', 'Sali', 'Carsamba', 'Persembe', 'Cuma', 'Cumartesi'];
            absentDays.push([i, dayNames[date.getDay()], `${i}/${currentMonth + 1}/${currentYear}`]);
          }
        }
        
        if (absentDays.length > 0) {
          const currentY = (doc as any).lastAutoTable.finalY + 10;
          
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(220, 38, 38);
          doc.text('GELMEDI/BOS GUNLER (Kesinti Yapildi)', 20, currentY);
          
          (doc as any).autoTable({
            startY: currentY + 5,
            head: [['Gun', 'Gun Adi', 'Tarih']],
            body: absentDays,
            theme: 'grid',
            headStyles: { fillColor: [220, 38, 38], fontSize: 8, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
            columnStyles: {
              0: { cellWidth: 30, halign: 'center' },
              1: { cellWidth: 50 },
              2: { cellWidth: 60, halign: 'center' }
            }
          });
        }
      }

      // Avans/Gider/Prim Detayları
      if (empData && empData.expenses.length > 0) {
        const currentY = (doc as any).lastAutoTable.finalY + 10;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(30, 58, 138);
        doc.text('AVANS/GIDER/PRIM DETAYLARI', 20, currentY);
        
        const expenseData = empData.expenses.map((exp: Expense) => {
          const typeClean = exp.type.replace(/İ/g, 'I').replace(/ı/g, 'i');
          const installmentInfo = exp.type === 'Avans' && (exp.installment_total || 1) > 1 
            ? ` (${exp.installment_current}/${exp.installment_total} taksit)` 
            : '';
          const descClean = (exp.description || '').replace(/İ/g, 'I').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
          const dateFormatted = new Date(exp.date).toLocaleDateString('tr-TR');
          
          return [
            dateFormatted,
            typeClean + installmentInfo,
            `${exp.amount.toFixed(2)} TL`,
            descClean
          ];
        });

        (doc as any).autoTable({
          startY: currentY + 5,
          head: [['Tarih', 'Tip', 'Tutar', 'Aciklama']],
          body: expenseData,
          theme: 'striped',
          headStyles: { fillColor: [30, 58, 138], fontSize: 8, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
          columnStyles: {
            0: { cellWidth: 30, halign: 'center' },
            1: { cellWidth: 30, halign: 'center' },
            2: { cellWidth: 30, halign: 'right' },
            3: { cellWidth: 80 }
          },
          didParseCell: function(data: any) {
            if (data.column.index === 1) {
              const cellText = data.cell.text[0];
              if (cellText === 'Avans') {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
              } else if (cellText === 'Gider') {
                data.cell.styles.textColor = [249, 115, 22];
                data.cell.styles.fontStyle = 'bold';
              } else if (cellText === 'Prim') {
                data.cell.styles.textColor = [34, 197, 94];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        });
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('KOBINERJI MUHENDISLIK', 105, 285, { align: 'center' });
        doc.text('Kemalpasa O.S.B. Gazi Bulv. Ceran Plaza No:177/19 Kemalpasa/Izmir', 105, 290, { align: 'center' });
        doc.text(`Sayfa ${i} / ${pageCount}`, 190, 290, { align: 'right' });
      }

      const cleanName = employee.name.replace(/İ/g, 'I').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
      doc.save(`Bordro_${cleanName}_${currentYear}_${currentMonth + 1}.pdf`);
      await ActivityLogger.bordroExportPDF(employee.name);
      alert('✅ PDF başarıyla indirildi!');
    } catch (error) {
      console.error('PDF export hatası:', error);
      alert('❌ PDF oluşturulurken hata oluştu!');
    }
  };

  // PDF Export - Toplu Bordro (Tüm Personel)
  const exportAllPDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Logo
      let startY = 20;
      if (logo) {
        try {
          const format = logo.startsWith('data:image/png') ? 'PNG' : 
                        logo.startsWith('data:image/jpeg') || logo.startsWith('data:image/jpg') ? 'JPEG' :
                        logo.startsWith('data:image/svg') ? 'PNG' : 'PNG';
          
          // Logo boyutunu optimize et - aspect ratio korunsun
          const logoWidth = 40;
          const logoHeight = 40;
          doc.addImage(logo, format, 15, 10, logoWidth, logoHeight, undefined, 'FAST');
          startY = 55;
          console.log('✅ Logo toplu PDF\'e eklendi!');
        } catch (e) {
          console.error('Logo eklenemedi:', e);
        }
      }
      
      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(30, 58, 138);
      doc.text('KOBINERJI MUHENDISLIK', 105, startY, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text('TOPLU BORDRO ICMALI', 105, startY + 8, { align: 'center' });
      
      const monthNames = ['OCAK', 'SUBAT', 'MART', 'NISAN', 'MAYIS', 'HAZIRAN', 'TEMMUZ', 'AGUSTOS', 'EYLUL', 'EKIM', 'KASIM', 'ARALIK'];
      doc.text(`${monthNames[currentMonth]} ${currentYear}`, 105, startY + 15, { align: 'center' });
      
      // Çizgi
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.5);
      doc.line(20, startY + 18, 190, startY + 18);
      
      // Özet Tablo Verisi
      const tableData = employees.map(emp => {
        const empData = appData[emp.id]?.[monthKey];
        const stats = calculateEmployeeStats(emp, empData, daysInMonth);
        const cleanName = emp.name.replace(/İ/g, 'I').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');
        
        return [
          cleanName,
          stats.totalWorkDays,
          stats.totalOvertimeHours,
          `${stats.grossTotal.toFixed(0)} TL`,
          `${stats.totalAdvances.toFixed(0)} TL`,
          `${stats.netPayable.toFixed(0)} TL`,
          `${stats.officialPay.toFixed(0)} TL`,
          `${(stats.netPayable - stats.officialPay).toFixed(0)} TL`
        ];
      });

      // Toplamlar
      const totals = employees.reduce((acc, emp) => {
        const empData = appData[emp.id]?.[monthKey];
        const stats = calculateEmployeeStats(emp, empData, daysInMonth);
        return {
          workDays: acc.workDays + stats.totalWorkDays,
          overtime: acc.overtime + stats.totalOvertimeHours,
          gross: acc.gross + stats.grossTotal,
          advances: acc.advances + stats.totalAdvances,
          net: acc.net + stats.netPayable,
          official: acc.official + stats.officialPay,
          hand: acc.hand + (stats.netPayable - stats.officialPay)
        };
      }, { workDays: 0, overtime: 0, gross: 0, advances: 0, net: 0, official: 0, hand: 0 });

      tableData.push([
        'TOPLAM',
        totals.workDays.toString(),
        totals.overtime > 0 ? `${totals.overtime} s` : '',
        `${totals.gross.toFixed(0)} TL`,
        `${totals.advances.toFixed(0)} TL`,
        `${totals.net.toFixed(0)} TL`,
        `${totals.official.toFixed(0)} TL`,
        `${totals.hand.toFixed(0)} TL`
      ]);

      (doc as any).autoTable({
        startY: startY + 25,
        head: [['Personel', 'Gun', 'Mesai', 'Brut', 'Avans', 'Net', 'Resmi', 'Ek Odeme']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2, font: 'helvetica' },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' },
          6: { cellWidth: 25, halign: 'right' },
          7: { cellWidth: 25, halign: 'right', fillColor: [254, 242, 242] }
        },
        didParseCell: function(data: any) {
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fillColor = [30, 58, 138];
            data.cell.styles.textColor = 255;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('KOBINERJI MUHENDISLIK', 105, finalY + 5, { align: 'center' });
      doc.text('Kemalpasa O.S.B. Gazi Bulv. Ceran Plaza No:177/19 Kemalpasa/Izmir', 105, finalY + 10, { align: 'center' });
      doc.text('Tel: +90 535 714 52 88 | www.kobinerji.com', 105, finalY + 15, { align: 'center' });

      doc.save(`Bordro_Toplu_${currentYear}_${currentMonth + 1}.pdf`);
      await ActivityLogger.bordroExportAllPDF(currentMonth + 1, currentYear);
      alert('✅ Toplu bordro PDF\'i başarıyla indirildi!');
    } catch (error) {
      console.error('PDF export hatası:', error);
      alert('❌ PDF oluşturulurken hata oluştu!');
    }
  };

  // Excel Import - Bordro Verilerini İçe Aktar
  const importFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('Excel dosyası boş!');
        return;
      }

      let importedCount = 0;
      let updatedCount = 0;

      // Her satırı işle
      for (const row of jsonData) {
        // Personel ismi çıkar (TC Kimlik No veya diğer kolonlardan)
        const employeeName = (row as any)['İSİM'] || (row as any)['AD SOYAD'] || (row as any)['PERSONEL'] || '';
        const tcNo = (row as any)['TC KIMLIK NO'] || (row as any)['TC'] || (row as any)['TC NO'] || '';
        const agreedSalary = parseFloat((row as any)['ANLAŞILAN MAAŞ'] || (row as any)['NET MAAŞ'] || '0') || 0;
        const officialSalary = parseFloat((row as any)['RESMİ MAAŞ'] || (row as any)['SGK MAAŞ'] || '0') || 0;
        const workDays = parseInt((row as any)['GÜN'] || (row as any)['ÇALIŞILAN GÜN'] || '0') || 0;
        
        if (!employeeName) continue;

        // Personeli kontrol et veya ekle
        let employee = employees.find(e => e.name.toLowerCase() === employeeName.toLowerCase());
        
        if (!employee) {
          // Yeni personel ekle
          const { data: newEmp, error } = await supabase
            .from('bordro_employees')
            .insert([{
              name: employeeName,
              tc_no: tcNo || null,
              agreed_salary: agreedSalary || 30000,
              official_salary: officialSalary || 17002,
              active: true
            }])
            .select()
            .single();

          if (error) throw error;
          employee = {
            id: newEmp.id,
            name: newEmp.name,
            tc_no: newEmp.tc_no,
            agreedSalary: newEmp.agreed_salary,
            officialSalary: newEmp.official_salary
          };
          importedCount++;
        }

        // Çalışma günlerini ekle (basit versiyon - her gün Normal olarak)
        if (workDays > 0) {
          for (let day = 1; day <= Math.min(workDays, daysInMonth); day++) {
            const logData = {
              employee_id: employee.id,
              day,
              month: currentMonth,
              year: currentYear,
              type: 'Normal',
              start_time: '08:00',
              end_time: '18:00',
              overtime_hours: 0,
              description: 'Excel\'den import'
            };

            const { error } = await supabase
              .from('bordro_daily_logs')
              .upsert(logData, { 
                onConflict: 'employee_id,day,month,year'
              });

            if (error) console.error('Log kaydetme hatası:', error);
          }
          updatedCount++;
        }
      }

      await loadEmployees();
      if (selectedEmployeeId) {
        await loadMonthlyData(selectedEmployeeId);
      }

      alert(`✅ Excel import tamamlandı!\n${importedCount} yeni personel eklendi\n${updatedCount} personel güncellendi`);
      
      // Input'u temizle
      event.target.value = '';
    } catch (error) {
      console.error('Excel import hatası:', error);
      alert('❌ Excel dosyası işlenirken hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans relative flex flex-col">
      
      {/* YÜKLEME GÖSTERGESİ */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-xl flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600"/>
            <span className="font-medium">Yükleniyor...</span>
          </div>
        </div>
      )}

      {/* KAYIT DURUMU GÖSTERGESİ */}
      {saveStatus !== 'idle' && (
        <div className="fixed top-20 right-4 z-50 animate-fade-in">
          <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${
            saveStatus === 'saved' ? 'bg-green-500 text-white' : 
            saveStatus === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
          }`}>
            {saveStatus === 'saved' && <><Save className="w-4 h-4"/> <span>Kaydedildi</span></>}
            {saveStatus === 'error' && <><AlertCircle className="w-4 h-4"/> <span>Hata!</span></>}
            {saveStatus === 'saving' && <><RefreshCw className="w-4 h-4 animate-spin"/> <span>Kaydediliyor...</span></>}
          </div>
        </div>
      )}
      
      {/* MODAL: Personel Ekle/Düzenle */}
      {showEmployeeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-96">
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="font-bold text-lg text-blue-900">
                          {editingEmployeeId ? 'Personel Bilgilerini Düzenle' : 'Yeni Personel Ekle'}
                      </h3>
                      <button onClick={() => setShowEmployeeModal(false)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="space-y-3">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">Ad Soyad</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" 
                            placeholder="Örn: Ahmet Yılmaz" 
                            value={employeeForm.name} 
                            onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})} 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">TC Kimlik No</label>
                          <input 
                            type="text" 
                            maxLength={11}
                            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" 
                            placeholder="Örn: 12345678901" 
                            value={employeeForm.tcNo} 
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '');
                              setEmployeeForm({...employeeForm, tcNo: value});
                            }} 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-green-700 mb-1">
                            <span className="text-lg">💵</span> Anlaşılan Net Maaş (ÖDENECEK)
                          </label>
                          <input 
                            type="number" 
                            className="w-full p-2 border-2 border-green-500 rounded focus:ring-2 focus:ring-green-500 font-bold" 
                            placeholder="Örn: 90000" 
                            value={employeeForm.agreedSalary} 
                            onChange={(e) => setEmployeeForm({...employeeForm, agreedSalary: e.target.value})} 
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-400 mb-1">
                            <span className="text-sm">📝</span> Resmi Maaş (Göstermelik - SGK)
                          </label>
                          <input 
                            type="number" 
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-gray-400 bg-gray-50 text-gray-600" 
                            placeholder="Örn: 17002" 
                            value={employeeForm.officialSalary} 
                            onChange={(e) => setEmployeeForm({...employeeForm, officialSalary: e.target.value})} 
                          />
                      </div>
                      <button onClick={saveEmployee} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 transition mt-2">
                          {editingEmployeeId ? 'GÜNCELLE' : 'KAYDET'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL: Avans/Gider/Prim Ekle */}
      {showAdvanceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-96">
                  <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <h3 className="font-bold text-lg" style={{color: advanceForm.type === 'Avans' ? '#dc2626' : advanceForm.type === 'Gider' ? '#ea580c' : '#16a34a'}}>
                          🔹 {advanceForm.type} Ekle
                      </h3>
                      <button onClick={() => {
                        setShowAdvanceModal(false);
                        setAdvanceForm({ 
                          amount: '', 
                          date: new Date().toISOString().split('T')[0], 
                          type: 'Avans',
                          installmentTotal: '1',
                          installmentCurrent: '1'
                        });
                      }} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5"/></button>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-600 mb-2">
                            📅 Tarih <span className="text-red-600">*</span>
                          </label>
                          <input 
                            type="date" 
                            className="w-full p-3 border-2 border-blue-400 rounded focus:ring-2 focus:ring-blue-500 font-semibold" 
                            value={advanceForm.date} 
                            onChange={(e) => setAdvanceForm({...advanceForm, date: e.target.value})} 
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Seçilen: {new Date(advanceForm.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-600 mb-2">
                            💰 Tutar (TL) <span className="text-red-600">*</span>
                          </label>
                          <input 
                            type="number" 
                            step="0.01"
                            min="0"
                            className="w-full p-3 border-2 border-green-500 rounded focus:ring-2 focus:ring-green-500 font-bold text-lg" 
                            placeholder="0.00" 
                            value={advanceForm.amount} 
                            onChange={(e) => setAdvanceForm({...advanceForm, amount: e.target.value})} 
                          />
                      </div>
                      
                      {advanceForm.type === 'Avans' && (
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-300">
                          <label className="block text-xs font-bold text-gray-700 mb-2">
                            📊 Taksit Bilgileri
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Toplam Taksit</label>
                              <input 
                                type="number" 
                                min="1"
                                max="12"
                                className="w-full p-2 border-2 border-yellow-400 rounded focus:ring-2 focus:ring-yellow-500 font-bold" 
                                value={advanceForm.installmentTotal} 
                                onChange={(e) => setAdvanceForm({
                                  ...advanceForm, 
                                  installmentTotal: e.target.value,
                                  installmentCurrent: Math.min(parseInt(e.target.value) || 1, parseInt(advanceForm.installmentCurrent) || 1).toString()
                                })} 
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Şu Anki Taksit</label>
                              <input 
                                type="number" 
                                min="1"
                                max={advanceForm.installmentTotal}
                                className="w-full p-2 border-2 border-yellow-400 rounded focus:ring-2 focus:ring-yellow-500 font-bold" 
                                value={advanceForm.installmentCurrent} 
                                onChange={(e) => setAdvanceForm({...advanceForm, installmentCurrent: e.target.value})} 
                              />
                            </div>
                          </div>
                          <div className="text-xs text-gray-600 mt-2 bg-white p-2 rounded border border-yellow-200">
                            💡 <strong>Toplam avans tutarını</strong> girin. Her ay <strong>{formatCurrency((parseFloat(advanceForm.amount) || 0) / (parseInt(advanceForm.installmentTotal) || 1))}</strong> kesilecek
                            {parseInt(advanceForm.installmentTotal) > 1 && ` (${advanceForm.installmentTotal} eşit taksit)`}
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-sm text-gray-600">
                          <strong>Personel:</strong> {selectedEmployee.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          <strong>Ay/Yıl:</strong> {MONTHS[currentMonth]} {currentYear}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={handleAdvanceSubmit}
                          className="flex-1 bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 transition shadow"
                        >
                          ✅ KAYDET
                        </button>
                        <button 
                          onClick={() => {
                            setShowAdvanceModal(false);
                            setAdvanceForm({ 
                              amount: '', 
                              date: new Date().toISOString().split('T')[0], 
                              type: 'Avans',
                              installmentTotal: '1',
                              installmentCurrent: '1'
                            });
                          }}
                          className="flex-1 bg-gray-400 text-white py-3 rounded font-bold hover:bg-gray-500 transition shadow"
                        >
                          ❌ İPTAL
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* HEADER */}
      <header className="bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-40">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
          <div className="flex items-center space-x-3">
            <Calculator className="w-8 h-8 text-yellow-400" />
            <div>
              <h1 className="text-xl font-bold tracking-wide">KOBİNERJİ</h1>
              <p className="text-xs text-blue-200">Personel Hakediş & Puantaj Otomasyonu</p>
            </div>
          </div>
          
          {/* TAB MENÜSÜ */}
          <div className="flex bg-blue-800 p-1 rounded-lg">
             <button 
                onClick={() => setActiveTab('summary')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'summary' ? 'bg-white text-blue-900 shadow' : 'text-blue-200 hover:text-white'}`}
             >
                <LayoutGrid className="w-4 h-4 mr-2"/>
                GENEL BAKIŞ
             </button>
             <button 
                onClick={() => setActiveTab('detail')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'detail' ? 'bg-white text-blue-900 shadow' : 'text-blue-200 hover:text-white'}`}
             >
                <List className="w-4 h-4 mr-2"/>
                PERSONEL DETAY
             </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Excel Import */}
            <div className="relative">
              <input 
                type="file" 
                accept=".xlsx,.xls"
                id="excel-import"
                className="hidden"
                onChange={importFromExcel}
              />
              <label 
                htmlFor="excel-import"
                className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-semibold flex items-center space-x-1 cursor-pointer"
                title="Excel'den Bordro İçe Aktar"
              >
                <UploadCloud className="w-4 h-4"/>
                <span>Excel İçe Aktar</span>
              </label>
            </div>

            {/* Geçmiş Bordrolar */}
            <button
              onClick={() => setShowHistoryModal(true)}
              className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm font-semibold flex items-center space-x-1"
              title="Geçmiş Bordroları Görüntüle"
            >
              <FileText className="w-4 h-4"/>
              <span>Geçmiş Bordrolar</span>
            </button>

            {/* Aylık Bordroyu Kaydet */}
            <button
              onClick={saveMonthlyPayroll}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm font-semibold flex items-center space-x-1 disabled:opacity-50"
              title="Bu ayın bordrosunu kaydet"
            >
              <Save className="w-4 h-4"/>
              <span>Ayı Kapat & Kaydet</span>
            </button>
            
            <div className="relative">
              <input 
                type="file" 
                accept="image/*"
                id="logo-upload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const logoData = event.target?.result as string;
                      setLogo(logoData);
                      // localStorage'a kaydet
                      localStorage.setItem('bordro_logo', logoData);
                      alert('✅ Logo yüklendi! PDF\'lerde görünecek.');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <label 
                htmlFor="logo-upload"
                className="bg-blue-800 hover:bg-blue-700 p-2 rounded cursor-pointer inline-flex items-center"
                title="Logo Yükle (PDF için)"
              >
                <Upload className="w-4 h-4"/>
              </label>
              {logo && (
                <button
                  onClick={() => {
                    if (confirm('Logo\'yu silmek istediğinize emin misiniz?')) {
                      setLogo(null);
                      localStorage.removeItem('bordro_logo');
                      alert('✅ Logo silindi.');
                    }
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  title="Logo Sil"
                >
                  <X className="w-3 h-3"/>
                </button>
              )}
            </div>
            
            <button 
              onClick={() => loadEmployees()}
              className="bg-blue-800 hover:bg-blue-700 p-2 rounded"
              title="Yenile"
            >
              <RefreshCw className="w-4 h-4"/>
            </button>
            
            <div className="flex items-center bg-blue-800 rounded px-3 py-1">
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))} className="p-1 hover:text-yellow-400"><ChevronLeft/></button>
              <span className="mx-2 font-mono font-bold w-32 text-center">
                {new Date(currentYear, currentMonth).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }).toUpperCase()}
              </span>
              <button onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))} className="p-1 hover:text-yellow-400"><ChevronRight/></button>
            </div>
          </div>
        </div>
      </header>

      {/* Kaydedilmemiş Değişiklik Uyarısı */}
      {pendingSaves.size > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4 mb-2 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <p className="text-yellow-800 font-semibold">
                  {pendingSaves.size} değişiklik kaydedilmeyi bekliyor...
                </p>
                <p className="text-yellow-700 text-sm">
                  Değişiklikler 2 saniye sonra otomatik olarak kaydedilecek. Lütfen bekleyin.
                </p>
              </div>
            </div>
            {saveStatus !== 'idle' && (
              <div className={`px-3 py-2 rounded text-sm font-semibold flex items-center space-x-2 ${
                saveStatus === 'saving' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                saveStatus === 'saved' ? 'bg-green-100 text-green-700 border border-green-300' :
                'bg-red-100 text-red-700 border border-red-300'
              }`}>
                {saveStatus === 'saving' && (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>✅ Kaydedildi</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    <span>❌ Hata!</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="container mx-auto p-4 flex-1">
        
        {/* VIEW 1: ÖZET TABLO */}
        {activeTab === 'summary' && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-700 flex items-center text-lg">
                        <LayoutGrid className="w-5 h-5 mr-2 text-blue-600"/>
                        MAAŞ İCMAL TABLOSU ({currentYear}-{currentMonth + 1})
                    </h2>
                    <div className="flex space-x-2">
                        <button 
                            onClick={exportToExcel}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 flex items-center shadow"
                            title="Excel'e Aktar"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2"/> EXCEL
                        </button>
                        <button 
                            onClick={exportAllPDF}
                            className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700 flex items-center shadow"
                            title="Toplu Bordro PDF"
                        >
                            <FileDown className="w-4 h-4 mr-2"/> TOPLU PDF
                        </button>
                        <button 
                            onClick={openAddModal}
                            className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-green-700 flex items-center shadow"
                        >
                            <UserPlus className="w-4 h-4 mr-2"/> YENİ PERSONEL
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-blue-50 text-blue-900 uppercase text-xs font-bold">
                            <tr>
                                <th className="p-4 border-b">PERSONEL</th>
                                <th className="p-4 border-b text-center">TC NO</th>
                                <th className="p-4 border-b text-right text-green-700">💵 ANLAŞILAN NET MAAŞ</th>
                                <th className="p-4 border-b text-center">GÜN</th>
                                <th className="p-4 border-b text-center">MESAİ (S)</th>
                                <th className="p-4 border-b text-right text-green-700">HAKEDİŞ TOP.</th>
                                <th className="p-4 border-b text-right text-red-600">AVANS</th>
                                <th className="p-4 border-b text-right font-black text-red-600 bg-red-50">💰 RESMİ MAAŞ</th>
                                <th className="p-4 border-b text-right font-black text-green-600 bg-green-50">💵 EK ÖDEME</th>
                                <th className="p-4 border-b text-right font-black text-blue-600 bg-blue-50">💰 TOPLAM</th>
                                <th className="p-4 border-b text-center">İŞLEM</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {employees.map(emp => {
                                const empData = appData[emp.id]?.[monthKey];
                                const stats = calculateEmployeeStats(emp, empData, daysInMonth);
                                
                                return (
                                    <tr key={emp.id} className="hover:bg-blue-50 transition-colors group">
                                        <td className="p-4 font-bold text-gray-700">{emp.name}</td>
                                        <td className="p-4 text-center text-gray-500 text-xs font-mono">{emp.tc_no || '-'}</td>
                                        <td className="p-4 text-right font-mono text-gray-500">{formatCurrency(emp.agreedSalary)}</td>
                                        <td className="p-4 text-center">
                                            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold">{stats.totalWorkDays}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {stats.totalOvertimeHours > 0 ? (
                                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">{stats.totalOvertimeHours} s</span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-4 text-right text-green-700 font-semibold">{formatCurrency(stats.grossTotal)}</td>
                                        <td className="p-4 text-right text-red-600">{stats.totalAdvances > 0 ? formatCurrency(stats.totalAdvances) : '-'}</td>
                                        <td className="p-4 text-right font-black text-red-600 bg-red-50 border-l-4 border-red-300">{formatCurrency(stats.officialPay)}</td>
                                        <td className="p-4 text-right font-black text-green-600 bg-green-50">{formatCurrency(stats.netPayable - stats.officialPay)}</td>
                                        <td className="p-4 text-right font-black text-blue-600 bg-blue-50 border-l-4 border-blue-300 text-lg">{formatCurrency(stats.netPayable)}</td>
                                        <td className="p-4 text-center flex justify-center space-x-2">
                                            <button 
                                                onClick={() => openEditModal(emp)}
                                                className="bg-yellow-100 text-yellow-700 p-2 rounded-full hover:bg-yellow-200 transition"
                                                title="Bilgileri Düzenle"
                                            >
                                                <Pencil className="w-4 h-4"/>
                                            </button>
                                            <button 
                                                onClick={() => deleteEmployee(emp.id, emp.name)}
                                                className="bg-red-100 text-red-700 p-2 rounded-full hover:bg-red-200 transition"
                                                title="Personeli Sil"
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                            <button 
                                                onClick={() => exportSinglePDF(emp)}
                                                className="bg-purple-100 text-purple-700 p-2 rounded-full hover:bg-purple-200 transition"
                                                title="Bordro PDF İndir"
                                            >
                                                <FileDown className="w-4 h-4"/>
                                            </button>
                                            <button 
                                                onClick={() => goToDetail(emp.id)}
                                                className="bg-blue-100 text-blue-700 p-2 rounded-full hover:bg-blue-200 transition"
                                                title="Puantaj Girişi"
                                            >
                                                <ArrowRightCircle className="w-4 h-4"/>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-gray-400 italic">Henüz personel eklenmemiş. "Yeni Personel" butonuna tıklayarak başlayın.</td>
                                </tr>
                            )}
                        </tbody>
                        {employees.length > 0 && (
                            <tfoot className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                                <tr className="font-bold text-base">
                                    <td className="p-4" colSpan={2}>TOPLAM</td>
                                    <td className="p-4 text-right">{formatCurrency(employees.reduce((sum, emp) => sum + emp.agreedSalary, 0))}</td>
                                    <td className="p-4 text-center">
                                        {employees.reduce((sum, emp) => {
                                            const stats = calculateEmployeeStats(emp, appData[emp.id]?.[monthKey], daysInMonth);
                                            return sum + stats.totalWorkDays;
                                        }, 0)}
                                    </td>
                                    <td className="p-4 text-center">
                                        {employees.reduce((sum, emp) => {
                                            const stats = calculateEmployeeStats(emp, appData[emp.id]?.[monthKey], daysInMonth);
                                            return sum + stats.totalOvertimeHours;
                                        }, 0)} s
                                    </td>
                                    <td className="p-4 text-right">
                                        {formatCurrency(employees.reduce((sum, emp) => {
                                            const stats = calculateEmployeeStats(emp, appData[emp.id]?.[monthKey], daysInMonth);
                                            return sum + stats.grossTotal;
                                        }, 0))}
                                    </td>
                                    <td className="p-4 text-right">
                                        {formatCurrency(employees.reduce((sum, emp) => {
                                            const stats = calculateEmployeeStats(emp, appData[emp.id]?.[monthKey], daysInMonth);
                                            return sum + stats.totalAdvances;
                                        }, 0))}
                                    </td>
                                    <td className="p-4 text-right text-xl bg-red-800 border-l-4 border-yellow-300">
                                        {formatCurrency(employees.reduce((sum, emp) => {
                                            const stats = calculateEmployeeStats(emp, appData[emp.id]?.[monthKey], daysInMonth);
                                            return sum + stats.netPayable;
                                        }, 0))}
                                    </td>
                                    <td className="p-4 text-right text-sm opacity-75">
                                        {formatCurrency(employees.reduce((sum, emp) => {
                                            const stats = calculateEmployeeStats(emp, appData[emp.id]?.[monthKey], daysInMonth);
                                            return sum + stats.officialPay;
                                        }, 0))}
                                    </td>
                                    <td className="p-4"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        )}

        {/* VIEW 2: DETAY GÖRÜNÜM */}
        {activeTab === 'detail' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* SOL PANEL */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-600">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="text-sm font-bold text-gray-500 flex items-center"><Users className="w-4 h-4 mr-2"/> PERSONEL SEÇİMİ</h2>
                        </div>
                        <div className="flex space-x-2">
                            <select 
                                value={selectedEmployeeId} 
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                className="flex-1 p-2 border rounded-md mb-4 bg-gray-50 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                {employees.length === 0 && <option value="">Personel Yok</option>}
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                ))}
                            </select>
                            {selectedEmployee.id !== '0' && (
                              <button 
                                  onClick={() => openEditModal(selectedEmployee)}
                                  className="h-[42px] px-3 bg-yellow-100 text-yellow-700 rounded border border-yellow-200 hover:bg-yellow-200"
                                  title="Düzenle"
                              >
                                  <Pencil className="w-4 h-4"/>
                              </button>
                            )}
                        </div>
                        
                        {selectedEmployee.id !== '0' && (
                          <div className="space-y-2 text-sm border-t pt-2">
                               <div className="flex justify-between"><span className="text-gray-500">Günlük Mesai Ücret:</span><span className="font-bold">{formatCurrency(currentStats.dailyRate)}</span></div>
                               <div className="flex justify-between"><span className="text-gray-500">Saatlik Mesai (x1.5):</span><span className="text-blue-600 font-mono">{formatCurrency(currentStats.hourlyRate * 1.5)}</span></div>
                          </div>
                        )}
                    </div>

                    {selectedEmployee.id !== '0' && (
                      <>
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-800 to-gray-700 p-3 text-white flex justify-between items-center">
                                <h3 className="font-bold text-sm">HAKEDİŞ DETAYI</h3>
                                <Banknote className="w-5 h-5 text-green-400"/>
                            </div>
                            <div className="p-4 space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-1">
                                  <span>Anlaşılan Maaş:</span>
                                  <span className="font-semibold">{formatCurrency(selectedEmployee.agreedSalary)}</span>
                                </div>
                                {currentStats.absentDeduction > 0 && (
                                  <div className="flex justify-between border-b pb-1 text-red-600">
                                    <span>Gelmedi ({currentStats.totalAbsentDays} gün):</span>
                                    <span className="font-semibold">-{formatCurrency(currentStats.absentDeduction)}</span>
                                  </div>
                                )}
                                {currentStats.overtimePay > 0 && (
                                  <div className="flex justify-between border-b pb-1 text-blue-600">
                                    <span>Mesai ({currentStats.totalOvertimeHours} saat x1.5):</span>
                                    <span className="font-semibold">+{formatCurrency(currentStats.overtimePay)}</span>
                                  </div>
                                )}
                                {currentStats.totalSundayPay > 0 && (
                                  <div className="flex justify-between border-b pb-1 text-orange-600">
                                    <span>Pazar/Tatil Farkı ({currentStats.totalSundayDays} gün):</span>
                                    <span className="font-semibold">+{formatCurrency(currentStats.totalSundayPay)}</span>
                                  </div>
                                )}
                                {currentStats.totalBonuses > 0 && (
                                    <div className="flex justify-between border-b pb-1 text-green-600"><span>Prim:</span><span className="font-semibold">+{formatCurrency(currentStats.totalBonuses)}</span></div>
                                )}
                                {currentStats.totalExpenses > 0 && (
                                    <div className="flex justify-between border-b pb-1 text-purple-600"><span>Gider:</span><span className="font-semibold">+{formatCurrency(currentStats.totalExpenses)}</span></div>
                                )}
                                <div className="flex justify-between font-bold text-green-700 pt-2 border-t-2 text-base bg-green-50 p-2 rounded">
                                  <span>BRÜT HAKEDİŞ:</span>
                                  <span>{formatCurrency(currentStats.grossTotal)}</span>
                                </div>
                                {currentStats.totalAdvances > 0 && (
                                  <>
                                    <div className="flex justify-between border-b pb-1 text-red-600">
                                      <span>Avanslar:</span>
                                      <span className="font-semibold">-{formatCurrency(currentStats.totalAdvances)}</span>
                                    </div>
                                    {currentData.expenses.filter(e => e.type === 'Avans').map(avans => (
                                      <div key={avans.id} className="flex justify-between text-xs text-red-500 pl-4">
                                        <span>
                                          • {new Date(avans.date).toLocaleDateString('tr-TR')}
                                          {(avans.installment_total || 1) > 1 && (
                                            <span className="ml-1 bg-yellow-100 text-yellow-700 px-1 rounded text-[10px]">
                                              {avans.installment_current}/{avans.installment_total} taksit
                                            </span>
                                          )}
                                        </span>
                                        <span>-{formatCurrency(avans.amount)}</span>
                                      </div>
                                    ))}
                                  </>
                                )}
                                <div className="flex justify-between font-black text-lg pt-2 bg-blue-50 p-2 rounded"><span>NET HAKEDİŞ:</span><span>{formatCurrency(currentStats.netPayable)}</span></div>
                                <div className="bg-green-50 p-2 rounded border border-green-200 mt-2 space-y-1">
                                    <div className="flex justify-between font-bold text-green-700 text-sm border-b border-green-200 pb-1">
                                        <span>Resmi Maaş:</span>
                                        <span>{formatCurrency(currentStats.officialPay)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-green-700 text-sm">
                                        <span>Ek Ödeme:</span>
                                        <span>{formatCurrency(currentStats.netPayable - currentStats.officialPay)}</span>
                                    </div>
                                    <div className="flex justify-between font-black text-green-700 text-lg border-t-2 border-green-300 pt-1">
                                        <span>TOPLAM ÖDENECEK:</span>
                                        <span>{formatCurrency(currentStats.netPayable)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl shadow-md">
                            <h4 className="text-xs font-bold text-gray-500 mb-2">HIZLI İŞLEMLER</h4>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <button onClick={() => addExpense('Avans')} className="bg-red-100 text-red-700 py-2 rounded text-xs font-bold hover:bg-red-200">AVANS</button>
                                <button onClick={() => addExpense('Gider')} className="bg-orange-100 text-orange-700 py-2 rounded text-xs font-bold hover:bg-orange-200">GİDER</button>
                                <button onClick={() => addExpense('Prim')} className="bg-green-100 text-green-700 py-2 rounded text-xs font-bold hover:bg-green-200">PRİM</button>
                            </div>
                            <button 
                                onClick={() => exportSinglePDF(selectedEmployee)} 
                                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 rounded text-xs font-bold hover:from-red-600 hover:to-red-700 flex items-center justify-center shadow-lg"
                            >
                                <FileDown className="w-4 h-4 mr-2"/>
                                BORDRO PDF İNDİR
                            </button>
                            <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                                {currentData.expenses.length > 0 ? (
                                  currentData.expenses.map(e => (
                                    <div key={e.id} className="flex justify-between items-start text-xs bg-gray-50 p-2 rounded border hover:bg-blue-50 transition">
                                        <div className="flex-1">
                                          <div className={`font-bold ${e.type === 'Avans' ? 'text-red-600' : e.type === 'Gider' ? 'text-orange-600' : 'text-green-600'}`}>
                                            {e.type}
                                            {e.type === 'Avans' && (e.installment_total || 1) > 1 && (
                                              <span className="ml-1 text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded">
                                                {e.installment_current}/{e.installment_total}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-gray-500 text-[10px] mt-0.5">
                                            📅 {new Date(e.date).toLocaleDateString('tr-TR')}
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold">{formatCurrency(e.amount)}</span>
                                            <button 
                                              onClick={() => deleteExpense(e.id)}
                                              className="p-1 hover:bg-red-100 rounded"
                                            >
                                              <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-600"/>
                                            </button>
                                        </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-center text-gray-400 text-xs py-2 italic">
                                    Henüz kayıt yok
                                  </div>
                                )}
                            </div>
                        </div>
                      </>
                    )}
                </div>

                {/* SAĞ PANEL */}
                <div className="lg:col-span-9 bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
                    {selectedEmployee.id === '0' ? (
                      <div className="p-8 text-center">
                        <Users className="w-16 h-16 mx-auto text-gray-300 mb-4"/>
                        <p className="text-gray-400 text-lg">Lütfen bir personel seçin veya yeni personel ekleyin.</p>
                        <button onClick={openAddModal} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">
                          YENİ PERSONEL EKLE
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="font-bold text-gray-700 flex items-center">
                                <FileSpreadsheet className="w-5 h-5 mr-2 text-blue-600"/>
                                GÜNLÜK PUANTAJ ({selectedEmployee.name})
                            </h2>
                            <button onClick={fillMonthDefaults} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-bold hover:bg-blue-200">OTOMATİK DOLDUR</button>
                        </div>
                        <div className="overflow-x-auto flex-1 p-2">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                                        <th className="p-2 border text-center w-10">GÜN</th>
                                        <th className="p-2 border w-32">DURUM</th>
                                        <th className="p-2 border w-20">GİRİŞ</th>
                                        <th className="p-2 border w-20">ÇIKIŞ</th>
                                        <th className="p-2 border w-16 text-center bg-blue-50">MESAİ</th>
                                        <th className="p-2 border">AÇIKLAMA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                        const { isSaturday, isSunday } = isWeekend(day, currentMonth, currentYear);
                                        const log = currentData.logs[day] || {};
                                        const isActive = !!log.type;
                                        let rowClass = "hover:bg-blue-50 transition-colors border-b";
                                        if (isSunday) rowClass += " bg-red-50"; else if (isSaturday) rowClass += " bg-orange-50";
                                        
                                        return (
                                            <tr key={day} className={rowClass}>
                                                <td className="p-1 border text-center font-bold text-gray-500 text-xs">
                                                    <div>{day}</div>
                                                    <div className="font-normal text-[9px]">{getDayName(day, currentMonth, currentYear).slice(0,3)}</div>
                                                </td>
                                                <td className="p-1 border">
                                                    <select className={`w-full p-1 border rounded text-xs ${log.type === 'Pazar' ? 'text-red-600 font-bold' : ''} ${!log.type ? 'text-gray-400' : ''}`} value={log.type || ''} onChange={(e) => handleLogChange(day, 'type', e.target.value)}>
                                                        <option value="">Gelmedi/Boş</option>
                                                        <option value="Normal">Normal</option>
                                                        <option value="Pazar">Pazar (x2)</option>
                                                        <option value="Resmi Tatil">Tatil (x2)</option>
                                                        <option value="İzinli">İzinli</option>
                                                        <option value="Raporlu">Raporlu</option>
                                                    </select>
                                                </td>
                                                <td className="p-1 border"><input type="time" className="w-full text-xs text-center" value={log.startTime || ''} onChange={(e) => handleLogChange(day, 'startTime', e.target.value)} disabled={!isActive}/></td>
                                                <td className="p-1 border"><input type="time" className="w-full text-xs text-center" value={log.endTime || ''} onChange={(e) => handleLogChange(day, 'endTime', e.target.value)} disabled={!isActive}/></td>
                                                <td className="p-1 border text-center bg-blue-50"><input type="number" className="w-full text-center font-bold text-blue-700 bg-transparent text-xs" value={log.overtimeHours || 0} onChange={(e) => handleLogChange(day, 'overtimeHours', parseFloat(e.target.value))} disabled={!isActive} min="0" step="0.5"/></td>
                                                <td className="p-1 border"><input type="text" className="w-full text-xs p-1" placeholder="..." value={log.description || ''} onChange={(e) => handleLogChange(day, 'description', e.target.value)}/></td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                      </>
                    )}
                </div>
            </div>
        )}
      </main>

      {/* GEÇMİŞ BORDROLAR MODALI */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <FileText className="w-6 h-6"/>
                <h2 className="text-xl font-bold">Geçmiş Bordrolar</h2>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="hover:bg-purple-700 p-2 rounded">
                <X className="w-5 h-5"/>
              </button>
            </div>

            <div className="p-6">
              {/* Tarih Seçici */}
              <div className="flex items-center space-x-4 mb-6 bg-gray-100 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Yıl</label>
                  <select 
                    value={historyYear} 
                    onChange={(e) => setHistoryYear(parseInt(e.target.value))}
                    className="p-2 border rounded"
                  >
                    {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Ay</label>
                  <select 
                    value={historyMonth} 
                    onChange={(e) => setHistoryMonth(parseInt(e.target.value))}
                    className="p-2 border rounded"
                  >
                    {MONTHS.map((month, idx) => (
                      <option key={idx} value={idx}>{month}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={loadHistoricalPayroll}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold mt-6 disabled:opacity-50"
                >
                  {loading ? 'Yükleniyor...' : 'Bordroyu Göster'}
                </button>
              </div>

              {/* Geçmiş Bordro Tablosu */}
              {historicalData.length > 0 ? (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-purple-600 text-white sticky top-0">
                      <tr>
                        <th className="p-2 border text-left">Personel</th>
                        <th className="p-2 border text-right">Anlaşılan Maaş</th>
                        <th className="p-2 border text-center">Çalışılan Gün</th>
                        <th className="p-2 border text-center">Pazar Günü</th>
                        <th className="p-2 border text-center">Mesai Saat</th>
                        <th className="p-2 border text-right">Avans</th>
                        <th className="p-2 border text-right">Gider</th>
                        <th className="p-2 border text-right">Prim</th>
                        <th className="p-2 border text-right">Net Hakediş</th>
                        <th className="p-2 border text-right bg-red-600">Resmi Maaş</th>
                        <th className="p-2 border text-right bg-green-600">Ek Ödeme</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicalData.map((record, idx) => (
                        <tr key={record.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="p-2 border font-semibold">{record.employee_name}</td>
                          <td className="p-2 border text-right">{parseFloat(record.agreed_salary).toLocaleString('tr-TR')} ₺</td>
                          <td className="p-2 border text-center font-semibold">{record.days_worked}</td>
                          <td className="p-2 border text-center">{record.sunday_days}</td>
                          <td className="p-2 border text-center">{parseFloat(record.overtime_hours).toFixed(1)}</td>
                          <td className="p-2 border text-right text-red-600">{parseFloat(record.advances).toLocaleString('tr-TR')} ₺</td>
                          <td className="p-2 border text-right text-orange-600">{parseFloat(record.expenses).toLocaleString('tr-TR')} ₺</td>
                          <td className="p-2 border text-right text-green-600">{parseFloat(record.bonuses).toLocaleString('tr-TR')} ₺</td>
                          <td className="p-2 border text-right font-bold text-blue-700">{parseFloat(record.net_payable).toLocaleString('tr-TR')} ₺</td>
                          <td className="p-2 border text-right font-bold text-red-700 bg-red-50">{parseFloat(record.official_salary).toLocaleString('tr-TR')} ₺</td>
                          <td className="p-2 border text-right font-bold text-green-700 bg-green-50">{parseFloat(record.hand_pay).toLocaleString('tr-TR')} ₺</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-purple-100 font-bold">
                      <tr>
                        <td colSpan={2} className="p-2 border text-right">TOPLAM:</td>
                        <td className="p-2 border text-center">{historicalData.reduce((sum, r) => sum + r.days_worked, 0)}</td>
                        <td className="p-2 border text-center">{historicalData.reduce((sum, r) => sum + r.sunday_days, 0)}</td>
                        <td className="p-2 border text-center">{historicalData.reduce((sum, r) => sum + parseFloat(r.overtime_hours), 0).toFixed(1)}</td>
                        <td className="p-2 border text-right text-red-600">{historicalData.reduce((sum, r) => sum + parseFloat(r.advances), 0).toLocaleString('tr-TR')} ₺</td>
                        <td className="p-2 border text-right text-orange-600">{historicalData.reduce((sum, r) => sum + parseFloat(r.expenses), 0).toLocaleString('tr-TR')} ₺</td>
                        <td className="p-2 border text-right text-green-600">{historicalData.reduce((sum, r) => sum + parseFloat(r.bonuses), 0).toLocaleString('tr-TR')} ₺</td>
                        <td className="p-2 border text-right font-bold text-blue-700">{historicalData.reduce((sum, r) => sum + parseFloat(r.net_payable), 0).toLocaleString('tr-TR')} ₺</td>
                        <td className="p-2 border text-right font-bold text-red-700 bg-red-50">{historicalData.reduce((sum, r) => sum + parseFloat(r.official_salary), 0).toLocaleString('tr-TR')} ₺</td>
                        <td className="p-2 border text-right font-bold text-green-700 bg-green-50">{historicalData.reduce((sum, r) => sum + parseFloat(r.hand_pay), 0).toLocaleString('tr-TR')} ₺</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300"/>
                  <p className="text-lg">Seçilen tarihte kayıtlı bordro bulunamadı.</p>
                  <p className="text-sm mt-2">Bordro kaydetmek için "Ayı Kapat & Kaydet" butonunu kullanın.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
