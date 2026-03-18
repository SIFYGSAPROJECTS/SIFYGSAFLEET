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

    //Construimos el nombre completo en lugar de mandar el correo 
    const nombreCompleto = vehiculo.encargado 
      ? `${vehiculo.encargado.Nombre_Empleado} ${vehiculo.encargado.A_Paterno}` 
      : 'Sin asignar';

    return NextResponse.json({
      checklists,
      vehiculoInfo: {
        marca: vehiculo.Marca,
        modelo: vehiculo.Modelo,
        color: vehiculo.Color,
        nombreConductor: nombreCompleto,
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

// --- 3. ELIMINAR CHECKLIST (BD + SUPABASE) ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Falta el ID del checklist' }, { status: 400 });

    // 1. Buscamos el checklist para saber la URL del archivo
    const checklist = await prisma.checklist.findUnique({ where: { id: Number(id) } });
    if (!checklist) return NextResponse.json({ error: 'Checklist no encontrado' }, { status: 404 });

    // 2. Extraemos el nombre del archivo real desde la URL (lo que va después del último "/")
    const nombreArchivo = checklist.Ruta_PDF.split('/').pop();

    // 3. Lo borramos físicamente del "Bucket" de Supabase para ahorrar espacio
    if (nombreArchivo) {
      const { error: storageError } = await supabase.storage.from('checklists').remove([nombreArchivo]);
      if (storageError) console.error("Error borrando de Supabase:", storageError);
    }

    // 4. Lo borramos de la base de datos de Prisma
    await prisma.checklist.delete({ where: { id: Number(id) } });

    return NextResponse.json({ success: true, mensaje: 'Checklist eliminado' });
  } catch (error) {
    console.error("Error DELETE:", error);
    return NextResponse.json({ error: 'Error interno al eliminar' }, { status: 500 });
  }
}

// --- 4. ACTUALIZAR/REEMPLAZAR CHECKLIST (BD + SUPABASE) ---
export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const file = formData.get('file') as File;

    if (!id || !file) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });

    // 1. Buscamos el registro actual
    const checklistViejo = await prisma.checklist.findUnique({ where: { id: Number(id) } });
    if (!checklistViejo) return NextResponse.json({ error: 'Checklist no encontrado' }, { status: 404 });

    // 2. Borramos el archivo VIEJO de Supabase
    const nombreArchivoViejo = checklistViejo.Ruta_PDF.split('/').pop();
    if (nombreArchivoViejo) {
      await supabase.storage.from('checklists').remove([nombreArchivoViejo]);
    }

    // 3. Preparamos y subimos el NUEVO archivo a Supabase
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    // Le ponemos una marca de tiempo nueva para que el navegador no cachee el PDF viejo
    const nombreArchNuevo = `${checklistViejo.Consecutivo.toLowerCase()}-edit-${new Date().getTime()}.pdf`;

    const { error: storageError } = await supabase.storage
      .from('checklists')
      .upload(nombreArchNuevo, buffer, { contentType: file.type });

    if (storageError) throw storageError;

    const { data: { publicUrl } } = supabase.storage
      .from('checklists')
      .getPublicUrl(nombreArchNuevo);

    // 4. Actualizamos el registro en la BD (Mantenemos el título original, solo cambiamos el PDF)
    await prisma.checklist.update({
      where: { id: Number(id) },
      data: { Ruta_PDF: publicUrl }
    });

    return NextResponse.json({ success: true, mensaje: 'Checklist actualizado correctamente' });

  } catch (error) {
    console.error("Error PUT:", error);
    return NextResponse.json({ error: 'Error interno al actualizar' }, { status: 500 });
  }
}