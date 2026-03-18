import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/db'; 

// Conexión a Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

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

    const { error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(nombreArchivo, buffer, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('evidencias')
      .getPublicUrl(nombreArchivo);

    await prisma.solicitud.update({
      where: { Pk_folio_ticket: folio },
      data: { Evidencia: publicUrl }
    });

    return NextResponse.json({ url: publicUrl, mensaje: 'Evidencia guardada exitosamente' });
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

    // 2. Si ya tenía un PDF, lo borramos de Supabase físicamente
    if (solicitud.Evidencia) {
      const nombreViejo = solicitud.Evidencia.split('/').pop();
      if (nombreViejo) {
        await supabase.storage.from('evidencias').remove([nombreViejo]);
      }
    }

    // 3. Subimos el NUEVO archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const nombreNuevo = `${solicitud.auto?.Consecutivo.toLowerCase() || 'unidad'}-${folio}-${new Date().getTime()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(nombreNuevo, buffer, { contentType: file.type });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('evidencias')
      .getPublicUrl(nombreNuevo);

    // 4. Actualizamos el link en la BD
    await prisma.solicitud.update({
      where: { Pk_folio_ticket: folio },
      data: { Evidencia: publicUrl }
    });

    return NextResponse.json({ mensaje: 'Evidencia actualizada' });
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

    // 2. Borramos de Supabase
    const nombreArchivo = solicitud.Evidencia.split('/').pop();
    if (nombreArchivo) {
      await supabase.storage.from('evidencias').remove([nombreArchivo]);
    }

    // 3. Limpiamos el campo en Prisma (poniéndolo en null)
    await prisma.solicitud.update({
      where: { Pk_folio_ticket: folio },
      data: { Evidencia: null }
    });

    return NextResponse.json({ mensaje: 'Evidencia eliminada correctamente' });
  } catch (error) {
    console.error("Error DELETE Evidencia:", error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}