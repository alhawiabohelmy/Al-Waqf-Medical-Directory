import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import * as LucideIcons from 'lucide-react';
import { Menu, X, Home, Info, Phone, Stethoscope, Pill, FlaskConical, Search, PlusCircle, Bell, BellRing, Check, ShieldAlert, Sparkles, Megaphone, AlertTriangle } from 'lucide-react';
import { HomePageConfig, AppNotification } from '../data/initialData';

interface NavbarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  adminLoggedIn: boolean;
  onLogout: () => void;
  config: HomePageConfig;
  showInstallBtn?: boolean;
  onInstallApp?: () => void;
  notifications?: AppNotification[];
  readNotificationIds?: string[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

// Helper to get any Lucide icon by string name
const getIconComponent = (name: string = 'HeartPulse') => {
  const Icon = (LucideIcons as any)[name];
  return Icon || LucideIcons.HeartPulse;
};

// Function to generate specific item styles for the menu tabs based on medical categories and theme
const getItemClasses = (itemId: string, isActive: boolean, themeColor: string = 'emerald') => {
  const isBlue = themeColor === 'blue';
  const isPurple = themeColor === 'purple';
  const isRose = themeColor === 'rose';
  const isAmber = themeColor === 'amber';
  const isIndigo = themeColor === 'indigo';
  const isSlate = themeColor === 'slate';

  if (isActive) {
    if (itemId === 'doctors') return 'bg-blue-600 text-white shadow-sm shadow-blue-100';
    if (itemId === 'pharmacies') return 'bg-amber-600 text-white shadow-sm shadow-amber-100';
    if (itemId === 'labs') return 'bg-purple-600 text-white shadow-sm shadow-purple-100';
    if (itemId === 'request-doctor') return 'bg-rose-500 text-white shadow-sm shadow-rose-100';
    
    if (isBlue) return 'bg-blue-600 text-white shadow-sm shadow-blue-100';
    if (isPurple) return 'bg-purple-600 text-white shadow-sm shadow-purple-100';
    if (isRose) return 'bg-rose-600 text-white shadow-sm shadow-rose-100';
    if (isAmber) return 'bg-amber-500 text-white shadow-sm shadow-amber-100';
    if (isIndigo) return 'bg-indigo-600 text-white shadow-sm shadow-indigo-100';
    if (isSlate) return 'bg-slate-700 text-white shadow-sm shadow-slate-100';
    return 'bg-emerald-500 text-white shadow-sm shadow-emerald-100';
  } else {
    if (itemId === 'doctors') return 'text-slate-600 hover:bg-blue-50/50 hover:text-blue-600';
    if (itemId === 'pharmacies') return 'text-slate-600 hover:bg-amber-50/50 hover:text-amber-600';
    if (itemId === 'labs') return 'text-slate-600 hover:bg-purple-50/50 hover:text-purple-600';
    if (itemId === 'request-doctor') return 'text-rose-600 bg-rose-50/40 hover:bg-rose-50 hover:text-rose-700 border border-rose-100';
    
    if (isBlue) return 'text-slate-600 hover:bg-blue-50 hover:text-blue-600';
    if (isPurple) return 'text-slate-600 hover:bg-purple-50 hover:text-purple-600';
    if (isRose) return 'text-slate-600 hover:bg-rose-50 hover:text-rose-600';
    if (isAmber) return 'text-slate-600 hover:bg-amber-50 hover:text-amber-500';
    if (isIndigo) return 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600';
    if (isSlate) return 'text-slate-600 hover:bg-slate-100 hover:text-slate-800';
    return 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600';
  }
};

const getLogoBgClass = (themeColor: string = 'emerald') => {
  switch (themeColor) {
    case 'blue': return 'bg-blue-600';
    case 'purple': return 'bg-purple-600';
    case 'rose': return 'bg-rose-600';
    case 'amber': return 'bg-amber-500';
    case 'indigo': return 'bg-indigo-600';
    case 'slate': return 'bg-slate-700';
    case 'emerald':
    default:
      return 'bg-emerald-500';
  }
};

const formatNotificationTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays === 1) return 'أمس';
    if (diffDays === 2) return 'منذ يومين';
    if (diffDays < 7) return `منذ ${diffDays} أيام`;
    return date.toLocaleDateString('ar-EG', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return dateStr;
  }
};

