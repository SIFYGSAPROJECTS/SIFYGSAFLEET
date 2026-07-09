import { PrismaClient } from '@prisma/client';
import { openClawAuditor } from './ai/openclaw';
import { cookies } from 'next/headers';

const createPrismaClient = () => {
  return new PrismaClient().$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const result = await query(args);

          // Auditar solo operaciones de escritura/mutación
          const mutationOperations = ['create', 'update', 'delete', 'upsert', 'createMany', 'updateMany', 'deleteMany'];
          
          if (mutationOperations.includes(operation) && model !== 'Bitacora_Auditoria') {
            // No usamos await aquí para no bloquear la respuesta de la petición original
            (async () => {
              try {
                let userEmail = 'Sistema';
                // Intentamos obtener el usuario desde las cookies (solo funciona en contexto HTTP de Next)
                try {
                  const cookieStore = await cookies();
                  const cookieValue = cookieStore.get('user_email')?.value;
                  if (cookieValue) {
                    userEmail = cookieValue;
                  }
                } catch (cookieError) {
                  // Fallback silencioso: ejecutado fuera de un request (ej. script de background)
                }

                // Creamos un payload JSON crudo para que OpenClaw lo analice
                const rawPayload = JSON.stringify({
                  message: `Operación ${operation.toUpperCase()} a nivel de base de datos en tabla ${model}`,
                  changes: (args as any)?.data || args, 
                });

                await openClawAuditor(
                  userEmail,
                  `DB_${operation.toUpperCase()}`,
                  model || 'BASE_DE_DATOS',
                  rawPayload
                );
              } catch (auditError) {
                console.error('[Global Audit Hook] Error registrando auditoría:', auditError);
              }
            })();
          }

          return result;
        },
      },
    },
  });
};

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = global as unknown as { prisma: ExtendedPrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;