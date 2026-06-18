'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface PremiumSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** Compact mode for inline/table usage */
  compact?: boolean;
  /** Color accent: 'indigo' | 'purple' | 'cyan' | 'zinc' | 'red' | 'amber' | 'orange' */
  accent?: 'indigo' | 'purple' | 'cyan' | 'zinc' | 'red' | 'amber' | 'orange';
  /** Open direction: 'down' (default) or 'up' */
  direction?: 'down' | 'up';
  /** Dark mode style */
  dark?: boolean;
}

const accentMap = {
  indigo:  { ring: 'border-[#71717a]/50', bg: 'bg-[#71717a]/15', text: 'text-[#71717a]', hover: 'hover:bg-[var(--bg-hover)]', activeBg: 'bg-[var(--bg-hover)]', shadow: 'shadow-[0_10px_40px_-10px_rgba(113,113,122,0.2)]' },
  purple:  { ring: 'border-purple-500/50', bg: 'bg-purple-500/10', text: 'text-purple-600', hover: 'hover:bg-purple-500/10', activeBg: 'bg-purple-500/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(168,85,247,0.2)]' },
  cyan:    { ring: 'border-cyan-500/50', bg: 'bg-cyan-500/10', text: 'text-cyan-600', hover: 'hover:bg-cyan-500/10', activeBg: 'bg-cyan-500/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(6,182,212,0.2)]' },
  zinc:    { ring: 'border-zinc-500/50', bg: 'bg-zinc-500/10', text: 'text-zinc-600', hover: 'hover:bg-zinc-500/10', activeBg: 'bg-zinc-500/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(113,113,122,0.2)]' },
  red:     { ring: 'border-red-500/50', bg: 'bg-red-500/10', text: 'text-red-600', hover: 'hover:bg-red-500/10', activeBg: 'bg-red-500/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(239,68,68,0.2)]' },
  amber:   { ring: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'text-amber-600', hover: 'hover:bg-amber-500/10', activeBg: 'bg-amber-500/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(245,158,11,0.2)]' },
  orange:  { ring: 'border-[#FF7420]/50', bg: 'bg-[#FF7420]/10', text: 'text-[#FF7420]', hover: 'hover:bg-[#FF7420]/10', activeBg: 'bg-[#FF7420]/15', shadow: 'shadow-[0_10px_40px_-10px_rgba(255,116,32,0.2)]' },
};

export default function PremiumSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  required = false,
  disabled = false,
  className = '',
  compact = false,
  accent = 'indigo',
  direction = 'down',
  dark = false
}: PremiumSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const colors = accentMap[accent];

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        >
          <option value="">{placeholder}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {/* Custom trigger */}
      <div
        onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
        className={`w-full ${compact ? 'px-2.5 py-1.5 text-xs' : 'p-3 text-sm'} 
          ${dark ? 'bg-[#161616]' : 'bg-[var(--bg-screen)]'} 
          border 
          ${isOpen 
            ? colors.ring 
            : (dark ? 'border-white/10' : 'border-[var(--border-cream)]')
          } 
          ${disabled ? 'opacity-50 cursor-not-allowed' : `cursor-pointer ${dark ? 'hover:border-white/30' : 'hover:border-[#71717a]'}`} 
          rounded-lg font-bold flex justify-between items-center gap-2 transition-all duration-200 group shadow-sm`}
      >
        <span className={selectedOption ? (dark ? 'text-white/90' : 'text-[var(--text-main)]') : 'text-stone-400'}>
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
          className={`absolute z-30 w-full ${direction === 'up' ? 'bottom-full mb-2' : 'mt-2'} 
            ${dark ? 'bg-[#0f0f0f] border border-white/10' : 'bg-[var(--bg-floating)] border border-[var(--border-cream)]'} 
            rounded-xl ${colors.shadow} max-h-56 overflow-y-auto scrollbar-thin animate-in fade-in 
            ${direction === 'up' ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'} duration-200`}
        >
          <div className={`p-2 border-b ${dark ? 'border-white/5 bg-[#161616]' : 'border-b border-[var(--border-cream)] bg-[var(--bg-screen)]'} sticky top-0 z-10`}>
            <span className="text-[10px] uppercase font-black text-stone-400 tracking-wider">{placeholder}</span>
          </div>
          {options.map(opt => (
            <div
              key={opt.value}
              className={`px-4 ${compact ? 'py-2' : 'py-2.5'} text-xs font-semibold cursor-pointer transition-all duration-300 border-b 
                ${dark ? 'border-white/5' : 'border-[var(--border-cream)]/30'} last:border-none 
                ${opt.disabled 
                  ? 'opacity-30 cursor-not-allowed' 
                  : (dark 
                      ? 'hover:bg-white/5 hover:pl-6 hover:text-white' 
                      : 'hover:bg-[var(--bg-hover)] hover:pl-6 hover:text-[var(--text-main)]'
                    )
                } 
                ${value === opt.value 
                  ? `${colors.activeBg} ${colors.text} border-l-4 border-l-current pl-3` 
                  : (dark ? 'text-white/80 pl-4' : 'text-[var(--text-main)] pl-4')
                }`}
              onClick={() => {
                if (!opt.disabled) {
                  onChange(opt.value);
                  setIsOpen(false);
                }
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
