import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, Lock, LogOut, Plus, Edit2, Trash2, Download, Upload, 
  Activity, CheckCircle2, AlertTriangle, Settings, RefreshCw, FileText, Check, PlusCircle,
  Clock, XCircle, Search, Save, ClipboardList, Eye, EyeOff, Sparkles
} from 'lucide-react';
import { Doctor, Pharmacy, Lab, Ad, ActivityLog, HomePageConfig, DoctorRequest, ContactMessage } from '../data/initialData';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

interface RequestStatusCardProps {
  key?: React.Key;
  req: DoctorRequest;
  doctors: Doctor[];
  pharmacies: Pharmacy[];
  labs: Lab[];
  onUpdateDoctors: (docs: Doctor[]) => void;
  onUpdatePharmacies: (pharms: Pharmacy[]) => void;
  onUpdateLabs: (labs: Lab[]) => void;
  onUpdateDoctorRequests: (reqs: DoctorRequest[]) => void;
  onAddLog: (action: string, type: any, details: string) => void;
  onShowToast: (msg: string) => void;
  onStartEditing: (req: DoctorRequest) => void;
  onDeleteRequest: (id: string, name: string) => Promise<void>;
  handleUpdateRequestStatus: (id: string, newStatus: DoctorRequest['status'], adminNotes: string, rejectionReason?: string) => Promise<void>;
}

