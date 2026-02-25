import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const folio = data.get('folio') as string;

    if (!file || !folio) {
      return NextResponse.json({ error: 'Faltan datos para subir la evidencia' }, { status: 400 });
    }

    // Convertimos el archivo a un formato que Node.js pueda guardar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Le damos un nombre único al PDF para que no se sobreescriban
    const nombreLimpio = file.name.replace(/\s+/g, '_');
    const fileName = `evidencia-${folio}-${Date.now()}-${nombreLimpio}`;
    
    // Lo guardamos en tu carpeta public/uploads
    const filePath = path.join(process.cwd(), 'public/uploads', fileName);
    await writeFile(filePath, buffer);

    // Guardamos la ruta en la base de datos
    const dbPath = `/uploads/${fileName}`;
    const ticketActualizado = await prisma.solicitud.update({
      where: { Pk_folio_ticket: folio },
      data: { Evidencia: dbPath }
    });

    return NextResponse.json({ success: true, path: dbPath });

  } catch (error) {
    console.error('❌ Error al subir evidencia:', error);
    return NextResponse.json({ error: 'Error al subir el archivo al servidor' }, { status: 500 });
  }
}