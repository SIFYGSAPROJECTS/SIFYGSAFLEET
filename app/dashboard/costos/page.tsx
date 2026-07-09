'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { DollarSign, Search, Filter, Plus, Calendar, Wrench, Building2, Car, TrendingUp, TrendingDown, Receipt, UploadCloud, ArrowLeft, User, FileText, Download, FolderOpen, CalendarCheck, Fuel, Map } from 'lucide-react';

import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

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

interface CostoGasolina {
  Id_Gasto: number;
  Fecha_Hora: string;
  Consecutivo: string;
  Estacion: string;
  Combustible: string;
  Litros: number;
  Precio: number;
  Total: number;
  auto?: {
    Placa: string;
    Marca: string;
    Modelo: string;
  };
}

interface CostoPeaje {
  Id_Peaje: number;
  Tag: string;
  Consecutivo: string;
  Fecha_Hora: string;
  Caseta: string;
  Carril: string;
  Clase: string;
  Importe: number;
  Fecha_Aplicacion: string | null;
  Hora_Aplicacion: string | null;
  Consecar: string | null;
  auto?: {
    Placa: string;
    Marca: string;
    Modelo: string;
  };
}

export default function CostosPage() {
  const [activeTab, setActiveTab] = useState<'mantenimiento' | 'gasolina' | 'peajes'>('mantenimiento');
  const [costos, setCostos] = useState<Costo[]>([]);
  const [gasolinas, setGasolinas] = useState<CostoGasolina[]>([]);
  const [peajes, setPeajes] = useState<CostoPeaje[]>([]);
  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chartEmpresaRef = useRef<HTMLDivElement>(null);
  const chartMensualRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [userRole, setUserRole] = useState<string>('USER');
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

  const [scrolled, setScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(72);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.getElementById('sticky-header-dashboard-costos');
      if (header) {
        setHeaderHeight(header.offsetHeight + 72);
      } else {
        setHeaderHeight(72);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [scrolled]);
  
  // Filtros
  const [empresaFiltro, setEmpresaFiltro] = useState('');
  const [unidadFiltro, setUnidadFiltro] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formDataMtto, setFormDataMtto] = useState<Partial<Costo>>({
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

  const [formDataGasolina, setFormDataGasolina] = useState<Partial<CostoGasolina>>({
    Fecha_Hora: new Date().toISOString().split('T')[0] + 'T00:00',
    Consecutivo: '',
    Estacion: '',
    Combustible: 'MAGNA',
    Litros: 0,
    Precio: 0,
    Total: 0
  });

  const [formDataPeaje, setFormDataPeaje] = useState<Partial<CostoPeaje>>({
    Tag: '',
    Consecutivo: '',
    Fecha_Hora: new Date().toISOString().split('T')[0] + 'T00:00',
    Caseta: '',
    Carril: '',
    Clase: '1',
    Importe: 0,
    Fecha_Aplicacion: '',
    Hora_Aplicacion: '',
    Consecar: ''
  });

  const fetchCostos = async () => {
    try {
      const res = await fetch('/api/costos');
      const data = await res.json();
      if (Array.isArray(data)) setCostos(data);
    } catch (error) {
      console.error('Error al cargar costos', error);
    }
  };

  const fetchGasolina = async () => {
    try {
      const res = await fetch('/api/costos/gasolina');
      const data = await res.json();
      if (Array.isArray(data)) setGasolinas(data);
    } catch (error) {
      console.error('Error al cargar gasolina', error);
    }
  };

  const fetchPeajes = async () => {
    try {
      const res = await fetch('/api/costos/peajes');
      const data = await res.json();
      if (Array.isArray(data)) setPeajes(data);
    } catch (error) {
      console.error('Error al cargar peajes', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchCostos(), fetchGasolina(), fetchPeajes()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    fetch('/api/vehiculos')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVehiculos(data);
      })
      .catch(console.error);
      
    const match = document.cookie.match(new RegExp('(^| )user_role=([^;]+)'));
    if (match) {
      setUserRole(match[2]);
    }
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    let endpoint = '/api/costos/upload';
    if (activeTab === 'gasolina') endpoint = '/api/costos/gasolina/upload';
    if (activeTab === 'peajes') endpoint = '/api/costos/peajes/upload';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        let msg = `¡Importación exitosa! Se procesaron ${data.procesados} registros. (${data.errores} errores)`;
        if (data.duplicados) {
          msg += `\nSe omitieron ${data.duplicados} registros duplicados (ya existían).`;
        }
        alert(msg);
        if (activeTab === 'mantenimiento') fetchCostos();
        else if (activeTab === 'gasolina') fetchGasolina();
        else fetchPeajes();
      } else {
        alert(data.error || 'Error al importar el archivo Excel.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red al importar el archivo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const handleInputChangeMtto = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormDataMtto(prev => ({
      ...prev,
      [name]: name === 'Costo_MO' || name === 'Costo_Refacciones' ? Number(value) : value
    }));
  };

  const handleInputChangeGas = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormDataGasolina(prev => {
      const updated = { ...prev, [name]: ['Litros', 'Precio', 'Total'].includes(name) ? Number(value) : value };
      if (name === 'Litros' || name === 'Precio') {
        const litros = name === 'Litros' ? Number(value) : (prev.Litros || 0);
        const precio = name === 'Precio' ? Number(value) : (prev.Precio || 0);
        updated.Total = parseFloat((litros * precio).toFixed(4));
      }
      return updated;
    });
  };

  const handleInputChangePeaje = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormDataPeaje(prev => ({
      ...prev,
      [name]: name === 'Importe' ? Number(value) : value
    }));
  };

  const handleSubmitMtto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/costos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataMtto)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormDataMtto({
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

  const handleSubmitGas = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/costos/gasolina', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataGasolina)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormDataGasolina({
          Fecha_Hora: new Date().toISOString().split('T')[0] + 'T00:00',
          Consecutivo: '',
          Estacion: '',
          Combustible: 'MAGNA',
          Litros: 0,
          Precio: 0,
          Total: 0
        });
        fetchGasolina();
      } else {
        alert('Error al guardar registro de gasolina');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitPeaje = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/costos/peajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formDataPeaje)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormDataPeaje({
          Tag: '',
          Consecutivo: '',
          Fecha_Hora: new Date().toISOString().split('T')[0] + 'T00:00',
          Caseta: '',
          Carril: '',
          Clase: '1',
          Importe: 0,
          Fecha_Aplicacion: '',
          Hora_Aplicacion: '',
          Consecar: ''
        });
        fetchPeajes();
      } else {
        alert('Error al guardar registro de peaje');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const title = activeTab === 'mantenimiento' ? 'Reporte de Mantenimiento' : activeTab === 'gasolina' ? 'Reporte de Gasolina' : 'Reporte de Peajes';
      const worksheet = workbook.addWorksheet(title);

      worksheet.addRow([title]);
      worksheet.addRow([`Fecha de Generación:`, new Date().toLocaleDateString()]);
      worksheet.addRow([`Filtro Empresa:`, empresaFiltro || 'Todas']);
      worksheet.addRow([`Filtro Unidad:`, unidadFiltro || 'Todas']);
      worksheet.addRow([]); 

      if (activeTab === 'mantenimiento') {
        const headerRow = worksheet.addRow(['Fecha', 'Servicio', 'Unidad', 'Costo MO', 'Costo Ref.', 'Total', 'Empresa', 'Proveedor']);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF27272A' } };
        worksheet.columns = [{ width: 12 }, { width: 35 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 25 }];
        
        filteredCostos.forEach(costo => {
          worksheet.addRow([
            new Date(costo.Fecha).toLocaleDateString(),
            costo.Servicio,
            costo.Consecutivo,
            costo.Costo_MO,
            costo.Costo_Refacciones,
            costo.Total,
            costo.Empresa,
            costo.Proveedor
          ]);
        });
        worksheet.getColumn(4).numFmt = '"$"#,##0.00';
        worksheet.getColumn(5).numFmt = '"$"#,##0.00';
        worksheet.getColumn(6).numFmt = '"$"#,##0.00';
        worksheet.addRow([]); 
        worksheet.addRow(['', '', 'GASTO TOTAL GENERAL:', totalGasto]).getCell(4).numFmt = '"$"#,##0.00';
      } else if (activeTab === 'gasolina') {
        const headerRow = worksheet.addRow(['Fecha y Hora', 'Unidad', 'Estación', 'Combustible', 'Litros', 'Precio', 'Total']);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF27272A' } };
        worksheet.columns = [{ width: 20 }, { width: 15 }, { width: 20 }, { width: 15 }, { width: 10 }, { width: 10 }, { width: 15 }];
        
        filteredGasolinas.forEach(gas => {
          worksheet.addRow([
            new Date(gas.Fecha_Hora).toLocaleString(),
            gas.Consecutivo,
            gas.Estacion,
            gas.Combustible,
            gas.Litros,
            gas.Precio,
            gas.Total
          ]);
        });
        worksheet.getColumn(6).numFmt = '"$"#,##0.00';
        worksheet.getColumn(7).numFmt = '"$"#,##0.00';
        worksheet.addRow([]); 
        worksheet.addRow(['', '', '', 'TOTALES:', totalLitros, '', totalGasolina]).getCell(7).numFmt = '"$"#,##0.00';
      } else {
        const headerRow = worksheet.addRow(['Tag', 'Fecha y Hora', 'Unidad', 'Caseta', 'Carril', 'Clase', 'Importe', 'Fecha Aplicación', 'Hora Aplicación', 'Consecar']);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF27272A' } };
        worksheet.columns = [{ width: 20 }, { width: 20 }, { width: 15 }, { width: 25 }, { width: 15 }, { width: 10 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 10 }];
        
        filteredPeajes.forEach(peaje => {
          worksheet.addRow([
            peaje.Tag,
            new Date(peaje.Fecha_Hora).toLocaleString(),
            peaje.Consecutivo,
            peaje.Caseta,
            peaje.Carril,
            peaje.Clase,
            peaje.Importe,
            peaje.Fecha_Aplicacion || '',
            peaje.Hora_Aplicacion || '',
            peaje.Consecar || ''
          ]);
        });
        worksheet.getColumn(7).numFmt = '"$"#,##0.00';
        worksheet.addRow([]); 
        worksheet.addRow(['', '', '', '', '', 'TOTAL PEAJES:', totalPeajes]).getCell(7).numFmt = '"$"#,##0.00';
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `Reporte_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(new Blob([buffer as BlobPart]), fileName);
    } catch (error) {
      console.error('Error al exportar a Excel', error);
      alert('Hubo un error al generar el archivo Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filtrado Mtto
  const filteredCostos = useMemo(() => {
    return costos.filter(c => {
      const matchEmpresa = empresaFiltro ? (c.Empresa.toLowerCase().includes(empresaFiltro.toLowerCase()) || c.Consecutivo.toLowerCase().startsWith(empresaFiltro.toLowerCase() + '-')) : true;
      const matchUnidad = unidadFiltro ? c.Consecutivo.toLowerCase() === unidadFiltro.toLowerCase() : true;
      return matchEmpresa && matchUnidad;
    });
  }, [costos, empresaFiltro, unidadFiltro]);

  // Filtrado Gasolina
  const filteredGasolinas = useMemo(() => {
    return gasolinas.filter(g => {
      const matchEmpresa = empresaFiltro ? g.Consecutivo.toLowerCase().startsWith(empresaFiltro.toLowerCase() + '-') : true;
      const matchUnidad = unidadFiltro ? g.Consecutivo.toLowerCase() === unidadFiltro.toLowerCase() : true;
      return matchEmpresa && matchUnidad;
    });
  }, [gasolinas, empresaFiltro, unidadFiltro]);

  // Filtrado Peajes
  const filteredPeajes = useMemo(() => {
    return peajes.filter(p => {
      const matchEmpresa = empresaFiltro ? p.Consecutivo.toLowerCase().startsWith(empresaFiltro.toLowerCase() + '-') : true;
      const matchUnidad = unidadFiltro ? p.Consecutivo.toLowerCase() === unidadFiltro.toLowerCase() : true;
      return matchEmpresa && matchUnidad;
    });
  }, [peajes, empresaFiltro, unidadFiltro]);

  // Totales
  const totalGasto = useMemo(() => filteredCostos.reduce((acc, curr) => acc + curr.Total, 0), [filteredCostos]);
  const totalMO = useMemo(() => filteredCostos.reduce((acc, curr) => acc + curr.Costo_MO, 0), [filteredCostos]);
  const totalRefacciones = useMemo(() => filteredCostos.reduce((acc, curr) => acc + curr.Costo_Refacciones, 0), [filteredCostos]);

  const totalGasolina = useMemo(() => filteredGasolinas.reduce((acc, curr) => acc + curr.Total, 0), [filteredGasolinas]);
  const totalLitros = useMemo(() => filteredGasolinas.reduce((acc, curr) => acc + curr.Litros, 0), [filteredGasolinas]);

  const totalPeajes = useMemo(() => filteredPeajes.reduce((acc, curr) => acc + curr.Importe, 0), [filteredPeajes]);

  const empresasMaestras = Array.from(new Set(vehiculos.map(v => v.Consecutivo?.split('-')[0]))).filter(Boolean).sort() as string[];
  const unidadesMaestras = useMemo(() => {
    return vehiculos
      .filter(v => !empresaFiltro ? true : v.Consecutivo?.startsWith(empresaFiltro + '-'))
      .map(v => v.Consecutivo)
      .sort();
  }, [vehiculos, empresaFiltro]);

  // Gráficas
  const datosPorEmpresaMtto = useMemo(() => {
    const agrupado = empresasMaestras.reduce((acc, emp) => { acc[emp] = 0; return acc; }, {} as Record<string, number>);
    filteredCostos.forEach((curr) => {
      const prefijo = curr.Consecutivo?.split('-')[0] || 'Otros';
      if (empresasMaestras.includes(prefijo)) {
        agrupado[prefijo] += curr.Total;
      } else {
        agrupado[prefijo] = (agrupado[prefijo] || 0) + curr.Total;
      }
    });
    return Object.entries(agrupado).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredCostos, empresasMaestras]);

  const datosPorMesMtto = useMemo(() => {
    const agrupado = filteredCostos.reduce((acc, curr) => {
      const fecha = new Date(curr.Fecha);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      acc[mes] = (acc[mes] || 0) + curr.Total;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(agrupado).map(([mes, Total]) => ({ mes, Total })).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [filteredCostos]);

  const datosPorMesGasolina = useMemo(() => {
    const agrupado = filteredGasolinas.reduce((acc, curr) => {
      const fecha = new Date(curr.Fecha_Hora);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      acc[mes] = (acc[mes] || 0) + curr.Total;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(agrupado).map(([mes, Total]) => ({ mes, Total })).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [filteredGasolinas]);

  const datosPorMesPeajes = useMemo(() => {
    const agrupado = filteredPeajes.reduce((acc, curr) => {
      const fecha = new Date(curr.Fecha_Hora);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      acc[mes] = (acc[mes] || 0) + curr.Importe;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(agrupado).map(([mes, Importe]) => ({ mes, Importe })).sort((a, b) => a.mes.localeCompare(b.mes));
  }, [filteredPeajes]);

  const formatoMoneda = (valor: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
  };

  return (
    <div className="min-h-screen bg-transparent relative">
      <div className="pt-0 pb-6 relative">
        <div className="max-w-[95%] mx-auto space-y-8 animate-in fade-in duration-500">

        <div className="flex flex-wrap justify-between items-center gap-2 sm:gap-3 w-full border-b border-[var(--border-cream)] pb-4 mb-6">
          
          {/* TABS */}
          <div className="flex bg-[var(--bg-floating)] p-1 rounded-full border border-[var(--border-cream)] shadow-sm">
            <button
              onClick={() => setActiveTab('mantenimiento')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                activeTab === 'mantenimiento' ? 'bg-[#27272a] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Wrench size={16} /> Mantenimientos
            </button>
            <button
              onClick={() => setActiveTab('gasolina')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                activeTab === 'gasolina' ? 'bg-[#27272a] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Fuel size={16} /> Gasolina
            </button>
            <button
              onClick={() => setActiveTab('peajes')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                activeTab === 'peajes' ? 'bg-[#27272a] text-white shadow-md' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              <Map size={16} /> Peajes
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            {isAdmin && (
              <>
                <button 
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="bg-white border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] px-4 sm:px-5 py-2.5 rounded-full font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm whitespace-nowrap"
                >
                  <Download size={16} className={isExporting ? "animate-pulse" : ""} />
                  Exportar
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-white border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] text-[var(--text-main)] px-4 sm:px-5 py-2.5 rounded-full font-bold shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm whitespace-nowrap"
                >
                  <UploadCloud size={16} className={isUploading ? "animate-bounce" : ""} />
                  Importar
                </button>
              </>
            )}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-[#27272a] hover:bg-black text-white px-5 sm:px-6 py-2.5 rounded-full font-bold shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap"
            >
              <Plus size={16} />
              Registrar {activeTab === 'gasolina' ? 'Gasolina' : activeTab === 'peajes' ? 'Peaje' : 'Gasto'}
            </button>
          </div>
        </div>

        {/* KPIs */}
        {activeTab === 'mantenimiento' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-[#18181b] to-[#27272a] p-5 rounded-xl shadow-lg text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={50} /></div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 relative z-10">Gasto Total General</p>
              <h3 className="text-2xl font-black font-serif relative z-10 mb-1">{formatoMoneda(totalGasto)}</h3>
            </div>
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Wrench size={50} /></div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Mano de Obra</p>
              <h3 className="text-xl font-black text-[var(--text-main)] font-serif mb-1">{formatoMoneda(totalMO)}</h3>
              <p className="text-xs font-medium text-[var(--text-muted)]">{totalGasto > 0 ? ((totalMO/totalGasto)*100).toFixed(1) : 0}% del total</p>
            </div>
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Receipt size={50} /></div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Refacciones</p>
              <h3 className="text-xl font-black text-[var(--text-main)] font-serif mb-1">{formatoMoneda(totalRefacciones)}</h3>
              <p className="text-xs font-medium text-[var(--text-muted)]">{totalGasto > 0 ? ((totalRefacciones/totalGasto)*100).toFixed(1) : 0}% del total</p>
            </div>
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Wrench size={50} /></div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Servicios</p>
              <h3 className="text-2xl font-black text-[var(--text-main)] font-serif mb-1">{filteredCostos.length}</h3>
              <p className="text-xs font-medium text-[var(--text-muted)]">Registros en tabla</p>
            </div>
          </div>
        )}

        {activeTab === 'gasolina' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 p-5 rounded-xl shadow-lg text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Fuel size={50} /></div>
              <p className="text-xs font-bold text-indigo-200 uppercase tracking-widest mb-1 relative z-10">Gasto Combustible</p>
              <h3 className="text-2xl font-black font-serif relative z-10 mb-1">{formatoMoneda(totalGasolina)}</h3>
            </div>
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Fuel size={50} /></div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Total Litros</p>
              <h3 className="text-xl font-black text-[var(--text-main)] font-serif mb-1">{totalLitros.toFixed(2)} L</h3>
            </div>
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Receipt size={50} /></div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Cargas Registradas</p>
              <h3 className="text-xl font-black text-[var(--text-main)] font-serif mb-1">{filteredGasolinas.length}</h3>
            </div>
          </div>
        )}

        {activeTab === 'peajes' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-teal-900 to-teal-700 p-5 rounded-xl shadow-lg text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Map size={50} /></div>
              <p className="text-xs font-bold text-teal-200 uppercase tracking-widest mb-1 relative z-10">Gasto Total Peajes</p>
              <h3 className="text-2xl font-black font-serif relative z-10 mb-1">{formatoMoneda(totalPeajes)}</h3>
            </div>
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Receipt size={50} /></div>
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Casetas Registradas</p>
              <h3 className="text-xl font-black text-[var(--text-main)] font-serif mb-1">{filteredPeajes.length}</h3>
            </div>
          </div>
        )}

        {/* GRÁFICAS */}
        {activeTab === 'mantenimiento' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-sm" ref={chartEmpresaRef}>
              <h3 className="font-bold font-serif text-[var(--text-main)] mb-4 flex items-center gap-2">
                <Building2 size={18} className="text-[var(--text-muted)]" /> Costos por Empresa
              </h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosPorEmpresaMtto} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => `$${value/1000}k`} fontSize={12} />
                    <YAxis dataKey="name" type="category" width={80} fontSize={12} fontWeight="bold" />
                    <Tooltip formatter={(value: any) => formatoMoneda(Number(value))} cursor={{fill: 'transparent'}} />
                    <Bar dataKey="value" fill="#27272a" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-sm" ref={chartMensualRef}>
              <h3 className="font-bold font-serif text-[var(--text-main)] mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-[var(--text-muted)]" /> Tendencia Mantenimiento
              </h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosPorMesMtto} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" fontSize={12} />
                    <YAxis tickFormatter={(value) => `$${value/1000}k`} fontSize={12} />
                    <Tooltip formatter={(value: any) => formatoMoneda(Number(value))} />
                    <Line type="monotone" dataKey="Total" stroke="#71717a" strokeWidth={3} dot={{r: 4, fill: '#18181b'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gasolina' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-sm">
              <h3 className="font-bold font-serif text-[var(--text-main)] mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-[var(--text-muted)]" /> Tendencia Gasolina
              </h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosPorMesGasolina} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" fontSize={12} />
                    <YAxis tickFormatter={(value) => `$${value/1000}k`} fontSize={12} />
                    <Tooltip formatter={(value: any) => formatoMoneda(Number(value))} />
                    <Line type="monotone" dataKey="Total" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#312e81'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'peajes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-5 rounded-xl shadow-sm">
              <h3 className="font-bold font-serif text-[var(--text-main)] mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-[var(--text-muted)]" /> Tendencia Peajes
              </h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosPorMesPeajes} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="mes" fontSize={12} />
                    <YAxis tickFormatter={(value) => `$${value/1000}k`} fontSize={12} />
                    <Tooltip formatter={(value: any) => formatoMoneda(Number(value))} />
                    <Line type="monotone" dataKey="Importe" stroke="#0d9488" strokeWidth={3} dot={{r: 4, fill: '#115e59'}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        </div>

        {/* Filtros */}
        <div id="sticky-header-dashboard-costos" className={`sticky top-[72px] z-40 transition duration-300 pt-2 pb-0 mb-6 px-0 ${scrolled ? 'bg-[#f8fafc]' : 'bg-transparent'}`}>
          <div className={`max-w-[95%] mx-auto transition duration-300 ${scrolled ? 'border-b border-stone-300 shadow-xl pb-2 px-0' : 'border-transparent pb-2 px-0 shadow-none'}`}>
            <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] p-3 px-5 rounded-xl flex flex-col md:flex-row gap-4 items-center relative shadow-sm">
              <div className="flex items-center gap-2 text-[var(--text-muted)] w-full md:w-auto mr-auto">
                <Filter size={18} />
                <span className="font-bold text-sm">Filtros:</span>
              </div>
              <div className="w-full md:w-56 z-20">
                <PremiumSelect
                  accent="indigo"
                  placeholder="Todas las Empresas"
                  value={empresaFiltro || 'Todas'}
                  onChange={(val) => { setEmpresaFiltro(val === 'Todas' ? '' : val); setUnidadFiltro(''); }}
                  options={[{ value: 'Todas', label: 'Todas las Empresas' }, ...empresasMaestras.map(emp => ({ value: emp, label: `Flota: ${emp}` }))]}
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
                  options={[{ value: 'Todas', label: 'Todas las Unidades' }, ...unidadesMaestras.map(un => ({ value: un, label: un }))]}
                  direction="down"
                  disabled={unidadesMaestras.length === 0}
                  compact
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de Datos */}
        <div className="max-w-[95%] mx-auto">
          <div className="bg-[var(--bg-floating)] border border-[var(--border-cream)] rounded-xl shadow-sm">
            <div className="w-full overflow-x-auto md:overflow-x-visible">
              <table className="min-w-[1000px] w-full text-left border-collapse">
                <thead>
                  {activeTab === 'mantenimiento' ? (
                    <tr className="border-b border-[var(--border-cream)] text-stone-500 text-[11px] uppercase tracking-widest font-black">
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Fecha</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Servicio</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Unidad</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Costo MO</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Costo Ref.</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Total</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Empresa</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Proveedor</th>
                    </tr>
                  ) : activeTab === 'gasolina' ? (
                    <tr className="border-b border-[var(--border-cream)] text-stone-500 text-[11px] uppercase tracking-widest font-black">
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Fecha y Hora</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Unidad</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Estación</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Combustible</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Litros</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Precio</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Total</th>
                    </tr>
                  ) : (
                    <tr className="border-b border-[var(--border-cream)] text-stone-500 text-[11px] uppercase tracking-widest font-black">
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Tag</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Fecha y Hora</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Unidad</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Caseta</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Carril</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Clase</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Importe</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Fecha Apl.</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Hora Apl.</th>
                      <th className="sticky z-30 p-5 bg-stone-50/90 backdrop-blur-md" style={{ top: `${headerHeight}px` }}>Consecar</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="p-8 text-center text-[var(--text-muted)]">Cargando datos...</td></tr>
                  ) : activeTab === 'mantenimiento' ? (
                    filteredCostos.length === 0 ? (
                      <tr><td colSpan={8} className="p-8 text-center text-[var(--text-muted)]">No se encontraron registros.</td></tr>
                    ) : (
                      filteredCostos.map((costo) => (
                        <tr key={costo.Id_Costo} className="border-b border-[var(--border-cream)] hover:bg-[var(--bg-hover)] even:bg-[var(--bg-screen)] transition-colors">
                          <td className="p-4 text-sm">{new Date(costo.Fecha).toLocaleDateString()}</td>
                          <td className="p-4 text-sm font-medium max-w-xs truncate" title={costo.Servicio}>{costo.Servicio}</td>
                          <td className="p-4 text-sm whitespace-nowrap"><span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">{costo.Consecutivo}</span></td>
                          <td className="p-4 text-sm text-[var(--text-muted)]">{formatoMoneda(costo.Costo_MO)}</td>
                          <td className="p-4 text-sm text-[var(--text-muted)]">{formatoMoneda(costo.Costo_Refacciones)}</td>
                          <td className="p-4 text-sm font-bold text-[var(--text-main)]">{formatoMoneda(costo.Total)}</td>
                          <td className="p-4 text-sm">{costo.Empresa}</td>
                          <td className="p-4 text-sm text-[var(--text-muted)]">{costo.Proveedor}</td>
                        </tr>
                      ))
                    )
                  ) : activeTab === 'gasolina' ? (
                    filteredGasolinas.length === 0 ? (
                      <tr><td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">No se encontraron registros de gasolina.</td></tr>
                    ) : (
                      filteredGasolinas.map((gas) => (
                        <tr key={gas.Id_Gasto} className="border-b border-[var(--border-cream)] hover:bg-[var(--bg-hover)] even:bg-[var(--bg-screen)] transition-colors">
                          <td className="p-4 text-sm">{new Date(gas.Fecha_Hora).toLocaleString()}</td>
                          <td className="p-4 text-sm whitespace-nowrap"><span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">{gas.Consecutivo}</span></td>
                          <td className="p-4 text-sm font-medium truncate" title={gas.Estacion}>{gas.Estacion}</td>
                          <td className="p-4 text-sm">{gas.Combustible}</td>
                          <td className="p-4 text-sm text-[var(--text-muted)]">{gas.Litros.toFixed(2)}</td>
                          <td className="p-4 text-sm text-[var(--text-muted)]">{formatoMoneda(gas.Precio)}</td>
                          <td className="p-4 text-sm font-bold text-[var(--text-main)]">{formatoMoneda(gas.Total)}</td>
                        </tr>
                      ))
                    )
                  ) : (
                    filteredPeajes.length === 0 ? (
                      <tr><td colSpan={10} className="p-8 text-center text-[var(--text-muted)]">No se encontraron registros de peajes.</td></tr>
                    ) : (
                      filteredPeajes.map((peaje) => (
                        <tr key={peaje.Id_Peaje} className="border-b border-[var(--border-cream)] hover:bg-[var(--bg-hover)] even:bg-[var(--bg-screen)] transition-colors">
                          <td className="p-4 text-sm text-[var(--text-muted)]">{peaje.Tag}</td>
                          <td className="p-4 text-sm">{new Date(peaje.Fecha_Hora).toLocaleString()}</td>
                          <td className="p-4 text-sm whitespace-nowrap"><span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">{peaje.Consecutivo}</span></td>
                          <td className="p-4 text-sm font-medium truncate" title={peaje.Caseta}>{peaje.Caseta}</td>
                          <td className="p-4 text-sm">{peaje.Carril}</td>
                          <td className="p-4 text-sm">{peaje.Clase}</td>
                          <td className="p-4 text-sm font-bold text-[var(--text-main)]">{formatoMoneda(peaje.Importe)}</td>
                          <td className="p-4 text-sm text-[var(--text-muted)]">{peaje.Fecha_Aplicacion || '-'}</td>
                          <td className="p-4 text-sm text-[var(--text-muted)]">{peaje.Hora_Aplicacion || '-'}</td>
                          <td className="p-4 text-sm text-[var(--text-muted)]">{peaje.Consecar || '-'}</td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Registrar */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-floating)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[var(--border-cream)] animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-[var(--border-cream)] flex justify-between items-center bg-[var(--bg-screen)]">
                <h2 className="text-xl font-bold font-serif flex items-center gap-2">
                  {activeTab === 'mantenimiento' ? <Receipt size={24} /> : activeTab === 'gasolina' ? <Fuel size={24} /> : <Map size={24} />} 
                  Registrar {activeTab === 'gasolina' ? 'Gasolina' : activeTab === 'peajes' ? 'Peaje' : 'Nuevo Gasto'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-2xl hover:scale-110 transition-transform">&times;</button>
              </div>
              
              {activeTab === 'mantenimiento' ? (
                <form onSubmit={handleSubmitMtto} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Fecha</label>
                      <input type="date" name="Fecha" required value={formDataMtto.Fecha as string} onChange={handleInputChangeMtto} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Unidad (Consecutivo)</label>
                      <input type="text" name="Consecutivo" required placeholder="Ej. AVH-032" value={formDataMtto.Consecutivo as string} onChange={handleInputChangeMtto} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Empresa</label>
                      <input type="text" name="Empresa" required placeholder="Ej. AVH" value={formDataMtto.Empresa as string} onChange={handleInputChangeMtto} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Tipo Mantenimiento</label>
                      <select name="Tipo_Mtto" required value={formDataMtto.Tipo_Mtto as string} onChange={handleInputChangeMtto} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none">
                        <option value="Preventivo">Preventivo</option>
                        <option value="Correctivo">Correctivo</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold mb-1">Servicio / Descripción</label>
                      <textarea name="Servicio" required rows={2} placeholder="Detalles del servicio..." value={formDataMtto.Servicio as string} onChange={handleInputChangeMtto} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none"></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Costo Mano de Obra</label>
                      <input type="number" step="0.01" name="Costo_MO" required min="0" value={formDataMtto.Costo_MO} onChange={handleInputChangeMtto} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Costo Refacciones</label>
                      <input type="number" step="0.01" name="Costo_Refacciones" required min="0" value={formDataMtto.Costo_Refacciones} onChange={handleInputChangeMtto} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Proveedor</label>
                      <input type="text" name="Proveedor" required placeholder="Taller o Refaccionaria" value={formDataMtto.Proveedor as string} onChange={handleInputChangeMtto} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Factura CDG</label>
                      <input type="text" name="Factura_CDG" placeholder="Opcional" value={formDataMtto.Factura_CDG as string} onChange={handleInputChangeMtto} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                  </div>
                  <div className="bg-[var(--bg-screen)] p-4 rounded-xl mt-6 flex justify-between items-center border border-[var(--border-cream)]">
                    <span className="font-bold text-[var(--text-muted)]">Total Calculado:</span>
                    <span className="text-2xl font-black text-[var(--text-main)]">
                      {formatoMoneda((Number(formDataMtto.Costo_MO) || 0) + (Number(formDataMtto.Costo_Refacciones) || 0))}
                    </span>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] font-bold transition-colors">Cancelar</button>
                    <button type="submit" className="px-6 py-2.5 rounded-lg bg-[#27272a] hover:bg-black text-white font-bold transition-all shadow-md">Guardar Costo</button>
                  </div>
                </form>
              ) : activeTab === 'gasolina' ? (
                <form onSubmit={handleSubmitGas} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Fecha y Hora</label>
                      <input type="datetime-local" name="Fecha_Hora" required value={formDataGasolina.Fecha_Hora as string} onChange={handleInputChangeGas} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Unidad (Consecutivo)</label>
                      <input type="text" name="Consecutivo" required placeholder="Ej. AVH-032" value={formDataGasolina.Consecutivo as string} onChange={handleInputChangeGas} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Estación</label>
                      <input type="text" name="Estacion" required placeholder="Ej. Comalcalco" value={formDataGasolina.Estacion as string} onChange={handleInputChangeGas} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Combustible</label>
                      <select name="Combustible" required value={formDataGasolina.Combustible as string} onChange={handleInputChangeGas} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none">
                        <option value="MAGNA">MAGNA</option>
                        <option value="PREMIUM">PREMIUM</option>
                        <option value="DIESEL">DIESEL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Litros</label>
                      <input type="number" step="0.01" name="Litros" required min="0" value={formDataGasolina.Litros} onChange={handleInputChangeGas} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Precio por Litro</label>
                      <input type="number" step="0.01" name="Precio" required min="0" value={formDataGasolina.Precio} onChange={handleInputChangeGas} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                  </div>
                  <div className="bg-[var(--bg-screen)] p-4 rounded-xl mt-6 flex justify-between items-center border border-[var(--border-cream)]">
                    <span className="font-bold text-[var(--text-muted)]">Total Automático:</span>
                    <span className="text-2xl font-black text-[var(--text-main)]">
                      {formatoMoneda(formDataGasolina.Total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] font-bold transition-colors">Cancelar</button>
                    <button type="submit" className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md">Guardar Gasolina</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmitPeaje} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Fecha y Hora</label>
                      <input type="datetime-local" name="Fecha_Hora" required value={formDataPeaje.Fecha_Hora as string} onChange={handleInputChangePeaje} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Unidad (Consecutivo)</label>
                      <input type="text" name="Consecutivo" required placeholder="Ej. AVH-032" value={formDataPeaje.Consecutivo as string} onChange={handleInputChangePeaje} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Tag (Opcional)</label>
                      <input type="text" name="Tag" placeholder="IMDM3034..." value={formDataPeaje.Tag as string} onChange={handleInputChangePeaje} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Caseta</label>
                      <input type="text" name="Caseta" required placeholder="ACAYUCAN..." value={formDataPeaje.Caseta as string} onChange={handleInputChangePeaje} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Carril</label>
                      <input type="text" name="Carril" required placeholder="ACAYUCAN 3" value={formDataPeaje.Carril as string} onChange={handleInputChangePeaje} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Clase</label>
                      <input type="text" name="Clase" required placeholder="1" value={formDataPeaje.Clase as string} onChange={handleInputChangePeaje} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Importe</label>
                      <input type="number" step="0.01" name="Importe" required min="0" value={formDataPeaje.Importe} onChange={handleInputChangePeaje} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Fecha Apl. (Opcional)</label>
                      <input type="text" name="Fecha_Aplicacion" placeholder="DD/MM/YYYY" value={formDataPeaje.Fecha_Aplicacion as string || ''} onChange={handleInputChangePeaje} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Hora Apl. (Opcional)</label>
                      <input type="text" name="Hora_Aplicacion" placeholder="HH:MM:SS" value={formDataPeaje.Hora_Aplicacion as string || ''} onChange={handleInputChangePeaje} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Consecar (Opcional)</label>
                      <input type="text" name="Consecar" placeholder="0" value={formDataPeaje.Consecar as string || ''} onChange={handleInputChangePeaje} className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-white shadow-sm outline-none" />
                    </div>
                  </div>
                  <div className="bg-[var(--bg-screen)] p-4 rounded-xl mt-6 flex justify-between items-center border border-[var(--border-cream)]">
                    <span className="font-bold text-[var(--text-muted)]">Importe a Registrar:</span>
                    <span className="text-2xl font-black text-[var(--text-main)]">
                      {formatoMoneda(formDataPeaje.Importe || 0)}
                    </span>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg border border-[var(--border-cream)] hover:bg-[var(--bg-hover)] font-bold transition-colors">Cancelar</button>
                    <button type="submit" className="px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-md">Guardar Peaje</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
