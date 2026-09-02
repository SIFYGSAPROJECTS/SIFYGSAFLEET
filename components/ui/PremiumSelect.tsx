'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface PremiumSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Compact mode for inline/table usage */
  compact?: boolean;
  /** Color accent */
  accent?: 'indigo' | 'purple' | 'cyan' | 'zinc' | 'red' | 'amber' | 'orange' | 'emerald' | 'teal' | 'blue';
  /** Open direction: 'down' | 'up' | 'auto' */
  direction?: 'down' | 'up' | 'auto';
  /** Dropdown horizontal alignment: 'left' | 'right' | 'auto' */
  align?: 'left' | 'right' | 'auto';
  /** Dark mode style */
  dark?: boolean;
  /** Whether the dropdown should have a search filter */
  searchable?: boolean;
}

const accentMap: Record<string, { ring: string; bg: string; text: string; hover: string; activeBg: string; shadow: string }> = {
  indigo:  { ring: 'border-[#71717a]/50', bg: 'bg-[#71717a]/15', text: 'text-[#71717a]', hover: 'hover:bg-[var(--bg-hover)]', activeBg: 'bg-[var(--bg-hover)]', shadow: 'shadow-[0_10px_40px_-10px_rgba(113,113,122,0.2)]' },
  purple:  { ring: 'border-purple-500/50', bg: 'bg-purple-500/10', text: 'text-purple-600', hover: 'hover:bg-purple-500/10', activeBg: 'bg-purple-500/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(168,85,247,0.2)]' },
  cyan:    { ring: 'border-cyan-500/50', bg: 'bg-cyan-500/10', text: 'text-cyan-600', hover: 'hover:bg-cyan-500/10', activeBg: 'bg-cyan-500/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(6,182,212,0.2)]' },
  zinc:    { ring: 'border-zinc-500/50', bg: 'bg-zinc-500/10', text: 'text-zinc-600', hover: 'hover:bg-zinc-500/10', activeBg: 'bg-zinc-500/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(113,113,122,0.2)]' },
  red:     { ring: 'border-red-500/50', bg: 'bg-red-500/10', text: 'text-red-600', hover: 'hover:bg-red-500/10', activeBg: 'bg-red-500/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(239,68,68,0.2)]' },
  amber:   { ring: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'text-amber-600', hover: 'hover:bg-amber-500/10', activeBg: 'bg-amber-500/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(245,158,11,0.2)]' },
  orange:  { ring: 'border-[#FF7420]/50', bg: 'bg-[#FF7420]/10', text: 'text-[#FF7420]', hover: 'hover:bg-[#FF7420]/10', activeBg: 'bg-[#FF7420]/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(255,116,32,0.2)]' },
  emerald: { ring: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-600', hover: 'hover:bg-emerald-500/10', activeBg: 'bg-emerald-500/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(16,185,129,0.2)]' },
  teal:    { ring: 'border-teal-500/50', bg: 'bg-teal-500/10', text: 'text-teal-600', hover: 'hover:bg-teal-500/10', activeBg: 'bg-teal-500/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(20,184,166,0.2)]' },
  blue:    { ring: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-600', hover: 'hover:bg-blue-500/10', activeBg: 'bg-blue-500/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(59,130,246,0.2)]' },
};

