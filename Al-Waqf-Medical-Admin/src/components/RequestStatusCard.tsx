import React, { useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle, Check, XCircle } from 'lucide-react';
import { Doctor, Pharmacy, Lab, DoctorRequest } from '../data/initialData';

interface RequestStatusCardProps {
  key?: React.Key;
  req: DoctorRequest;
  doctors: Doctor[];
  pharmacies: Pharmacy[];
  labs: Lab[];
  onUpdateDoctors: any;
  onUpdatePharmacies: any;
  onUpdateLabs: any;
  onUpdateDoctorRequests: any;
  onAddLog: (action: string, type: any, details: string) => void;
  onShowToast: (msg: string) => void;
  onStartEditing: (req: DoctorRequest) => void;
  onDeleteRequest: (id: string, name: string) => Promise<void>;
  handleUpdateRequestStatus: (id: string, newStatus: DoctorRequest['status'], adminNotes: string, rejectionReason?: string) => Promise<void>;
}

export function RequestStatusCard({
  req,
  onStartEditing,
  onDeleteRequest,
  handleUpdateRequestStatus
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-slate-100 text-right">
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-4 rounded-xl text-right">
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
        <div className="bg-amber-50/30 border border-amber-100 p-3 rounded-xl text-xs text-slate-700 leading-relaxed font-semibold text-right">
          💡 <span className="font-extrabold text-amber-900">ملاحظات مقدم الطلب عند الإرسال:</span> {req.notes}
        </div>
      )}

      {req.rejectionReason && (
        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-xs text-rose-800 leading-relaxed font-bold text-right">
          ⚠️ سبب الرفض الموجه للزائر: {req.rejectionReason}
        </div>
      )}

      {req.adminNotes && (
        <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-semibold text-right">
          📝 <span className="font-extrabold text-slate-800">ملاحظات المتابعة الإدارية الحالية:</span> {req.adminNotes}
        </div>
      )}

      {/* Collapsible Timeline tracking history logs */}
      <div className="border-t pt-3 text-right">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-all justify-end w-full"
        >
          <Clock className="h-3.5 w-3.5" />
          <span>{showHistory ? 'إخفاء سجل المعالجة الزمني' : `عرض سجل تتبع معالجة الطلب (${req.history?.length || 0} تغييرات)`}</span>
        </button>

        {showHistory && (
          <div className="mt-3 bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-3.5 animate-fadeIn text-right">
            <h4 className="text-xs font-extrabold text-slate-800 border-b pb-1.5 flex items-center gap-1 justify-end">
              <span>📜 سجل تتبع الطلب التاريخي</span>
              <span className="text-[10px] font-semibold text-slate-400">(يظهر للزائر لمتابعة طلبه)</span>
            </h4>
            
            <div className="relative border-r-2 border-slate-200 pr-4 mr-2 space-y-4 text-xs">
              {/* Submission event */}
              <div className="relative">
                <div className="absolute right-[-21px] top-1.5 bg-emerald-500 rounded-full h-2.5 w-2.5" />
                <div className="font-bold text-slate-800">تم تقديم الطلب</div>
                <div className="text-slate-400 text-[10px] font-semibold mt-0.5">
                  {new Date(req.createdAt).toLocaleString('ar-EG')}
                </div>
                <div className="text-slate-500 mt-1 leading-relaxed">
                  تم استلام طلب التسجيل برقم مرجعي مميز وجاري وضعه في طابور المعالجة.
                </div>
              </div>

              {/* History events list */}
              {req.history && req.history.map((h, i) => {
                const eventStyle = statusColors[h.status] || statusColors.pending;
                return (
                  <div key={i} className="relative">
                    <div className="absolute right-[-21px] top-1.5 bg-slate-400 rounded-full h-2 w-2" />
                    <div className="font-bold text-slate-800">تحديث حالة: {eventStyle.label}</div>
                    <div className="text-slate-400 text-[10px] font-semibold mt-0.5">
                      {new Date(h.updatedAt).toLocaleString('ar-EG')}
                    </div>
                    {h.notes && (
                      <div className="text-slate-500 mt-1 leading-relaxed bg-white border border-slate-100 p-2 rounded-lg inline-block">
                        {h.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Control Actions Form */}
      <form onSubmit={handleStatusSubmit} className="bg-slate-50 rounded-xl p-4 border border-slate-150 space-y-3 text-right">
        <h4 className="text-xs font-black text-slate-800">تحديث مسار الطلب والرد الإداري:</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">تغيير الحالة</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as any)}
              className="w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-700"
            >
              <option value="pending">قيد التدقيق الإداري (Pending)</option>
              <option value="contacting">جاري التواصل مع مقدم الطلب (Contacting)</option>
              <option value="reviewing_data">جاري مراجعة البيانات (Reviewing)</option>
              <option value="incomplete_data">بيانات غير مكتملة (Incomplete)</option>
              <option value="awaiting_completion">بانتظار استكمال البيانات (Awaiting)</option>
              <option value="accepted">مقبول - قيد النشر والتهيئة (Accepted)</option>
              <option value="published">منشور بالدليل العام (Published)</option>
              <option value="rejected">مرفوض مع ذكر السبب للزائر (Rejected)</option>
              <option value="cancelled">ملغي من قبل الإدارة (Cancelled)</option>
              <option value="archived">أرشفة الطلب وإغلاقه (Archived)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">ملاحظات إدارية داخلية (سرية)</label>
            <input
              type="text"
              value={adminNotesInput}
              onChange={e => setAdminNotesInput(e.target.value)}
              placeholder="اكتب ملاحظات للمتابعة الإدارية..."
              className="w-full bg-white border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            />
          </div>
        </div>

        {selectedStatus === 'rejected' && (
          <div className="animate-fadeIn">
            <label className="block text-[10px] font-bold text-slate-500 mb-1">سبب الرفض الموجه لمقدم الطلب (سيظهر له عند الاستعلام) *</label>
            <input
              type="text"
              required
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="مثال: المستندات المرفقة غير واضحة، يرجى إعادة الإرسال بصورة أوضح..."
              className="w-full bg-white border border-rose-200 focus:ring-rose-500 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            />
          </div>
        )}

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="submit"
            disabled={isUpdating}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold text-[11px] py-1.5 px-3.5 rounded-lg flex items-center gap-1 transition-all shadow-sm"
          >
            {isUpdating ? 'جاري التحديث...' : 'تحديث مسار الطلب'}
          </button>
          
          <button
            type="button"
            onClick={() => onStartEditing(req)}
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] py-1.5 px-3.5 rounded-lg border border-blue-200"
          >
            تعديل البيانات وتحريرها
          </button>

          <button
            type="button"
            onClick={() => onDeleteRequest(req.id, req.name)}
            className="bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] py-1.5 px-3.5 rounded-lg border border-rose-200 mr-auto"
          >
            حذف الطلب نهائياً
          </button>
        </div>
      </form>

    </div>
  );
}