const getNotificationTypeConfig = (type: string) => {
  switch (type) {
    case 'alert':
      return { icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 border-rose-100 animate-pulse', label: 'تنبيه' };
    case 'update':
      return { icon: Sparkles, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', label: 'تحديث' };
    case 'promo':
      return { icon: Megaphone, color: 'text-amber-600 bg-amber-50 border-amber-100', label: 'إعلان' };
    case 'maintenance':
      return { icon: ShieldAlert, color: 'text-slate-600 bg-slate-50 border-slate-100', label: 'صيانة' };
    case 'general':
    default:
      return { icon: Info, color: 'text-teal-600 bg-teal-50 border-teal-100', label: 'عام' };
  }
};

export default function Navbar({ 
  activePage, 
  setActivePage, 
  adminLoggedIn, 
  onLogout, 
  config, 
  showInstallBtn, 
  onInstallApp,
  notifications = [],
  readNotificationIds = [],
  onMarkAsRead,
  onMarkAllAsRead
}: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchCurrentX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    setTouchCurrentX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchCurrentX === null) return;
    const diffX = touchCurrentX - touchStartX;
    if (diffX > 60) {
      setIsOpen(false);
    }
    setTouchStartX(null);
    setTouchCurrentX(null);
  };

  const swipeOffset = touchStartX !== null && touchCurrentX !== null ? Math.max(0, touchCurrentX - touchStartX) : 0;
  const [showNotifications, setShowNotifications] = useState(false);
  const themeColor = config.themeColor || 'emerald';
  
  const unreadCount = notifications.filter(n => !readNotificationIds.includes(n.id)).length;

  const menuItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'doctors', label: 'الأطباء', icon: Stethoscope },
    { id: 'pharmacies', label: 'الصيدليات', icon: Pill },
    { id: 'labs', label: 'المعامل', icon: FlaskConical },
    { id: 'search', label: 'البحث الموحد', icon: Search },
    { id: 'request-doctor', label: 'إضافة طلب', icon: PlusCircle },
    { id: 'about', label: 'من نحن', icon: Info },
    { id: 'contact', label: 'اتصل بنا', icon: Phone },
  ];

  const handleNavClick = (pageId: string) => {
    setActivePage(pageId);
    setIsOpen(false);
  };

  const LogoIcon = getIconComponent(config.siteLogoIcon || 'HeartPulse');

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md shadow-xs sticky top-0 z-50 border-b border-slate-100/80" id="site-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 lg:h-20">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-2 lg:gap-3 cursor-pointer" onClick={() => handleNavClick('home')}>
            <div className={`${getLogoBgClass(themeColor)} text-white p-2 lg:p-2.5 rounded-xl shadow-md shadow-emerald-200/10`}>
              <LogoIcon className="h-5.5 w-5.5 lg:h-7 lg:w-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base lg:text-xl font-bold text-slate-900 flex items-center gap-1 lg:gap-1.5 font-sans">
                {config.siteLogoText || config.siteName || "دليل الوقف الطبي"}
              </h1>
              <p className="text-[10px] lg:text-xs text-slate-500 font-medium hidden sm:block">
                {config.heroSubtitle?.substring(0, 50) + "..." || "دليلك المعتمد للأطباء، الصيدليات، والمعامل بالمركز"}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 space-x-reverse">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  id={`nav-link-${item.id}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${getItemClasses(item.id, isActive, themeColor)}`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            
            {/* Custom PWA Install Action */}
            {showInstallBtn && onInstallApp && (
              <button
                onClick={onInstallApp}
                className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/10 cursor-pointer animate-pulse shrink-0 border border-amber-400"
              >
                <PlusCircle className="h-4.5 w-4.5 shrink-0" />
                <span>تثبيت التطبيق</span>
              </button>
            )}

            {/* Notifications Bell (Desktop) */}
            <div className="relative ml-2 mr-2">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-3 rounded-xl transition-all cursor-pointer ${
                  showNotifications 
                    ? 'bg-teal-50 text-[#0F766E]' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title="الإشعارات"
              >
                {unreadCount > 0 ? (
                  <BellRing className="h-5.5 w-5.5 text-teal-600 animate-pulse" />
                ) : (
                  <Bell className="h-5.5 w-5.5 text-slate-500" />
                )}
                
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Popover */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute left-0 mt-3 w-85 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in text-right overflow-hidden max-h-[480px] flex flex-col" dir="rtl">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        الإشعارات ({notifications.length})
                      </span>
                      {unreadCount > 0 && onMarkAllAsRead && (
                        <button 
                          onClick={() => { onMarkAllAsRead(); }}
                          className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>تحديد الكل كمقروء</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[360px]">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                          <div className="bg-slate-50 p-3 rounded-full mb-3 text-slate-400">
                            <Bell className="h-6 w-6" />
                          </div>
                          <p className="text-slate-500 text-xs font-semibold">لا توجد إشعارات حالياً</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {notifications.map((n) => {
                            const isRead = readNotificationIds.includes(n.id);
                            const { icon: TypeIcon, color: typeColor, label: typeLabel } = getNotificationTypeConfig(n.type);
                            return (
                              <div 
                                key={n.id} 
                                onClick={() => {
                                  if (!isRead && onMarkAsRead) onMarkAsRead(n.id);
                                }}
                                className={`p-4 transition-all hover:bg-slate-50 cursor-pointer text-right flex gap-3 relative ${
                                  !isRead ? 'bg-teal-50/20' : ''
                                } ${n.isPinned ? 'border-r-2 border-amber-500' : ''}`}
                              >
                                <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 ${typeColor}`}>
                                  <TypeIcon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1 mb-1">
                                    <h4 className={`text-xs font-bold leading-snug truncate ${!isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                                      {n.title}
                                    </h4>
                                    <span className="text-[10px] text-slate-400 font-bold shrink-0">
                                      {formatNotificationTime(n.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-slate-500 text-[11px] font-medium leading-relaxed mb-1 break-words">
                                    {n.content}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-black">
                                      {typeLabel}
                                    </span>
                                    {n.isPinned && (
                                      <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded font-black flex items-center gap-0.5">
                                        مُثبّت
                                      </span>
                                    )}
                                    {n.priority === 'high' && (
                                      <span className="text-[9px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded font-black">
                                        هام جداً
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {!isRead && (
                                  <span className="absolute left-3 bottom-3 h-2 w-2 rounded-full bg-teal-600"></span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile hamburger icon */}
          <div className="flex items-center lg:hidden gap-1">
            {/* Mobile Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2.5 rounded-xl transition-all cursor-pointer ${
                  showNotifications 
                    ? 'bg-teal-50 text-[#0F766E]' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {unreadCount > 0 ? (
                  <BellRing className="h-5.5 w-5.5 text-teal-600 animate-pulse" />
                ) : (
                  <Bell className="h-5.5 w-5.5 text-slate-500" />
                )}
                
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Popover (Mobile) */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                  <div className="absolute left-[-50px] sm:left-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-fade-in text-right overflow-hidden max-h-[420px] flex flex-col" dir="rtl">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                      <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        الإشعارات ({notifications.length})
                      </span>
                      {unreadCount > 0 && onMarkAllAsRead && (
                        <button 
                          onClick={() => { onMarkAllAsRead(); }}
                          className="text-xs text-teal-600 hover:text-teal-700 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>تحديد الكل</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="overflow-y-auto custom-scrollbar flex-1 max-h-[300px]">
                      {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                          <div className="bg-slate-50 p-2.5 rounded-full mb-3 text-slate-400">
                            <Bell className="h-5 w-5" />
                          </div>
                          <p className="text-slate-500 text-[11px] font-semibold">لا توجد إشعارات حالياً</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {notifications.map((n) => {
                            const isRead = readNotificationIds.includes(n.id);
                            const { icon: TypeIcon, color: typeColor, label: typeLabel } = getNotificationTypeConfig(n.type);
                            return (
                              <div 
                                key={n.id} 
                                onClick={() => {
                                  if (!isRead && onMarkAsRead) onMarkAsRead(n.id);
                                }}
                                className={`p-3.5 transition-all hover:bg-slate-50 cursor-pointer text-right flex gap-2.5 relative ${
                                  !isRead ? 'bg-teal-50/20' : ''
                                } ${n.isPinned ? 'border-r-2 border-amber-500' : ''}`}
                              >
                                <div className={`h-8 w-8 rounded-lg border flex items-center justify-center shrink-0 ${typeColor}`}>
                                  <TypeIcon className="h-4.5 w-4.5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1 mb-0.5">
                                    <h4 className={`text-xs font-bold leading-snug truncate ${!isRead ? 'text-slate-900' : 'text-slate-600'}`}>
                                      {n.title}
                                    </h4>
                                    <span className="text-[9px] text-slate-400 font-bold shrink-0">
                                      {formatNotificationTime(n.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-slate-500 text-[10px] font-medium leading-relaxed mb-1 break-words">
                                    {n.content}
                                  </p>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-black">
                                      {typeLabel}
                                    </span>
                                    {n.isPinned && (
                                      <span className="text-[8px] bg-amber-50 text-amber-600 border border-amber-100 px-1 py-0.5 rounded font-black">
                                        مثبّت
                                      </span>
                                    )}
                                    {n.priority === 'high' && (
                                      <span className="text-[8px] bg-rose-50 text-rose-600 border border-rose-100 px-1 py-0.5 rounded font-black">
                                        هام
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {!isRead && (
                                  <span className="absolute left-2.5 bottom-2.5 h-1.5 w-1.5 rounded-full bg-teal-600"></span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className={`p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-${themeColor === 'emerald' ? 'emerald' : themeColor}-600 focus:outline-none transition-colors`}
              aria-label="القائمة"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

        </div>
      </div>

      </nav>

      {typeof document !== 'undefined' && createPortal(
        <div 
          className={`fixed inset-0 z-[99999] lg:hidden transition-all duration-300 ${
            isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Backdrop overlay */}
          <div 
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
            style={{ 
              opacity: isOpen ? (touchStartX !== null && touchCurrentX !== null ? Math.max(0, 1 - swipeOffset / 320) : 1) : 0,
              transition: touchStartX !== null ? 'none' : 'opacity 300ms cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />

          {/* Drawer Panel */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`absolute top-0 right-0 h-full w-[280px] max-w-[80vw] bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out transform ${
              isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={
              isOpen 
                ? { 
                    transform: `translateX(${swipeOffset}px)`,
                    transition: touchStartX !== null ? 'none' : 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)'
                  } 
                : undefined
            }
            dir="rtl"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className={`${getLogoBgClass(themeColor)} text-white p-2 rounded-xl`}>
                  <LogoIcon className="h-5 w-5 animate-pulse" />
                </div>
                <span className="font-bold text-slate-900 text-sm">دليل الوقف الطبي</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-500 hover:bg-slate-150 rounded-xl cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body Links */}
            <div className="flex-grow overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer with PWA Install Option */}
            {showInstallBtn && onInstallApp && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <button
                  onClick={() => {
                    onInstallApp();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/10 cursor-pointer animate-pulse border border-amber-400"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>تثبيت التطبيق على الهاتف</span>
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
