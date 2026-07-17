import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { minioClient } from '@/lib/minio';

// Tiempo máximo de ejecución
export const maxDuration = 60; // 60 segundos
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    // Validación de seguridad simple
    // Para producción, se recomienda usar process.env.CRON_SECRET
    const expectedSecret = process.env.CRON_SECRET || 'limpieza123';
    
    if (secret !== expectedSecret) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.info("Iniciando tarea de limpieza de MinIO...");

    // 1. Obtener todas las fotos usadas en la base de datos
    const reportes = await prisma.reporte_Mantenimiento.findMany({
      select: {
        Foto_Antes: true,
        Foto_Despues: true,
        Fotos_Extra: true,
      }
    });

    const dbObjects = new Set<string>();

    reportes.forEach(r => {
      if (r.Foto_Antes && r.Foto_Antes.includes('/mantenimientos-computo/')) {
        dbObjects.add(r.Foto_Antes.split('/mantenimientos-computo/')[1]);
      }
      if (r.Foto_Despues && r.Foto_Despues.includes('/mantenimientos-computo/')) {
        dbObjects.add(r.Foto_Despues.split('/mantenimientos-computo/')[1]);
      }
      if (r.Fotos_Extra && r.Fotos_Extra.includes('/mantenimientos-computo/')) {
        dbObjects.add(r.Fotos_Extra.split('/mantenimientos-computo/')[1]);
      }
    });

    console.info(`Encontradas ${dbObjects.size} fotos activas en la BD.`);

    // 2. Listar todos los objetos en MinIO y comparar
    const bucketName = 'mantenimientos-computo';
    const prefix = 'evidencias/';
    
    // Verificamos si existe la cubeta primero
    const bucketExists = await minioClient.bucketExists(bucketName);
    if (!bucketExists) {
       return NextResponse.json({ message: `La cubeta ${bucketName} no existe aún.` });
    }

    let scannedCount = 0;
    let deletedCount = 0;
    const deletedFiles: string[] = [];

    // listObjectsV2 devuelve un stream
    const stream = minioClient.listObjectsV2(bucketName, prefix, true);
    
    await new Promise<void>((resolve, reject) => {
      stream.on('data', async (obj) => {
        if (!obj.name) return;
        scannedCount++;
        
        // Si el archivo en MinIO NO está en nuestro Set de la base de datos...
        if (!dbObjects.has(obj.name)) {
          try {
            await minioClient.removeObject(bucketName, obj.name);
            deletedCount++;
            deletedFiles.push(obj.name);
            console.log(`Eliminado archivo huérfano: ${obj.name}`);
          } catch (err) {
            console.error(`Error eliminando ${obj.name}:`, err);
          }
        }
      });
      stream.on('error', (err) => reject(err));
      stream.on('end', () => resolve());
    });

    return NextResponse.json({
      message: 'Limpieza completada exitosamente',
      stats: {
        fotosEnBaseDeDatos: dbObjects.size,
        archivosEscaneadosEnMinio: scannedCount,
        archivosHuerfanosEliminados: deletedCount,
        archivos: deletedFiles
      }
    });

  } catch (error) {
    console.error('Error en cron de limpieza MinIO:', error);
    return NextResponse.json({ error: 'Error interno ejecutando la limpieza' }, { status: 500 });
  }
}
