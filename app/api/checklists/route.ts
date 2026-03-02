import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/db'; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

// 👇 ESTA ES LA FUNCIÓN QUE FALTABA PARA BUSCAR EL VEHÍCULO 👇
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const consecutivo = searchParams.get('consecutivo');

    if (!consecutivo) {
      return NextResponse.json({ error: 'Falta el consecutivo' }, { status: 400 });
    }

    // 1. Buscamos la unidad
    const vehiculo = await prisma.inventario_Automoviles.findUnique({
      where: { Consecutivo: consecutivo }
    });

    if (!vehiculo) {
      return NextResponse.json({ error: 'Vehículo no encontrado en la base de datos' }, { status: 404 });
    }

    // 2. Buscamos sus checklists
    const checklists = await prisma.checklist.findMany({
      where: { Consecutivo: consecutivo },
      orderBy: { Fecha_Subida: 'desc' }
    });

    return NextResponse.json({
      checklists,
      vehiculoInfo: {
        marca: vehiculo.Marca,
        modelo: vehiculo.Modelo,
        color: vehiculo.Color,
        conductor: vehiculo.Email_encargado || 'Sin asignar',
        kilometraje: 'N/A' // Ajusta esto si tienes el kilometraje en tu tabla
      }
    });
  } catch (error) {
    console.error("Error al buscar:", error);
    return NextResponse.json({ error: 'Error interno al buscar los datos' }, { status: 500 });
  }
}

// 👇 ESTA ES LA FUNCIÓN QUE SUBE EL PDF A SUPABASE 👇
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const consecutivo = formData.get('consecutivo') as string;

    if (!file || !consecutivo) {
      return NextResponse.json({ error: 'Faltan datos (archivo o consecutivo)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generamos el título y nombre automáticos
    const opcionesFecha: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    const fechaTexto = new Date().toLocaleDateString('es-ES', opcionesFecha);
    const tituloGenerado = `Checklist ${fechaTexto}`;
    
    const timestamp = new Date().getTime(); 
    const nombreArchivo = `${consecutivo.toLowerCase()}-checklist-${timestamp}.pdf`;

    // Subimos a Supabase
    const { error: uploadError } = await supabase.storage
      .from('checklists')
      .upload(nombreArchivo, buffer, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('checklists')
      .getPublicUrl(nombreArchivo);

    // Guardamos en BD
    await prisma.checklist.create({
      data: {
        Consecutivo: consecutivo,
        Titulo: tituloGenerado, 
        Ruta_PDF: publicUrl
      }
    });

    return NextResponse.json({ url: publicUrl, mensaje: 'Checklist guardado exitosamente' });

  } catch (error) {
    console.error("Error en el servidor al subir checklist:", error);
    return NextResponse.json({ error: 'Error interno al procesar el documento' }, { status: 500 });
  }
}