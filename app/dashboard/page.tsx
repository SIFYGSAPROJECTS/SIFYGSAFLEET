import { prisma } from '@/lib/db';
import { Car, Users, LogOut, Wrench, History, ShieldCheck, Activity } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

export default async function Dashboard() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userName = cookieStore.get('user_name')?.value || 'Usuario';

  const totalAutos = userRole === 'ADMIN' ? await prisma.inventario_Automoviles.count() : 0;
  const totalEmpleados = userRole === 'ADMIN' ? await prisma.empleados.count() : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Car className="text-white h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-wide">SIFYGSA <span className="text-blue-400">Fleet</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{userName}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${userRole === 'ADMIN' ? 'bg-blue-600' : 'bg-slate-700 text-slate-300'}`}>
                {userRole === 'ADMIN' ? 'ADMINISTRADOR' : 'EMPLEADO'}
              </span>
            </div>
            <Link href="/" className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors">
              <LogOut size={14} /> Salir
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {userRole === 'ADMIN' ? 'Panel de Control Maestro' : 'Centro de Servicios'}
          </h1>
          <p className="text-slate-500">Gestión de flota SIFYGSA</p>
        </div>

        {userRole === 'ADMIN' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-sm font-semibold text-slate-500">FLOTA TOTAL</h2>
                <Car className="text-blue-600" />
              </div>
              <p className="text-4xl font-bold text-slate-900">{totalAutos}</p>
              <p className="text-xs text-green-600 mt-2 font-medium">Unidades registradas en DB</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-sm font-semibold text-slate-500">PERSONAL ACTIVO</h2>
                <Users className="text-purple-600" />
              </div>
              <p className="text-4xl font-bold text-slate-900">{totalEmpleados}</p>
              <p className="text-xs text-slate-500 mt-2">Usuarios con acceso al sistema</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">Acciones Disponibles</h3>
          
          {/* AQUÍ CAMBIAMOS A 4 COLUMNAS (lg:grid-cols-4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {userRole === 'ADMIN' && (
              <Link href="/dashboard/vehiculos" className="p-6 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all group">
                <ShieldCheck className="w-8 h-8 text-blue-600 mb-4" />
                <span className="block font-bold text-lg text-slate-800">Inventario Maestro</span>
                <span className="text-sm text-slate-500">Editar, agregar o dar de baja unidades.</span>
              </Link>
            )}

            <Link href="/dashboard/tickets/nuevo" className="p-6 bg-white border border-slate-200 rounded-xl hover:border-orange-500 hover:shadow-md transition-all group">
              <Wrench className="w-8 h-8 text-orange-500 mb-4" />
              <span className="block font-bold text-lg text-slate-800">Nueva Orden</span>
              <span className="text-sm text-slate-500">Programar servicios o mantenimientos.</span>
            </Link>

            <Link href="/dashboard/historial" className="p-6 bg-white border border-slate-200 rounded-xl hover:border-purple-500 hover:shadow-md transition-all group block text-left">
              <History className="w-8 h-8 text-purple-600 mb-4" />
              <span className="block font-bold text-lg text-slate-800">Ver Historial</span>
              <span className="text-sm text-slate-500">Consultar el registro de mantenimientos.</span>
            </Link>

            {/* --- NUEVA TARJETA DE SEGUIMIENTO --- */}
            <Link href="/dashboard/seguimiento" className="p-6 bg-white border border-slate-200 rounded-xl hover:border-green-500 hover:shadow-md transition-all group block text-left">
              <Activity className="w-8 h-8 text-green-500 mb-4" />
              <span className="block font-bold text-lg text-slate-800">Seguimiento</span>
              <span className="text-sm text-slate-500">
                {userRole === 'ADMIN' 
                  ? 'Actualizar estado de unidades en taller.' 
                  : 'Ver el estatus en vivo de tu unidad.'}
              </span>
            </Link>
            
          </div>
        </div>
      </main>
    </div>
  );
}