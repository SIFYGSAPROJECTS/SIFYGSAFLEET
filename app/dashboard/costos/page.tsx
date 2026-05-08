'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { DollarSign, Search, Filter, Plus, Calendar, Wrench, Building2, Car, TrendingUp, TrendingDown, Receipt, UploadCloud, ArrowLeft, User, FileText } from 'lucide-react';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import PremiumSelect from '@/components/ui/PremiumSelect';

interface Costo {
  Id_Costo: number;
  Fecha: string;
  Servicio: string;
  Consecutivo: string;
  Costo_MO: number;
  Costo_Refacciones: number;
  Total: number;
  Proveedor: string;
  Empresa: string;
  Tipo_Mtto: string;
  Factura_CDG: string | null;
  auto?: {
    Placa: string;
    Marca: string;
    Modelo: string;
  };
}

export default function CostosPage() {
  const [costos, setCostos] = useState<Costo[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Filtros
  const [empresaFiltro, setEmpresaFiltro] = useState('');
  const [unidadFiltro, setUnidadFiltro] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Costo>>({
    Fecha: new Date().toISOString().split('T')[0],
    Servicio: '',
    Consecutivo: '',
    Costo_MO: 0,
    Costo_Refacciones: 0,
    Proveedor: '',
    Empresa: '',
    Tipo_Mtto: 'Preventivo',
    Factura_CDG: ''
  });

  const fetchCostos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/costos');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCostos(data);
      }
    } catch (error) {
      console.error('Error al cargar costos', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostos();
    // Obtener catálogo maestro de vehículos para los filtros inteligentes
    fetch('/api/vehiculos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVehiculos(data);
      })
      .catch(console.error);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await fetch('/api/costos/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      //comentario
      if (res.ok) {
        alert(`¡Importación exitosa! Se procesaron ${data.procesados} registros. (${data.errores} errores)`);
        fetchCostos(); // Recargar datos
      } else {
        alert(data.error || 'Error al importar el archivo Excel.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red al importar el archivo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Limpiar input
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'Costo_MO' || name === 'Costo_Refacciones' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/costos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          Fecha: new Date().toISOString().split('T')[0],
          Servicio: '',
          Consecutivo: '',
          Costo_MO: 0,
          Costo_Refacciones: 0,
          Proveedor: '',
          Empresa: '',
          Tipo_Mtto: 'Preventivo',
          Factura_CDG: ''
        });
        fetchCostos();
      } else {
        alert('Error al guardar el costo');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Filtrado y cálculos
  const filteredCostos = useMemo(() => {
    return costos.filter(c => {
      // Si el filtro es un prefijo (como AVH), verificamos si el Consecutivo o Empresa lo incluyen
      const matchEmpresa = empresaFiltro ? (c.Empresa.toLowerCase().includes(empresaFiltro.toLowerCase()) || c.Consecutivo.toLowerCase().startsWith(empresaFiltro.toLowerCase() + '-')) : true;
      const matchUnidad = unidadFiltro ? c.Consecutivo.toLowerCase() === unidadFiltro.toLowerCase() : true;
      return matchEmpresa && matchUnidad;
    });
  }, [costos, empresaFiltro, unidadFiltro]);

  const totalGasto = useMemo(() => filteredCostos.reduce((acc, curr) => acc + curr.Total, 0), [filteredCostos]);
  const totalMO = useMemo(() => filteredCostos.reduce((acc, curr) => acc + curr.Costo_MO, 0), [filteredCostos]);
  const totalRefacciones = useMemo(() => filteredCostos.reduce((acc, curr) => acc + curr.Costo_Refacciones, 0), [filteredCostos]);

  // Total real de tickets de servicio generados en plataforma
  const totalTicketsServicio = useMemo(() => {
    return vehiculos.filter(v => {
      const matchEmpresa = empresaFiltro ? v.Consecutivo.toLowerCase().startsWith(empresaFiltro.toLowerCase() + '-') : true;
      const matchUnidad = unidadFiltro ? v.Consecutivo.toLowerCase() === unidadFiltro.toLowerCase() : true;
      return matchEmpresa && matchUnidad;
    }).reduce((acc, curr) => acc + (curr.Total_Servicios || 0), 0);
  }, [vehiculos, empresaFiltro, unidadFiltro]);
  
  // Extraer valores únicos para datalists/selects (Filtros Inteligentes Master)
  const empresasMaestras = Array.from(new Set(vehiculos.map(v => v.Consecutivo?.split('-')[0]))).filter(Boolean).sort() as string[];

  // Datos para Gráficas
  const datosPorEmpresa = useMemo(() => {
    // Inicializar todas con 0 para que siempre aparezcan en la gráfica
    const agrupado = empresasMaestras.reduce((acc, emp) => {
      acc[emp] = 0;
      return acc;
    }, {} as Record<string, number>);

    filteredCostos.forEach((curr) => {
      const prefijo = curr.Consecutivo?.split('-')[0] || 'Otros';
      if (empresasMaestras.includes(prefijo)) {
        agrupado[prefijo] += curr.Total;
      } else {
        agrupado[prefijo] = (agrupado[prefijo] || 0) + curr.Total;
      }
    });

    return Object.entries(agrupado)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredCostos, empresasMaestras]);

  const datosPorMes = useMemo(() => {
    const agrupado = filteredCostos.reduce((acc, curr) => {
      const fecha = new Date(curr.Fecha);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      acc[mes] = (acc[mes] || 0) + curr.Total;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(agrupado).map(([mes, Total]) => ({ mes, Total })).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [filteredCostos]);

  const unidadesMaestras = useMemo(() => {
    return vehiculos
      .filter(v => !empresaFiltro ? true : v.Consecutivo?.startsWith(empresaFiltro + '-'))
      .map(v => v.Consecutivo)
      .sort();
  }, [vehiculos, empresaFiltro]);

  const formatoMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
  };

  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* ENCABEZADO Y NAVEGACIÓN */}
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5 mb-2">
          <div className="flex-1 flex flex-col items-start w-full text-left">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[#71717a] transition-colors mb-3 font-medium text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver al Panel Maestro
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-main)] flex items-center gap-3 font-serif">
              <DollarSign className="text-[#71717a] shrink-0" size={32} /> Control de Costos
            </h1>
            <p className="text-[var(--text-muted)] mt-2 font-medium text-sm sm:text-base">
              Gestión y análisis de gastos de mantenimiento por unidad y empresa.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4 w-full lg:w-auto">
            <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide pb-3">
              <div className="flex w-full justify-start sm:justify-center lg:justify-end min-w-max px-1">
                <div className="inline-flex items-center bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-full p-1.5 shadow-lg shrink-0 gap-1">
                  <Link href="/dashboard/usuarios" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <User size={14} /> Usuarios
                  </Link>
                  <Link href="/dashboard/inventario" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <Car size={14} /> Flota
                  </Link>
                  <Link href="/dashboard/servicios" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <Wrench size={14} /> Servicios
                  </Link>
                  <Link href="/dashboard/checklists" className="px-4 py-1.5 text-xs font-bold rounded-full text-[var(--text-muted)] hover:text-cyan-600 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2 whitespace-nowrap">
                    <FileText size={14} /> Checklists
                  </Link>
                  <div className="px-4 py-1.5 text-xs font-bold rounded-full bg-white text-[var(--text-main)] cursor-default flex items-center gap-2 shadow-sm border border-[var(--border-cream)] whitespace-nowrap">
                    <DollarSign size={14} className="text-[#71717a]" /> Costos
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 w-full border-b border-[var(--border-cream)] pb-6">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-white border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] px-5 py-2.5 rounded-full font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 text-sm"
          >
            <UploadCloud size={16} className={isUploading ? "animate-bounce" : ""} />
            {isUploading ? 'Importando...' : 'Importar Excel'}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#27272a] hover:bg-black text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:shadow-xl transition-all flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Registrar Gasto
          </button>
        </div>

      {/* KPIs REDUCIDOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#18181b] to-[#27272a] p-5 rounded-xl shadow-lg text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={50} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Gasto Total General</p>
          <h3 className="text-2xl font-black font-serif relative z-10 mb-1">{formatoMoneda(totalGasto)}</h3>
        </div>

        <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wrench size={50} />
          </div>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Mano de Obra</p>
          <h3 className="text-xl font-black text-[var(--text-main)] font-serif mb-1">{formatoMoneda(totalMO)}</h3>
          <p className="text-xs font-medium text-[var(--text-muted)]">{totalGasto > 0 ? ((totalMO/totalGasto)*100).toFixed(1) : 0}% del total</p>
        </div>

        <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <Receipt size={50} />
          </div>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Refacciones</p>
          <h3 className="text-xl font-black text-[var(--text-main)] font-serif mb-1">{formatoMoneda(totalRefacciones)}</h3>
          <p className="text-xs font-medium text-[var(--text-muted)]">{totalGasto > 0 ? ((totalRefacciones/totalGasto)*100).toFixed(1) : 0}% del total</p>
        </div>

        <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
            <Wrench size={50} />
          </div>
          <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Servicios</p>
          <h3 className="text-2xl font-black text-[var(--text-main)] font-serif mb-1">{filteredCostos.length}</h3>
          <p className="text-xs font-medium text-[var(--text-muted)]">Registros en tabla de costos</p>
        </div>
      </div>

      {/* GRÁFICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-sm">
          <h3 className="font-bold font-serif text-[var(--text-main)] mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-[var(--text-muted)]" />
            Costos por Empresa
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosPorEmpresa} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `$${value/1000}k`} fontSize={12} />
                <YAxis dataKey="name" type="category" width={80} fontSize={12} fontWeight="bold" />
                <Tooltip formatter={(value: number) => formatoMoneda(value)} cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#27272a" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-sm">
          <h3 className="font-bold font-serif text-[var(--text-main)] mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-[var(--text-muted)]" />
            Tendencia de Gastos (Mensual)
          </h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosPorMes} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="mes" fontSize={12} />
                <YAxis tickFormatter={(value) => `$${value/1000}k`} fontSize={12} />
                <Tooltip formatter={(value: number) => formatoMoneda(value)} />
                <Line type="monotone" dataKey="Total" stroke="#71717a" strokeWidth={3} dot={{r: 4, fill: '#18181b'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filtros Inteligentes */}
      <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-3 px-5 rounded-xl flex flex-col md:flex-row gap-4 items-center relative z-20">
        <div className="flex items-center gap-2 text-[var(--text-muted)] w-full md:w-auto mr-auto">
          <Filter size={18} />
          <span className="font-bold text-sm">Filtros:</span>
        </div>
        
        <div className="w-full md:w-56 z-20">
          <PremiumSelect
            accent="indigo"
            placeholder="Todas las Empresas"
            value={empresaFiltro || 'Todas'}
            onChange={(val) => {
              setEmpresaFiltro(val === 'Todas' ? '' : val);
              setUnidadFiltro(''); // Reset unidad when empresa changes
            }}
            options={[
              { value: 'Todas', label: 'Todas las Empresas' },
              ...empresasMaestras.map(emp => ({
                value: emp,
                label: `Flota: ${emp}`
              }))
            ]}
            direction="down"
            compact
          />
        </div>

        <div className="w-full md:w-56 z-10">
          <PremiumSelect
            accent="indigo"
            placeholder="Todas las Unidades"
            value={unidadFiltro || 'Todas'}
            onChange={(val) => setUnidadFiltro(val === 'Todas' ? '' : val)}
            options={[
              { value: 'Todas', label: 'Todas las Unidades' },
              ...unidadesMaestras.map(un => ({
                value: un,
                label: un
              }))
            ]}
            direction="down"
            disabled={unidadesMaestras.length === 0}
            compact
          />
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-screen)] border-b border-[var(--border-cream)]">
                <th className="p-4 font-bold text-[var(--text-muted)] text-sm">Fecha</th>
                <th className="p-4 font-bold text-[var(--text-muted)] text-sm">Servicio</th>
                <th className="p-4 font-bold text-[var(--text-muted)] text-sm">Unidad</th>
                <th className="p-4 font-bold text-[var(--text-muted)] text-sm">Costo MO</th>
                <th className="p-4 font-bold text-[var(--text-muted)] text-sm">Costo Ref.</th>
                <th className="p-4 font-bold text-[var(--text-muted)] text-sm">Total</th>
                <th className="p-4 font-bold text-[var(--text-muted)] text-sm">Empresa</th>
                <th className="p-4 font-bold text-[var(--text-muted)] text-sm">Proveedor</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[var(--text-muted)]">Cargando datos...</td>
                </tr>
              ) : filteredCostos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[var(--text-muted)]">No se encontraron registros de costos.</td>
                </tr>
              ) : (
                filteredCostos.map((costo) => (
                  <tr key={costo.Id_Costo} className="border-b border-[var(--border-cream)] hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="p-4 text-sm">{new Date(costo.Fecha).toLocaleDateString()}</td>
                    <td className="p-4 text-sm font-medium max-w-xs truncate" title={costo.Servicio}>{costo.Servicio}</td>
                    <td className="p-4 text-sm whitespace-nowrap">
                      <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">{costo.Consecutivo}</span>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-muted)]">{formatoMoneda(costo.Costo_MO)}</td>
                    <td className="p-4 text-sm text-[var(--text-muted)]">{formatoMoneda(costo.Costo_Refacciones)}</td>
                    <td className="p-4 text-sm font-bold text-[var(--text-main)]">{formatoMoneda(costo.Total)}</td>
                    <td className="p-4 text-sm">{costo.Empresa}</td>
                    <td className="p-4 text-sm text-[var(--text-muted)]">{costo.Proveedor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-floating)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[var(--border-cream)] animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-[var(--border-cream)] flex justify-between items-center bg-[var(--bg-screen)]">
              <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                <Receipt size={24} /> Registrar Nuevo Gasto
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-2xl hover:scale-110 transition-transform">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Fecha</label>
                  <input type="date" name="Fecha" required value={formData.Fecha as string} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm text-[var(--text-main)] focus:ring-2 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Unidad (Consecutivo)</label>
                  <input type="text" name="Consecutivo" required placeholder="Ej. AVH-032" value={formData.Consecutivo as string} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm text-[var(--text-main)] focus:ring-2 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Empresa</label>
                  <input type="text" name="Empresa" required placeholder="Ej. AVH" value={formData.Empresa as string} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm text-[var(--text-main)] focus:ring-2 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Tipo Mantenimiento</label>
                  <select name="Tipo_Mtto" required value={formData.Tipo_Mtto as string} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm text-[var(--text-main)] focus:ring-2 outline-none">
                    <option value="Preventivo">Preventivo</option>
                    <option value="Correctivo">Correctivo</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold mb-1">Servicio / Descripción</label>
                  <textarea name="Servicio" required rows={2} placeholder="Detalles del servicio..." value={formData.Servicio as string} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm text-[var(--text-main)] focus:ring-2 outline-none"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Costo Mano de Obra</label>
                  <input type="number" step="0.01" name="Costo_MO" required min="0" value={formData.Costo_MO} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm text-[var(--text-main)] focus:ring-2 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Costo Refacciones</label>
                  <input type="number" step="0.01" name="Costo_Refacciones" required min="0" value={formData.Costo_Refacciones} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm text-[var(--text-main)] focus:ring-2 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Proveedor</label>
                  <input type="text" name="Proveedor" required placeholder="Taller o Refaccionaria" value={formData.Proveedor as string} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm text-[var(--text-main)] focus:ring-2 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Factura CDG</label>
                  <input type="text" name="Factura_CDG" placeholder="Opcional" value={formData.Factura_CDG as string} onChange={handleInputChange} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm text-[var(--text-main)] focus:ring-2 outline-none" />
                </div>
              </div>

              <div className="bg-[var(--bg-screen)] p-4 rounded-xl mt-6 flex justify-between items-center border border-[var(--border-cream)]">
                <span className="font-bold text-[var(--text-muted)]">Total Calculado:</span>
                <span className="text-2xl font-black text-[var(--text-main)]">
                  {formatoMoneda((Number(formData.Costo_MO) || 0) + (Number(formData.Costo_Refacciones) || 0))}
                </span>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] font-bold transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-lg bg-[#27272a] hover:bg-black text-white font-bold transition-all shadow-md">
                  Guardar Costo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
