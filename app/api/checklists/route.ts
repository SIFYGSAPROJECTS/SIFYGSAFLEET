import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const consecutivo = data.get('consecutivo') as string;

    if (!file || !consecutivo) {
      return NextResponse.json({ error: "Faltan datos (PDF o Consecutivo)" }, { status: 400 });
    }

    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const hoy = new Date();
    const tituloAutomatico = `${consecutivo} - ${hoy.getDate()} de ${meses[hoy.getMonth()]}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uniqueName = `${consecutivo}-${Date.now()}.pdf`;
    
    const folderPath = path.join(process.cwd(), 'public/uploads/checklists');
    const filepath = path.join(folderPath, uniqueName);

    await mkdir(folderPath, { recursive: true });
    await writeFile(filepath, buffer);

    const nuevoChecklist = await prisma.checklist.create({
      data: {
        Consecutivo: consecutivo,
        Titulo: tituloAutomatico,
        Ruta_PDF: `/uploads/checklists/${uniqueName}`
      }
    });

    return NextResponse.json({ success: true, checklist: nuevoChecklist });
  } catch (error) {
    console.error("Error en POST:", error);
    return NextResponse.json({ error: "Hubo un problema al procesar el archivo" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const consecutivo = searchParams.get('consecutivo');

    if (!consecutivo) return NextResponse.json({ error: "Falta consecutivo" }, { status: 400 });

    // 1. Buscamos el auto CON su conductor y su última solicitud (para el kilometraje)
    const autoExiste = await prisma.inventario_Automoviles.findUnique({
      where: { Consecutivo: consecutivo },
      include: {
        encargado: true, // Trae los datos del empleado
        solicitudes: {
          orderBy: { Fecha_Realizacion: 'desc' }, // Ordena de la más nueva a la más vieja
          take: 1, // Solo trae la última
          select: { Kilometraje: true }
        }
      }
    });

    if (!autoExiste) {
      return NextResponse.json({ error: "Este vehículo no existe en tu inventario." }, { status: 404 });
    }

    // 2. Buscamos sus PDFs
    const checklists = await prisma.checklist.findMany({
      where: { Consecutivo: consecutivo },
      orderBy: { Fecha_Subida: 'desc' }
    });

    // 3. Calculamos el último kilometraje
    let ultimoKilometraje = "Sin registro";
    if (autoExiste.solicitudes.length > 0 && autoExiste.solicitudes[0].Kilometraje) {
      ultimoKilometraje = `${autoExiste.solicitudes[0].Kilometraje.toLocaleString()} km`;
    }

    // 4. Preparamos la "Ficha Técnica" para mandarla a la pantalla
    const vehiculoInfo = {
      marca: autoExiste.Marca || "No definida",
      modelo: autoExiste.Modelo || "",
      color: autoExiste.Color || "Sin color",
      conductor: autoExiste.encargado ? `${autoExiste.encargado.Nombre_Empleado} ${autoExiste.encargado.A_Paterno}` : "Sin asignar",
      kilometraje: ultimoKilometraje
    };

    // Devolvemos tanto los PDFs como la información del auto
    return NextResponse.json({ checklists, vehiculoInfo });
  } catch (error) {
    console.error("Error en GET:", error);
    return NextResponse.json({ error: "Error al buscar datos" }, { status: 500 });
  }
}