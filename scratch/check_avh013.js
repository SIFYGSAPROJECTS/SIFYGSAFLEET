const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const verificaciones = await prisma.verificacion_Vehicular.findMany({
    where: { Consecutivo: 'AVH-013' }
  });
  console.log(JSON.stringify(verificaciones, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
