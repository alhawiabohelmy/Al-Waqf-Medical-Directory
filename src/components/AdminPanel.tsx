import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, Lock, LogOut, Plus, Edit2, Trash2, Download, Upload, 
  Activity, CheckCircle2, AlertTriangle, Settings, RefreshCw, FileText, Check, PlusCircle,
  Clock, XCircle, Search, Save, ClipboardList, Eye, EyeOff
} from 'lucide-react';
import { Doctor, Pharmacy, Lab, Ad, ActivityLog, HomePageConfig, DoctorRequest } from '../data/initialData';

interface AdminPanelProps {
  adminLoggedIn: boolean;
  onLogin: (pass: string) => boolean;
  onLogout: () => void;
  doctors: Doctor[];
  pharmacies: Pharmacy[];
  labs: Lab[];
  specialties: string[];
  ads: Ad[];
  logs: ActivityLog[];
  config: HomePageConfig;
  doctorRequests: DoctorRequest[];
  onUpdateDoctors: (docs: Doctor[]) => void;
  onUpdatePharmacies: (pharms: Pharmacy[]) => void;
  onUpdateLabs: (labs: Lab[]) => void;
  onUpdateSpecialties: (specs: string[]) => void;
  onUpdateAds: (ads: Ad[]) => void;
  onUpdateConfig: (cfg: HomePageConfig) => void;
  onUpdateDoctorRequests: (reqs: DoctorRequest[]) => void;
  onAddLog: (action: string, type: 'doctor' | 'pharmacy' | 'lab' | 'specialty' | 'ad' | 'system' | 'backup', details: string) => void;
  onShowToast: (msg: string) => void;
}

