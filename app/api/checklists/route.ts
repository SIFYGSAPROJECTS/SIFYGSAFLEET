import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/db'; 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; 
const supabase = createClient(supabaseUrl, supabaseKey);

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

    // 1. Generamos el título automático con la fecha (Ej: "Checklist 2 de marzo")
    const opcionesFecha: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    const fechaTexto = new Date().toLocaleDateString('es-ES', opcionesFecha);
    const tituloGenerado = `Checklist ${fechaTexto}`;

    // 2. Armamos el nombre del archivo para Supabase
    const timestamp = new Date().getTime(); 
    const nombreArchivo = `${consecutivo.toLowerCase()}-checklist-${timestamp}.pdf`;

    // 3. Subimos a Supabase (¡Esto soluciona el error de "read-only"!)
    const { error: uploadError } = await supabase.storage
      .from('checklists')
      .upload(nombreArchivo, buffer, {
        contentType: file.type,
      });

    if (uploadError) throw uploadError;

    // 4. Obtenemos el link público
    const { data: { publicUrl } } = supabase.storage
      .from('checklists')
      .getPublicUrl(nombreArchivo);

    // 5. Guardamos en Prisma con el título automático
    await prisma.checklist.create({
      data: {
        Consecutivo: consecutivo,
        Titulo: tituloGenerado, // Título inyectado automáticamente
        Ruta_PDF: publicUrl
      }
    });

    return NextResponse.json({ url: publicUrl, mensaje: 'Checklist guardado exitosamente' });

  } catch (error) {
    console.error("Error en el servidor al subir checklist:", error);
    return NextResponse.json({ error: 'Error interno al procesar el documento' }, { status: 500 });
  }
}