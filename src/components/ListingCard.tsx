import React, { useState } from 'react';
import { Phone, MapPin, Share2, Printer, Check, Copy, AlertCircle, Stethoscope, Pill, FlaskConical, Award, Clock } from 'lucide-react';
import { Doctor, Pharmacy, Lab, Ad } from '../data/initialData';
import { checkActivityStatus } from '../lib/activityStatus';

interface ListingCardProps {
  key?: any;
  item: Doctor | Pharmacy | Lab;
  type: 'doctor' | 'pharmacy' | 'lab';
  ads: Ad[];
  onShowToast: (message: string) => void;
}

// Dedicated Theme Configuration mapping each medical sector to its distinct color palette
const typeStyles = {
  doctor: {
    badge: 'bg-blue-50 text-blue-700 border border-blue-100',
    titleHover: 'group-hover:text-blue-600',
    borderHover: 'group-hover:border-blue-200',
    clinicTag: 'text-blue-600 bg-blue-50/60 border border-blue-100',
    actionPrimary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
    actionSecondary: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200',
    adBox: 'border-t border-dashed border-blue-100 bg-blue-50/40 text-blue-800',
    adBadge: 'bg-blue-600 text-white',
    adTitle: 'text-blue-700',
    interactiveHover: 'hover:text-blue-600 hover:bg-blue-50',
    printBorder: 'border-blue-600',
    printHeader: 'text-blue-600',
    printBadge: 'bg-blue-50 text-blue-800 border border-blue-100',
    printLabel: 'text-blue-600'
  },
  pharmacy: {
    badge: 'bg-amber-50 text-amber-700 border border-amber-100',
    titleHover: 'group-hover:text-amber-600',
    borderHover: 'group-hover:border-amber-200',
    clinicTag: 'text-amber-600 bg-amber-50/60 border border-amber-100',
    actionPrimary: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white',
    actionSecondary: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
    adBox: 'border-t border-dashed border-amber-100 bg-amber-50/40 text-amber-800',
    adBadge: 'bg-amber-600 text-white',
    adTitle: 'text-amber-700',
    interactiveHover: 'hover:text-amber-600 hover:bg-amber-50',
    printBorder: 'border-amber-600',
    printHeader: 'text-amber-600',
    printBadge: 'bg-amber-50 text-amber-800 border border-amber-100',
    printLabel: 'text-amber-600'
  },
  lab: {
    badge: 'bg-purple-50 text-purple-700 border border-purple-100',
    titleHover: 'group-hover:text-purple-600',
    borderHover: 'group-hover:border-purple-200',
    clinicTag: 'text-purple-600 bg-purple-50/60 border border-purple-100',
    actionPrimary: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500 text-white',
    actionSecondary: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200',
    adBox: 'border-t border-dashed border-purple-100 bg-purple-50/40 text-purple-800',
    adBadge: 'bg-purple-600 text-white',
    adTitle: 'text-purple-700',
    interactiveHover: 'hover:text-purple-600 hover:bg-purple-50',
    printBorder: 'border-purple-600',
    printHeader: 'text-purple-600',
    printBadge: 'bg-purple-50 text-purple-800 border border-purple-100',
    printLabel: 'text-purple-600'
  }
};

