import { NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';
import { prisma } from '@/lib/db'; 

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folio = formData.get('folio') as string;
    const c_interno = formData.get('c_interno') as string;

    if (!file || !folio || !c_interno) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extension = file.name.split('.').pop() || 'png';
    const nombreArchivo = `computo-${c_interno.toLowerCase()}-${folio}-${new Date().getTime()}.${extension}`;

    // Subir a Minio
    await minioClient.putObject('evidencias', nombreArchivo, buffer, file.size, { 'Content-Type': file.type });

    // Construir la URL pública
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const minioHost = process.env.MINIO_ENDPOINT;
    const minioPort = process.env.MINIO_PORT === '80' || process.env.MINIO_PORT === '443' ? '' : `:${process.env.MINIO_PORT}`;
    const publicUrl = `${protocol}://${minioHost}${minioPort}/evidencias/${nombreArchivo}`;

    // Buscar el ticket actual para anexar el link a la descripción
    const ticket = await prisma.solicitud_Computo.findUnique({
      where: { Pk_folio_ticket: folio }
    });

    if (ticket) {
      const nuevaDescripcion = `${ticket.Descripcion}\n\n[Evidencia Fotográfica: ${publicUrl}]`;
      
      await prisma.solicitud_Computo.update({
        where: { Pk_folio_ticket: folio },
        data: { Descripcion: nuevaDescripcion }
      });
    }

    return NextResponse.json({ url: publicUrl, mensaje: 'Evidencia de Cómputo guardada exitosamente' });
  } catch (error) {
    console.error("Error POST Evidencia Cómputo:", error);
    return NextResponse.json({ error: 'Error interno al subir evidencia' }, { status: 500 });
  }
}
