import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as LucideIcons from 'lucide-react';
import { 
  Search, Stethoscope, Pill, FlaskConical, ArrowUpRight, CheckCircle2, 
  HelpCircle, Send, HeartPulse, ShieldAlert, ChevronLeft, ChevronDown, Volume2, Info, MessageSquare,
  ClipboardList, UserPlus, PlusCircle, Check, Clock, AlertCircle, XCircle, ArrowLeft, X,
  ShieldCheck, FileText, PhoneCall, FileSearch, AlertTriangle, Archive, Save, SlidersHorizontal,
  WifiOff
} from 'lucide-react';

// Firebase Firestore
import { collection, doc, setDoc, getDocs, getDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';

// Components
import Navbar from './components/Navbar';
import Ticker from './components/Ticker';
import ListingCard from './components/ListingCard';
import AdminPanel from './components/AdminPanel';
import AdRotator from './components/AdRotator';
import { checkActivityStatus } from './lib/activityStatus';
// @ts-ignore
import logoImg from './assets/images/al_waqf_medical_logo_1783159654140.jpg';

// Data / Types
import { 
  Doctor, Pharmacy, Lab, Ad, ActivityLog, HomePageConfig, DoctorRequest, ContactMessage, AppNotification,
  INITIAL_DOCTORS, INITIAL_PHARMACIES, INITIAL_LABS, INITIAL_SPECIALTIES, 
  INITIAL_ADS, INITIAL_LOGS, INITIAL_HOME_CONFIG 
} from './data/initialData';

interface ThemeColorSet {
  bg: string;
  bgHover: string;
  text: string;
  textHover: string;
  border: string;
  bgLight: string;
  shadow: string;
  ring: string;
}

const getThemeColorClasses = (color: HomePageConfig['themeColor'] = 'emerald'): ThemeColorSet => {
  const mapping: Record<string, ThemeColorSet> = {
    emerald: {
      bg: 'bg-emerald-500',
      bgHover: 'hover:bg-emerald-600',
      text: 'text-emerald-600',
      textHover: 'hover:text-emerald-700',
      border: 'border-emerald-200',
      bgLight: 'bg-emerald-50',
      shadow: 'shadow-emerald-200',
      ring: 'focus:ring-emerald-500',
    },
    blue: {
      bg: 'bg-blue-600',
      bgHover: 'hover:bg-blue-700',
      text: 'text-blue-600',
      textHover: 'hover:text-blue-700',
      border: 'border-blue-200',
      bgLight: 'bg-blue-50',
      shadow: 'shadow-blue-200',
      ring: 'focus:ring-blue-600',
    },
    purple: {
      bg: 'bg-purple-600',
      bgHover: 'hover:bg-purple-700',
      text: 'text-purple-600',
      textHover: 'hover:text-purple-700',
      border: 'border-purple-200',
      bgLight: 'bg-purple-50',
      shadow: 'shadow-purple-200',
      ring: 'focus:ring-purple-600',
    },
    rose: {
      bg: 'bg-rose-600',
      bgHover: 'hover:bg-rose-700',
      text: 'text-rose-600',
      textHover: 'hover:text-rose-700',
      border: 'border-rose-200',
      bgLight: 'bg-rose-50',
      shadow: 'shadow-rose-200',
      ring: 'focus:ring-rose-600',
    },
    amber: {
      bg: 'bg-amber-500',
      bgHover: 'hover:bg-amber-600',
      text: 'text-amber-600',
      textHover: 'hover:text-amber-700',
      border: 'border-amber-200',
      bgLight: 'bg-amber-50',
      shadow: 'shadow-amber-200',
      ring: 'focus:ring-amber-500',
    },
    indigo: {
      bg: 'bg-indigo-600',
      bgHover: 'hover:bg-indigo-700',
      text: 'text-indigo-600',
      textHover: 'hover:text-indigo-700',
      border: 'border-indigo-200',
      bgLight: 'bg-indigo-50',
      shadow: 'shadow-indigo-200',
      ring: 'focus:ring-indigo-600',
    },
    slate: {
      bg: 'bg-slate-700',
      bgHover: 'hover:bg-slate-800',
      text: 'text-slate-700',
      textHover: 'hover:text-slate-800',
      border: 'border-slate-300',
      bgLight: 'bg-slate-100',
      shadow: 'shadow-slate-200',
      ring: 'focus:ring-slate-700',
    },
  };
  return mapping[color || 'emerald'] || mapping.emerald;
};

export function sortListings<T extends { 
  isPinned?: boolean; 
  pinExpiryDate?: string; 
  isFeatured?: boolean; 
  packageTier?: string; 
  displayOrder?: number;
  lastUpdated?: string; 
  createdAt?: string; 
  name: string; 
}>(list: T[], nameSort?: string): T[] {
  // If the user explicitly chose name sorting, respect it!
  if (nameSort === 'name-asc') {
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }
  if (nameSort === 'name-desc') {
    return [...list].sort((a, b) => b.name.localeCompare(a.name, 'ar'));
  }

  // Otherwise, apply Waqf Smart Ranking Priority!
  return [...list].sort((a, b) => {
    // 1. Pinned Check
    const now = new Date();
    const isAPinned = !!a.isPinned && (!a.pinExpiryDate || new Date(a.pinExpiryDate) > now);
    const isBPinned = !!b.isPinned && (!b.pinExpiryDate || new Date(b.pinExpiryDate) > now);

    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    if (isAPinned && isBPinned) {
      // Both are pinned, sort by package tier, then displayOrder, then lastUpdated or createdAt descending
      const TIER_PRIORITY: Record<string, number> = {
        'diamond': 4,
        'gold': 3,
        'silver': 2,
        'normal': 1
      };
      const tierA = TIER_PRIORITY[a.packageTier || 'normal'] || 1;
      const tierB = TIER_PRIORITY[b.packageTier || 'normal'] || 1;
      if (tierA !== tierB) return tierB - tierA;

      const orderA = a.displayOrder !== undefined && a.displayOrder !== null && a.displayOrder > 0 ? a.displayOrder : Infinity;
      const orderB = b.displayOrder !== undefined && b.displayOrder !== null && b.displayOrder > 0 ? b.displayOrder : Infinity;
      if (orderA !== orderB) return orderA - orderB;

      const dateA = a.lastUpdated || a.createdAt || '';
      const dateB = b.lastUpdated || b.createdAt || '';
      return dateB.localeCompare(dateA);
    }

    // 2. Package Tier Check (Diamond > Gold > Silver > Normal)
    const TIER_PRIORITY: Record<string, number> = {
      'diamond': 4,
      'gold': 3,
      'silver': 2,
      'normal': 1
    };

    const tierA = TIER_PRIORITY[a.packageTier || 'normal'] || 1;
    const tierB = TIER_PRIORITY[b.packageTier || 'normal'] || 1;

    if (tierA !== tierB) {
      return tierB - tierA; // Higher score comes first
    }

    // 3. Featured Check
    const isAFeatured = !!a.isFeatured;
    const isBFeatured = !!b.isFeatured;

    if (isAFeatured && !isBFeatured) return -1;
    if (!isAFeatured && isBFeatured) return 1;

    // 4. Manual Display Order (displayOrder) Check
    const orderA = a.displayOrder !== undefined && a.displayOrder !== null && a.displayOrder > 0 ? a.displayOrder : Infinity;
    const orderB = b.displayOrder !== undefined && b.displayOrder !== null && b.displayOrder > 0 ? b.displayOrder : Infinity;
    if (orderA !== orderB) {
      return orderA - orderB; // Lower number comes first (1, 2, 3...)
    }

    // 5. Fallback to Last Updated / Created At Descending
    const dateA = a.lastUpdated || a.createdAt || '';
    const dateB = b.lastUpdated || b.createdAt || '';
    return dateB.localeCompare(dateA);
  });
}

export default function App() {
  // --- PWA & OFFLINE & SPLASH STATES ---
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
      if (sessionStorage.getItem('waqf_install_dismissed') !== 'true') {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1200);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(splashTimer);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA: Install choice outcome is: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    sessionStorage.setItem('waqf_install_dismissed', 'true');
    setShowInstallPrompt(false);
  };

  // --- CORE SYSTEM STATES ---
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('waqf_read_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('waqf_doctors');
    return saved ? JSON.parse(saved) : INITIAL_DOCTORS;
  });

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(() => {
    const saved = localStorage.getItem('waqf_pharmacies');
    return saved ? JSON.parse(saved) : INITIAL_PHARMACIES;
  });

  const [labs, setLabs] = useState<Lab[]>(() => {
    const saved = localStorage.getItem('waqf_labs');
    return saved ? JSON.parse(saved) : INITIAL_LABS;
  });

  const [specialties, setSpecialties] = useState<string[]>(() => {
    const saved = localStorage.getItem('waqf_specialties');
    return saved ? JSON.parse(saved) : INITIAL_SPECIALTIES;
  });

  const [ads, setAds] = useState<Ad[]>(() => {
    const saved = localStorage.getItem('waqf_ads');
    return saved ? JSON.parse(saved) : INITIAL_ADS;
  });

  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('waqf_logs');
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [config, setConfig] = useState<HomePageConfig>(() => {
    const saved = localStorage.getItem('waqf_config');
    return saved ? JSON.parse(saved) : INITIAL_HOME_CONFIG;
  });

  const [doctorRequests, setDoctorRequests] = useState<DoctorRequest[]>(() => {
    const saved = localStorage.getItem('waqf_doctor_requests');
    return saved ? JSON.parse(saved) : [];
  });

  const [contactMessages, setContactMessages] = useState<ContactMessage[]>(() => {
    const saved = localStorage.getItem('waqf_contact_messages');
    return saved ? JSON.parse(saved) : [];
  });

  // Helper to sync any generic collection list to Firestore
  const syncCollectionToFirestore = async <T extends { id: string }>(
    collectionName: string,
    prev: T[],
    next: T[]
  ) => {
    try {
      const prevMap = new Map(prev.map(item => [item.id, item]));
      const nextMap = new Map(next.map(item => [item.id, item]));

      // 1. Identify and delete removed items
      for (const [id] of prevMap.entries()) {
        if (!nextMap.has(id)) {
          console.log(`Sync: Deleting ${id} from collection ${collectionName}...`);
          await deleteDoc(doc(db, collectionName, id));
        }
      }

      // 2. Identify and add/update new/changed items
      for (const [id, item] of nextMap.entries()) {
        const prevItem = prevMap.get(id);
        if (!prevItem || JSON.stringify(prevItem) !== JSON.stringify(item)) {
          console.log(`Sync: Saving ${id} in collection ${collectionName}...`);
          await setDoc(doc(db, collectionName, id), item);
        }
      }
    } catch (error) {
      console.error(`Error syncing collection ${collectionName} to Firestore:`, error);
    }
  };

  // State update handlers that write changes to Firestore
  const handleUpdateDoctors = (value: Doctor[] | ((prev: Doctor[]) => Doctor[])) => {
    setDoctors((prev) => {
      const resolved = typeof value === 'function' ? value(prev) : value;
      return resolved;
    });
  };

  const handleUpdatePharmacies = (value: Pharmacy[] | ((prev: Pharmacy[]) => Pharmacy[])) => {
    setPharmacies((prev) => {
      const resolved = typeof value === 'function' ? value(prev) : value;
      return resolved;
    });
  };

  const handleUpdateLabs = (value: Lab[] | ((prev: Lab[]) => Lab[])) => {
    setLabs((prev) => {
      const resolved = typeof value === 'function' ? value(prev) : value;
      return resolved;
    });
  };

  const handleUpdateAds = (value: Ad[] | ((prev: Ad[]) => Ad[])) => {
    setAds((prev) => {
      const resolved = typeof value === 'function' ? value(prev) : value;
      return resolved;
    });
  };

  const handleUpdateSpecialties = (value: string[] | ((prev: string[]) => string[])) => {
    setSpecialties((prev) => {
      const resolved = typeof value === 'function' ? value(prev) : value;
      return resolved;
    });
  };

  const handleUpdateConfig = (value: HomePageConfig | ((prev: HomePageConfig) => HomePageConfig)) => {
    setConfig((prev) => {
      const resolved = typeof value === 'function' ? value(prev) : value;
      return resolved;
    });
  };

  const handleSaveConfig = async (updatedConfig: HomePageConfig) => {
    try {
      console.log("Saving settings to Firestore settings/main...", updatedConfig);
      await setDoc(doc(db, 'settings', 'main'), updatedConfig);
      showToast('🎉 تم حفظ جميع الإعدادات بنجاح في قاعدة البيانات!');
    } catch (err: any) {
      console.error("Error saving config to Firestore:", err);
      alert(`❌ فشل في حفظ الإعدادات: ${err.message || err}`);
    }
  };

  const handleUpdateDoctorRequests = (value: DoctorRequest[] | ((prev: DoctorRequest[]) => DoctorRequest[])) => {
    setDoctorRequests((prev) => {
      const resolved = typeof value === 'function' ? value(prev) : value;
      return resolved;
    });
  };

  const handleUpdateContactMessages = (value: ContactMessage[] | ((prev: ContactMessage[]) => ContactMessage[])) => {
    setContactMessages((prev) => {
      const resolved = typeof value === 'function' ? value(prev) : value;
      return resolved;
    });
  };

  // Fetch all collections on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        console.log("Fetching all data collections from Firestore...");

        // 1. Fetch config from settings/main
        const configSnap = await getDoc(doc(db, 'settings', 'main'));
        if (configSnap.exists()) {
          setConfig(configSnap.data() as HomePageConfig);
        } else {
          // Initialize config in DB if empty
          await setDoc(doc(db, 'settings', 'main'), INITIAL_HOME_CONFIG);
        }

        // 2. Fetch specialties from settings/specialties
        const specialtiesSnap = await getDoc(doc(db, 'settings', 'specialties'));
        if (specialtiesSnap.exists()) {
          setSpecialties((specialtiesSnap.data() as { list: string[] }).list);
        } else {
          // Initialize specialties in DB if empty
          await setDoc(doc(db, 'settings', 'specialties'), { list: INITIAL_SPECIALTIES });
        }

        // 3. Fetch doctors
        const doctorsSnap = await getDocs(collection(db, 'doctors'));
        const docList: Doctor[] = [];
        doctorsSnap.forEach((d) => {
          docList.push({ id: d.id, ...d.data() } as Doctor);
        });
        setDoctors(docList);

        // 4. Fetch pharmacies
        const pharmaciesSnap = await getDocs(collection(db, 'pharmacies'));
        const pharmList: Pharmacy[] = [];
        pharmaciesSnap.forEach((p) => {
          pharmList.push({ id: p.id, ...p.data() } as Pharmacy);
        });
        setPharmacies(pharmList);

        // 5. Fetch labs
        const labsSnap = await getDocs(collection(db, 'labs'));
        const labList: Lab[] = [];
        labsSnap.forEach((l) => {
          labList.push({ id: l.id, ...l.data() } as Lab);
        });
        setLabs(labList);

        // 6. Fetch ads
        const adsSnap = await getDocs(collection(db, 'ads'));
        const adList: Ad[] = [];
        adsSnap.forEach((a) => {
          adList.push({ id: a.id, ...a.data() } as Ad);
        });
        setAds(adList);

        // 7. Fetch requests
        const reqsSnap = await getDocs(collection(db, 'requests'));
        const reqList: DoctorRequest[] = [];
        reqsSnap.forEach((r) => {
          reqList.push({ id: r.id, ...r.data() } as DoctorRequest);
        });
        reqList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDoctorRequests(reqList);

        // 8. Fetch contactMessages
        try {
          const contactSnap = await getDocs(collection(db, 'contactMessages'));
          const contactList: ContactMessage[] = [];
          contactSnap.forEach((c) => {
            const data = c.data();
            contactList.push({
              id: c.id,
              messageId: data.messageId || c.id,
              fullName: data.fullName || data.name || '',
              phone: data.phone || '',
              email: data.email || '',
              subject: data.subject || '',
              message: data.message || '',
              status: data.status || 'new',
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || data.createdAt || new Date().toISOString()
            } as ContactMessage);
          });
          contactList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setContactMessages(contactList);
        } catch (err) {
          console.error("Error fetching contactMessages:", err);
          handleFirestoreError(err, OperationType.GET, 'contactMessages');
        }

        console.log("All directory states synchronized successfully with Firestore.");
      } catch (error) {
        console.error("Error fetching all collections on mount:", error);
        handleFirestoreError(error, OperationType.GET, 'multiple_collections');
      }
    };
    fetchAllData();
  }, []);

  // --- REALTIME NOTIFICATIONS SUBSCRIPTION ---
  useEffect(() => {
    const pathForOnSnapshot = 'notifications';
    const unsub = onSnapshot(collection(db, pathForOnSnapshot), (snapshot) => {
      const list: AppNotification[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      
      // Sort notifications (pinned first, then by priority, then by date)
      list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        const priorityWeight = { high: 3, normal: 2, low: 1 };
        const weightA = priorityWeight[a.priority] || 2;
        const weightB = priorityWeight[b.priority] || 2;
        if (weightA !== weightB) {
          return weightB - weightA;
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setNotifications(list);
    }, (error) => {
      console.error("Error in notifications snapshot listener:", error);
      handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
    });

    return () => unsub();
  }, []);

  const getActiveNotifications = () => {
    const now = new Date();
    return notifications.filter(n => {
      if (!n.isActive) return false;
      const start = n.startAt ? new Date(n.startAt) : null;
      const end = n.endAt ? new Date(n.endAt) : null;
      if (start && now < start) return false;
      if (end && now > end) return false;
      return true;
    });
  };

  const markNotificationAsRead = (id: string) => {
    setReadNotificationIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem('waqf_read_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllNotificationsAsRead = () => {
    const active = getActiveNotifications();
    const activeIds = active.map(n => n.id);
    setReadNotificationIds((prev) => {
      const merged = Array.from(new Set([...prev, ...activeIds]));
      localStorage.setItem('waqf_read_notifications', JSON.stringify(merged));
      return merged;
    });
  };

  // --- NAVIGATION & ROUTING ---
  const [activePage, _setActivePage] = useState<string>('home');
  const setActivePage = (page: string) => {
    if (page === 'doctors' || page === 'pharmacies' || page === 'labs') {
      _setActivePage('home');
      setTimeout(() => {
        const el = document.getElementById(`section-${page}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      _setActivePage(page);
      if (page === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Infinite Scroll event handler
  useEffect(() => {
    const handleScroll = () => {
      // For doctors sentinel
      const docSentinel = document.getElementById('doctors-sentinel');
      if (docSentinel) {
        const rect = docSentinel.getBoundingClientRect();
        if (rect.top <= window.innerHeight + 150) {
          setVisibleDoctors(prev => prev + 6);
        }
      }
      // For pharmacies sentinel
      const pharmSentinel = document.getElementById('pharmacies-sentinel');
      if (pharmSentinel) {
        const rect = pharmSentinel.getBoundingClientRect();
        if (rect.top <= window.innerHeight + 150) {
          setVisiblePharmacies(prev => prev + 6);
        }
      }
      // For labs sentinel
      const labSentinel = document.getElementById('labs-sentinel');
      if (labSentinel) {
        const rect = labSentinel.getBoundingClientRect();
        if (rect.top <= window.innerHeight + 150) {
          setVisibleLabs(prev => prev + 6);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('waqf_admin_session') === 'true';
  });

  // Admin panel URL isolation listener
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('portal') === 'alhawi_secure_2026') {
        localStorage.setItem('waqf_admin_portal_unlocked', 'true');
        setActivePage('admin');
      } else if (localStorage.getItem('waqf_admin_portal_unlocked') === 'true' && params.get('page') === 'admin_dashboard') {
        setActivePage('admin');
      }
    };

    handleUrlChange();

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);

    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Prevent search engine indexing of the admin control panel
  useEffect(() => {
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (activePage === 'admin') {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute('content', 'noindex, nofollow, noarchive');
    } else {
      if (metaRobots) {
        metaRobots.setAttribute('content', 'index, follow');
      }
    }
  }, [activePage]);

  // --- FILTERS & SEARCHES ---
  const [homeSearch, setHomeSearch] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [pharmSearch, setPharmSearch] = useState('');
  const [labSearch, setLabSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [doctorSort, setDoctorSort] = useState('recent'); // 'recent' | 'name-asc' | 'name-desc'
  const [pharmSort, setPharmSort] = useState('recent'); // 'recent' | 'name-asc' | 'name-desc'
  const [labSort, setLabSort] = useState('recent'); // 'recent' | 'name-asc' | 'name-desc'

  // Advanced Search & Filter states
  const [villageFilter, setVillageFilter] = useState('');
  const [availableNowFilter, setAvailableNowFilter] = useState(false);
  const [distinctionFilter, setDistinctionFilter] = useState('all'); // 'all' | 'featured' | 'verified'
  const [servicesSearch, setServicesSearch] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // --- LAZY LOADING / INFINITE SCROLL LIMITS FOR HOME PAGE ---
  const [visibleDoctors, setVisibleDoctors] = useState(6);
  const [visiblePharmacies, setVisiblePharmacies] = useState(6);
  const [visibleLabs, setVisibleLabs] = useState(6);

  // Reset limits when filters change
  useEffect(() => {
    setVisibleDoctors(6);
  }, [doctorSearch, selectedSpecialty, doctorSort, villageFilter, availableNowFilter, distinctionFilter, servicesSearch]);

  useEffect(() => {
    setVisiblePharmacies(6);
  }, [pharmSearch, pharmSort, villageFilter, availableNowFilter, distinctionFilter, servicesSearch]);

  useEffect(() => {
    setVisibleLabs(6);
  }, [labSearch, labSort, villageFilter, availableNowFilter, distinctionFilter, servicesSearch]);

  // Unified Search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchCategory, setGlobalSearchCategory] = useState<'all' | 'doctors' | 'pharmacies' | 'labs'>('all');

  // Contact form submission simulator
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Service Submission & Tracking Form States
  const [requestDocForm, setRequestDocForm] = useState({
    serviceType: 'doctor' as DoctorRequest['serviceType'],
    name: '',
    specialty: '',
    customSpecialty: '',
    clinicName: '',
    pharmacistName: '',
    shortDescription: '',
    address: '',
    phone: '',
    governorate: 'قنا',
    center: 'الوقف',
    notes: ''
  });
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const [trackingIdInput, setTrackingIdInput] = useState('');
  const [searchedRequest, setSearchedRequest] = useState<DoctorRequest | null | undefined>(undefined);

  // Toast States
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- SYNCHRONIZATION EFFECT ---
  useEffect(() => {
    localStorage.setItem('waqf_doctors', JSON.stringify(doctors));
  }, [doctors]);

  useEffect(() => {
    localStorage.setItem('waqf_pharmacies', JSON.stringify(pharmacies));
  }, [pharmacies]);

  useEffect(() => {
    localStorage.setItem('waqf_labs', JSON.stringify(labs));
  }, [labs]);

  useEffect(() => {
    localStorage.setItem('waqf_specialties', JSON.stringify(specialties));
  }, [specialties]);

  useEffect(() => {
    localStorage.setItem('waqf_ads', JSON.stringify(ads));
  }, [ads]);

  useEffect(() => {
    localStorage.setItem('waqf_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('waqf_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('waqf_doctor_requests', JSON.stringify(doctorRequests));
  }, [doctorRequests]);

  useEffect(() => {
    localStorage.setItem('waqf_contact_messages', JSON.stringify(contactMessages));
  }, [contactMessages]);

  // --- ADMINISTRATIVE UTILITIES ---
  const addLog = (action: string, type: ActivityLog['type'], details: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      type,
      details
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleAdminLogin = (pass: string) => {
    const requiredPassword = config.adminPassword || '@Alhawi92682905';
    if (pass === requiredPassword) {
      setAdminLoggedIn(true);
      localStorage.setItem('waqf_admin_session', 'true');
      addLog('تعديل', 'system', 'تم تسجيل الدخول إلى لوحة التحكم بنجاح.');
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setAdminLoggedIn(false);
    localStorage.removeItem('waqf_admin_session');
    addLog('تعديل', 'system', 'تم تسجيل الخروج من لوحة التحكم.');
    showToast('🔒 تم تسجيل الخروج بنجاح.');
    setActivePage('home');
  };

  // Toast helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Service request submission handler (generalized)
  const handleDoctorRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const rawName = requestDocForm.name.trim();
    const rawAddress = requestDocForm.address.trim();
    const rawPhone = requestDocForm.phone.trim();

    if (!rawName) {
      showToast('⚠️ يرجى إدخال الاسم.');
      return;
    }
    if (!rawAddress) {
      showToast('⚠️ يرجى إدخال العنوان.');
      return;
    }
    if (!rawPhone) {
      showToast('⚠️ يرجى إدخال رقم الهاتف.');
      return;
    }

    setIsSubmittingRequest(true);
    
    const serviceTypeLabels: Record<string, string> = {
      doctor: 'طبيب',
      pharmacy: 'صيدلية',
      lab: 'معمل',
      scan_center: 'مركز أشعة',
      hospital: 'مستشفى',
      physiotherapy: 'مركز علاج طبيعي',
      other: 'خدمة طبية أخرى'
    };

    const typeLabel = serviceTypeLabels[requestDocForm.serviceType] || 'خدمة طبية';

    // Determine specialty for doctor or default
    const finalSpecialty = requestDocForm.serviceType === 'doctor'
      ? (requestDocForm.specialty === 'other' ? (requestDocForm.customSpecialty?.trim() || 'تخصص عام') : (requestDocForm.specialty || specialties[0] || 'أطفال وحديثي الولادة'))
      : undefined;

    // Generate Request ID: e.g., SRQ-49204
    const newReqId = `SRQ-${Math.floor(10000 + Math.random() * 90000)}`;

    // Build request data dynamically based on the serviceType only
    const baseRequest: any = {
      id: newReqId,
      serviceType: requestDocForm.serviceType,
      address: rawAddress,
      phone: rawPhone,
      governorate: requestDocForm.governorate || 'قنا',
      center: requestDocForm.center || 'الوقف',
      createdAt: new Date().toISOString(),
      status: 'pending'
    };

    if (requestDocForm.notes && requestDocForm.notes.trim()) {
      baseRequest.notes = requestDocForm.notes.trim();
    }

    if (requestDocForm.serviceType === 'doctor') {
      baseRequest.name = rawName;
      baseRequest.doctorName = rawName;
      baseRequest.specialty = finalSpecialty;
      baseRequest.clinicName = requestDocForm.clinicName?.trim() || 'عيادة خاصة';
    } else if (requestDocForm.serviceType === 'pharmacy') {
      baseRequest.name = rawName;
      baseRequest.pharmacyName = rawName;
      if (requestDocForm.pharmacistName && requestDocForm.pharmacistName.trim()) {
        baseRequest.pharmacistName = requestDocForm.pharmacistName.trim();
      }
    } else if (requestDocForm.serviceType === 'lab') {
      baseRequest.name = rawName;
      baseRequest.labName = rawName;
    } else if (requestDocForm.serviceType === 'scan_center') {
      baseRequest.name = rawName;
      baseRequest.radiologyCenterName = rawName;
    } else if (requestDocForm.serviceType === 'hospital') {
      baseRequest.name = rawName;
      baseRequest.hospitalName = rawName;
    } else if (requestDocForm.serviceType === 'physiotherapy') {
      baseRequest.name = rawName;
      baseRequest.physiotherapyCenterName = rawName;
    } else {
      // other
      baseRequest.name = rawName;
      if (requestDocForm.shortDescription && requestDocForm.shortDescription.trim()) {
        baseRequest.shortDescription = requestDocForm.shortDescription.trim();
      }
    }

    // Clean data thoroughly to completely eliminate undefined or empty fields
    const cleanRequest: any = {};
    for (const key of Object.keys(baseRequest)) {
      const val = baseRequest[key];
      if (val !== undefined && val !== null && val !== '') {
        cleanRequest[key] = val;
      }
    }

    try {
      console.log("Saving thoroughly cleaned request to Firestore requests collection...", cleanRequest);
      // Save directly to Firestore collection "requests" with document ID as newReqId
      await setDoc(doc(db, 'requests', newReqId), cleanRequest);
      console.log("Request successfully saved to Firestore!");

      // Update control panel state to immediately show the new request
      setDoctorRequests(prev => [cleanRequest as DoctorRequest, ...prev]);
      addLog('إضافة', 'system', `تم تقديم طلب إضافة ${typeLabel}: ${cleanRequest.name} برقم طلب: ${newReqId}`);
      
      setSubmittedRequestId(newReqId);
      showToast(`🎉 تم إرسال طلب إضافة ${typeLabel} بنجاح! احتفظ برقم الطلب.`);
    } catch (error: any) {
      console.error("Error saving request to Firestore:", error);
      showToast(`❌ فشل حفظ الطلب في قاعدة البيانات: ${error.message || error}`);
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleTrackRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = trackingIdInput.trim().toUpperCase();
    if (!cleanId) {
      showToast('⚠️ يرجى إدخال رقم الطلب أولاً.');
      return;
    }

    try {
      console.log(`Tracking request: ${cleanId} from Firestore...`);
      const docRef = doc(db, 'requests', cleanId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const found = { id: docSnap.id, ...docSnap.data() } as DoctorRequest;
        setSearchedRequest(found);
        showToast('🔍 تم العثور على طلبك بنجاح.');
      } else {
        // Fallback to local search
        const found = doctorRequests.find(r => r.id.toUpperCase() === cleanId);
        if (found) {
          setSearchedRequest(found);
          showToast('🔍 تم العثور على طلبك بنجاح.');
        } else {
          setSearchedRequest(null);
          showToast('❌ لم يتم العثور على أي طلب مسجل بهذا الرقم.');
        }
      }
    } catch (error) {
      console.error("Error tracking request from Firestore:", error);
      // Fallback to local search
      const found = doctorRequests.find(r => r.id.toUpperCase() === cleanId);
      if (found) {
        setSearchedRequest(found);
        showToast('🔍 تم العثور على طلبك بنجاح.');
      } else {
        setSearchedRequest(null);
        showToast('❌ لم يتم العثور على أي طلب مسجل بهذا الرقم.');
      }
    }
  };

  // Firestore Inquiry submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.message || !contactForm.phone || !contactForm.subject) {
      showToast('⚠️ يرجى تعبئة الحقول الإلزامية في نموذج الاتصال.');
      return;
    }
    
    setIsSubmittingRequest(true);
    try {
      const newMsgId = `msg-${Date.now()}`;
      const cleanMessage: ContactMessage = {
        id: newMsgId,
        messageId: newMsgId,
        fullName: contactForm.name,
        phone: contactForm.phone,
        email: contactForm.email || '',
        subject: contactForm.subject,
        message: contactForm.message,
        status: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Persist directly to Cloud Firestore first
      await setDoc(doc(db, 'contactMessages', newMsgId), {
        messageId: cleanMessage.messageId,
        fullName: cleanMessage.fullName,
        phone: cleanMessage.phone,
        email: cleanMessage.email,
        subject: cleanMessage.subject,
        message: cleanMessage.message,
        status: cleanMessage.status,
        createdAt: cleanMessage.createdAt,
        updatedAt: cleanMessage.updatedAt
      });
      
      // 2. Only show success and update UI if save succeeded
      setContactMessages(prev => [cleanMessage, ...prev]);
      addLog('إضافة', 'system', `تم استلام رسالة تواصل جديدة من المواطن: ${contactForm.name} - موضوع: ${contactForm.subject}`);
      setContactSubmitted(true);
      showToast('📨 تم إرسال رسالتك بنجاح! ستتواصل معك إدارة الموقع قريباً.');
      setContactForm({ name: '', phone: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error("Error submitting contact message to Firestore:", error);
      showToast('❌ حدث خطأ أثناء إرسال الرسالة، يرجى المحاولة مرة أخرى.');
      handleFirestoreError(error, OperationType.WRITE, 'contactMessages');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Navigation search jumper
  const handleHomeSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeSearch.trim()) return;
    
    setGlobalSearchQuery(homeSearch);
    setGlobalSearchCategory('all');
    setActivePage('search');
    showToast(`🔍 جاري البحث عن "${homeSearch}" في الدليل الشامل...`);
  };

  // Banner Ads Filter
  const getBannerAd = (position: 'top' | 'bottom' | 'search_middle') => {
    return ads.find(ad => ad.isActive && ad.position === position);
  };

  const topBanner = getBannerAd('top');
  const bottomBanner = getBannerAd('bottom');
  const searchMiddleAd = getBannerAd('search_middle');

  // --- COMPILING NEWEST LISTINGS (LATEST ADDITIONS) ---
  const getLatestAdditions = () => {
    // Collect with type references, only showing items that are not hidden and are marked for home display
    const docsWType = doctors.filter(d => !d.hidden && d.showOnHome !== false).slice(0, 2).map(d => ({ ...d, type: 'doctor' as const }));
    const pharmsWType = pharmacies.filter(p => !p.hidden && p.showOnHome !== false).slice(0, 1).map(p => ({ ...p, type: 'pharmacy' as const }));
    const labsWType = labs.filter(l => !l.hidden && l.showOnHome !== false).slice(0, 1).map(l => ({ ...l, type: 'lab' as const }));
    
    return [...docsWType, ...pharmsWType, ...labsWType].slice(0, 3);
  };

  const latestAdditions = getLatestAdditions();

  // --- UNIFIED SEARCH FILTER FUNCTION ---
  const getGlobalSearchResults = () => {
    const query = globalSearchQuery.trim().toLowerCase();
    
    let matchedDoctors: any[] = [];
    let matchedPharmacies: any[] = [];
    let matchedLabs: any[] = [];

    if (globalSearchCategory === 'all' || globalSearchCategory === 'doctors') {
      matchedDoctors = doctors.filter(doc => !doc.hidden && doc.showInSearch !== false).filter(doc => {
        if (!query) return true;
        return (
          doc.name.toLowerCase().includes(query) ||
          doc.specialty.toLowerCase().includes(query) ||
          doc.address.toLowerCase().includes(query) ||
          (doc.phone && doc.phone.includes(query)) ||
          (doc.notes && doc.notes.toLowerCase().includes(query))
        );
      }).map(d => ({ ...d, type: 'doctor' as const }));
    }

    if (globalSearchCategory === 'all' || globalSearchCategory === 'pharmacies') {
      matchedPharmacies = pharmacies.filter(ph => !ph.hidden && ph.showInSearch !== false).filter(ph => {
        if (!query) return true;
        return (
          ph.name.toLowerCase().includes(query) ||
          ph.address.toLowerCase().includes(query) ||
          (ph.phone && ph.phone.includes(query)) ||
          (ph.notes && ph.notes.toLowerCase().includes(query))
        );
      }).map(p => ({ ...p, type: 'pharmacy' as const }));
    }

    if (globalSearchCategory === 'all' || globalSearchCategory === 'labs') {
      matchedLabs = labs.filter(l => !l.hidden && l.showInSearch !== false).filter(l => {
        if (!query) return true;
        return (
          l.name.toLowerCase().includes(query) ||
          l.address.toLowerCase().includes(query) ||
          (l.phone && l.phone.includes(query)) ||
          (l.services && l.services.some(s => s.toLowerCase().includes(query))) ||
          (l.notes && l.notes.toLowerCase().includes(query))
        );
      }).map(l => ({ ...l, type: 'lab' as const }));
    }

    return [...matchedDoctors, ...matchedPharmacies, ...matchedLabs];
  };

  const getBackgroundClass = () => {
    switch (config.themeBackground) {
      case 'neutral': return 'bg-slate-100 text-slate-800';
      case 'warm': return 'bg-[#FAF6F0] text-slate-800';
      case 'dark': return 'bg-slate-950 text-slate-100';
      case 'light':
      default:
        return 'bg-slate-50 text-slate-800';
    }
  };

  const themeClasses = getThemeColorClasses(config.themeColor);

  // --- PWA INTERCEPTORS ---
  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-[#0F766E] flex flex-col items-center justify-center z-[9999] text-white" dir="rtl">
        <div className="flex flex-col items-center max-w-md px-6 text-center">
          <div className="bg-white p-2.5 rounded-[2.5rem] shadow-2xl mb-6 text-[#0F766E] flex items-center justify-center animate-pulse w-32 h-32 overflow-hidden border-2 border-teal-500/20">
            <img src={logoImg} alt="شعار دليل الوقف الطبي" className="w-full h-full object-cover rounded-[2.2rem]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 font-sans text-center">دليل الوقف الطبي</h1>
          <p className="text-teal-100/95 text-sm sm:text-base font-semibold leading-relaxed max-w-xs mx-auto">
            دليلك الأول للخدمات الطبية في مركز الوقف
          </p>
        </div>
        <div className="absolute bottom-12 flex flex-col items-center gap-2.5">
          <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden relative">
            <div className="h-full bg-white rounded-full animate-loading-bar w-0"></div>
          </div>
          <span className="text-[10px] text-teal-200 font-bold tracking-wide">جاري تحميل الدليل...</span>
        </div>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center" dir="rtl">
        <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center">
          <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mb-6 text-rose-500 animate-bounce">
            <WifiOff className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-3">لا يوجد اتصال بالإنترنت</h1>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed font-semibold">
            يبدو أنك لست متصلاً بالإنترنت حالياً. دليل الوقف الطبي يحتاج للاتصال بالشبكة لعرض أحدث البيانات والصيدليات بدقة.
          </p>
          <button
            onClick={() => {
              if (navigator.onLine) {
                setIsOffline(false);
              } else {
                window.location.reload();
              }
            }}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black text-sm py-4 px-6 rounded-2xl transition-all shadow-md shadow-teal-600/10 active:scale-95 cursor-pointer"
          >
            إعادة المحاولة 🔄
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${getBackgroundClass()} selection:bg-slate-200 selection:text-slate-950`}>
      
      {/* 2. RESPONSIVE SITE NAVIGATION */}
      <Navbar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        adminLoggedIn={adminLoggedIn} 
        onLogout={handleAdminLogout} 
        config={config}
        showInstallBtn={showInstallBtn}
        onInstallApp={handleInstallApp}
        notifications={getActiveNotifications()}
        readNotificationIds={readNotificationIds}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllAsRead={markAllNotificationsAsRead}
      />

      {/* 3. MAIN SITE CONTENT AREA */}
      <main className="flex-grow overflow-x-hidden">
        {activePage !== 'home' && activePage !== 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <AdRotator ads={ads} position="top" />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full h-full"
          >
        {activePage === 'home' && (
          <div className="animate-fadeIn">
            {(config.sectionsOrder || ['ticker', 'top-ad', 'hero', 'search', 'services', 'middle-ad', 'stats', 'featured']).map((sectionId) => {
              if ((config.disabledSections || []).includes(sectionId)) return null;

              switch (sectionId) {
                case 'ticker':
                  return (
                    <Ticker 
                      key={sectionId} 
                      ads={ads} 
                      speed={config.tickerSpeed || 4} 
                    />
                  );
                case 'top-ad':
                  return (
                    <div key={sectionId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
                      <AdRotator ads={ads} position="top" />
                    </div>
                  );
                case 'hero':
                  return (
                    <div key={sectionId} className="relative pt-10 pb-4 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(#10b981_0.5px,transparent_0.5px)] [background-size:16px_16px] opacity-[0.12]"></div>
                      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 font-sans">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold mb-4 border border-emerald-100 shadow-sm">
                          <HeartPulse className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
                          <span>دليل مجاني 100% يخدم أهالي الوقف وقراها</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">
                          {config.heroTitle}
                        </h1>
                        <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed font-semibold">
                          {config.heroSubtitle}
                        </p>
                      </div>
                    </div>
                  );
                case 'search':
                  return (
                    <div key={sectionId} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 text-center">
                      <form onSubmit={handleHomeSearchSubmit} className="max-w-2xl mx-auto">
                        <div className="bg-white p-2 rounded-2xl sm:rounded-3xl shadow-lg shadow-slate-200/80 border border-slate-150 flex flex-col sm:flex-row items-stretch gap-2">
                          <div className="flex-1 flex items-center px-4 gap-3">
                            <Search className="h-5 w-5 text-slate-400 shrink-0" />
                            <input
                              type="text"
                              value={homeSearch}
                              onChange={(e) => setHomeSearch(e.target.value)}
                              placeholder="ابحث باسم الطبيب، التخصص، العيادة أو الصيدلية..."
                              className="w-full py-2.5 bg-transparent text-slate-800 font-medium placeholder:text-slate-400 focus:outline-none text-sm sm:text-base font-semibold"
                            />
                          </div>
                          <button
                            type="submit"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm px-6 py-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all shadow-md shadow-emerald-200 shrink-0 hover:-translate-y-[1px] active:translate-y-0"
                          >
                            <span>ابحث فوراً</span>
                          </button>
                        </div>
                        <div className="mt-3.5 flex flex-wrap justify-center gap-1.5 text-xs font-semibold text-slate-500">
                          <span>أكثر تداولاً:</span>
                          {specialties.slice(0, 4).map((spec, index) => (
                            <button
                              type="button"
                              key={index}
                              onClick={() => {
                                setSelectedSpecialty(spec);
                                setActivePage('doctors');
                                showToast(`🔍 جاري عرض أطباء تخصص: ${spec}`);
                              }}
                              className="text-emerald-600 hover:underline hover:text-emerald-700"
                            >
                              {spec} •
                            </button>
                          ))}
                        </div>
                      </form>
                      <div className="mt-5.5 flex flex-col sm:flex-row justify-center items-center gap-3 max-w-xl mx-auto">
                        <button
                          onClick={() => setActivePage('request-doctor')}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-rose-50 text-rose-700 hover:bg-rose-100/80 hover:text-rose-800 border border-rose-200/80 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 shadow-sm active:scale-[0.98] grow"
                        >
                          <UserPlus className="h-4.5 w-4.5 text-rose-600 animate-pulse" />
                          <span>إضافة طلب</span>
                        </button>
                        <button
                          onClick={() => setActivePage('track-request')}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 hover:text-emerald-900 border border-emerald-200/80 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-200 shadow-sm active:scale-[0.98] grow"
                        >
                          <ClipboardList className="h-4.5 w-4.5 text-emerald-600" />
                          <span>متابعة حالة طلبك الحالي</span>
                        </button>
                      </div>
                    </div>
                  );
                case 'services':
                  return (
                    <div key={sectionId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                      <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto">
                        {/* Doctors Section */}
                        <div 
                          onClick={() => { setSelectedSpecialty(''); setDoctorSearch(''); setActivePage('doctors'); }}
                          className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200 cursor-pointer text-center group flex flex-col items-center justify-center"
                        >
                          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                            <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 mt-2 sm:mt-3">الأطباء والعيادات</h3>
                          <span className="text-[10px] font-bold text-slate-400 mt-1 sm:block hidden">{doctors.length} عيادة</span>
                        </div>

                        {/* Pharmacies Section */}
                        <div 
                          onClick={() => { setPharmSearch(''); setActivePage('pharmacies'); }}
                          className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer text-center group flex flex-col items-center justify-center"
                        >
                          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                            <Pill className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 mt-2 sm:mt-3">الصيدليات المعتمدة</h3>
                          <span className="text-[10px] font-bold text-slate-400 mt-1 sm:block hidden">{pharmacies.length} صيدلية</span>
                        </div>

                        {/* Labs Section */}
                        <div 
                          onClick={() => { setLabSearch(''); setActivePage('labs'); }}
                          className="bg-white rounded-2xl border border-slate-150 p-4 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer text-center group flex flex-col items-center justify-center"
                        >
                          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl group-hover:bg-purple-500 group-hover:text-white transition-all">
                            <FlaskConical className="h-5 w-5 sm:h-6 sm:w-6" />
                          </div>
                          <h3 className="text-xs sm:text-sm font-extrabold text-slate-800 mt-2 sm:mt-3">معامل التحاليل</h3>
                          <span className="text-[10px] font-bold text-slate-400 mt-1 sm:block hidden">{labs.length} معمل</span>
                        </div>
                      </div>
                    </div>
                  );
                case 'middle-ad':
                  return (
                    <div key={sectionId} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                      <AdRotator ads={ads} position="bottom" />
                    </div>
                  );
                case 'stats':
                  return null;
                case 'featured':
                  return (
                    <div key={sectionId} className="bg-slate-50 py-10 border-t border-b border-slate-100">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-3">
                          <div className="text-center sm:text-right">
                            <h2 className="text-xl sm:text-2xl font-black text-slate-900">أحدث الإضافات في الدليل</h2>
                            <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-1">عيادات وصيدليات جديدة مضافة حديثاً وموثقة من الإدارة</p>
                          </div>
                          <div>
                            <button 
                              onClick={() => setActivePage('doctors')} 
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-150 transition-colors"
                            >
                              <span>عرض الكل</span>
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {latestAdditions.map((item) => (
                            <div key={item.id} className="relative">
                              <span className="absolute top-4 left-4 z-10 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                                مضاف حديثاً
                              </span>
                              <ListingCard 
                                item={item as any} 
                                type={item.type} 
                                ads={ads} 
                                onShowToast={showToast} 
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                default:
                  return null;
              }
            })}

            {/* === دليل الوقف الطبي الشامل: الأقسام مسرودة بالتتالي === */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
              
              {/* === قسم الأطباء والعيادات === */}
              <div id="section-doctors" className="scroll-mt-24">
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-2.5">
                      <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Stethoscope className="h-6 w-6" />
                      </span>
                      <span>الأطباء والعيادات</span>
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1 font-semibold">
                      تصفح الأطباء والعيادات حسب التخصص، أو استخدم البحث السريع للوصول الفوري للطبيب المطلوب.
                    </p>
                  </div>
                  <div className="bg-blue-50 text-blue-700 text-xs font-black px-4 py-2 rounded-xl border border-blue-100 shrink-0 self-start md:self-center">
                    {doctors.filter(d => !d.hidden).length} عيادة مسجلة
                  </div>
                </div>

                {/* Search and Filters block */}
                <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-6 mb-8 shadow-sm flex flex-col md:flex-row items-stretch gap-4">
                  
                  {/* Text search */}
                  <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 gap-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                    <Search className="h-5 w-5 text-slate-400 shrink-0" />
                    <input 
                      type="text"
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      placeholder="ابحث باسم الطبيب، أو العيادة، أو العنوان..."
                      className="w-full bg-transparent py-3 text-sm text-slate-800 font-semibold focus:outline-none"
                    />
                  </div>

                  {/* Specialty filter */}
                  <div className="md:w-64">
                    <select
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    >
                      <option value="">جميع التخصصات الطبية</option>
                      {specialties.map((spec, index) => (
                        <option key={index} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort filter */}
                  <div className="md:w-48">
                    <select
                      value={doctorSort}
                      onChange={(e) => setDoctorSort(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    >
                      <option value="smart">الترتيب الذكي (الافتراضي)</option>
                      <option value="recent">الأحدث تسجيلاً</option>
                      <option value="name-asc">الاسم (أ إلى ي)</option>
                      <option value="name-desc">الاسم (ي إلى أ)</option>
                    </select>
                  </div>

                  {/* Toggle Advanced Filters Button */}
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`flex items-center gap-2 justify-center px-4 py-3.5 text-sm font-bold rounded-xl border transition-all duration-200 shrink-0 ${
                      showAdvancedFilters || villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch
                        ? 'bg-blue-50 text-blue-700 border-blue-200 ring-2 ring-blue-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>خيارات بحث متقدم</span>
                    {(villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch) && (
                      <span className="bg-blue-600 text-white rounded-full w-2 h-2" />
                    )}
                  </button>

                  {/* Clear Filters Button */}
                  {(villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch) && (
                    <button 
                      onClick={() => {
                        setVillageFilter('');
                        setAvailableNowFilter(false);
                        setDistinctionFilter('all');
                        setServicesSearch('');
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-2 px-3 rounded-xl transition-colors flex items-center gap-1.5 justify-center"
                    >
                      <Clock className="h-3.5 w-3.5 rotate-180" />
                      <span>إعادة تعيين</span>
                    </button>
                  )}
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 animate-fadeIn grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {/* 1. Village/Area Select */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">تصفية حسب القرية / المنطقة</label>
                      <select
                        value={villageFilter}
                        onChange={(e) => setVillageFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                      >
                        <option value="">جميع قرى الوقف</option>
                        {['مدينة الوقف', 'المراشدة', 'القلمينا', 'دمو', 'العبل', 'بني كود', 'السنابسة'].map((v, i) => (
                          <option key={i} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Distinction Type */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">نوع التميز والتوثيق</label>
                      <select
                        value={distinctionFilter}
                        onChange={(e) => setDistinctionFilter(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                      >
                        <option value="all">الجميع (افتراضي)</option>
                        <option value="featured">المتميزين فقط ⭐</option>
                        <option value="verified">الموثقين فقط ✅</option>
                      </select>
                    </div>

                    {/* 3. Services search */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">البحث بالخدمات الطبية</label>
                      <input
                        type="text"
                        value={servicesSearch}
                        onChange={(e) => setServicesSearch(e.target.value)}
                        placeholder="سونار، كشف باطني، رسم قلب..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* 4. Available Now toggle */}
                    <div className="flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={() => setAvailableNowFilter(!availableNowFilter)}
                        className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                          availableNowFilter
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-100'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${availableNowFilter ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>المتاحون الآن فقط</span>
                        </div>
                        {availableNowFilter && <Check className="h-4 w-4 text-emerald-600" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Doctors List with Lazy Loading */}
                {(() => {
                  let filtered = doctors.filter(doc => !doc.hidden && doc.showInSearch !== false).filter(doc => {
                    const query = doctorSearch.toLowerCase().trim();
                    const matchQuery = !query || 
                      doc.name.toLowerCase().includes(query) || 
                      doc.clinicName.toLowerCase().includes(query) || 
                      doc.address.toLowerCase().includes(query) || 
                      doc.specialty.toLowerCase().includes(query);
                    
                    const matchSpecialty = !selectedSpecialty || doc.specialty === selectedSpecialty;
                    const matchVillage = !villageFilter || 
                      (doc.village && doc.village.includes(villageFilter)) ||
                      (doc.address && doc.address.includes(villageFilter));
                    
                    let matchAvailable = true;
                    if (availableNowFilter) {
                      const status = checkActivityStatus(doc);
                      matchAvailable = status.isOpen;
                    }

                    let matchDistinction = true;
                    if (distinctionFilter === 'featured') {
                      matchDistinction = !!doc.isFeatured;
                    } else if (distinctionFilter === 'verified') {
                      matchDistinction = !!doc.isVerified;
                    }

                    let matchServices = true;
                    if (servicesSearch.trim()) {
                      const sQuery = servicesSearch.toLowerCase().trim();
                      matchServices = doc.servicesProvided ? 
                        doc.servicesProvided.some(s => s.toLowerCase().includes(sQuery)) : false;
                    }
                    
                    return matchQuery && matchSpecialty && matchVillage && matchAvailable && matchDistinction && matchServices;
                  });

                  filtered = sortListings(filtered, doctorSort);

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center text-slate-500 max-w-md mx-auto my-6">
                        <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4 animate-bounce" />
                        <h3 className="font-bold text-slate-800 text-lg mb-1">عذراً، لم نجد نتائج مطابقة</h3>
                        <p className="text-xs leading-relaxed font-semibold">تأكد من كتابة الاسم بشكل صحيح أو تصفح تخصص طبي آخر.</p>
                      </div>
                    );
                  }

                  const sliced = filtered.slice(0, visibleDoctors);
                  const hasMore = filtered.length > visibleDoctors;

                  return (
                    <div className="space-y-6">
                      <AdRotator ads={ads} position="before_doctors" />

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sliced.map((doc, idx) => (
                          <div key={doc.id} className="contents">
                            <ListingCard 
                              item={doc} 
                              type="doctor" 
                              ads={ads} 
                              onShowToast={showToast} 
                            />
                            {idx === 2 && (
                              <div className="md:col-span-2 lg:col-span-3 my-4">
                                <AdRotator ads={ads} position="search_middle" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div id="doctors-sentinel" className="h-1" />

                      {hasMore && (
                        <div className="text-center pt-4">
                          <button
                            onClick={() => setVisibleDoctors(prev => prev + 6)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            <span>تحميل المزيد من الأطباء</span>
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      <AdRotator ads={ads} position="after_doctors" />
                    </div>
                  );
                })()}
              </div>

              {/* === قسم الصيدليات المعتمدة === */}
              <div id="section-pharmacies" className="scroll-mt-24">
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-2.5">
                      <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                        <Pill className="h-6 w-6" />
                      </span>
                      <span>الصيدليات المعتمدة</span>
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1 font-semibold">
                      تواصل مع الصيدليات بالوقف لطلب العلاج والاستشارات وخدمة التوصيل المنزلي المباشرة.
                    </p>
                  </div>
                  <div className="bg-amber-50 text-amber-700 text-xs font-black px-4 py-2 rounded-xl border border-amber-100 shrink-0 self-start md:self-center">
                    {pharmacies.filter(p => !p.hidden).length} صيدلية مسجلة
                  </div>
                </div>

                {/* Search Block */}
                <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-6 mb-8 shadow-sm flex flex-col md:flex-row items-stretch gap-4">
                  <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 gap-2.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 transition-all duration-200">
                    <Search className="h-5 w-5 text-slate-400 shrink-0" />
                    <input 
                      type="text"
                      value={pharmSearch}
                      onChange={(e) => setPharmSearch(e.target.value)}
                      placeholder="ابحث باسم الصيدلية، أو العنوان..."
                      className="w-full bg-transparent py-3 text-sm text-slate-800 font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="md:w-48">
                    <select
                      value={pharmSort}
                      onChange={(e) => setPharmSort(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                    >
                      <option value="smart">الترتيب الذكي (الافتراضي)</option>
                      <option value="recent">الأحدث تسجيلاً</option>
                      <option value="name-asc">الاسم (أ إلى ي)</option>
                      <option value="name-desc">الاسم (ي إلى أ)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`flex items-center gap-2 justify-center px-4 py-3.5 text-sm font-bold rounded-xl border transition-all duration-200 shrink-0 ${
                      showAdvancedFilters || villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch
                        ? 'bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-amber-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>خيارات بحث متقدم</span>
                    {(villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch) && (
                      <span className="bg-amber-600 text-white rounded-full w-2 h-2" />
                    )}
                  </button>
                </div>

                {/* Pharmacies List with Lazy Loading */}
                {(() => {
                  let filtered = pharmacies.filter(ph => !ph.hidden && ph.showInSearch !== false).filter(ph => {
                    const query = pharmSearch.toLowerCase().trim();
                    const matchQuery = !query || ph.name.toLowerCase().includes(query) || ph.address.toLowerCase().includes(query);
                    const matchVillage = !villageFilter || 
                      (ph.village && ph.village.includes(villageFilter)) ||
                      (ph.address && ph.address.includes(villageFilter));
                    
                    let matchAvailable = true;
                    if (availableNowFilter) {
                      const status = checkActivityStatus(ph);
                      matchAvailable = status.isOpen;
                    }

                    let matchDistinction = true;
                    if (distinctionFilter === 'featured') {
                      matchDistinction = !!ph.isFeatured;
                    } else if (distinctionFilter === 'verified') {
                      matchDistinction = !!ph.isVerified;
                    }

                    let matchServices = true;
                    if (servicesSearch.trim()) {
                      const sQuery = servicesSearch.toLowerCase().trim();
                      matchServices = ph.servicesProvided ? 
                        ph.servicesProvided.some(s => s.toLowerCase().includes(sQuery)) : false;
                    }

                    return matchQuery && matchVillage && matchAvailable && matchDistinction && matchServices;
                  });

                  filtered = sortListings(filtered, pharmSort);

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center text-slate-500 max-w-md mx-auto my-6">
                        <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4 animate-bounce" />
                        <h3 className="font-bold text-slate-800 text-lg mb-1">لم نجد نتائج مطابقة</h3>
                        <p className="text-xs leading-relaxed font-semibold">جرب كتابة كلمات بحث أخرى مثل اسم الشارع أو صيدلية مختلفة.</p>
                      </div>
                    );
                  }

                  const sliced = filtered.slice(0, visiblePharmacies);
                  const hasMore = filtered.length > visiblePharmacies;

                  return (
                    <div className="space-y-6">
                      <AdRotator ads={ads} position="before_pharmacies" />

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sliced.map((pharm) => (
                          <ListingCard 
                            key={pharm.id}
                            item={pharm} 
                            type="pharmacy" 
                            ads={ads} 
                            onShowToast={showToast} 
                          />
                        ))}
                      </div>

                      <div id="pharmacies-sentinel" className="h-1" />

                      {hasMore && (
                        <div className="text-center pt-4">
                          <button
                            onClick={() => setVisiblePharmacies(prev => prev + 6)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            <span>تحميل المزيد من الصيدليات</span>
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      <AdRotator ads={ads} position="after_pharmacies" />
                    </div>
                  );
                })()}
              </div>

              {/* === قسم المعامل والمراكز الطبية === */}
              <div id="section-labs" className="scroll-mt-24">
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-2.5">
                      <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                        <FlaskConical className="h-6 w-6" />
                      </span>
                      <span>المعامل والمراكز الطبية</span>
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm mt-1 font-semibold">
                      ابحث عن المعمل الأقرب إليك، وتعرف على الفحوصات ومراكز الأشعة والتحاليل الدقيقة المتاحة.
                    </p>
                  </div>
                  <div className="bg-purple-50 text-purple-700 text-xs font-black px-4 py-2 rounded-xl border border-purple-100 shrink-0 self-start md:self-center">
                    {labs.filter(l => !l.hidden).length} معمل ومركز طبي مسجل
                  </div>
                </div>

                {/* Search Block */}
                <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-6 mb-8 shadow-sm flex flex-col md:flex-row items-stretch gap-4">
                  <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 gap-2.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 transition-all duration-200">
                    <Search className="h-5 w-5 text-slate-400 shrink-0" />
                    <input 
                      type="text"
                      value={labSearch}
                      onChange={(e) => setLabSearch(e.target.value)}
                      placeholder="ابحث باسم معمل التحاليل، أو العنوان..."
                      className="w-full bg-transparent py-3 text-sm text-slate-800 font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="md:w-48">
                    <select
                      value={labSort}
                      onChange={(e) => setLabSort(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    >
                      <option value="smart">الترتيب الذكي (الافتراضي)</option>
                      <option value="recent">الأحدث تسجيلاً</option>
                      <option value="name-asc">الاسم (أ إلى ي)</option>
                      <option value="name-desc">الاسم (ي إلى أ)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={`flex items-center gap-2 justify-center px-4 py-3.5 text-sm font-bold rounded-xl border transition-all duration-200 shrink-0 ${
                      showAdvancedFilters || villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch
                        ? 'bg-purple-50 text-purple-700 border-purple-200 ring-2 ring-purple-100'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>خيارات بحث متقدم</span>
                    {(villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch) && (
                      <span className="bg-purple-600 text-white rounded-full w-2 h-2" />
                    )}
                  </button>
                </div>

                {/* Labs List with Lazy Loading */}
                {(() => {
                  let filtered = labs.filter(l => !l.hidden && l.showInSearch !== false).filter(l => {
                    const query = labSearch.toLowerCase().trim();
                    const matchQuery = !query || l.name.toLowerCase().includes(query) || l.address.toLowerCase().includes(query);
                    const matchVillage = !villageFilter || 
                      (l.village && l.village.includes(villageFilter)) ||
                      (l.address && l.address.includes(villageFilter));
                    
                    let matchAvailable = true;
                    if (availableNowFilter) {
                      const status = checkActivityStatus(l);
                      matchAvailable = status.isOpen;
                    }

                    let matchDistinction = true;
                    if (distinctionFilter === 'featured') {
                      matchDistinction = !!l.isFeatured;
                    } else if (distinctionFilter === 'verified') {
                      matchDistinction = !!l.isVerified;
                    }

                    let matchServices = true;
                    if (servicesSearch.trim()) {
                      const sQuery = servicesSearch.toLowerCase().trim();
                      matchServices = l.servicesProvided ? 
                        l.servicesProvided.some(s => s.toLowerCase().includes(sQuery)) : false;
                    }

                    return matchQuery && matchVillage && matchAvailable && matchDistinction && matchServices;
                  });

                  filtered = sortListings(filtered, labSort);

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center text-slate-500 max-w-md mx-auto my-6">
                        <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4 animate-bounce" />
                        <h3 className="font-bold text-slate-800 text-lg mb-1">لم نجد نتائج مطابقة</h3>
                        <p className="text-xs leading-relaxed font-semibold">جرب كتابة كلمات بحث أخرى مثل اسم الشارع أو معمل مختلف.</p>
                      </div>
                    );
                  }

                  const sliced = filtered.slice(0, visibleLabs);
                  const hasMore = filtered.length > visibleLabs;

                  return (
                    <div className="space-y-6">
                      <AdRotator ads={ads} position="before_labs" />

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sliced.map((lab) => (
                          <ListingCard 
                            key={lab.id}
                            item={lab} 
                            type="lab" 
                            ads={ads} 
                            onShowToast={showToast} 
                          />
                        ))}
                      </div>

                      <div id="labs-sentinel" className="h-1" />

                      {hasMore && (
                        <div className="text-center pt-4">
                          <button
                            onClick={() => setVisibleLabs(prev => prev + 6)}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            <span>تحميل المزيد من المعامل</span>
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      <AdRotator ads={ads} position="after_labs" />
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        )}


        {/* === DOCTORS PAGE (الأطباء) === */}
        {activePage === 'doctors' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
            
            {/* Header description */}
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900">دليل الأطباء بالوقف</h1>
              <p className="text-slate-500 text-sm mt-1.5 font-semibold">تصفح الأطباء والعيادات حسب التخصص، أو استخدم البحث السريع للوصول الفوري للطبيب المطلوب.</p>
            </div>

            {/* Search and Filters block */}
            <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-6 mb-8 shadow-sm flex flex-col md:flex-row items-stretch gap-4">
              
              {/* Text search */}
              <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 gap-2.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input 
                  type="text"
                  value={doctorSearch}
                  onChange={(e) => setDoctorSearch(e.target.value)}
                  placeholder="ابحث باسم الطبيب، أو العيادة، أو العنوان..."
                  className="w-full bg-transparent py-3 text-sm text-slate-800 font-semibold focus:outline-none"
                />
              </div>

              {/* Specialty filter */}
              <div className="md:w-64">
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                >
                  <option value="">جميع التخصصات الطبية</option>
                  {specialties.map((spec, index) => (
                    <option key={index} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              {/* Sort filter */}
              <div className="md:w-48">
                <select
                  value={doctorSort}
                  onChange={(e) => setDoctorSort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                >
                  <option value="smart">الترتيب الذكي (الافتراضي)</option>
                  <option value="recent">الأحدث تسجيلاً</option>
                  <option value="name-asc">الاسم (أ إلى ي)</option>
                  <option value="name-desc">الاسم (ي إلى أ)</option>
                </select>
              </div>

              {/* Toggle Advanced Filters Button */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 justify-center px-4 py-3.5 text-sm font-bold rounded-xl border transition-all duration-200 shrink-0 ${
                  showAdvancedFilters || villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch
                    ? 'bg-blue-50 text-blue-700 border-blue-200 ring-2 ring-blue-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>خيارات بحث متقدم</span>
                {(villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch) && (
                  <span className="bg-blue-600 text-white rounded-full w-2 h-2" />
                )}
              </button>

              {/* Clear Filters Button */}
              {(villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch) && (
                <button 
                  onClick={() => {
                    setVillageFilter('');
                    setAvailableNowFilter(false);
                    setDistinctionFilter('all');
                    setServicesSearch('');
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-2 px-3 rounded-xl transition-colors flex items-center gap-1.5 justify-center"
                >
                  <Clock className="h-3.5 w-3.5 rotate-180" />
                  <span>إعادة تعيين</span>
                </button>
              )}
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 animate-fadeIn grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Village/Area Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">تصفية حسب القرية / المنطقة</label>
                  <select
                    value={villageFilter}
                    onChange={(e) => setVillageFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">جميع قرى الوقف</option>
                    {['مدينة الوقف', 'المراشدة', 'القلمينا', 'دمو', 'العبل', 'بني كود', 'السنابسة'].map((v, i) => (
                      <option key={i} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Distinction Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">نوع التميز والتوثيق</label>
                  <select
                    value={distinctionFilter}
                    onChange={(e) => setDistinctionFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">الجميع (افتراضي)</option>
                    <option value="featured">المتميزين فقط ⭐</option>
                    <option value="verified">الموثقين فقط ✅</option>
                  </select>
                </div>

                {/* 3. Services search */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">البحث بالخدمات الطبية</label>
                  <input
                    type="text"
                    value={servicesSearch}
                    onChange={(e) => setServicesSearch(e.target.value)}
                    placeholder="سونار، كشف باطني، رسم قلب..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 4. Available Now toggle */}
                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => setAvailableNowFilter(!availableNowFilter)}
                    className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                      availableNowFilter
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-100'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${availableNowFilter ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>المتاحون الآن فقط</span>
                    </div>
                    {availableNowFilter && <Check className="h-4 w-4 text-emerald-600" />}
                  </button>
                </div>
              </div>
            )}

            {/* Grid listing */}
            {(() => {
              // Apply filters
              let filtered = doctors.filter(doc => !doc.hidden && doc.showInSearch !== false).filter(doc => {
                const query = doctorSearch.toLowerCase().trim();
                const matchQuery = !query || 
                  doc.name.toLowerCase().includes(query) || 
                  doc.clinicName.toLowerCase().includes(query) || 
                  doc.address.toLowerCase().includes(query) || 
                  doc.specialty.toLowerCase().includes(query);
                
                const matchSpecialty = !selectedSpecialty || doc.specialty === selectedSpecialty;

                // 1. Village match
                const matchVillage = !villageFilter || 
                  (doc.village && doc.village.includes(villageFilter)) ||
                  (doc.address && doc.address.includes(villageFilter));
                
                // 2. Available now
                let matchAvailable = true;
                if (availableNowFilter) {
                  const status = checkActivityStatus(doc);
                  matchAvailable = status.isOpen;
                }

                // 3. Distinction
                let matchDistinction = true;
                if (distinctionFilter === 'featured') {
                  matchDistinction = !!doc.isFeatured;
                } else if (distinctionFilter === 'verified') {
                  matchDistinction = !!doc.isVerified;
                }

                // 4. Services Search
                let matchServices = true;
                if (servicesSearch.trim()) {
                  const sQuery = servicesSearch.toLowerCase().trim();
                  matchServices = doc.servicesProvided ? 
                    doc.servicesProvided.some(s => s.toLowerCase().includes(sQuery)) : false;
                }
                
                return matchQuery && matchSpecialty && matchVillage && matchAvailable && matchDistinction && matchServices;
              });

              // Apply sorting
              filtered = sortListings(filtered, doctorSort);

              if (filtered.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center text-slate-500 max-w-md mx-auto my-12">
                    <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4 animate-bounce" />
                    <h3 className="font-bold text-slate-800 text-lg mb-1">عذراً، لم نجد نتائج مطابقة</h3>
                    <p className="text-xs leading-relaxed font-semibold">تأكد من كتابة الاسم بشكل صحيح أو تصفح تخصص طبي آخر.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  <AdRotator ads={ads} position="before_doctors" />

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((doc, idx) => (
                      <div key={doc.id} className="contents">
                        <ListingCard 
                          item={doc} 
                          type="doctor" 
                          ads={ads} 
                          onShowToast={showToast} 
                        />

                        {/* Sponsor ad between search results (rendered e.g. after index 2) */}
                        {idx === 2 && (
                          <div className="md:col-span-2 lg:col-span-3 my-4">
                            <AdRotator ads={ads} position="search_middle" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <AdRotator ads={ads} position="after_doctors" />
                </div>
              );
            })()}
          </div>
        )}


        {/* === PHARMACIES PAGE (الصيدليات) === */}
        {activePage === 'pharmacies' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
            
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900">دليل الصيدليات المعتمدة</h1>
              <p className="text-slate-500 text-sm mt-1.5 font-semibold">تواصل مع الصيدليات بالوقف لطلب العلاج والاستشارات وخدمة التوصيل المنزلي المباشرة.</p>
            </div>

            {/* Search Block */}
            <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-6 mb-8 shadow-sm flex flex-col md:flex-row items-stretch gap-4">
              <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 gap-2.5 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100 transition-all duration-200">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input 
                  type="text"
                  value={pharmSearch}
                  onChange={(e) => setPharmSearch(e.target.value)}
                  placeholder="ابحث باسم الصيدلية، أو العنوان..."
                  className="w-full bg-transparent py-3 text-sm text-slate-800 font-semibold focus:outline-none"
                />
              </div>

              <div className="md:w-48">
                <select
                  value={pharmSort}
                  onChange={(e) => setPharmSort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                >
                  <option value="smart">الترتيب الذكي (الافتراضي)</option>
                  <option value="recent">الأحدث تسجيلاً</option>
                  <option value="name-asc">الاسم (أ إلى ي)</option>
                  <option value="name-desc">الاسم (ي إلى أ)</option>
                </select>
              </div>

              {/* Toggle Advanced Filters Button */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 justify-center px-4 py-3.5 text-sm font-bold rounded-xl border transition-all duration-200 shrink-0 ${
                  showAdvancedFilters || villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch
                    ? 'bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-amber-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>خيارات بحث متقدم</span>
                {(villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch) && (
                  <span className="bg-amber-600 text-white rounded-full w-2 h-2" />
                )}
              </button>

              {/* Clear Filters Button */}
              {(villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch) && (
                <button 
                  onClick={() => {
                    setVillageFilter('');
                    setAvailableNowFilter(false);
                    setDistinctionFilter('all');
                    setServicesSearch('');
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-2 px-3 rounded-xl transition-colors flex items-center gap-1.5 justify-center"
                >
                  <Clock className="h-3.5 w-3.5 rotate-180" />
                  <span>إعادة تعيين</span>
                </button>
              )}
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 animate-fadeIn grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Village/Area Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">تصفية حسب القرية / المنطقة</label>
                  <select
                    value={villageFilter}
                    onChange={(e) => setVillageFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">جميع قرى الوقف</option>
                    {['مدينة الوقف', 'المراشدة', 'القلمينا', 'دمو', 'العبل', 'بني كود', 'السنابسة'].map((v, i) => (
                      <option key={i} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Distinction Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">نوع التميز والتوثيق</label>
                  <select
                    value={distinctionFilter}
                    onChange={(e) => setDistinctionFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">الجميع (افتراضي)</option>
                    <option value="featured">المتميزين فقط ⭐</option>
                    <option value="verified">الموثقين فقط ✅</option>
                  </select>
                </div>

                {/* 3. Services search */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">البحث بالأدوية والخدمات</label>
                  <input
                    type="text"
                    value={servicesSearch}
                    onChange={(e) => setServicesSearch(e.target.value)}
                    placeholder="توصيل منازل، تركيبات دوائية..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* 4. Available Now toggle */}
                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => setAvailableNowFilter(!availableNowFilter)}
                    className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                      availableNowFilter
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-100'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${availableNowFilter ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>المفتوحة الآن فقط</span>
                    </div>
                    {availableNowFilter && <Check className="h-4 w-4 text-emerald-600" />}
                  </button>
                </div>
              </div>
            )}

            {/* Grid listing */}
            {(() => {
              let filtered = pharmacies.filter(ph => !ph.hidden && ph.showInSearch !== false).filter(ph => {
                const query = pharmSearch.toLowerCase().trim();
                const matchQuery = !query || ph.name.toLowerCase().includes(query) || ph.address.toLowerCase().includes(query);

                // 1. Village match
                const matchVillage = !villageFilter || 
                  (ph.village && ph.village.includes(villageFilter)) ||
                  (ph.address && ph.address.includes(villageFilter));
                
                // 2. Available now
                let matchAvailable = true;
                if (availableNowFilter) {
                  const status = checkActivityStatus(ph);
                  matchAvailable = status.isOpen;
                }

                // 3. Distinction
                let matchDistinction = true;
                if (distinctionFilter === 'featured') {
                  matchDistinction = !!ph.isFeatured;
                } else if (distinctionFilter === 'verified') {
                  matchDistinction = !!ph.isVerified;
                }

                // 4. Services Search
                let matchServices = true;
                if (servicesSearch.trim()) {
                  const sQuery = servicesSearch.toLowerCase().trim();
                  matchServices = ph.servicesProvided ? 
                    ph.servicesProvided.some(s => s.toLowerCase().includes(sQuery)) : false;
                }

                return matchQuery && matchVillage && matchAvailable && matchDistinction && matchServices;
              });

              filtered = sortListings(filtered, pharmSort);

              if (filtered.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center text-slate-500 max-w-md mx-auto my-12">
                    <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4 animate-bounce" />
                    <h3 className="font-bold text-slate-800 text-lg mb-1">لم نجد نتائج مطابقة</h3>
                    <p className="text-xs leading-relaxed font-semibold">جرب كتابة كلمات بحث أخرى مثل اسم الشارع أو صيدلية مختلفة.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  <AdRotator ads={ads} position="before_pharmacies" />

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((pharm) => (
                      <ListingCard 
                        key={pharm.id}
                        item={pharm} 
                        type="pharmacy" 
                        ads={ads} 
                        onShowToast={showToast} 
                      />
                    ))}
                  </div>

                  <AdRotator ads={ads} position="after_pharmacies" />
                </div>
              );
            })()}
          </div>
        )}


        {/* === LABS PAGE (المعامل) === */}
        {activePage === 'labs' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
            
            <div className="mb-8">
              <h1 className="text-3xl font-black text-slate-900">معامل التحاليل الطبية والاشعة</h1>
              <p className="text-slate-500 text-sm mt-1.5 font-semibold">ابحث عن المعمل الأقرب إليك، وتعرف على الفحوصات ومراكز الأشعة والتحاليل الدقيقة المتاحة.</p>
            </div>

            {/* Search Block */}
            <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-6 mb-8 shadow-sm flex flex-col md:flex-row items-stretch gap-4">
              <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 gap-2.5 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100 transition-all duration-200">
                <Search className="h-5 w-5 text-slate-400 shrink-0" />
                <input 
                  type="text"
                  value={labSearch}
                  onChange={(e) => setLabSearch(e.target.value)}
                  placeholder="ابحث باسم معمل التحاليل، أو العنوان..."
                  className="w-full bg-transparent py-3 text-sm text-slate-800 font-semibold focus:outline-none"
                />
              </div>

              <div className="md:w-48">
                <select
                  value={labSort}
                  onChange={(e) => setLabSort(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                >
                  <option value="smart">الترتيب الذكي (الافتراضي)</option>
                  <option value="recent">الأحدث تسجيلاً</option>
                  <option value="name-asc">الاسم (أ إلى ي)</option>
                  <option value="name-desc">الاسم (ي إلى أ)</option>
                </select>
              </div>

              {/* Toggle Advanced Filters Button */}
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-2 justify-center px-4 py-3.5 text-sm font-bold rounded-xl border transition-all duration-200 shrink-0 ${
                  showAdvancedFilters || villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch
                    ? 'bg-purple-50 text-purple-700 border-purple-200 ring-2 ring-purple-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>خيارات بحث متقدم</span>
                {(villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch) && (
                  <span className="bg-purple-600 text-white rounded-full w-2 h-2" />
                )}
              </button>

              {/* Clear Filters Button */}
              {(villageFilter || availableNowFilter || distinctionFilter !== 'all' || servicesSearch) && (
                <button 
                  onClick={() => {
                    setVillageFilter('');
                    setAvailableNowFilter(false);
                    setDistinctionFilter('all');
                    setServicesSearch('');
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-2 px-3 rounded-xl transition-colors flex items-center gap-1.5 justify-center"
                >
                  <Clock className="h-3.5 w-3.5 rotate-180" />
                  <span>إعادة تعيين</span>
                </button>
              )}
            </div>

            {/* Advanced Filters Panel */}
            {showAdvancedFilters && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 animate-fadeIn grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* 1. Village/Area Select */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">تصفية حسب القرية / المنطقة</label>
                  <select
                    value={villageFilter}
                    onChange={(e) => setVillageFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-500"
                  >
                    <option value="">جميع قرى الوقف</option>
                    {['مدينة الوقف', 'المراشدة', 'القلمينا', 'دمو', 'العبل', 'بني كود', 'السنابسة'].map((v, i) => (
                      <option key={i} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Distinction Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">نوع التميز والتوثيق</label>
                  <select
                    value={distinctionFilter}
                    onChange={(e) => setDistinctionFilter(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">الجميع (افتراضي)</option>
                    <option value="featured">المتميزين فقط ⭐</option>
                    <option value="verified">الموثقين فقط ✅</option>
                  </select>
                </div>

                {/* 3. Services search */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">البحث بالفحوصات والتحاليل</label>
                  <input
                    type="text"
                    value={servicesSearch}
                    onChange={(e) => setServicesSearch(e.target.value)}
                    placeholder="رسم قلب، سونار، وظائف كبد..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* 4. Available Now toggle */}
                <div className="flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => setAvailableNowFilter(!availableNowFilter)}
                    className={`w-full flex items-center justify-between border rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                      availableNowFilter
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-100'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${availableNowFilter ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>المفتوحة الآن فقط</span>
                    </div>
                    {availableNowFilter && <Check className="h-4 w-4 text-emerald-600" />}
                  </button>
                </div>
              </div>
            )}

            {/* Grid listing */}
            {(() => {
              let filtered = labs.filter(l => !l.hidden && l.showInSearch !== false).filter(l => {
                const query = labSearch.toLowerCase().trim();
                const matchQuery = !query || l.name.toLowerCase().includes(query) || l.address.toLowerCase().includes(query);

                // 1. Village match
                const matchVillage = !villageFilter || 
                  (l.village && l.village.includes(villageFilter)) ||
                  (l.address && l.address.includes(villageFilter));
                
                // 2. Available now
                let matchAvailable = true;
                if (availableNowFilter) {
                  const status = checkActivityStatus(l);
                  matchAvailable = status.isOpen;
                }

                // 3. Distinction
                let matchDistinction = true;
                if (distinctionFilter === 'featured') {
                  matchDistinction = !!l.isFeatured;
                } else if (distinctionFilter === 'verified') {
                  matchDistinction = !!l.isVerified;
                }

                // 4. Services Search
                let matchServices = true;
                if (servicesSearch.trim()) {
                  const sQuery = servicesSearch.toLowerCase().trim();
                  matchServices = l.servicesProvided ? 
                    l.servicesProvided.some(s => s.toLowerCase().includes(sQuery)) : false;
                }

                return matchQuery && matchVillage && matchAvailable && matchDistinction && matchServices;
              });

              filtered = sortListings(filtered, labSort);

              if (filtered.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-slate-150 p-12 text-center text-slate-500 max-w-md mx-auto my-12">
                    <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto mb-4 animate-bounce" />
                    <h3 className="font-bold text-slate-800 text-lg mb-1">لم نجد نتائج مطابقة</h3>
                    <p className="text-xs leading-relaxed font-semibold">جرّب البحث باسم الشارع أو معمل تحاليل آخر.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  <AdRotator ads={ads} position="before_labs" />

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((lab) => (
                      <ListingCard 
                        key={lab.id}
                        item={lab} 
                        type="lab" 
                        ads={ads} 
                        onShowToast={showToast} 
                      />
                    ))}
                  </div>

                  <AdRotator ads={ads} position="after_labs" />
                </div>
              );
            })()}
          </div>
        )}


        {/* === ABOUT PAGE (من نحن) === */}
        {activePage === 'about' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-150 p-8 sm:p-12 shadow-sm text-center">
              
              <div className={`mx-auto p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 ${themeClasses.bgLight} ${themeClasses.text}`}>
                <Info className="h-10 w-10" />
              </div>

              <h1 className="text-3xl font-black text-slate-900 leading-tight">
                {config.aboutTitle || 'من نحن - دليل الوقف الطبي'}
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm font-semibold mt-1.5">
                {config.aboutSubtitle || 'دليلك الصحي المعتمد لمركز الوقف، محافظة قنا'}
              </p>
              
              <div className="mt-8 border-t border-slate-100 pt-8 text-right space-y-6 text-slate-600 leading-relaxed font-medium">
                <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed">
                  {config.aboutText || `**دليل الوقف الطبي** هو دليل إلكتروني خدمي مجاني تم إطلاقه خصيصاً لخدمة وتسهيل وصول أهالي مركز الوقف بمحافظة قنا والقرى المجاورة إلى الرعاية الصحية المطلوبة في أسرع وقت.

نسعى باستمرار لتطوير وتحديث الدليل، وإدراج أحدث عيادات الأطباء في مختلف التخصصات، والصيدليات العاملة طوال الـ 24 ساعة، بجانب أفضل معامل التحاليل الطبية والاشعة، لمساعدة المواطن الوقفي في تلبية احتياجاته الطبية دون عناء التنقل والبحث العشوائي.

**أهدافنا الأساسية:**
- تجميع وتدقيق بيانات الأطباء والصيدليات والمعامل بمركز الوقف في مكان واحد وسريع.
- تقديم واجهات تصفح عربية بالكامل وسلسة التصفح من مختلف الأجهزة الذكية والكمبيوتر.
- تنظيم المساحات الإعلانية لخدمات الرعاية الصحية ودعم استمرارية تطوير وتحديث الدليل مجاناً للمواطنين.`}
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-amber-900 text-right">
                  <h4 className="font-bold text-sm mb-1 text-amber-950 flex items-center gap-1.5">
                    <ShieldAlert className="h-4.5 w-4.5 text-amber-600" />
                    <span>ملاحظة أمان وتأكيد دقة البيانات</span>
                  </h4>
                  <p className="text-xs opacity-90 leading-relaxed font-semibold">
                    لضمان مصداقية البيانات ودقتها المطلقة وتفادياً للأخطاء الطبية والتنظيمية، فإن جميع المعلومات المنشورة بالدليل يتم إدخالها، مراجعتها وتحديثها بواسطة 
                    <strong> إدارة الموقع فقط</strong>. لا يُسمح لأي جهة خارجية أو مستخدم عام بإضافة أو تعديل البيانات مباشرة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* === CONTACT PAGE (اتصل بنا) === */}
        {activePage === 'contact' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-5">
              
              {/* Contact Sidebar */}
              <div className="md:col-span-2 bg-slate-900 text-white p-8 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-black">{config.contactTitle || "اتصل بنا"}</h2>
                  <p className="text-slate-400 text-xs mt-1.5 font-semibold leading-relaxed">
                    {config.contactSubtitle || "يسعدنا تلقي اقتراحاتكم، طلبات إضافة عياداتكم، أو الاستفسار عن المساحات الإعلانية المتاحة."}
                  </p>
                </div>

                <div className="space-y-6 my-8 text-sm">
                  {config.contactAddress && (
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 ${themeClasses.text}`}>📍</span>
                      <div>
                        <strong className="block text-white">الموقع الرئيسي للإدارة</strong>
                        <span className="text-slate-400 text-xs">{config.contactAddress}</span>
                      </div>
                    </div>
                  )}

                  {config.contactPhone && (
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 ${themeClasses.text}`}>📞</span>
                      <div>
                        <strong className="block text-white">رقم هاتف الإدارة والواتساب</strong>
                        <span className="text-slate-400 text-xs font-mono" dir="ltr">{config.contactPhone}</span>
                      </div>
                    </div>
                  )}

                  {config.contactEmail && (
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 ${themeClasses.text}`}>✉️</span>
                      <div>
                        <strong className="block text-white">البريد الإلكتروني للإدارة</strong>
                        <span className="text-slate-400 text-xs font-mono" dir="ltr">{config.contactEmail}</span>
                      </div>
                    </div>
                  )}
                </div>

                {config.contactWorkingHours && (
                  <p className="text-[10px] text-slate-500 mb-4">{config.contactWorkingHours}</p>
                )}

                {/* Social Media Links */}
                {(config.socialFacebook || config.socialWhatsapp || config.socialYoutube || config.socialTwitter || config.socialInstagram) && (
                  <div className="border-t border-slate-800 pt-4 mt-2">
                    <h4 className="text-slate-400 text-[10px] font-bold mb-2.5">روابط شبكات التواصل الاجتماعي للتواصل</h4>
                    <div className="flex items-center gap-2.5">
                      {config.socialFacebook && (
                        <a href={config.socialFacebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors hover:bg-slate-750" title="Facebook">
                          <LucideIcons.Facebook className="h-4 w-4" />
                        </a>
                      )}
                      {config.socialWhatsapp && (
                        <a href={config.socialWhatsapp} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors hover:bg-slate-750" title="WhatsApp">
                          <LucideIcons.MessageSquare className="h-4 w-4" />
                        </a>
                      )}
                      {config.socialYoutube && (
                        <a href={config.socialYoutube} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors hover:bg-slate-750" title="YouTube">
                          <LucideIcons.Youtube className="h-4 w-4" />
                        </a>
                      )}
                      {config.socialTwitter && (
                        <a href={config.socialTwitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors hover:bg-slate-750" title="Twitter / X">
                          <LucideIcons.Twitter className="h-4 w-4" />
                        </a>
                      )}
                      {config.socialInstagram && (
                        <a href={config.socialInstagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors hover:bg-slate-750" title="Instagram">
                          <LucideIcons.Instagram className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Form */}
              <div className="md:col-span-3 p-8 sm:p-10">
                {contactSubmitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">شكراً لتواصلك معنا!</h3>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto font-semibold">تم إرسال رسالتك وقيد المراجعة والتدقيق بواسطة إدارة دليل الوقف الطبي. سنقوم بالرد عليك عبر الهاتف أو البريد الإلكتروني المرفقين في أقرب وقت.</p>
                    <button 
                      onClick={() => setContactSubmitted(false)}
                      className="mt-4 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-4 py-2 rounded-xl transition-all"
                    >
                      إرسال استفسار جديد
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">نموذج الاتصال الفوري</h3>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1" htmlFor="contact-name">الاسم بالكامل *</label>
                      <input 
                        id="contact-name"
                        type="text" required
                        value={contactForm.name}
                        onChange={e => setContactForm({...contactForm, name: e.target.value})}
                        placeholder="أدخل اسمك الكريم..."
                        className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1" htmlFor="contact-phone">رقم الهاتف للاتصال *</label>
                        <input 
                          id="contact-phone"
                          type="text" required
                          value={contactForm.phone}
                          onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                          placeholder="مثال: 01012345678"
                          className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1" htmlFor="contact-email">البريد الإلكتروني (اختياري)</label>
                        <input 
                          id="contact-email"
                          type="email"
                          value={contactForm.email}
                          onChange={e => setContactForm({...contactForm, email: e.target.value})}
                          placeholder="name@example.com"
                          className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1" htmlFor="contact-subject">موضوع الرسالة والاستفسار *</label>
                      <input 
                        id="contact-subject"
                        type="text" required
                        value={contactForm.subject}
                        onChange={e => setContactForm({...contactForm, subject: e.target.value})}
                        placeholder="مثال: طلب إضافة عيادة، استفسار إعلاني، شكوى أو مقترح..."
                        className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1" htmlFor="contact-msg">تفاصيل الاستفسار أو الرسالة *</label>
                      <textarea 
                        id="contact-msg"
                        required rows={4}
                        value={contactForm.message}
                        onChange={e => setContactForm({...contactForm, message: e.target.value})}
                        placeholder="اكتب هنا تفاصيل الاستفسار أو الرسالة بوضوح وسنقوم بالتواصل والرد عليكم..."
                        className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Send className="h-4.5 w-4.5" />
                      <span>إرسال الرسالة للإدارة</span>
                    </button>
                  </form>
                )}
              </div>

            </div>
          </div>
        )}


        {/* === PRIVACY POLICY PAGE (سياسة الخصوصية) === */}
        {activePage === 'privacy' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-150 p-8 sm:p-12 shadow-sm text-right">
              <div className="mx-auto bg-blue-50 p-4 rounded-2xl w-16 h-16 flex items-center justify-center text-blue-500 mb-6">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight text-center">
                {config.privacyTitle || 'سياسة الخصوصية'}
              </h1>
              <div className="mt-8 border-t border-slate-100 pt-8 text-slate-600 leading-relaxed font-medium whitespace-pre-line text-sm sm:text-base">
                {config.privacyText || ''}
              </div>
            </div>
          </div>
        )}

        {/* === TERMS AND CONDITIONS PAGE (الشروط والأحكام) === */}
        {activePage === 'terms' && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-150 p-8 sm:p-12 shadow-sm text-right">
              <div className="mx-auto bg-purple-50 p-4 rounded-2xl w-16 h-16 flex items-center justify-center text-purple-500 mb-6">
                <FileText className="h-10 w-10" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 leading-tight text-center">
                {config.termsTitle || 'الشروط والأحكام'}
              </h1>
              <div className="mt-8 border-t border-slate-100 pt-8 text-slate-600 leading-relaxed font-medium whitespace-pre-line text-sm sm:text-base">
                {config.termsText || ''}
              </div>
            </div>
          </div>
        )}


        {/* === UNIFIED SEARCH PAGE (البحث الموحد) === */}
        {activePage === 'search' && (() => {
          const getGlobalSearchStyles = () => {
            if (globalSearchCategory === 'doctors') {
              return {
                input: 'focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100',
                select: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
              };
            }
            if (globalSearchCategory === 'pharmacies') {
              return {
                input: 'focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100',
                select: 'focus:border-amber-500 focus:ring-2 focus:ring-amber-100'
              };
            }
            if (globalSearchCategory === 'labs') {
              return {
                input: 'focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100',
                select: 'focus:border-purple-500 focus:ring-2 focus:ring-purple-100'
              };
            }
            return {
              input: 'focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100',
              select: 'focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
            };
          };
          const gStyles = getGlobalSearchStyles();

          return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fadeIn">
              {/* Header description */}
              <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900">البحث الموحد الشامل</h1>
                <p className="text-slate-500 text-sm mt-1.5 font-semibold">ابحث في كامل الدليل عن الأطباء، الصيدليات، ومعامل التحاليل والاشعة بمركز الوقف في مكان واحد.</p>
              </div>

              {/* Global Search and Filter block */}
              <div className="bg-white rounded-2xl border border-slate-150 p-4 sm:p-6 mb-8 shadow-sm flex flex-col md:flex-row items-stretch gap-4">
                {/* Text search */}
                <div className={`flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 gap-2.5 transition-all duration-200 ${gStyles.input}`}>
                  <Search className="h-5 w-5 text-slate-400 shrink-0" />
                  <input 
                    type="text"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    placeholder="ابحث باسم الطبيب، التخصص، العيادة، الصيدلية، المعمل، أو الخدمة الطبية..."
                    className="w-full bg-transparent py-3 text-sm text-slate-800 font-semibold focus:outline-none"
                  />
                </div>

                {/* Category Filter */}
                <div className="md:w-64">
                  <select
                    value={globalSearchCategory}
                    onChange={(e) => setGlobalSearchCategory(e.target.value as any)}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-semibold text-slate-700 focus:outline-none transition-all duration-200 ${gStyles.select}`}
                  >
                    <option value="all">كل الأقسام</option>
                    <option value="doctors">الأطباء والعيادات</option>
                    <option value="pharmacies">الصيدليات المعتمدة</option>
                    <option value="labs">معامل التحاليل والأشعة</option>
                  </select>
                </div>
              </div>

              {/* Results */}
              {(() => {
                const results = getGlobalSearchResults();
                if (results.length === 0) {
                  return (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-150 shadow-sm">
                      <div className="mx-auto bg-slate-50 text-slate-400 h-16 w-16 rounded-full flex items-center justify-center mb-4">
                        <Search className="h-8 w-8" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">لم يتم العثور على نتائج</h3>
                      <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-sm mx-auto font-medium">جرّب كتابة كلمات مختلفة أو تصفح الأقسام مباشرة من شريط التنقل العلوي.</p>
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 sm:gap-8">
                    {results.map((item) => (
                      <ListingCard 
                        key={item.id} 
                        item={item} 
                        type={item.type} 
                        ads={ads} 
                        onShowToast={showToast} 
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          );
        })()}


        {/* === REQUEST SERVICE ADDITION PAGE (طلب إضافة خدمة طبية) === */}
        {activePage === 'request-doctor' && (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden">
              <div className="bg-slate-900 text-white p-6 sm:p-8 text-center relative">
                <div className="absolute top-4 right-4 text-emerald-400">
                  <UserPlus className="h-10 w-10 opacity-20" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">تقديم طلب إضافة جديد</h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-2 font-semibold">تعبئة هذا النموذج يساعد الإدارة على مراجعة ونشر الخدمة الطبية بشكل صحيح</p>
              </div>

              <div className="p-6 sm:p-8">
                {submittedRequestId ? (
                  <div className="text-center py-8 space-y-6 animate-fadeIn">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                      <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-900">تم إرسال طلبك بنجاح!</h2>
                      <p className="text-slate-500 text-sm font-semibold max-w-md mx-auto leading-relaxed">
                        شكراً لك على المساهمة في تطوير الدليل. طلبك الآن قيد المراجعة والتدقيق من قبل إدارة دليل الوقف الطبي.
                      </p>
                    </div>

                    <div className="bg-slate-50 border rounded-2xl p-6 max-w-md mx-auto space-y-4">
                      <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">رقم الطلب الخاص بك (مهم جداً)</span>
                      <div className="flex items-center justify-between bg-white border rounded-xl p-3.5 shadow-sm">
                        <span className="font-mono text-xl font-black text-slate-900 select-all tracking-wider">{submittedRequestId}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(submittedRequestId);
                            showToast('📋 تم نسخ رقم الطلب إلى الحافظة!');
                          }}
                          className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          نسخ الرقم
                        </button>
                      </div>
                      <p className="text-xs text-amber-600 font-bold leading-relaxed">
                        ⚠️ يرجى الاحتفاظ بهذا الرقم لتتمكن من متابعة حالة الطلب في أي وقت عبر زر "متابعة حالة الطلب" بالصفحة الرئيسية.
                      </p>
                    </div>

                    <div className="pt-4 flex justify-center gap-4">
                      <button
                        onClick={() => {
                          setSubmittedRequestId(null);
                          setRequestDocForm({
                            serviceType: 'doctor',
                            name: '',
                            specialty: '',
                            customSpecialty: '',
                            clinicName: '',
                            pharmacistName: '',
                            shortDescription: '',
                            address: '',
                            phone: '',
                            governorate: 'قنا',
                            center: 'الوقف',
                            notes: ''
                          });
                        }}
                        className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-5 py-2.5 rounded-xl border border-slate-200 transition-colors"
                      >
                        إرسال طلب آخر
                      </button>
                      <button
                        onClick={() => setActivePage('home')}
                        className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 rounded-xl shadow-md shadow-emerald-100 transition-all"
                      >
                        العودة للرئيسية
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleDoctorRequestSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* نوع الخدمة */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">نوع الخدمة الطبية المطلوب إضافتها *</label>
                        <select
                          required
                          value={requestDocForm.serviceType}
                          onChange={e => setRequestDocForm({
                            ...requestDocForm,
                            serviceType: e.target.value as DoctorRequest['serviceType'],
                            name: '',
                            specialty: '',
                            customSpecialty: '',
                            clinicName: '',
                            pharmacistName: '',
                            shortDescription: '',
                            notes: ''
                          })}
                          className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800"
                        >
                          <option value="doctor">طبيب</option>
                          <option value="pharmacy">صيدلية</option>
                          <option value="lab">معمل</option>
                          <option value="scan_center">مركز أشعة</option>
                          <option value="hospital">مستشفى</option>
                          <option value="physiotherapy">مركز علاج طبيعي</option>
                          <option value="other">خدمة طبية أخرى</option>
                        </select>
                      </div>

                      {/* حقول نوع الخدمة: طبيب */}
                      {requestDocForm.serviceType === 'doctor' && (
                        <>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">الاسم الكامل للطبيب *</label>
                            <input
                              type="text"
                              required
                              placeholder="مثال: د. أحمد محمد علي"
                              value={requestDocForm.name}
                              onChange={e => setRequestDocForm({ ...requestDocForm, name: e.target.value })}
                              className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">التخصص الطبي *</label>
                            <select
                              required
                              value={requestDocForm.specialty}
                              onChange={e => setRequestDocForm({ ...requestDocForm, specialty: e.target.value })}
                              className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                            >
                              <option value="">-- اختر التخصص --</option>
                              {specialties.map((spec, i) => (
                                <option key={i} value={spec}>{spec}</option>
                              ))}
                              <option value="other">تخصص آخر / غير مدرج</option>
                            </select>
                          </div>

                          {requestDocForm.specialty === 'other' && (
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1.5">اكتب التخصص الآخر هنا *</label>
                              <input
                                type="text"
                                required
                                placeholder="مثال: مخ وأعصاب"
                                value={requestDocForm.customSpecialty}
                                onChange={e => setRequestDocForm({ ...requestDocForm, customSpecialty: e.target.value })}
                                className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم العيادة / المركز الطبي</label>
                            <input
                              type="text"
                              placeholder="مثال: عيادة الأمل لطب الأطفال"
                              value={requestDocForm.clinicName}
                              onChange={e => setRequestDocForm({ ...requestDocForm, clinicName: e.target.value })}
                              className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                            />
                          </div>
                        </>
                      )}

                      {/* حقول نوع الخدمة: صيدلية */}
                      {requestDocForm.serviceType === 'pharmacy' && (
                        <>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم الصيدلية *</label>
                            <input
                              type="text"
                              required
                              placeholder="مثال: صيدلية الوقف الحديثة"
                              value={requestDocForm.name}
                              onChange={e => setRequestDocForm({ ...requestDocForm, name: e.target.value })}
                              className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم الصيدلي المسؤول (اختياري)</label>
                            <input
                              type="text"
                              placeholder="مثال: د. رامي بقطر"
                              value={requestDocForm.pharmacistName}
                              onChange={e => setRequestDocForm({ ...requestDocForm, pharmacistName: e.target.value })}
                              className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                            />
                          </div>
                        </>
                      )}

                      {/* حقول نوع الخدمة: معمل */}
                      {requestDocForm.serviceType === 'lab' && (
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم المعمل *</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: معمل الوقف للتحاليل الطبية"
                            value={requestDocForm.name}
                            onChange={e => setRequestDocForm({ ...requestDocForm, name: e.target.value })}
                            className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                      )}

                      {/* حقول نوع الخدمة: مركز أشعة */}
                      {requestDocForm.serviceType === 'scan_center' && (
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم مركز الأشعة *</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: مركز النخبة للأشعة"
                            value={requestDocForm.name}
                            onChange={e => setRequestDocForm({ ...requestDocForm, name: e.target.value })}
                            className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                      )}

                      {/* حقول نوع الخدمة: مستشفى */}
                      {requestDocForm.serviceType === 'hospital' && (
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم المستشفى *</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: مستشفى الوقف المركزي"
                            value={requestDocForm.name}
                            onChange={e => setRequestDocForm({ ...requestDocForm, name: e.target.value })}
                            className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                      )}

                      {/* حقول نوع الخدمة: مركز علاج طبيعي */}
                      {requestDocForm.serviceType === 'physiotherapy' && (
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم مركز العلاج الطبيعي *</label>
                          <input
                            type="text"
                            required
                            placeholder="مثال: عيادة الشفاء للعلاج الطبيعي والتأهيل"
                            value={requestDocForm.name}
                            onChange={e => setRequestDocForm({ ...requestDocForm, name: e.target.value })}
                            className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                          />
                        </div>
                      )}

                      {/* حقول نوع الخدمة: خدمة طبية أخرى */}
                      {requestDocForm.serviceType === 'other' && (
                        <>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم الخدمة الطبية *</label>
                            <input
                              type="text"
                              required
                              placeholder="مثال: مكتب تمريض منزلي بالوقف"
                              value={requestDocForm.name}
                              onChange={e => setRequestDocForm({ ...requestDocForm, name: e.target.value })}
                              className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">وصف مختصر للخدمة *</label>
                            <input
                              type="text"
                              required
                              placeholder="مثال: رعاية منزلية، غيار جروح، تركيب محاليل، كشف منزلي..."
                              value={requestDocForm.shortDescription}
                              onChange={e => setRequestDocForm({ ...requestDocForm, shortDescription: e.target.value })}
                              className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                            />
                          </div>
                        </>
                      )}

                      {/* الحقول العامة للجميع */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">العنوان بالتفصيل *</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: الوقف، بجوار مدرسة الشهيد، أعلى صيدلية..."
                          value={requestDocForm.address}
                          onChange={e => setRequestDocForm({ ...requestDocForm, address: e.target.value })}
                          className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">رقم الهاتف للحجز والاستعلام *</label>
                        <input
                          type="tel"
                          required
                          placeholder="مثال: 01012345678"
                          value={requestDocForm.phone}
                          onChange={e => setRequestDocForm({ ...requestDocForm, phone: e.target.value })}
                          className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left"
                          dir="ltr"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">الموقع الجغرافي (افتراضي)</label>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            disabled
                            value="قنا (المحافظة)"
                            className="bg-slate-100 border text-slate-500 rounded-xl px-4 py-3 text-xs font-bold cursor-not-allowed"
                          />
                          <input
                            type="text"
                            disabled
                            value="الوقف (المركز)"
                            className="bg-slate-100 border text-slate-500 rounded-xl px-4 py-3 text-xs font-bold cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 mb-1.5">ملاحظات إضافية للإدارة</label>
                        <textarea
                          rows={3}
                          placeholder="مثال: مواعيد العمل السبت إلى الأربعاء من الساعة 4 عصراً..."
                          value={requestDocForm.notes}
                          onChange={e => setRequestDocForm({ ...requestDocForm, notes: e.target.value })}
                          className="w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                    </div>

                    <div className="border-t pt-6 flex items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setActivePage('home')}
                        className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 bg-slate-50 px-4 py-2.5 rounded-xl border"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>رجوع</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingRequest}
                        className={`bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md shadow-emerald-150 flex items-center gap-2 ${isSubmittingRequest ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <Check className="h-4 w-4" />
                        <span>{isSubmittingRequest ? 'جاري إرسال الطلب...' : 'تقديم الطلب للإدارة'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === TRACK SERVICE REQUEST PAGE (متابعة طلب الإضافة) === */}
        {activePage === 'track-request' && (
          <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden">
              <div className="bg-slate-900 text-white p-6 sm:p-8 text-center relative">
                <div className="absolute top-4 right-4 text-emerald-400">
                  <ClipboardList className="h-10 w-10 opacity-20" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black">متابعة حالة طلب الإضافة</h1>
                <p className="text-slate-400 text-xs mt-1.5 font-semibold">أدخل رقم الطلب لمعرفة حالة المراجعة الحالية</p>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <form onSubmit={handleTrackRequestSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">رقم الطلب (مثال: SRQ-12345) *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="أدخل رمز الطلب هنا..."
                        value={trackingIdInput}
                        onChange={e => setTrackingIdInput(e.target.value)}
                        className="flex-1 bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-left tracking-widest uppercase font-bold"
                        dir="ltr"
                      />
                      <button
                        type="submit"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-emerald-100 text-sm"
                      >
                        بحث
                      </button>
                    </div>
                  </div>
                </form>

                {/* Tracking Results Area */}
                {searchedRequest !== undefined && (
                  <div className="border-t pt-6 space-y-6 animate-fadeIn">
                    {searchedRequest === null ? (
                      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 text-center space-y-2">
                        <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
                        <h3 className="text-sm font-bold text-rose-800">عذراً، لم يتم العثور على هذا الطلب</h3>
                        <p className="text-xs text-rose-600 font-semibold leading-relaxed">
                          يرجى التأكد من كتابة رمز الطلب بشكل صحيح (مثال: SRQ-12345). إذا كنت واثقاً من الرقم، فقد يكون الطلب لم يسجل بعد أو تم حذفه.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(() => {
                          const serviceTypeLabels: Record<string, string> = {
                            doctor: 'طبيب',
                            pharmacy: 'صيدلية',
                            lab: 'معمل',
                            scan_center: 'مركز أشعة',
                            hospital: 'مستشفى',
                            physiotherapy: 'مركز علاج طبيعي',
                            other: 'خدمة طبية أخرى'
                          };

                          const nameLabels: Record<string, string> = {
                            doctor: 'اسم الطبيب',
                            pharmacy: 'اسم الصيدلية',
                            lab: 'اسم المعمل',
                            scan_center: 'اسم مركز الأشعة',
                            hospital: 'اسم المستشفى',
                            physiotherapy: 'اسم مركز العلاج الطبيعي',
                            other: 'اسم الخدمة الطبية'
                          };

                          const typeLabel = serviceTypeLabels[searchedRequest.serviceType || 'doctor'] || 'خدمة طبية';
                          const nameLabel = nameLabels[searchedRequest.serviceType || 'doctor'] || 'الاسم المعروض';

                          return (
                            <>
                              <div className="bg-slate-50 rounded-2xl p-5 border space-y-4">
                                <div className="flex justify-between items-start gap-2 border-b pb-3 border-slate-200">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">{nameLabel}</span>
                                    <span className="text-base font-bold text-slate-900">{searchedRequest.name}</span>
                                  </div>
                                  <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-lg border">
                                    {searchedRequest.id}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 block">نوع الخدمة</span>
                                    <span className="text-slate-800 font-bold">{typeLabel}</span>
                                  </div>

                                  {searchedRequest.serviceType === 'doctor' && (
                                    <>
                                      <div>
                                        <span className="text-[10px] font-bold text-slate-400 block">التخصص</span>
                                        <span>{searchedRequest.specialty || 'تخصص عام'}</span>
                                      </div>
                                      <div>
                                        <span className="text-[10px] font-bold text-slate-400 block">العيادة</span>
                                        <span>{searchedRequest.clinicName || 'عيادة خاصة'}</span>
                                      </div>
                                    </>
                                  )}

                                  {searchedRequest.serviceType === 'pharmacy' && searchedRequest.pharmacistName && (
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-400 block">الصيدلي المسؤول</span>
                                      <span>{searchedRequest.pharmacistName}</span>
                                    </div>
                                  )}

                                  {searchedRequest.serviceType === 'other' && searchedRequest.shortDescription && (
                                    <div className="col-span-2">
                                      <span className="text-[10px] font-bold text-slate-400 block">وصف مختصر للخدمة</span>
                                      <span className="text-slate-700">{searchedRequest.shortDescription}</span>
                                    </div>
                                  )}

                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 block">رقم التواصل</span>
                                    <span className="font-mono text-left block" dir="ltr">{searchedRequest.phone}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 block">تاريخ التقديم</span>
                                    <span>{new Date(searchedRequest.createdAt).toLocaleDateString('ar-EG')}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Status Visualization */}
                              <div className="space-y-3">
                                <span className="text-[10.5px] font-black text-slate-400 uppercase tracking-wider block">حالة الطلب الحالية</span>
                                
                                {searchedRequest.status === 'pending' && (
                                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-4 items-start">
                                    <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600 shrink-0 border border-amber-200">
                                      <Clock className="h-5 w-5 animate-spin" style={{ animationDuration: '6s' }} />
                                    </div>
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-bold text-amber-800">قيد المراجعة والتدقيق</h4>
                                      <p className="text-xs text-amber-700 leading-relaxed font-semibold">
                                        طلبك مستلم وهو الآن في مرحلة المراجعة والتدقيق من قبل الإدارة للتأكد من صحة بيانات {typeLabel} وتفعيل النشر.
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {searchedRequest.status === 'accepted' && (
                                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start">
                                    <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600 shrink-0 border border-blue-200">
                                      <Check className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-bold text-blue-800">تم قبول الطلب</h4>
                                      <p className="text-xs text-blue-700 leading-relaxed font-semibold">
                                        رائع! تم التحقق من البيانات وقبول {typeLabel} بنجاح. جاري العمل الآن على تهيئة بطاقة الخدمة ونشرها لتظهر فوراً لعموم زوار المنصة.
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {searchedRequest.status === 'published' && (
                                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex gap-4 items-start animate-fadeIn">
                                    <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600 shrink-0 border border-emerald-200">
                                      <CheckCircle2 className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-bold text-emerald-800">تم النشر بنجاح</h4>
                                      <p className="text-xs text-emerald-700 leading-relaxed font-semibold">
                                        تم نشر بيانات {typeLabel} بنجاح في دليل الوقف الطبي! يمكن الآن لكافة الزوار العثور على الخدمة والاتصال المباشر بها. شكراً لتعاونكم القائم.
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {searchedRequest.status === 'rejected' && (
                                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5 flex gap-4 items-start">
                                    <div className="p-2.5 bg-rose-100 rounded-xl text-rose-600 shrink-0 border border-rose-200">
                                      <XCircle className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1">
                                      <h4 className="text-sm font-bold text-rose-800">تم رفض طلب الإضافة</h4>
                                      <p className="text-xs text-rose-700 leading-relaxed font-semibold">
                                        نعتذر، لم نتمكن من نشر بيانات {typeLabel} في الوقت الحالي لعدم مطابقة الشروط أو عدم إمكانية التحقق.
                                      </p>
                                      {searchedRequest.rejectionReason && (
                                        <div className="mt-2 text-xs font-bold text-rose-900 bg-rose-100/50 p-3 rounded-lg border border-rose-200">
                                          سبب الرفض: {searchedRequest.rejectionReason}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t pt-5 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActivePage('home')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 bg-slate-50 px-4 py-2.5 rounded-xl border"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>رجوع للرئيسية</span>
                  </button>
                  {searchedRequest !== undefined && (
                    <button
                      type="button"
                      onClick={() => {
                        setTrackingIdInput('');
                        setSearchedRequest(undefined);
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                    >
                      تنظيف البحث
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* === ADMIN PANEL SECTION === */}
        {activePage === 'admin' && (
          <AdminPanel
            adminLoggedIn={adminLoggedIn}
            onLogin={handleAdminLogin}
            onLogout={handleAdminLogout}
            doctors={doctors}
            pharmacies={pharmacies}
            labs={labs}
            specialties={specialties}
            ads={ads}
            logs={logs}
            config={config}
            doctorRequests={doctorRequests}
            contactMessages={contactMessages}
            onUpdateDoctors={handleUpdateDoctors}
            onUpdatePharmacies={handleUpdatePharmacies}
            onUpdateLabs={handleUpdateLabs}
            onUpdateSpecialties={handleUpdateSpecialties}
            onUpdateAds={handleUpdateAds}
            onUpdateConfig={handleUpdateConfig}
            onSaveConfig={handleSaveConfig}
            onUpdateDoctorRequests={handleUpdateDoctorRequests}
            onUpdateContactMessages={handleUpdateContactMessages}
            notifications={notifications}
            onAddLog={addLog}
            onShowToast={showToast}
          />
        )}

        {activePage !== 'home' && activePage !== 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">
            <AdRotator ads={ads} position="bottom" />
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. WEBSITE FOOTER */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800" id="site-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Column 1: Info and Slogan */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg text-white ${themeClasses.bg}`}>
                  {(() => {
                    const IconComp = (LucideIcons as any)[config.siteLogoIcon || ''] || HeartPulse;
                    return <IconComp className="h-5 w-5" />;
                  })()}
                </div>
                <span className="text-white text-lg font-bold">{config.siteLogoText || config.siteName || "دليل الوقف الطبي"}</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-semibold">
                {config.heroSubtitle || "دليل إلكتروني محلي ومجاني بالكامل يهدف لتسهيل الوصول للأطباء والصيدليات والمعامل بمركز الوقف، محافظة قنا لخدمة أهالينا وتوفير الرعاية الكريمة."}
              </p>
              <div className={`text-xs font-bold ${
                config.themeColor === 'blue' ? 'text-blue-400' :
                config.themeColor === 'purple' ? 'text-purple-400' :
                config.themeColor === 'rose' ? 'text-rose-400' :
                config.themeColor === 'amber' ? 'text-amber-400' :
                config.themeColor === 'indigo' ? 'text-indigo-400' :
                config.themeColor === 'slate' ? 'text-slate-400' :
                'text-emerald-400'
              }`}>
                "{config.heroTitle || "دليلك للوصول إلى الأطباء والصيدليات والمعامل في مركز الوقف"}"
              </div>

              {/* Social Media Links in Footer */}
              {(config.socialFacebook || config.socialWhatsapp || config.socialYoutube || config.socialTwitter || config.socialInstagram) && (
                <div className="flex items-center gap-2 pt-2">
                  {config.socialFacebook && (
                    <a href={config.socialFacebook} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800/80 text-slate-400 hover:text-white rounded-xl transition-all hover:bg-slate-800" title="Facebook">
                      <LucideIcons.Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {config.socialWhatsapp && (
                    <a href={config.socialWhatsapp} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800/80 text-slate-400 hover:text-white rounded-xl transition-all hover:bg-slate-800" title="WhatsApp">
                      <LucideIcons.MessageSquare className="h-4 w-4" />
                    </a>
                  )}
                  {config.socialYoutube && (
                    <a href={config.socialYoutube} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800/80 text-slate-400 hover:text-white rounded-xl transition-all hover:bg-slate-800" title="YouTube">
                      <LucideIcons.Youtube className="h-4 w-4" />
                    </a>
                  )}
                  {config.socialTwitter && (
                    <a href={config.socialTwitter} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800/80 text-slate-400 hover:text-white rounded-xl transition-all hover:bg-slate-800" title="Twitter / X">
                      <LucideIcons.Twitter className="h-4 w-4" />
                    </a>
                  )}
                  {config.socialInstagram && (
                    <a href={config.socialInstagram} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-800/80 text-slate-400 hover:text-white rounded-xl transition-all hover:bg-slate-800" title="Instagram">
                      <LucideIcons.Instagram className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
            
            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-white text-sm font-bold mb-4">روابط سريعة</h4>
              <ul className="space-y-2.5 text-xs font-semibold">
                <li><button onClick={() => { setSelectedSpecialty(''); setDoctorSearch(''); setActivePage('doctors'); }} className="hover:text-white hover:underline transition-colors">الأطباء والعيادات</button></li>
                <li><button onClick={() => { setPharmSearch(''); setActivePage('pharmacies'); }} className="hover:text-white hover:underline transition-colors">الصيدليات المعتمدة</button></li>
                <li><button onClick={() => { setLabSearch(''); setActivePage('labs'); }} className="hover:text-white hover:underline transition-colors">معامل التحاليل والاشعة</button></li>
                <li><button onClick={() => { setGlobalSearchQuery(''); setGlobalSearchCategory('all'); setActivePage('search'); }} className="hover:text-white hover:underline transition-colors">البحث الموحد الشامل</button></li>
              </ul>
            </div>
            
            {/* Column 3: About & Contact */}
            <div>
              <h4 className="text-white text-sm font-bold mb-4">معلومات الدليل</h4>
              <ul className="space-y-2.5 text-xs font-semibold text-right">
                <li><button onClick={() => setActivePage('about')} className="hover:text-white hover:underline transition-colors">من نحن</button></li>
                <li><button onClick={() => setActivePage('contact')} className="hover:text-white hover:underline transition-colors">اتصل بنا</button></li>
                <li><button onClick={() => setActivePage('privacy')} className="hover:text-white hover:underline transition-colors">سياسة الخصوصية</button></li>
                <li><button onClick={() => setActivePage('terms')} className="hover:text-white hover:underline transition-colors">الشروط والأحكام</button></li>
              </ul>
            </div>
            
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="font-semibold">© {new Date().getFullYear()} {config.siteName || "دليل الوقف الطبي الإلكتروني"}. جميع الحقوق محفوظة لخدمة أهالي الوقف الكرام.</p>
            <p className="text-[11px] text-slate-600 font-mono">تم التطوير بكل فخر لدعم أهالي مركز الوقف - محافظة قنا.</p>
          </div>
        </div>
      </footer>

      {/* PWA FLOATING INSTALLATION PROMPT */}
      {showInstallPrompt && (
        <div className="fixed bottom-24 sm:bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:max-w-sm bg-white border border-slate-100 p-5 rounded-2xl shadow-2xl z-[9998] animate-slideUp" dir="rtl">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-500 shrink-0">
              <HeartPulse className="h-6 w-6 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-black text-slate-900 mb-1">تثبيت تطبيق دليل الوقف</h4>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                تصفح الدليل الطبي ومواقع الأطباء والصيدليات بشكل أسرع ومباشرة من شاشتك الرئيسية!
              </p>
            </div>
            <button onClick={handleDismissInstall} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleInstallApp}
              className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white text-xs font-black py-2.5 px-4 rounded-xl transition-all shadow-sm shadow-teal-600/10 cursor-pointer text-center"
            >
              تثبيت الآن 📱
            </button>
            <button
              onClick={handleDismissInstall}
              className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 px-4 rounded-xl transition-all cursor-pointer text-center"
            >
              ليس الآن
            </button>
          </div>
        </div>
      )}

      {/* 5. FLOATING SELF-CONTAINED TOAST NOTIFICATIONS */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 left-6 sm:left-auto bg-slate-900 text-white font-semibold text-xs sm:text-sm py-4 px-6 rounded-2xl shadow-2xl z-[9999] border border-slate-700 flex items-center gap-2.5 max-w-sm animate-slideUp">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
