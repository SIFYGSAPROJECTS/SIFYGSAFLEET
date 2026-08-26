import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Loader2, PlusCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Proveedor {
  Id_Proveedor: number;
  Nombre: string;
}

interface ProveedorComboboxProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

let globalProveedoresCache: Proveedor[] | null = null;
let globalProveedoresPromise: Promise<Proveedor[]> | null = null;

export function ProveedorCombobox({ value, onChange, className, placeholder }: ProveedorComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [filtered, setFiltered] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync value from outside
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const fetchProveedores = async () => {
      if (globalProveedoresCache) {
        setProveedores(globalProveedoresCache);
        setFiltered(globalProveedoresCache);
        setLoading(false);
        return;
      }
      
      if (!globalProveedoresPromise) {
        globalProveedoresPromise = fetch('/api/gastos/proveedores').then(r => {
          if (!r.ok) throw new Error('Error fetch');
          return r.json();
        }).then(data => {
          globalProveedoresCache = data;
          return data;
        }).catch(err => {
          globalProveedoresPromise = null;
          console.error("Cache fetch failed:", err);
          return null;
        });
      }
      
      try {
        const data = await globalProveedoresPromise;
        if (data) {
          setProveedores(data);
          setFiltered(data);
        }
      } catch (error) {
        console.error("Failed to load proveedores", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProveedores();
  }, []);

  // Filter logic
  useEffect(() => {
    if (query) {
      const q = query.toLowerCase();
      setFiltered(proveedores.filter(p => p.Nombre.toLowerCase().includes(q)));
    } else {
      setFiltered(proveedores);
    }
    
    // Auto-resize
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [query, proveedores]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(value); // revert to original value if clicked outside without selecting
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const handleSelect = (nombre: string) => {
    onChange(nombre);
    setQuery(nombre);
    setIsOpen(false);
  };

  const handleAdd = async () => {
    if (!query.trim()) return;
    
    setIsAdding(true);
    try {
      const res = await fetch('/api/gastos/proveedores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Nombre: query }),
      });
      
      if (!res.ok) throw new Error('Error al agregar proveedor');
      
      const newProv = await res.json();
      
      // Update local state
      const updatedList = [...proveedores, newProv].sort((a, b) => a.Nombre.localeCompare(b.Nombre));
      setProveedores(updatedList);
      
      toast.success(`Proveedor "${newProv.Nombre}" agregado al catálogo`);
      handleSelect(newProv.Nombre);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative group/prov">
        <textarea
          ref={inputRef}
          rows={1}
          placeholder={placeholder || "Buscar o agregar..."}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          style={{ fieldSizing: 'content' } as React.CSSProperties}
          className={className}
        />
        
        {/* Quick Add Button if not found and not empty */}
        {query && query !== value && !filtered.some(p => p.Nombre.toUpperCase() === query.trim().toUpperCase()) && (
          <button
            onClick={(e) => {
              e.preventDefault();
              handleAdd();
            }}
            disabled={isAdding}
            className="absolute right-1 top-1.5 p-1 bg-orange-100 text-orange-600 hover:bg-orange-200 rounded opacity-0 group-hover/prov:opacity-100 transition-opacity"
            title="Agregar al catálogo"
          >
            {isAdding ? <Loader2 size={14} className="animate-spin" /> : <PlusCircle size={14} />}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] max-h-60 overflow-y-auto bg-white border border-stone-200 rounded-lg shadow-xl py-1 text-sm">
          {loading ? (
            <div className="px-4 py-2 text-stone-400 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Cargando...
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((p) => (
              <button
                key={p.Id_Proveedor}
                onClick={() => handleSelect(p.Nombre)}
                className={`w-full text-left px-3 py-2 hover:bg-orange-50 flex items-center justify-between transition-colors ${
                  value === p.Nombre ? 'bg-orange-50 text-orange-700 font-medium' : 'text-stone-700'
                }`}
              >
                <span>{p.Nombre}</span>
                {value === p.Nombre && <Check size={14} className="text-orange-500" />}
              </button>
            ))
          ) : (
            <div className="px-3 py-3 text-center text-stone-500 flex flex-col items-center gap-2">
              <p>No se encontró: <strong>{query}</strong></p>
              <button
                onClick={handleAdd}
                disabled={isAdding}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 font-medium rounded-md w-full justify-center transition-colors"
              >
                {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Agregar al Catálogo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
