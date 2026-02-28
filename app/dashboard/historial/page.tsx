import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import HistorialClient from './HistorialClient'; // Conectamos con el nuevo archivo

export default async function HistorialPage() {
  // 1. Identificamos al usuario
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  if (!userEmail) {
    return <div className="p-8 text-center text-red-500">Error: No has iniciado sesión</div>;
  }

  // 2. Buscamos si es ADMIN o USER
  const usuario = await prisma.empleados.findUnique({
    where: { Email: userEmail }
  });

  // 3. EL FILTRO DE SEGURIDAD
  const condicionDeBusqueda = usuario?.Rol === 'ADMIN' 
    ? {} 
    : {
        OR: [
          { Email_Empleado: userEmail },
          { auto: { Email_encargado: userEmail } }
        ]
      };

  // 4. Traemos TODOS los tickets
  const historial = await prisma.solicitud.findMany({
    where: condicionDeBusqueda,
    include: { 
      auto: true,      
      empleado: true   
    },
    orderBy: { Fecha_Realizacion: 'desc' }
  });

  // 5. ¡Le pasamos los datos a la pantalla interactiva!
  return <HistorialClient historial={historial} rol={usuario?.Rol} />;
}