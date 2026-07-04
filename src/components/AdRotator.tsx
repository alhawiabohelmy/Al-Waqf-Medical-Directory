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

  // Detect if the ad has a dark theme style to adjust the golden badge contrast
  const isDarkAd = 
    (currentAd.textColor && (
      currentAd.textColor.toLowerCase().includes('white') || 
      currentAd.textColor.toLowerCase().includes('#fff') ||
      currentAd.textColor.toLowerCase().includes('slate-100') ||
      currentAd.textColor.toLowerCase().includes('slate-200') ||
      currentAd.textColor.toLowerCase().includes('slate-300')
    )) || 
    (currentAd.backgroundColor && (
      currentAd.backgroundColor.toLowerCase().includes('slate-900') ||
      currentAd.backgroundColor.toLowerCase().includes('slate-950') ||
      currentAd.backgroundColor.toLowerCase().includes('emerald-600')
    ));

  const badgeClass = isDarkAd
    ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
    : 'bg-amber-500/10 text-amber-700 border-amber-500/20';

  // Get container styles
  const containerStyle: React.CSSProperties = {
    backgroundColor: isHex(currentAd.backgroundColor) ? currentAd.backgroundColor : undefined,
    color: isHex(currentAd.textColor) ? currentAd.textColor : undefined,
  };

  // Get container classes
  const containerClass = `
    w-full rounded-2xl p-4 sm:p-5 text-center shadow-xs relative overflow-hidden transition-all duration-300 border
    ${isDarkAd ? 'border-white/10 hover:border-white/15' : 'border-amber-500/15 hover:border-amber-500/25'}
    ${!isHex(currentAd.backgroundColor) ? currentAd.backgroundColor || 'bg-emerald-50' : ''}
    ${!isHex(currentAd.textColor) ? currentAd.textColor || 'text-slate-800' : ''}
  `;

  const contentMarkup = (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-[60px]">
      {/* Subtle Premium Radial Glows inside the ad to make it look professional */}
      <div className="absolute -top-16 -right-16 h-32 w-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-16 -left-16 h-32 w-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Elegant, Golden, Small Rounded Badge */}
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide mb-2.5 shadow-xs transition-all border ${badgeClass}`}>
        <span className="text-[11px] leading-none">⭐</span>
        <span>إعلان ممول</span>
      </span>

      {/* Slightly smaller and more elegant ad content */}
      <p className="text-[12.5px] sm:text-[14px] font-semibold leading-relaxed max-w-4xl mx-auto break-words opacity-95">
        {currentAd.content}
      </p>

      {currentAd.link && currentAd.link !== '#' && (
        <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-extrabold hover:underline opacity-90 hover:opacity-100 transition-opacity">
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
            className="block w-full focus:outline-none animate-fadeIn"
          >
            <div className={containerClass} style={containerStyle}>
              {contentMarkup}
            </div>
          </a>
        ) : (
          <div className={`${containerClass} animate-fadeIn`} style={containerStyle}>
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
