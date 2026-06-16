import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import UsuariosTabs from './UsuariosTabs';

export default async function CentroUsuariosPage() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole);

  // Solo traemos todos los empleados si es administrador
  const empleados = isAdmin 
    ? await prisma.empleados.findMany({ orderBy: { Nombre_Empleado: 'asc' } })
    : [];

  return (
    <div className="min-h-screen bg-transparent">
      <div className="pt-2 pb-8 sm:pt-4 sm:pb-8 max-w-[95%] mx-auto relative">
        <UsuariosTabs 
          isAdmin={isAdmin} 
          empleadosIniciales={empleados} 
        />
      </div>
    </div>
  );
}