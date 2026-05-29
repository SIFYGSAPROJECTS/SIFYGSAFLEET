const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tickets = await prisma.solicitud.findMany({
    orderBy: { Fecha_Realizacion: 'desc' },
    take: 5
  });
  console.log(tickets);
}

main().catch(console.error).finally(() => prisma.$disconnect());
