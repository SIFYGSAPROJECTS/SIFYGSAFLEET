import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import DocumentosComputoClient from './DocumentosComputoClient';

export default async function DocumentosComputoPage() {
  const cookieStore = await cookies();
  const userRole = cookieStore.get('user_role')?.value;
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(userRole || '');

  const equiposDB = await prisma.inventario_Computo.findMany({
    select: {
      C_Interno: true,
      Service_Tag: true,
      Usuario: true,
    },
    orderBy: {
      C_Interno: 'asc'
    }
  });

  const equiposMapeados = equiposDB.map((e) => ({
    C_Interno: e.C_Interno,
    Service_Tag: e.Service_Tag || '',
    Usuario: e.Usuario || 'Sin Asignar'
  }));

  return <DocumentosComputoClient equipos={equiposMapeados} isAdmin={isAdmin} />;
}
