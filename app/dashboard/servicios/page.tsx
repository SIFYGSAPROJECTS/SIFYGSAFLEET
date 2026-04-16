import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import ServiciosTabs from './ServiciosTabs';

export default async function CentralServiciosPage() {
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
  const isAdmin = usuario?.Rol === 'ADMIN';

  // 2. Traer Tickets (Sirve para el Historial y el Seguimiento)
  const condicionTickets = isAdmin ? {} : {
    OR: [
      { Email_Empleado: userEmail },
      { auto: { Email_encargado: userEmail } }
    ]
  };

  const tickets = await prisma.solicitud.findMany({
    where: condicionTickets,
    include: { auto: true, empleado: true },
    orderBy: { Fecha_Realizacion: 'desc' }
  });

  // 3. Traer Vehículos (Sirve para la Nueva Orden)
  const condicionVehiculos = isAdmin ? {} : { Email_encargado: userEmail };
  const vehiculosRaw = await prisma.inventario_Automoviles.findMany({
    where: { ...condicionVehiculos, Estado_Unidad: true },
    include: {
      solicitudes: { orderBy: { Fecha_Realizacion: 'desc' }, take: 1, select: { Kilometraje: true } }
    },
    orderBy: { Marca: 'asc' }
  });

  const misVehiculos = vehiculosRaw.map(auto => ({
    ...auto,
    Kilometraje_Actual: auto.solicitudes && auto.solicitudes.length > 0 ? auto.solicitudes[0].Kilometraje : 0
  }));

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <ServiciosTabs 
          tickets={tickets} 
          vehiculos={misVehiculos} 
          isAdmin={isAdmin} 
          rol={usuario?.Rol} 
        />
      </div>
    </div>
  );
}