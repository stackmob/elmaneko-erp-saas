import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  id: string;
  label: string;
  sublabel?: string;
  category?: string;
  badge?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Digitar para pesquisar...',
  emptyMessage = 'Nenhum item encontrado',
  label,
  required,
  className = '',
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) => {
    if (!query) return true;
    const q = query.toLowerCase().trim();
    const matchLabel = opt.label.toLowerCase().includes(q);
    const matchSublabel = opt.sublabel ? opt.sublabel.toLowerCase().includes(q) : false;
    const matchCategory = opt.category ? opt.category.toLowerCase().includes(q) : false;
    return matchLabel || matchSublabel || matchCategory;
  });

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-neutral-400 mb-1 uppercase tracking-wider font-semibold text-xs">
          {label} {required && <span className="text-orange-500">*</span>}
        </label>
      )}

      {/* TRIGGER CONTROL */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 bg-neutral-950 border rounded-lg text-white font-mono text-xs flex items-center justify-between cursor-pointer transition-colors ${
          isOpen ? 'border-orange-500 ring-1 ring-orange-500/30' : 'border-neutral-800 hover:border-neutral-700'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 truncate flex-1 pr-2">
          {selectedOption ? (
            <div className="truncate">
              <span className="text-white font-semibold">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-neutral-500 text-[11px] ml-2">({selectedOption.sublabel})</span>
              )}
            </div>
          ) : (
            <span className="text-neutral-500 italic">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-neutral-500 hover:text-neutral-300 p-0.5 rounded hover:bg-neutral-800"
              title="Limpar seleção"
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown size={14} className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 flex flex-col animate-fade-in">
          {/* SEARCH INPUT */}
          <div className="p-2 border-b border-neutral-800 bg-neutral-950/80 sticky top-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" size={13} />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digitar para buscar..."
                className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* OPTIONS LIST */}
          <div className="overflow-y-auto divide-y divide-neutral-850/40">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className={`p-2.5 hover:bg-neutral-800/80 cursor-pointer flex items-center justify-between transition-colors ${
                      isSelected ? 'bg-orange-950/30 text-orange-400' : 'text-neutral-200'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs">{opt.label}</span>
                        {opt.badge && (
                          <span className="px-1.5 py-0.2 bg-neutral-800 text-neutral-400 rounded text-[9px] font-mono border border-neutral-700">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.sublabel && (
                        <span className="text-[11px] text-neutral-500 font-mono block mt-0.5">{opt.sublabel}</span>
                      )}
                    </div>

                    {isSelected && <Check size={14} className="text-orange-500 shrink-0" />}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-neutral-500 font-mono text-xs italic">{emptyMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
