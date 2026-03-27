import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ruta = searchParams.get('ruta'); 

  if (!ruta) {
    return new NextResponse("Ruta del archivo no proporcionada", { status: 400 });
  }

  // Extraemos solo el nombre final del archivo por seguridad
  const nombreArchivo = ruta.split('/').pop(); 
  // Armamos la ruta física exacta en tu computadora
  const filePath = path.join(process.cwd(), 'public/uploads/checklists', nombreArchivo || '');

  try {
    // Leemos el archivo físico
    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${nombreArchivo}"`, 
      },
    });
  } catch (error) {
    console.error("No se encontró el PDF:", filePath);
    return new NextResponse("El archivo no existe o fue movido.", { status: 404 });
  }
}