"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Package, Plus, Search, MapPin, Box, Droplets, PenTool, Coffee, Loader2, X, LayoutGrid, List, FileText, Pencil, Trash2 } from 'lucide-react';
import Image from 'next/image';
import SystemModal from '@/components/ui/SystemModal';
import PremiumSelect from '@/components/ui/PremiumSelect';

export default function ConsumiblesClient({ currentUserEmail, edificios }: any) {
  const [consumibles, setConsumibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [showNuevo, setShowNuevo] = useState(false);
  const [nuevoForm, setNuevoForm] = useState({ Nombre: '', Tipo: 'Limpieza', Unidad_Medida: 'Piezas (pza)', Id_Edificio: '', Cantidad_Actual: 0, Capacidad_Maxima: 100, Umbral_Alerta: 10 });
  const [isSaving, setIsSaving] = useState(false);

  // Edit modal state
  const [editingConsumible, setEditingConsumible] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ 
    Nombre: '', 
    Tipo: 'Limpieza', 
    Unidad_Medida: 'Piezas (pza)', 
    Id_Edificio: '', 
    Cantidad_Actual: 0, 
    Capacidad_Maxima: 100, 
    Umbral_Alerta: 10 
  });

  const [movimientoModal, setMovimientoModal] = useState<{item: any, tipo: 'ENTRADA' | 'SALIDA'} | null>(null);
  const [movimientoForm, setMovimientoForm] = useState({ Cantidad: 0, Observaciones: '' });

  const [sysModal, setSysModal] = useState<{isOpen: boolean, type: any, title: string, message: string}>({ isOpen: false, type: 'info', title: '', message: '' });
  const [viewMode, setViewMode] = useState<'cards' | 'compact'>('cards');

  // Estado para edición directa e in-situ del número de stock
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Estado y ref para subida de fichas técnicas
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  // Control de scroll para compactar la barra sticky y dar el 75%+ de pantalla al inventario
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  
  useEffect(() => {
    fetchConsumibles();
  }, []);

  const fetchConsumibles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/edificios/consumibles');
      if (res.ok) {
        const data = await res.json();
        setConsumibles(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (actual: number, max: number) => {
    if (!max || max <= 0) return 0;
    const p = (actual / max) * 100;
    return p > 100 ? 100 : p;
  };

  const getStatusColor = (actual: number, max: number, alert: number) => {
    if (actual <= alert) return 'bg-red-500';
    const p = getPercentage(actual, max);
    if (p <= 30) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const filteredConsumibles = consumibles.filter(c => 
    c.Nombre.toLowerCase().includes(search.toLowerCase()) || 
    c.Tipo.toLowerCase().includes(search.toLowerCase())
  );

  const groupedConsumibles = filteredConsumibles.reduce((acc: any, item: any) => {
    const branch = item.edificio?.Sucursal || 'Sin Asignar';
    if (!acc[branch]) acc[branch] = [];
    acc[branch].push(item);
    return acc;
  }, {});

  const handleSaveNuevo = async () => {
    if (!nuevoForm.Nombre || !nuevoForm.Id_Edificio) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'Faltan campos obligatorios (Nombre y Sucursal).' });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/edificios/consumibles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoForm)
      });
      if (res.ok) {
        setSysModal({ isOpen: true, type: 'success', title: 'Éxito', message: 'Consumible agregado correctamente.' });
        setShowNuevo(false);
        setNuevoForm({ Nombre: '', Tipo: 'Limpieza', Unidad_Medida: 'Piezas (pza)', Id_Edificio: '', Cantidad_Actual: 0, Capacidad_Maxima: 100, Umbral_Alerta: 10 });
        fetchConsumibles();
      } else {
        const err = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error', message: err.error || 'No se pudo agregar.' });
      }
    } catch (e) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'Error de red.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (item: any) => {
    setEditingConsumible(item);
    setEditForm({
      Nombre: item.Nombre || '',
      Tipo: item.Tipo || 'Limpieza',
      Unidad_Medida: item.Unidad_Medida || 'Piezas (pza)',
      Id_Edificio: item.Id_Edificio?.toString() || '',
      Cantidad_Actual: item.Cantidad_Actual ?? 0,
      Capacidad_Maxima: item.Capacidad_Maxima ?? 100,
      Umbral_Alerta: item.Umbral_Alerta ?? 10
    });
  };

  const handleSaveEdit = async () => {
    if (!editingConsumible || !editForm.Nombre.trim() || !editForm.Id_Edificio) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'Nombre y Sucursal son obligatorios.' });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/edificios/consumibles/${editingConsumible.Id_Consumible}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setSysModal({ isOpen: true, type: 'success', title: 'Éxito', message: 'Consumible actualizado correctamente en la base de datos.' });
        setEditingConsumible(null);
        fetchConsumibles();
      } else {
        const err = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error', message: err.error || 'No se pudo actualizar.' });
      }
    } catch (e) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'Error de conexión con el servidor.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConsumible = async () => {
    if (!editingConsumible) return;
    if (!confirm(`¿Estás seguro de eliminar el consumible "${editingConsumible.Nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/edificios/consumibles/${editingConsumible.Id_Consumible}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSysModal({ isOpen: true, type: 'success', title: 'Eliminado', message: 'Consumible eliminado correctamente de la base de datos.' });
        setEditingConsumible(null);
        fetchConsumibles();
      } else {
        const err = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error', message: err.error || 'No se pudo eliminar.' });
      }
    } catch (e) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'Error de red.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMovimiento = async () => {
    if (!movimientoModal || movimientoForm.Cantidad <= 0) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'Ingresa una cantidad válida mayor a 0.' });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/edificios/consumibles/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Id_Consumible: movimientoModal.item.Id_Consumible,
          Tipo_Movimiento: movimientoModal.tipo,
          Cantidad: movimientoForm.Cantidad,
          Observaciones: movimientoForm.Observaciones
        })
      });
      if (res.ok) {
        setSysModal({ isOpen: true, type: 'success', title: 'Éxito', message: 'Movimiento registrado correctamente.' });
        setMovimientoModal(null);
        setMovimientoForm({ Cantidad: 0, Observaciones: '' });
        fetchConsumibles();
      } else {
        const err = await res.json();
        setSysModal({ isOpen: true, type: 'error', title: 'Error', message: err.error || 'No se pudo registrar el movimiento.' });
      }
    } catch (e) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'Error de red.' });
    } finally {
      setIsSaving(false);
    }
  };

  const triggerFileUpload = (id: number) => {
    setUploadingId(id);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFichaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingId === null) return;
    
    // Validar tipo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'Solo se permiten archivos PDF o imágenes (JPG, PNG, WEBP).' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadingId(null);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Subir archivo
      const uploadRes = await fetch('/api/edificios/consumibles/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) throw new Error('Error al subir el archivo');
      const { url } = await uploadRes.json();

      // 2. Actualizar consumible
      const patchRes = await fetch(`/api/edificios/consumibles/${uploadingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Ruta_Ficha_Tecnica: url })
      });

      if (!patchRes.ok) throw new Error('Error al enlazar el archivo al consumible');
      
      setSysModal({ isOpen: true, type: 'success', title: 'Ficha Técnica Subida', message: 'El documento se subió correctamente.' });
      fetchConsumibles();
    } catch (err) {
      console.error(err);
      setSysModal({ isOpen: true, type: 'error', title: 'Error', message: 'Ocurrió un error en la subida. Revisa los logs.' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadingId(null);
    }
  };

  // Ajuste ultra-rápido a 1 clic para inventariado sin abrir modales
  const handleQuickAdjust = async (item: any, delta: number) => {
    const nuevaCantidad = Math.max(0, item.Cantidad_Actual + delta);
    
    // Actualización optimista inmediata en local
    setConsumibles(prev => prev.map(c => 
      c.Id_Consumible === item.Id_Consumible ? { ...c, Cantidad_Actual: nuevaCantidad } : c
    ));

    try {
      await fetch('/api/edificios/consumibles/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Id_Consumible: item.Id_Consumible,
          Tipo_Movimiento: delta > 0 ? 'ENTRADA' : 'SALIDA',
          Cantidad: Math.abs(delta),
          Observaciones: 'Ajuste rápido de inventario'
        })
      });
    } catch (e) {
      console.error('Error en ajuste rápido:', e);
    }
  };

  // Conteo directo tecleando la cifra exacta sobre la celda
  const handleDirectQuantitySubmit = async (item: any) => {
    if (editingId !== item.Id_Consumible) return;
    const targetQty = parseFloat(editingValue);
    setEditingId(null);
    
    if (isNaN(targetQty) || targetQty < 0 || targetQty === item.Cantidad_Actual) {
      return;
    }

    const delta = targetQty - item.Cantidad_Actual;
    
    // Actualización optimista inmediata
    setConsumibles(prev => prev.map(c => 
      c.Id_Consumible === item.Id_Consumible ? { ...c, Cantidad_Actual: targetQty } : c
    ));

    try {
      await fetch('/api/edificios/consumibles/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Id_Consumible: item.Id_Consumible,
          Tipo_Movimiento: delta > 0 ? 'ENTRADA' : 'SALIDA',
          Cantidad: Math.abs(delta),
          Observaciones: 'Conteo directo in situ en inventario'
        })
      });
    } catch (e) {
      console.error('Error en conteo directo:', e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
        <Loader2 size={48} className="mb-4 text-amber-500 animate-spin" />
        <h3 className="text-xl font-bold">Cargando consumibles...</h3>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Top Action Bar - Sticky y Ultra-Compacta al scrollear para liberar 75%+ de pantalla */}
      <div 
        className={`sticky top-[72px] z-30 transition-all duration-200 bg-[var(--bg-floating)]/95 backdrop-blur-xl border border-[var(--border-cream)] rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 ${
          scrolled ? 'py-2 px-3 sm:px-5 border-amber-500/30 shadow-2xl' : 'p-4'
        }`}
      >
        <div className="flex items-center gap-2 shrink-0">
          <div className={`rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center transition-all ${
            scrolled ? 'p-1.5' : 'p-2'
          }`}>
            <Package size={scrolled ? 18 : 22} />
          </div>
          <div className="flex items-center gap-2">
            <h2 className={`font-bold text-[var(--text-main)] tracking-tight transition-all ${
              scrolled ? 'text-sm sm:text-base' : 'text-xl'
            }`}>
              {scrolled ? 'Consumibles' : 'Inventario de Consumibles'}
            </h2>
            {filteredConsumibles.length > 0 && (
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {filteredConsumibles.length} items
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center w-full md:w-auto">
          {/* Switcher de Vista */}
          <div className="flex bg-[var(--bg-screen)] border border-[var(--border-cream)] p-0.5 rounded-xl shadow-sm self-start sm:self-auto">
            <button
              onClick={() => setViewMode('cards')}
              title="Vista de Tarjetas"
              className={`rounded-lg transition-all ${scrolled ? 'p-1' : 'p-1.5'} ${
                viewMode === 'cards' 
                  ? 'bg-amber-500 text-[#0F1115] shadow-sm font-bold' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <LayoutGrid size={scrolled ? 15 : 18} />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              title="Vista Compacta (Inventariado Rápido)"
              className={`rounded-lg transition-all ${scrolled ? 'p-1' : 'p-1.5'} ${
                viewMode === 'compact' 
                  ? 'bg-amber-500 text-[#0F1115] shadow-sm font-bold' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <List size={scrolled ? 15 : 18} />
            </button>
          </div>

          <div className="relative flex items-center flex-1 sm:w-64">
            <Search size={scrolled ? 14 : 16} className="absolute left-3 text-amber-500 font-bold pointer-events-none" />
            <input 
              type="text" 
              placeholder={scrolled ? "Buscar..." : "Buscar consumibles..."} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-8 bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-[var(--text-main)] placeholder:text-[var(--text-muted)] font-medium shadow-sm transition-all ${
                scrolled ? 'h-8 text-xs' : 'h-10 text-sm'
              }`}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <X size={13} />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowNuevo(true)}
            className={`flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 text-[#0F1115] font-bold hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] whitespace-nowrap shrink-0 ${
              scrolled ? 'h-8 text-xs px-3.5' : 'h-10 text-sm px-5'
            }`}
          >
            <Plus size={scrolled ? 14 : 16} /> Nuevo Consumible
          </button>
        </div>
      </div>

      {viewMode === 'cards' && (
        <div className="flex flex-col gap-8 pb-24 w-full">
          {Object.entries(groupedConsumibles).map(([sucursal, items]: [string, any]) => (
            <div key={sucursal}>
              <h3 className="text-lg font-bold text-[var(--text-main)] mb-4 flex items-center gap-2 border-b border-[var(--border-cream)] pb-2">
                <MapPin className="text-amber-500" size={20} /> {sucursal}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item: any) => {
                  const pct = getPercentage(item.Cantidad_Actual, item.Capacidad_Maxima);
                  const color = getStatusColor(item.Cantidad_Actual, item.Capacidad_Maxima, item.Umbral_Alerta);
                  
                  let IconType = Package;
                  if (item.Tipo === 'Limpieza') IconType = Droplets;
                  if (item.Tipo === 'Papelería') IconType = PenTool;
                  if (item.Tipo === 'Cafetería') IconType = Coffee;

                  return (
                    <div key={item.Id_Consumible} className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[235px] relative overflow-hidden group">
                      {item.Cantidad_Actual <= item.Umbral_Alerta && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
                      )}
                      
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex gap-3 items-center min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-[var(--bg-screen)] border border-[var(--border-cream)] flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                            <IconType size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-bold text-[var(--text-main)] text-sm line-clamp-2 leading-tight h-9 flex items-center" title={item.Nombre}>
                              {item.Nombre}
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1 truncate">
                              <span className="text-[9px] uppercase font-bold tracking-wider">{item.Tipo}</span>
                            </p>
                          </div>
                        </div>
                        {/* Acciones de Tarjeta */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Botón Editar */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-screen)] text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10 border border-[var(--border-cream)] hover:border-amber-500/30 transition-all shadow-sm"
                            title="Editar consumible"
                          >
                            <Pencil size={14} />
                          </button>

                          {/* Indicador Ficha Técnica */}
                          <div 
                            onClick={() => {
                              if (item.Ruta_Ficha_Tecnica) {
                                window.open(item.Ruta_Ficha_Tecnica, '_blank');
                              } else {
                                triggerFileUpload(item.Id_Consumible);
                              }
                            }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border transition-all cursor-pointer ${
                              uploadingId === item.Id_Consumible ? 'bg-amber-500/20 text-amber-500 border-amber-500 animate-pulse' :
                              item.Ruta_Ficha_Tecnica 
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20' 
                                : 'bg-stone-500/10 text-stone-400 border-stone-500/20 border-dashed hover:bg-stone-500/20 hover:text-white'
                            }`}
                            title={item.Ruta_Ficha_Tecnica ? 'Ver Ficha Técnica' : 'Subir Ficha Técnica'}
                          >
                            {uploadingId === item.Id_Consumible ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                          </div>
                        </div>
                      </div>

                      <div className="my-3">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-[var(--text-muted)] font-medium">Stock Actual:</span>
                          <span className="font-black text-[var(--text-main)]">{item.Cantidad_Actual} <span className="text-xs font-semibold text-[var(--text-muted)]">{item.Unidad_Medida}</span></span>
                        </div>
                        
                        <div className="w-full bg-stone-300/50 dark:bg-black/40 rounded-full h-2.5 overflow-hidden border border-[var(--border-cream)]">
                          <div className={`h-2.5 rounded-full transition-all duration-1000 ${color}`} style={{ width: `${pct}%` }}></div>
                        </div>
                        
                        <div className="flex justify-between mt-2 text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">
                          <span>Alerta: {item.Umbral_Alerta}</span>
                          <span>Max: {item.Capacidad_Maxima}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--border-cream)] mt-auto">
                        <button 
                          onClick={() => setMovimientoModal({ item, tipo: 'SALIDA' })}
                          className="py-2 flex items-center justify-center gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-bold transition-colors"
                        >
                          - Salida
                        </button>
                        <button 
                          onClick={() => setMovimientoModal({ item, tipo: 'ENTRADA' })}
                          className="py-2 flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-xs font-bold transition-colors"
                        >
                          + Entrada
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredConsumibles.length === 0 && !loading && (
            <div className="py-12 text-center text-[var(--text-muted)]">
              No hay consumibles registrados.
            </div>
          )}
        </div>
      )}

      {viewMode === 'compact' && (
        <div className="flex flex-col gap-6 pb-24 w-full">
          {Object.entries(groupedConsumibles).map(([sucursal, items]: [string, any]) => (
            <div key={sucursal} className="flex flex-col gap-2.5">
              <h3 className="text-sm font-bold text-[var(--text-main)] mb-1 flex items-center gap-2 border-b border-[var(--border-cream)] pb-1.5">
                <MapPin className="text-amber-500" size={16} /> {sucursal}
              </h3>
              {items.map((item: any) => {
                let IconType = Package;
                if (item.Tipo === 'Limpieza') IconType = Droplets;
                if (item.Tipo === 'Papelería') IconType = PenTool;
                if (item.Tipo === 'Cafetería') IconType = Coffee;

                const isLowStock = item.Cantidad_Actual <= item.Umbral_Alerta;

                return (
                  <div 
                    key={item.Id_Consumible}
                    className={`bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl p-3 shadow-md flex items-center justify-between gap-3 transition-all ${
                      isLowStock ? 'border-l-4 border-l-red-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-screen)] border border-[var(--border-cream)] flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                        <IconType size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[var(--text-main)] truncate" title={item.Nombre}>{item.Nombre}</h4>
                          {isLowStock && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
                              Bajo Stock
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] truncate flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-amber-600 dark:text-amber-400">{item.Unidad_Medida}</span>
                        </p>
                      </div>
                      
                      {/* Botón Editar Compacto */}
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-screen)] text-[var(--text-muted)] hover:text-amber-500 hover:bg-amber-500/10 border border-[var(--border-cream)] hover:border-amber-500/30 transition-all shadow-sm shrink-0 mr-1"
                        title="Editar consumible"
                      >
                        <Pencil size={14} />
                      </button>

                      {/* Indicador Ficha Técnica */}
                      <div 
                        onClick={() => {
                          if (item.Ruta_Ficha_Tecnica) {
                            window.open(item.Ruta_Ficha_Tecnica, '_blank');
                          } else {
                            triggerFileUpload(item.Id_Consumible);
                          }
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm border mr-1 transition-all cursor-pointer ${
                          uploadingId === item.Id_Consumible ? 'bg-amber-500/20 text-amber-500 border-amber-500 animate-pulse' :
                          item.Ruta_Ficha_Tecnica 
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20' 
                            : 'bg-stone-500/10 text-stone-400 border-stone-500/20 border-dashed hover:bg-stone-500/20 hover:text-white'
                        }`}
                        title={item.Ruta_Ficha_Tecnica ? 'Ver Ficha Técnica' : 'Subir Ficha Técnica'}
                      >
                        {uploadingId === item.Id_Consumible ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 bg-[var(--bg-screen)] border border-[var(--border-cream)] p-1 rounded-xl shadow-inner">
                      <button 
                        onClick={() => handleQuickAdjust(item, -1)}
                        className="w-9 h-9 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black text-lg flex items-center justify-center active:scale-90 transition-all shadow-sm"
                        title="Restar 1 unidad"
                      >
                        -
                      </button>

                      <div className="w-14 text-center">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={editingId === item.Id_Consumible ? editingValue : item.Cantidad_Actual}
                          onFocus={() => {
                            setEditingId(item.Id_Consumible);
                            setEditingValue(item.Cantidad_Actual.toString());
                          }}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleDirectQuantitySubmit(item)}
                          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                          className="w-full text-center font-black text-base text-[var(--text-main)] bg-transparent hover:bg-[var(--bg-hover)] focus:bg-[var(--bg-hover)] rounded-lg outline-none focus:ring-2 focus:ring-amber-500/50 py-0.5 transition-all cursor-pointer focus:cursor-text"
                          title="Toca para editar la cantidad directamente"
                        />
                      </div>

                      <button 
                        onClick={() => handleQuickAdjust(item, 1)}
                        className="w-9 h-9 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 font-black text-lg flex items-center justify-center active:scale-90 transition-all shadow-sm"
                        title="Sumar 1 unidad"
                      >
                        +
                      </button>

                      <button
                        onClick={() => setMovimientoModal({ item, tipo: 'ENTRADA' })}
                        title="Registrar cantidad específica"
                        className="ml-1 px-2 py-1 bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-white rounded-lg text-xs font-bold transition-colors hidden sm:block"
                      >
                        +Lote
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {filteredConsumibles.length === 0 && !loading && (
            <div className="py-12 text-center text-[var(--text-muted)]">
              No hay consumibles registrados.
            </div>
          )}
        </div>
      )}

      {/* Modal Nuevo Consumible */}
      {showNuevo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden">
            <div className="p-5 border-b border-[var(--border-cream)] flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
                <Package size={20} /> Nuevo Consumible
              </h2>
              <button onClick={() => setShowNuevo(false)} className="p-2 bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-white rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Nombre del Producto *</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                  <input 
                    type="text" 
                    value={nuevoForm.Nombre}
                    onChange={(e) => setNuevoForm({...nuevoForm, Nombre: e.target.value})}
                    className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-amber-500 outline-none transition-colors"
                    placeholder="Ej. Papel Higiénico Pétalo"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Tipo</label>
                  <PremiumSelect
                    value={nuevoForm.Tipo}
                    onChange={(val) => setNuevoForm({...nuevoForm, Tipo: val})}
                    options={[
                      {value: 'Limpieza', label: 'Limpieza'},
                      {value: 'Papelería', label: 'Papelería'},
                      {value: 'Cafetería', label: 'Cafetería'},
                      {value: 'Otros', label: 'Otros'}
                    ]}
                    accent="amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Sucursal / Oficina</label>
                  <PremiumSelect
                    value={nuevoForm.Id_Edificio}
                    onChange={(val) => setNuevoForm({...nuevoForm, Id_Edificio: val})}
                    options={edificios.map((e: any) => ({ value: e.Id_Edificio.toString(), label: e.Sucursal }))}
                    placeholder="Seleccionar..."
                    accent="amber"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Unidad de Medida</label>
                  <PremiumSelect
                    value={nuevoForm.Unidad_Medida}
                    onChange={(val) => setNuevoForm({...nuevoForm, Unidad_Medida: val})}
                    options={[
                      {value: 'Piezas (pza)', label: 'Piezas (pza)'},
                      {value: 'Litros (L)', label: 'Litros (L)'},
                      {value: 'Mililitros (ml)', label: 'Mililitros (ml)'},
                      {value: 'Kilogramos (kg)', label: 'Kilogramos (kg)'},
                      {value: 'Gramos (g)', label: 'Gramos (g)'},
                      {value: 'Metros (m)', label: 'Metros (m)'},
                      {value: 'Galones (gal)', label: 'Galones (gal)'},
                      {value: 'Cajas (cj)', label: 'Cajas (cj)'},
                      {value: 'Paquetes (pqt)', label: 'Paquetes (pqt)'},
                      {value: 'Rollos (rlo)', label: 'Rollos (rlo)'},
                      {value: 'Bidones (bdn)', label: 'Bidones / Garrafones'},
                      {value: 'Cubetas (cbt)', label: 'Cubetas'}
                    ]}
                    accent="amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Stock Inicial</label>
                  <input 
                    type="number" 
                    min="0"
                    value={nuevoForm.Cantidad_Actual}
                    onChange={(e) => setNuevoForm({...nuevoForm, Cantidad_Actual: parseFloat(e.target.value) || 0})}
                    className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-main)] focus:border-amber-500 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Capacidad Max (Para barra)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={nuevoForm.Capacidad_Maxima}
                    onChange={(e) => setNuevoForm({...nuevoForm, Capacidad_Maxima: parseFloat(e.target.value) || 0})}
                    className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-main)] focus:border-amber-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Alerta Mínima</label>
                  <input 
                    type="number" 
                    min="0"
                    value={nuevoForm.Umbral_Alerta}
                    onChange={(e) => setNuevoForm({...nuevoForm, Umbral_Alerta: parseFloat(e.target.value) || 0})}
                    className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-main)] focus:border-amber-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Ficha Técnica Subida de Archivos (Preparación) */}
              <div className="mt-2 border-t border-[var(--border-cream)] pt-4">
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Ficha Técnica (Próximamente)</label>
                <div className="w-full border-2 border-dashed border-[var(--border-cream)] rounded-xl p-4 flex flex-col items-center justify-center text-[var(--text-muted)] bg-[var(--bg-screen)] hover:bg-[var(--bg-hover)] transition-colors cursor-not-allowed opacity-60">
                  <FileText size={24} className="mb-2" />
                  <span className="text-sm font-semibold">Subir documento PDF (En desarrollo)</span>
                  <span className="text-xs">Este espacio estará listo para fichas técnicas o facturas</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[var(--border-cream)] flex justify-end gap-3 bg-[var(--bg-screen)]">
              <button 
                onClick={() => setShowNuevo(false)}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--bg-hover)] hover:bg-white text-[var(--text-main)] shadow-md transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveNuevo}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-amber-500 text-[#0F1115] hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50"
              >
                {isSaving ? 'Guardando...' : 'Guardar Consumible'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Consumible */}
      {editingConsumible && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden">
            <div className="p-5 border-b border-[var(--border-cream)] flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-xl font-bold text-amber-500 flex items-center gap-2">
                <Pencil size={20} /> Editar Consumible
              </h2>
              <button onClick={() => setEditingConsumible(null)} className="p-2 bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-white rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Nombre del Producto *</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                  <input 
                    type="text" 
                    value={editForm.Nombre}
                    onChange={(e) => setEditForm({...editForm, Nombre: e.target.value})}
                    className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-amber-500 outline-none transition-colors"
                    placeholder="Ej. Papel Higiénico"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Tipo / Categoría</label>
                  <PremiumSelect
                    value={editForm.Tipo}
                    onChange={(val) => setEditForm({...editForm, Tipo: val})}
                    options={[
                      {value: 'Limpieza', label: 'Limpieza'},
                      {value: 'Limpieza y Despensa', label: 'Limpieza y Despensa'},
                      {value: 'Papelería', label: 'Papelería'},
                      {value: 'Cafetería', label: 'Cafetería'},
                      {value: 'Botiquín / Seguridad', label: 'Botiquín / Seguridad'},
                      {value: 'Otros', label: 'Otros'}
                    ]}
                    accent="amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">Sucursal / Oficina</label>
                  <PremiumSelect
                    value={editForm.Id_Edificio}
                    onChange={(val) => setEditForm({...editForm, Id_Edificio: val})}
                    options={edificios.map((e: any) => ({ value: e.Id_Edificio.toString(), label: e.Sucursal }))}
                    placeholder="Seleccionar..."
                    accent="amber"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Unidad de Medida</label>
                  <PremiumSelect
                    value={editForm.Unidad_Medida}
                    onChange={(val) => setEditForm({...editForm, Unidad_Medida: val})}
                    options={[
                      {value: 'Piezas (pza)', label: 'Piezas (pza)'},
                      {value: 'Litros (L)', label: 'Litros (L)'},
                      {value: 'Mililitros (ml)', label: 'Mililitros (ml)'},
                      {value: 'Kilogramos (kg)', label: 'Kilogramos (kg)'},
                      {value: 'Gramos (g)', label: 'Gramos (g)'},
                      {value: 'Metros (m)', label: 'Metros (m)'},
                      {value: 'Galones (gal)', label: 'Galones (gal)'},
                      {value: 'Cajas (cj)', label: 'Cajas (cj)'},
                      {value: 'Paquetes (pqt)', label: 'Paquetes (pqt)'},
                      {value: 'Rollos (rlo)', label: 'Rollos (rlo)'},
                      {value: 'Bidones (bdn)', label: 'Bidones / Garrafones'},
                      {value: 'Cubetas (cbt)', label: 'Cubetas'}
                    ]}
                    accent="amber"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Stock Actual (Unidades)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="any"
                    value={editForm.Cantidad_Actual}
                    onChange={(e) => setEditForm({...editForm, Cantidad_Actual: parseFloat(e.target.value) || 0})}
                    className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-main)] focus:border-amber-500 outline-none transition-colors font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Capacidad Max (Para barra)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={editForm.Capacidad_Maxima}
                    onChange={(e) => setEditForm({...editForm, Capacidad_Maxima: parseFloat(e.target.value) || 0})}
                    className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-main)] focus:border-amber-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Alerta Mínima (Bajo Stock)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={editForm.Umbral_Alerta}
                    onChange={(e) => setEditForm({...editForm, Umbral_Alerta: parseFloat(e.target.value) || 0})}
                    className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-main)] focus:border-amber-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Ficha Técnica / Documento */}
              <div className="border-t border-[var(--border-cream)] pt-4">
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Ficha Técnica / Documento</label>
                {editingConsumible.Ruta_Ficha_Tecnica ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={18} className="shrink-0" />
                      <span className="text-xs font-medium truncate">Documento vinculado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.open(editingConsumible.Ruta_Ficha_Tecnica, '_blank')}
                        className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-xs font-bold text-blue-300 transition-colors"
                      >
                        Ver Documento
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerFileUpload(editingConsumible.Id_Consumible)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-xs font-bold text-amber-400 transition-colors"
                      >
                        Reemplazar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => triggerFileUpload(editingConsumible.Id_Consumible)}
                    className="w-full border-2 border-dashed border-[var(--border-cream)] hover:border-amber-500/50 rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-amber-500 bg-[var(--bg-screen)] hover:bg-[var(--bg-hover)] transition-all"
                  >
                    <FileText size={16} /> Subir Ficha Técnica (PDF o Imagen)
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-[var(--border-cream)] flex justify-between items-center gap-3 bg-[var(--bg-screen)]">
              <button 
                type="button"
                onClick={handleDeleteConsumible}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors disabled:opacity-50"
              >
                <Trash2 size={15} /> Eliminar
              </button>

              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingConsumible(null)}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--bg-hover)] hover:bg-white text-[var(--text-main)] shadow-md transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-amber-500 text-[#0F1115] hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Movimiento */}
      {movimientoModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
            <div className="p-5 border-b border-[var(--border-cream)] flex justify-between items-center bg-white/[0.02]">
              <h2 className={`text-lg font-bold flex items-center gap-2 ${movimientoModal.tipo === 'ENTRADA' ? 'text-emerald-500' : 'text-red-500'}`}>
                {movimientoModal.tipo === 'ENTRADA' ? 'Registrar Entrada' : 'Registrar Salida / Consumo'}
              </h2>
              <button onClick={() => setMovimientoModal(null)} className="p-2 bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-white rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div className="text-center p-3 rounded-xl bg-[var(--bg-screen)] border border-[var(--border-cream)]">
                <h3 className="font-bold text-[var(--text-main)] text-lg">{movimientoModal.item.Nombre}</h3>
                <p className="text-sm text-[var(--text-muted)]">Stock Actual: {movimientoModal.item.Cantidad_Actual} {movimientoModal.item.Unidad_Medida}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Cantidad ({movimientoModal.item.Unidad_Medida})</label>
                <input 
                  type="number" 
                  min="0.1"
                  step="0.1"
                  value={movimientoForm.Cantidad || ''}
                  onChange={(e) => setMovimientoForm({...movimientoForm, Cantidad: parseFloat(e.target.value) || 0})}
                  className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-3 px-4 text-[var(--text-main)] text-xl font-black text-center focus:border-amber-500 outline-none transition-colors placeholder:text-[var(--text-muted)]"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2">Observaciones (Opcional)</label>
                <input 
                  type="text" 
                  value={movimientoForm.Observaciones}
                  onChange={(e) => setMovimientoForm({...movimientoForm, Observaciones: e.target.value})}
                  className="w-full bg-[var(--bg-screen)] border border-[var(--border-cream)] rounded-xl py-2.5 px-4 text-sm text-[var(--text-main)] focus:border-amber-500 outline-none transition-colors placeholder:text-[var(--text-muted)]"
                  placeholder="Ej. Factura #123 o 'Para limpieza'"
                />
              </div>
            </div>

            <div className="p-5 border-t border-[var(--border-cream)] flex justify-end gap-3 bg-[var(--bg-screen)]">
              <button 
                onClick={() => setMovimientoModal(null)}
                className="px-5 py-2 rounded-xl text-sm font-bold bg-[var(--bg-hover)] hover:bg-white text-[var(--text-main)] shadow-md transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveMovimiento}
                disabled={isSaving}
                className={`px-6 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-lg disabled:opacity-50 ${
                  movimientoModal.tipo === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                }`}
              >
                {isSaving ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Modal */}
      <SystemModal
        isOpen={sysModal.isOpen}
        type={sysModal.type}
        title={sysModal.title}
        message={sysModal.message}
        onConfirm={() => setSysModal({ ...sysModal, isOpen: false })}
      />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf,image/jpeg,image/png,image/webp"
        onChange={handleFichaUpload}
      />
    </div>
  );
}
