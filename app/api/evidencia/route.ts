import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/db'; // ruta con archivo de Prisma

// Conexión a Supabase usando tus variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usamos la Service Role para tener permisos de escritura desde el backend
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folio = formData.get('folio') as string;
    const consecutivo = formData.get('consecutivo') as string;

    // 1. Verificamos que el frontend nos haya mandado todo
    if (!file || !folio || !consecutivo) {
      return NextResponse.json({ error: 'Faltan datos (archivo, folio o consecutivo)' }, { status: 400 });
    }

    // 2. Preparamos el archivo para Supabase
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Armamos el nombre intuitivo (Ej: "f&g-002 2 de marzo.pdf")
    const opcionesFecha: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    const fechaTexto = new Date().toLocaleDateString('es-ES', opcionesFecha);
    const nombreArchivo = `${consecutivo.toLowerCase()} ${fechaTexto}.pdf`;

    // 4. Subimos el archivo a tu bucket 'evidencias'
    const { error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(nombreArchivo, buffer, {
        contentType: file.type,
        upsert: true // Si alguien se equivoca y sube otro PDF el mismo día, lo reemplaza
      });

    if (uploadError) throw uploadError;

    // 5. Obtenemos el link público y permanente del PDF
    const { data: { publicUrl } } = supabase.storage
      .from('evidencias')
      .getPublicUrl(nombreArchivo);

    // 6. ¡EL PASO CLAVE! Actualizamos el ticket en tu base de datos con el link
    await prisma.solicitud.update({
      where: { Pk_folio_ticket: folio },
      data: { Evidencia: publicUrl }
    });

    // 7. Le avisamos al frontend que todo salió perfecto
    return NextResponse.json({ url: publicUrl, mensaje: 'Evidencia guardada exitosamente' });

  } catch (error) {
    console.error("Error en el servidor al subir evidencia:", error);
    return NextResponse.json({ error: 'Error interno al procesar el documento' }, { status: 500 });
  }
}