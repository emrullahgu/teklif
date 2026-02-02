import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, 
  FileSpreadsheet, 
  Save, 
  PlusCircle, 
  Trash2, 
  Banknote, 
  Calendar,
  Download,
  Building,
  Mail,
  Phone,
  UserPlus,
  Edit,
  Calculator,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X,
  Clock,
  Upload,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LayoutGrid,
  List
} from 'lucide-react';
import { supabase } from './supabaseClient';
import ActivityLogger from './activityLogger';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// --- SABİTLER ---
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

// --- TİP TANIMLAMALARI ---
type DayType = 'Normal' | 'Pazar' | 'Resmi Tatil' | 'Raporlu' | 'İzinli' | 'Gelmedi';

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
  installment_total?: number;
  installment_current?: number;
}

interface Employee {
  id: string;
  name: string;
  tc_no?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  start_date: string;
  monthly_salary: number;
  gross_salary?: number;
  sgk_base?: number;
  bank_name?: string;
  iban?: string;
  active: boolean;
  user_id?: string | null;
}

interface MonthlyPayroll {
  id?: string;
  employee_id: string;
  month: number;
  year: number;
  base_salary: number;
  overtime_pay: number;
  bonus: number;
  meal_allowance: number;
  transport_allowance: number;
  other_earnings: number;
  advance_deduction: number;
  sgk_employee: number;
  unemployment_employee: number;
  income_tax: number;
  stamp_tax: number;
  other_deductions: number;
  net_payment: number;
  sgk_employer: number;
  unemployment_employer: number;
  total_employer_cost: number;
  worked_days: number;
  total_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
  sick_leave_days: number;
  payment_date?: string;
  payment_method?: string;
  is_paid: boolean;
  notes?: string;
  logs?: Record<number, DailyLog>;  // Günlük kayıtlar
  expenses?: Expense[];  // Avans/Gider/Prim kayıtları
}

interface Advance {
  id?: string;
  employee_id: string;
  amount: number;
  advance_date: string;
  description?: string;
  installment_count: number;
  remaining_installments: number;
  monthly_deduction: number;
  is_fully_paid: boolean;
}

// --- YARDIMCI FONKSİYONLAR ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: 'TRY', 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(amount);
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

const calculateTaxesAndDeductions = (grossSalary: number) => {
  const sgkEmployeeRate = 0.14;
  const unemploymentEmployeeRate = 0.01;
  const sgkEmployerRate = 0.205;
  const unemploymentEmployerRate = 0.02;
  
  const sgkEmployee = grossSalary * sgkEmployeeRate;
  const unemploymentEmployee = grossSalary * unemploymentEmployeeRate;
  const taxBase = grossSalary - sgkEmployee - unemploymentEmployee;
  
  let incomeTax = 0;
  if (taxBase <= 70000) {
    incomeTax = taxBase * 0.15;
  } else if (taxBase <= 150000) {
    incomeTax = 70000 * 0.15 + (taxBase - 70000) * 0.20;
  } else if (taxBase <= 550000) {
    incomeTax = 70000 * 0.15 + 80000 * 0.20 + (taxBase - 150000) * 0.27;
  } else {
    incomeTax = 70000 * 0.15 + 80000 * 0.20 + 400000 * 0.27 + (taxBase - 550000) * 0.35;
  }
  
  const stampTax = grossSalary * 0.00759;
  const sgkEmployer = grossSalary * sgkEmployerRate;
  const unemploymentEmployer = grossSalary * unemploymentEmployerRate;
  
  return {
    sgkEmployee,
    unemploymentEmployee,
    incomeTax,
    stampTax,
    sgkEmployer,
    unemploymentEmployer
  };
};

