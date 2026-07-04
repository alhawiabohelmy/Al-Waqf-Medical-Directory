import React, { useState, useEffect } from 'react';
import { Volume2, ArrowUpRight } from 'lucide-react';
import { Ad } from '../data/initialData';

interface TickerProps {
  ads: Ad[];
  speed?: number; // interval speed in seconds
  key?: any;
}

export default function Ticker({ ads, speed = 4 }: TickerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter ads by position 'ticker', activity, and date range validity
  const activeTickerAds = ads
    .filter((ad) => {
      if (!ad.isActive || ad.position !== 'ticker') return false;

      const now = new Date();
      if (ad.startDate) {
        const start = new Date(ad.startDate);
        if (!isNaN(start.getTime()) && start > now) return false;
      }
      if (ad.endDate) {
        const end = new Date(ad.endDate);
        end.setHours(23, 59, 59, 999);
        if (!isNaN(end.getTime()) && end < now) return false;
      }
      return true;
    })
    // Sort by display order ascending
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Reset current index if ads list changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeTickerAds.length]);

  useEffect(() => {
    if (activeTickerAds.length <= 1) return;

    const currentAd = activeTickerAds[currentIndex];
    // use individual ad duration or fallback to speed
    const durationSeconds = currentAd?.duration && currentAd.duration > 0 ? currentAd.duration : speed;

    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activeTickerAds.length);
    }, durationSeconds * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, activeTickerAds.length, activeTickerAds, speed]);

  if (activeTickerAds.length === 0) {
    return (
      <div className="bg-emerald-50 text-emerald-800 border-b border-emerald-100 py-2.5 text-center text-xs font-semibold px-4 flex items-center justify-center gap-2">
        <Volume2 className="h-4 w-4 text-emerald-600 animate-bounce" />
        <span>أهلاً بكم في دليل الوقف الطبي الإلكتروني - دليلك الأول للرعاية الصحية في مركز الوقف بمحافظة قنا.</span>
      </div>
    );
  }

  const currentAd = activeTickerAds[currentIndex];

  const isHex = (color: string) => color && (color.startsWith('#') || color.startsWith('rgb'));

  const containerStyle: React.CSSProperties = {
    backgroundColor: isHex(currentAd.backgroundColor) ? currentAd.backgroundColor : undefined,
    color: isHex(currentAd.textColor) ? currentAd.textColor : undefined,
  };

  const containerClass = `
    border-b py-3 relative overflow-hidden shadow-inner transition-all duration-300
    ${!isHex(currentAd.backgroundColor) ? currentAd.backgroundColor || 'bg-emerald-600' : ''}
    ${!isHex(currentAd.textColor) ? currentAd.textColor || 'text-white' : ''}
  `;

  return (
    <div className={containerClass} style={containerStyle} id="news-ticker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* Label Badge */}
        <div className="flex items-center gap-1.5 shrink-0 bg-black/25 text-white text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-md shadow-sm border border-white/10">
          <Volume2 className="h-3.5 w-3.5 animate-pulse text-white" />
          <span>تنويه وهام</span>
        </div>

        {/* Ticker Content */}
        <div className="flex-1 text-right overflow-hidden relative h-5 flex items-center">
          <div 
            key={currentAd.id}
            className="text-sm font-semibold transition-all duration-300 animate-slideUp truncate w-full flex items-center gap-2 justify-start"
          >
            {currentAd.title && (
              <span className="font-bold underline shrink-0">{currentAd.title}:</span>
            )}
            <span className="opacity-95">{currentAd.content}</span>
          </div>
        </div>

        {/* Dynamic Action Button for Ad */}
        {currentAd.link && currentAd.link !== '#' && (
          <a
            href={currentAd.link}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs bg-white/20 hover:bg-white/30 text-white font-bold py-1 px-3 rounded-lg flex items-center gap-1 transition-all border border-white/10"
          >
            <span>التفاصيل</span>
            <ArrowUpRight className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
