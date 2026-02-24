import TicketForm from './TicketForm';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function NuevoTicketPage() {
  // 1. Identificamos quién está usando el sistema
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  if (!userEmail) {
    return <div className="p-8 text-center text-red-500">Error: No has iniciado sesión</div>;
  }

  // 2. Buscamos el rol del usuario
  const usuario = await prisma.empleados.findUnique({
    where: { Email: userEmail }
  });

  // 3. Filtro inteligente de vehículos
  const condicionDeBusqueda = usuario?.Rol === 'ADMIN' 
    ? {} 
    : { Email_encargado: userEmail };

  const misVehiculos = await prisma.inventario_Automoviles.findMany({
    where: condicionDeBusqueda,
    orderBy: { Marca: 'asc' } 
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        
        {/* --- NUEVO BOTÓN DE REGRESO --- */}
        <Link href="/dashboard" className="text-slate-500 hover:text-blue-600 flex items-center gap-1 text-sm mb-4 w-fit transition-colors">
          <ArrowLeft size={16} /> Volver al Panel de Inicio
        </Link>
        {/* ------------------------------ */}

        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Programar Mantenimiento</h1>
        <p className="text-sm text-slate-500 mt-1">
          {usuario?.Rol === 'ADMIN' 
            ? '👑 Eres Administrador: Puedes agendar servicio para cualquier unidad de la flota.' 
            : '🚗 Solo puedes solicitar servicio para las unidades que tienes asignadas.'}
        </p>
      </div>

      {misVehiculos.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-6 rounded-xl text-center">
          <p className="font-bold text-lg mb-2">No tienes vehículos asignados</p>
          <p className="text-sm">Contacta a tu administrador para que te asigne una unidad antes de solicitar mantenimiento.</p>
        </div>
      ) : (
        <TicketForm vehiculos={misVehiculos} />
      )}
    </div>
  );
}