import { useState, useEffect } from 'react';
import { Volume2, ArrowUpRight } from 'lucide-react';
import { Ad } from '../data/initialData';

interface TickerProps {
  ads: Ad[];
  speed?: number; // interval speed in seconds
  key?: any;
}

export default function Ticker({ ads, speed = 4 }: TickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeTickerAds = ads.filter(ad => ad.isActive && ad.position === 'ticker');

  useEffect(() => {
    if (activeTickerAds.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activeTickerAds.length);
    }, speed * 1000);

    return () => clearInterval(interval);
  }, [activeTickerAds.length, speed]);

  if (activeTickerAds.length === 0) {
    return (
      <div className="bg-emerald-50 text-emerald-800 border-b border-emerald-100 py-2.5 text-center text-xs font-semibold px-4 flex items-center justify-center gap-2">
        <Volume2 className="h-4 w-4 text-emerald-600 animate-bounce" />
        <span>أهلاً بكم في دليل الوقف الطبي الإلكتروني - دليلك الأول للرعاية الصحية في مركز الوقف بمحافظة قنا.</span>
      </div>
    );
  }

  const currentAd = activeTickerAds[currentIndex];

  return (
    <div className="bg-emerald-600 text-white border-b border-emerald-700 py-3 relative overflow-hidden shadow-inner" id="news-ticker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* Label Badge */}
        <div className="flex items-center gap-1.5 shrink-0 bg-emerald-800 text-emerald-100 text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md shadow-sm border border-emerald-700">
          <Volume2 className="h-3.5 w-3.5 animate-pulse text-emerald-300" />
          <span>تنويه وهام</span>
        </div>

        {/* Ticker Content */}
        <div className="flex-1 text-right overflow-hidden relative h-5 flex items-center">
          <div 
            key={currentAd.id}
            className="text-sm font-semibold text-emerald-50 hover:text-white transition-all duration-300 animate-slideUp truncate w-full flex items-center gap-2 justify-start"
          >
            <span className="font-bold underline text-white shrink-0">{currentAd.title}:</span>
            <span className="opacity-95">{currentAd.content}</span>
          </div>
        </div>

        {/* Dynamic Action Button for Ad */}
        {currentAd.link && (
          <a
            href={currentAd.link}
            className="shrink-0 text-xs bg-emerald-750 hover:bg-emerald-800 text-white font-bold py-1 px-3 rounded-lg flex items-center gap-1 transition-all border border-emerald-500/30"
          >
            <span>التفاصيل</span>
            <ArrowUpRight className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