export default function ListingCard({ item, type, ads, onShowToast }: ListingCardProps) {
  const [copied, setCopied] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Retrieve current active color tokens for this card
  const style = typeStyles[type] || typeStyles.doctor;

  // Find relevant ad for this type of card
  const getCardAd = () => {
    let position: Ad['position'] = 'card_doctor';
    if (type === 'pharmacy') position = 'card_pharmacy';
    if (type === 'lab') position = 'card_lab';
    return ads.find(ad => ad.isActive && ad.position === position);
  };

  const activeAd = getCardAd();

  // Helper to get raw phone number for calling
  const rawPhone = item.phone.trim();

  // Helper to format WhatsApp link with a professional Arabic message
  const getWhatsAppLink = () => {
    if (!item.whatsapp) return null;
    const cleanNum = item.whatsapp.replace(/\+/g, '').trim();
    const text = encodeURIComponent(
      `السلام عليكم ورحمة الله وبركاته، حصلت على رقمكم من "دليل الوقف الطبي الإلكتروني". أرغب في الاستفسار عن مواعيد العمل والموقع بالتحديد.`
    );
    return `https://wa.me/${cleanNum}?text=${text}`;
  };

  const whatsappLink = getWhatsAppLink();

  // Share text creation
  const handleShare = async () => {
    const shareText = `
*دليل الوقف الطبي الإلكتروني*
خدمة مجانية لأهالي مركز الوقف - محافظة قنا

🏷️ *${type === 'doctor' ? 'عيادة طبيب' : type === 'pharmacy' ? 'صيدلية' : 'معمل تحاليل'}*
📌 *الاسم:* ${item.name}
${type === 'doctor' ? `🏥 *التخصص:* ${(item as Doctor).specialty}\n🏢 *العيادة:* ${(item as Doctor).clinicName}` : ''}
📍 *العنوان:* ${item.address}
📞 *رقم الهاتف:* ${item.phone}
${item.whatsapp ? `💬 *واتساب:* +${item.whatsapp}` : ''}

🔗 تصفح دليل الوقف الطبي للحصول على المزيد من التفاصيل والاتصال المباشر.
    `.trim();

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      onShowToast('📋 تم نسخ بيانات الجهة وجاهزة للمشاركة بنجاح!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      onShowToast('❌ عذراً، لم نتمكن من نسخ البيانات تلقائياً.');
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // 2 Days "New" check
  const isNew = item.createdAt 
    ? (Date.now() - new Date(item.createdAt).getTime()) < 2 * 24 * 60 * 60 * 1000 
    : false;

  // Activity Status Calculation
  const activity = checkActivityStatus(item);

  return (
    <>
      <div 
        className={`bg-white rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden group ${
          item.isFeatured 
            ? 'border-amber-300 bg-gradient-to-br from-amber-50/20 to-white shadow-amber-50/40 shadow-md ring-1 ring-amber-200/50' 
            : 'border-slate-150 shadow-sm'
        } ${style.borderHover}`}
        id={`listing-card-${item.id}`}
      >
        <div className="p-6">
          {/* Badge & Type Header */}
          <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${style.badge}`}>
                {type === 'doctor' ? (
                  <>
                    <Stethoscope className="h-3.5 w-3.5" />
                    <span>طبيب: {(item as Doctor).specialty}</span>
                  </>
                ) : type === 'pharmacy' ? (
                  <>
                    <Pill className="h-3.5 w-3.5" />
                    <span>صيدلية معتمدة</span>
                  </>
                ) : (
                  <>
                    <FlaskConical className="h-3.5 w-3.5" />
                    <span>معمل تحاليل وأشعة</span>
                  </>
                )}
              </span>

              {item.isFeatured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-amber-500 text-white border border-amber-400 shadow-sm animate-pulse">
                  ⭐ مميز
                </span>
              )}

              {item.isVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-emerald-600 text-white border border-emerald-500 shadow-sm">
                  ✅ موثق
                </span>
              )}

              {isNew && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-rose-500 text-white border border-rose-400 shadow-sm">
                  🆕 جديد
                </span>
              )}

              {item.isPinned && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-indigo-600 text-white border border-indigo-500 shadow-sm" title={item.pinExpiryDate ? `حتى ${new Date(item.pinExpiryDate).toLocaleDateString('ar-EG')}` : 'تثبيت دائم'}>
                  📌 مثبت
                </span>
              )}

              {item.packageTier && item.packageTier !== 'normal' && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black border shadow-sm ${
                  item.packageTier === 'diamond' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                  item.packageTier === 'gold' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  'bg-slate-100 text-slate-800 border-slate-200'
                }`}>
                  {item.packageTier === 'diamond' ? '💎 ماسي' :
                   item.packageTier === 'gold' ? '🥇 ذهبي' : '🥈 فضي'}
                </span>
              )}
            </div>

            {/* Quick Share / Print Actions */}
            <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleShare}
                className={`p-1.5 text-slate-500 rounded-lg transition-colors ${style.interactiveHover}`}
                title="نسخ ومشاركة"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
              </button>
              <button
                onClick={handlePrint}
                className={`p-1.5 text-slate-500 rounded-lg transition-colors ${style.interactiveHover}`}
                title="طباعة الكارت"
              >
                <Printer className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Title & Organization Name */}
          <h3 className={`text-lg font-extrabold text-slate-900 transition-colors duration-200 mb-2 leading-relaxed flex items-center flex-wrap gap-1.5 ${style.titleHover}`}>
            <span>{item.name}</span>
            {item.isVerified && <span className="text-emerald-500 text-base" title="موثق">✓</span>}
            {item.isFeatured && <span className="text-amber-500 text-base" title="مميز">⭐</span>}
          </h3>

          {/* Special fields for Doctor */}
          {type === 'doctor' && (
            <div className={`mb-3 text-slate-700 text-sm font-semibold p-2.5 rounded-xl flex items-center gap-2 ${style.clinicTag}`}>
              <span className="text-base">🏥</span>
              <span>عيادة: {(item as Doctor).clinicName}</span>
            </div>
          )}

          {/* Address */}
          <div className="flex items-start gap-2 text-slate-600 text-sm mb-3">
            <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <span className="leading-relaxed">{item.address} {item.village ? `(${item.village})` : ''}</span>
          </div>

          {/* Phone Display */}
          <div className="flex items-center gap-2 text-slate-700 text-sm font-bold mb-2">
            <span className="text-slate-400">📞</span>
            <span className="font-mono tracking-wider">{item.phone}</span>
          </div>

          {/* Services Provided Section */}
          {item.servicesProvided && item.servicesProvided.length > 0 && (
            <div className="mt-3.5 mb-2.5 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/80">
              <span className="text-[10px] font-extrabold text-slate-400 block mb-1.5">الخدمات المقدمة:</span>
              <div className="flex flex-wrap gap-1">
                {item.servicesProvided.map((srv, idx) => (
                  <span key={idx} className="bg-white text-slate-700 text-[10.5px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                    {srv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Activity status and working hours display */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold ${activity.colorClass}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${activity.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                {activity.statusText}
              </span>

              {item.startDay && item.endDay && item.openHour && item.closeHour && (
                <div className="text-[10.5px] font-bold text-slate-500 flex items-center gap-1" dir="rtl">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>من {item.startDay} إلى {item.endDay} ({item.openHour} - {item.closeHour})</span>
                </div>
              )}
            </div>

            {item.daysOff && item.daysOff.length > 0 && (
              <div className="text-[10px] font-semibold text-rose-500">
                🔴 العطلة الأسبوعية: {item.daysOff.join('، ')}
              </div>
            )}
          </div>

          {/* Ad banner in the card if active */}
          {activeAd && (
            <div className={`mt-4 pt-3.5 px-3 py-2.5 rounded-xl text-[11.5px] flex flex-col gap-1 shadow-inner ${style.adBox}`}>
              <div className="flex items-center gap-1 font-bold text-xs">
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${style.adBadge}`}>إعلان ممول</span>
                <span className={style.adTitle}>{activeAd.title}</span>
              </div>
              <p className="opacity-90 leading-relaxed font-semibold">{activeAd.content}</p>
            </div>
          )}

          {/* Last Updated Timestamp */}
          {item.lastUpdated && (
            <div className="text-[9px] font-bold text-slate-400 mt-3 text-left">
              آخر تحديث: {new Date(item.lastUpdated).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          )}
        </div>

        {/* Buttons / CTA Section */}
        <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 grid gap-2" style={{ gridTemplateColumns: whatsappLink ? '1fr 1fr' : '1fr' }}>
          <a
            href={`tel:${rawPhone}`}
            className={`flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98] ${style.actionPrimary}`}
          >
            <Phone className="h-4 w-4" />
            <span>اتصال مباشر</span>
          </a>

          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center justify-center gap-2 font-bold py-2.5 px-4 rounded-xl text-sm transition-all active:scale-[0.98] ${style.actionSecondary}`}
            >
              <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.968C16.592 1.97 14.125.945 11.49.945 6.058.945 1.633 5.313 1.629 10.74c-.001 1.678.452 3.3 1.311 4.755L1.925 21l5.722-1.846zM17.8 14.124c-.312-.156-1.848-.912-2.134-1.015-.286-.103-.494-.156-.702.156-.208.312-.806 1.015-.988 1.222-.182.208-.364.234-.676.078-.312-.156-1.317-.485-2.51-1.549-.928-.827-1.554-1.849-1.736-2.16-.182-.312-.019-.481.137-.636.14-.139.312-.364.468-.546.156-.182.208-.312.312-.52.104-.208.052-.39-.026-.546-.078-.156-.702-1.69-.962-2.314-.253-.607-.51-.524-.702-.534-.182-.01-.39-.011-.598-.011-.208 0-.546.078-.832.39-.286.312-1.092 1.066-1.092 2.6 0 1.534 1.118 3.016 1.274 3.224.156.208 2.198 3.357 5.328 4.704.744.321 1.324.513 1.776.657.747.237 1.428.204 1.966.124.6-.09 1.848-.754 2.108-1.444.26-.69.26-1.287.182-1.404-.078-.117-.286-.195-.598-.351z"/>
              </svg>
              <span>رسالة واتساب</span>
            </a>
          )}
        </div>
      </div>

      {/* Hidden Print-Ready Card Layout for window.print() */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-white z-[9999] p-12 text-slate-900 hidden print:block dir-rtl" style={{ direction: 'rtl' }}>
          <div className={`max-w-xl mx-auto border-4 rounded-3xl p-8 bg-white relative ${style.printBorder}`}>
            {/* Print Header */}
            <div className={`border-b-2 pb-4 mb-6 flex justify-between items-center ${style.printBorder.replace('border-', 'border-opacity-30 border-')}`}>
              <div>
                <h1 className={`text-2xl font-extrabold font-sans ${style.printHeader}`}>دليل الوقف الطبي</h1>
                <p className="text-xs text-slate-500 font-semibold mt-1">بطاقة معلومات طبية معتمدة لمركز الوقف</p>
              </div>
              <div className={`text-xs font-bold px-3 py-1.5 rounded-lg ${style.printBadge}`}>
                {type === 'doctor' ? 'عيادة طبيب' : type === 'pharmacy' ? 'صيدلية' : 'معمل تحاليل'}
              </div>
            </div>

            {/* Print Content Body */}
            <div className="space-y-5 text-right">
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">الاسم بالكامل:</span>
                <span className="text-2xl font-black text-slate-900">{item.name}</span>
              </div>

              {type === 'doctor' && (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block">التخصص الطبي:</span>
                    <span className="text-base font-bold text-slate-800">{(item as Doctor).specialty}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block">اسم العيادة:</span>
                    <span className="text-base font-bold text-slate-800">{(item as Doctor).clinicName}</span>
                  </div>
                </div>
              )}

              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">العنوان بالتفصيل:</span>
                <span className="text-base font-semibold text-slate-800 leading-relaxed">{item.address} {item.village ? `(${item.village})` : ''}</span>
              </div>

              {item.servicesProvided && item.servicesProvided.length > 0 && (
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block">الخدمات المقدمة:</span>
                  <span className="text-sm font-semibold text-slate-800 leading-relaxed">{item.servicesProvided.join('، ')}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-400 block">رقم الهاتف للاتصال:</span>
                  <span className={`text-lg font-mono font-bold ${style.printLabel}`}>{item.phone}</span>
                </div>
                {item.whatsapp && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 block">رقم الواتساب للرسائل:</span>
                    <span className={`text-lg font-mono font-bold ${style.printLabel}`}>+{item.whatsapp}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Print Footer */}
            <div className="mt-8 pt-4 border-t border-dashed border-slate-200 text-center">
              <p className="text-[10px] text-slate-400 font-medium">تمت الطباعة عبر دليل الوقف الطبي الإلكتروني - dlylelwaqf.com</p>
              <p className="text-[9px] text-slate-300 mt-0.5">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
            </div>

            {/* Print Close Action for visual purposes if printed inside preview */}
            <button 
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 left-4 bg-slate-900 text-white rounded-full px-3 py-1 text-xs print:hidden"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </>
  );
}
