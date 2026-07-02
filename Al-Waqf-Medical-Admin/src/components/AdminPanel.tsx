import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, Lock, LogOut, Plus, Edit2, Trash2, Download, Upload, 
  Activity, CheckCircle2, AlertTriangle, Settings, RefreshCw, FileText, Check, PlusCircle,
  Clock, XCircle, Search, Save, ClipboardList, Eye, EyeOff
} from 'lucide-react';
import { Doctor, Pharmacy, Lab, Ad, ActivityLog, HomePageConfig, DoctorRequest, ContactMessage, RequestHistory } from '../data/initialData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { RequestStatusCard } from './RequestStatusCard';

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
  contactMessages: ContactMessage[];
  onUpdateDoctors: (docs: Doctor[] | ((prev: Doctor[]) => Doctor[])) => void;
  onUpdatePharmacies: (pharms: Pharmacy[] | ((prev: Pharmacy[]) => Pharmacy[])) => void;
  onUpdateLabs: (labs: Lab[] | ((prev: Lab[]) => Lab[])) => void;
  onUpdateSpecialties: (specs: string[] | ((prev: string[]) => string[])) => void;
  onUpdateAds: (ads: Ad[] | ((prev: Ad[]) => Ad[])) => void;
  onUpdateConfig: (conf: HomePageConfig | ((prev: HomePageConfig) => HomePageConfig)) => void;
  onSaveConfig: (updatedConfig: HomePageConfig) => Promise<void>;
  onUpdateDoctorRequests: (reqs: DoctorRequest[] | ((prev: DoctorRequest[]) => DoctorRequest[])) => void;
  onUpdateContactMessages: (msgs: ContactMessage[] | ((prev: ContactMessage[]) => ContactMessage[])) => void;
  onAddLog: (action: string, type: any, details: string) => void;
  onShowToast: (msg: string) => void;
}

