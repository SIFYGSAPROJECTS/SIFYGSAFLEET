import { NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';
import { prisma } from '@/lib/db'; 

// --- 1. SUBIR EVIDENCIA NUEVA ---
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folio = formData.get('folio') as string;
    const consecutivo = formData.get('consecutivo') as string;

    if (!file || !folio || !consecutivo) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Nombre: unidad + fecha + timestamp para evitar duplicados exactos
    const nombreArchivo = `${consecutivo.toLowerCase()}-${folio}-${new Date().getTime()}.pdf`;

    // Subir a Minio
    await minioClient.putObject('evidencias', nombreArchivo, buffer, file.size, { 'Content-Type': file.type });

    // Construir la URL pública (ya que los buckets serán públicos en acceso de lectura)
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const minioHost = process.env.MINIO_ENDPOINT;
    const minioPort = process.env.MINIO_PORT === '80' || process.env.MINIO_PORT === '443' ? '' : `:${process.env.MINIO_PORT}`;
    const publicUrl = `${protocol}://${minioHost}${minioPort}/evidencias/${nombreArchivo}`;

    await prisma.solicitud.update({
      where: { Pk_folio_ticket: folio },
      data: { Evidencia: publicUrl }
    });

    return NextResponse.json({ url: publicUrl, mensaje: 'Evidencia guardada exitosamente en MinIO' });
  } catch (error) {
    console.error("Error POST Evidencia:", error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// --- 2. REEMPLAZAR EVIDENCIA (EDICIÓN) ---
export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folio = formData.get('folio') as string;

    if (!file || !folio) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    // 1. Buscamos el registro actual para saber qué archivo borrar de la nube
    const solicitud = await prisma.solicitud.findUnique({
      where: { Pk_folio_ticket: folio },
      select: { Evidencia: true, auto: { select: { Consecutivo: true } } }
    });

    if (!solicitud) return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });

    // 2. Si ya tenía un PDF, lo borramos de MinIO
    if (solicitud.Evidencia && solicitud.Evidencia.includes('/evidencias/')) {
      const parts = solicitud.Evidencia.split('/evidencias/');
      if (parts.length > 1) {
        const nombreViejo = parts[1];
        await minioClient.removeObject('evidencias', nombreViejo).catch(console.error);
      }
    }

    // 3. Subimos el NUEVO archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const nombreNuevo = `${solicitud.auto?.Consecutivo.toLowerCase() || 'unidad'}-${folio}-${new Date().getTime()}.pdf`;

    await minioClient.putObject('evidencias', nombreNuevo, buffer, file.size, { 'Content-Type': file.type });

    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const minioHost = process.env.MINIO_ENDPOINT;
    const minioPort = process.env.MINIO_PORT === '80' || process.env.MINIO_PORT === '443' ? '' : `:${process.env.MINIO_PORT}`;
    const publicUrl = `${protocol}://${minioHost}${minioPort}/evidencias/${nombreNuevo}`;

    // 4. Actualizamos el link en la BD
    await prisma.solicitud.update({
      where: { Pk_folio_ticket: folio },
      data: { Evidencia: publicUrl }
    });

    return NextResponse.json({ mensaje: 'Evidencia actualizada en MinIO' });
  } catch (error) {
    console.error("Error PUT Evidencia:", error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

// --- 3. ELIMINAR EVIDENCIA ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const folio = searchParams.get('folio');

    if (!folio) return NextResponse.json({ error: 'Falta el folio' }, { status: 400 });

    // 1. Buscamos el registro
    const solicitud = await prisma.solicitud.findUnique({
      where: { Pk_folio_ticket: folio },
      select: { Evidencia: true }
    });

    if (!solicitud || !solicitud.Evidencia) {
      return NextResponse.json({ error: 'No hay evidencia para eliminar' }, { status: 404 });
    }

    // 2. Borramos de MinIO
    if (solicitud.Evidencia.includes('/evidencias/')) {
       const parts = solicitud.Evidencia.split('/evidencias/');
       if (parts.length > 1) {
         const nombreArchivo = parts[1];
         await minioClient.removeObject('evidencias', nombreArchivo).catch(console.error);
       }
    }

    // 3. Limpiamos el campo en Prisma (poniéndolo en null)
    await prisma.solicitud.update({
      where: { Pk_folio_ticket: folio },
      data: { Evidencia: null }
    });

    return NextResponse.json({ mensaje: 'Evidencia eliminada correctamente de MinIO' });
  } catch (error) {
    console.error("Error DELETE Evidencia:", error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}