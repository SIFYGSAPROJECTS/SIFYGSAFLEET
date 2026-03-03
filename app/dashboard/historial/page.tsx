import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import HistorialClient from './HistorialClient';

export default async function HistorialPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  if (!userEmail) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="bg-red-900/20 border border-red-900 text-red-500 p-6 rounded-xl shadow-lg font-bold">
          Error: No has iniciado sesión
        </div>
      </div>
    );
  }

  const usuario = await prisma.empleados.findUnique({
    where: { Email: userEmail }
  });

  const condicionDeBusqueda = usuario?.Rol === 'ADMIN' 
    ? {} 
    : {
        OR: [
          { Email_Empleado: userEmail },
          { auto: { Email_encargado: userEmail } }
        ]
      };

  const historial = await prisma.solicitud.findMany({
    where: condicionDeBusqueda,
    include: { 
      auto: true,      
      empleado: true   
    },
    orderBy: { Fecha_Realizacion: 'desc' }
  });

  // 👇 Ahora solo mandamos llamar al cliente dentro del fondo negro
  return (
    <div className="min-h-screen bg-black">
      <div className="p-8 max-w-7xl mx-auto">
        <HistorialClient historial={historial} rol={usuario?.Rol} />
      </div>
    </div>
  );
}