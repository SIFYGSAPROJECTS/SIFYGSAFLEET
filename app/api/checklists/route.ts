import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/db'; 

// Conexión a Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 1. BUSCADOR DE UNIDAD Y KILOMETRAJE ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const consecutivo = searchParams.get('consecutivo');

    if (!consecutivo) {
      return NextResponse.json({ error: 'Falta el consecutivo' }, { status: 400 });
    }

    // 👇 CAMBIO 1: Agregamos "include" para traer los datos del empleado (encargado) 👇
    const vehiculo = await prisma.inventario_Automoviles.findUnique({
      where: { Consecutivo: consecutivo },
      include: {
        encargado: true // Esto trae Nombre_Empleado, A_Paterno, etc.
      }
    });

    if (!vehiculo) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    // Traemos los checklists guardados
    const checklists = await prisma.checklist.findMany({
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

    // 👇 CAMBIO 2: Construimos el nombre completo en lugar de mandar el correo 👇
    const nombreCompleto = vehiculo.encargado 
      ? `${vehiculo.encargado.Nombre_Empleado} ${vehiculo.encargado.A_Paterno}` 
      : 'Sin asignar';

    return NextResponse.json({
      checklists,
      vehiculoInfo: {
        marca: vehiculo.Marca,
        modelo: vehiculo.Modelo,
        color: vehiculo.Color,
        nombreConductor: nombreCompleto, // 👈 Ahora mandamos el nombre real
        kilometraje: kmFinal 
      }
    });
  } catch (error) {
    console.error("Error GET:", error);
    return NextResponse.json({ error: 'Error al cargar datos' }, { status: 500 });
  }
}

// --- 2. SUBIDA DE PDF CON TÍTULO AUTOMÁTICO ---
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const consecutivo = formData.get('consecutivo') as string;

    if (!file || !consecutivo) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Título automático (Asegúrate de que la fecha sea consistente)
    const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    const fecha = new Date().toLocaleDateString('es-ES', opciones);
    const tituloAuto = `Checklist ${fecha}`;

    const nombreArch = `${consecutivo.toLowerCase()}-${new Date().getTime()}.pdf`;

    const { error: storageError } = await supabase.storage
      .from('checklists')
      .upload(nombreArch, buffer, { contentType: file.type });

    if (storageError) throw storageError;

    const { data: { publicUrl } } = supabase.storage
      .from('checklists')
      .getPublicUrl(nombreArch);

    await prisma.checklist.create({
      data: {
        Consecutivo: consecutivo,
        Titulo: tituloAuto,
        Ruta_PDF: publicUrl
      }
    });

    return NextResponse.json({ mensaje: 'Guardado correctamente' });

  } catch (error) {
    console.error("Error POST:", error);
    return NextResponse.json({ error: 'Error al subir' }, { status: 500 });
  }
}