function RequestStatusCard({
  req, doctors, pharmacies, labs,
  onUpdateDoctors, onUpdatePharmacies, onUpdateLabs, onUpdateDoctorRequests,
  onAddLog, onShowToast, onStartEditing, onDeleteRequest, handleUpdateRequestStatus
}: RequestStatusCardProps) {
  const [selectedStatus, setSelectedStatus] = useState<DoctorRequest['status']>(req.status || 'pending');
  const [adminNotesInput, setAdminNotesInput] = useState(req.adminNotes || '');
  const [rejectionReason, setRejectionReason] = useState(req.rejectionReason || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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

  const statusColors: Record<string, { bg: string, text: string, border: string, label: string }> = {
    pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', label: 'قيد المراجعة والتدقيق الإداري' },
    contacting: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', label: 'جاري التواصل مع مقدم الطلب' },
    reviewing_data: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', label: 'جاري مراجعة البيانات' },
    incomplete_data: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', label: 'البيانات غير مكتملة' },
    awaiting_completion: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', label: 'بانتظار استكمال البيانات' },
    accepted: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', label: 'مقبول (قيد النشر والتهيئة)' },
    published: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', label: 'منشور بالدليل العام' },
    rejected: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', label: 'مرفوض' },
    cancelled: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300', label: 'ملغي' },
    archived: { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-300', label: 'مؤرشف ومغلق' },
  };

  const currentStyle = statusColors[req.status || 'pending'] || statusColors.pending;

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await handleUpdateRequestStatus(req.id, selectedStatus, adminNotesInput, selectedStatus === 'rejected' ? rejectionReason : undefined);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm space-y-4 animate-fadeIn hover:border-slate-300 transition-colors">
      
      {/* Row 1: Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border">
            ID: {req.id}
          </span>
          <span className="bg-emerald-50 text-emerald-800 text-[10.5px] font-black px-2.5 py-1 rounded-lg border border-emerald-200">
            {typeLabel}
          </span>
          <h3 className="text-base font-extrabold text-slate-900">{req.name}</h3>
        </div>
        
        <div className="flex items-center gap-2.5 justify-between sm:justify-start">
          <span className="text-[11px] font-semibold text-slate-400">
            {new Date(req.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
          </span>
          <span className={`text-[10.5px] font-black px-3 py-1 rounded-full border ${currentStyle.bg} ${currentStyle.text} ${currentStyle.border}`}>
            {currentStyle.label}
          </span>
        </div>
      </div>

      {/* Row 2: Details metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-xl">
        <div>
          <span className="text-[9.5px] font-black text-slate-400 block mb-0.5">نوع الخدمة</span>
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
              <span className="text-slate-800 font-bold">دليل المرافق والخدمات</span>
            </div>
          </>
        )}

        <div>
          <span className="text-[9.5px] font-black text-slate-400 block mb-0.5">الهاتف للتواصل</span>
          <span className="font-mono text-left block text-emerald-600 font-bold" dir="ltr">{req.phone}</span>
        </div>
        <div>
          <span className="text-[9.5px] font-black text-slate-400 block mb-0.5">العنوان بالتفصيل</span>
          <span className="text-slate-800 font-bold truncate block">{req.address}</span>
        </div>
      </div>

      {/* Notes Display */}
      {req.notes && (
        <div className="bg-amber-50/30 border border-amber-100 p-3 rounded-xl text-xs text-slate-700 leading-relaxed font-semibold">
          💡 <span className="font-extrabold text-amber-900">ملاحظات مقدم الطلب عند الإرسال:</span> {req.notes}
        </div>
      )}

      {req.rejectionReason && (
        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-xs text-rose-800 leading-relaxed font-bold">
          ⚠️ سبب الرفض الموجه للزائر: {req.rejectionReason}
        </div>
      )}

      {req.adminNotes && (
        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-semibold">
          📝 <span className="font-extrabold text-slate-800">ملاحظات المتابعة الإدارية الحالية:</span> {req.adminNotes}
        </div>
      )}

      {/* Collapsible Timeline tracking history logs */}
      <div className="border-t pt-3">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-all"
        >
          <Clock className="h-3.5 w-3.5" />
          <span>{showHistory ? 'إخفاء سجل المعالجة الزمني' : `عرض سجل تتبع معالجة الطلب (${req.history?.length || 0} تغييرات)`}</span>
        </button>

        {showHistory && (
          <div className="mt-3 bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3.5 animate-fadeIn">
            <h4 className="text-xs font-extrabold text-slate-800 border-b pb-1.5 flex items-center gap-1">
              <span>📜 سجل تتبع الطلب التاريخي</span>
              <span className="text-[10px] font-semibold text-slate-400">(يظهر للزائر لمتابعة طلبه)</span>
            </h4>
            
            <div className="relative border-r-2 border-slate-200 pr-4 mr-2 space-y-4 text-xs">
              {/* Submission event */}
              <div className="relative">
                <span className="absolute -right-[23px] top-0.5 bg-slate-200 border-2 border-white rounded-full h-3 w-3 inline-block"></span>
                <p className="font-bold text-slate-800">تم تقديم الطلب بنجاح عبر موقع المنصة</p>
                <span className="text-[10px] font-semibold text-slate-400">
                  {new Date(req.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>

              {/* Mapped history events */}
              {req.history && req.history.map((hist, idx) => {
                const histStyle = statusColors[hist.status] || statusColors.pending;
                return (
                  <div key={idx} className="relative">
                    <span className="absolute -right-[23px] top-0.5 bg-emerald-500 border-2 border-white rounded-full h-3 w-3 inline-block"></span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800">تحديث الحالة إلى:</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${histStyle.bg} ${histStyle.text} ${histStyle.border}`}>
                        {histStyle.label}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-white border rounded px-1.5 py-0.5">
                        بواسطة: {hist.updatedBy || 'مدير النظام'}
                      </span>
                    </div>
                    {hist.notes && (
                      <p className="text-slate-600 mt-1 font-semibold text-[11px] leading-relaxed">
                        📝 {hist.notes}
                      </p>
                    )}
                    <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                      {new Date(hist.timestamp).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Advanced inline form to modify request status */}
      <form onSubmit={handleStatusSubmit} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
          <span className="p-0.5 bg-emerald-50 text-emerald-600 rounded">⚙️</span>
          <span>تغيير الحالة الإدارية وكتابة ملاحظات التتبع</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Status select option list */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 mb-1">الحالة الإدارية الجديدة</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="pending">قيد المراجعة والتدقيق الإداري</option>
              <option value="contacting">جاري التواصل مع مقدم الطلب</option>
              <option value="reviewing_data">جاري مراجعة البيانات</option>
              <option value="incomplete_data">البيانات غير مكتملة</option>
              <option value="awaiting_completion">بانتظار استكمال البيانات</option>
              <option value="accepted">مقبول (قيد النشر والتهيئة)</option>
              <option value="published">منشور بالدليل العام</option>
              <option value="rejected">مرفوض</option>
              <option value="cancelled">ملغي</option>
              <option value="archived">مؤرشف ومغلق</option>
            </select>
          </div>

          {/* Admin notes input field */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-500 mb-1">ملاحظات المتابعة (سجل التتبع)</label>
            <input
              type="text"
              value={adminNotesInput}
              onChange={e => setAdminNotesInput(e.target.value)}
              placeholder="مثال: تم الاتصال بمقدم الطلب وتأكيد مواعيد العمل..."
              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-semibold placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* If rejected is selected, require detailed rejection reason */}
        {selectedStatus === 'rejected' && (
          <div className="animate-fadeIn">
            <label className="block text-[10px] font-black text-rose-600 mb-1">سبب الرفض الموجه لمقدم الطلب (مطلوب) *</label>
            <input
              type="text"
              required
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="مثال: المستندات الطبية المرفقة غير واضحة يرجى إعادة التقديم..."
              className="w-full bg-white border border-rose-300 rounded-lg px-2.5 py-2 text-xs font-semibold text-rose-900 placeholder:text-slate-400 focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-[11px] font-extrabold px-4 py-2 rounded-lg shadow-sm flex items-center gap-1 transition-all"
          >
            <Save className="h-3 w-3" />
            <span>{isUpdating ? 'جاري التحديث...' : 'تثبيت الحالة وحفظ الملاحظات'}</span>
          </button>
        </div>
      </form>

      {/* Row 3: Action Buttons */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-t pt-3 border-slate-100 text-xs">
        <div className="flex gap-2">
          {/* Edit request data */}
          <button
            type="button"
            onClick={() => onStartEditing(req)}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5 text-slate-500" />
            <span>تعديل البيانات</span>
          </button>

          {/* Delete request */}
          <button
            type="button"
            onClick={() => onDeleteRequest(req.id, req.name)}
            className="bg-rose-50/60 hover:bg-rose-100/80 text-rose-700 border border-rose-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            <span>حذف نهائياً</span>
          </button>
        </div>

        {/* Quick action shortcuts */}
        <div className="flex gap-2">
          {req.status !== 'published' && (
            <button
              type="button"
              onClick={() => handleUpdateRequestStatus(req.id, 'published', 'تم النشر والقبول الفوري في الدليل العام.')}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-extrabold shadow-sm flex items-center gap-1 transition-all"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>نشر فوري</span>
            </button>
          )}

          {req.status === 'pending' && (
            <button
              type="button"
              onClick={() => handleUpdateRequestStatus(req.id, 'accepted', 'تم القبول المبدئي للطلب وجاري إعداد بطاقة النشر.')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm transition-colors"
            >
              قبول مبدئي
            </button>
          )}
        </div>
      </div>

    </div>
  );
}

interface DistinctionItemCardProps {
  key?: React.Key;
  item: Doctor | Pharmacy | Lab;
  type: 'doctor' | 'pharmacy' | 'lab';
  onUpdateDoctors: (docs: Doctor[]) => void;
  onUpdatePharmacies: (pharms: Pharmacy[]) => void;
  onUpdateLabs: (labs: Lab[]) => void;
  doctors: Doctor[];
  pharmacies: Pharmacy[];
  labs: Lab[];
  onAddLog: (action: string, type: 'doctor' | 'pharmacy' | 'lab' | 'specialty' | 'ad' | 'system' | 'backup', details: string) => void;
  onShowToast: (msg: string) => void;
}

function DistinctionItemCard({
  item, type, onUpdateDoctors, onUpdatePharmacies, onUpdateLabs, doctors, pharmacies, labs, onAddLog, onShowToast
}: DistinctionItemCardProps) {
  const [isFeatured, setIsFeatured] = useState(!!item.isFeatured);
  const [isVerified, setIsVerified] = useState(!!item.isVerified);
  const [isPinned, setIsPinned] = useState(!!item.isPinned);
  const [packageTier, setPackageTier] = useState<any>(item.packageTier || 'normal');
  const [displayOrder, setDisplayOrder] = useState<string>(item.displayOrder !== undefined && item.displayOrder !== null ? String(item.displayOrder) : '');
  const [hidden, setHidden] = useState(!!item.hidden);
  const [showOnHome, setShowOnHome] = useState(item.showOnHome !== false);
  const [showInSearch, setShowInSearch] = useState(item.showInSearch !== false);
  const [servicesProvided, setServicesProvided] = useState(
    item.servicesProvided ? item.servicesProvided.join('، ') : ''
  );
  const [startDay, setStartDay] = useState(item.startDay || 'السبت');
  const [endDay, setEndDay] = useState(item.endDay || 'الخميس');
  const [openHour, setOpenHour] = useState(item.openHour || '09:00');
  const [closeHour, setCloseHour] = useState(item.closeHour || '21:00');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const servicesArray = servicesProvided
        ? servicesProvided.split(/,|،/).map(s => s.trim()).filter(Boolean)
        : [];
      
      const numDisplayOrder = displayOrder !== '' ? Number(displayOrder) : undefined;

      const updatedFields = {
        isFeatured,
        isVerified,
        isPinned,
        packageTier,
        displayOrder: numDisplayOrder,
        hidden,
        showOnHome,
        showInSearch,
        servicesProvided: servicesArray,
        startDay,
        endDay,
        openHour,
        closeHour,
        lastUpdated: new Date().toISOString()
      };

      if (type === 'doctor') {
        const docToUpdate = doctors.find(d => d.id === item.id);
        if (docToUpdate) {
          const updatedDoc = { ...docToUpdate, ...updatedFields };
          await setDoc(doc(db, 'doctors', item.id), updatedDoc);
          onUpdateDoctors(doctors.map(d => d.id === item.id ? updatedDoc : d));
        }
      } else if (type === 'pharmacy') {
        const pharmToUpdate = pharmacies.find(p => p.id === item.id);
        if (pharmToUpdate) {
          const updatedPharm = { ...pharmToUpdate, ...updatedFields };
          await setDoc(doc(db, 'pharmacies', item.id), updatedPharm);
          onUpdatePharmacies(pharmacies.map(p => p.id === item.id ? updatedPharm : p));
        }
      } else if (type === 'lab') {
        const labToUpdate = labs.find(l => l.id === item.id);
        if (labToUpdate) {
          const updatedLab = { ...labToUpdate, ...updatedFields };
          await setDoc(doc(db, 'labs', item.id), updatedLab);
          onUpdateLabs(labs.map(l => l.id === item.id ? updatedLab : l));
        }
      }

      onAddLog('تعديل', type, `تعديل التميز والظهور للجهة: ${item.name}`);
      onShowToast(`✔️ تم حفظ تعديلات التميز والظهور بنجاح لـ ${item.name}`);
    } catch (error: any) {
      console.error("Error saving distinction fields:", error);
      alert(`❌ فشل حفظ التعديلات في قاعدة البيانات: ${error.message || error}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getPackageBadgeColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'gold': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'silver': return 'bg-slate-100 text-slate-800 border-slate-200';
      default: return 'bg-gray-150 text-gray-700 border-gray-250';
    }
  };

  const getPackageTierLabel = (tier: string) => {
    switch (tier) {
      case 'diamond': return '💎 ماسي';
      case 'gold': return '🥇 ذهبي';
      case 'silver': return '🥈 فضي';
      default: return 'عادي';
    }
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all shadow-sm bg-white hover:shadow-md ${
      hidden ? 'border-red-200 bg-red-50/5' : 
      isPinned ? 'border-amber-300 bg-amber-50/10' : 'border-slate-150'
    }`}>
      {/* Header Info */}
      <div className="flex flex-wrap justify-between items-start gap-3 border-b border-slate-100 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
            {type === 'doctor' && (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
                🩺 {(item as Doctor).specialty}
              </span>
            )}
            {type === 'pharmacy' && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                💊 صيدلية
              </span>
            )}
            {type === 'lab' && (
              <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-bold">
                🧪 معمل تحاليل
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-1">📌 {item.address} {item.village ? `• ${item.village}` : ''}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {isFeatured && <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-lg border border-amber-200">⭐ مميز</span>}
          {isVerified && <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-lg border border-emerald-200">✅ موثق</span>}
          {isPinned && <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-lg border border-blue-200">📌 مثبت</span>}
          <span className={`font-bold px-2 py-0.5 rounded-lg border ${getPackageBadgeColor(packageTier)}`}>
            {getPackageTierLabel(packageTier)}
          </span>
        </div>
      </div>

      {/* Grid of Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-semibold text-slate-700">
        
        {/* ⭐ مميز */}
        <label className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-xl cursor-pointer transition-all">
          <div className="flex items-center gap-2">
            <span className="text-sm">⭐</span>
            <span className="font-bold text-slate-800">مميز (شارة وإطار ذهبي)</span>
          </div>
          <input 
            type="checkbox" 
            checked={isFeatured} 
            onChange={e => setIsFeatured(e.target.checked)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
          />
        </label>

        {/* ✅ موثق */}
        <label className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-xl cursor-pointer transition-all">
          <div className="flex items-center gap-2">
            <span className="text-sm text-emerald-500">✅</span>
            <span className="font-bold text-slate-800">موثق (علامة خضراء)</span>
          </div>
          <input 
            type="checkbox" 
            checked={isVerified} 
            onChange={e => setIsVerified(e.target.checked)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
          />
        </label>

        {/* 📌 تثبيت في الأعلى */}
        <label className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-xl cursor-pointer transition-all">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-500">📌</span>
            <span className="font-bold text-slate-800">تثبيت في الأعلى</span>
          </div>
          <input 
            type="checkbox" 
            checked={isPinned} 
            onChange={e => setIsPinned(e.target.checked)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
          />
        </label>

        {/* إخفاء / إظهار */}
        <label className={`flex items-center justify-between p-2.5 border rounded-xl cursor-pointer transition-all ${
          hidden ? 'bg-red-50 hover:bg-red-100/50 border-red-200' : 'bg-slate-50 hover:bg-slate-100/70 border-slate-150'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-sm">{hidden ? '👁️‍🗨️' : '👁️'}</span>
            <span className="font-bold text-slate-800">{hidden ? 'مخفي حالياً' : 'مستمر بالظهور'}</span>
          </div>
          <input 
            type="checkbox" 
            checked={hidden} 
            onChange={e => setHidden(e.target.checked)}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300 rounded"
          />
        </label>

        {/* عرض في الصفحة الرئيسية */}
        <label className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-xl cursor-pointer transition-all">
          <div className="flex items-center gap-2">
            <span className="text-sm text-indigo-500">🏠</span>
            <span className="font-bold text-slate-800">عرض بالصفحة الرئيسية</span>
          </div>
          <input 
            type="checkbox" 
            checked={showOnHome} 
            onChange={e => setShowOnHome(e.target.checked)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
          />
        </label>

        {/* الظهور في نتائج البحث */}
        <label className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-150 rounded-xl cursor-pointer transition-all">
          <div className="flex items-center gap-2">
            <span className="text-sm text-amber-500">🔍</span>
            <span className="font-bold text-slate-800">يظهر في نتائج البحث</span>
          </div>
          <input 
            type="checkbox" 
            checked={showInSearch} 
            onChange={e => setShowInSearch(e.target.checked)}
            className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
          />
        </label>

        {/* اختيار الباقة */}
        <div className="flex flex-col gap-1">
          <label className="text-[10.5px] font-bold text-slate-500">باقة الاشتراك والترتيب</label>
          <select 
            value={packageTier} 
            onChange={e => setPackageTier(e.target.value)}
            className="bg-white border border-slate-150 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="normal">عادي (Normal)</option>
            <option value="silver">🥈 فضي (Silver)</option>
            <option value="gold">🥇 ذهبي (Gold)</option>
            <option value="diamond">💎 ماسي (Diamond)</option>
          </select>
        </div>

        {/* ترتيب الظهور */}
        <div className="flex flex-col gap-1">
          <label className="text-[10.5px] font-bold text-slate-500">الترتيب اليدوي للظهور</label>
          <input 
            type="number" 
            value={displayOrder} 
            onChange={e => setDisplayOrder(e.target.value)}
            placeholder="مثال: 1, 2, 3..."
            className="bg-white border border-slate-150 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-emerald-500 font-mono text-left"
            dir="ltr"
          />
        </div>

        {/* مواعيد العمل */}
        <div className="flex flex-col gap-1 sm:col-span-1">
          <label className="text-[10.5px] font-bold text-slate-500">مواعيد العمل (الأيام)</label>
          <div className="flex gap-1 items-center">
            <select 
              value={startDay} 
              onChange={e => setStartDay(e.target.value)}
              className="bg-white border border-slate-150 rounded-xl px-1.5 py-2.5 text-[11px] font-bold text-slate-700 w-1/2 text-center"
            >
              <option value="السبت">السبت</option>
              <option value="الأحد">الأحد</option>
              <option value="الإثنين">الإثنين</option>
              <option value="الثلاثاء">الثلاثاء</option>
              <option value="الأربعاء">الأربعاء</option>
              <option value="الخميس">الخميس</option>
              <option value="الجمعة">الجمعة</option>
            </select>
            <span className="text-slate-400">إلى</span>
            <select 
              value={endDay} 
              onChange={e => setEndDay(e.target.value)}
              className="bg-white border border-slate-150 rounded-xl px-1.5 py-2.5 text-[11px] font-bold text-slate-700 w-1/2 text-center"
            >
              <option value="السبت">السبت</option>
              <option value="الأحد">الأحد</option>
              <option value="الإثنين">الإثنين</option>
              <option value="الثلاثاء">الثلاثاء</option>
              <option value="الأربعاء">الأربعاء</option>
              <option value="الخميس">الخميس</option>
              <option value="الجمعة">الجمعة</option>
            </select>
          </div>
        </div>

        {/* الساعات */}
        <div className="flex flex-col gap-1">
          <label className="text-[10.5px] font-bold text-slate-500">مواعيد العمل (الساعات)</label>
          <div className="flex gap-1 items-center">
            <input 
              type="text" 
              value={openHour} 
              onChange={e => setOpenHour(e.target.value)}
              placeholder="09:00"
              className="bg-white border border-slate-150 rounded-xl p-2.5 text-xs font-bold text-slate-700 text-center w-1/2 font-mono"
            />
            <span className="text-slate-400">إلى</span>
            <input 
              type="text" 
              value={closeHour} 
              onChange={e => setCloseHour(e.target.value)}
              placeholder="21:00"
              className="bg-white border border-slate-150 rounded-xl p-2.5 text-xs font-bold text-slate-700 text-center w-1/2 font-mono"
            />
          </div>
        </div>

        {/* تعديل الخدمات */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-[10.5px] font-bold text-slate-500">تعديل الخدمات (افصل بينها بفاصلة أو حرف "،")</label>
          <textarea 
            value={servicesProvided} 
            onChange={e => setServicesProvided(e.target.value)}
            placeholder="مثال: كشف باطني، رسم قلب، سونار..."
            rows={1}
            className="bg-white border border-slate-150 rounded-xl p-2.5 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-emerald-500 resize-none h-[42px]"
          />
        </div>

      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-4 border-t border-slate-100 pt-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 text-xs"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'جاري الحفظ والرفع...' : 'حفظ التعديلات'}</span>
        </button>
      </div>
    </div>
  );
}

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
  onUpdateDoctors: (docs: Doctor[]) => void;
  onUpdatePharmacies: (pharms: Pharmacy[]) => void;
  onUpdateLabs: (labs: Lab[]) => void;
  onUpdateSpecialties: (specs: string[]) => void;
  onUpdateAds: (ads: Ad[]) => void;
  onUpdateConfig: (cfg: HomePageConfig) => void;
  onSaveConfig?: (cfg: HomePageConfig) => Promise<void>;
  onUpdateDoctorRequests: (reqs: DoctorRequest[]) => void;
  onUpdateContactMessages: (msgs: ContactMessage[]) => void;
  onAddLog: (action: string, type: 'doctor' | 'pharmacy' | 'lab' | 'specialty' | 'ad' | 'system' | 'backup', details: string) => void;
  onShowToast: (msg: string) => void;
}

export default function AdminPanel({
  adminLoggedIn, onLogin, onLogout,
  doctors, pharmacies, labs, specialties, ads, logs, config, doctorRequests, contactMessages,
  onUpdateDoctors, onUpdatePharmacies, onUpdateLabs, onUpdateSpecialties, onUpdateAds, onUpdateConfig, onSaveConfig,
  onUpdateDoctorRequests, onUpdateContactMessages, onAddLog, onShowToast
}: AdminPanelProps) {
  
  const [passcode, setPasscode] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'requests' | 'contact' | 'doctors' | 'pharmacies' | 'labs' | 'specialties' | 'ads' | 'settings' | 'logs' | 'distinction'>('stats');
  
  // Entity Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState({
    name: '',
    specialty: specialties[0] || '',
    clinicName: '',
    address: '',
    phone: '',
    whatsapp: '',
    isFeatured: false,
    isVerified: false,
    isPinned: false,
    pinDuration: '7' as '7' | '30' | '90' | 'permanent',
    pinExpiryDate: '',
    packageTier: 'normal' as 'normal' | 'silver' | 'gold' | 'diamond',
    servicesProvided: '',
    startDay: 'السبت',
    endDay: 'الخميس',
    openHour: '09:00',
    closeHour: '21:00',
    daysOff: [] as string[],
    village: '',
    displayOrder: '',
    hidden: false,
    showOnHome: true,
    showInSearch: true
  });
  const [pharmForm, setPharmForm] = useState({
    name: '',
    address: '',
    phone: '',
    whatsapp: '',
    isFeatured: false,
    isVerified: false,
    isPinned: false,
    pinDuration: '7' as '7' | '30' | '90' | 'permanent',
    pinExpiryDate: '',
    packageTier: 'normal' as 'normal' | 'silver' | 'gold' | 'diamond',
    servicesProvided: '',
    startDay: 'السبت',
    endDay: 'الخميس',
    openHour: '09:00',
    closeHour: '21:00',
    daysOff: [] as string[],
    village: '',
    displayOrder: '',
    hidden: false,
    showOnHome: true,
    showInSearch: true
  });
  const [labForm, setLabForm] = useState({
    name: '',
    address: '',
    phone: '',
    whatsapp: '',
    isFeatured: false,
    isVerified: false,
    isPinned: false,
    pinDuration: '7' as '7' | '30' | '90' | 'permanent',
    pinExpiryDate: '',
    packageTier: 'normal' as 'normal' | 'silver' | 'gold' | 'diamond',
    servicesProvided: '',
    startDay: 'السبت',
    endDay: 'الخميس',
    openHour: '09:00',
    closeHour: '21:00',
    daysOff: [] as string[],
    village: '',
    displayOrder: '',
    hidden: false,
    showOnHome: true,
    showInSearch: true
  });
  const [newSpecialty, setNewSpecialty] = useState('');
  
  // Ad Form State
  const [adForm, setAdForm] = useState({
    title: '',
    content: '',
    link: '',
    position: 'top' as Ad['position'],
    displayOrder: 1,
    duration: 5,
    backgroundColor: '#059669',
    textColor: '#ffffff',
    isActive: true,
    startDate: '',
    endDate: ''
  });

  // Doctor Addition Requests Management States
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState<string>('all');
  const [requestServiceTypeFilter, setRequestServiceTypeFilter] = useState<string>('all');
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
  
  // Contact messages management states
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState<string>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  
  // File upload ref for database restoration
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Distinction View States
  const [distinctionType, setDistinctionType] = useState<'doctor' | 'pharmacy' | 'lab'>('doctor');
  const [distinctionSearch, setDistinctionSearch] = useState('');

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
  const handleUpdateRequestStatus = async (id: string, newStatus: DoctorRequest['status'], adminNotes: string, rejectionReason?: string) => {
    const req = doctorRequests.find(r => r.id === id);
    if (!req) return;

    try {
      console.log(`Unified Status Change: Request ${id} to ${newStatus}...`);
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

      // If transition to 'published' and not already published, add listing to the respective collection
      if (newStatus === 'published' && req.status !== 'published') {
        let newId = '';

        if (serviceType === 'doctor') {
          newId = `doc-${Date.now()}`;
          const newDoc: Doctor = {
            id: newId,
            name: req.name,
            specialty: req.specialty || 'تخصص عام',
            clinicName: req.clinicName || 'عيادة خاصة',
            address: req.address,
            phone: req.phone,
            whatsapp: req.phone,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'doctors', newId), newDoc);
          onUpdateDoctors([newDoc, ...doctors]);
          onAddLog('إضافة', 'doctor', `تم قبول ونشر بيانات الطبيب الجديد: ${req.name} من طلب الرقم: ${req.id}`);
        } else if (serviceType === 'pharmacy') {
          newId = `pharm-${Date.now()}`;
          const displayName = req.name + (req.pharmacistName ? ` (د. ${req.pharmacistName})` : '');
          const newPharm: Pharmacy = {
            id: newId,
            name: displayName,
            address: req.address,
            phone: req.phone,
            whatsapp: req.phone,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'pharmacies', newId), newPharm);
          onUpdatePharmacies([newPharm, ...pharmacies]);
          onAddLog('إضافة', 'pharmacy', `تم قبول ونشر الصيدلية الجديدة: ${req.name} من طلب الرقم: ${req.id}`);
        } else if (serviceType === 'lab' || serviceType === 'scan_center') {
          newId = `lab-${Date.now()}`;
          const suffix = serviceType === 'scan_center' ? ' (مركز أشعة)' : '';
          const newLab: Lab = {
            id: newId,
            name: req.name + suffix,
            address: req.address,
            phone: req.phone,
            whatsapp: req.phone,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'labs', newId), newLab);
          onUpdateLabs([newLab, ...labs]);
          onAddLog('إضافة', 'lab', `تم قبول ونشر ${currentTypeLabel} الجديد: ${req.name} من طلب الرقم: ${req.id}`);
        } else if (serviceType === 'hospital') {
          newId = `doc-${Date.now()}`;
          const newDoc: Doctor = {
            id: newId,
            name: req.name,
            specialty: 'مستشفى / مركز طبي',
            clinicName: 'قسم الاستقبال والطوارئ',
            address: req.address,
            phone: req.phone,
            whatsapp: req.phone,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'doctors', newId), newDoc);
          onUpdateDoctors([newDoc, ...doctors]);
          onAddLog('إضافة', 'doctor', `تم قبول ونشر مستشفى جديد: ${req.name} من طلب الرقم: ${req.id}`);
        } else if (serviceType === 'physiotherapy') {
          newId = `doc-${Date.now()}`;
          const newDoc: Doctor = {
            id: newId,
            name: req.name,
            specialty: 'علاج طبيعي وتأهيل',
            clinicName: 'مركز علاج طبيعي',
            address: req.address,
            phone: req.phone,
            whatsapp: req.phone,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'doctors', newId), newDoc);
          onUpdateDoctors([newDoc, ...doctors]);
          onAddLog('إضافة', 'doctor', `تم قبول ونشر مركز علاج طبيعي: ${req.name} من طلب الرقم: ${req.id}`);
        } else {
          newId = `doc-${Date.now()}`;
          const newDoc: Doctor = {
            id: newId,
            name: req.name,
            specialty: req.shortDescription || 'خدمة طبية أخرى',
            clinicName: 'خدمات طبية عامة',
            address: req.address,
            phone: req.phone,
            whatsapp: req.phone,
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'doctors', newId), newDoc);
          onUpdateDoctors([newDoc, ...doctors]);
          onAddLog('إضافة', 'doctor', `تم قبول ونشر خدمة طبية أخرى: ${req.name} من طلب الرقم: ${req.id}`);
        }
      }

      const historyEntry = {
        timestamp: new Date().toISOString(),
        status: newStatus,
        updatedBy: "مدير النظام",
        notes: adminNotes || rejectionReason || 'تم تحديث حالة الطلب.'
      };

      const updatedReq: DoctorRequest = {
        ...req,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        adminNotes: adminNotes || req.adminNotes || '',
        rejectionReason: rejectionReason || req.rejectionReason || '',
        history: [
          ...(req.history || []),
          historyEntry
        ]
      };

      await setDoc(doc(db, 'requests', id), updatedReq);
      console.log(`Firebase: Request ${id} status updated to ${newStatus} with history entry.`);

      const updatedRequests = doctorRequests.map(r => r.id === id ? updatedReq : r);
      onUpdateDoctorRequests(updatedRequests);

      onAddLog('تعديل', 'system', `تم تحديث حالة طلب إضافة: ${req.name} إلى [${newStatus}]`);
      onShowToast(`✅ تم تحديث حالة الطلب بنجاح إلى "${getStatusLabelArabic(newStatus)}".`);
    } catch (error: any) {
      console.error(`Firebase Error updating request status ${id}:`, error);
      alert(`❌ فشل تحديث حالة الطلب في قاعدة البيانات: ${error.message || error}`);
    }
  };

  const getStatusLabelArabic = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'قيد المراجعة والتدقيق الإداري',
      contacting: 'جاري التواصل مع مقدم الطلب',
      reviewing_data: 'جاري مراجعة البيانات',
      incomplete_data: 'البيانات غير مكتملة',
      awaiting_completion: 'بانتظار استكمال البيانات',
      accepted: 'مقبول (قيد النشر والتهيئة)',
      published: 'منشور بالدليل العام',
      rejected: 'مرفوض',
      cancelled: 'ملغي',
      archived: 'مؤرشف ومغلق'
    };
    return labels[status] || status;
  };

  const acceptAndPublishRequest = async (req: DoctorRequest) => {
    await handleUpdateRequestStatus(req.id, 'published', 'تم قبول ونشر الخدمة في الدليل مباشرة.');
  };

  const acceptRequestOnly = async (id: string, name: string) => {
    await handleUpdateRequestStatus(id, 'accepted', 'تم القبول المبدئي للطلب وجاري العمل على مراجعته وتهيئة بطاقة النشر.');
  };

  const submitRejection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionId || !rejectionReasonInput.trim()) {
      onShowToast('⚠️ يرجى كتابة سبب الرفض أولاً.');
      return;
    }
    await handleUpdateRequestStatus(rejectionId, 'rejected', `تم رفض الطلب: ${rejectionReasonInput}`, rejectionReasonInput);
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

  const saveEditedRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRequestId) return;

    const req = doctorRequests.find(r => r.id === editingRequestId);
    if (!req) return;

    try {
      console.log(`Firebase: Saving edited request ${editingRequestId} details...`);
      const updatedReq = {
        ...req,
        serviceType: editingRequestForm.serviceType,
        name: editingRequestForm.name,
        specialty: editingRequestForm.specialty,
        clinicName: editingRequestForm.clinicName,
        pharmacistName: editingRequestForm.pharmacistName,
        shortDescription: editingRequestForm.shortDescription,
        address: editingRequestForm.address,
        phone: editingRequestForm.phone,
        notes: editingRequestForm.notes
      };

      await setDoc(doc(db, 'requests', editingRequestId), updatedReq);
      console.log(`Firebase: Request ${editingRequestId} details updated successfully.`);

      const updatedRequests = doctorRequests.map(r => r.id === editingRequestId ? updatedReq : r);
      onUpdateDoctorRequests(updatedRequests);

      onAddLog('تعديل', 'system', `تم تعديل بيانات طلب الإضافة: ${editingRequestForm.name}`);
      onShowToast('✅ تم حفظ التعديلات على بيانات الطلب بنجاح.');
      setEditingRequestId(null);
    } catch (error: any) {
      console.error(`Firebase Error saving edited request ${editingRequestId}:`, error);
      alert(`❌ فشل حفظ تعديلات الطلب في قاعدة البيانات: ${error.message || error}`);
    }
  };

  const deleteDoctorRequest = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف طلب إضافة: ${name} نهائياً؟`)) {
      try {
        console.log(`Firebase: Deleting request ${id}...`);
        await deleteDoc(doc(db, 'requests', id));
        console.log(`Firebase: Request ${id} deleted successfully.`);

        onUpdateDoctorRequests(doctorRequests.filter(r => r.id !== id));
        onAddLog('حذف', 'system', `تم حذف طلب إضافة: ${name}`);
        onShowToast('🗑️ تم حذف طلب الإضافة بنجاح.');
      } catch (error: any) {
        console.error(`Firebase Error deleting request ${id}:`, error);
        alert(`❌ فشل حذف طلب الإضافة من قاعدة البيانات: ${error.message || error}`);
      }
    }
  };

  // --- CRUD ACTIONS FOR CONTACT MESSAGES ---
  const handleUpdateMessageStatus = async (id: string, newStatus: ContactMessage['status']) => {
    try {
      const msgToUpdate = contactMessages.find(m => m.id === id);
      if (!msgToUpdate) return;
      
      const updatedMsg: ContactMessage = {
        ...msgToUpdate,
        status: newStatus
      };
      
      await setDoc(doc(db, 'contactMessages', id), updatedMsg);
      onUpdateContactMessages(contactMessages.map(m => m.id === id ? updatedMsg : m));
      
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(updatedMsg);
      }
      
      const statusLabels: Record<string, string> = {
        new: 'جديدة',
        read: 'تمت القراءة',
        replied: 'تم الرد',
        closed: 'مغلقة'
      };
      
      onShowToast(`✔️ تم تحديث حالة الرسالة إلى "${statusLabels[newStatus]}".`);
      onAddLog('تعديل', 'system', `تم تحديث حالة رسالة التواصل (${id}) إلى: ${statusLabels[newStatus]}`);
    } catch (err: any) {
      console.error("Error updating contact message status in Firestore:", err);
      onShowToast(`❌ فشل في تحديث حالة الرسالة: ${err.message || err}`);
      handleFirestoreError(err, OperationType.UPDATE, `contactMessages/${id}`);
    }
  };

  const handleDeleteMessage = async (id: string, name: string) => {
    if (window.confirm(`⚠️ هل أنت متأكد من رغبتك في حذف رسالة التواصل من المواطن "${name}" نهائياً؟`)) {
      try {
        await deleteDoc(doc(db, 'contactMessages', id));
        onUpdateContactMessages(contactMessages.filter(m => m.id !== id));
        
        if (selectedMessage && selectedMessage.id === id) {
          setSelectedMessage(null);
        }
        
        onShowToast('🗑️ تم حذف الرسالة بنجاح.');
        onAddLog('حذف', 'system', `تم حذف رسالة تواصل من المواطن: ${name} (ID: ${id})`);
      } catch (err: any) {
        console.error("Error deleting contact message from Firestore:", err);
        onShowToast(`❌ فشل في حذف الرسالة: ${err.message || err}`);
        handleFirestoreError(err, OperationType.DELETE, `contactMessages/${id}`);
      }
    }
  };

  // --- CRUD ACTIONS FOR DOCTORS ---
  const saveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.name || !docForm.address || !docForm.phone) {
      onShowToast('⚠️ يرجى ملء الحقول الأساسية: الاسم، العنوان، ورقم الهاتف.');
      return;
    }
    
    try {
      const servicesArray = docForm.servicesProvided
        ? docForm.servicesProvided.split(/,|،/).map(s => s.trim()).filter(Boolean)
        : [];

      let calculatedPinExpiry = '';
      if (docForm.isPinned) {
        if (docForm.pinDuration !== 'permanent') {
          const days = parseInt(docForm.pinDuration || '7', 10);
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + days);
          calculatedPinExpiry = expiry.toISOString();
        } else {
          calculatedPinExpiry = '';
        }
      }

      const docData = {
        name: docForm.name,
        specialty: docForm.specialty,
        clinicName: docForm.clinicName,
        address: docForm.address,
        phone: docForm.phone,
        whatsapp: docForm.whatsapp,
        isFeatured: docForm.isFeatured,
        isVerified: docForm.isVerified,
        isPinned: docForm.isPinned,
        pinDuration: docForm.pinDuration,
        pinExpiryDate: calculatedPinExpiry,
        packageTier: docForm.packageTier,
        servicesProvided: servicesArray,
        startDay: docForm.startDay,
        endDay: docForm.endDay,
        openHour: docForm.openHour,
        closeHour: docForm.closeHour,
        daysOff: docForm.daysOff,
        village: docForm.village,
        displayOrder: parseInt(docForm.displayOrder || '0', 10) || 0,
        hidden: docForm.hidden,
        showOnHome: docForm.showOnHome !== false,
        showInSearch: docForm.showInSearch !== false,
        lastUpdated: new Date().toISOString()
      };

      const emptyDocForm = {
        name: '',
        specialty: specialties[0] || '',
        clinicName: '',
        address: '',
        phone: '',
        whatsapp: '',
        isFeatured: false,
        isVerified: false,
        isPinned: false,
        pinDuration: '7' as '7' | '30' | '90' | 'permanent',
        pinExpiryDate: '',
        packageTier: 'normal' as 'normal' | 'silver' | 'gold' | 'diamond',
        servicesProvided: '',
        startDay: 'السبت',
        endDay: 'الخميس',
        openHour: '09:00',
        closeHour: '21:00',
        daysOff: [] as string[],
        village: '',
        displayOrder: '',
        hidden: false,
        showOnHome: true,
        showInSearch: true
      };

      if (editingId && editingId !== 'new') {
        console.log(`Firebase: Updating doctor ${editingId}...`);
        const existingDoc = doctors.find(d => d.id === editingId);
        const updatedDoc = {
          ...docData,
          id: editingId,
          createdAt: existingDoc?.createdAt || new Date().toISOString()
        };
        await setDoc(doc(db, 'doctors', editingId), updatedDoc);
        console.log(`Firebase: Doctor ${editingId} updated successfully.`);

        const updated = doctors.map(d => d.id === editingId ? updatedDoc : d);
        onUpdateDoctors(updated);
        onAddLog('تعديل', 'doctor', `تم تعديل بيانات الطبيب: ${docForm.name}`);
        onShowToast('✅ تم تعديل بيانات الطبيب بنجاح.');
        setEditingId(null);
        setDocForm(emptyDocForm);
      } else {
        const newId = `doc-${Date.now()}`;
        console.log(`Firebase: Creating new doctor with ID ${newId}...`);
        const newDoc: Doctor = {
          id: newId,
          ...docData,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'doctors', newId), newDoc);
        console.log(`Firebase: Doctor ${newId} saved successfully.`);

        onUpdateDoctors([newDoc, ...doctors]);
        onAddLog('إضافة', 'doctor', `تمت إضافة الطبيب الجديد: ${docForm.name}`);
        onShowToast('✅ تمت إضافة الطبيب بنجاح.');
        setEditingId(null);
        setDocForm(emptyDocForm);
      }
    } catch (error: any) {
      console.error("Firebase Error saving doctor:", error);
      alert(`❌ فشل حفظ بيانات الطبيب في قاعدة البيانات: ${error.message || error}`);
    }
  };

  const deleteDoctor = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الطبيب: ${name}؟`)) {
      try {
        console.log(`Firebase: Deleting doctor ${id}...`);
        await deleteDoc(doc(db, 'doctors', id));
        console.log(`Firebase: Doctor ${id} deleted successfully.`);

        onUpdateDoctors(doctors.filter(d => d.id !== id));
        onAddLog('حذف', 'doctor', `تم حذف الطبيب: ${name}`);
        onShowToast('🗑️ تم حذف الطبيب بنجاح.');
      } catch (error: any) {
        console.error("Firebase Error deleting doctor:", error);
        alert(`❌ فشل حذف الطبيب من قاعدة البيانات: ${error.message || error}`);
      }
    }
  };

  // --- CRUD ACTIONS FOR PHARMACIES ---
  const savePharmacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmForm.name || !pharmForm.address || !pharmForm.phone) {
      onShowToast('⚠️ يرجى ملء الحقول الأساسية: الاسم، العنوان، ورقم الهاتف.');
      return;
    }

    try {
      const servicesArray = pharmForm.servicesProvided
        ? pharmForm.servicesProvided.split(/,|،/).map(s => s.trim()).filter(Boolean)
        : [];

      let calculatedPinExpiry = '';
      if (pharmForm.isPinned) {
        if (pharmForm.pinDuration !== 'permanent') {
          const days = parseInt(pharmForm.pinDuration || '7', 10);
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + days);
          calculatedPinExpiry = expiry.toISOString();
        } else {
          calculatedPinExpiry = '';
        }
      }

      const pharmData = {
        name: pharmForm.name,
        address: pharmForm.address,
        phone: pharmForm.phone,
        whatsapp: pharmForm.whatsapp,
        isFeatured: pharmForm.isFeatured,
        isVerified: pharmForm.isVerified,
        isPinned: pharmForm.isPinned,
        pinDuration: pharmForm.pinDuration,
        pinExpiryDate: calculatedPinExpiry,
        packageTier: pharmForm.packageTier,
        servicesProvided: servicesArray,
        startDay: pharmForm.startDay,
        endDay: pharmForm.endDay,
        openHour: pharmForm.openHour,
        closeHour: pharmForm.closeHour,
        daysOff: pharmForm.daysOff,
        village: pharmForm.village,
        displayOrder: parseInt(pharmForm.displayOrder || '0', 10) || 0,
        hidden: pharmForm.hidden,
        showOnHome: pharmForm.showOnHome !== false,
        showInSearch: pharmForm.showInSearch !== false,
        lastUpdated: new Date().toISOString()
      };

      const emptyPharmForm = {
        name: '',
        address: '',
        phone: '',
        whatsapp: '',
        isFeatured: false,
        isVerified: false,
        isPinned: false,
        pinDuration: '7' as '7' | '30' | '90' | 'permanent',
        pinExpiryDate: '',
        packageTier: 'normal' as 'normal' | 'silver' | 'gold' | 'diamond',
        servicesProvided: '',
        startDay: 'السبت',
        endDay: 'الخميس',
        openHour: '09:00',
        closeHour: '21:00',
        daysOff: [] as string[],
        village: '',
        displayOrder: '',
        hidden: false,
        showOnHome: true,
        showInSearch: true
      };

      if (editingId && editingId !== 'new') {
        console.log(`Firebase: Updating pharmacy ${editingId}...`);
        const existingPharm = pharmacies.find(p => p.id === editingId);
        const updatedPharm = {
          ...pharmData,
          id: editingId,
          createdAt: existingPharm?.createdAt || new Date().toISOString()
        };
        await setDoc(doc(db, 'pharmacies', editingId), updatedPharm);
        console.log(`Firebase: Pharmacy ${editingId} updated successfully.`);

        const updated = pharmacies.map(p => p.id === editingId ? updatedPharm : p);
        onUpdatePharmacies(updated);
        onAddLog('تعديل', 'pharmacy', `تم تعديل صيدلية: ${pharmForm.name}`);
        onShowToast('✅ تم تعديل الصيدلية بنجاح.');
        setEditingId(null);
        setPharmForm(emptyPharmForm);
      } else {
        const newId = `pharm-${Date.now()}`;
        console.log(`Firebase: Creating new pharmacy with ID ${newId}...`);
        const newPharm: Pharmacy = {
          id: newId,
          ...pharmData,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'pharmacies', newId), newPharm);
        console.log(`Firebase: Pharmacy ${newId} saved successfully.`);

        onUpdatePharmacies([newPharm, ...pharmacies]);
        onAddLog('إضافة', 'pharmacy', `تمت إضافة صيدلية جديدة: ${pharmForm.name}`);
        onShowToast('✅ تمت إضافة الصيدلية بنجاح.');
        setEditingId(null);
        setPharmForm(emptyPharmForm);
      }
    } catch (error: any) {
      console.error("Firebase Error saving pharmacy:", error);
      alert(`❌ فشل حفظ بيانات الصيدلية في قاعدة البيانات: ${error.message || error}`);
    }
  };

  const deletePharmacy = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف الصيدلية: ${name}؟`)) {
      try {
        console.log(`Firebase: Deleting pharmacy ${id}...`);
        await deleteDoc(doc(db, 'pharmacies', id));
        console.log(`Firebase: Pharmacy ${id} deleted successfully.`);

        onUpdatePharmacies(pharmacies.filter(p => p.id !== id));
        onAddLog('حذف', 'pharmacy', `تم حذف الصيدلية: ${name}`);
        onShowToast('🗑️ تم حذف الصيدلية بنجاح.');
      } catch (error: any) {
        console.error("Firebase Error deleting pharmacy:", error);
        alert(`❌ فشل حذف الصيدلية من قاعدة البيانات: ${error.message || error}`);
      }
    }
  };

  // --- CRUD ACTIONS FOR LABS ---
  const saveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labForm.name || !labForm.address || !labForm.phone) {
      onShowToast('⚠️ يرجى ملء الحقول الأساسية: الاسم، العنوان، ورقم الهاتف.');
      return;
    }

    try {
      const servicesArray = labForm.servicesProvided
        ? labForm.servicesProvided.split(/,|،/).map(s => s.trim()).filter(Boolean)
        : [];

      let calculatedPinExpiry = '';
      if (labForm.isPinned) {
        if (labForm.pinDuration !== 'permanent') {
          const days = parseInt(labForm.pinDuration || '7', 10);
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + days);
          calculatedPinExpiry = expiry.toISOString();
        } else {
          calculatedPinExpiry = '';
        }
      }

      const labData = {
        name: labForm.name,
        address: labForm.address,
        phone: labForm.phone,
        whatsapp: labForm.whatsapp,
        isFeatured: labForm.isFeatured,
        isVerified: labForm.isVerified,
        isPinned: labForm.isPinned,
        pinDuration: labForm.pinDuration,
        pinExpiryDate: calculatedPinExpiry,
        packageTier: labForm.packageTier,
        servicesProvided: servicesArray,
        startDay: labForm.startDay,
        endDay: labForm.endDay,
        openHour: labForm.openHour,
        closeHour: labForm.closeHour,
        daysOff: labForm.daysOff,
        village: labForm.village,
        displayOrder: parseInt(labForm.displayOrder || '0', 10) || 0,
        hidden: labForm.hidden,
        showOnHome: labForm.showOnHome !== false,
        showInSearch: labForm.showInSearch !== false,
        lastUpdated: new Date().toISOString()
      };

      const emptyLabForm = {
        name: '',
        address: '',
        phone: '',
        whatsapp: '',
        isFeatured: false,
        isVerified: false,
        isPinned: false,
        pinDuration: '7' as '7' | '30' | '90' | 'permanent',
        pinExpiryDate: '',
        packageTier: 'normal' as 'normal' | 'silver' | 'gold' | 'diamond',
        servicesProvided: '',
        startDay: 'السبت',
        endDay: 'الخميس',
        openHour: '09:00',
        closeHour: '21:00',
        daysOff: [] as string[],
        village: '',
        displayOrder: '',
        hidden: false,
        showOnHome: true,
        showInSearch: true
      };

      if (editingId && editingId !== 'new') {
        console.log(`Firebase: Updating lab ${editingId}...`);
        const existingLab = labs.find(l => l.id === editingId);
        const updatedLab = {
          ...labData,
          id: editingId,
          createdAt: existingLab?.createdAt || new Date().toISOString()
        };
        await setDoc(doc(db, 'labs', editingId), updatedLab);
        console.log(`Firebase: Lab ${editingId} updated successfully.`);

        const updated = labs.map(l => l.id === editingId ? updatedLab : l);
        onUpdateLabs(updated);
        onAddLog('تعديل', 'lab', `تم تعديل معمل التحاليل: ${labForm.name}`);
        onShowToast('✅ تم تعديل بيانات المعمل بنجاح.');
        setEditingId(null);
        setLabForm(emptyLabForm);
      } else {
        const newId = `lab-${Date.now()}`;
        console.log(`Firebase: Creating new lab with ID ${newId}...`);
        const newLab: Lab = {
          id: newId,
          ...labData,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'labs', newId), newLab);
        console.log(`Firebase: Lab ${newId} saved successfully.`);

        onUpdateLabs([newLab, ...labs]);
        onAddLog('إضافة', 'lab', `تمت إضافة معمل تحاليل جديد: ${labForm.name}`);
        onShowToast('✅ تمت إضافة المعمل بنجاح.');
        setEditingId(null);
        setLabForm(emptyLabForm);
      }
    } catch (error: any) {
      console.error("Firebase Error saving lab:", error);
      alert(`❌ فشل حفظ بيانات المعمل في قاعدة البيانات: ${error.message || error}`);
    }
  };

  const deleteLab = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف المعمل: ${name}؟`)) {
      try {
        console.log(`Firebase: Deleting lab ${id}...`);
        await deleteDoc(doc(db, 'labs', id));
        console.log(`Firebase: Lab ${id} deleted successfully.`);

        onUpdateLabs(labs.filter(l => l.id !== id));
        onAddLog('حذف', 'lab', `تم حذف المعمل: ${name}`);
        onShowToast('🗑️ تم حذف معمل التحاليل بنجاح.');
      } catch (error: any) {
        console.error("Firebase Error deleting lab:", error);
        alert(`❌ فشل حذف المعمل من قاعدة البيانات: ${error.message || error}`);
      }
    }
  };

  const toggleDoctorVisibility = async (id: string, name: string, hidden?: boolean) => {
    const docToUpdate = doctors.find(d => d.id === id);
    if (!docToUpdate) return;

    try {
      console.log(`Firebase: Toggling visibility of doctor ${id} to ${!hidden}...`);
      const updatedDoc = { ...docToUpdate, hidden: !hidden };
      await setDoc(doc(db, 'doctors', id), updatedDoc);
      console.log(`Firebase: Doctor ${id} visibility updated successfully.`);

      const updated = doctors.map(d => d.id === id ? updatedDoc : d);
      onUpdateDoctors(updated);
      onAddLog('تعديل', 'doctor', `تم ${hidden ? 'إظهار' : 'إخفاء'} الطبيب: ${name}`);
      onShowToast(`✔️ تم ${hidden ? 'إظهار' : 'إخفاء'} الطبيب بنجاح`);
    } catch (error: any) {
      console.error("Firebase Error toggling doctor visibility:", error);
      alert(`❌ فشل تعديل حالة إظهار الطبيب في قاعدة البيانات: ${error.message || error}`);
    }
  };

  const togglePharmacyVisibility = async (id: string, name: string, hidden?: boolean) => {
    const pharmToUpdate = pharmacies.find(p => p.id === id);
    if (!pharmToUpdate) return;

    try {
      console.log(`Firebase: Toggling visibility of pharmacy ${id} to ${!hidden}...`);
      const updatedPharm = { ...pharmToUpdate, hidden: !hidden };
      await setDoc(doc(db, 'pharmacies', id), updatedPharm);
      console.log(`Firebase: Pharmacy ${id} visibility updated successfully.`);

      const updated = pharmacies.map(p => p.id === id ? updatedPharm : p);
      onUpdatePharmacies(updated);
      onAddLog('تعديل', 'pharmacy', `تم ${hidden ? 'إظهار' : 'إخفاء'} الصيدلية: ${name}`);
      onShowToast(`✔️ تم ${hidden ? 'إظهار' : 'إخفاء'} الصيدلية بنجاح`);
    } catch (error: any) {
      console.error("Firebase Error toggling pharmacy visibility:", error);
      alert(`❌ فشل تعديل حالة إظهار الصيدلية في قاعدة البيانات: ${error.message || error}`);
    }
  };

  const toggleLabVisibility = async (id: string, name: string, hidden?: boolean) => {
    const labToUpdate = labs.find(l => l.id === id);
    if (!labToUpdate) return;

    try {
      console.log(`Firebase: Toggling visibility of lab ${id} to ${!hidden}...`);
      const updatedLab = { ...labToUpdate, hidden: !hidden };
      await setDoc(doc(db, 'labs', id), updatedLab);
      console.log(`Firebase: Lab ${id} visibility updated successfully.`);

      const updated = labs.map(l => l.id === id ? updatedLab : l);
      onUpdateLabs(updated);
      onAddLog('تعديل', 'lab', `تم ${hidden ? 'إظهار' : 'إخفاء'} المعمل: ${name}`);
      onShowToast(`✔️ تم ${hidden ? 'إظهار' : 'إخفاء'} المعمل بنجاح`);
    } catch (error: any) {
      console.error("Firebase Error toggling lab visibility:", error);
      alert(`❌ فشل تعديل حالة إظهار المعمل في قاعدة البيانات: ${error.message || error}`);
    }
  };

  // --- SPECIALTIES ACTIONS ---
  const addSpecialty = async () => {
    if (!newSpecialty.trim()) return;
    const specName = newSpecialty.trim();
    if (specialties.includes(specName)) {
      onShowToast('⚠️ هذا التخصص موجود بالفعل.');
      return;
    }

    try {
      console.log(`Firebase: Adding specialty "${specName}" to settings/specialties...`);
      const updated = [...specialties, specName];
      await setDoc(doc(db, 'settings', 'specialties'), { list: updated });
      console.log(`Firebase: Specialty saved successfully.`);

      onUpdateSpecialties(updated);
      onAddLog('إضافة', 'specialty', `تمت إضافة تخصص طبي جديد: ${newSpecialty}`);
      onShowToast('✅ تم إدراج التخصص الطبي الجديد بنجاح.');
      setNewSpecialty('');
    } catch (error: any) {
      console.error("Firebase Error saving specialty:", error);
      alert(`❌ فشل إضافة التخصص في قاعدة البيانات: ${error.message || error}`);
    }
  };

  const deleteSpecialty = async (specName: string) => {
    const isUsed = doctors.some(d => d.specialty === specName);
    if (isUsed) {
      onShowToast('❌ لا يمكن حذف تخصص مرتبط بأطباء مسجلين حالياً!');
      return;
    }

    if (window.confirm(`هل ترغب في حذف التخصص الطبي: "${specName}"؟`)) {
      try {
        console.log(`Firebase: Removing specialty "${specName}" from settings/specialties...`);
        const updated = specialties.filter(s => s !== specName);
        await setDoc(doc(db, 'settings', 'specialties'), { list: updated });
        console.log(`Firebase: Specialty deleted successfully.`);

        onUpdateSpecialties(updated);
        onAddLog('حذف', 'specialty', `تم حذف التخصص الطبي: ${specName}`);
        onShowToast('🗑️ تم حذف التخصص بنجاح.');
      } catch (error: any) {
        console.error("Firebase Error deleting specialty:", error);
        alert(`❌ فشل حذف التخصص من قاعدة البيانات: ${error.message || error}`);
      }
    }
  };

  // --- ADS ACTIONS ---
  const resetAdForm = () => {
    setAdForm({
      title: '',
      content: '',
      link: '',
      position: 'top',
      displayOrder: 1,
      duration: 5,
      backgroundColor: '#059669',
      textColor: '#ffffff',
      isActive: true,
      startDate: '',
      endDate: ''
    });
  };

  const saveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.content) {
      onShowToast('⚠️ يرجى تعبئة محتوى الإعلان.');
      return;
    }

    try {
      const adData: Ad = {
        id: editingId && editingId !== 'new' ? editingId : `ad-${Date.now()}`,
        title: adForm.content.substring(0, 35),
        content: adForm.content,
        link: adForm.link || '#',
        position: adForm.position,
        displayOrder: Number(adForm.displayOrder) || 1,
        duration: Number(adForm.duration) || 5,
        backgroundColor: adForm.backgroundColor || '#059669',
        textColor: adForm.textColor || '#ffffff',
        isActive: adForm.isActive,
        startDate: adForm.startDate || '',
        endDate: adForm.endDate || ''
      };

      if (editingId && editingId !== 'new') {
        console.log(`Firebase: Updating ad ${editingId}...`);
        await setDoc(doc(db, 'ads', editingId), adData);
        console.log(`Firebase: Ad ${editingId} updated successfully.`);

        const updated = ads.map(a => a.id === editingId ? adData : a);
        onUpdateAds(updated);
        onAddLog('تعديل', 'ad', `تم تعديل الإعلان: ${adData.content.substring(0, 30)}`);
        onShowToast('✅ تم تحديث بيانات الإعلان بنجاح.');
        setEditingId(null);
        resetAdForm();
      } else {
        console.log(`Firebase: Creating new ad ${adData.id}...`);
        await setDoc(doc(db, 'ads', adData.id), adData);
        console.log(`Firebase: Ad ${adData.id} saved successfully.`);

        onUpdateAds([adData, ...ads]);
        onAddLog('إضافة', 'ad', `تم إدراج إعلان ترويجي جديد: ${adData.content.substring(0, 30)}`);
        onShowToast('✅ تمت إضافة الإعلان بنجاح.');
        setEditingId(null);
        resetAdForm();
      }
    } catch (error: any) {
      console.error("Firebase Error saving ad:", error);
      alert(`❌ فشل حفظ الإعلان في قاعدة البيانات: ${error.message || error}`);
    }
  };

  const toggleAdStatus = async (id: string, currentStatus: boolean, title: string) => {
    const adToUpdate = ads.find(a => a.id === id);
    if (!adToUpdate) return;

    try {
      console.log(`Firebase: Toggling status of ad ${id} to ${!currentStatus}...`);
      const updatedAd = { ...adToUpdate, isActive: !currentStatus };
      await setDoc(doc(db, 'ads', id), updatedAd);
      console.log(`Firebase: Ad ${id} status updated successfully.`);

      const updated = ads.map(a => a.id === id ? updatedAd : a);
      onUpdateAds(updated);
      onAddLog('تعديل', 'ad', `تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} الإعلان: ${title}`);
      onShowToast(`📢 تم ${!currentStatus ? 'تفعيل' : 'تعطيل'} الإعلان بنجاح.`);
    } catch (error: any) {
      console.error("Firebase Error toggling ad status:", error);
      alert(`❌ فشل تعديل حالة الإعلان في قاعدة البيانات: ${error.message || error}`);
    }
  };

  const deleteAd = async (id: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من إزالة هذا الإعلان: ${title}؟`)) {
      try {
        console.log(`Firebase: Deleting ad ${id}...`);
        await deleteDoc(doc(db, 'ads', id));
        console.log(`Firebase: Ad ${id} deleted successfully.`);

        onUpdateAds(ads.filter(a => a.id !== id));
        onAddLog('حذف', 'ad', `تم حذف الإعلان: ${title}`);
        onShowToast('🗑️ تم حذف الإعلان بنجاح.');
      } catch (error: any) {
        console.error("Firebase Error deleting ad:", error);
        alert(`❌ فشل حذف الإعلان من قاعدة البيانات: ${error.message || error}`);
      }
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
    reader.onload = async (event) => {
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

        onShowToast('⏳ جاري استعادة البيانات في قاعدة بيانات Firebase...');

        // 1. Save doctors
        for (const item of importedData.doctors) {
          await setDoc(doc(db, 'doctors', item.id), item);
        }
        // 2. Save pharmacies
        for (const item of importedData.pharmacies) {
          await setDoc(doc(db, 'pharmacies', item.id), item);
        }
        // 3. Save labs
        for (const item of importedData.labs) {
          await setDoc(doc(db, 'labs', item.id), item);
        }
        // 4. Save specialties
        await setDoc(doc(db, 'settings', 'specialties'), { list: importedData.specialties });
        // 5. Save ads
        for (const item of importedData.ads) {
          await setDoc(doc(db, 'ads', item.id), item);
        }
        // 6. Save config
        if (importedData.config) {
          await setDoc(doc(db, 'settings', 'main'), importedData.config);
        }

        // Now update local React state
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
        console.error("Firebase Error importing backup:", err);
        alert(`❌ فشل استعادة البيانات: ${err.message || 'الملف تالف أو غير متوافق.'}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveConfigPress = async () => {
    if (!onSaveConfig) return;
    setIsSavingConfig(true);
    try {
      await onSaveConfig(config);
      onAddLog('حفظ الإعدادات بالكامل', 'system', 'تم حفظ وتحديث إعدادات الموقع وهوية البصرية والألوان في قاعدة البيانات بنجاح.');
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setIsSavingConfig(false);
    }
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
    { id: 'requests', label: 'طلبات الأطباء', icon: ClipboardList, badge: doctorRequests.filter(r => r.status === 'pending').length },
    { id: 'contact', label: 'رسائل التواصل', icon: FileText, badge: contactMessages.filter(m => m.status === 'new').length },
    { id: 'doctors', label: 'الأطباء', icon: FileText },
    { id: 'pharmacies', label: 'الصيدليات', icon: FileText },
    { id: 'labs', label: 'المعامل', icon: FileText },
    { id: 'distinction', label: 'إدارة التميز والظهور', icon: Sparkles },
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
            <p className="text-slate-400 text-xs sm:text-sm font-semibold mt-1">تعديل الأطباء، الصيدليات، المعامل، التخصصات والإعلانات ورسائل التواصل</p>
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
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                    isActive ? 'bg-white text-emerald-600' : 'bg-rose-500 text-white animate-pulse'
                  }`}>
                    {tab.badge}
                  </span>
                )}
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
              
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
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

                <div 
                  onClick={() => setActiveSubTab('contact')}
                  className="bg-white hover:bg-slate-50 cursor-pointer rounded-2xl border border-slate-150 p-4 flex flex-col justify-between shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px] font-bold">رسائل تواصل جديدة</span>
                    <span className="text-lg">📧</span>
                  </div>
                  <span className={`text-3xl font-extrabold mt-4 block ${
                    contactMessages.filter(m => m.status === 'new').length > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-900'
                  }`}>
                    {contactMessages.filter(m => m.status === 'new').length}
                  </span>
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
              <div className="bg-white rounded-2xl border border-slate-150 p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Search bar */}
                  <div className="flex-1 bg-slate-50 border border-slate-150 rounded-xl p-3 flex items-center gap-2.5">
                    <Search className="h-5 w-5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={requestSearch}
                      onChange={e => setRequestSearch(e.target.value)}
                      placeholder="البحث برقم الطلب ID، أو اسم المنشأة، أو رقم الهاتف..."
                      className="w-full bg-transparent border-none text-slate-800 font-semibold placeholder:text-slate-400 focus:outline-none text-sm"
                    />
                    {requestSearch && (
                      <button
                        onClick={() => setRequestSearch('')}
                        className="text-xs font-bold text-rose-500 hover:underline"
                      >
                        مسح
                      </button>
                    )}
                  </div>

                  {/* Service Type Filter */}
                  <div className="w-full md:w-60">
                    <select
                      value={requestServiceTypeFilter}
                      onChange={e => setRequestServiceTypeFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                    >
                      <option value="all">كل الخدمات الطبية</option>
                      <option value="doctor">طبيب</option>
                      <option value="pharmacy">صيدلية</option>
                      <option value="lab">معمل تحاليل</option>
                      <option value="scan_center">مركز أشعة</option>
                      <option value="hospital">مستشفى</option>
                      <option value="physiotherapy">مركز علاج طبيعي</option>
                      <option value="other">خدمة طبية أخرى</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="w-full md:w-64">
                    <select
                      value={requestStatusFilter}
                      onChange={e => setRequestStatusFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                    >
                      <option value="all">كل الحالات الإدارية</option>
                      <option value="pending">قيد المراجعة والتدقيق الإداري</option>
                      <option value="contacting">جاري التواصل مع مقدم الطلب</option>
                      <option value="reviewing_data">جاري مراجعة البيانات</option>
                      <option value="incomplete_data">البيانات غير مكتملة</option>
                      <option value="awaiting_completion">بانتظار استكمال البيانات</option>
                      <option value="accepted">مقبول (قيد النشر والتهيئة)</option>
                      <option value="published">منشور بالدليل العام</option>
                      <option value="rejected">مرفوض</option>
                      <option value="cancelled">ملغي</option>
                      <option value="archived">مؤرشف ومغلق</option>
                    </select>
                  </div>
                </div>

                {/* Quick reset active filters row */}
                {(requestSearch || requestStatusFilter !== 'all' || requestServiceTypeFilter !== 'all') && (
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-lg border">
                    <span>عدد الطلبات المفلترة حالياً: {doctorRequests.filter(r => {
                      const query = requestSearch.trim().toLowerCase();
                      const matchesQuery = !query || 
                        r.id.toLowerCase().includes(query) || 
                        r.name.toLowerCase().includes(query) ||
                        (r.phone || '').toLowerCase().includes(query) ||
                        (r.specialty || '').toLowerCase().includes(query) ||
                        (r.pharmacistName || '').toLowerCase().includes(query) ||
                        (r.shortDescription || '').toLowerCase().includes(query);
                      const matchesServiceType = requestServiceTypeFilter === 'all' || r.serviceType === requestServiceTypeFilter;
                      const matchesStatus = requestStatusFilter === 'all' || r.status === requestStatusFilter;
                      return matchesQuery && matchesServiceType && matchesStatus;
                    }).length} طلبات</span>
                    <button
                      onClick={() => {
                        setRequestSearch('');
                        setRequestStatusFilter('all');
                        setRequestServiceTypeFilter('all');
                      }}
                      className="text-rose-600 hover:text-rose-700 font-bold hover:underline"
                    >
                      إعادة تعيين كافة الفلاتر
                    </button>
                  </div>
                )}
              </div>

              {/* Requests List */}
              {(() => {
                const query = requestSearch.trim().toLowerCase();
                const filtered = doctorRequests.filter(r => {
                  const matchesQuery = !query || 
                    r.id.toLowerCase().includes(query) || 
                    r.name.toLowerCase().includes(query) ||
                    (r.phone || '').toLowerCase().includes(query) ||
                    (r.specialty || '').toLowerCase().includes(query) ||
                    (r.pharmacistName || '').toLowerCase().includes(query) ||
                    (r.shortDescription || '').toLowerCase().includes(query) ||
                    (r.address || '').toLowerCase().includes(query);

                  const matchesServiceType = requestServiceTypeFilter === 'all' || r.serviceType === requestServiceTypeFilter;
                  const matchesStatus = requestStatusFilter === 'all' || r.status === requestStatusFilter;

                  return matchesQuery && matchesServiceType && matchesStatus;
                });

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
                    {filtered.map((req) => (
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
                        onDeleteRequest={deleteDoctorRequest}
                        handleUpdateRequestStatus={handleUpdateRequestStatus}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* === SUB-TAB: CONTACT MESSAGES MANAGEMENT === */}
          {activeSubTab === 'contact' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">رسائل وتواصل المواطنين</h2>
                  <p className="text-slate-500 text-xs mt-1 font-semibold">مراجعة رسائل واستفسارات المواطنين الواردة من صفحة اتصل بنا وإدارتها</p>
                </div>
                
                {/* Unread count badge */}
                <span className="bg-rose-100 text-rose-800 text-xs font-bold px-3.5 py-1.5 rounded-full border border-rose-200 shadow-sm animate-pulse">
                  {contactMessages.filter(m => m.status === 'new').length} رسائل جديدة قيد الانتظار
                </span>
              </div>

              {/* Filters & Search Row */}
              <div className="bg-white rounded-2xl border border-slate-150 p-4 flex flex-col md:flex-row gap-4 justify-between items-center shadow-sm">
                <div className="relative w-full md:w-96">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="البحث بالاسم، رقم الهاتف، أو موضوع الرسالة..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-semibold outline-none"
                  />
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                  <span className="text-xs font-bold text-slate-500 shrink-0">حالة الرسالة:</span>
                  <select
                    value={contactStatusFilter}
                    onChange={(e) => setContactStatusFilter(e.target.value)}
                    className="w-full md:w-48 bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-700 focus:bg-white focus:border-emerald-500 transition-all outline-none"
                  >
                    <option value="all">الكل ({contactMessages.length})</option>
                    <option value="new">جديدة ({contactMessages.filter(m => m.status === 'new').length})</option>
                    <option value="read">تمت القراءة ({contactMessages.filter(m => m.status === 'read').length})</option>
                    <option value="replied">تم الرد ({contactMessages.filter(m => m.status === 'replied').length})</option>
                    <option value="closed">مغلقة ({contactMessages.filter(m => m.status === 'closed').length})</option>
                  </select>
                </div>
              </div>

              {/* Messages Grid or Table */}
              <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
                {(() => {
                  const filtered = contactMessages.filter(msg => {
                    const currentName = msg.fullName || (msg as any).name || '';
                    if (contactStatusFilter !== 'all' && msg.status !== contactStatusFilter) return false;
                    if (contactSearch.trim()) {
                      const q = contactSearch.toLowerCase().trim();
                      return (
                        currentName.toLowerCase().includes(q) ||
                        msg.phone?.toLowerCase().includes(q) ||
                        msg.subject?.toLowerCase().includes(q) ||
                        msg.message?.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-16 text-center space-y-3">
                        <span className="text-4xl block">📧</span>
                        <h3 className="text-base font-bold text-slate-700">لا توجد رسائل تواصل مطابقة للبحث</h3>
                        <p className="text-slate-400 text-xs font-semibold max-w-sm mx-auto">تأكد من كتابة مصطلح بحث صحيح أو تغيير فلتر الحالة لرؤية الرسائل الأخرى.</p>
                        {contactSearch && (
                          <button
                            type="button"
                            onClick={() => setContactSearch('')}
                            className="text-xs font-bold text-emerald-600 hover:underline"
                          >
                            تنظيف حقل البحث
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-extrabold text-xs">
                            <th className="p-4">اسم المواطن</th>
                            <th className="p-4">رقم الهاتف</th>
                            <th className="p-4">موضوع الاستفسار</th>
                            <th className="p-4">تاريخ ووقت الإرسال</th>
                            <th className="p-4">الحالة</th>
                            <th className="p-4 text-center">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                          {filtered.map((msg) => {
                            const currentId = msg.messageId || msg.id || '';
                            const currentName = msg.fullName || (msg as any).name || '';
                            return (
                              <tr key={currentId} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4">
                                  <span className="font-bold text-slate-950 block">{currentName}</span>
                                  {msg.email && <span className="text-[10px] text-slate-400 font-normal">{msg.email}</span>}
                                </td>
                                <td className="p-4">
                                  <span className="font-mono text-slate-600 block text-right" dir="ltr">{msg.phone}</span>
                                </td>
                                <td className="p-4">
                                  <span className="line-clamp-1 max-w-[200px] text-slate-800">{msg.subject || 'بدون موضوع'}</span>
                                </td>
                                <td className="p-4 text-slate-500">
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : 'غير محدد'}
                                </td>
                                <td className="p-4">
                                  {(() => {
                                    switch (msg.status) {
                                      case 'new':
                                        return (
                                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[10px] px-2 py-1 rounded-full border border-rose-100 shadow-sm animate-pulse">
                                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                                            جديدة
                                          </span>
                                        );
                                      case 'read':
                                        return (
                                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] px-2 py-1 rounded-full border border-blue-100 shadow-sm">
                                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                                            تمت القراءة
                                          </span>
                                        );
                                      case 'replied':
                                        return (
                                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] px-2 py-1 rounded-full border border-emerald-100 shadow-sm">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                            تم الرد
                                          </span>
                                        );
                                      case 'closed':
                                        return (
                                          <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 text-[10px] px-2 py-1 rounded-full border border-slate-200 shadow-sm">
                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                                            مغلقة
                                          </span>
                                        );
                                      default:
                                        return null;
                                    }
                                  })()}
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        setSelectedMessage(msg);
                                        if (msg.status === 'new') {
                                          await handleUpdateMessageStatus(currentId, 'read');
                                        }
                                      }}
                                      className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-100 transition-all shadow-sm"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                      <span>عرض التفاصيل</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMessage(currentId, currentName)}
                                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100 shadow-sm"
                                      title="حذف الرسالة"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Message Details Overlay */}
              {selectedMessage && (() => {
                const selectedId = selectedMessage.messageId || selectedMessage.id || '';
                const selectedName = selectedMessage.fullName || (selectedMessage as any).name || '';
                return (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setSelectedMessage(null)}>
                    <div 
                      className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Modal Header */}
                      <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                            <FileText className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-white">تفاصيل رسالة التواصل</h3>
                            <p className="text-slate-400 text-xs font-semibold mt-0.5">الرقم المرجعي للرسالة: {selectedId}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedMessage(null)}
                          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300 hover:text-white"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Modal Content */}
                      <div className="p-6 overflow-y-auto space-y-6 text-right" dir="rtl">
                        {/* Grid Citizen Data */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <span className="text-[10px] font-extrabold text-slate-400 block mb-1">اسم المواطن</span>
                            <span className="text-sm font-bold text-slate-900 block">{selectedName}</span>
                          </div>

                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
                            <div>
                              <span className="text-[10px] font-extrabold text-slate-400 block mb-1">رقم الهاتف</span>
                              <span className="text-sm font-mono font-extrabold text-slate-900 block" dir="ltr">{selectedMessage.phone}</span>
                            </div>
                            <div className="flex gap-1">
                              <a
                                href={`tel:${selectedMessage.phone}`}
                                className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                                title="اتصال مباشر"
                              >
                                📞
                              </a>
                              <a
                                href={`https://wa.me/2${selectedMessage.phone}`}
                                target="_blank"
                                referrerPolicy="no-referrer"
                                className="p-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition-colors"
                                title="تواصل واتساب"
                              >
                                💬
                              </a>
                            </div>
                          </div>

                          {selectedMessage.email && (
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex justify-between items-center">
                              <div>
                                <span className="text-[10px] font-extrabold text-slate-400 block mb-1">البريد الإلكتروني</span>
                                <span className="text-sm font-bold text-slate-900 block break-all">{selectedMessage.email}</span>
                              </div>
                              <a
                                href={`mailto:${selectedMessage.email}`}
                                className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                                title="إرسال بريد إلكتروني"
                              >
                                ✉️
                              </a>
                            </div>
                          )}

                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <span className="text-[10px] font-extrabold text-slate-400 block mb-1">تاريخ ووقت الإرسال</span>
                            <span className="text-sm font-bold text-slate-900 block">
                              {selectedMessage.createdAt ? new Date(selectedMessage.createdAt).toLocaleString('ar-EG') : 'غير محدد'}
                            </span>
                          </div>
                        </div>

                        {/* Subject */}
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                          <span className="text-[10px] font-extrabold text-slate-400 block mb-1">موضوع الاستفسار</span>
                          <h4 className="text-sm font-bold text-slate-950">{selectedMessage.subject || 'بدون موضوع'}</h4>
                        </div>

                        {/* Message Content */}
                        <div className="bg-emerald-50/20 border border-emerald-100/45 rounded-2xl p-5 space-y-2">
                          <span className="text-[10px] font-extrabold text-emerald-700 block">تفاصيل الرسالة أو الاستفسار:</span>
                          <p className="text-sm text-slate-800 leading-relaxed font-semibold whitespace-pre-line break-words text-justify">
                            {selectedMessage.message}
                          </p>
                        </div>

                        {/* Action Status Selection */}
                        <div className="border-t pt-4 space-y-3">
                          <span className="text-xs font-bold text-slate-500 block">تحديث حالة رسالة التواصل:</span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateMessageStatus(selectedId, 'new')}
                              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                                selectedMessage.status === 'new'
                                  ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              جديدة
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateMessageStatus(selectedId, 'read')}
                              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                                selectedMessage.status === 'read'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              تمت القراءة
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateMessageStatus(selectedId, 'replied')}
                              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                                selectedMessage.status === 'replied'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              تم الرد
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateMessageStatus(selectedId, 'closed')}
                              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                                selectedMessage.status === 'closed'
                                  ? 'bg-slate-100 text-slate-700 border-slate-300 shadow-sm'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              مغلقة
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteMessage(selectedId, selectedName);
                          }}
                          className="bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 py-2 px-4 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>حذف هذه الرسالة</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedMessage(null)}
                          className="bg-slate-900 hover:bg-slate-800 text-white py-2 px-6 rounded-xl text-xs font-bold transition-colors shadow-sm"
                        >
                          إغلاق النافذة
                        </button>
                      </div>
                    </div>
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

                  {/* --- إدارة التميز والظهور --- */}
                  <div className="border-t-2 border-dashed border-emerald-200 pt-5 mt-5 space-y-4 bg-emerald-50/20 p-4 rounded-xl border border-emerald-100 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="p-1.5 bg-emerald-500 text-white rounded-lg"><Settings className="h-4 w-4" /></span>
                      <h4 className="font-extrabold text-sm text-emerald-800">إدارة التميز والظهور للجهة</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Featured (مميز) */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={docForm.isFeatured} 
                          onChange={e => setDocForm({...docForm, isFeatured: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">⭐ تمييز الجهة (مميز)</span>
                          <span className="text-[10px] text-slate-500 block">إضافة شارة وإطار ذهبي مضيء</span>
                        </div>
                      </label>

                      {/* Verified (موثق) */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={docForm.isVerified} 
                          onChange={e => setDocForm({...docForm, isVerified: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">✅ توثيق الجهة (موثق)</span>
                          <span className="text-[10px] text-slate-500 block">إضافة علامة التوثيق الخضراء</span>
                        </div>
                      </label>

                      {/* Pinned (مثبت) */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={docForm.isPinned} 
                          onChange={e => setDocForm({...docForm, isPinned: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">📌 تثبيت الجهة في الأعلى</span>
                          <span className="text-[10px] text-slate-500 block">للظهور في مقدمة التصنيف</span>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Hide / Show Toggle */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={docForm.hidden} 
                          onChange={e => setDocForm({...docForm, hidden: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">👁️ إخفاء الجهة (مخفي)</span>
                          <span className="text-[10px] text-slate-500 block">إخفاء مؤقت دون الحذف</span>
                        </div>
                      </label>

                      {/* Show on Homepage */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={docForm.showOnHome} 
                          onChange={e => setDocForm({...docForm, showOnHome: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">🏠 عرض بالصفحة الرئيسية</span>
                          <span className="text-[10px] text-slate-500 block">تفعيل الظهور في الصفحة الرئيسية</span>
                        </div>
                      </label>

                      {/* Show in Search Results */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={docForm.showInSearch} 
                          onChange={e => setDocForm({...docForm, showInSearch: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">🔍 يظهر في نتائج البحث</span>
                          <span className="text-[10px] text-slate-500 block">تفعيل الظهور في نتائج البحث والتصنيفات</span>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {/* Pin Duration */}
                      {docForm.isPinned && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">مدة التثبيت في الأعلى</label>
                          <select 
                            value={docForm.pinDuration} 
                            onChange={e => setDocForm({...docForm, pinDuration: e.target.value as any})}
                            className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                          >
                            <option value="7">7 أيام (أسبوع)</option>
                            <option value="30">30 يوماً (شهر)</option>
                            <option value="90">90 يوماً (3 أشهر)</option>
                            <option value="permanent">دائم حتى يتم إلغاؤه</option>
                          </select>
                        </div>
                      )}

                      {/* Package tier */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">باقة الاشتراك والترتيب</label>
                        <select 
                          value={docForm.packageTier} 
                          onChange={e => setDocForm({...docForm, packageTier: e.target.value as any})}
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                        >
                          <option value="normal">عادي (Normal)</option>
                          <option value="silver">🥈 فضي (Silver)</option>
                          <option value="gold">🥇 ذهبي (Gold)</option>
                          <option value="diamond">💎 ماسي (Diamond)</option>
                        </select>
                      </div>

                      {/* Manual Sort Order */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">الترتيب اليدوي للظهور</label>
                        <input 
                          type="number" 
                          value={docForm.displayOrder} 
                          onChange={e => setDocForm({...docForm, displayOrder: e.target.value})}
                          placeholder="ترتيب رقمي تصاعدي"
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left font-bold"
                          dir="ltr"
                        />
                      </div>

                      {/* Village/Area */}
                      <div className={docForm.isPinned ? "" : "sm:col-span-2"}>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">القرية أو المنطقة بالوقف</label>
                        <input 
                          type="text" 
                          value={docForm.village} 
                          onChange={e => setDocForm({...docForm, village: e.target.value})}
                          placeholder="مدينة الوقف، المراشدة..."
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                        />
                      </div>
                    </div>

                    {/* Services Provided */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">الخدمات المقدمة (افصل بينها بفاصلة أو حرف "،")</label>
                      <textarea 
                        value={docForm.servicesProvided} 
                        onChange={e => setDocForm({...docForm, servicesProvided: e.target.value})}
                        placeholder="مثال: سونار رباعي، كشف باطني، رسم قلب، استشارة مجانية"
                        rows={2}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-bold text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 space-y-4">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">مواعيد العمل وحالة النشاط</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {/* Start Day */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">يوم بداية العمل</label>
                        <select 
                          value={docForm.startDay} 
                          onChange={e => setDocForm({...docForm, startDay: e.target.value})}
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>

                      {/* End Day */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">يوم نهاية العمل</label>
                        <select 
                          value={docForm.endDay} 
                          onChange={e => setDocForm({...docForm, endDay: e.target.value})}
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>

                      {/* Open Hour */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">ساعة الفتح (مثال 09:00)</label>
                        <input 
                          type="text" 
                          value={docForm.openHour} 
                          onChange={e => setDocForm({...docForm, openHour: e.target.value})}
                          placeholder="HH:mm"
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                          dir="ltr"
                        />
                      </div>

                      {/* Close Hour */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">ساعة الإغلاق (مثال 22:00)</label>
                        <input 
                          type="text" 
                          value={docForm.closeHour} 
                          onChange={e => setDocForm({...docForm, closeHour: e.target.value})}
                          placeholder="HH:mm"
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Days Off (العطلة الأسبوعية) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">العطلة الأسبوعية (أيام الإجازة)</label>
                      <div className="flex flex-wrap gap-3 bg-white p-3 border rounded-lg">
                        {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => {
                          const isOff = docForm.daysOff.includes(day);
                          return (
                            <label key={day} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={isOff}
                                onChange={() => {
                                  if (isOff) {
                                    setDocForm({...docForm, daysOff: docForm.daysOff.filter(d => d !== day)});
                                  } else {
                                    setDocForm({...docForm, daysOff: [...docForm.daysOff, day]});
                                  }
                                }}
                                className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                              />
                              <span>{day}</span>
                            </label>
                          );
                        })}
                      </div>
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
                                  whatsapp: d.whatsapp || '',
                                  isFeatured: d.isFeatured || false,
                                  isVerified: d.isVerified || false,
                                  isPinned: d.isPinned || false,
                                  pinDuration: d.pinDuration || '7',
                                  pinExpiryDate: d.pinExpiryDate || '',
                                  packageTier: d.packageTier || 'normal',
                                  servicesProvided: d.servicesProvided ? d.servicesProvided.join('، ') : '',
                                  startDay: d.startDay || 'السبت',
                                  endDay: d.endDay || 'الخميس',
                                  openHour: d.openHour || '09:00',
                                  closeHour: d.closeHour || '21:00',
                                  daysOff: d.daysOff || [],
                                  village: d.village || '',
                                  displayOrder: d.displayOrder ? String(d.displayOrder) : '',
                                  hidden: d.hidden || false,
                                  showOnHome: d.showOnHome !== false,
                                  showInSearch: d.showInSearch !== false
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

                  {/* --- إدارة التميز والظهور --- */}
                  <div className="border-t-2 border-dashed border-emerald-200 pt-5 mt-5 space-y-4 bg-emerald-50/20 p-4 rounded-xl border border-emerald-100 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="p-1.5 bg-emerald-500 text-white rounded-lg"><Settings className="h-4 w-4" /></span>
                      <h4 className="font-extrabold text-sm text-emerald-800">إدارة التميز والظهور للصيدلية</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Featured (مميز) */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={pharmForm.isFeatured} 
                          onChange={e => setPharmForm({...pharmForm, isFeatured: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">⭐ تمييز الصيدلية (مميز)</span>
                          <span className="text-[10px] text-slate-500 block">إضافة شارة وإطار ذهبي مضيء</span>
                        </div>
                      </label>

                      {/* Verified (موثق) */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={pharmForm.isVerified} 
                          onChange={e => setPharmForm({...pharmForm, isVerified: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">✅ توثيق الصيدلية (موثق)</span>
                          <span className="text-[10px] text-slate-500 block">إضافة علامة التوثيق الخضراء</span>
                        </div>
                      </label>

                      {/* Pinned (مثبت) */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={pharmForm.isPinned} 
                          onChange={e => setPharmForm({...pharmForm, isPinned: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">📌 تثبيت الصيدلية في الأعلى</span>
                          <span className="text-[10px] text-slate-500 block">للظهور في مقدمة التصنيف</span>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Hide / Show Toggle */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={pharmForm.hidden} 
                          onChange={e => setPharmForm({...pharmForm, hidden: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">👁️ إخفاء الصيدلية (مخفي)</span>
                          <span className="text-[10px] text-slate-500 block">إخفاء مؤقت دون الحذف</span>
                        </div>
                      </label>

                      {/* Show on Homepage */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={pharmForm.showOnHome} 
                          onChange={e => setPharmForm({...pharmForm, showOnHome: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">🏠 عرض بالصفحة الرئيسية</span>
                          <span className="text-[10px] text-slate-500 block">تفعيل الظهور في الصفحة الرئيسية</span>
                        </div>
                      </label>

                      {/* Show in Search Results */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={pharmForm.showInSearch} 
                          onChange={e => setPharmForm({...pharmForm, showInSearch: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">🔍 يظهر في نتائج البحث</span>
                          <span className="text-[10px] text-slate-500 block">تفعيل الظهور في نتائج البحث والتصنيفات</span>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {/* Pin Duration */}
                      {pharmForm.isPinned && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">مدة التثبيت في الأعلى</label>
                          <select 
                            value={pharmForm.pinDuration} 
                            onChange={e => setPharmForm({...pharmForm, pinDuration: e.target.value as any})}
                            className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                          >
                            <option value="7">7 أيام (أسبوع)</option>
                            <option value="30">30 يوماً (شهر)</option>
                            <option value="90">90 يوماً (3 أشهر)</option>
                            <option value="permanent">دائم حتى يتم إلغاؤه</option>
                          </select>
                        </div>
                      )}

                      {/* Package tier */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">باقة الاشتراك والترتيب</label>
                        <select 
                          value={pharmForm.packageTier} 
                          onChange={e => setPharmForm({...pharmForm, packageTier: e.target.value as any})}
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                        >
                          <option value="normal">عادي (Normal)</option>
                          <option value="silver">🥈 فضي (Silver)</option>
                          <option value="gold">🥇 ذهبي (Gold)</option>
                          <option value="diamond">💎 ماسي (Diamond)</option>
                        </select>
                      </div>

                      {/* Manual Sort Order */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">الترتيب اليدوي للظهور</label>
                        <input 
                          type="number" 
                          value={pharmForm.displayOrder} 
                          onChange={e => setPharmForm({...pharmForm, displayOrder: e.target.value})}
                          placeholder="ترتيب رقمي تصاعدي"
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left font-bold"
                          dir="ltr"
                        />
                      </div>

                      {/* Village/Area */}
                      <div className={pharmForm.isPinned ? "" : "sm:col-span-2"}>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">القرية أو المنطقة بالوقف</label>
                        <input 
                          type="text" 
                          value={pharmForm.village} 
                          onChange={e => setPharmForm({...pharmForm, village: e.target.value})}
                          placeholder="مدينة الوقف، المراشدة..."
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                        />
                      </div>
                    </div>

                    {/* Services Provided */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">الخدمات والأدوية المتوفرة (افصل بينها بفاصلة أو حرف "،")</label>
                      <textarea 
                        value={pharmForm.servicesProvided} 
                        onChange={e => setPharmForm({...pharmForm, servicesProvided: e.target.value})}
                        placeholder="مثال: تركيبات دوائية، توصيل منازل، قياس ضغط وسكر، صرف روشتات التأمين"
                        rows={2}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-bold text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 space-y-4">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">مواعيد عمل الصيدلية وحالة النشاط</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {/* Start Day */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">يوم بداية العمل</label>
                        <select 
                          value={pharmForm.startDay} 
                          onChange={e => setPharmForm({...pharmForm, startDay: e.target.value})}
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>

                      {/* End Day */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">يوم نهاية العمل</label>
                        <select 
                          value={pharmForm.endDay} 
                          onChange={e => setPharmForm({...pharmForm, endDay: e.target.value})}
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>

                      {/* Open Hour */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">ساعة الفتح (مثال 09:00)</label>
                        <input 
                          type="text" 
                          value={pharmForm.openHour} 
                          onChange={e => setPharmForm({...pharmForm, openHour: e.target.value})}
                          placeholder="HH:mm"
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                          dir="ltr"
                        />
                      </div>

                      {/* Close Hour */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">ساعة الإغلاق (مثال 22:00)</label>
                        <input 
                          type="text" 
                          value={pharmForm.closeHour} 
                          onChange={e => setPharmForm({...pharmForm, closeHour: e.target.value})}
                          placeholder="HH:mm"
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Days Off (العطلة الأسبوعية) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">العطلة الأسبوعية (أيام الإجازة)</label>
                      <div className="flex flex-wrap gap-3 bg-white p-3 border rounded-lg">
                        {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => {
                          const isOff = pharmForm.daysOff.includes(day);
                          return (
                            <label key={day} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={isOff}
                                onChange={() => {
                                  if (isOff) {
                                    setPharmForm({...pharmForm, daysOff: pharmForm.daysOff.filter(d => d !== day)});
                                  } else {
                                    setPharmForm({...pharmForm, daysOff: [...pharmForm.daysOff, day]});
                                  }
                                }}
                                className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                              />
                              <span>{day}</span>
                            </label>
                          );
                        })}
                      </div>
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
                                  whatsapp: p.whatsapp || '',
                                  isFeatured: p.isFeatured || false,
                                  isVerified: p.isVerified || false,
                                  isPinned: p.isPinned || false,
                                  pinDuration: p.pinDuration || '7',
                                  pinExpiryDate: p.pinExpiryDate || '',
                                  packageTier: p.packageTier || 'normal',
                                  servicesProvided: p.servicesProvided ? p.servicesProvided.join('، ') : '',
                                  startDay: p.startDay || 'السبت',
                                  endDay: p.endDay || 'الخميس',
                                  openHour: p.openHour || '09:00',
                                  closeHour: p.closeHour || '21:00',
                                  daysOff: p.daysOff || [],
                                  village: p.village || '',
                                  displayOrder: p.displayOrder ? String(p.displayOrder) : '',
                                  hidden: p.hidden || false,
                                  showOnHome: p.showOnHome !== false,
                                  showInSearch: p.showInSearch !== false
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

                  {/* --- إدارة التميز والظهور --- */}
                  <div className="border-t-2 border-dashed border-emerald-200 pt-5 mt-5 space-y-4 bg-emerald-50/20 p-4 rounded-xl border border-emerald-100 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="p-1.5 bg-emerald-500 text-white rounded-lg"><Settings className="h-4 w-4" /></span>
                      <h4 className="font-extrabold text-sm text-emerald-800">إدارة التميز والظهور للمعمل</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Featured (مميز) */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={labForm.isFeatured} 
                          onChange={e => setLabForm({...labForm, isFeatured: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">⭐ تمييز المعمل (مميز)</span>
                          <span className="text-[10px] text-slate-500 block">إضافة شارة وإطار ذهبي مضيء</span>
                        </div>
                      </label>

                      {/* Verified (موثق) */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={labForm.isVerified} 
                          onChange={e => setLabForm({...labForm, isVerified: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">✅ توثيق المعمل (موثق)</span>
                          <span className="text-[10px] text-slate-500 block">إضافة علامة التوثيق الخضراء</span>
                        </div>
                      </label>

                      {/* Pinned (مثبت) */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={labForm.isPinned} 
                          onChange={e => setLabForm({...labForm, isPinned: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">📌 تثبيت المعمل في الأعلى</span>
                          <span className="text-[10px] text-slate-500 block">للظهور في مقدمة التصنيف</span>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Hide / Show Toggle */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={labForm.hidden} 
                          onChange={e => setLabForm({...labForm, hidden: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">👁️ إخفاء المعمل (مخفي)</span>
                          <span className="text-[10px] text-slate-500 block">إخفاء مؤقت دون الحذف</span>
                        </div>
                      </label>

                      {/* Show on Homepage */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={labForm.showOnHome} 
                          onChange={e => setLabForm({...labForm, showOnHome: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">🏠 عرض بالصفحة الرئيسية</span>
                          <span className="text-[10px] text-slate-500 block">تفعيل الظهور في الصفحة الرئيسية</span>
                        </div>
                      </label>

                      {/* Show in Search Results */}
                      <label className="flex items-center gap-2.5 bg-white border rounded-xl p-3 cursor-pointer hover:bg-emerald-50/40 transition-colors shadow-sm">
                        <input 
                          type="checkbox" 
                          checked={labForm.showInSearch} 
                          onChange={e => setLabForm({...labForm, showInSearch: e.target.checked})}
                          className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                        />
                        <div className="text-right">
                          <span className="block text-xs font-bold text-slate-800">🔍 يظهر في نتائج البحث</span>
                          <span className="text-[10px] text-slate-500 block">تفعيل الظهور في نتائج البحث والتصنيفات</span>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {/* Pin Duration */}
                      {labForm.isPinned && (
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">مدة التثبيت في الأعلى</label>
                          <select 
                            value={labForm.pinDuration} 
                            onChange={e => setLabForm({...labForm, pinDuration: e.target.value as any})}
                            className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                          >
                            <option value="7">7 أيام (أسبوع)</option>
                            <option value="30">30 يوماً (شهر)</option>
                            <option value="90">90 يوماً (3 أشهر)</option>
                            <option value="permanent">دائم حتى يتم إلغاؤه</option>
                          </select>
                        </div>
                      )}

                      {/* Package tier */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">باقة الاشتراك والترتيب</label>
                        <select 
                          value={labForm.packageTier} 
                          onChange={e => setLabForm({...labForm, packageTier: e.target.value as any})}
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                        >
                          <option value="normal">عادي (Normal)</option>
                          <option value="silver">🥈 فضي (Silver)</option>
                          <option value="gold">🥇 ذهبي (Gold)</option>
                          <option value="diamond">💎 ماسي (Diamond)</option>
                        </select>
                      </div>

                      {/* Manual Sort Order */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">الترتيب اليدوي للظهور</label>
                        <input 
                          type="number" 
                          value={labForm.displayOrder} 
                          onChange={e => setLabForm({...labForm, displayOrder: e.target.value})}
                          placeholder="ترتيب رقمي تصاعدي"
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left font-bold"
                          dir="ltr"
                        />
                      </div>

                      {/* Village/Area */}
                      <div className={labForm.isPinned ? "" : "sm:col-span-2"}>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">القرية أو المنطقة بالوقف</label>
                        <input 
                          type="text" 
                          value={labForm.village} 
                          onChange={e => setLabForm({...labForm, village: e.target.value})}
                          placeholder="مدينة الوقف، المراشدة..."
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
                        />
                      </div>
                    </div>

                    {/* Services Provided */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">الخدمات والتحاليل المتوفرة (افصل بينها بفاصلة أو حرف "،")</label>
                      <textarea 
                        value={labForm.servicesProvided} 
                        onChange={e => setLabForm({...labForm, servicesProvided: e.target.value})}
                        placeholder="مثال: تحليل وظائف كبد، رسم قلب، تحليل سكر صائم وفاطر، تحاليل هرمونات"
                        rows={2}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none font-bold text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 space-y-4">
                    <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">مواعيد عمل المعمل وحالة النشاط</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      {/* Start Day */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">يوم بداية العمل</label>
                        <select 
                          value={labForm.startDay} 
                          onChange={e => setLabForm({...labForm, startDay: e.target.value})}
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>

                      {/* End Day */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">يوم نهاية العمل</label>
                        <select 
                          value={labForm.endDay} 
                          onChange={e => setLabForm({...labForm, endDay: e.target.value})}
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => (
                            <option key={day} value={day}>{day}</option>
                          ))}
                        </select>
                      </div>

                      {/* Open Hour */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">ساعة الفتح (مثال 09:00)</label>
                        <input 
                          type="text" 
                          value={labForm.openHour} 
                          onChange={e => setLabForm({...labForm, openHour: e.target.value})}
                          placeholder="HH:mm"
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                          dir="ltr"
                        />
                      </div>

                      {/* Close Hour */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">ساعة الإغلاق (مثال 22:00)</label>
                        <input 
                          type="text" 
                          value={labForm.closeHour} 
                          onChange={e => setLabForm({...labForm, closeHour: e.target.value})}
                          placeholder="HH:mm"
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Days Off (العطلة الأسبوعية) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">العطلة الأسبوعية (أيام الإجازة)</label>
                      <div className="flex flex-wrap gap-3 bg-white p-3 border rounded-lg">
                        {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map(day => {
                          const isOff = labForm.daysOff.includes(day);
                          return (
                            <label key={day} className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={isOff}
                                onChange={() => {
                                  if (isOff) {
                                    setLabForm({...labForm, daysOff: labForm.daysOff.filter(d => d !== day)});
                                  } else {
                                    setLabForm({...labForm, daysOff: [...labForm.daysOff, day]});
                                  }
                                }}
                                className="h-3.5 w-3.5 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                              />
                              <span>{day}</span>
                            </label>
                          );
                        })}
                      </div>
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
                                  whatsapp: l.whatsapp || '',
                                  isFeatured: l.isFeatured || false,
                                  isVerified: l.isVerified || false,
                                  isPinned: l.isPinned || false,
                                  pinDuration: l.pinDuration || '7',
                                  pinExpiryDate: l.pinExpiryDate || '',
                                  packageTier: l.packageTier || 'normal',
                                  servicesProvided: l.servicesProvided ? l.servicesProvided.join('، ') : '',
                                  startDay: l.startDay || 'السبت',
                                  endDay: l.endDay || 'الخميس',
                                  openHour: l.openHour || '09:00',
                                  closeHour: l.closeHour || '21:00',
                                  daysOff: l.daysOff || [],
                                  village: l.village || '',
                                  displayOrder: l.displayOrder ? String(l.displayOrder) : '',
                                  hidden: l.hidden || false,
                                  showOnHome: l.showOnHome !== false,
                                  showInSearch: l.showInSearch !== false
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

          {/* TAB: DISTINCTION & VISIBILITY MANAGEMENT */}
          {activeSubTab === 'distinction' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-amber-500" />
                    <span>إدارة التميز والظهور للجهات</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    تحكم كامل في إشارات التميز، باقات الاشتراك، ترتيب الظهور، التوثيق، والتثبيت في الصفحة الرئيسية لجميع الجهات.
                  </p>
                </div>
              </div>

              {/* Sub-filters (pills for entity type) */}
              <div className="bg-slate-50 border border-slate-150 p-2 rounded-2xl flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setDistinctionType('doctor');
                    setDistinctionSearch('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    distinctionType === 'doctor'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-55 hover:text-emerald-600'
                  }`}
                >
                  <span>🩺 الأطباء والعيادات</span>
                  <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-black">
                    {doctors.length}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setDistinctionType('pharmacy');
                    setDistinctionSearch('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    distinctionType === 'pharmacy'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-55 hover:text-blue-600'
                  }`}
                >
                  <span>💊 الصيدليات</span>
                  <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-black">
                    {pharmacies.length}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setDistinctionType('lab');
                    setDistinctionSearch('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    distinctionType === 'lab'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-55 hover:text-purple-600'
                  }`}
                >
                  <span>🧪 المعامل والمختبرات</span>
                  <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full font-black">
                    {labs.length}
                  </span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4.5 w-4.5" />
                <input
                  type="text"
                  value={distinctionSearch}
                  onChange={e => setDistinctionSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو العنوان للتعديل السريع..."
                  className="w-full bg-white border border-slate-150 rounded-2xl pr-10 pl-4 py-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                />
              </div>

              {/* Items List */}
              <div className="space-y-4">
                {(() => {
                  let list: any[] = [];
                  if (distinctionType === 'doctor') list = doctors;
                  else if (distinctionType === 'pharmacy') list = pharmacies;
                  else if (distinctionType === 'lab') list = labs;

                  const filtered = list.filter(item => {
                    const q = distinctionSearch.toLowerCase().trim();
                    return !q || item.name.toLowerCase().includes(q) || (item.address && item.address.toLowerCase().includes(q));
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center shadow-sm">
                        <span className="text-4xl block mb-3">🔍</span>
                        <h4 className="font-bold text-slate-800 text-sm">لم يتم العثور على أي نتائج</h4>
                        <p className="text-xs text-slate-400 mt-1">تأكد من كتابة الاسم بشكل صحيح أو تصفح الأقسام الأخرى.</p>
                      </div>
                    );
                  }

                  return filtered.map(item => (
                    <DistinctionItemCard
                      key={item.id}
                      item={item}
                      type={distinctionType}
                      doctors={doctors}
                      pharmacies={pharmacies}
                      labs={labs}
                      onUpdateDoctors={onUpdateDoctors}
                      onUpdatePharmacies={onUpdatePharmacies}
                      onUpdateLabs={onUpdateLabs}
                      onAddLog={onAddLog}
                      onShowToast={onShowToast}
                    />
                  ));
                })()}
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
                      resetAdForm();
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
                      <label className="block text-xs font-bold text-slate-600 mb-1">نص ومحتوى الإعلان بالتفصيل *</label>
                      <textarea 
                        required value={adForm.content} 
                        onChange={e => setAdForm({...adForm, content: e.target.value})}
                        rows={3}
                        placeholder="اكتب نص ومحتوى الإعلان الترويجي هنا..."
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">موضع ظهور الإعلان *</label>
                      <select 
                        value={adForm.position} 
                        onChange={e => setAdForm({...adForm, position: e.target.value as any})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
                      >
                        <option value="top">أعلى الصفحة</option>
                        <option value="bottom">أسفل الصفحة</option>
                        <option value="before_doctors">قبل قائمة الأطباء</option>
                        <option value="after_doctors">بعد قائمة الأطباء</option>
                        <option value="before_pharmacies">قبل الصيدليات</option>
                        <option value="after_pharmacies">بعد الصيدليات</option>
                        <option value="before_labs">قبل المعامل</option>
                        <option value="after_labs">بعد المعامل</option>
                        <option value="ticker">شريط الإعلانات المتحرك (Ticker)</option>
                        <option value="search_middle">بين نتائج البحث</option>
                        <option value="card_doctor">داخل كارت الطبيب</option>
                        <option value="card_pharmacy">داخل كارت الصيدلية</option>
                        <option value="card_lab">داخل كارت المعمل</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">رابط الإعلان (اختياري)</label>
                      <input 
                        type="text" value={adForm.link} 
                        onChange={e => setAdForm({...adForm, link: e.target.value})}
                        placeholder="مثال: https://wa.me/... أو رقم هاتف أو رابط"
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">ترتيب الظهور (الرقم الأصغر أولاً) *</label>
                      <input 
                        type="number" required min={1}
                        value={adForm.displayOrder}
                        onChange={e => setAdForm({...adForm, displayOrder: parseInt(e.target.value) || 1})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">مدة عرض الإعلان بالثواني *</label>
                      <input 
                        type="number" required min={1}
                        value={adForm.duration}
                        onChange={e => setAdForm({...adForm, duration: parseInt(e.target.value) || 5})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">لون الخلفية (كود هيكس أو فئة تايلوند) *</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={adForm.backgroundColor.startsWith('#') && adForm.backgroundColor.length === 7 ? adForm.backgroundColor : '#059669'} 
                          onChange={e => setAdForm({...adForm, backgroundColor: e.target.value})}
                          className="h-9 w-9 shrink-0 border rounded cursor-pointer p-0.5 bg-white"
                        />
                        <input 
                          type="text" required 
                          value={adForm.backgroundColor} 
                          onChange={e => setAdForm({...adForm, backgroundColor: e.target.value})}
                          placeholder="مثال: #059669 أو bg-slate-900"
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">لون النص (كود هيكس أو فئة تايلوند) *</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={adForm.textColor.startsWith('#') && adForm.textColor.length === 7 ? adForm.textColor : '#ffffff'} 
                          onChange={e => setAdForm({...adForm, textColor: e.target.value})}
                          className="h-9 w-9 shrink-0 border rounded cursor-pointer p-0.5 bg-white"
                        />
                        <input 
                          type="text" required 
                          value={adForm.textColor} 
                          onChange={e => setAdForm({...adForm, textColor: e.target.value})}
                          placeholder="مثال: #ffffff أو text-slate-950"
                          className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ بداية النشر (اختياري)</label>
                      <input 
                        type="date" 
                        value={adForm.startDate} 
                        onChange={e => setAdForm({...adForm, startDate: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ نهاية النشر (اختياري)</label>
                      <input 
                        type="date" 
                        value={adForm.endDate} 
                        onChange={e => setAdForm({...adForm, endDate: e.target.value})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-1">حالة تفعيل الإعلان *</label>
                      <select 
                        value={adForm.isActive ? 'true' : 'false'} 
                        onChange={e => setAdForm({...adForm, isActive: e.target.value === 'true'})}
                        className="w-full bg-white border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      >
                        <option value="true">مفعل ونشط</option>
                        <option value="false">معطل وغير نشط</option>
                      </select>
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
                      <th className="p-4">تفاصيل الإعلان</th>
                      <th className="p-4">مكان الظهور</th>
                      <th className="p-4">الترتيب والمدة</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4 text-left">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-sm">
                    {ads.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/55 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800 line-clamp-2 max-w-md">{a.content}</div>
                          {a.link && a.link !== '#' && <div className="text-xs text-blue-500 mt-1 truncate max-w-xs">{a.link}</div>}
                          {(a.startDate || a.endDate) && (
                            <div className="text-[10px] text-slate-400 mt-1">
                              الصلاحية: {a.startDate || 'بدون بداية'} إلى {a.endDate || 'بدون نهاية'}
                            </div>
                          )}
                        </td>
                        <td className="p-4 font-bold text-xs text-emerald-600">
                          {a.position === 'top' ? 'أعلى الصفحة' :
                           a.position === 'bottom' ? 'أسفل الصفحة' :
                           a.position === 'before_doctors' ? 'قبل كشف الأطباء' :
                           a.position === 'after_doctors' ? 'بعد كشف الأطباء' :
                           a.position === 'before_pharmacies' ? 'قبل الصيدليات' :
                           a.position === 'after_pharmacies' ? 'بعد الصيدليات' :
                           a.position === 'before_labs' ? 'قبل المعامل' :
                           a.position === 'after_labs' ? 'بعد المعامل' :
                           a.position === 'ticker' ? 'شريط الأخبار (Ticker)' :
                           a.position === 'search_middle' ? 'بين كشوف البحث' :
                           a.position === 'card_doctor' ? 'كارت الطبيب' :
                           a.position === 'card_pharmacy' ? 'كارت الصيدلية' : 'كارت المعمل'}
                        </td>
                        <td className="p-4 text-xs font-semibold text-slate-600">
                          <div>الترتيب: {a.displayOrder || 1}</div>
                          <div>المدة: {a.duration || 5} ث</div>
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
                                  title: a.title || '',
                                  content: a.content || '',
                                  link: a.link || '',
                                  position: a.position || 'top',
                                  displayOrder: a.displayOrder !== undefined ? a.displayOrder : 1,
                                  duration: a.duration !== undefined ? a.duration : 5,
                                  backgroundColor: a.backgroundColor || '#059669',
                                  textColor: a.textColor || '#ffffff',
                                  isActive: a.isActive !== undefined ? a.isActive : true,
                                  startDate: a.startDate || '',
                                  endDate: a.endDate || ''
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">النسخ الاحتياطي وإعدادات المنصة الشاملة</h2>
                  <p className="text-slate-500 text-xs mt-1 font-semibold leading-relaxed">
                    تحكم في هوية المنصة، الألوان، محتوى الصفحات الفرعية وترتيب الأقسام. اضغط حفظ الإعدادات لتأكيد التغييرات.
                  </p>
                </div>
                <button
                  onClick={handleSaveConfigPress}
                  disabled={isSavingConfig}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-extrabold text-sm py-2.5 px-6 rounded-xl shadow-md shadow-emerald-100 flex items-center gap-2 transition-all shrink-0"
                >
                  <Save className="h-4.5 w-4.5" />
                  <span>{isSavingConfig ? 'جاري الحفظ...' : 'حفظ الإعدادات بالكامل'}</span>
                </button>
              </div>
              
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

                {/* Footer Save Button Block */}
                <div className="pt-6 border-t flex justify-end">
                  <button
                    onClick={handleSaveConfigPress}
                    disabled={isSavingConfig}
                    className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-extrabold text-sm py-2.5 px-6 rounded-xl shadow-md shadow-emerald-100 flex items-center gap-2 transition-all shrink-0"
                  >
                    <Save className="h-4.5 w-4.5" />
                    <span>{isSavingConfig ? 'جاري حفظ التعديلات...' : 'حفظ كافة الإعدادات'}</span>
                  </button>
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
