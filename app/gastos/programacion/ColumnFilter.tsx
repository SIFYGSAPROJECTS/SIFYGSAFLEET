import React, { useState, useRef, useEffect } from 'react';
import { Filter } from 'lucide-react';

interface ColumnFilterProps {
  columnName: string;
  options: string[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export function ColumnFilter({ columnName, options, selectedValues, onChange }: ColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clean empty strings and sort
  const validOptions = options.filter(Boolean);
  const uniqueOptions = Array.from(new Set(validOptions)).sort();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newSelected = selectedValues.includes(option)
      ? selectedValues.filter(v => v !== option)
      : [...selectedValues, option];
    onChange(newSelected);
  };

  const isFiltered = selectedValues.length > 0;

  return (
    <div className="inline-block relative ml-1" ref={containerRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`p-1 rounded transition-colors ${
          isFiltered ? 'bg-orange-100 text-orange-600' : 'text-stone-300 hover:text-white hover:bg-white/10'
        }`}
        title={`Filtrar por ${columnName}`}
      >
        <Filter size={14} className={isFiltered ? "fill-orange-600" : ""} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 left-0 z-50 bg-white shadow-xl rounded-lg border border-stone-200 min-w-[200px] max-h-[300px] flex flex-col text-sm font-normal text-stone-700">
          <div className="p-2 border-b border-stone-100 bg-stone-50 rounded-t-lg flex justify-between items-center">
            <span className="font-semibold text-stone-600">Filtrar {columnName}</span>
            {isFiltered && (
              <button 
                onClick={() => onChange([])}
                className="text-xs text-orange-600 hover:underline"
              >
                Limpiar
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto p-2 space-y-1">
            {uniqueOptions.length === 0 ? (
              <div className="text-stone-400 p-2 text-center text-xs">Sin datos</div>
            ) : (
              uniqueOptions.map((opt, i) => (
                <label key={i} className="flex items-start gap-2 p-1.5 hover:bg-orange-50 rounded cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(opt)}
                    onChange={() => toggleOption(opt)}
                    className="mt-0.5 rounded border-stone-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="break-words select-none">{opt}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
