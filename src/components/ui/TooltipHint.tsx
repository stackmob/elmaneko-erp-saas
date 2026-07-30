import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipHintProps {
  content: string;
  className?: string;
}

export const TooltipHint: React.FC<TooltipHintProps> = ({ content, className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`relative inline-flex items-center ml-1.5 ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
        className="text-neutral-500 hover:text-orange-400 focus:outline-none transition-colors cursor-pointer"
        aria-label="Ajuda e Dicas"
      >
        <HelpCircle size={14} />
      </button>

      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-neutral-900 border border-neutral-700/80 rounded-lg shadow-xl text-[11px] text-neutral-200 leading-relaxed font-sans z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-neutral-700/80" />
        </div>
      )}
    </div>
  );
};
