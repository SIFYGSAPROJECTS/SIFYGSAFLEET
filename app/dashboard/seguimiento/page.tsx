import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Activity } from 'lucide-react';
import SeguimientoClient from './SeguimientoClient'; // El componente que maneja la memoria temporal

export default async function SeguimientoPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  // 1. Verificación de Seguridad
  if (!userEmail) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="bg-red-900/20 border border-red-900 text-red-500 p-6 rounded-xl font-bold font-mono uppercase tracking-tighter">
          Error de sesión: Por favor inicia sesión nuevamente.
        </div>
      </div>
    );
  }

  // 2. Obtención de Rol y Datos
  const usuario = await prisma.empleados.findUnique({ where: { Email: userEmail } });
  const isAdmin = usuario?.Rol === 'ADMIN';

  const condicionDeBusqueda = isAdmin 
    ? {} 
    : {
        OR: [
          { Email_Empleado: userEmail },
          { auto: { Email_encargado: userEmail } }
        ]
      };

  const tickets = await prisma.solicitud.findMany({
    where: condicionDeBusqueda,
    include: { 
      auto: true, 
      empleado: true 
    },
    orderBy: { Fecha_Realizacion: 'desc' }
  });

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-5xl mx-auto p-8">
        
        {/* ENCABEZADO PREMIUM DARK */}
        <div className="mb-10">
          <Link href="/dashboard" className="text-slate-400 hover:text-[#6366F1] flex items-center gap-2 text-sm mb-6 w-fit transition-colors font-medium">
            <ArrowLeft size={16} /> Volver al Panel Maestro
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="text-[#6366F1]" size={32} /> Seguimiento de Unidades
          </h1>
          <p className="text-slate-400 mt-2 font-medium">
            {isAdmin 
              ? ' Panel Maestro: Controla los 4 estatus y gestiona las citas de mantenimiento.' 
              : ' Centro de Rastreo: Consulta en tiempo real la etapa de tu unidad asignada.'}
          </p>
        </div>

        {/* 3. Renderizado del Cliente */}
        {tickets.length === 0 ? (
          <div className="bg-slate-900 p-12 rounded-xl border border-slate-800 text-center text-slate-500 font-bold shadow-2xl">
            NO HAY UNIDADES EN MANTENIMIENTO ACTUALMENTE 
          </div>
        ) : (
          /* Pasamos los datos al componente de cliente. 
             SeguimientoClient se encargará de mostrar los botones de 
             confirmación/cancelación y de manejar la visualización para el empleado.
          */
          <SeguimientoClient ticketsIniciales={tickets} isAdmin={isAdmin} />
        )}

      </div>
    </div>
  );
}