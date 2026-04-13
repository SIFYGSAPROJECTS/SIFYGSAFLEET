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
  /** Color accent: 'indigo' | 'purple' | 'cyan' | 'emerald' | 'red' | 'amber' */
  accent?: 'indigo' | 'purple' | 'cyan' | 'emerald' | 'red' | 'amber';
  /** Open direction: 'down' (default) or 'up' */
  direction?: 'down' | 'up';
}

const accentMap = {
  indigo:  { ring: 'border-[#6366F1]/50', bg: 'bg-[#6366F1]/15', text: 'text-[#6366F1]', hover: 'hover:bg-[#6366F1]/20', activeBg: 'bg-[#6366F1]/20', shadow: 'shadow-[0_10px_40px_-10px_rgba(99,102,241,0.4)]' },
  purple:  { ring: 'border-purple-500/50', bg: 'bg-purple-500/15', text: 'text-purple-400', hover: 'hover:bg-purple-500/20', activeBg: 'bg-purple-500/20', shadow: 'shadow-[0_10px_40px_-10px_rgba(168,85,247,0.4)]' },
  cyan:    { ring: 'border-cyan-500/50', bg: 'bg-cyan-500/15', text: 'text-cyan-400', hover: 'hover:bg-cyan-500/20', activeBg: 'bg-cyan-500/20', shadow: 'shadow-[0_10px_40px_-10px_rgba(6,182,212,0.4)]' },
  emerald: { ring: 'border-emerald-500/50', bg: 'bg-emerald-500/15', text: 'text-emerald-400', hover: 'hover:bg-emerald-500/20', activeBg: 'bg-emerald-500/20', shadow: 'shadow-[0_10px_40px_-10px_rgba(16,185,129,0.4)]' },
  red:     { ring: 'border-red-500/50', bg: 'bg-red-500/15', text: 'text-red-400', hover: 'hover:bg-red-500/20', activeBg: 'bg-red-500/20', shadow: 'shadow-[0_10px_40px_-10px_rgba(239,68,68,0.4)]' },
  amber:   { ring: 'border-amber-500/50', bg: 'bg-amber-500/15', text: 'text-amber-400', hover: 'hover:bg-amber-500/20', activeBg: 'bg-amber-500/20', shadow: 'shadow-[0_10px_40px_-10px_rgba(245,158,11,0.4)]' },
};

export default function PremiumSelect({ options, value, onChange, placeholder = 'Seleccionar...', required = false, disabled = false, className = '', compact = false, accent = 'indigo', direction = 'down' }: PremiumSelectProps) {
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

  // Hidden native select for form validation
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
        className={`w-full ${compact ? 'px-2.5 py-1.5 text-xs' : 'p-3 text-sm'} bg-gradient-to-r from-slate-950 to-slate-900 border ${isOpen ? colors.ring : 'border-slate-700/80'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-600'} rounded-lg font-bold flex justify-between items-center gap-2 transition-all duration-200 group`}
      >
        <span className={selectedOption ? 'text-white' : 'text-slate-500'}>
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
          className={`absolute z-30 w-full ${direction === 'up' ? 'bottom-full mb-2' : 'mt-2'} bg-slate-900 border border-slate-700/80 rounded-xl ${colors.shadow} max-h-56 overflow-y-auto scrollbar-thin animate-in fade-in ${direction === 'up' ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'} duration-200`}
        >
          <div className="p-2 border-b border-slate-800 bg-slate-950/50 sticky top-0 z-10">
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider">{placeholder}</span>
          </div>
          {options.map(opt => (
            <div
              key={opt.value}
              className={`px-4 ${compact ? 'py-2' : 'py-2.5'} text-xs font-semibold cursor-pointer transition-all border-b border-slate-800/50 last:border-none ${opt.disabled ? 'opacity-30 cursor-not-allowed' : `${colors.hover} hover:text-white`} ${value === opt.value ? `${colors.activeBg} ${colors.text}` : 'text-slate-300'}`}
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