export default function PremiumSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Seleccionar...',
  required = false,
  disabled = false,
  className = '',
  compact = false,
  accent = 'indigo',
  direction = 'down',
  align = 'left',
  dark = false,
  searchable = false
}: PremiumSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [actualDirection, setActualDirection] = useState<'down' | 'up'>('down');
  const [actualAlign, setActualAlign] = useState<'left' | 'right'>('left');

  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const colors = accentMap[accent] || accentMap.indigo;

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  // Filter options if searchable
  const filteredOptions = searchable && searchQuery.trim() !== ''
    ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  // Handle outside click & disabled
  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute position (direction and alignment) when opened
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      
      // Vertical placement
      if (direction === 'auto') {
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setActualDirection(spaceBelow < 240 && spaceAbove > spaceBelow ? 'up' : 'down');
      } else {
        setActualDirection(direction);
      }

      // Horizontal alignment
      if (align === 'auto') {
        const spaceRight = window.innerWidth - rect.left;
        setActualAlign(spaceRight < 240 && rect.right > 240 ? 'right' : 'left');
      } else {
        setActualAlign(align);
      }

      // Set initial highlighted index to currently selected option
      const currentIdx = filteredOptions.findIndex(opt => String(opt.value) === String(value));
      setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
    } else {
      setSearchQuery('');
      setHighlightedIndex(-1);
    }
  }, [isOpen, direction, align, value, filteredOptions]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleSelectOption = useCallback((optionValue: string, optionDisabled?: boolean) => {
    if (optionDisabled) return;
    onChange(optionValue);
    setIsOpen(false);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const opt = filteredOptions[highlightedIndex];
        handleSelectOption(opt.value, opt.disabled);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hidden native select for HTML5 form validation */}
      {required && (
        <select
          required
          value={value}
          onChange={() => {}}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          tabIndex={-1}
          aria-hidden="true"
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {/* Custom trigger */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
        onKeyDown={handleKeyDown}
        className={`w-full ${compact ? 'px-2.5 py-1.5 text-xs' : 'p-3 text-sm'} 
          ${dark ? 'bg-[#161616]' : 'bg-[var(--bg-screen)]'} 
          border 
          ${isOpen 
            ? colors.ring 
            : (dark ? 'border-white/10' : 'border-[var(--border-cream)]')
          } 
          ${disabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${dark ? 'hover:border-white/30' : 'hover:border-[#71717a]'}`} 
          rounded-lg font-bold flex justify-between items-center gap-2 transition-all duration-200 group shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50`}
      >
        <span className={`truncate ${selectedOption ? (dark ? 'text-white/90' : 'text-[var(--text-main)]') : 'text-stone-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={`${colors.text} transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          size={compact ? 14 : 16} 
        />
      </div>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div 
          ref={listRef}
          role="listbox"
          className={`absolute z-[100] min-w-full w-max max-w-[280px] sm:max-w-[320px] 
            ${actualAlign === 'right' ? 'right-0' : 'left-0'} 
            ${actualDirection === 'up' ? 'bottom-full mb-2 slide-in-from-bottom-2' : 'top-full mt-2 slide-in-from-top-2'} 
            ${dark ? 'bg-[#0f0f0f] border border-white/10' : 'bg-[var(--bg-floating)] border border-[var(--border-cream)]'} 
            rounded-xl ${colors.shadow} max-h-56 overflow-y-auto overflow-x-hidden scrollbar-thin animate-in fade-in duration-200 shadow-xl`}
        >
          <div className={`p-2 border-b ${dark ? 'border-white/5 bg-[#161616]' : 'border-b border-[var(--border-cream)] bg-[var(--bg-screen)]'} sticky top-0 z-10 flex items-center`}>
            {searchable ? (
              <input 
                ref={searchInputRef}
                type="text" 
                className={`w-full bg-transparent text-xs font-semibold outline-none px-2 py-1 ${dark ? 'text-white' : 'text-[var(--text-main)] placeholder:text-stone-400'}`}
                placeholder="Buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredOptions.length > 0) {
                      const targetIdx = highlightedIndex >= 0 ? highlightedIndex : 0;
                      const opt = filteredOptions[targetIdx];
                      handleSelectOption(opt.value, opt.disabled);
                    }
                  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                    handleKeyDown(e);
                  } else if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
              />
            ) : (
              <span className="text-[10px] uppercase font-black text-stone-400 tracking-wider px-2 truncate block w-full">{placeholder}</span>
            )}
          </div>
          {filteredOptions.length === 0 ? (
            <div className="py-4 text-center text-xs text-stone-400 font-semibold px-4">No hay resultados</div>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = String(value) === String(opt.value);
              const isHighlighted = highlightedIndex === idx;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  className={`px-4 ${compact ? 'py-2' : 'py-2.5'} text-xs font-semibold cursor-pointer transition-all duration-150 border-b 
                    ${dark ? 'border-white/5' : 'border-[var(--border-cream)]/30'} last:border-none whitespace-nowrap
                    ${opt.disabled 
                      ? 'opacity-30 cursor-not-allowed' 
                      : isHighlighted
                        ? (dark ? 'bg-white/10 text-white' : 'bg-[var(--bg-hover)] text-[var(--text-main)]')
                        : (dark ? 'hover:bg-white/5 hover:text-white' : 'hover:bg-[var(--bg-hover)] hover:text-[var(--text-main)]')
                    } 
                    ${isSelected 
                      ? `${colors.activeBg} ${colors.text} border-l-4 border-l-current pl-3 font-bold` 
                      : (dark ? 'text-white/80 pl-4' : 'text-[var(--text-main)] pl-4')
                    }`}
                  onClick={() => handleSelectOption(opt.value, opt.disabled)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  {opt.label}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
