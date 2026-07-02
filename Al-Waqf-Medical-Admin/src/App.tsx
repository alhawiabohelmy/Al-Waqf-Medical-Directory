import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { 
  Doctor, Pharmacy, Lab, Ad, ActivityLog, HomePageConfig, DoctorRequest, ContactMessage,
  INITIAL_HOME_CONFIG, INITIAL_SPECIALTIES
} from './data/initialData';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { collection, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('waqf_admin_session') === 'true';
  });

  // State definitions matching properties passed to AdminPanel
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('waqf_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [config, setConfig] = useState<HomePageConfig>(INITIAL_HOME_CONFIG);
  const [doctorRequests, setDoctorRequests] = useState<DoctorRequest[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync logs to localStorage
  useEffect(() => {
    localStorage.setItem('waqf_logs', JSON.stringify(logs));
  }, [logs]);

  // Toast notification helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Log action helper
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

  // Admin login handler
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

  // Admin logout handler
  const handleAdminLogout = () => {
    setAdminLoggedIn(false);
    localStorage.removeItem('waqf_admin_session');
    addLog('تعديل', 'system', 'تم تسجيل الخروج من لوحة التحكم.');
    showToast('🔒 تم تسجيل الخروج بنجاح.');
  };

  // Update configuration inside DB
  const handleSaveConfig = async (updatedConfig: HomePageConfig) => {
    try {
      console.log("Saving settings to Firestore settings/main...", updatedConfig);
      await setDoc(doc(db, 'settings', 'main'), updatedConfig);
      setConfig(updatedConfig);
      showToast('🎉 تم حفظ جميع الإعدادات بنجاح في قاعدة البيانات!');
    } catch (err: any) {
      console.error("Error saving config to Firestore:", err);
      alert(`❌ فشل في حفظ الإعدادات: ${err.message || err}`);
    }
  };

  // Fetch all collections on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        console.log("Fetching all data collections from Firestore...");
        setIsLoading(true);

        // 1. Fetch config from settings/main
        const configSnap = await getDoc(doc(db, 'settings', 'main'));
        if (configSnap.exists()) {
          setConfig(configSnap.data() as HomePageConfig);
        } else {
          // Initialize config in DB if empty
          await setDoc(doc(db, 'settings', 'main'), INITIAL_HOME_CONFIG);
          setConfig(INITIAL_HOME_CONFIG);
        }

        // 2. Fetch specialties from settings/specialties
        const specialtiesSnap = await getDoc(doc(db, 'settings', 'specialties'));
        if (specialtiesSnap.exists()) {
          setSpecialties((specialtiesSnap.data() as { list: string[] }).list);
        } else {
          // Initialize specialties in DB if empty
          await setDoc(doc(db, 'settings', 'specialties'), { list: INITIAL_SPECIALTIES });
          setSpecialties(INITIAL_SPECIALTIES);
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
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center font-sans px-4 text-center" dir="rtl">
        <div className="space-y-4">
          <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <h2 className="text-lg font-extrabold text-slate-100">جاري الاتصال بقاعدة بيانات الدليل...</h2>
          <p className="text-xs text-slate-400 font-medium">الرجاء الانتظار حتى تزامن الدليل بالكامل عبر خوادم Firebase السحابية</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
      
      {/* Primary administrative view */}
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
        onUpdateDoctors={setDoctors}
        onUpdatePharmacies={setPharmacies}
        onUpdateLabs={setLabs}
        onUpdateSpecialties={setSpecialties}
        onUpdateAds={setAds}
        onUpdateConfig={setConfig}
        onSaveConfig={handleSaveConfig}
        onUpdateDoctorRequests={setDoctorRequests}
        onUpdateContactMessages={setContactMessages}
        onAddLog={addLog}
        onShowToast={showToast}
      />

      {/* Floating self-contained visual notification system */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 left-6 sm:left-auto bg-slate-900 text-white font-semibold text-xs sm:text-sm py-4 px-6 rounded-2xl shadow-2xl z-[9999] border border-slate-700 flex items-center gap-2.5 max-w-sm animate-slideUp">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
