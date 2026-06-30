import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Menu, X, Home, Info, Phone, Stethoscope, Pill, FlaskConical, Search, PlusCircle } from 'lucide-react';
import { HomePageConfig } from '../data/initialData';

interface NavbarProps {
  activePage: string;
  setActivePage: (page: string) => void;
  adminLoggedIn: boolean;
  onLogout: () => void;
  config: HomePageConfig;
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

export default function Navbar({ activePage, setActivePage, adminLoggedIn, onLogout, config }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const themeColor = config.themeColor || 'emerald';

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
    <nav className="bg-white shadow-sm sticky top-0 z-50 border-b border-slate-100" id="site-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('home')}>
            <div className={`${getLogoBgClass(themeColor)} text-white p-2.5 rounded-xl shadow-md shadow-emerald-200/10`}>
              <LogoIcon className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-1.5 font-sans">
                {config.siteLogoText || config.siteName || "دليل الوقف الطبي"}
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
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
          </div>

          {/* Mobile hamburger icon */}
          <div className="flex items-center lg:hidden gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-${themeColor === 'emerald' ? 'emerald' : themeColor}-600 focus:outline-none transition-colors`}
              aria-label="القائمة"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-1.5 shadow-xl animate-fadeIn">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-semibold transition-all ${getItemClasses(item.id, isActive, themeColor)}`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </nav>
  );
}
