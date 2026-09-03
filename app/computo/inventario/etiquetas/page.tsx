import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import EtiquetasQRClient from './EtiquetasQRClient';

export const metadata = {
  title: "Generador de Calcomanías QR para Equipos | SIFYGSA",
  description: "Impresión de etiquetas QR para soporte y mantenimientos de cómputo.",
};

export default async function EtiquetasQRPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;

  if (!userEmail) {
    redirect('/');
  }

  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;

  if (!isAdmin) {
    redirect('/computo/inventario');
  }

  const equipos = await prisma.inventario_Computo.findMany({
    where: {
      Estatus: { not: 'Baja' }
    },
    select: {
      C_Interno: true,
      Marca: true,
      Modelo: true,
      Service_Tag: true,
      Departamento: true,
      Usuario: true,
      Estatus: true,
    },
    orderBy: { C_Interno: 'asc' }
  });

  return <EtiquetasQRClient equipos={equipos} />;
}
