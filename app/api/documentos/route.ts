import { NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';
import { prisma } from '@/lib/db';

// --- HELPER PARA ASEGURAR LA EXISTENCIA DEL BUCKET ---
async function ensureBucketExists(bucketName: string) {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:GetObject'],
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    }
  } catch (err) {
    console.error(`Error asegurando bucket ${bucketName}:`, err);
  }
}

// --- 1. BUSCADOR DE UNIDAD Y SUS DOCUMENTOS ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const consecutivo = searchParams.get('consecutivo');

    if (!consecutivo) {
      return NextResponse.json({ error: 'Falta el consecutivo' }, { status: 400 });
    }

    const vehiculo = await prisma.inventario_Automoviles.findUnique({
      where: { Consecutivo: consecutivo },
      include: {
        encargado: true
      }
    });

    if (!vehiculo) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    // Traemos los documentos guardados
    const documentos = await prisma.documentos_Unidad.findMany({
      where: { Consecutivo: consecutivo },
      orderBy: { Fecha_Subida: 'desc' }
    });

    const ultimaSolicitud = await prisma.solicitud.findFirst({
      where: { 
        auto: { 
          Consecutivo: consecutivo 
        } 
      },
      orderBy: { 
        Fecha_Realizacion: 'desc' 
      },
      select: { 
        Kilometraje: true 
      }
    });

    const kmFinal = ultimaSolicitud?.Kilometraje 
      ? `${ultimaSolicitud.Kilometraje.toLocaleString()} km` 
      : 'Sin registros';

    const nombreCompleto = vehiculo.encargado 
      ? `${vehiculo.encargado.Nombre_Empleado} ${vehiculo.encargado.A_Paterno}` 
      : 'Sin asignar';

    return NextResponse.json({
      documentos,
      vehiculoInfo: {
        marca: vehiculo.Marca,
        modelo: vehiculo.Modelo,
        color: vehiculo.Color,
        placas: vehiculo.Placa || '',
        nombreConductor: nombreCompleto,
        kilometraje: kmFinal 
      }
    });
  } catch (error) {
    console.error("Error GET documentos:", error);
    return NextResponse.json({ error: 'Error al cargar datos' }, { status: 500 });
  }
}

// --- 2. SUBIDA DE PDF CON TÍTULO INGRESADO POR EL ADMIN ---
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const consecutivo = formData.get('consecutivo') as string;
    const titulo = formData.get('titulo') as string;

    if (!file || !consecutivo || !titulo) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Aseguramos la existencia del bucket en caliente
    await ensureBucketExists('documentos');

    // Guardamos en MinIO con nombre único
    const nombreArch = `${consecutivo.toLowerCase()}-${new Date().getTime()}.pdf`;

    await minioClient.putObject('documentos', nombreArch, buffer, file.size, { 'Content-Type': file.type });

    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const minioHost = process.env.MINIO_ENDPOINT;
    const minioPort = process.env.MINIO_PORT === '80' || process.env.MINIO_PORT === '443' ? '' : `:${process.env.MINIO_PORT}`;
    const publicUrl = `${protocol}://${minioHost}${minioPort}/documentos/${nombreArch}`;

    const nuevoDoc = await prisma.documentos_Unidad.create({
      data: {
        Consecutivo: consecutivo,
        Titulo: titulo,
        Ruta_PDF: publicUrl
      }
    });

    return NextResponse.json({ mensaje: 'Documento guardado correctamente', documento: nuevoDoc });

  } catch (error) {
    console.error("Error POST documentos:", error);
    return NextResponse.json({ error: 'Error al subir el documento' }, { status: 500 });
  }
}

// --- 3. ELIMINAR DOCUMENTO (BD + MINIO) ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Falta el ID del documento' }, { status: 400 });

    const documento = await prisma.documentos_Unidad.findUnique({ where: { id: Number(id) } });
    if (!documento) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });

    // Borramos de MinIO
    if (documento.Ruta_PDF.includes('/documentos/')) {
       const parts = documento.Ruta_PDF.split('/documentos/');
       if (parts.length > 1) {
         const nombreArchivo = parts[1];
         await minioClient.removeObject('documentos', nombreArchivo).catch(console.error);
       }
    }

    // Borramos de la BD
    await prisma.documentos_Unidad.delete({ where: { id: Number(id) } });

    return NextResponse.json({ success: true, mensaje: 'Documento eliminado' });
  } catch (error) {
    console.error("Error DELETE documentos:", error);
    return NextResponse.json({ error: 'Error interno al eliminar' }, { status: 500 });
  }
}

// --- 4. REEMPLAZAR ARCHIVO DE DOCUMENTO ---
export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const file = formData.get('file') as File;

    if (!id || !file) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });

    const documentoViejo = await prisma.documentos_Unidad.findUnique({ where: { id: Number(id) } });
    if (!documentoViejo) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });

    // Borramos el viejo archivo de MinIO
    if (documentoViejo.Ruta_PDF.includes('/documentos/')) {
      const parts = documentoViejo.Ruta_PDF.split('/documentos/');
      if (parts.length > 1) {
         const nombreArchivoViejo = parts[1];
         await minioClient.removeObject('documentos', nombreArchivoViejo).catch(console.error);
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Aseguramos la existencia del bucket en caliente
    await ensureBucketExists('documentos');
    
    const nombreArchNuevo = `${documentoViejo.Consecutivo.toLowerCase()}-edit-${new Date().getTime()}.pdf`;

    await minioClient.putObject('documentos', nombreArchNuevo, buffer, file.size, { 'Content-Type': file.type });

    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const minioHost = process.env.MINIO_ENDPOINT;
    const minioPort = process.env.MINIO_PORT === '80' || process.env.MINIO_PORT === '443' ? '' : `:${process.env.MINIO_PORT}`;
    const publicUrl = `${protocol}://${minioHost}${minioPort}/documentos/${nombreArchNuevo}`;

    await prisma.documentos_Unidad.update({
      where: { id: Number(id) },
      data: { Ruta_PDF: publicUrl }
    });

    return NextResponse.json({ success: true, mensaje: 'Documento actualizado correctamente' });

  } catch (error) {
    console.error("Error PUT documentos:", error);
    return NextResponse.json({ error: 'Error interno al actualizar' }, { status: 500 });
  }
}
