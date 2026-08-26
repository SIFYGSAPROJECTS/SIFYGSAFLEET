const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all distinct providers...');
  const gastos = await prisma.programacion_Semanal.findMany({
    select: { Proveedor: true },
    where: { Proveedor: { not: '' } }
  });

  const rawProveedores = gastos.map(g => g.Proveedor).filter(Boolean);
  
  // Normalize and deduplicate
  const uniqueNormalized = new Map();
  for (const p of rawProveedores) {
    const normalized = p.trim().replace(/\s+/g, ' ').toUpperCase();
    if (!uniqueNormalized.has(normalized)) {
      uniqueNormalized.set(normalized, p.trim().toUpperCase()); // Store as Uppercase to standardize
    }
  }

  console.log(`Found ${uniqueNormalized.size} unique normalized providers.`);

  let insertedCount = 0;
  for (const [normalized, upperName] of uniqueNormalized.entries()) {
    try {
      await prisma.catalogo_Proveedores.upsert({
        where: { Nombre: upperName },
        update: {},
        create: {
          Nombre: upperName,
          Estatus: 'Activo'
        }
      });
      insertedCount++;
    } catch (e) {
      console.error(`Failed to insert ${upperName}:`, e.message);
    }
  }

  console.log(`Successfully inserted/verified ${insertedCount} providers.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
