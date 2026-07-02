export interface WorkingHoursConfig {
  startDay?: string;
  endDay?: string;
  openHour?: string;
  closeHour?: string;
  daysOff?: string[];
}

const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const DAY_INDEXES: Record<string, number> = {
  'الأحد': 0,
  'الاثنين': 1,
  'الثلاثاء': 2,
  'الأربعاء': 3,
  'الخميس': 4,
  'الجمعة': 5,
  'السبت': 6
};

export function getArabicDayName(dayIndex: number): string {
  return ARABIC_DAYS[dayIndex] || '';
}

export function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function checkActivityStatus(item: WorkingHoursConfig) {
  const { startDay, endDay, openHour, closeHour, daysOff } = item;

  // If any critical field is missing, we consider status "unknown"
  if (!startDay || !endDay || !openHour || !closeHour) {
    return {
      isOpen: false,
      statusText: 'مواعيد غير محددة',
      colorClass: 'text-slate-500 bg-slate-100 border-slate-200 border'
    };
  }

  const now = new Date();
  const currentDayIndex = now.getDay(); // 0 is Sunday, etc.
  const currentDayName = ARABIC_DAYS[currentDayIndex];

  // 1. Check if today is an official day off
  if (daysOff && daysOff.includes(currentDayName)) {
    return {
      isOpen: false,
      statusText: 'مغلق الآن (إجازة)',
      colorClass: 'text-red-700 bg-red-50 border-red-200 border'
    };
  }

  // 2. Check if today is within working days
  const startIdx = DAY_INDEXES[startDay];
  const endIdx = DAY_INDEXES[endDay];

  if (startIdx !== undefined && endIdx !== undefined) {
    const isWithinDays = startIdx <= endIdx 
      ? (currentDayIndex >= startIdx && currentDayIndex <= endIdx)
      : (currentDayIndex >= startIdx || currentDayIndex <= endIdx);

    if (!isWithinDays) {
      return {
        isOpen: false,
        statusText: 'مغلق الآن',
        colorClass: 'text-red-700 bg-red-50 border-red-200 border'
      };
    }
  }

  // 3. Check if current time is within open/close hours
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = parseTimeToMinutes(openHour);
  const closeMinutes = parseTimeToMinutes(closeHour);

  if (openMinutes !== null && closeMinutes !== null) {
    const isWithinHours = openMinutes <= closeMinutes
      ? (currentMinutes >= openMinutes && currentMinutes <= closeMinutes)
      : (currentMinutes >= openMinutes || currentMinutes <= closeMinutes);

    if (isWithinHours) {
      return {
        isOpen: true,
        statusText: 'متاح الآن',
        colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 border'
      };
    }
  }

  return {
    isOpen: false,
    statusText: 'مغلق الآن',
    colorClass: 'text-red-700 bg-red-50 border-red-200 border'
  };
}
