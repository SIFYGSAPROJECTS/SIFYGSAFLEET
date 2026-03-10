import { prisma } from '@/lib/db';
// Agregamos el icono 'Key' a las importaciones
import { Car, Users, LogOut, Wrench, History, ShieldCheck, Activity, FileText, Archive, Key } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';

export default async function Dashboard() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userName = cookieStore.get('user_name')?.value || 'Usuario';

  const totalAutos = userRole === 'ADMIN' ? await prisma.inventario_Automoviles.count() : 0;
  const totalEmpleados = userRole === 'ADMIN' ? await prisma.empleados.count() : 0;
  
  const ticketsPendientes = userRole === 'ADMIN' ? await prisma.solicitud.count({
    where: { Estado: 'PENDIENTE' }
  }) : 0;

  return (
    <div className="min-h-screen bg-black">
      
      {/* NAVBAR */}
      <nav className="bg-slate-950 text-white p-4 shadow-lg sticky top-0 z-10 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="bg-[#FF7420] p-1.5 rounded-lg shadow-lg shadow-[#FF7420]/20">
              <Car className="text-white h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-wide">SIFYGSA <span className="text-[#FF7420]">Fleet</span></span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{userName}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${userRole === 'ADMIN' ? 'bg-[#FF7420]' : 'bg-slate-700 text-slate-300'}`}>
                {userRole === 'ADMIN' ? 'ADMINISTRADOR' : 'EMPLEADO'}
              </span>
            </div>
            <Link href="/" className="bg-slate-800 hover:bg-red-600 border border-slate-700 hover:border-red-500 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all">
              <LogOut size={14} /> Salir
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-8 mt-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {userRole === 'ADMIN' ? 'Panel de Control' : 'Centro de Servicios'}
          </h1>
          <p className="text-slate-400">Gestión de flota SIFYGSA</p>
        </div>

        {/* TARJETAS DE METRICAS */}
        {userRole === 'ADMIN' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border-x border-b border-slate-800 border-t-4 border-t-[#FF7420]">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-sm font-semibold text-slate-400">FLOTA TOTAL</h2>
                <Car className="text-blue-500" />
              </div>
              <p className="text-4xl font-bold text-white">{totalAutos}</p>
              <p className="text-xs text-emerald-400 mt-2 font-medium">Unidades registradas</p>
            </div>
            
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border-x border-b border-slate-800 border-t-4 border-t-[#FF7420]">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-sm font-semibold text-slate-400">PERSONAL ACTIVO</h2>
                <Users className="text-purple-500" />
              </div>
              <p className="text-4xl font-bold text-white">{totalEmpleados}</p>
              <p className="text-xs text-slate-500 mt-2">Usuarios con acceso al sistema</p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg border-x border-b border-slate-800 border-t-4 border-t-[#FF7420]">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-sm font-semibold text-slate-400">SERVICIOS PENDIENTES</h2>
                <Wrench className="text-[#FF7420]" />
              </div>
              <p className="text-4xl font-bold text-white">{ticketsPendientes}</p>
              <p className="text-xs text-[#FF7420] mt-2 font-medium">Órdenes en espera de atención</p>
            </div>
          </div>
        )}

        {/* BOTONES DE ACCION */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Acciones Disponibles</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {userRole === 'ADMIN' && (
              <>
                <Link href="/dashboard/inventario" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-[#FF7420] rounded-xl hover:border-[#FF7420] hover:shadow-[0_0_15px_rgba(255,116,32,0.15)] transition-all duration-300 group text-left block">
                  <ShieldCheck className="w-8 h-8 text-blue-500 mb-4" />
                  <span className="block font-bold text-lg text-white">Inventario Maestro</span>
                  <span className="text-sm text-slate-400">Editar, agregar o dar de baja unidades.</span>
                </Link>

                <Link href="/dashboard/inventario/bajas" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-[#FF7420] rounded-xl hover:border-[#FF7420] hover:shadow-[0_0_15px_rgba(255,116,32,0.15)] transition-all duration-300 group text-left block">
                  <Archive className="w-8 h-8 text-slate-400 mb-4" />
                  <span className="block font-bold text-lg text-white">Gestion de bajas</span>
                  <span className="text-sm text-slate-400">Registro inactivo de unidades y bajas.</span>
                </Link>

                <Link href="/dashboard/empleados" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-[#FF7420] rounded-xl hover:border-[#FF7420] hover:shadow-[0_0_15px_rgba(255,116,32,0.15)] transition-all duration-300 group text-left block">
                  <Users className="w-8 h-8 text-purple-500 mb-4" />
                  <span className="block font-bold text-lg text-white">Gestión de Personal</span>
                  <span className="text-sm text-slate-400">Administrar accesos, roles y contraseñas.</span>
                </Link>

                {/* NUEVA TARJETA DE SEGURIDAD AQUI */}
                <Link href="/dashboard/seguridad" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-[#FF7420] rounded-xl hover:border-[#FF7420] hover:shadow-[0_0_15px_rgba(255,116,32,0.15)] transition-all duration-300 group text-left block">
                  <Key className="w-8 h-8 text-yellow-500 mb-4" />
                  <span className="block font-bold text-lg text-white">Seguridad y Accesos</span>
                  <span className="text-sm text-slate-400">Restablecer contraseñas de usuarios.</span>
                </Link>
                
                <Link href="/dashboard/checklists" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-[#FF7420] rounded-xl hover:border-[#FF7420] hover:shadow-[0_0_15px_rgba(255,116,32,0.15)] transition-all duration-300 group text-left block">
                  <FileText className="w-8 h-8 text-cyan-500 mb-4" />
                  <span className="block font-bold text-lg text-white">Checklists PDF</span>
                  <span className="text-sm text-slate-400">Consulta y sube revisiones físicas globales.</span>
                </Link>
              </>
            )}

            {userRole === 'USER' && (
              <Link href="/dashboard/mis-checklists" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-[#FF7420] rounded-xl hover:border-[#FF7420] hover:shadow-[0_0_15px_rgba(255,116,32,0.15)] transition-all duration-300 group text-left block">
                <FileText className="w-8 h-8 text-cyan-500 mb-4" />
                <span className="block font-bold text-lg text-white">Mis Checklists</span>
                <span className="text-sm text-slate-400">Expediente digital de tu unidad asignada.</span>
              </Link>
            )}

            <Link href="/dashboard/tickets/nuevo" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-[#FF7420] rounded-xl hover:border-[#FF7420] hover:shadow-[0_0_15px_rgba(255,116,32,0.15)] transition-all duration-300 group text-left block">
              <Wrench className="w-8 h-8 text-[#FF7420] mb-4" />
              <span className="block font-bold text-lg text-white">Nueva Orden</span>
              <span className="text-sm text-slate-400">Programar servicios o mantenimientos.</span>
            </Link>

            <Link href="/dashboard/historial" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-[#FF7420] rounded-xl hover:border-[#FF7420] hover:shadow-[0_0_15px_rgba(255,116,32,0.15)] transition-all duration-300 group text-left block">
              <History className="w-8 h-8 text-purple-500 mb-4" />
              <span className="block font-bold text-lg text-white">Ver Historial</span>
              <span className="text-sm text-slate-400">Consultar el registro de mantenimientos.</span>
            </Link>

            <Link href="/dashboard/seguimiento" className="p-6 bg-slate-900 border-x border-b border-slate-800 border-t-4 border-t-[#FF7420] rounded-xl hover:border-[#FF7420] hover:shadow-[0_0_15px_rgba(255,116,32,0.15)] transition-all duration-300 group text-left block">
              <Activity className="w-8 h-8 text-emerald-500 mb-4" />
              <span className="block font-bold text-lg text-white">Seguimiento</span>
              <span className="text-sm text-slate-400">
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