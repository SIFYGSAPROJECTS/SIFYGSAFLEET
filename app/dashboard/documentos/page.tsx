import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import DocumentosClient from './DocumentosClient';

export default async function DocumentosPage() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get('user_role')?.value === 'ADMIN';

  const vehiculosDB = await prisma.inventario_Automoviles.findMany({
    select: {
      Consecutivo: true, 
      Placa: true,       
    },
    orderBy: {
      Consecutivo: 'asc' 
    }
  });

  const vehiculosMapeados = vehiculosDB.map((v) => ({
    id_Vehiculo: v.Consecutivo, 
    Num_Eco: v.Consecutivo,     
    Placas: v.Placa || ''       
  }));

  return <DocumentosClient vehiculos={vehiculosMapeados} isAdmin={isAdmin} />;
}
