import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  badge?: number | string;
}

interface ScrollableTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChangeTab: (tabId: string) => void;
  className?: string;
}

export const ScrollableTabs: React.FC<ScrollableTabsProps> = ({
  tabs,
  activeTab,
  onChangeTab,
  className = ''
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tabs]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -200 : 200;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className={`relative flex items-center group/tabs ${className}`}>
      {showLeftArrow && (
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-0 z-10 bg-neutral-900/90 border border-neutral-700/60 text-neutral-300 hover:text-white p-1 rounded-full shadow-lg backdrop-blur-sm cursor-pointer transition-all"
          aria-label="Rolar para esquerda"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-1 scroll-smooth w-full"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                isActive
                  ? 'bg-orange-600/10 border-orange-500/50 text-orange-400 font-bold shadow-sm'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
              }`}
            >
              {Icon && <Icon size={14} className={isActive ? 'text-orange-400' : 'text-neutral-500'} />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  isActive ? 'bg-orange-500/20 text-orange-300' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showRightArrow && (
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-0 z-10 bg-neutral-900/90 border border-neutral-700/60 text-neutral-300 hover:text-white p-1 rounded-full shadow-lg backdrop-blur-sm cursor-pointer transition-all"
          aria-label="Rolar para direita"
        >
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
};
