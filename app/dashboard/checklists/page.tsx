import { prisma } from '@/lib/db';
import ChecklistsClient from './ChecklistsClient';

export default async function ChecklistsPage() {
  const vehiculosDB = await prisma.inventario_Automoviles.findMany({
    select: {
      Consecutivo: true, 
      Placa: true,       
    },
    orderBy: {
      Consecutivo: 'asc' 
    }
  });

  // 2. Traducimos los nombres para que el Buscador del Cliente los entienda
  const vehiculosMapeados = vehiculosDB.map((v) => ({
    id_Vehiculo: v.Consecutivo, 
    Num_Eco: v.Consecutivo,     
    Placas: v.Placa || ''       
  }));

  return <ChecklistsClient vehiculos={vehiculosMapeados} />;
}