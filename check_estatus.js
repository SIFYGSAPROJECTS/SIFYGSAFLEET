const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const counts = await prisma.inventario_Computo.groupBy({
    by: ['Estatus'],
    _count: {
      Estatus: true,
    },
  });
  console.log(counts);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
