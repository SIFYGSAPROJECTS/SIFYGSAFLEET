import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import ChecklistsClient from './ChecklistsClient';

export default async function ChecklistsPage() {
  const cookieStore = await cookies();
  const isAdmin = ['ADMIN', 'GERENCIAL'].includes(cookieStore.get('user_role')?.value || '');

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

  return <ChecklistsClient vehiculos={vehiculosMapeados} isAdmin={isAdmin} />;
}