export function AdminPanel({
  adminLoggedIn, onLogin, onLogout,
  doctors, pharmacies, labs, specialties, ads, logs, config, doctorRequests, contactMessages,
  onUpdateDoctors, onUpdatePharmacies, onUpdateLabs, onUpdateSpecialties, onUpdateAds,
  onUpdateConfig, onSaveConfig, onUpdateDoctorRequests, onUpdateContactMessages, onAddLog, onShowToast
}: AdminPanelProps) {
  const [passwordInput, setPasswordInput] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'requests' | 'contact' | 'doctors' | 'pharmacies' | 'labs' | 'specialties' | 'ads' | 'settings' | 'logs'>('stats');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRequests, setFilterRequests] = useState<string>('all');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [requestEditing, setRequestEditing] = useState<DoctorRequest | null>(null);
  const [newSpecialty, setNewSpecialty] = useState('');

  // Form states
  const [doctorForm, setDoctorForm] = useState({
    name: '', specialty: '', clinic: '', address: '', phone: '', phone2: '', whatsapp: '',
    facebook: '', description: '', activeHours: '', notes: '', isFeatured: false, hasWhatsapp: true,
    hidden: false, gender: 'male' as 'male' | 'female', locationUrl: '', mapEmbedCode: ''
  });

  const [pharmacyForm, setPharmacyForm] = useState({
    name: '', pharmacistName: '', address: '', phone: '', whatsapp: '', isFeatured: false, hidden: false, addressEmbedMap: ''
  });

  const [labForm, setLabForm] = useState({
    name: '', address: '', phone: '', whatsapp: '', isFeatured: false, hidden: false
  });

  const [adForm, setAdForm] = useState({
    title: '', content: '', link: '', position: 'ticker' as Ad['position'], isActive: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth Handler
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(passwordInput);
    if (success) {
      setPasswordInput('');
      onShowToast('🔑 أهلاً بك يا مدير النظام! تم تسجيل الدخول.');
    } else {
      onShowToast('❌ كلمة المرور التي أدخلتها غير صحيحة، يرجى المحاولة مرة أخرى.');
    }
  };

  if (!adminLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 text-right font-sans" dir="rtl">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="h-16 w-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-black text-white">لوحة التحكم الأمنية</h1>
            <p className="text-slate-400 text-xs font-semibold">بوابة الإشراف لدليل الوقف الطبي والمرافق الصحية</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300">رمز الدخول السري (كلمة مرور المدير)</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="أدخل كلمة المرور الخاصة بالإدارة..."
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-3 px-10 text-sm font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-slate-600 text-right"
                />
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10"
            >
              تسجيل الدخول للنظام
            </button>
          </form>

          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            تنبيه: جميع المحاولات غير المصرح بها لمراقبة أو اختراق النظام مسجلة أمنياً في الخادم.
          </p>
        </div>
      </div>
    );
  }

  // Statistics
  const pendingRequestsCount = doctorRequests.filter(r => r.status === 'pending').length;
  const newMessagesCount = contactMessages.filter(m => m.status === 'new').length;

  // Doctors Logic
  const saveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorForm.name.trim()) return onShowToast('⚠️ الاسم مطلوب.');
    
    const id = editingId === 'new' ? `doc-${Date.now()}` : editingId!;
    const payload: Doctor = {
      id,
      name: doctorForm.name,
      specialty: doctorForm.specialty,
      clinicName: doctorForm.clinic || '',
      clinic: doctorForm.clinic,
      address: doctorForm.address,
      phone: doctorForm.phone,
      phone2: doctorForm.phone2,
      whatsapp: doctorForm.whatsapp,
      facebook: doctorForm.facebook,
      description: doctorForm.description,
      activeHours: doctorForm.activeHours,
      notes: doctorForm.notes,
      isFeatured: doctorForm.isFeatured,
      hasWhatsapp: doctorForm.hasWhatsapp,
      hidden: doctorForm.hidden,
      gender: doctorForm.gender,
      locationUrl: doctorForm.locationUrl,
      mapEmbedCode: doctorForm.mapEmbedCode,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'doctors', id), payload);
      onUpdateDoctors(prev => {
        const index = prev.findIndex(d => d.id === id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = payload;
          return updated;
        } else {
          return [payload, ...prev];
        }
      });
      onAddLog(editingId === 'new' ? 'إضافة' : 'تعديل', 'doctor', `تم حفظ بيانات الطبيب: ${payload.name}`);
      onShowToast(`✔️ تم حفظ الطبيب "${payload.name}" بنجاح في قاعدة البيانات.`);
      setEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'doctors');
    }
  };

  const deleteDoctor = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الطبيب "${name}" نهائياً من قاعدة البيانات؟`)) return;
    try {
      await deleteDoc(doc(db, 'doctors', id));
      onUpdateDoctors(prev => prev.filter(d => d.id !== id));
      onAddLog('حذف', 'doctor', `تم حذف الطبيب: ${name}`);
      onShowToast(`✔️ تم حذف الطبيب "${name}" من الدليل.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'doctors');
    }
  };

  const toggleDoctorVisibility = async (id: string, name: string, currentHidden: boolean) => {
    try {
      await setDoc(doc(db, 'doctors', id), { hidden: !currentHidden }, { merge: true });
      onUpdateDoctors(prev => prev.map(d => d.id === id ? { ...d, hidden: !currentHidden } : d));
      onAddLog('تعديل', 'doctor', `تم تغيير رؤية الطبيب ${name} إلى ${!currentHidden ? 'مخفي' : 'ظاهر'}`);
      onShowToast(`✔️ تم ${!currentHidden ? 'إخفاء' : 'إظهار'} الطبيب "${name}" بنجاح.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'doctors');
    }
  };

  // Pharmacies Logic
  const savePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacyForm.name.trim()) return onShowToast('⚠️ الاسم مطلوب.');
    const id = editingId === 'new' ? `pharm-${Date.now()}` : editingId!;
    const payload: Pharmacy = {
      id,
      name: pharmacyForm.name,
      pharmacistName: pharmacyForm.pharmacistName,
      address: pharmacyForm.address,
      phone: pharmacyForm.phone,
      whatsapp: pharmacyForm.whatsapp,
      isFeatured: pharmacyForm.isFeatured,
      hidden: pharmacyForm.hidden,
      addressEmbedMap: pharmacyForm.addressEmbedMap,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'pharmacies', id), payload);
      onUpdatePharmacies(prev => {
        const idx = prev.findIndex(p => p.id === id);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = payload;
          return updated;
        } else {
          return [payload, ...prev];
        }
      });
      onAddLog(editingId === 'new' ? 'إضافة' : 'تعديل', 'pharmacy', `تم حفظ بيانات الصيدلية: ${payload.name}`);
      onShowToast(`✔️ تم حفظ الصيدلية "${payload.name}" بنجاح.`);
      setEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'pharmacies');
    }
  };

  const deletePharmacy = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف الصيدلية "${name}"؟`)) return;
    try {
      await deleteDoc(doc(db, 'pharmacies', id));
      onUpdatePharmacies(prev => prev.filter(p => p.id !== id));
      onAddLog('حذف', 'pharmacy', `تم حذف الصيدلية: ${name}`);
      onShowToast(`✔️ تم حذف الصيدلية "${name}" نهائياً.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'pharmacies');
    }
  };

  const togglePharmacyVisibility = async (id: string, name: string, currentHidden: boolean) => {
    try {
      await setDoc(doc(db, 'pharmacies', id), { hidden: !currentHidden }, { merge: true });
      onUpdatePharmacies(prev => prev.map(p => p.id === id ? { ...p, hidden: !currentHidden } : p));
      onAddLog('تعديل', 'pharmacy', `تم تغيير حالة ظهور صيدلية ${name}`);
      onShowToast(`✔️ تم تحديث ظهور الصيدلية بنجاح.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'pharmacies');
    }
  };

  // Labs Logic
  const saveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labForm.name.trim()) return onShowToast('⚠️ الاسم مطلوب.');
    const id = editingId === 'new' ? `lab-${Date.now()}` : editingId!;
    const payload: Lab = {
      id,
      name: labForm.name,
      address: labForm.address,
      phone: labForm.phone,
      whatsapp: labForm.whatsapp,
      isFeatured: labForm.isFeatured,
      hidden: labForm.hidden,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'labs', id), payload);
      onUpdateLabs(prev => {
        const idx = prev.findIndex(l => l.id === id);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = payload;
          return updated;
        } else {
          return [payload, ...prev];
        }
      });
      onAddLog(editingId === 'new' ? 'إضافة' : 'تعديل', 'lab', `تم حفظ بيانات المعمل: ${payload.name}`);
      onShowToast(`✔️ تم حفظ المعمل "${payload.name}" بنجاح.`);
      setEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'labs');
    }
  };

  const deleteLab = async (id: string, name: string) => {
    if (!window.confirm(`هل تريد بالتأكيد حذف المعمل "${name}"؟`)) return;
    try {
      await deleteDoc(doc(db, 'labs', id));
      onUpdateLabs(prev => prev.filter(l => l.id !== id));
      onAddLog('حذف', 'lab', `تم حذف معمل: ${name}`);
      onShowToast(`✔️ تم حذف المعمل بنجاح.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'labs');
    }
  };

  const toggleLabVisibility = async (id: string, name: string, currentHidden: boolean) => {
    try {
      await setDoc(doc(db, 'labs', id), { hidden: !currentHidden }, { merge: true });
      onUpdateLabs(prev => prev.map(l => l.id === id ? { ...l, hidden: !currentHidden } : l));
      onAddLog('تعديل', 'lab', `تم تعديل ظهور معمل ${name}`);
      onShowToast(`✔️ تم تعديل حالة الظهور.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'labs');
    }
  };

  // Specialties
  const addSpecialty = async () => {
    const raw = newSpecialty.trim();
    if (!raw) return;
    if (specialties.includes(raw)) return onShowToast('⚠️ هذا التخصص مسجل مسبقاً.');
    const updatedList = [...specialties, raw];
    try {
      await setDoc(doc(db, 'settings', 'specialties'), { list: updatedList });
      onUpdateSpecialties(updatedList);
      onAddLog('إضافة', 'system', `تم إضافة تخصص طبي جديد: ${raw}`);
      onShowToast(`✔️ تم إضافة تخصص "${raw}" للمنصة.`);
      setNewSpecialty('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'specialties');
    }
  };

  const deleteSpecialty = async (spec: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف تخصص "${spec}"؟`)) return;
    const updatedList = specialties.filter(s => s !== spec);
    try {
      await setDoc(doc(db, 'settings', 'specialties'), { list: updatedList });
      onUpdateSpecialties(updatedList);
      onAddLog('حذف', 'system', `تم حذف تخصص طبي: ${spec}`);
      onShowToast(`✔️ تم حذف التخصص بنجاح.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'specialties');
    }
  };

  // Ads Logic
  const saveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.title.trim() || !adForm.content.trim()) return onShowToast('⚠️ العنوان والمحتوى مطلوبان.');
    const id = editingId === 'new' ? `ad-${Date.now()}` : editingId!;
    const payload: Ad = {
      id,
      title: adForm.title,
      content: adForm.content,
      link: adForm.link,
      position: adForm.position,
      isActive: adForm.isActive
    };

    try {
      await setDoc(doc(db, 'ads', id), payload);
      onUpdateAds(prev => {
        const idx = prev.findIndex(a => a.id === id);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = payload;
          return updated;
        } else {
          return [payload, ...prev];
        }
      });
      onAddLog(editingId === 'new' ? 'إضافة' : 'تعديل', 'ad', `تم حفظ الإعلان: ${payload.title}`);
      onShowToast(`✔️ تم حفظ الإعلان بنجاح.`);
      setEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'ads');
    }
  };

  const deleteAd = async (id: string, title: string) => {
    if (!window.confirm(`هل تريد بالتأكيد حذف الإعلان "${title}"؟`)) return;
    try {
      await deleteDoc(doc(db, 'ads', id));
      onUpdateAds(prev => prev.filter(a => a.id !== id));
      onAddLog('حذف', 'ad', `تم حذف إعلان: ${title}`);
      onShowToast(`✔️ تم حذف الإعلان.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'ads');
    }
  };

  const toggleAdStatus = async (id: string, currentActive: boolean, title: string) => {
    try {
      await setDoc(doc(db, 'ads', id), { isActive: !currentActive }, { merge: true });
      onUpdateAds(prev => prev.map(a => a.id === id ? { ...a, isActive: !currentActive } : a));
      onAddLog('تعديل', 'ad', `تغيير نشاط إعلان ${title} إلى ${!currentActive ? 'نشط' : 'معطل'}`);
      onShowToast(`✔️ تم تعديل نشاط الإعلان.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'ads');
    }
  };

  // Backup & Import
  const handleExportData = () => {
    const backupObj = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      doctors,
      pharmacies,
      labs,
      ads,
      specialties,
      config
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `waqf_medical_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    onShowToast('📥 تم تصدير وتحميل النسخة الاحتياطية بنجاح!');
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("تنبيه هام جداً: سيقوم هذا الإجراء بمسح كافة البيانات الحالية بالكامل في قاعدة البيانات واستبدالها بمحتويات ملف النسخ الاحتياطي المرفوع. هل أنت متأكد من الاستمرار؟")) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.doctors && !parsed.pharmacies && !parsed.labs) {
          throw new Error("ملف النسخ غير صالح أو غير مكتمل التنسيق.");
        }

        onShowToast('⏳ جاري رفع واستعادة البيانات إلى Firebase Cloud...');

        // Restore Doctors
        if (parsed.doctors) {
          for (const d of parsed.doctors) {
            await setDoc(doc(db, 'doctors', d.id), d);
          }
          onUpdateDoctors(parsed.doctors);
        }

        // Restore Pharmacies
        if (parsed.pharmacies) {
          for (const p of parsed.pharmacies) {
            await setDoc(doc(db, 'pharmacies', p.id), p);
          }
          onUpdatePharmacies(parsed.pharmacies);
        }

        // Restore Labs
        if (parsed.labs) {
          for (const l of parsed.labs) {
            await setDoc(doc(db, 'labs', l.id), l);
          }
          onUpdateLabs(parsed.labs);
        }

        // Restore Ads
        if (parsed.ads) {
          for (const a of parsed.ads) {
            await setDoc(doc(db, 'ads', a.id), a);
          }
          onUpdateAds(parsed.ads);
        }

        // Restore Specialties
        if (parsed.specialties) {
          await setDoc(doc(db, 'settings', 'specialties'), { list: parsed.specialties });
          onUpdateSpecialties(parsed.specialties);
        }

        // Restore Settings
        if (parsed.config) {
          await setDoc(doc(db, 'settings', 'main'), parsed.config);
          onUpdateConfig(parsed.config);
        }

        onAddLog('استيراد', 'system', 'تم استيراد نسخة احتياطية كاملة واستعادة البيانات للـ Cloud.');
        onShowToast('🎉 تم استيراد واستعادة كافة البيانات وتهيئة الخوادم بنجاح تام!');
      } catch (err: any) {
        alert(`❌ فشل استيراد الملف: ${err.message || err}`);
      }
    };
    reader.readAsText(file);
  };

  // Save Settings
  const handleSaveConfigPress = async () => {
    setIsSavingConfig(true);
    try {
      await onSaveConfig(config);
      onAddLog('تعديل', 'system', 'تم تحديث ألوان وهوية وإعدادات المنصة في السيرفر.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Requests status modification
  const handleUpdateRequestStatus = async (id: string, newStatus: DoctorRequest['status'], adminNotes: string, rejectionReason?: string) => {
    try {
      const targetReq = doctorRequests.find(r => r.id === id);
      if (!targetReq) return;

      const serviceType = targetReq.serviceType || 'doctor';

      // If the admin is approving the request (setting status to 'accepted' or 'published')
      const isApproving = (newStatus === 'accepted' || newStatus === 'published');

      if (isApproving) {
        let targetCollection = 'doctors';
        let newId = '';
        let typeLabel = 'طبيب';

        if (serviceType === 'pharmacy') {
          targetCollection = 'pharmacies';
          newId = `pharm-${Date.now()}`;
          typeLabel = 'صيدلية';
        } else if (serviceType === 'lab' || serviceType === 'scan_center') {
          targetCollection = 'labs';
          newId = `lab-${Date.now()}`;
          typeLabel = serviceType === 'scan_center' ? 'مركز أشعة' : 'معمل تحاليل';
        } else {
          targetCollection = 'doctors';
          newId = `doc-${Date.now()}`;
          if (serviceType === 'hospital') typeLabel = 'مستشفى';
          else if (serviceType === 'physiotherapy') typeLabel = 'مركز علاج طبيعي';
          else if (serviceType === 'doctor') typeLabel = 'طبيب';
          else typeLabel = 'خدمة طبية أخرى';
        }

        // Prepare specialty and clinicName defaults based on type if not present
        let specialty = targetReq.specialty || '';
        let clinicName = targetReq.clinicName || '';

        if (serviceType === 'hospital') {
          specialty = 'مستشفى / مركز طبي';
          clinicName = 'قسم الاستقبال والطوارئ';
        } else if (serviceType === 'physiotherapy') {
          specialty = 'علاج طبيعي وتأهيل';
          clinicName = 'مركز علاج طبيعي';
        } else if (serviceType === 'other') {
          specialty = targetReq.shortDescription || 'خدمة طبية أخرى';
          clinicName = 'خدمات طبية عامة';
        } else if (serviceType === 'doctor' && !specialty) {
          specialty = 'تخصص عام';
          clinicName = 'عيادة خاصة';
        }

        const displayName = serviceType === 'pharmacy' 
          ? (targetReq.name + (targetReq.pharmacistName ? ` (د. ${targetReq.pharmacistName})` : ''))
          : (serviceType === 'scan_center' ? (targetReq.name + ' (مركز أشعة)') : targetReq.name);

        // Copy ALL data of the request and set approved, visible, status
        const targetDocPayload: any = {
          ...targetReq, // copies all properties (e.g. name, phone, address, whatsapp, governorate, center, notes, etc.)
          id: newId,
          name: displayName,
          specialty,
          clinicName,
          approved: true,
          visible: true,
          status: 'published',
          hidden: false,
          createdAt: new Date().toISOString()
        };

        // Save in Firestore target collection
        await setDoc(doc(db, targetCollection, newId), targetDocPayload);

        // Update corresponding state array so it shows up in UI immediately
        if (targetCollection === 'doctors') {
          onUpdateDoctors((prev: Doctor[]) => [targetDocPayload as Doctor, ...prev]);
        } else if (targetCollection === 'pharmacies') {
          onUpdatePharmacies((prev: Pharmacy[]) => [targetDocPayload as Pharmacy, ...prev]);
        } else if (targetCollection === 'labs') {
          onUpdateLabs((prev: Lab[]) => [targetDocPayload as Lab, ...prev]);
        }

        onAddLog('إضافة', serviceType as any, `تم قبول ونشر ${typeLabel} الجديد: ${targetReq.name} من طلب الرقم: ${targetReq.id}`);

        // Force request status to become 'published' (تم النشر) as required
        newStatus = 'published';
      }

      const historyLog: RequestHistory = {
        timestamp: new Date().toISOString(),
        status: newStatus,
        updatedBy: 'المدير العام',
        notes: adminNotes + (rejectionReason ? ` | سبب الرفض الموجه: ${rejectionReason}` : ''),
        updatedAt: new Date().toISOString()
      };

      const updatedHistory = targetReq.history ? [...targetReq.history, historyLog] : [historyLog];
      const updatedPayload: DoctorRequest = {
        ...targetReq,
        status: newStatus,
        adminNotes,
        rejectionReason: rejectionReason || '',
        history: updatedHistory,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'requests', id), updatedPayload);
      onUpdateDoctorRequests((prev: DoctorRequest[]) => prev.map(r => r.id === id ? updatedPayload : r));
      onAddLog('تعديل', 'system', `تم تحديث مسار طلب المواطن ${targetReq.name} إلى: ${newStatus}`);
      onShowToast(`✔️ تم تحديث مسار ومعالجة الطلب بنجاح والتحويل لحالة تم النشر.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'requests');
    }
  };

  const deleteRequest = async (id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف طلب "${name}" نهائياً من النظام؟`)) return;
    try {
      await deleteDoc(doc(db, 'requests', id));
      onUpdateDoctorRequests(prev => prev.filter(r => r.id !== id));
      onAddLog('حذف', 'system', `تم حذف طلب تسجيل: ${name}`);
      onShowToast(`✔️ تم حذف طلب التسجيل بنجاح.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'requests');
    }
  };

  const startEditingRequest = (req: DoctorRequest) => {
    setRequestEditing(req);
    setEditingId('request_edit');
    setDoctorForm({
      name: req.name,
      specialty: req.specialty || '',
      clinic: req.clinicName || '',
      address: req.address,
      phone: req.phone,
      phone2: '',
      whatsapp: req.whatsapp || '',
      facebook: '',
      description: req.shortDescription || '',
      activeHours: '',
      notes: req.notes || '',
      isFeatured: false,
      hasWhatsapp: true,
      hidden: false,
      gender: 'male',
      locationUrl: '',
      mapEmbedCode: ''
    });
    setActiveSubTab('doctors');
    onShowToast('✏️ تم ملء النموذج ببيانات الطلب، يمكنك التعديل وحفظها كطبيب نشط الآن!');
  };

  // Messages Status Change
  const toggleMessageStatus = async (id: string, currentStatus: ContactMessage['status']) => {
    const nextStatus = currentStatus === 'new' ? 'read' : currentStatus === 'read' ? 'replied' : currentStatus === 'replied' ? 'closed' : 'new';
    try {
      await setDoc(doc(db, 'contactMessages', id), { status: nextStatus, updatedAt: new Date().toISOString() }, { merge: true });
      onUpdateContactMessages((prev: ContactMessage[]) => prev.map(m => m.id === id ? { ...m, status: nextStatus, updatedAt: new Date().toISOString() } : m));
      onShowToast('✔️ تم تغيير حالة الرسالة بنجاح.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'contactMessages');
    }
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, 'contactMessages', id));
      onUpdateContactMessages(prev => prev.filter(m => m.id !== id));
      onShowToast('✔️ تم حذف الرسالة بنجاح.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'contactMessages');
    }
  };

  // Searching logic
  const filteredDoctors = doctors.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.specialty.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredPharmacies = pharmacies.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredLabs = labs.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredRequestsList = doctorRequests.filter(r => {
    if (filterRequests !== 'all' && r.status !== filterRequests) return false;
    return r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.phone.includes(searchQuery);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
      {/* Admin Header */}
      <header className="bg-slate-900 text-white shadow-xl px-4 py-4 sm:px-6 sticky top-0 z-40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500 rounded-xl text-white">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="text-right">
              <h1 className="font-black text-lg leading-tight">لوحة الإشراف العليا</h1>
              <p className="text-[10px] font-bold text-emerald-400">نظام إدارة دليل الوقف الطبي الشامل</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all"
            >
              <LogOut className="h-4 w-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Dashboard Workspace */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Controls Layout */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          <div className="bg-white rounded-3xl border border-slate-150 p-4 space-y-1 shadow-sm">
            <button 
              onClick={() => { setActiveSubTab('stats'); setEditingId(null); }}
              className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all ${activeSubTab === 'stats' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2"><Activity className="h-4.5 w-4.5" /> الإحصائيات العامة</span>
            </button>
            <button 
              onClick={() => { setActiveSubTab('requests'); setEditingId(null); }}
              className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all ${activeSubTab === 'requests' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2"><ClipboardList className="h-4.5 w-4.5" /> طلبات الانضمام</span>
              {pendingRequestsCount > 0 && <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{pendingRequestsCount}</span>}
            </button>
            <button 
              onClick={() => { setActiveSubTab('contact'); setEditingId(null); }}
              className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all ${activeSubTab === 'contact' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2"><FileText className="h-4.5 w-4.5" /> رسائل التواصل</span>
              {newMessagesCount > 0 && <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{newMessagesCount}</span>}
            </button>
            <button 
              onClick={() => { setActiveSubTab('doctors'); setEditingId(null); }}
              className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all ${activeSubTab === 'doctors' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2"><Plus className="h-4.5 w-4.5" /> إدارة الأطباء</span>
            </button>
            <button 
              onClick={() => { setActiveSubTab('pharmacies'); setEditingId(null); }}
              className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all ${activeSubTab === 'pharmacies' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2"><Plus className="h-4.5 w-4.5" /> إدارة الصيدليات</span>
            </button>
            <button 
              onClick={() => { setActiveSubTab('labs'); setEditingId(null); }}
              className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all ${activeSubTab === 'labs' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2"><Plus className="h-4.5 w-4.5" /> إدارة المعامل</span>
            </button>
            <button 
              onClick={() => { setActiveSubTab('specialties'); setEditingId(null); }}
              className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all ${activeSubTab === 'specialties' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2"><PlusCircle className="h-4.5 w-4.5" /> التخصصات الطبية</span>
            </button>
            <button 
              onClick={() => { setActiveSubTab('ads'); setEditingId(null); }}
              className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all ${activeSubTab === 'ads' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2"><RefreshCw className="h-4.5 w-4.5" /> المساحات الإعلانية</span>
            </button>
            <button 
              onClick={() => { setActiveSubTab('settings'); setEditingId(null); }}
              className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all ${activeSubTab === 'settings' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2"><Settings className="h-4.5 w-4.5" /> إعدادات المنصة</span>
            </button>
            <button 
              onClick={() => { setActiveSubTab('logs'); setEditingId(null); }}
              className={`w-full text-right px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-between transition-all ${activeSubTab === 'logs' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="flex items-center gap-2"><Clock className="h-4.5 w-4.5" /> سجل العمليات</span>
            </button>
          </div>
        </div>

        {/* Dynamic Display Workspace Panel */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-150 p-6 sm:p-8 shadow-sm">
          
          {/* TAB 1: STATS GENERAL OVERVIEW */}
          {activeSubTab === 'stats' && (
            <div className="space-y-6 text-right animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-900">نظرة عامة وإحصائيات سريعة</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border p-5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">إجمالي الأطباء بالدليل</span>
                  <span className="text-2xl font-black text-slate-800 font-mono">{doctors.length}</span>
                </div>
                <div className="bg-slate-50 border p-5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">إجمالي الصيدليات</span>
                  <span className="text-2xl font-black text-slate-800 font-mono">{pharmacies.length}</span>
                </div>
                <div className="bg-slate-50 border p-5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">إجمالي المعامل الطبية</span>
                  <span className="text-2xl font-black text-slate-800 font-mono">{labs.length}</span>
                </div>
                <div className="bg-slate-50 border p-5 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">الحملات الإعلانية النشطة</span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">{ads.filter(a => a.isActive).length}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5 justify-end">
                    <span>يوجد {pendingRequestsCount} طلب انضمام جديد ينتظر مراجعتك!</span>
                    <AlertTriangle className="h-4 w-4" />
                  </h3>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">تحقق من بيانات مقدمي الخدمات الطبية الجدد بالكامل، وتأكد من جودة وتوفر عياداتهم أو صيدلياتهم قبل النشر بالدليل العام.</p>
                </div>
                <button 
                  onClick={() => setActiveSubTab('requests')}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-2 px-5 rounded-xl shrink-0 transition-colors"
                >
                  مراجعة طلبات التسجيل فوراً
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REQUESTS MANAGEMENT */}
          {activeSubTab === 'requests' && (
            <div className="space-y-6 text-right animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b pb-4">
                <h2 className="text-xl font-bold text-slate-900">طلبات التسجيل والانضمام للدليل</h2>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">تصفية حسب الحالة</span>
                  <select 
                    value={filterRequests}
                    onChange={e => setFilterRequests(e.target.value)}
                    className="bg-slate-50 border rounded-xl px-3 py-1.5 text-xs focus:outline-none font-bold text-slate-700"
                  >
                    <option value="all">كل الطلبات بالكامل</option>
                    <option value="pending">المعلقة فقط (Pending)</option>
                    <option value="accepted">المقبولة قيد التهيئة (Accepted)</option>
                    <option value="published">المنشورة بالدليل (Published)</option>
                    <option value="rejected">المرفوضة (Rejected)</option>
                    <option value="archived">المؤرشفة المغلقة (Archived)</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute right-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن اسم مقدم الطلب أو رقم الهاتف..."
                  className="w-full bg-slate-50 border border-slate-250 rounded-2xl py-3 pr-10 pl-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right"
                />
              </div>

              <div className="space-y-4">
                {filteredRequestsList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    لا يوجد أي طلبات تسجيل مطابقة لبحثك أو تصفيتك الحالية.
                  </div>
                ) : (
                  filteredRequestsList.map((req) => (
                    <RequestStatusCard 
                      key={req.id}
                      req={req}
                      doctors={doctors}
                      pharmacies={pharmacies}
                      labs={labs}
                      onUpdateDoctors={onUpdateDoctors}
                      onUpdatePharmacies={onUpdatePharmacies}
                      onUpdateLabs={onUpdateLabs}
                      onUpdateDoctorRequests={onUpdateDoctorRequests}
                      onAddLog={onAddLog}
                      onShowToast={onShowToast}
                      onStartEditing={startEditingRequest}
                      onDeleteRequest={deleteRequest}
                      handleUpdateRequestStatus={handleUpdateRequestStatus}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT MESSAGES */}
          {activeSubTab === 'contact' && (
            <div className="space-y-6 text-right animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-2">صندوق رسائل التواصل والاستفسارات</h2>
              
              <div className="space-y-4">
                {contactMessages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed">
                    لا توجد أي رسائل تواصل واردة حتى الآن.
                  </div>
                ) : (
                  contactMessages.map((m) => (
                    <div key={m.id} className="bg-white rounded-2xl border p-5 shadow-sm space-y-3 hover:border-slate-300 transition-all">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-sm">{m.fullName}</h3>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                            m.status === 'new' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            m.status === 'read' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {m.status === 'new' ? 'رسالة جديدة' : m.status === 'read' ? 'تمت قراءتها' : 'تم الرد'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{new Date(m.createdAt).toLocaleString('ar-EG')}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl">
                        <div>الهاتف: <span className="font-mono text-emerald-600 font-bold">{m.phone}</span></div>
                        {m.email && <div>البريد: <span className="font-mono">{m.email}</span></div>}
                        <div className="sm:col-span-2">الموضوع: <span className="text-slate-800 font-bold">{m.subject}</span></div>
                      </div>

                      <div className="bg-slate-50/50 p-3.5 rounded-xl text-xs text-slate-700 leading-relaxed font-semibold">
                        {m.message}
                      </div>

                      <div className="flex justify-end gap-2 pt-1.5">
                        <button 
                          onClick={() => toggleMessageStatus(m.id, m.status || 'new')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold py-1.5 px-3.5 rounded-lg border"
                        >
                          تغيير حالة القراءة والرد
                        </button>
                        <button 
                          onClick={() => deleteMessage(m.id)}
                          className="bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-extrabold py-1.5 px-3.5 rounded-lg border border-rose-200"
                        >
                          حذف الرسالة
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DOCTORS CRUD */}
          {activeSubTab === 'doctors' && (
            <div className="space-y-6 text-right animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-xl font-bold text-slate-900">إدارة الأطباء والعيادات النشطة</h2>
                {!editingId && (
                  <button 
                    onClick={() => {
                      setEditingId('new');
                      setDoctorForm({
                        name: '', specialty: specialties[0] || 'مخ وأعصاب', clinic: '', address: '', phone: '', phone2: '', whatsapp: '',
                        facebook: '', description: '', activeHours: '', notes: '', isFeatured: false, hasWhatsapp: true, hidden: false,
                        gender: 'male', locationUrl: '', mapEmbedCode: ''
                      });
                    }}
                    className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold px-3 py-2 rounded-lg shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة طبيب جديد</span>
                  </button>
                )}
              </div>

              {editingId && (
                <form onSubmit={saveDoctor} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="font-extrabold text-slate-800 text-sm border-b pb-2">{editingId === 'new' ? 'إضافة طبيب جديد للدليل الشامل' : 'تعديل بيانات الطبيب الحالية'}</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold text-slate-700">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">اسم الطبيب بالكامل (مع اللقب) *</label>
                      <input 
                        type="text" required value={doctorForm.name} 
                        onChange={e => setDoctorForm({...doctorForm, name: e.target.value})}
                        placeholder="مثال: دكتور أحمد محمد علي"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">التخصص الطبي الرئيسي *</label>
                      <select 
                        value={doctorForm.specialty} 
                        onChange={e => setDoctorForm({...doctorForm, specialty: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {specialties.map((s, idx) => (
                          <option key={idx} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">النوع / الجنس *</label>
                      <select 
                        value={doctorForm.gender} 
                        onChange={e => setDoctorForm({...doctorForm, gender: e.target.value as any})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="male">ذكر (طبيب)</option>
                        <option value="female">أنثى (طبيبة)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">اسم العيادة أو المجمع الطبي</label>
                      <input 
                        type="text" value={doctorForm.clinic} 
                        onChange={e => setDoctorForm({...doctorForm, clinic: e.target.value})}
                        placeholder="مثال: عيادة النور التخصصية"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">العنوان بالكامل بالتفصيل *</label>
                      <input 
                        type="text" required value={doctorForm.address} 
                        onChange={e => setDoctorForm({...doctorForm, address: e.target.value})}
                        placeholder="مثال: الوقف، بجوار مدرسة الوقف الإعدادية"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">رقم الاتصال الأساسي للعيادة *</label>
                      <input 
                        type="text" required value={doctorForm.phone} 
                        onChange={e => setDoctorForm({...doctorForm, phone: e.target.value})}
                        placeholder="مثال: 01012345678"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none text-left" dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">رقم تواصل احتياطي (اختياري)</label>
                      <input 
                        type="text" value={doctorForm.phone2} 
                        onChange={e => setDoctorForm({...doctorForm, phone2: e.target.value})}
                        placeholder="رقم آخر أو هاتف أرضي"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none text-left" dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">رقم الواتساب (للدردشة المباشرة) *</label>
                      <input 
                        type="text" required value={doctorForm.whatsapp} 
                        onChange={e => setDoctorForm({...doctorForm, whatsapp: e.target.value})}
                        placeholder="مثال: 201012345678"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none text-left" dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">رابط صفحة الفيسبوك (اختياري)</label>
                      <input 
                        type="text" value={doctorForm.facebook} 
                        onChange={e => setDoctorForm({...doctorForm, facebook: e.target.value})}
                        placeholder="رابط صفحة الطبيب الشخصية..."
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none text-left" dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">مواعيد وساعات العمل والعيادة</label>
                      <input 
                        type="text" value={doctorForm.activeHours} 
                        onChange={e => setDoctorForm({...doctorForm, activeHours: e.target.value})}
                        placeholder="مثال: يومياً من 4 مساءً حتى 9 مساءً عدا الجمعة"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">رابط خرائط جوجل (Google Maps URL)</label>
                      <input 
                        type="text" value={doctorForm.locationUrl} 
                        onChange={e => setDoctorForm({...doctorForm, locationUrl: e.target.value})}
                        placeholder="رابط الموقع الفعلي للعيادة..."
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none text-left" dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">كود خريطة جوجل التفاعلية (Embed Code)</label>
                      <input 
                        type="text" value={doctorForm.mapEmbedCode} 
                        onChange={e => setDoctorForm({...doctorForm, mapEmbedCode: e.target.value})}
                        placeholder="أدخل كود iframe للخريطة..."
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none text-left" dir="ltr"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs text-slate-600 mb-1">وصف مختصر للطبيب والخدمات الطبية الموفرة</label>
                      <textarea 
                        value={doctorForm.description} 
                        onChange={e => setDoctorForm({...doctorForm, description: e.target.value})}
                        rows={2}
                        placeholder="تخصصه الدقيق، درجة الدكتوراه، العناية بمرضى معينين..."
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-xs text-slate-600 mb-1">ملاحظات سرية للإدارة</label>
                      <input 
                        type="text" value={doctorForm.notes} 
                        onChange={e => setDoctorForm({...doctorForm, notes: e.target.value})}
                        placeholder="ملاحظات متابعة الدفع، أو أي ملاحظات أخرى..."
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2 font-bold text-xs text-slate-600">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" checked={doctorForm.isFeatured} 
                        onChange={e => setDoctorForm({...doctorForm, isFeatured: e.target.checked})}
                        className="rounded border-slate-300 h-4 w-4 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>طبيب مميز بنجم مروّج (يظهر في الأعلى)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" checked={doctorForm.hidden} 
                        onChange={e => setDoctorForm({...doctorForm, hidden: e.target.checked})}
                        className="rounded border-slate-300 h-4 w-4 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>إخفاء من الدليل مؤقتاً (مخفي)</span>
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end pt-3">
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow-md">حفظ البيانات</button>
                    <button type="button" onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 text-xs py-2.5 px-6 rounded-xl">إلغاء</button>
                  </div>
                </form>
              )}

              {/* Doctors Table */}
              <div className="relative">
                <Search className="absolute right-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن الطبيب بالاسم أو التخصص..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-10 pl-4 text-xs font-semibold focus:outline-none text-right"
                />
              </div>

              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-xs font-extrabold text-slate-500">
                      <th className="p-4">اسم الطبيب والعيادة</th>
                      <th className="p-4">التخصص</th>
                      <th className="p-4">العنوان</th>
                      <th className="p-4">رقم الهاتف</th>
                      <th className="p-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filteredDoctors.map((d) => (
                      <tr key={d.id} className={`hover:bg-slate-50/50 transition-colors ${d.hidden ? 'bg-slate-50/30 opacity-70' : ''}`}>
                        <td className="p-4">
                          <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <span>{d.name}</span>
                            {d.isFeatured && <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded border border-amber-200">مميز ⭐️</span>}
                            {d.hidden && <span className="bg-slate-150 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">مخفي</span>}
                          </div>
                          {d.clinic && <span className="text-xs text-slate-400 block mt-0.5">{d.clinic}</span>}
                        </td>
                        <td className="p-4 font-bold text-slate-600">{d.specialty}</td>
                        <td className="p-4 text-slate-500 text-xs">{d.address}</td>
                        <td className="p-4 font-mono text-xs">{d.phone}</td>
                        <td className="p-4 text-left">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => toggleDoctorVisibility(d.id, d.name, d.hidden)}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                              title={d.hidden ? "إظهار" : "إخفاء"}
                            >
                              {d.hidden ? <EyeOff className="h-4 w-4 text-amber-600" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button 
                              onClick={() => {
                                setEditingId(d.id);
                                setDoctorForm({
                                  name: d.name, specialty: d.specialty, clinic: d.clinic || '', address: d.address,
                                  phone: d.phone, phone2: d.phone2 || '', whatsapp: d.whatsapp, facebook: d.facebook || '',
                                  description: d.description || '', activeHours: d.activeHours || '', notes: d.notes || '',
                                  isFeatured: d.isFeatured || false, hasWhatsapp: d.hasWhatsapp || true, hidden: d.hidden || false,
                                  gender: d.gender || 'male', locationUrl: d.locationUrl || '', mapEmbedCode: d.mapEmbedCode || ''
                                });
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteDoctor(d.id, d.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
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

          {/* TAB 5: PHARMACIES CRUD */}
          {activeSubTab === 'pharmacies' && (
            <div className="space-y-6 text-right animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-xl font-bold text-slate-900">إدارة الصيدليات المعتمدة</h2>
                {!editingId && (
                  <button 
                    onClick={() => {
                      setEditingId('new');
                      setPharmacyForm({ name: '', pharmacistName: '', address: '', phone: '', whatsapp: '', isFeatured: false, hidden: false, addressEmbedMap: '' });
                    }}
                    className="flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold px-3 py-2 rounded-lg shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>إضافة صيدلية جديدة</span>
                  </button>
                )}
              </div>

              {editingId && (
                <form onSubmit={savePharmacy} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="font-bold text-slate-800">{editingId === 'new' ? 'إضافة صيدلية جديدة' : 'تحديث بيانات الصيدلية'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs font-bold text-slate-600">
                    <div>
                      <label className="block text-slate-600 mb-1">اسم الصيدلية *</label>
                      <input 
                        type="text" required value={pharmacyForm.name} 
                        onChange={e => setPharmacyForm({...pharmacyForm, name: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">اسم الصيدلي المسؤول</label>
                      <input 
                        type="text" value={pharmacyForm.pharmacistName} 
                        onChange={e => setPharmacyForm({...pharmacyForm, pharmacistName: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">العنوان بالتفصيل *</label>
                      <input 
                        type="text" required value={pharmacyForm.address} 
                        onChange={e => setPharmacyForm({...pharmacyForm, address: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">رقم هاتف الاتصال *</label>
                      <input 
                        type="text" required value={pharmacyForm.phone} 
                        onChange={e => setPharmacyForm({...pharmacyForm, phone: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none text-left" dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">رقم الواتساب الفوري *</label>
                      <input 
                        type="text" required value={pharmacyForm.whatsapp} 
                        onChange={e => setPharmacyForm({...pharmacyForm, whatsapp: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none text-left" dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">خريطة جوجل التفاعلية (Embedded Map iframe)</label>
                      <input 
                        type="text" value={pharmacyForm.addressEmbedMap} 
                        onChange={e => setPharmacyForm({...pharmacyForm, addressEmbedMap: e.target.value})}
                        placeholder="أدخل كود تضمين خريطة جوجل..."
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none text-left" dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 items-center pt-2 font-bold text-xs text-slate-600">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" checked={pharmacyForm.isFeatured} 
                        onChange={e => setPharmacyForm({...pharmacyForm, isFeatured: e.target.checked})}
                        className="rounded border-slate-300"
                      />
                      <span>صيدلية مميزة بالمنصة</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" checked={pharmacyForm.hidden} 
                        onChange={e => setPharmacyForm({...pharmacyForm, hidden: e.target.checked})}
                        className="rounded border-slate-300"
                      />
                      <span>إخفاء من الدليل</span>
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-lg">حفظ البيانات</button>
                    <button type="button" onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 text-xs py-2 px-4 rounded-lg">إلغاء</button>
                  </div>
                </form>
              )}

              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-xs font-extrabold text-slate-500">
                      <th className="p-4">اسم الصيدلية والمسؤول</th>
                      <th className="p-4">العنوان</th>
                      <th className="p-4">رقم الهاتف</th>
                      <th className="p-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filteredPharmacies.map((p) => (
                      <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${p.hidden ? 'bg-slate-50/40 opacity-70' : ''}`}>
                        <td className="p-4">
                          <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                            <span>{p.name}</span>
                            {p.hidden && <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 rounded">مخفية</span>}
                          </div>
                          {p.pharmacistName && <span className="text-xs text-slate-400 block mt-0.5">{p.pharmacistName}</span>}
                        </td>
                        <td className="p-4 text-slate-500 text-xs">{p.address}</td>
                        <td className="p-4 font-mono text-xs">{p.phone}</td>
                        <td className="p-4 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => togglePharmacyVisibility(p.id, p.name, p.hidden)}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                            >
                              {p.hidden ? <EyeOff className="h-4 w-4 text-amber-600" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button 
                              onClick={() => {
                                setEditingId(p.id);
                                setPharmacyForm({
                                  name: p.name, pharmacistName: p.pharmacistName || '', address: p.address,
                                  phone: p.phone, whatsapp: p.whatsapp, isFeatured: p.isFeatured || false, hidden: p.hidden || false,
                                  addressEmbedMap: p.addressEmbedMap || ''
                                });
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deletePharmacy(p.id, p.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
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

          {/* TAB 6: LABS CRUD */}
          {activeSubTab === 'labs' && (
            <div className="space-y-6 text-right animate-fadeIn">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-xl font-bold text-slate-900">إدارة معامل التحاليل والأشعة الطبية</h2>
                {!editingId && (
                  <button 
                    onClick={() => {
                      setEditingId('new');
                      setLabForm({ name: '', address: '', phone: '', whatsapp: '', isFeatured: false, hidden: false });
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
                  <h3 className="font-bold text-slate-800">{editingId === 'new' ? 'إضافة معمل جديد' : 'تحديث معطيات المعمل'}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                    <div>
                      <label className="block text-slate-600 mb-1">اسم المعمل / المركز طبي *</label>
                      <input 
                        type="text" required value={labForm.name} 
                        onChange={e => setLabForm({...labForm, name: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">العنوان بالكامل *</label>
                      <input 
                        type="text" required value={labForm.address} 
                        onChange={e => setLabForm({...labForm, address: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">رقم الاتصال *</label>
                      <input 
                        type="text" required value={labForm.phone} 
                        onChange={e => setLabForm({...labForm, phone: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none text-left" dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">رقم الواتساب الفوري *</label>
                      <input 
                        type="text" required value={labForm.whatsapp} 
                        onChange={e => setLabForm({...labForm, whatsapp: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none text-left" dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 items-center pt-2 font-bold text-xs text-slate-600">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" checked={labForm.isFeatured} 
                        onChange={e => setLabForm({...labForm, isFeatured: e.target.checked})}
                        className="rounded border-slate-300"
                      />
                      <span>معمل مميز بالمنصة</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" checked={labForm.hidden} 
                        onChange={e => setLabForm({...labForm, hidden: e.target.checked})}
                        className="rounded border-slate-300"
                      />
                      <span>إخفاء من الدليل</span>
                    </label>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-lg">حفظ البيانات</button>
                    <button type="button" onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 text-xs py-2 px-4 rounded-lg">إلغاء</button>
                  </div>
                </form>
              )}

              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-xs font-extrabold text-slate-500">
                      <th className="p-4">اسم المعمل</th>
                      <th className="p-4">العنوان بالكامل</th>
                      <th className="p-4">رقم الاتصال</th>
                      <th className="p-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filteredLabs.map((l) => (
                      <tr key={l.id} className={`hover:bg-slate-50/55 transition-colors ${l.hidden ? 'bg-slate-50/40 opacity-70' : ''}`}>
                        <td className="p-4 font-extrabold text-slate-800">
                          <span>{l.name}</span>
                          {l.hidden && <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5 border">مخفي</span>}
                        </td>
                        <td className="p-4 text-slate-500 text-xs">{l.address}</td>
                        <td className="p-4 font-mono text-xs">{l.phone}</td>
                        <td className="p-4 text-left">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => toggleLabVisibility(l.id, l.name, l.hidden)}
                              className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                            >
                              {l.hidden ? <EyeOff className="h-4 w-4 text-amber-600" /> : <Eye className="h-4 w-4" />}
                            </button>
                            <button 
                              onClick={() => {
                                setEditingId(l.id);
                                setLabForm({ name: l.name, address: l.address, phone: l.phone, whatsapp: l.whatsapp || '', isFeatured: l.isFeatured || false, hidden: l.hidden || false });
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteLab(l.id, l.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
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

          {/* TAB 7: SPECIALTIES */}
          {activeSubTab === 'specialties' && (
            <div className="space-y-6 text-right animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-2">إدارة تخصصات الأطباء</h2>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">إدراج تصنيف طبي جديد</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newSpecialty}
                    onChange={e => setNewSpecialty(e.target.value)}
                    placeholder="مثال: مخ وأعصاب، قلب ومفاصل..."
                    className="flex-1 bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
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

              <div className="bg-white rounded-2xl border p-6">
                <h3 className="font-bold text-slate-800 text-sm mb-4">التخصصات الطبية الحالية</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {specialties.map((spec, index) => (
                    <div key={index} className="flex justify-between items-center bg-slate-50 border p-3 rounded-xl hover:border-slate-300 transition-all text-sm font-semibold text-slate-700">
                      <span>{spec}</span>
                      <button 
                        onClick={() => deleteSpecialty(spec)}
                        className="text-rose-600 p-1 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ADS CRUD */}
          {activeSubTab === 'ads' && (
            <div className="space-y-6 text-right animate-fadeIn">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-600">
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-600 mb-1">عنوان الإعلان الرئيسي *</label>
                      <input 
                        type="text" required value={adForm.title} 
                        onChange={e => setAdForm({...adForm, title: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-600 mb-1">محتوى الإعلان بالتفصيل *</label>
                      <textarea 
                        required value={adForm.content} 
                        onChange={e => setAdForm({...adForm, content: e.target.value})}
                        rows={3}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">موضع ظهور الإعلان *</label>
                      <select 
                        value={adForm.position} 
                        onChange={e => setAdForm({...adForm, position: e.target.value as any})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none font-bold text-slate-700"
                      >
                        <option value="top">بانر أعلى الصفحة الرئيسية</option>
                        <option value="bottom">بانر أسفل الصفحة الرئيسية</option>
                        <option value="ticker">شريط الإعلانات المتحرك بالتناوب (Ticker)</option>
                        <option value="search_middle">إعلان بين نتائج البحث</option>
                        <option value="card_doctor">داخل صفحات الأطباء</option>
                        <option value="card_pharmacy">داخل صفحات الصيدليات</option>
                        <option value="card_lab">داخل صفحات المعامل</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">رابط الإعلان الاختياري</label>
                      <input 
                        type="text" value={adForm.link} 
                        onChange={e => setAdForm({...adForm, link: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-2 px-4 rounded-lg">حفظ الإعلان</button>
                    <button type="button" onClick={() => setEditingId(null)} className="bg-slate-200 text-slate-700 text-xs py-2 px-4 rounded-lg">إلغاء</button>
                  </div>
                </form>
              )}

              <div className="bg-white rounded-2xl border overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b text-xs font-extrabold text-slate-500">
                      <th className="p-4">عنوان الإعلان</th>
                      <th className="p-4">موضع الظهور</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {ads.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/55 transition-colors">
                        <td className="p-4">
                          <div className="font-extrabold text-slate-800">{a.title}</div>
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
                                setAdForm({ title: a.title, content: a.content, link: a.link || '#', position: a.position, isActive: a.isActive });
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteAd(a.id, a.title)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
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

          {/* TAB 9: SETTINGS & BACKUP */}
          {activeSubTab === 'settings' && (
            <div className="space-y-6 text-right animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">النسخ الاحتياطي وإعدادات المنصة</h2>
                  <p className="text-slate-500 text-xs mt-1 font-semibold leading-relaxed">تحكم في هوية المنصة، الألوان، نصوص الصفحات، وترتيب واجهة العرض.</p>
                </div>
                <button
                  onClick={handleSaveConfigPress}
                  disabled={isSavingConfig}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-extrabold text-sm py-2.5 px-6 rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                  <Save className="h-4.5 w-4.5" />
                  <span>{isSavingConfig ? 'جاري الحفظ...' : 'حفظ الإعدادات بالكامل'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Backup Box */}
                <div className="bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                      <Download className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1">نسخ احتياطي للبيانات</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">تحميل نسخة احتياطية كاملة من الدليل بصيغة JSON لحفظها أو نقلها.</p>
                  </div>
                  <button 
                    onClick={handleExportData}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Download className="h-4.5 w-4.5" />
                    <span>تصدير البيانات احتياطياً</span>
                  </button>
                </div>

                {/* Restore Box */}
                <div className="bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
                      <Upload className="h-6 w-6" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-base mb-1">استعادة نسخة احتياطية</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mb-4">رفع ملف نسخة احتياطية بصيغة JSON سابق لاستبدال جميع البيانات الحالية في الدليل.</p>
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
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-2.5 px-4 rounded-xl border border-slate-200 flex items-center justify-center gap-2"
                    >
                      <Upload className="h-4.5 w-4.5" />
                      <span>استيراد ملف البيانات</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Theme & Identity Settings */}
              <div className="bg-white rounded-2xl border p-6 space-y-6">
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 justify-end">
                    <span>1. إعدادات الهوية والبصرية والألوان</span>
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded">🎨</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold text-slate-600">
                    <div>
                      <label className="block text-slate-600 mb-1">اسم الموقع</label>
                      <input 
                        type="text" value={config.siteName || ''}
                        onChange={e => onUpdateConfig({...config, siteName: e.target.value})}
                        className="w-full bg-slate-50 border rounded-xl px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">نص الشعار بالرأس</label>
                      <input 
                        type="text" value={config.siteLogoText || ''}
                        onChange={e => onUpdateConfig({...config, siteLogoText: e.target.value})}
                        className="w-full bg-slate-50 border rounded-xl px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">أيقونة الشعار</label>
                      <select 
                        value={config.siteLogoIcon || 'HeartPulse'}
                        onChange={e => onUpdateConfig({...config, siteLogoIcon: e.target.value})}
                        className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-700"
                      >
                        <option value="HeartPulse">نبض القلب (HeartPulse)</option>
                        <option value="Stethoscope">سماعة طبيب (Stethoscope)</option>
                        <option value="Pill">كبسولة دواء (Pill)</option>
                        <option value="FlaskConical">دورق معملي (FlaskConical)</option>
                        <option value="ShieldCheck">درع الحماية (ShieldCheck)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">اللون الأساسي للموقع</label>
                      <select 
                        value={config.themeColor || 'emerald'}
                        onChange={e => onUpdateConfig({...config, themeColor: e.target.value as any})}
                        className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-slate-700"
                      >
                        <option value="emerald">أخضر زمردي (Emerald)</option>
                        <option value="blue">أزرق سماوي (Blue)</option>
                        <option value="purple">أرجواني ملكي (Purple)</option>
                        <option value="rose">وردي جذاب (Rose)</option>
                        <option value="amber">ذهبي دافئ (Amber)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 justify-end">
                    <span>2. نصوص واجهة البانر الرئيسي</span>
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded">✍️</span>
                  </h4>
                  <div className="space-y-3 text-xs font-bold text-slate-600">
                    <div>
                      <label className="block mb-1">عنوان الترحيب الرئيسي</label>
                      <input 
                        type="text" value={config.heroTitle}
                        onChange={e => onUpdateConfig({...config, heroTitle: e.target.value})}
                        className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">الوصف الفرعي المصاحب</label>
                      <textarea 
                        rows={2} value={config.heroSubtitle}
                        onChange={e => onUpdateConfig({...config, heroSubtitle: e.target.value})}
                        className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-semibold"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Order and Visibility */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 justify-end">
                    <span>3. إدارة تشغيل وإعادة ترتيب أقسام الصفحة الرئيسية</span>
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded">🔀</span>
                  </h4>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">تتحكم هذه الإعدادات مباشرة في واجهة الموقع العام للجمهور.</p>
                  
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
                      <div className="bg-slate-50 p-4 rounded-2xl border divide-y text-xs font-bold text-slate-700">
                        {currentOrder.map((sectionId, idx) => {
                          const sectionInfo = sectionsList.find(s => s.id === sectionId);
                          if (!sectionInfo) return null;
                          const isEnabled = !disabledSections.includes(sectionId);
                          
                          return (
                            <div key={sectionId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-400 bg-white h-6 w-6 rounded border flex items-center justify-center">{idx + 1}</span>
                                <div>
                                  <strong className="text-slate-800">{sectionInfo.label}</strong>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleSection(sectionId)}
                                  className={`px-3 py-1 rounded-xl text-[11px] border transition-all ${isEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}
                                >
                                  {isEnabled ? '● نشط وظاهر' : '○ مخفي ومعطل'}
                                </button>
                                <div className="flex border rounded-xl bg-white overflow-hidden divide-x">
                                  <button
                                    type="button" disabled={idx === 0}
                                    onClick={() => shiftSection(idx, 'up')}
                                    className="px-2 py-1 hover:bg-slate-100 disabled:opacity-30"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button" disabled={idx === currentOrder.length - 1}
                                    onClick={() => shiftSection(idx, 'down')}
                                    className="px-2 py-1 hover:bg-slate-100 disabled:opacity-30"
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

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 justify-end">
                    <span>4. الأمان وتغيير كلمة مرور المدير</span>
                    <span className="p-1 bg-emerald-50 text-emerald-600 rounded">🔐</span>
                  </h4>
                  <div className="text-xs font-bold text-slate-600">
                    <label className="block mb-1">كلمة المرور الحالية أو الجديدة للمدير</label>
                    <input 
                      type="text" value={config.adminPassword || ''}
                      onChange={e => {
                        onUpdateConfig({...config, adminPassword: e.target.value});
                        onShowToast('🔑 تم تحديث كلمة المرور الجديدة في الإعدادات!');
                      }}
                      className="w-full bg-slate-50 border rounded-xl px-3 py-2 font-mono"
                      placeholder="@Alhawi92682905"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: ACTIVITY LOGS */}
          {activeSubTab === 'logs' && (
            <div className="space-y-6 text-right animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-2">سجل عمليات التعديل والإدارة</h2>
              
              <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
                <div className="max-h-[450px] overflow-y-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b text-xs font-extrabold text-slate-500 sticky top-0">
                        <th className="p-4">العملية</th>
                        <th className="p-4">التفاصيل</th>
                        <th className="p-4 text-left">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs font-semibold">
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
                          <td className="p-4 text-slate-750">{log.details}</td>
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
