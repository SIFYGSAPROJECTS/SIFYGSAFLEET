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
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="bg-red-900/20 border border-red-900 text-red-500 p-6 rounded-xl text-center shadow-lg">
          Error: No has iniciado sesión
        </div>
      </div>
    );
  }

  // 2. Buscamos el rol del usuario
  const usuario = await prisma.empleados.findUnique({
    where: { Email: userEmail }
  });

  // 3. Filtro inteligente de vehículos
  const condicionDeBusqueda = usuario?.Rol === 'ADMIN' 
    ? {} 
    : { Email_encargado: userEmail };

  // 🌟 CONSULTA CORREGIDA: Cambiamos 'Solicitud' por 'solicitudes' 🌟
  const vehiculosRaw = await prisma.inventario_Automoviles.findMany({
    where: {
      ...condicionDeBusqueda,
      Estado_Unidad: true 
    },
    include: {
      solicitudes: { // 👈 Nombre exacto según tu esquema
        orderBy: { Fecha_Realizacion: 'desc' },
        take: 1,
        select: { Kilometraje: true }
      }
    },
    orderBy: { Marca: 'asc' } 
  });

  // 🌟 FORMATEO CORREGIDO: También usamos 'solicitudes' aquí
  const misVehiculos = vehiculosRaw.map(auto => ({
    ...auto,
    Kilometraje_Actual: auto.solicitudes && auto.solicitudes.length > 0 
      ? auto.solicitudes[0].Kilometraje 
      : 0
  }));

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          
          <Link href="/dashboard" className="text-slate-400 hover:text-[#FF7420] flex items-center gap-2 text-sm mb-6 w-fit transition-colors">
            <ArrowLeft size={16} /> Volver al Panel de Inicio
          </Link>

          <h1 className="text-3xl font-black text-white tracking-tight">Programar Mantenimiento</h1>
          <p className="text-sm text-slate-400 mt-2">
            {usuario?.Rol === 'ADMIN' 
              ? <><span className="text-[#FF7420] font-bold"> Administrador:</span> Puedes agendar servicio para cualquier unidad de la flota.</> 
              : <><span className="text-[#FF7420] font-bold"> Usuario:</span> Solo puedes solicitar servicio para las unidades que tienes asignadas.</>}
          </p>
        </div>

        {misVehiculos.length === 0 ? (
          <div className="bg-[#FF7420]/10 border border-[#FF7420]/30 text-[#FF7420] p-6 rounded-xl text-center shadow-lg">
            <p className="font-bold text-lg mb-2">No tienes vehículos asignados</p>
            <p className="text-sm text-slate-300">Contacta a tu administrador para que te asigne una unidad antes de solicitar mantenimiento.</p>
          </div>
        ) : (
          <TicketForm vehiculos={misVehiculos} />
        )}
      </div>
    </div>
  );
}