// UUID doğrulama fonksiyonu
const isValidUUID = (str: string | null | undefined): boolean => {
  if (!str) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// --- ANA COMPONENT ---
const BeyazYakaBordro: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [payrollData, setPayrollData] = useState<MonthlyPayroll | null>(null);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'detail'>('summary');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [logo, setLogo] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [dailyLogs, setDailyLogs] = useState<Record<number, DailyLog>>({});
  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    tc_no: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    start_date: new Date().toISOString().split('T')[0],
    monthly_salary: '',
    gross_salary: '',
    sgk_base: '',
    bank_name: '',
    iban: ''
  });

  const [advanceForm, setAdvanceForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'Avans' as 'Avans' | 'Gider' | 'Prim',
    installment_total: '1',
    installment_current: '1'
  });

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);

  const selectedEmployee = useMemo(() => 
    employees.find(e => e.id === selectedEmployeeId),
    [employees, selectedEmployeeId]
  );

  // Admin kontrolü
  const checkUserAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Admin kontrolü - user_id NULL olan kayıtlar admin kayıtlarıdır
        const { data: adminCheck } = await supabase
          .from('beyaz_yaka_employees')
          .select('user_id')
          .is('user_id', null)
          .limit(1);
        
        setIsAdmin(!!(adminCheck && adminCheck.length > 0));
      }
    } catch (error) {
      console.error('Kullanıcı bilgisi alınamadı:', error);
    }
  };

  // Maaş bilgisini maskele
  const maskSalary = (employee: Employee): string => {
    if (isAdmin || employee.user_id === currentUserId) {
      return formatCurrency(employee.monthly_salary);
    }
    return '****';
  };

  // Detaylı bilgileri göster/maskele
  const canViewDetails = (employee: Employee): boolean => {
    return isAdmin || employee.user_id === currentUserId;
  };

  // Kullanıcı bilgilerini yükle
  useEffect(() => {
    checkUserAuth();
  }, []);

  // Kullanıcı bilgileri yüklendikten sonra available users'ı yükle
  useEffect(() => {
    if (currentUserId !== null) {
      loadAvailableUsers();
    }
  }, [currentUserId, isAdmin]);

  // Çalışanları yükle
  useEffect(() => {
    if (currentUserId !== null) {
      loadEmployees();
    }
  }, [currentUserId]);

  // Kayıtlı kullanıcıları yükle - Mevcut çalışanlardan benzersiz kullanıcıları al
  const loadAvailableUsers = async () => {
    try {
      if (isAdmin) {
        // Admin için: Sistemdeki tüm onaylı kullanıcıları users tablosundan çek
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, company, role')
          .eq('approved', true)
          .order('name');
        
        if (usersError) throw usersError;
        
        // Kullanıcıları uygun formata dönüştür
        const formattedUsers = usersData?.map(user => ({
          id: user.id,
          email: user.email || '',
          user_metadata: { 
            full_name: user.name,
            company: user.company,
            role: user.role
          }
        })) || [];
        
        setAvailableUsers(formattedUsers);
      } else {
        // Normal kullanıcı için: Sadece kendi bilgilerini göster
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAvailableUsers([{
            id: user.id,
            email: user.email || '',
            user_metadata: { full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '' }
          }]);
        } else {
          setAvailableUsers([]);
        }
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenirken hata:', error);
      // Hata durumunda eski yöntemle dene (beyaz_yaka_employees'den)
      try {
        if (isAdmin) {
          const { data: employeesData, error: empError } = await supabase
            .from('beyaz_yaka_employees')
            .select('user_id, name, email')
            .not('user_id', 'is', null);
          
          if (empError) throw empError;
          
          const uniqueUsers = employeesData
            ?.filter((emp, index, self) => 
              emp.user_id && isValidUUID(emp.user_id) && self.findIndex(e => e.user_id === emp.user_id) === index
            )
            .map(emp => ({
              id: emp.user_id,
              email: emp.email || '',
              user_metadata: { full_name: emp.name }
            })) || [];
          
          setAvailableUsers(uniqueUsers);
        } else {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setAvailableUsers([{
              id: user.id,
              email: user.email || '',
              user_metadata: { full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '' }
            }]);
          } else {
            setAvailableUsers([]);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback kullanıcı yükleme de başarısız:', fallbackError);
        setAvailableUsers([]);
      }
    }
  };

  // Kullanıcı seçildiğinde form alanlarını doldur
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = availableUsers.find(u => u.id === userId);
    if (user) {
      setEmployeeForm(prev => ({
        ...prev,
        email: user.email || prev.email,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || prev.name
      }));
    }
  };

  // Seçili çalışan değiştiğinde veri yükle
  useEffect(() => {
    if (selectedEmployeeId) {
      loadPayrollData();
      loadAdvances();
    }
  }, [selectedEmployeeId, currentMonth, currentYear]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      console.log('📋 Çalışanlar yükleniyor...');
      
      const { data, error } = await supabase
        .from('beyaz_yaka_employees')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('❌ Supabase hatası:', error);
        
        // Tablo yoksa kullanıcıya açık mesaj göster
        if (error.code === '42P01') {
          alert('⚠️ VERİTABANI HATASI\n\n"beyaz_yaka_employees" tablosu bulunamadı!\n\n👉 Çözüm:\n1. Supabase Dashboard\'a gidin\n2. SQL Editor\'ı açın\n3. beyaz-yaka-bordro-migration.sql dosyasındaki SQL\'leri çalıştırın');
        } else if (error.code === 'PGRST116' || error.message?.includes('RLS')) {
          alert('⚠️ ERİŞİM HATASI\n\nRow Level Security (RLS) politikaları hatalı!\n\n👉 Çözüm:\n1. Supabase Dashboard → Database → Policies\n2. beyaz_yaka_employees tablosu için politikaları kontrol edin\n3. Geçici olarak RLS\'i devre dışı bırakabilirsiniz:\n\nALTER TABLE beyaz_yaka_employees DISABLE ROW LEVEL SECURITY;');
        } else {
          alert('❌ Çalışan listesi yüklenemedi!\n\nHata: ' + error.message + '\n\nSupabase bağlantınızı kontrol edin.');
        }
        throw error;
      }

      console.log('✅ Çalışanlar yüklendi:', data?.length || 0, 'kişi');
      setEmployees(data || []);
      
      if (data && data.length > 0 && !selectedEmployeeId) {
        setSelectedEmployeeId(data[0].id);
      }
    } catch (error) {
      console.error('❌ Çalışan yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayrollData = async () => {
    try {
      const { data, error } = await supabase
        .from('beyaz_yaka_monthly_payroll')
        .select('*')
        .eq('employee_id', selectedEmployeeId)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPayrollData(data);
      } else {
        // Yeni bordro oluştur
        const employee = employees.find(e => e.id === selectedEmployeeId);
        if (employee) {
          const newPayroll = createDefaultPayroll(employee);
          setPayrollData(newPayroll);
        }
      }
    } catch (error) {
      console.error('Bordro verisi yüklenirken hata:', error);
    }
  };

  const createDefaultPayroll = (employee: Employee): MonthlyPayroll => {
    const grossSalary = employee.gross_salary || employee.monthly_salary * 1.5;
    const taxes = calculateTaxesAndDeductions(grossSalary);
    
    // Avansları hesapla
    const monthlyAdvanceDeduction = advances
      .filter(a => !a.is_fully_paid)
      .reduce((sum, a) => sum + (a.monthly_deduction || 0), 0);
    
    return {
      employee_id: employee.id,
      month: currentMonth,
      year: currentYear,
      base_salary: employee.monthly_salary,
      overtime_pay: 0,
      bonus: 0,
      meal_allowance: 0,
      transport_allowance: 0,
      other_earnings: 0,
      advance_deduction: monthlyAdvanceDeduction,
      sgk_employee: taxes.sgkEmployee,
      unemployment_employee: taxes.unemploymentEmployee,
      income_tax: taxes.incomeTax,
      stamp_tax: taxes.stampTax,
      other_deductions: 0,
      net_payment: employee.monthly_salary - monthlyAdvanceDeduction,
      sgk_employer: taxes.sgkEmployer,
      unemployment_employer: taxes.unemploymentEmployer,
      total_employer_cost: grossSalary + taxes.sgkEmployer + taxes.unemploymentEmployer,
      worked_days: 30,
      total_days: 30,
      paid_leave_days: 0,
      unpaid_leave_days: 0,
      sick_leave_days: 0,
      is_paid: false
    };
  };

  const loadAdvances = async () => {
    try {
      const { data, error } = await supabase
        .from('beyaz_yaka_advances')
        .select('*')
        .eq('employee_id', selectedEmployeeId)
        .eq('is_fully_paid', false)
        .order('advance_date', { ascending: false });
      
      if (error) throw error;
      setAdvances(data || []);
    } catch (error) {
      console.error('Avanslar yüklenirken hata:', error);
    }
  };

  const saveEmployee = async () => {
    if (!employeeForm.name || !employeeForm.monthly_salary) {
      showMessage('error', 'Ad ve maaş bilgisi zorunludur');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Seçili kullanıcı varsa ve geçerli UUID ise onu kullan, yoksa mevcut kullanıcıyı (admin) kullan
      const assignedUserId = (selectedUserId && isValidUUID(selectedUserId)) ? selectedUserId : (isAdmin ? null : user?.id);
      
      const employeeData = {
        name: employeeForm.name,
        tc_no: employeeForm.tc_no || null,
        email: employeeForm.email || null,
        phone: employeeForm.phone || null,
        position: employeeForm.position || null,
        department: employeeForm.department || null,
        start_date: employeeForm.start_date,
        monthly_salary: parseFloat(employeeForm.monthly_salary),
        gross_salary: employeeForm.gross_salary ? parseFloat(employeeForm.gross_salary) : null,
        sgk_base: employeeForm.sgk_base ? parseFloat(employeeForm.sgk_base) : null,
        bank_name: employeeForm.bank_name || null,
        iban: employeeForm.iban || null,
        user_id: assignedUserId
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from('beyaz_yaka_employees')
          .update(employeeData)
          .eq('id', editingEmployee.id);
        
        if (error) throw error;
        showMessage('success', 'Çalışan güncellendi');
      } else {
        const { error } = await supabase
          .from('beyaz_yaka_employees')
          .insert([employeeData]);
        
        if (error) throw error;
        showMessage('success', 'Yeni çalışan eklendi');
      }
      
      setShowEmployeeModal(false);
      setEditingEmployee(null);
      setSelectedUserId('');
      resetEmployeeForm();
      loadEmployees();
    } catch (error) {
      console.error('Çalışan kaydedilirken hata:', error);
      showMessage('error', 'İşlem başarısız oldu');
    } finally {
      setLoading(false);
    }
  };

  const savePayroll = async () => {
    if (!payrollData) return;
    
    setLoading(true);
    try {
      if (payrollData.id) {
        const { error } = await supabase
          .from('beyaz_yaka_monthly_payroll')
          .update(payrollData)
          .eq('id', payrollData.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('beyaz_yaka_monthly_payroll')
          .insert([payrollData])
          .select()
          .single();
        
        if (error) throw error;
        setPayrollData({ ...payrollData, id: data.id });
      }
      
      showMessage('success', 'Bordro kaydedildi');
    } catch (error) {
      console.error('Bordro kaydedilirken hata:', error);
      showMessage('error', 'Bordro kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const saveAdvance = async () => {
    if (!advanceForm.amount || !selectedEmployeeId) {
      showMessage('error', 'Tutar giriniz');
      return;
    }

    setLoading(true);
    try {
      const amount = parseFloat(advanceForm.amount);
      const installment_total = parseInt(advanceForm.installment_total) || 1;
      const installment_current = parseInt(advanceForm.installment_current) || 1;

      const newExpense: Expense = {
        id: `exp_${Date.now()}`,
        type: advanceForm.type,
        amount: amount,
        description: advanceForm.description || '',
        date: advanceForm.date,
        installment_total,
        installment_current
      };

      // Expense listesine ekle
      setExpensesList(prev => [...prev, newExpense]);
      
      // Eğer Avans ise, eski sisteme de kaydet
      if (advanceForm.type === 'Avans') {
        const monthlyDeduction = amount / installment_total;
        const advanceData = {
          employee_id: selectedEmployeeId,
          amount,
          advance_date: advanceForm.date,
          description: advanceForm.description || null,
          installment_count: installment_total,
          remaining_installments: installment_total,
          monthly_deduction: monthlyDeduction,
          is_fully_paid: false
        };

        const { error } = await supabase
          .from('beyaz_yaka_advances')
          .insert([advanceData]);
        
        if (error) throw error;
        loadAdvances();
      }
      
      showMessage('success', `${advanceForm.type} kaydedildi`);
      setShowAdvanceModal(false);
      resetAdvanceForm();
      loadPayrollData(); // Bordroyu güncelle
    } catch (error) {
      console.error('Kayıt hatası:', error);
      showMessage('error', 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!confirm('Bu kaydı silmek istediğinizden emin misiniz?')) return;
    
    try {
      setExpensesList(prev => prev.filter(e => e.id !== expenseId));
      showMessage('success', 'Kayıt silindi');
      loadPayrollData();
    } catch (error) {
      console.error('Silme hatası:', error);
      showMessage('error', 'Silme başarısız');
    }
  };

  // Günlük kayıt yönetimi
  const handleLogChange = (day: number, field: keyof DailyLog, value: any) => {
    setDailyLogs(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        day,
        type: prev[day]?.type || 'Normal',
        startTime: prev[day]?.startTime || '08:00',
        endTime: prev[day]?.endTime || '18:00',
        overtimeHours: prev[day]?.overtimeHours || 0,
        description: prev[day]?.description || '',
        [field]: value
      }
    }));
    
    // Otomatik kaydetme
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(() => {
      saveDailyLog(day);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1000);
    }, 1500);
  };

  const saveDailyLog = async (day: number) => {
    const log = dailyLogs[day];
    if (!log || !log.type || !selectedEmployeeId) return;
    
    try {
      // Veritabanına kaydetme işlemi burada yapılacak
      // Şimdilik sadece local state'de tutuyoruz
      console.log('Günlük kayıt kaydedildi:', day, log);
    } catch (error) {
      console.error('Günlük kayıt hatası:', error);
    }
  };

  const fillMonthDefaults = () => {
    const newLogs: Record<number, DailyLog> = {};
    for (let i = 1; i <= daysInMonth; i++) {
      if (!dailyLogs[i] || !dailyLogs[i].type) {
        const { isSaturday, isSunday } = isWeekend(i, currentMonth, currentYear);
        newLogs[i] = {
          day: i,
          type: 'Normal',
          startTime: '08:00',
          endTime: isSunday || isSaturday ? '08:00' : '18:00',
          overtimeHours: 0,
          description: ''
        };
      }
    }
    setDailyLogs(prev => ({ ...prev, ...newLogs }));
  };

  const deleteAdvance = async (advanceId: string) => {
    if (!confirm('Bu avansı silmek istediğinizden emin misiniz?')) return;
    
    try {
      const { error } = await supabase
        .from('beyaz_yaka_advances')
        .delete()
        .eq('id', advanceId);
      
      if (error) throw error;
      
      showMessage('success', 'Avans silindi');
      loadAdvances();
      loadPayrollData();
    } catch (error) {
      console.error('Avans silinirken hata:', error);
      showMessage('error', 'Avans silinemedi');
    }
  };

  const deleteEmployee = async (empId: string, empName: string) => {
    if (!confirm(`${empName} isimli çalışanı silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz ve tüm bordro kayıtları da silinecektir.`)) {
      return;
    }

    try {
      setLoading(true);
      
      // Çalışanı pasif yap (soft delete)
      const { error } = await supabase
        .from('beyaz_yaka_employees')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', empId);

      if (error) throw error;
      
      await loadEmployees();
      
      // Silinen çalışan seçiliyse, seçimi temizle
      if (selectedEmployeeId === empId) {
        setSelectedEmployeeId(employees.length > 1 ? employees[0].id : '');
      }
      
      alert(`✅ ${empName} başarıyla silindi.`);
      
    } catch (error) {
      console.error('Çalışan silme hatası:', error);
      alert('Çalışan silinirken bir hata oluştu!');
    } finally {
      setLoading(false);
    }
  };

  const updatePayrollField = (field: keyof MonthlyPayroll, value: any) => {
    if (!payrollData) return;
    
    const updated = { ...payrollData, [field]: value };
    
    // Net ödemeyi otomatik hesapla
    if (['base_salary', 'overtime_pay', 'bonus', 'meal_allowance', 'transport_allowance', 
         'other_earnings', 'advance_deduction', 'sgk_employee', 'unemployment_employee',
         'income_tax', 'stamp_tax', 'other_deductions'].includes(field)) {
      
      const totalEarnings = 
        Number(updated.base_salary) + 
        Number(updated.overtime_pay) + 
        Number(updated.bonus) +
        Number(updated.meal_allowance) + 
        Number(updated.transport_allowance) + 
        Number(updated.other_earnings);
      
      const totalDeductions = 
        Number(updated.advance_deduction) + 
        Number(updated.sgk_employee) + 
        Number(updated.unemployment_employee) +
        Number(updated.income_tax) + 
        Number(updated.stamp_tax) + 
        Number(updated.other_deductions);
      
      updated.net_payment = totalEarnings - totalDeductions;
      
      // İşveren maliyetini hesapla
      updated.total_employer_cost = totalEarnings + 
        Number(updated.sgk_employer) + 
        Number(updated.unemployment_employer);
    }
    
    setPayrollData(updated);
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const exportToPDF = () => {
    if (!payrollData || !selectedEmployee) return;
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(63, 81, 181);
    doc.text('BEYAZ YAKA BORDRO', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${MONTHS[currentMonth]} ${currentYear}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Çalışan: ${selectedEmployee.name}`, 20, 45);
    if (selectedEmployee.tc_no) doc.text(`TC No: ${selectedEmployee.tc_no}`, 20, 52);
    if (selectedEmployee.position) doc.text(`Pozisyon: ${selectedEmployee.position}`, 20, 59);
    if (selectedEmployee.department) doc.text(`Departman: ${selectedEmployee.department}`, 20, 66);
    
    const totalEarnings = 
      payrollData.base_salary + payrollData.overtime_pay + payrollData.bonus +
      payrollData.meal_allowance + payrollData.transport_allowance + payrollData.other_earnings;
    
    const totalDeductions = 
      payrollData.sgk_employee + payrollData.unemployment_employee + payrollData.income_tax +
      payrollData.stamp_tax + payrollData.advance_deduction + payrollData.other_deductions;
    
    const tableData: any[] = [
      ['HAKEDİŞLER', ''],
      ['Temel Maaş', formatCurrency(payrollData.base_salary)],
      ['Mesai Ücreti', formatCurrency(payrollData.overtime_pay)],
      ['Prim', formatCurrency(payrollData.bonus)],
      ['Yemek Yardımı', formatCurrency(payrollData.meal_allowance)],
      ['Ulaşım Yardımı', formatCurrency(payrollData.transport_allowance)],
      ['Diğer Kazançlar', formatCurrency(payrollData.other_earnings)],
      ['', ''],
      ['TOPLAM HAKEDİŞLER', formatCurrency(totalEarnings)],
      ['', ''],
      ['KESİNTİLER', ''],
      ['SGK İşçi Payı (%14)', formatCurrency(payrollData.sgk_employee)],
      ['İşsizlik İşçi Payı (%1)', formatCurrency(payrollData.unemployment_employee)],
      ['Gelir Vergisi', formatCurrency(payrollData.income_tax)],
      ['Damga Vergisi (%0.759)', formatCurrency(payrollData.stamp_tax)]
    ];
    
    // Avans detaylarını ekle
    if (advances.length > 0) {
      tableData.push(['', '']);
      tableData.push(['AVANSLAR', '']);
      advances.forEach(adv => {
        const dateStr = new Date(adv.advance_date).toLocaleDateString('tr-TR');
        const installmentInfo = adv.installment_count > 1 
          ? ` (${adv.installment_count - (adv.remaining_installments || 0)}/${adv.installment_count} taksit)` 
          : '';
        tableData.push([
          `  - ${dateStr}${installmentInfo}: ${adv.description || 'Avans'}`, 
          formatCurrency(adv.monthly_deduction || adv.amount)
        ]);
      });
      tableData.push(['Toplam Avans Kesintisi', formatCurrency(payrollData.advance_deduction)]);
    } else {
      tableData.push(['Avans Kesintisi', formatCurrency(payrollData.advance_deduction)]);
    }
    
    tableData.push(['Diğer Kesintiler', formatCurrency(payrollData.other_deductions)]);
    tableData.push(['', '']);
    tableData.push(['TOPLAM KESİNTİLER', formatCurrency(totalDeductions)]);
    tableData.push(['', '']);
    tableData.push(['NET ÖDEME', formatCurrency(payrollData.net_payment)]);
    tableData.push(['', '']);
    tableData.push(['İŞVEREN MALİYETİ', '']);
    tableData.push(['SGK İşveren Payı (%20.5)', formatCurrency(payrollData.sgk_employer)]);
    tableData.push(['İşsizlik İşveren Payı (%2)', formatCurrency(payrollData.unemployment_employer)]);
    tableData.push(['TOPLAM İŞVEREN MALİYETİ', formatCurrency(payrollData.total_employer_cost)]);
    
    (doc as any).autoTable({
      startY: 80,
      head: [['Açıklama', 'Tutar']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
      styles: { font: 'helvetica', fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' }
      },
      didParseCell: function(data: any) {
        // Avans detay satırlarını küçük font ile göster
        if (data.cell.text[0] && data.cell.text[0].startsWith('  - ')) {
          data.cell.styles.fontSize = 8;
          data.cell.styles.textColor = [220, 38, 38];
        }
        // Ana başlıkları vurgula
        if (data.cell.text[0] && (
          data.cell.text[0].includes('HAKEDİŞLER') || 
          data.cell.text[0].includes('KESİNTİLER') || 
          data.cell.text[0].includes('AVANSLAR') ||
          data.cell.text[0].includes('İŞVEREN MALİYETİ') ||
          data.cell.text[0].includes('TOPLAM')
        )) {
          data.cell.styles.fillColor = [232, 234, 246];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 11;
        }
      }
    });
    
    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Yazdırma Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 20, finalY);
    doc.text(`Çalışma Günleri: ${payrollData.worked_days}/${payrollData.total_days}`, 20, finalY + 5);
    if (payrollData.notes) {
      doc.text(`Not: ${payrollData.notes}`, 20, finalY + 10);
    }
    
    doc.save(`beyaz_yaka_bordro_${selectedEmployee.name}_${MONTHS[currentMonth]}_${currentYear}.pdf`);
  };

  const exportSummaryToExcel = () => {
    const summaryData = employees.map(emp => {
      // Her çalışan için bordro hesapla
      const empPayroll = createDefaultPayroll(emp);
      return {
        'Çalışan': emp.name,
        'Pozisyon': emp.position || '-',
        'Departman': emp.department || '-',
        'Temel Maaş': emp.monthly_salary,
        'Net Ödeme': empPayroll.net_payment,
        'İşveren Maliyeti': empPayroll.total_employer_cost,
        'İşe Başlama': new Date(emp.start_date).toLocaleDateString('tr-TR')
      };
    });

    const ws = XLSX.utils.json_to_sheet(summaryData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Beyaz Yaka Özet');
    XLSX.writeFile(wb, `beyaz_yaka_ozet_${MONTHS[currentMonth]}_${currentYear}.xlsx`);
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: '',
      tc_no: '',
      email: '',
      phone: '',
      position: '',
      department: '',
      start_date: new Date().toISOString().split('T')[0],
      monthly_salary: '',
      gross_salary: '',
      sgk_base: '',
      bank_name: '',
      iban: ''
    });
  };

  const resetAdvanceForm = () => {
    setAdvanceForm({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      type: 'Avans',
      installment_total: '1',
      installment_current: '1'
    });
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Özet hesaplamaları
  const summaryStats = useMemo(() => {
    const totalSalary = employees.reduce((sum, emp) => sum + emp.monthly_salary, 0);
    const totalEmployees = employees.length;
    
    return {
      totalEmployees,
      totalSalary,
      averageSalary: totalEmployees > 0 ? totalSalary / totalEmployees : 0
    };
  }, [employees]);

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building className="text-indigo-600" size={32} />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Beyaz Yaka Bordro Sistemi</h1>
                <p className="text-gray-600">Maaşlı personel bordro yönetimi</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'summary' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="inline mr-2" size={18} />
                Özet
              </button>
              <button
                onClick={() => setActiveTab('detail')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'detail' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={!selectedEmployeeId}
              >
                <Calculator className="inline mr-2" size={18} />
                Detay
              </button>
            </div>
          </div>
        </div>

        {/* Mesaj */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Özet Tab */}
        {activeTab === 'summary' && (
          <>
            {/* İstatistikler */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Toplam Çalışan</p>
                    <p className="text-3xl font-bold text-indigo-600">{summaryStats.totalEmployees}</p>
                  </div>
                  <Users className="text-indigo-600" size={48} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Toplam Maaş</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summaryStats.totalSalary)}</p>
                  </div>
                  <Banknote className="text-green-600" size={48} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ortalama Maaş</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(summaryStats.averageSalary)}</p>
                  </div>
                  <TrendingUp className="text-blue-600" size={48} />
                </div>
              </div>
            </div>

            {/* Çalışan Listesi */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Çalışan Listesi</h2>
                <div className="flex gap-2">
                  <button
                    onClick={exportSummaryToExcel}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <Download size={18} />
                    Excel İndir
                  </button>
                  <button
                    onClick={() => {
                      setShowEmployeeModal(true);
                      setEditingEmployee(null);
                      resetEmployeeForm();
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <UserPlus size={20} />
                    Yeni Çalışan
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Ad Soyad</th>
                      <th className="px-4 py-3 text-left">Pozisyon</th>
                      <th className="px-4 py-3 text-left">Departman</th>
                      <th className="px-4 py-3 text-right">Aylık Maaş</th>
                      <th className="px-4 py-3 text-left">İşe Başlama</th>
                      <th className="px-4 py-3 text-center">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{emp.name}</td>
                        <td className="px-4 py-3">{emp.position || '-'}</td>
                        <td className="px-4 py-3">{emp.department || '-'}</td>
                        <td className="px-4 py-3 text-right font-semibold">{maskSalary(emp)}</td>
                        <td className="px-4 py-3">{new Date(emp.start_date).toLocaleDateString('tr-TR')}</td>
                        <td className="px-4 py-3 text-center flex justify-center space-x-2">
                          <button 
                            onClick={() => {
                              setEditingEmployee(emp);
                              setEmployeeForm({
                                name: emp.name,
                                tc_no: emp.tc_no || '',
                                email: emp.email || '',
                                phone: emp.phone || '',
                                position: emp.position || '',
                                department: emp.department || '',
                                start_date: emp.start_date,
                                monthly_salary: emp.monthly_salary.toString(),
                                gross_salary: emp.gross_salary?.toString() || '',
                                sgk_base: emp.sgk_base?.toString() || '',
                                bank_name: emp.bank_name || '',
                                iban: emp.iban || ''
                              });
                              setShowEmployeeModal(true);
                            }}
                            className="bg-yellow-100 text-yellow-700 p-2 rounded-full hover:bg-yellow-200 transition"
                            title="Bilgileri Düzenle"
                          >
                            <Edit className="w-4 h-4"/>
                          </button>
                          <button 
                            onClick={() => deleteEmployee(emp.id, emp.name)}
                            className="bg-red-100 text-red-700 p-2 rounded-full hover:bg-red-200 transition"
                            title="Çalışanı Sil"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedEmployeeId(emp.id);
                              setActiveTab('detail');
                            }}
                            className="bg-blue-100 text-blue-700 p-2 rounded-full hover:bg-blue-200 transition"
                            title="Bordro Detayı"
                          >
                            <FileSpreadsheet className="w-4 h-4"/>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Detay Tab */}
        {activeTab === 'detail' && selectedEmployee && (
          <>
            {/* Çalışan Seçimi ve Ay Navigasyonu */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Çalışan Seçiniz</label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ay Seçimi</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changeMonth('prev')}
                      className="p-2 border rounded-lg hover:bg-gray-100"
                    >
                      ←
                    </button>
                    <div className="flex-1 text-center font-semibold">
                      {MONTHS[currentMonth]} {currentYear}
                    </div>
                    <button
                      onClick={() => changeMonth('next')}
                      className="p-2 border rounded-lg hover:bg-gray-100"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {payrollData && (
              <>
                {!canViewDetails(selectedEmployee) ? (
                  <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Yetkiniz Yok</h3>
                    <p className="text-gray-600">Bu çalışanın bordro bilgilerini görüntüleme yetkiniz bulunmamaktadır.</p>
                    <p className="text-sm text-gray-500 mt-2">Sadece kendi bordro bilgilerinizi görüntüleyebilirsiniz.</p>
                  </div>
                ) : (
                  <>
                {/* Bordro Formu */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Aylık Bordro - {selectedEmployee.name}</h2>
                    <div className="flex gap-2">
                      <button onClick={exportToPDF} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2">
                        <Download size={18} />
                        PDF
                      </button>
                      <button onClick={savePayroll} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                        <Save size={18} />
                        Kaydet
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* Hakediş Kalemleri */}
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-bold mb-4 text-green-700">Hakediş Kalemleri</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Temel Maaş</label>
                          <input
                            type="number"
                            value={payrollData.base_salary}
                            onChange={(e) => updatePayrollField('base_salary', Number(e.target.value))}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Mesai Ücreti</label>
                          <input
                            type="number"
                            value={payrollData.overtime_pay}
                            onChange={(e) => updatePayrollField('overtime_pay', Number(e.target.value))}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Prim</label>
                          <input
                            type="number"
                            value={payrollData.bonus}
                            onChange={(e) => updatePayrollField('bonus', Number(e.target.value))}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Yemek Yardımı</label>
                          <input
                            type="number"
                            value={payrollData.meal_allowance}
                            onChange={(e) => updatePayrollField('meal_allowance', Number(e.target.value))}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Ulaşım Yardımı</label>
                          <input
                            type="number"
                            value={payrollData.transport_allowance}
                            onChange={(e) => updatePayrollField('transport_allowance', Number(e.target.value))}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Diğer Kazançlar</label>
                          <input
                            type="number"
                            value={payrollData.other_earnings}
                            onChange={(e) => updatePayrollField('other_earnings', Number(e.target.value))}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Kesinti Kalemleri */}
                    <div className="border rounded-lg p-4">
                      <h3 className="text-lg font-bold mb-4 text-red-700">Kesinti Kalemleri</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">SGK İşçi Payı</label>
                          <input
                            type="number"
                            value={payrollData.sgk_employee}
                            onChange={(e) => updatePayrollField('sgk_employee', Number(e.target.value))}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">İşsizlik İşçi Payı</label>
                          <input
                            type="number"
                            value={payrollData.unemployment_employee}
                            onChange={(e) => updatePayrollField('unemployment_employee', Number(e.target.value))}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Gelir Vergisi</label>
                          <input
                            type="number"
                            value={payrollData.income_tax}
                            onChange={(e) => updatePayrollField('income_tax', Number(e.target.value))}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Damga Vergisi</label>
                          <input
                            type="number"
                            value={payrollData.stamp_tax}
                            onChange={(e) => updatePayrollField('stamp_tax', Number(e.target.value))}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Avans Kesintisi</label>
                          <input
                            type="number"
                            value={payrollData.advance_deduction}
                            onChange={(e) => updatePayrollField('advance_deduction', Number(e.target.value))}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Diğer Kesintiler</label>
                          <input
                            type="number"
                            value={payrollData.other_deductions}
                            onChange={(e) => updatePayrollField('other_deductions', Number(e.target.value))}
                            className="w-full border rounded px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Özet */}
                  <div className="mt-6 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Net Ödeme</p>
                        <p className="text-3xl font-bold text-indigo-600">{formatCurrency(payrollData.net_payment)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">İşveren Maliyeti</p>
                        <p className="text-3xl font-bold text-orange-600">{formatCurrency(payrollData.total_employer_cost)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Çalışılan Gün</p>
                        <input
                          type="number"
                          value={payrollData.worked_days}
                          onChange={(e) => updatePayrollField('worked_days', Number(e.target.value))}
                          className="text-2xl font-bold w-20 border rounded px-2 py-1"
                        />
                        <span className="text-2xl font-bold"> / {payrollData.total_days}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Avanslar */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Avanslar</h3>
                    <button
                      onClick={() => {
                        setShowAdvanceModal(true);
                        resetAdvanceForm();
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                    >
                      <PlusCircle size={18} />
                      Yeni Avans
                    </button>
                  </div>
                  {advances.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Tarih</th>
                            <th className="px-4 py-2 text-right">Tutar</th>
                            <th className="px-4 py-2 text-center">Taksit</th>
                            <th className="px-4 py-2 text-right">Aylık Kesinti</th>
                            <th className="px-4 py-2 text-left">Açıklama</th>
                            <th className="px-4 py-2 text-center">İşlem</th>
                          </tr>
                        </thead>
                        <tbody>
                          {advances.map((adv) => (
                            <tr key={adv.id} className="border-b">
                              <td className="px-4 py-2">{new Date(adv.advance_date).toLocaleDateString('tr-TR')}</td>
                              <td className="px-4 py-2 text-right font-semibold">{formatCurrency(adv.amount)}</td>
                              <td className="px-4 py-2 text-center">
                                {adv.installment_count - (adv.remaining_installments || 0)} / {adv.installment_count}
                              </td>
                              <td className="px-4 py-2 text-right">{formatCurrency(adv.monthly_deduction || 0)}</td>
                              <td className="px-4 py-2">{adv.description || '-'}</td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => deleteAdvance(adv.id!)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-4">Avans kaydı bulunmuyor</p>
                  )}
                </div>
                </>
              )}
            </>
            )}
          </>
        )}

        {/* Çalışan Ekleme/Düzenleme Modalı */}
        {showEmployeeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {editingEmployee ? 'Çalışan Düzenle' : 'Yeni Çalışan Ekle'}
                </h3>
                <button onClick={() => setShowEmployeeModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              
              {/* Kullanıcı Seçimi - Sadece yeni ekleme sırasında */}
              {!editingEmployee && (
                <div className="mb-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                  <label className="block text-sm font-medium mb-2 text-indigo-900">
                    🔍 Mevcut Kullanıcılardan Seç (Opsiyonel)
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    className="w-full border-2 border-indigo-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Kullanıcı seçin veya manuel girin --</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.user_metadata?.full_name || user.email} 
                        {user.user_metadata?.company ? `(${user.user_metadata.company})` : ''}
                        {user.user_metadata?.role ? ` - ${user.user_metadata.role}` : ''}
                        {user.email ? ` <${user.email}>` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-indigo-600 mt-2">
                    💡 Kullanıcı seçtiğinizde email ve ad alanları otomatik doldurulur
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ad Soyad *</label>
                  <input
                    type="text"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">TC Kimlik No</label>
                  <input
                    type="text"
                    value={employeeForm.tc_no}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, tc_no: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">E-posta</label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefon</label>
                  <input
                    type="text"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pozisyon</label>
                  <input
                    type="text"
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Departman</label>
                  <input
                    type="text"
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">İşe Başlama Tarihi *</label>
                  <input
                    type="date"
                    value={employeeForm.start_date}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, start_date: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Aylık Net Maaş *</label>
                  <input
                    type="number"
                    value={employeeForm.monthly_salary}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, monthly_salary: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Brüt Maaş</label>
                  <input
                    type="number"
                    value={employeeForm.gross_salary}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, gross_salary: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SGK Matrahı</label>
                  <input
                    type="number"
                    value={employeeForm.sgk_base}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, sgk_base: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Banka Adı</label>
                  <input
                    type="text"
                    value={employeeForm.bank_name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, bank_name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">IBAN</label>
                  <input
                    type="text"
                    value={employeeForm.iban}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, iban: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  İptal
                </button>
                <button
                  onClick={saveEmployee}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Avans/Gider/Prim Modalı */}
        {showAdvanceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Yeni Kayıt Ekle</h3>
                <button onClick={() => setShowAdvanceModal(false)} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tip *</label>
                  <select
                    value={advanceForm.type}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, type: e.target.value as 'Avans' | 'Gider' | 'Prim' })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="Avans">Avans (Kesinti)</option>
                    <option value="Gider">Gider (Kesinti)</option>
                    <option value="Prim">Prim (Ekleme)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tutar *</label>
                  <input
                    type="number"
                    value={advanceForm.amount}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tarih *</label>
                  <input
                    type="date"
                    value={advanceForm.date}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                {advanceForm.type === 'Avans' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Toplam Taksit Sayısı</label>
                      <input
                        type="number"
                        min="1"
                        value={advanceForm.installment_total}
                        onChange={(e) => setAdvanceForm({ ...advanceForm, installment_total: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Şu Anki Taksit</label>
                      <input
                        type="number"
                        min="1"
                        value={advanceForm.installment_current}
                        onChange={(e) => setAdvanceForm({ ...advanceForm, installment_current: e.target.value })}
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Açıklama</label>
                  <textarea
                    value={advanceForm.description}
                    onChange={(e) => setAdvanceForm({ ...advanceForm, description: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  İptal
                </button>
                <button
                  onClick={saveAdvance}
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BeyazYakaBordro;
