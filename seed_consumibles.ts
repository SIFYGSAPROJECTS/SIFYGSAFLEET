import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const productos = [
  "Papel higiénico",
  "Sanitas",
  "Café",
  "Azúcar",
  "Sustituto de crema",
  "Cloro",
  "Fabuloso",
  "Glade",
  "Pastilla azul",
  "Servirrollo",
  "Insecticida",
  "Repelente",
  "Jabón para manos",
  "Desengrasante",
  "Limpia vidrios",
  "Jabón en polvo",
  "Jabón para trastes",
  "Fibra esponja",
  "Pledge",
  "Guantes",
  "Paño microfibra",
  "Escoba",
  "Bolsa 60x90",
  "Bolsa 90x120",
  "Bolsa transparente",
  "Recogedor",
  "Bolsas tipo camisetas",
  "Sal",
  "Alimento para mascotas"
];

async function main() {
  console.log('Buscando edificio Minatitlán...');
  const edificio = await prisma.edificio.findFirst({
    where: { Sucursal: { contains: 'Minatitlán', mode: 'insensitive' } }
  });

  if (!edificio) {
    console.error('No se encontró el edificio Minatitlán en la base de datos.');
    return;
  }

  console.log(`Edificio encontrado: ${edificio.Sucursal} (Id: ${edificio.Id_Edificio})`);

  for (const nombre of productos) {
    const existe = await prisma.consumible.findFirst({
      where: {
        Id_Edificio: edificio.Id_Edificio,
        Nombre: nombre
      }
    });

    if (!existe) {
      console.log(`Agregando: ${nombre}`);
      await prisma.consumible.create({
        data: {
          Id_Edificio: edificio.Id_Edificio,
          Nombre: nombre,
          Tipo: "Limpieza y Despensa",
          Unidad_Medida: "Piezas (pza)",
          Cantidad_Actual: 0,
          Capacidad_Maxima: 100,
          Umbral_Alerta: 10
        }
      });
    } else {
      console.log(`Ya existe: ${nombre}`);
    }
  }

  console.log('Proceso de carga inicial finalizado.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
