import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Ad } from '../data/initialData';

interface AdRotatorProps {
  ads: Ad[];
  position: string;
}

export default function AdRotator({ ads, position }: AdRotatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter ads by position, activity, and date range validity
  const activeAds = ads
    .filter((ad) => {
      if (!ad.isActive || ad.position !== position) return false;

      const now = new Date();
      if (ad.startDate) {
        const start = new Date(ad.startDate);
        if (!isNaN(start.getTime()) && start > now) return false;
      }
      if (ad.endDate) {
        const end = new Date(ad.endDate);
        // Set end date to end of that day for user convenience
        end.setHours(23, 59, 59, 999);
        if (!isNaN(end.getTime()) && end < now) return false;
      }
      return true;
    })
    // Sort by display order ascending
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Reset current index if ads list changes or shrinks
  useEffect(() => {
    setCurrentIndex(0);
  }, [activeAds.length]);

  // Handle automatic rotation based on individual ad's duration
  useEffect(() => {
    if (activeAds.length <= 1) return;

    const currentAd = activeAds[currentIndex];
    // fallback to 5 seconds if duration is invalid or not specified
    const durationSeconds = currentAd?.duration && currentAd.duration > 0 ? currentAd.duration : 5;

    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activeAds.length);
    }, durationSeconds * 1000);

    return () => clearTimeout(timer);
  }, [currentIndex, activeAds.length, activeAds]);

  if (activeAds.length === 0) return null;

  const currentAd = activeAds[currentIndex];

  // Helper to determine if a color is hex or Tailwind class
  const isHex = (color: string) => color && (color.startsWith('#') || color.startsWith('rgb'));

  // Get container styles
  const containerStyle: React.CSSProperties = {
    backgroundColor: isHex(currentAd.backgroundColor) ? currentAd.backgroundColor : undefined,
    color: isHex(currentAd.textColor) ? currentAd.textColor : undefined,
  };

  // Get container classes
  const containerClass = `
    w-full rounded-2xl p-5 sm:p-6 text-center shadow-sm border border-slate-100 relative overflow-hidden transition-all duration-300
    ${!isHex(currentAd.backgroundColor) ? currentAd.backgroundColor || 'bg-emerald-50' : ''}
    ${!isHex(currentAd.textColor) ? currentAd.textColor || 'text-slate-800' : ''}
  `;

  const contentMarkup = (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-[70px]">
      <span className="inline-block bg-white/20 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest mb-2.5 backdrop-blur-sm">
        مساحة إعلانية نشطة
      </span>
      <p className="text-sm sm:text-base font-bold leading-relaxed max-w-4xl mx-auto break-words">
        {currentAd.content}
      </p>
      {currentAd.link && currentAd.link !== '#' && (
        <span className="mt-2.5 inline-flex items-center gap-1 text-xs font-black hover:underline opacity-90 hover:opacity-100">
          <span>اضغط هنا للتفاصيل</span>
          <ArrowUpRight className="h-3 w-3" />
        </span>
      )}
    </div>
  );

  // If there's only 1 ad, render it statically (no animation needed)
  if (activeAds.length === 1) {
    return (
      <div className="w-full">
        {currentAd.link && currentAd.link !== '#' ? (
          <a
            href={currentAd.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full focus:outline-none"
          >
            <div className={containerClass} style={containerStyle}>
              {contentMarkup}
            </div>
          </a>
        ) : (
          <div className={containerClass} style={containerStyle}>
            {contentMarkup}
          </div>
        )}
      </div>
    );
  }

  // If there are multiple ads, render with smooth AnimatePresence fade
  return (
    <div className="w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAd.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="w-full"
        >
          {currentAd.link && currentAd.link !== '#' ? (
            <a
              href={currentAd.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full focus:outline-none"
            >
              <div className={containerClass} style={containerStyle}>
                {contentMarkup}
              </div>
            </a>
          ) : (
            <div className={containerClass} style={containerStyle}>
              {contentMarkup}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