export default function AdminPanel({
  adminLoggedIn, onLogin, onLogout,
  doctors, pharmacies, labs, specialties, ads, logs, config, doctorRequests,
  onUpdateDoctors, onUpdatePharmacies, onUpdateLabs, onUpdateSpecialties, onUpdateAds, onUpdateConfig,
  onUpdateDoctorRequests, onAddLog, onShowToast
}: AdminPanelProps) {
  
  const [passcode, setPasscode] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'requests' | 'doctors' | 'pharmacies' | 'labs' | 'specialties' | 'ads' | 'settings' | 'logs'>('stats');
  
  // Entity Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState({ name: '', specialty: specialties[0] || '', clinicName: '', address: '', phone: '', whatsapp: '' });
  const [pharmForm, setPharmForm] = useState({ name: '', address: '', phone: '', whatsapp: '' });
  const [labForm, setLabForm] = useState({ name: '', address: '', phone: '', whatsapp: '' });
  const [newSpecialty, setNewSpecialty] = useState('');
  
  // Ad Form State
  const [adForm, setAdForm] = useState({ title: '', content: '', link: '', position: 'ticker' as Ad['position'], isActive: true });

  // Doctor Addition Requests Management States
  const [requestSearch, setRequestSearch] = useState('');
  const [rejectionId, setRejectionId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [editingRequestForm, setEditingRequestForm] = useState({
    serviceType: 'doctor' as DoctorRequest['serviceType'],
    name: '',
    specialty: '',
    clinicName: '',
    pharmacistName: '',
    shortDescription: '',
    address: '',
    phone: '',
    governorate: 'قنا',
    center: 'الوقف',
    notes: ''
  });
  
  // File upload ref for database restoration
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onLogin(passcode)) {
      onShowToast('🔑 تم تسجيل الدخول إلى لوحة التحكم بنجاح!');
      setPasscode('');
    } else {
      onShowToast('❌ رمز الدخول غير صحيح! يرجى المحاولة مرة أخرى.');
    }
  };

  // --- ACTIONS FOR SERVICE ADDITION REQUESTS ---
  const acceptAndPublishRequest = (req: DoctorRequest) => {
    const serviceType = req.serviceType || 'doctor';
    const typeLabels: Record<string, string> = {
      doctor: 'طبيب',
      pharmacy: 'صيدلية',
      lab: 'معمل تحاليل',
      scan_center: 'مركز أشعة',
      hospital: 'مستشفى',
      physiotherapy: 'مركز علاج طبيعي',
      other: 'خدمة طبية أخرى'
    };
    const currentTypeLabel = typeLabels[serviceType] || 'خدمة طبية';

    if (serviceType === 'doctor') {
      const newDoc: Doctor = {
        id: `doc-${Date.now()}`,
        name: req.name,
        specialty: req.specialty || 'تخصص عام',
        clinicName: req.clinicName || 'عيادة خاصة',
        address: req.address,
        phone: req.phone,
        whatsapp: req.phone,
        createdAt: new Date().toISOString()
      };
      onUpdateDoctors([newDoc, ...doctors]);
      onAddLog('إضافة', 'doctor', `تم قبول ونشر بيانات الطبيب الجديد: ${req.name} من طلب الرقم: ${req.id}`);
      onShowToast(`🎉 تم قبول ونشر الطبيب "${req.name}" في الدليل بنجاح!`);
    } else if (serviceType === 'pharmacy') {
      const displayName = req.name + (req.pharmacistName ? ` (د. ${req.pharmacistName})` : '');
      const newPharm: Pharmacy = {
        id: `pharm-${Date.now()}`,
        name: displayName,
        address: req.address,
        phone: req.phone,
        whatsapp: req.phone,
        createdAt: new Date().toISOString()
      };
      onUpdatePharmacies([newPharm, ...pharmacies]);
      onAddLog('إضافة', 'pharmacy', `تم قبول ونشر الصيدلية الجديدة: ${req.name} من طلب الرقم: ${req.id}`);
      onShowToast(`🎉 تم قبول ونشر صيدلية "${req.name}" في الدليل بنجاح!`);
    } else if (serviceType === 'lab' || serviceType === 'scan_center') {
      const suffix = serviceType === 'scan_center' ? ' (مركز أشعة)' : '';
      const newLab: Lab = {
        id: `lab-${Date.now()}`,
        name: req.name + suffix,
        address: req.address,
        phone: req.phone,
        whatsapp: req.phone,
        createdAt: new Date().toISOString()
      };
      onUpdateLabs([newLab, ...labs]);
      onAddLog('إضافة', 'lab', `تم قبول ونشر ${currentTypeLabel} الجديد: ${req.name} من طلب الرقم: ${req.id}`);
      onShowToast(`🎉 تم قبول ونشر ${currentTypeLabel} "${req.name}" في الدليل بنجاح!`);
    } else if (serviceType === 'hospital') {
      const newDoc: Doctor = {
        id: `doc-${Date.now()}`,
        name: req.name,
        specialty: 'مستشفى / مركز طبي',
        clinicName: 'قسم الاستقبال والطوارئ',
        address: req.address,
        phone: req.phone,
        whatsapp: req.phone,
        createdAt: new Date().toISOString()
      };
      onUpdateDoctors([newDoc, ...doctors]);
      onAddLog('إضافة', 'doctor', `تم قبول ونشر مستشفى جديد: ${req.name} من طلب الرقم: ${req.id}`);
      onShowToast(`🎉 تم قبول ونشر مستشفى "${req.name}" في الدليل بنجاح!`);
    } else if (serviceType === 'physiotherapy') {
      const newDoc: Doctor = {
        id: `doc-${Date.now()}`,
        name: req.name,
        specialty: 'علاج طبيعي وتأهيل',
        clinicName: 'مركز علاج طبيعي',
        address: req.address,
        phone: req.phone,
        whatsapp: req.phone,
        createdAt: new Date().toISOString()
      };
      onUpdateDoctors([newDoc, ...doctors]);
      onAddLog('إضافة', 'doctor', `تم قبول ونشر مركز علاج طبيعي: ${req.name} من طلب الرقم: ${req.id}`);
      onShowToast(`🎉 تم قبول ونشر مركز العلاج الطبيعي "${req.name}" في الدليل بنجاح!`);
    } else {
      // other
      const newDoc: Doctor = {
        id: `doc-${Date.now()}`,
        name: req.name,
        specialty: req.shortDescription || 'خدمة طبية أخرى',
        clinicName: 'خدمات طبية عامة',
        address: req.address,
        phone: req.phone,
        whatsapp: req.phone,
        createdAt: new Date().toISOString()
      };
      onUpdateDoctors([newDoc, ...doctors]);
      onAddLog('إضافة', 'doctor', `تم قبول ونشر خدمة طبية أخرى: ${req.name} من طلب الرقم: ${req.id}`);
      onShowToast(`🎉 تم قبول ونشر الخدمة "${req.name}" في الدليل بنجاح!`);
    }

    // Update the request status to published
    const updatedRequests = doctorRequests.map(r => r.id === req.id ? { ...r, status: 'published' as const } : r);
    onUpdateDoctorRequests(updatedRequests);
  };

  const acceptRequestOnly = (id: string, name: string) => {
    const updatedRequests = doctorRequests.map(r => r.id === id ? { ...r, status: 'accepted' as const } : r);
    onUpdateDoctorRequests(updatedRequests);

    onAddLog('تعديل', 'system', `تم قبول طلب إضافة: ${name} (في انتظار النشر)`);
    onShowToast(`✅ تم تغيير حالة طلب الإضافة إلى "مقبول".`);
  };

  const submitRejection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionId || !rejectionReasonInput.trim()) {
      onShowToast('⚠️ يرجى كتابة سبب الرفض أولاً.');
      return;
    }

    const req = doctorRequests.find(r => r.id === rejectionId);
    if (!req) return;

    const updatedRequests = doctorRequests.map(r => r.id === rejectionId ? { ...r, status: 'rejected' as const, rejectionReason: rejectionReasonInput } : r);
    onUpdateDoctorRequests(updatedRequests);

    onAddLog('تعديل', 'system', `تم رفض طلب إضافة الخدمة: ${req.name} بسبب: ${rejectionReasonInput}`);
    onShowToast(`❌ تم رفض طلب الخدمة مع تدوين السبب.`);
    setRejectionId(null);
    setRejectionReasonInput('');
  };

  const startEditingRequest = (req: DoctorRequest) => {
    setEditingRequestId(req.id);
    setEditingRequestForm({
      serviceType: req.serviceType || 'doctor',
      name: req.name,
      specialty: req.specialty || '',
      clinicName: req.clinicName || '',
      pharmacistName: req.pharmacistName || '',
      shortDescription: req.shortDescription || '',
      address: req.address,
      phone: req.phone,
      governorate: req.governorate || 'قنا',
      center: req.center || 'الوقف',
      notes: req.notes || ''
    });
  };

  const saveEditedRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequestId) return;

    const updatedRequests = doctorRequests.map(r => r.id === editingRequestId ? {
      ...r,
      serviceType: editingRequestForm.serviceType,
      name: editingRequestForm.name,
      specialty: editingRequestForm.specialty,
      clinicName: editingRequestForm.clinicName,
      pharmacistName: editingRequestForm.pharmacistName,
      shortDescription: editingRequestForm.shortDescription,
      address: editingRequestForm.address,
      phone: editingRequestForm.phone,
      notes: editingRequestForm.notes
    } : r);

    onUpdateDoctorRequests(updatedRequests);
    onAddLog('تعديل', 'system', `تم تعديل بيانات طلب الإضافة: ${editingRequestForm.name}`);
    onShowToast('✅ تم حفظ التعديلات على بيانات الطلب بنجاح.');
    setEditingRequestId(null);
  };

  const deleteDoctorRequest = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف طلب إضافة: ${name} نهائياً؟`)) {
      onUpdateDoctorRequests(doctorRequests.filter(r => r.id !== id));
      onAddLog('حذف', 'system', `تم حذف طلب إضافة: ${name}`);
      onShowToast('🗑️ تم حذف طلب الإضافة بنجاح.');
    }
  };

  // --- CRUD ACTIONS FOR DOCTORS ---
  const saveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.name || !docForm.address || !docForm.phone) {
      onShowToast('⚠️ يرجى ملء الحقول الأساسية: الاسم، العنوان، ورقم الهاتف.');
      return;
    }
    
    if (editingId) {
      const updated = doctors.map(d => d.id === editingId ? { ...d, ...docForm } : d);
      onUpdateDoctors(updated);
      onAddLog('تعديل', 'doctor', `تم تعديل بيانات الطبيب: ${docForm.name}`);
      onShowToast('✅ تم تعديل بيانات الطبيب بنجاح.');
      setEditingId(null);
    } else {
      const newDoc: Doctor = {
        id: `doc-${Date.now()}`,
        ...docForm,
        createdAt: new Date().toISOString()
      };
      onUpdateDoctors([newDoc, ...doctors]);
      onAddLog('إضافة', 'doctor', `تمت إضافة الطبيب الجديد: ${docForm.name}`);
      onShowToast('✅ تمت إضافة الطبيب بنجاح.');
    }
    setDocForm({ name: '', specialty: specialties[0] || '', clinicName: '', address: '', phone: '', whatsapp: '' });
  };

  const deleteDoctor = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الطبيب: ${name}؟`)) {
      onUpdateDoctors(doctors.filter(d => d.id !== id));
      onAddLog('حذف', 'doctor', `تم حذف الطبيب: ${name}`);
      onShowToast('🗑️ تم حذف الطبيب بنجاح.');
    }
  };

  // --- CRUD ACTIONS FOR PHARMACIES ---
  const savePharmacy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmForm.name || !pharmForm.address || !pharmForm.phone) {
      onShowToast('⚠️ يرجى ملء الحقول الأساسية: الاسم، العنوان، ورقم الهاتف.');
      return;
    }

    if (editingId) {
      const updated = pharmacies.map(p => p.id === editingId ? { ...p, ...pharmForm } : p);
      onUpdatePharmacies(updated);
      onAddLog('تعديل', 'pharmacy', `تم تعديل صيدلية: ${pharmForm.name}`);
      onShowToast('✅ تم تعديل الصيدلية بنجاح.');
      setEditingId(null);
    } else {
      const newPharm: Pharmacy = {
        id: `pharm-${Date.now()}`,
        ...pharmForm,
        createdAt: new Date().toISOString()
      };
      onUpdatePharmacies([newPharm, ...pharmacies]);
      onAddLog('إضافة', 'pharmacy', `تمت إضافة صيدلية جديدة: ${pharmForm.name}`);
      onShowToast('✅ تمت إضافة الصيدلية بنجاح.');
    }
    setPharmForm({ name: '', address: '', phone: '', whatsapp: '' });
  };

  const deletePharmacy = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الصيدلية: ${name}؟`)) {
      onUpdatePharmacies(pharmacies.filter(p => p.id !== id));
      onAddLog('حذف', 'pharmacy', `تم حذف الصيدلية: ${name}`);
      onShowToast('🗑️ تم حذف الصيدلية بنجاح.');
    }
  };

  // --- CRUD ACTIONS FOR LABS ---
  const saveLab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labForm.name || !labForm.address || !labForm.phone) {
      onShowToast('⚠️ يرجى ملء الحقول الأساسية: الاسم، العنوان، ورقم الهاتف.');
      return;
    }

    if (editingId) {
      const updated = labs.map(l => l.id === editingId ? { ...l, ...labForm } : l);
      onUpdateLabs(updated);
      onAddLog('تعديل', 'lab', `تم تعديل معمل التحاليل: ${labForm.name}`);
      onShowToast('✅ تم تعديل بيانات المعمل بنجاح.');
      setEditingId(null);
    } else {
      const newLab: Lab = {
        id: `lab-${Date.now()}`,
        ...labForm,
        createdAt: new Date().toISOString()
      };
      onUpdateLabs([newLab, ...labs]);
      onAddLog('إضافة', 'lab', `تمت إضافة معمل تحاليل جديد: ${labForm.name}`);
      onShowToast('✅ تمت إضافة المعمل بنجاح.');
    }
    setLabForm({ name: '', address: '', phone: '', whatsapp: '' });
  };

  const deleteLab = (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المعمل: ${name}؟`)) {
      onUpdateLabs(labs.filter(l => l.id !== id));
      onAddLog('حذف', 'lab', `تم حذف المعمل: ${name}`);
      onShowToast('🗑️ تم حذف معمل التحاليل بنجاح.');
    }
  };

  const toggleDoctorVisibility = (id: string, name: string, hidden?: boolean) => {
    const updated = doctors.map(d => d.id === id ? { ...d, hidden: !hidden } : d);
    onUpdateDoctors(updated);
    onAddLog('تعديل', 'doctor', `تم ${hidden ? 'إظهار' : 'إخفاء'} الطبيب: ${name}`);
    onShowToast(`✔️ تم ${hidden ? 'إظهار' : 'إخفاء'} الطبيب بنجاح`);
  };

  const togglePharmacyVisibility = (id: string, name: string, hidden?: boolean) => {
    const updated = pharmacies.map(p => p.id === id ? { ...p, hidden: !hidden } : p);
    onUpdatePharmacies(updated);
    onAddLog('تعديل', 'pharmacy', `تم ${hidden ? 'إظهار' : 'إخفاء'} الصيدلية: ${name}`);
    onShowToast(`✔️ تم ${hidden ? 'إظهار' : 'إخفاء'} الصيدلية بنجاح`);
  };

  const toggleLabVisibility = (id: string, name: string, hidden?: boolean) => {
    const updated = labs.map(l => l.id === id ? { ...l, hidden: !hidden } : l);
    onUpdateLabs(updated);
    onAddLog('تعديل', 'lab', `تم ${hidden ? 'إظهار' : 'إخفاء'} المعمل: ${name}`);
    onShowToast(`✔️ تم ${hidden ? 'إظهار' : 'إخفاء'} المعمل بنجاح`);
  };

  // --- SPECIALTIES ACTIONS ---
  const addSpecialty = () => {
    if (!newSpecialty.trim()) return;
    if (specialties.includes(newSpecialty.trim())) {
      onShowToast('⚠️ هذا التخصص موجود بالفعل.');
      return;
    }
    const updated = [...specialties, newSpecialty.trim()];
    onUpdateSpecialties(updated);
    onAddLog('إضافة', 'specialty', `تمت إضافة تخصص طبي جديد: ${newSpecialty}`);
    onShowToast('✅ تم إدراج التخصص الطبي الجديد بنجاح.');
    setNewSpecialty('');
  };

  const deleteSpecialty = (specName: string) => {
    const isUsed = doctors.some(d => d.specialty === specName);
    if (isUsed) {
      onShowToast('❌ لا يمكن حذف تخصص مرتبط بأطباء مسجلين حالياً!');
      return;
    }
    if (window.confirm(`هل ترغب في حذف التخصص الطبي: "${specName}"؟`)) {
      onUpdateSpecialties(specialties.filter(s => s !== specName));
      onAddLog('حذف', 'specialty', `تم حذف التخصص الطبي: ${specName}`);
      onShowToast('🗑️ تم حذف التخصص بنجاح.');
    }
  };

  // --- ADS ACTIONS ---
  const saveAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.title || !adForm.content) {
      onShowToast('⚠️ يرجى تعبئة عنوان ومحتوى الإعلان.');
      return;
    }

    if (editingId) {
      const updated = ads.map(a => a.id === editingId ? { ...a, ...adForm } : a);
      onUpdateAds(updated);
      onAddLog('تعديل', 'ad', `تم تعديل الإعلان: ${adForm.title}`);
      onShowToast('✅ تم تحديث بيانات الإعلان بنجاح.');
      setEditingId(null);
    } else {
      const newAd: Ad = {
        id: `ad-${Date.now()}`,
        ...adForm
      };
      onUpdateAds([newAd, ...ads]);
      onAddLog('إضافة', 'ad', `تم إدراج إعلان ترويجي جديد: ${adForm.title}`);
      onShowToast('✅ تمت إضافة الإعلان بنجاح.');
    }
    setAdForm({ title: '', content: '', link: '', position: 'ticker', isActive: true });
  };

  const toggleAdStatus = (id: string, currentStatus: boolean, title: string) => {
    const updated = ads.map(a => a.id === id ? { ...a, isActive: !currentStatus } : a);
    onUpdateAds(updated);
    onAddLog('تعديل', 'ad', `تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} الإعلان: ${title}`);
    onShowToast(`📢 تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} الإعلان بنجاح.`);
  };

  const deleteAd = (id: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من إزالة هذا الإعلان: ${title}؟`)) {
      onUpdateAds(ads.filter(a => a.id !== id));
      onAddLog('حذف', 'ad', `تم حذف الإعلان: ${title}`);
      onShowToast('🗑️ تم حذف الإعلان بنجاح.');
    }
  };

  // --- BACKUP & RESTORE DATABASE ---
  const handleExportData = () => {
    const databaseDump = {
      doctors,
      pharmacies,
      labs,
      specialties,
      ads,
      config,
      exportedAt: new Date().toISOString(),
      platform: "Al-Waqf Medical Directory"
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(databaseDump, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `dlylelwaqf-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onAddLog('backup', 'system', 'تم تصدير نسخة احتياطية كاملة من قاعدة البيانات بنجاح.');
    onShowToast('💾 تم تحميل ملف النسخة الاحتياطية بنجاح!');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        
        // Simple validation checks to prevent corrupt files
        if (
          !Array.isArray(importedData.doctors) || 
          !Array.isArray(importedData.pharmacies) || 
          !Array.isArray(importedData.labs) || 
          !Array.isArray(importedData.specialties) || 
          !Array.isArray(importedData.ads)
        ) {
          throw new Error("تنسيق الملف غير متوافق مع نظام دليل الوقف الطبي.");
        }

        onUpdateDoctors(importedData.doctors);
        onUpdatePharmacies(importedData.pharmacies);
        onUpdateLabs(importedData.labs);
        onUpdateSpecialties(importedData.specialties);
        onUpdateAds(importedData.ads);
        if (importedData.config) {
          onUpdateConfig(importedData.config);
        }

        onAddLog('backup', 'system', 'تم استيراد قاعدة بيانات واستعادة كافة البيانات من ملف نسخة احتياطية.');
        onShowToast('♻️ تم استيراد البيانات واستعادتها بنجاح تام!');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        onShowToast(`❌ فشل استعادة البيانات: ${err.message || 'الملف تالف أو غير متوافق.'}`);
      }
    };
    reader.readAsText(file);
  };

  // Login state check
  if (!adminLoggedIn) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-white rounded-3xl border border-slate-150 shadow-xl overflow-hidden">
          
          {/* Header Banner */}
          <div className="bg-slate-900 text-white p-8 text-center relative">
            <div className="mx-auto w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 border border-slate-700 shadow-md">
              <Lock className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold">بوابة إدارة دليل الوقف الطبي</h2>
            <p className="text-xs text-slate-400 mt-1">يرجى تسجيل الدخول للوصول إلى صلاحيات التعديل والإضافة</p>
          </div>

          {/* Form container */}
          <form onSubmit={handleLoginSubmit} className="p-8 space-y-6">
            <div>
              <label className="block text-slate-700 font-bold text-sm mb-2" htmlFor="passcode">
                رمز المرور السري للوحة التحكم
              </label>
              <input
                id="passcode"
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="أدخل الرمز السري هنا..."
                className="w-full text-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-300"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="h-5 w-5" />
              <span>فتح لوحة التحكم</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Admin Sub-tabs Layout once logged in
  const subTabs = [
    { id: 'stats', label: 'الإحصائيات العامة', icon: Activity },
    { id: 'requests', label: 'طلبات الأطباء', icon: ClipboardList },
    { id: 'doctors', label: 'الأطباء', icon: FileText },
    { id: 'pharmacies', label: 'الصيدليات', icon: FileText },
    { id: 'labs', label: 'المعامل', icon: FileText },
    { id: 'specialties', label: 'إدارة التخصصات', icon: Settings },
    { id: 'ads', label: 'المساحات الإعلانية', icon: Settings },
    { id: 'settings', label: 'النسخ والإعدادات', icon: RefreshCw },
    { id: 'logs', label: 'سجل العمليات', icon: Activity },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" id="admin-dashboard-container">
      {/* Admin Panel Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 shadow-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/25 rounded-2xl border border-emerald-500/35">
            <ShieldCheck className="h-10 w-10 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">لوحة التحكم وإدارة البيانات</h1>
            <p className="text-slate-400 text-xs sm:text-sm font-semibold mt-1">تعديل الأطباء، الصيدليات، المعامل، التخصصات والإعلانات</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-600/35 py-2.5 px-5 rounded-xl font-bold transition-all text-sm shadow-sm shrink-0"
        >
          <LogOut className="h-4 w-4" />
          <span>خروج من الإدارة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Admin Navigation Menu (Sidebar on desktop) */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-150 p-4 space-y-1 h-fit">
          <span className="block text-slate-400 font-extrabold text-[10.5px] uppercase tracking-wider px-3 mb-2.5">التبويبات المتاحة</span>
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSubTab(tab.id as any);
                  setEditingId(null);
                }}
                className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold text-right transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-250'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4.5 w-4.5" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Sub-tab Panel */}
        <div className="lg:col-span-3 space-y-6">

          {/* TAB 1: GENERAL STATS */}
          {activeSubTab === 'stats' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-2">إحصائيات المنصة الحالية</h2>
              
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl border border-slate-150 p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] font-bold">الأطباء والعيادات</span>
                    <span className="text-lg">🏥</span>
                  </div>
                  <span className="text-3xl font-extrabold text-slate-900 mt-4 block">{doctors.length}</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-150 p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] font-bold">الصيدليات المعتمدة</span>
                    <span className="text-lg">💊</span>
                  </div>
                  <span className="text-3xl font-extrabold text-slate-900 mt-4 block">{pharmacies.length}</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-150 p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] font-bold">معامل التحاليل والأشعة</span>
                    <span className="text-lg">🔬</span>
                  </div>
                  <span className="text-3xl font-extrabold text-slate-900 mt-4 block">{labs.length}</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-150 p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] font-bold">طلبات الإضافة قيد الانتظار</span>
                    <span className="text-lg">📩</span>
                  </div>
                  <span className="text-3xl font-extrabold text-amber-600 mt-4 block">{doctorRequests.filter(r => r.status === 'pending').length}</span>
                </div>

                <div className="bg-white rounded-2xl border border-slate-150 p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] font-bold">إجمالي الإعلانات</span>
                    <span className="text-lg">📢</span>
                  </div>
                  <span className="text-3xl font-extrabold text-blue-600 mt-4 block">{ads.length}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-150 p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span>المساحات الإعلانية النشطة</span>
                  </h3>
                  <div className="space-y-3.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">الإعلانات النشطة:</span>
                      <span className="text-emerald-600">{ads.filter(a => a.isActive).length} من {ads.length}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">شريط الإعلانات المتحرك (Ticker):</span>
                      <span className="text-slate-800 font-bold">{ads.filter(a => a.isActive && a.position === 'ticker').length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-150 p-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-800"></span>
                    <span>النظام والتشغيل</span>
                  </h3>
                  <div className="space-y-3.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">سرعة شريط الإعلانات (Ticker Delay):</span>
                      <span className="text-slate-800 font-bold">{config.tickerSpeed} ثوانٍ</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-500">إجمالي عمليات السجل المحفوظة:</span>
                      <span className="text-slate-800 font-bold">{logs.length} عملية</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === SUB-TAB: REQUESTS MANAGEMENT === */}
          {activeSubTab === 'requests' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">طلبات إضافة الخدمات الطبية</h2>
                  <p className="text-slate-500 text-xs mt-1 font-semibold">مراجعة طلبات الانضمام لجميع الخدمات الطبية والتحقق منها قبل النشر</p>
                </div>
                
                {/* Pending requests count badge */}
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3.5 py-1.5 rounded-full border border-amber-200 shadow-sm">
                  {doctorRequests.filter(r => r.status === 'pending').length} طلبات قيد المراجعة
                </span>
              </div>

              {/* Edit Request Form (Only displayed when active) */}
              {editingRequestId && (
                <form onSubmit={saveEditedRequest} className="bg-amber-50/40 border border-amber-100 rounded-2xl p-6 space-y-4 animate-fadeIn">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Edit2 className="h-4.5 w-4.5 text-amber-600" />
                    <span>تعديل بيانات طلب الإضافة (الرقم: {editingRequestId})</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* نوع الخدمة */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">نوع الخدمة *</label>
                      <select
                        value={editingRequestForm.serviceType || 'doctor'}
                        onChange={e => setEditingRequestForm({ ...editingRequestForm, serviceType: e.target.value as any })}
                        className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      >
                        <option value="doctor">طبيب</option>
                        <option value="pharmacy">صيدلية</option>
                        <option value="lab">معمل تحاليل</option>
                        <option value="scan_center">مركز أشعة</option>
                        <option value="hospital">مستشفى</option>
                        <option value="physiotherapy">مركز علاج طبيعي</option>
                        <option value="other">خدمة طبية أخرى</option>
                      </select>
                    </div>

                    {/* حقول طبيب */}
                    {editingRequestForm.serviceType === 'doctor' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">اسم الطبيب *</label>
                          <input
                            type="text"
                            required
                            value={editingRequestForm.name}
                            onChange={e => setEditingRequestForm({ ...editingRequestForm, name: e.target.value })}
                            className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">التخصص الطبي *</label>
                          <input
                            type="text"
                            required
                            value={editingRequestForm.specialty}
                            onChange={e => setEditingRequestForm({ ...editingRequestForm, specialty: e.target.value })}
                            className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-600 mb-1">اسم العيادة</label>
                          <input
                            type="text"
                            value={editingRequestForm.clinicName}
                            onChange={e => setEditingRequestForm({ ...editingRequestForm, clinicName: e.target.value })}
                            className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                      </>
                    )}

                    {/* حقول صيدلية */}
                    {editingRequestForm.serviceType === 'pharmacy' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">اسم الصيدلية *</label>
                          <input
                            type="text"
                            required
                            value={editingRequestForm.name}
                            onChange={e => setEditingRequestForm({ ...editingRequestForm, name: e.target.value })}
                            className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">اسم الصيدلي (اختياري)</label>
                          <input
                            type="text"
                            value={editingRequestForm.pharmacistName}
                            onChange={e => setEditingRequestForm({ ...editingRequestForm, pharmacistName: e.target.value })}
                            className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                      </>
                    )}

                    {/* حقول معمل */}
                    {editingRequestForm.serviceType === 'lab' && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">اسم المعمل *</label>
                        <input
                          type="text"
                          required
                          value={editingRequestForm.name}
                          onChange={e => setEditingRequestForm({ ...editingRequestForm, name: e.target.value })}
                          className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    )}

                    {/* حقول مركز أشعة */}
                    {editingRequestForm.serviceType === 'scan_center' && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">اسم مركز الأشعة *</label>
                        <input
                          type="text"
                          required
                          value={editingRequestForm.name}
                          onChange={e => setEditingRequestForm({ ...editingRequestForm, name: e.target.value })}
                          className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    )}

                    {/* حقول مستشفى */}
                    {editingRequestForm.serviceType === 'hospital' && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">اسم المستشفى *</label>
                        <input
                          type="text"
                          required
                          value={editingRequestForm.name}
                          onChange={e => setEditingRequestForm({ ...editingRequestForm, name: e.target.value })}
                          className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    )}

                    {/* حقول مركز علاج طبيعي */}
                    {editingRequestForm.serviceType === 'physiotherapy' && (
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1">اسم مركز العلاج الطبيعي *</label>
                        <input
                          type="text"
                          required
                          value={editingRequestForm.name}
                          onChange={e => setEditingRequestForm({ ...editingRequestForm, name: e.target.value })}
                          className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    )}

                    {/* حقول خدمة أخرى */}
                    {editingRequestForm.serviceType === 'other' && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">اسم الخدمة الطبية *</label>
                          <input
                            type="text"
                            required
                            value={editingRequestForm.name}
                            onChange={e => setEditingRequestForm({ ...editingRequestForm, name: e.target.value })}
                            className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">وصف مختصر للخدمة *</label>
                          <input
                            type="text"
                            required
                            value={editingRequestForm.shortDescription}
                            onChange={e => setEditingRequestForm({ ...editingRequestForm, shortDescription: e.target.value })}
                            className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                      </>
                    )}

                    {/* حقول الهاتف والعنوان */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">رقم الهاتف للاتصال والاستعلام *</label>
                      <input
                        type="text"
                        required
                        value={editingRequestForm.phone}
                        onChange={e => setEditingRequestForm({ ...editingRequestForm, phone: e.target.value })}
                        className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                        dir="ltr"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">العنوان بالتفصيل *</label>
                      <input
                        type="text"
                        required
                        value={editingRequestForm.address}
                        onChange={e => setEditingRequestForm({ ...editingRequestForm, address: e.target.value })}
                        className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">ملاحظات العضو مقدم الطلب</label>
                      <textarea
                        rows={2}
                        value={editingRequestForm.notes}
                        onChange={e => setEditingRequestForm({ ...editingRequestForm, notes: e.target.value })}
                        className="w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3.5 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingRequestId(null)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-white px-4 py-2 rounded-xl border"
                    >
                      إلغاء التعديل
                    </button>
                    <button
                      type="submit"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm flex items-center gap-1"
                    >
                      <Save className="h-4 w-4" />
                      <span>حفظ التعديلات</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Reject Request Reason Form (Only displayed when active) */}
              {rejectionId && (
                <form onSubmit={submitRejection} className="bg-rose-50/40 border border-rose-100 rounded-2xl p-6 space-y-4 animate-fadeIn">
                  <h3 className="text-sm font-extrabold text-rose-800 flex items-center gap-1.5">
                    <XCircle className="h-4.5 w-4.5 text-rose-600" />
                    <span>رفض طلب الإضافة (الرقم: {rejectionId})</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">سبب رفض الطلب بالتفصيل (سيظهر لصاحب الطلب) *</label>
                    <textarea
                      required
                      rows={3}
                      value={rejectionReasonInput}
                      onChange={e => setRejectionReasonInput(e.target.value)}
                      placeholder="مثال: تعذر التواصل مع رقم الهاتف المرفق لتأكيد صحة المسمى الوظيفي..."
                      className="w-full bg-white border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => { setRejectionId(null); setRejectionReasonInput(''); }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-800 bg-white px-4 py-2 rounded-xl border"
                    >
                      تراجع
                    </button>
                    <button
                      type="submit"
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm"
                    >
                      تسجيل الرفض وإرسال السبب
                    </button>
                  </div>
                </form>
              )}

              {/* Search & Filter Block */}
              <div className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm flex items-center gap-3">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={requestSearch}
                  onChange={e => setRequestSearch(e.target.value)}
                  placeholder="البحث برقم الطلب أو الاسم أو التخصص..."
                  className="w-full bg-transparent border-none text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none text-sm"
                />
                {requestSearch && (
                  <button
                    onClick={() => setRequestSearch('')}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 hover:underline"
                  >
                    مسح البحث
                  </button>
                )}
              </div>

              {/* Requests List */}
              {(() => {
                const query = requestSearch.trim().toLowerCase();
                const filtered = doctorRequests.filter(r => 
                  !query || 
                  r.id.toLowerCase().includes(query) || 
                  r.name.toLowerCase().includes(query) ||
                  (r.specialty || '').toLowerCase().includes(query) ||
                  (r.pharmacistName || '').toLowerCase().includes(query) ||
                  (r.shortDescription || '').toLowerCase().includes(query)
                );

                if (filtered.length === 0) {
                  return (
                    <div className="bg-white border rounded-2xl p-12 text-center text-slate-400 font-semibold space-y-2">
                      <ClipboardList className="h-10 w-10 mx-auto text-slate-300" />
                      <p className="text-sm">لا يوجد أي طلبات تطابق معايير البحث الحالية.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {filtered.map((req) => {
                      const serviceTypeLabels: Record<string, string> = {
                        doctor: 'طبيب',
                        pharmacy: 'صيدلية',
                        lab: 'معمل تحاليل',
                        scan_center: 'مركز أشعة',
                        hospital: 'مستشفى',
                        physiotherapy: 'مركز علاج طبيعي',
                        other: 'خدمة طبية أخرى'
                      };
                      const typeLabel = serviceTypeLabels[req.serviceType || 'doctor'] || 'خدمة طبية';

                      return (
                        <div key={req.id} className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm space-y-4 animate-fadeIn hover:border-slate-300 transition-colors">
                          
                          {/* Row 1: Header (ID, Name, Date, Status badge) */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-mono text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border">
                                {req.id}
                              </span>
                              <span className="bg-emerald-50 text-emerald-800 text-[10.5px] font-black px-2.5 py-1 rounded-lg border border-emerald-200">
                                نوع الخدمة: {typeLabel}
                              </span>
                              <h3 className="text-base font-extrabold text-slate-900">{req.name}</h3>
                            </div>
                            
                            <div className="flex items-center gap-2.5 justify-between sm:justify-start">
                              <span className="text-[11px] font-semibold text-slate-400">
                                {new Date(req.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                              
                              {/* Badges */}
                              {req.status === 'pending' && (
                                <span className="bg-amber-50 text-amber-800 text-[10.5px] font-black px-3 py-1 rounded-full border border-amber-200">
                                  قيد المراجعة
                                </span>
                              )}
                              {req.status === 'accepted' && (
                                <span className="bg-blue-50 text-blue-800 text-[10.5px] font-black px-3 py-1 rounded-full border border-blue-200">
                                  مقبول (قيد النشر)
                                </span>
                              )}
                              {req.status === 'published' && (
                                <span className="bg-emerald-50 text-emerald-800 text-[10.5px] font-black px-3 py-1 rounded-full border border-emerald-200">
                                  منشور بالدليل العام
                                </span>
                              )}
                              {req.status === 'rejected' && (
                                <span className="bg-rose-50 text-rose-800 text-[10.5px] font-black px-3 py-1 rounded-full border border-rose-200">
                                  مرفوض
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Row 2: Details metadata */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-xl">
                            <div>
                              <span className="text-[9.5px] font-black text-slate-400 block mb-0.5">نوع الطلب</span>
                              <span className="text-slate-800 font-bold">{typeLabel}</span>
                            </div>

                            {(!req.serviceType || req.serviceType === 'doctor') && (
                              <>
                                <div>
                                  <span className="text-[9.5px] font-black text-slate-400 block mb-0.5">التخصص</span>
                                  <span className="text-slate-800 font-bold">{req.specialty || 'تخصص عام'}</span>
                                </div>
                                <div>
                                  <span className="text-[9.5px] font-black text-slate-400 block mb-0.5">العيادة</span>
                                  <span className="text-slate-800 font-bold">{req.clinicName || 'عيادة خاصة'}</span>
                                </div>
                              </>
                            )}
                            {req.serviceType === 'pharmacy' && (
                              <>
                                <div>
                                  <span className="text-[9.5px] font-black text-slate-400 block mb-0.5">الصيدلي المسؤول</span>
                                  <span className="text-slate-800 font-bold">{req.pharmacistName || 'غير محدد'}</span>
                                </div>
                                <div>
                                  <span className="text-[9.5px] font-black text-slate-400 block mb-0.5">نوع الدليل</span>
                                  <span className="text-slate-800 font-bold">دليل الصيدليات</span>
                                </div>
                              </>
                            )}
                            {req.serviceType === 'other' && (
                              <div className="sm:col-span-2">
                                <span className="text-[9.5px] font-black text-slate-400 block mb-0.5">وصف الخدمة</span>
                                <span className="text-slate-800 font-bold block truncate">{req.shortDescription || 'لا يوجد وصف'}</span>
                              </div>
                            )}
                            {req.serviceType !== 'doctor' && req.serviceType !== 'pharmacy' && req.serviceType !== 'other' && (
                              <>
                                <div>
                                  <span className="text-[9.5px] font-black text-slate-400 block mb-0.5">المرفق الطبي</span>
                                  <span className="text-slate-800 font-bold">{typeLabel}</span>
                                </div>
                                <div>
                                  <span className="text-[9.5px] font-black text-slate-400 block mb-0.5">نوع الدليل</span>
                                  <span className="text-slate-800 font-bold">المعامل ومراكز الأشعة</span>
                                </div>
                              </>
                            )}

                            <div>
                              <span className="text-[9.5px] font-black text-slate-400 block mb-0.5">الهاتف</span>
                              <span className="font-mono text-left block text-emerald-600 font-bold" dir="ltr">{req.phone}</span>
                            </div>
                            <div>
                              <span className="text-[9.5px] font-black text-slate-400 block mb-0.5">العنوان بالتفصيل</span>
                              <span className="text-slate-800 font-bold truncate block">{req.address}</span>
                            </div>
                          </div>

                          {/* Optional notes/rejection display */}
                          {req.notes && (
                            <div className="text-xs text-slate-500 leading-relaxed font-semibold">
                              💡 <span className="font-bold text-slate-700">ملاحظات مقدم الطلب:</span> {req.notes}
                            </div>
                          )}

                          {req.status === 'rejected' && req.rejectionReason && (
                            <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-xs text-rose-800 leading-relaxed font-bold">
                              ⚠️ سبب الرفض الموجه للزائر: {req.rejectionReason}
                            </div>
                          )}

                          {/* Row 3: Action Buttons */}
                          <div className="flex flex-wrap justify-between items-center gap-3 border-t pt-3.5 border-slate-100">
                            
                            <div className="flex gap-2.5">
                              {/* Edit request data */}
                              <button
                                onClick={() => startEditingRequest(req)}
                                className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                                <span>تعديل</span>
                              </button>

                              {/* Delete request */}
                              <button
                                onClick={() => deleteDoctorRequest(req.id, req.name)}
                                className="text-xs bg-rose-50/60 hover:bg-rose-100/80 text-rose-700 border border-rose-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                <span>حذف</span>
                              </button>
                            </div>

                            <div className="flex gap-2.5">
                              {/* Accept request & publish (Immediate add to database) */}
                              {req.status !== 'published' && (
                                <button
                                  onClick={() => acceptAndPublishRequest(req)}
                                  className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-extrabold shadow-sm flex items-center gap-1 transition-all"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>قبول ونشر بالدليل مباشرة</span>
                                </button>
                              )}

                              {/* Accept only (accepted status) */}
                              {req.status === 'pending' && (
                                <button
                                  onClick={() => acceptRequestOnly(req.id, req.name)}
                                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-lg font-bold shadow-sm transition-colors"
                                >
                                  قبول مؤقت
                                </button>
                              )}

                              {/* Reject request action */}
                              {req.status !== 'rejected' && req.status !== 'published' && (
                                <button
                                  onClick={() => setRejectionId(req.id)}
                                  className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-lg font-bold shadow-sm transition-colors"
                                >
                                  رفض الطلب
                                </button>
                              )}
                            </div>

                          </div>

                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: DOCTORS CRUD */}
          {activeSubTab === 'doctors' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-xl font-bold text-slate-900">إدارة الأطباء والعيادات</h2>
                {!editingId && (
                  <button 
                    onClick={() => {
                      setEditingId('new');
                      setDocForm({ name: '', specialty: specialties[0] || '', clinicName: '', address: '', phone: '', whatsapp: '' });
                    }}
                    className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold px-3 py-2 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة طبيب جديد</span>
                  </button>
                )}
              </div>

              {/* Form panel */}
              {editingId && (
                <form onSubmit={saveDoctor} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800">{editingId === 'new' ? 'إدراج طبيب جديد' : 'تحديث بيانات الطبيب'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">اسم الطبيب بالكامل *</label>
                      <input 
                        type="text" required value={docForm.name} 
                        onChange={e => setDocForm({...docForm, name: e.target.value})}
                        placeholder="مثال: د. أحمد فؤاد"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">التخصص الطبي *</label>
                      <select 
                        value={docForm.specialty} 
                        onChange={e => setDocForm({...docForm, specialty: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {specialties.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">اسم العيادة</label>
                      <input 
                        type="text" value={docForm.clinicName} 
                        onChange={e => setDocForm({...docForm, clinicName: e.target.value})}
                        placeholder="مثال: عيادة النخبة لطب الأطفال"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">عنوان العيادة بالوقف بالتفصيل *</label>
                      <input 
                        type="text" required value={docForm.address} 
                        onChange={e => setDocForm({...docForm, address: e.target.value})}
                        placeholder="مثال: شارع بورسعيد، أمام البنك الأهلي"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">رقم الهاتف للاتصال *</label>
                      <input 
                        type="text" required value={docForm.phone} 
                        onChange={e => setDocForm({...docForm, phone: e.target.value})}
                        placeholder="مثال: 01012345678"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">رقم الواتساب (بدون أصفار أو زائد - اختياري)</label>
                      <input 
                        type="text" value={docForm.whatsapp} 
                        onChange={e => setDocForm({...docForm, whatsapp: e.target.value})}
                        placeholder="مثال: 201012345678"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-lg">حفظ البيانات</button>
                    <button type="button" onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 text-xs py-2 px-4 rounded-lg">إلغاء</button>
                  </div>
                </form>
              )}

              {/* Grid / Table List */}
              <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-xs font-extrabold text-slate-500">
                      <th className="p-4">الاسم</th>
                      <th className="p-4">التخصص / العيادة</th>
                      <th className="p-4">رقم الاتصال</th>
                      <th className="p-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {doctors.map((d) => (
                      <tr key={d.id} className={`hover:bg-slate-50/55 transition-colors ${d.hidden ? 'bg-slate-50/40 opacity-70' : ''}`}>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{d.name}</span>
                            {d.hidden && (
                              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200">مخفي</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-emerald-600">{d.specialty}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{d.clinicName}</div>
                        </td>
                        <td className="p-4 font-mono text-xs">{d.phone}</td>
                        <td className="p-4 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => toggleDoctorVisibility(d.id, d.name, d.hidden)}
                              className={`p-1.5 rounded transition-colors ${d.hidden ? 'text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:bg-slate-50'}`}
                              title={d.hidden ? "إظهار" : "إخفاء"}
                            >
                              {d.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button 
                              onClick={() => {
                                setEditingId(d.id);
                                setDocForm({
                                  name: d.name,
                                  specialty: d.specialty,
                                  clinicName: d.clinicName || '',
                                  address: d.address,
                                  phone: d.phone,
                                  whatsapp: d.whatsapp || ''
                                });
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="تعديل"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteDoctor(d.id, d.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PHARMACIES CRUD */}
          {activeSubTab === 'pharmacies' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-xl font-bold text-slate-900">إدارة الصيدليات</h2>
                {!editingId && (
                  <button 
                    onClick={() => {
                      setEditingId('new');
                      setPharmForm({ name: '', address: '', phone: '', whatsapp: '' });
                    }}
                    className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold px-3 py-2 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة صيدلية جديدة</span>
                  </button>
                )}
              </div>

              {editingId && (
                <form onSubmit={savePharmacy} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800">{editingId === 'new' ? 'إضافة صيدلية جديدة' : 'تحديث بيانات الصيدلية'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">اسم الصيدلية *</label>
                      <input 
                        type="text" required value={pharmForm.name} 
                        onChange={e => setPharmForm({...pharmForm, name: e.target.value})}
                        placeholder="مثال: صيدلية الأمل"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">العنوان بالتفصيل *</label>
                      <input 
                        type="text" required value={pharmForm.address} 
                        onChange={e => setPharmForm({...pharmForm, address: e.target.value})}
                        placeholder="مثال: شارع المحطة، أمام مجلس المدينة"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">رقم الهاتف للاتصال *</label>
                      <input 
                        type="text" required value={pharmForm.phone} 
                        onChange={e => setPharmForm({...pharmForm, phone: e.target.value})}
                        placeholder="مثال: 0961234567"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">رقم الواتساب (اختياري - بدون زائد)</label>
                      <input 
                        type="text" value={pharmForm.whatsapp} 
                        onChange={e => setPharmForm({...pharmForm, whatsapp: e.target.value})}
                        placeholder="مثال: 201012345678"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-lg">حفظ البيانات</button>
                    <button type="button" onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 text-xs py-2 px-4 rounded-lg">إلغاء</button>
                  </div>
                </form>
              )}

              <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-xs font-extrabold text-slate-500">
                      <th className="p-4">اسم الصيدلية</th>
                      <th className="p-4">العنوان بالكامل</th>
                      <th className="p-4">رقم الاتصال</th>
                      <th className="p-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {pharmacies.map((p) => (
                      <tr key={p.id} className={`hover:bg-slate-50/55 transition-colors ${p.hidden ? 'bg-slate-50/40 opacity-70' : ''}`}>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {p.hidden && (
                              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200">مخفي</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 text-xs">{p.address}</td>
                        <td className="p-4 font-mono text-xs">{p.phone}</td>
                        <td className="p-4 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => togglePharmacyVisibility(p.id, p.name, p.hidden)}
                              className={`p-1.5 rounded transition-colors ${p.hidden ? 'text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:bg-slate-50'}`}
                              title={p.hidden ? "إظهار" : "إخفاء"}
                            >
                              {p.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button 
                              onClick={() => {
                                setEditingId(p.id);
                                setPharmForm({
                                  name: p.name,
                                  address: p.address,
                                  phone: p.phone,
                                  whatsapp: p.whatsapp || ''
                                });
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="تعديل"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deletePharmacy(p.id, p.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: LABS CRUD */}
          {activeSubTab === 'labs' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-xl font-bold text-slate-900">إدارة معامل التحاليل</h2>
                {!editingId && (
                  <button 
                    onClick={() => {
                      setEditingId('new');
                      setLabForm({ name: '', address: '', phone: '', whatsapp: '' });
                    }}
                    className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold px-3 py-2 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة معمل جديد</span>
                  </button>
                )}
              </div>

              {editingId && (
                <form onSubmit={saveLab} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800">{editingId === 'new' ? 'إضافة معمل جديد' : 'تحديث بيانات المعمل'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">اسم معمل التحاليل *</label>
                      <input 
                        type="text" required value={labForm.name} 
                        onChange={e => setLabForm({...labForm, name: e.target.value})}
                        placeholder="مثال: معمل البرج الطبي"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">العنوان بالتفصيل *</label>
                      <input 
                        type="text" required value={labForm.address} 
                        onChange={e => setLabForm({...labForm, address: e.target.value})}
                        placeholder="مثال: شارع بورسعيد، الدور الثاني"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">رقم الهاتف للاتصال *</label>
                      <input 
                        type="text" required value={labForm.phone} 
                        onChange={e => setLabForm({...labForm, phone: e.target.value})}
                        placeholder="مثال: 01011223344"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">رقم الواتساب (اختياري - بدون زائد)</label>
                      <input 
                        type="text" value={labForm.whatsapp} 
                        onChange={e => setLabForm({...labForm, whatsapp: e.target.value})}
                        placeholder="مثال: 201011223344"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-lg">حفظ البيانات</button>
                    <button type="button" onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 text-xs py-2 px-4 rounded-lg">إلغاء</button>
                  </div>
                </form>
              )}

              <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-xs font-extrabold text-slate-500">
                      <th className="p-4">اسم المعمل</th>
                      <th className="p-4">العنوان بالكامل</th>
                      <th className="p-4">رقم الاتصال</th>
                      <th className="p-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {labs.map((l) => (
                      <tr key={l.id} className={`hover:bg-slate-50/55 transition-colors ${l.hidden ? 'bg-slate-50/40 opacity-70' : ''}`}>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{l.name}</span>
                            {l.hidden && (
                              <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200">مخفي</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 text-xs">{l.address}</td>
                        <td className="p-4 font-mono text-xs">{l.phone}</td>
                        <td className="p-4 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => toggleLabVisibility(l.id, l.name, l.hidden)}
                              className={`p-1.5 rounded transition-colors ${l.hidden ? 'text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:bg-slate-50'}`}
                              title={l.hidden ? "إظهار" : "إخفاء"}
                            >
                              {l.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button 
                              onClick={() => {
                                setEditingId(l.id);
                                setLabForm({
                                  name: l.name,
                                  address: l.address,
                                  phone: l.phone,
                                  whatsapp: l.whatsapp || ''
                                });
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="تعديل"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteLab(l.id, l.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SPECIALTIES */}
          {activeSubTab === 'specialties' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-2">إدارة تخصصات الأطباء</h2>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">إدراج تصنيف طبي جديد</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newSpecialty}
                    onChange={e => setNewSpecialty(e.target.value)}
                    placeholder="مثال: مخ وأعصاب، قلب ومفاصل..."
                    className="flex-1 bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button 
                    onClick={addSpecialty}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1 shrink-0"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>إضافة تخصص</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-150 p-6">
                <h3 className="font-bold text-slate-800 text-sm mb-4">التخصصات الطبية الحالية</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {specialties.map((spec, index) => (
                    <div key={index} className="flex justify-between items-center bg-slate-50 border p-3 rounded-xl hover:border-slate-300 transition-all text-sm font-semibold text-slate-700">
                      <span>{spec}</span>
                      <button 
                        onClick={() => deleteSpecialty(spec)}
                        className="text-rose-600 p-1 hover:bg-rose-50 rounded"
                        title="حذف التخصص"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ADS CRUD */}
          {activeSubTab === 'ads' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-xl font-bold text-slate-900">إدارة الحملات والمساحات الإعلانية</h2>
                {!editingId && (
                  <button 
                    onClick={() => {
                      setEditingId('new');
                      setAdForm({ title: '', content: '', link: '', position: 'ticker', isActive: true });
                    }}
                    className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold px-3 py-2 rounded-lg"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة إعلان جديد</span>
                  </button>
                )}
              </div>

              {editingId && (
                <form onSubmit={saveAd} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800">{editingId === 'new' ? 'إضافة إعلان جديد' : 'تحديث محتوى الإعلان'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">عنوان الإعلان الرئيسي *</label>
                      <input 
                        type="text" required value={adForm.title} 
                        onChange={e => setAdForm({...adForm, title: e.target.value})}
                        placeholder="مثال: خصم 20% على باقة التحاليل الشاملة"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">نص ومحتوى الإعلان بالتفصيل *</label>
                      <textarea 
                        required value={adForm.content} 
                        onChange={e => setAdForm({...adForm, content: e.target.value})}
                        rows={3}
                        placeholder="اكتب تفاصيل الإعلان والخصومات وطرق التواصل هنا..."
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">موضع ظهور الإعلان في الدليل *</label>
                      <select 
                        value={adForm.position} 
                        onChange={e => setAdForm({...adForm, position: e.target.value as any})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
                      >
                        <option value="top">بانر أعلى الصفحة الرئيسية</option>
                        <option value="bottom">بانر أسفل الصفحة الرئيسية</option>
                        <option value="ticker">شريط الإعلانات المتحرك بالتناوب (Ticker)</option>
                        <option value="search_middle">إعلان بين نتائج البحث</option>
                        <option value="card_doctor">داخل صفحات/كروت الأطباء</option>
                        <option value="card_pharmacy">داخل صفحات/كروت الصيدليات</option>
                        <option value="card_lab">داخل صفحات/كروت المعامل</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">رابط الإعلان الاختياري (أو اترك علامة #)</label>
                      <input 
                        type="text" value={adForm.link} 
                        onChange={e => setAdForm({...adForm, link: e.target.value})}
                        placeholder="مثال: # أو رابط موقع الجهة"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-lg">حفظ الإعلان</button>
                    <button type="button" onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 text-xs py-2 px-4 rounded-lg">إلغاء</button>
                  </div>
                </form>
              )}

              <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-xs font-extrabold text-slate-500">
                      <th className="p-4">عنوان الإعلان</th>
                      <th className="p-4">موضع الظهور</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {ads.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/55 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800">{a.title}</div>
                          <div className="text-xs text-slate-400 mt-1 truncate max-w-sm">{a.content}</div>
                        </td>
                        <td className="p-4 font-bold text-xs text-emerald-600">
                          {a.position === 'top' ? 'بانر علوي' :
                           a.position === 'bottom' ? 'بانر سفلي' :
                           a.position === 'ticker' ? 'شريط متحرك' :
                           a.position === 'search_middle' ? 'بين البحث' :
                           a.position === 'card_doctor' ? 'كارت طبيب' :
                           a.position === 'card_pharmacy' ? 'كارت صيدلية' : 'كارت معمل'}
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => toggleAdStatus(a.id, a.isActive, a.title)}
                            className={`px-2.5 py-1 rounded-full text-xs font-extrabold transition-all ${
                              a.isActive 
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' 
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {a.isActive ? 'مفعّل نشط' : 'معطّل'}
                          </button>
                        </td>
                        <td className="p-4 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => {
                                setEditingId(a.id);
                                setAdForm({
                                  title: a.title,
                                  content: a.content,
                                  link: a.link || '#',
                                  position: a.position,
                                  isActive: a.isActive
                                });
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              title="تعديل"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteAd(a.id, a.title)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded animate-none"
                              title="حذف"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS & BACKUP */}
          {activeSubTab === 'settings' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-2">النسخ الاحتياطي واستعادة البيانات</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Backup Box */}
                <div className="bg-white rounded-2xl border border-slate-150 p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                      <Download className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1">نسخ احتياطي للبيانات</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">تحميل نسخة احتياطية كاملة من الدليل (الأطباء، الصيدليات، المعامل، الإعلانات والتخصصات) في ملف خارجي بصيغة JSON لحفظها أو نقلها.</p>
                  </div>
                  <button 
                    onClick={handleExportData}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="h-4.5 w-4.5" />
                    <span>تصدير البيانات احتياطياً</span>
                  </button>
                </div>

                {/* Restore Box */}
                <div className="bg-white rounded-2xl border border-slate-150 p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                      <Upload className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1">استعادة نسخة احتياطية</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">رفع ملف نسخة احتياطية بصيغة JSON سابق لاستعادة جميع البيانات فوراً. تنبيه: هذا الإجراء سيستبدل جميع البيانات الحالية في الدليل.</p>
                  </div>
                  
                  <div>
                    <input 
                      type="file" 
                      accept=".json"
                      ref={fileInputRef}
                      onChange={handleImportData}
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-2.5 px-4 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="h-4.5 w-4.5" />
                      <span>استيراد ملف البيانات</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Comprehensive Site Content, Style, Reorder and Security Manager */}
              <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-8">
                <div>
                  <h3 className="font-black text-slate-900 text-base">إدارة محتوى وهوية وألوان الدليل بالكامل</h3>
                  <p className="text-slate-400 text-xs mt-1 font-semibold leading-relaxed">تحكم في هوية المنصة، الشعار، الألوان، محتوى الصفحات الفرعية، وترتيب الأقسام دون كتابة أي كود.</p>
                </div>

                {/* Section 1: Branding & Theme Styling */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded">🎨</span>
                    <span>1. إعدادات الهوية والبصرية والألوان</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">اسم الموقع</label>
                      <input 
                        type="text" 
                        value={config.siteName || ''}
                        onChange={e => onUpdateConfig({...config, siteName: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                        placeholder="دليل الوقف الطبي"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">نص الشعار بالرأس</label>
                      <input 
                        type="text" 
                        value={config.siteLogoText || ''}
                        onChange={e => onUpdateConfig({...config, siteLogoText: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                        placeholder="دليل الوقف الطبي"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">أيقونة الشعار</label>
                      <select 
                        value={config.siteLogoIcon || 'HeartPulse'}
                        onChange={e => onUpdateConfig({...config, siteLogoIcon: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
                      >
                        <option value="HeartPulse">نبض القلب (HeartPulse)</option>
                        <option value="Stethoscope">سماعة طبيب (Stethoscope)</option>
                        <option value="Pill">كبسولة دواء (Pill)</option>
                        <option value="FlaskConical">دورق معملي (FlaskConical)</option>
                        <option value="ShieldCheck">درع الحماية (ShieldCheck)</option>
                        <option value="Activity">مؤشر نشاط (Activity)</option>
                        <option value="Heart">قلب بسيط (Heart)</option>
                        <option value="Cross">علامة زائد طبية (PlusCircle)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">اللون الأساسي للموقع</label>
                      <select 
                        value={config.themeColor || 'emerald'}
                        onChange={e => {
                          onUpdateConfig({...config, themeColor: e.target.value as any});
                          onShowToast(`✔️ تم تغيير السمة اللونية إلى: ${e.target.value}`);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
                      >
                        <option value="emerald">أخضر زمردي (Emerald)</option>
                        <option value="blue">أزرق سماوي (Blue)</option>
                        <option value="purple">أرجواني ملكي (Purple)</option>
                        <option value="rose">وردي جذاب (Rose)</option>
                        <option value="amber">ذهبي دافئ (Amber)</option>
                        <option value="indigo">نيلي كلاسيكي (Indigo)</option>
                        <option value="slate">رمادي صخري (Slate)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">نوع خلفية الموقع</label>
                      <select 
                        value={config.themeBackground || 'light'}
                        onChange={e => {
                          onUpdateConfig({...config, themeBackground: e.target.value as any});
                          onShowToast(`✔️ تم تغيير مظهر الخلفية إلى: ${e.target.value}`);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
                      >
                        <option value="light">أبيض ناصع (Light)</option>
                        <option value="neutral">رمادي خفيف (Neutral Slate)</option>
                        <option value="warm">بيج دافئ (Warm Amber)</option>
                        <option value="dark">داكن ليلي (Dark Cosmic)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">سرعة الشريط الإعلاني بالثواني</label>
                      <input 
                        type="number" 
                        min={2}
                        max={30}
                        value={config.tickerSpeed}
                        onChange={e => onUpdateConfig({...config, tickerSpeed: parseInt(e.target.value) || 4})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Banner text contents */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded">✍️</span>
                    <span>2. نصوص واجهة البانر الرئيسي (Hero Content)</span>
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">عنوان الترحيب الرئيسي</label>
                      <input 
                        type="text" 
                        value={config.heroTitle}
                        onChange={e => onUpdateConfig({...config, heroTitle: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">الوصف الفرعي المصاحب</label>
                      <textarea 
                        rows={2}
                        value={config.heroSubtitle}
                        onChange={e => onUpdateConfig({...config, heroSubtitle: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Site static pages */}
                <div className="border-t pt-6 space-y-6">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded">📄</span>
                    <span>3. تعديل صفحات الموقع الإدارية والمعلوماتية</span>
                  </h4>

                  {/* About page content */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs text-slate-700">صفحة (من نحن)</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">العنوان الرئيسي</label>
                        <input 
                          type="text" 
                          value={config.aboutTitle || ''}
                          onChange={e => onUpdateConfig({...config, aboutTitle: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">العنوان الفرعي</label>
                        <input 
                          type="text" 
                          value={config.aboutSubtitle || ''}
                          onChange={e => onUpdateConfig({...config, aboutSubtitle: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">النص التعريفي بالتفصيل (يدعم أسطر متعددة)</label>
                      <textarea 
                        rows={4}
                        value={config.aboutText || ''}
                        onChange={e => onUpdateConfig({...config, aboutText: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Contact page content */}
                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h5 className="font-bold text-xs text-slate-700">صفحة (اتصل بنا) وبيانات الإدارة ومواقع التواصل</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">العنوان</label>
                        <input 
                          type="text" 
                          value={config.contactTitle || ''}
                          onChange={e => onUpdateConfig({...config, contactTitle: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">الوصف الفرعي</label>
                        <input 
                          type="text" 
                          value={config.contactSubtitle || ''}
                          onChange={e => onUpdateConfig({...config, contactSubtitle: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">الهاتف للإدارة والواتساب</label>
                        <input 
                          type="text" 
                          value={config.contactPhone || ''}
                          onChange={e => onUpdateConfig({...config, contactPhone: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">البريد الإلكتروني للإدارة</label>
                        <input 
                          type="text" 
                          value={config.contactEmail || ''}
                          onChange={e => onUpdateConfig({...config, contactEmail: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">مقر الإدارة بالوقف</label>
                        <input 
                          type="text" 
                          value={config.contactAddress || ''}
                          onChange={e => onUpdateConfig({...config, contactAddress: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">ساعات عمل الدعم</label>
                        <input 
                          type="text" 
                          value={config.contactWorkingHours || ''}
                          onChange={e => onUpdateConfig({...config, contactWorkingHours: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="border-t pt-3 mt-3">
                      <h6 className="font-extrabold text-[11px] text-slate-600 mb-2">روابط شبكات التواصل الاجتماعي للتواصل</h6>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 mb-0.5">فيسبوك (Facebook)</label>
                          <input 
                            type="text" 
                            value={config.socialFacebook || ''}
                            onChange={e => onUpdateConfig({...config, socialFacebook: e.target.value})}
                            placeholder="https://facebook.com/..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 mb-0.5">رابط واتساب فوري</label>
                          <input 
                            type="text" 
                            value={config.socialWhatsapp || ''}
                            onChange={e => onUpdateConfig({...config, socialWhatsapp: e.target.value})}
                            placeholder="https://wa.me/..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 mb-0.5">يوتيوب (YouTube)</label>
                          <input 
                            type="text" 
                            value={config.socialYoutube || ''}
                            onChange={e => onUpdateConfig({...config, socialYoutube: e.target.value})}
                            placeholder="https://youtube.com/..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 mb-0.5">تويتر / إكس (Twitter)</label>
                          <input 
                            type="text" 
                            value={config.socialTwitter || ''}
                            onChange={e => onUpdateConfig({...config, socialTwitter: e.target.value})}
                            placeholder="https://twitter.com/..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-slate-400 mb-0.5">إنستجرام (Instagram)</label>
                          <input 
                            type="text" 
                            value={config.socialInstagram || ''}
                            onChange={e => onUpdateConfig({...config, socialInstagram: e.target.value})}
                            placeholder="https://instagram.com/..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Policy & Terms */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <h5 className="font-bold text-xs text-slate-700">صفحة (سياسة الخصوصية)</h5>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">العنوان</label>
                        <input 
                          type="text" 
                          value={config.privacyTitle || ''}
                          onChange={e => onUpdateConfig({...config, privacyTitle: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">النص التفصيلي للسياسة</label>
                        <textarea 
                          rows={4}
                          value={config.privacyText || ''}
                          onChange={e => onUpdateConfig({...config, privacyText: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 space-y-2">
                      <h5 className="font-bold text-xs text-slate-700">صفحة (الشروط والأحكام)</h5>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">العنوان</label>
                        <input 
                          type="text" 
                          value={config.termsTitle || ''}
                          onChange={e => onUpdateConfig({...config, termsTitle: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">النص التفصيلي للشروط</label>
                        <textarea 
                          rows={4}
                          value={config.termsText || ''}
                          onChange={e => onUpdateConfig({...config, termsText: e.target.value})}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4: Homepage sections order & toggles */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded">🔀</span>
                    <span>4. إدارة تشغيل وإعادة ترتيب أقسام الصفحة الرئيسية</span>
                  </h4>
                  <p className="text-slate-400 text-xs font-semibold">استخدم المفاتيح لتفعيل/تعطيل ظهور أي قسم بالصفحة الرئيسية، واستخدم الأسهم لإعادة ترتيب أولويات العرض من الأعلى للأسفل.</p>

                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-2.5">
                    {(() => {
                      const sectionsList = [
                        { id: 'ticker', label: 'شريط الإعلانات المتحرك العلوي (Ticker)' },
                        { id: 'top-ad', label: 'المساحة الإعلانية العلوية (Top Banner)' },
                        { id: 'hero', label: 'البانر الترحيبي والوصف (Hero Banner)' },
                        { id: 'search', label: 'صندوق البحث الموحد (Search Bar)' },
                        { id: 'services', label: 'روابط الخدمات الطبية السريعة (Quick Categories)' },
                        { id: 'middle-ad', label: 'المساحة الإعلانية الوسطى (Middle Banner)' },
                        { id: 'stats', label: 'إحصائيات المنصة السريعة (Stats Counter)' },
                        { id: 'featured', label: 'الأطباء المميزون الجدد (Featured Doctors)' }
                      ];
                      
                      const currentOrder = config.sectionsOrder || ['ticker', 'top-ad', 'hero', 'search', 'services', 'middle-ad', 'stats', 'featured'];
                      const disabledSections = config.disabledSections || [];

                      const toggleSection = (id: string) => {
                        let updated = [...disabledSections];
                        if (updated.includes(id)) {
                          updated = updated.filter(sid => sid !== id);
                        } else {
                          updated.push(id);
                        }
                        onUpdateConfig({ ...config, disabledSections: updated });
                        onShowToast(`✔️ تم تحديث حالة ظهور القسم بنجاح`);
                      };

                      const shiftSection = (idx: number, direction: 'up' | 'down') => {
                        const newOrder = [...currentOrder];
                        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
                        if (targetIdx < 0 || targetIdx >= newOrder.length) return;
                        const tmp = newOrder[idx];
                        newOrder[idx] = newOrder[targetIdx];
                        newOrder[targetIdx] = tmp;
                        onUpdateConfig({ ...config, sectionsOrder: newOrder });
                      };

                      return (
                        <div className="divide-y divide-slate-200">
                          {currentOrder.map((sectionId, idx) => {
                            const sectionInfo = sectionsList.find(s => s.id === sectionId);
                            if (!sectionInfo) return null;
                            const isEnabled = !disabledSections.includes(sectionId);
                            
                            return (
                              <div key={sectionId} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-mono text-slate-400 font-bold bg-white h-6 w-6 rounded-lg border flex items-center justify-center shadow-sm">{idx + 1}</span>
                                  <div>
                                    <strong className="text-xs text-slate-800 font-bold block">{sectionInfo.label}</strong>
                                    <span className="text-[10px] text-slate-400 font-bold">المعرف: {sectionId}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Visibility toggle button */}
                                  <button
                                    type="button"
                                    onClick={() => toggleSection(sectionId)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                                      isEnabled 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                    }`}
                                  >
                                    {isEnabled ? '● نشط وظاهر' : '○ مخفي ومعطل'}
                                  </button>

                                  {/* Shift Buttons */}
                                  <div className="flex items-center border rounded-xl bg-white shadow-sm overflow-hidden divide-x divide-slate-200">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => shiftSection(idx, 'up')}
                                      className="px-2.5 py-1.5 text-xs font-bold hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                                      title="نقل لأعلى"
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === currentOrder.length - 1}
                                      onClick={() => shiftSection(idx, 'down')}
                                      className="px-2.5 py-1.5 text-xs font-bold hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent"
                                      title="نقل لأسفل"
                                    >
                                      ↓
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Section 5: Admin Password configuration */}
                <div className="border-t pt-6 space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded">🔐</span>
                    <span>5. الأمان وتغيير كلمة مرور المدير</span>
                  </h4>
                  <p className="text-slate-400 text-xs font-semibold">تغيير كلمة المرور الخاصة بتسجيل الدخول إلى لوحة التحكم الإدارية.</p>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">كلمة المرور الحالية أو الجديدة للمدير</label>
                    <input 
                      type="text" 
                      value={config.adminPassword || ''}
                      onChange={e => {
                        onUpdateConfig({...config, adminPassword: e.target.value});
                        onShowToast('🔑 تم تحديث كلمة المرور الجديدة في الإعدادات!');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                      placeholder="@Alhawi92682905"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ACTIVITY LOGS */}
          {activeSubTab === 'logs' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-2">سجل عمليات التعديل والإدارة</h2>
              <p className="text-xs text-slate-500 font-semibold">يقوم الدليل بتسجيل جميع العمليات لضمان أمان البيانات والمتابعة الدقيقة للعمليات الإدارية.</p>

              <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-sm">
                <div className="max-h-[450px] overflow-y-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-150 text-xs font-extrabold text-slate-500 sticky top-0">
                        <th className="p-4">العملية</th>
                        <th className="p-4">تفاصيل العملية الإدارية</th>
                        <th className="p-4 text-left">التاريخ والوقت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 text-xs">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/40">
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-1 rounded-md font-bold ${
                              log.action === 'إضافة' ? 'bg-emerald-50 text-emerald-700' :
                              log.action === 'تعديل' ? 'bg-blue-50 text-blue-700' :
                              log.action === 'حذف' ? 'bg-rose-50 text-rose-700' : 'bg-purple-50 text-purple-700'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="p-4 font-semibold text-slate-700">{log.details}</td>
                          <td className="p-4 text-slate-400 text-left font-mono">{new Date(log.timestamp).toLocaleString('ar-EG')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
