import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import ServiciosComputoTabs from './ServiciosComputoTabs';

export default async function CentralSoporteTIPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-8">
        <div className="bg-red-900/20 border border-red-900 text-red-500 p-6 rounded-xl font-bold">
          Error: Por favor inicia sesión nuevamente.
        </div>
      </div>
    );
  }

  // 1. Obtener Rol
  const usuario = await prisma.empleados.findUnique({ where: { Email: userEmail } });
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(usuario?.Rol || '');

  // 2. Traer Tickets (Sirve para el Historial y el Seguimiento)
  const condicionTickets = isAdmin ? {} : {
    Email_Empleado: userEmail
  };

  const tickets = await prisma.solicitud_Computo.findMany({
    where: condicionTickets,
    include: { 
      equipo: true,
      empleado: true 
    },
    orderBy: { Fecha_Realizacion: 'desc' }
  });

  // 3. Traer Equipos Asignados (Sirve para la Nueva Orden)
  const condicionEquipos = isAdmin ? {} : { Email_Empleado: userEmail };
  const equipos = await prisma.inventario_Computo.findMany({
    where: condicionEquipos,
    orderBy: { C_Interno: 'asc' }
  });

  return (
    <div className="min-h-screen bg-transparent">
      <div className="pt-2 pb-8 sm:pt-4 sm:pb-8 max-w-[95%] mx-auto relative">
        <ServiciosComputoTabs 
          tickets={tickets} 
          equipos={equipos} 
          isAdmin={isAdmin} 
          rol={usuario?.Rol} 
        />
      </div>
    </div>
  );
}
