import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { enviarCorreo } from '@/lib/email';
import { DocumentoExpiradoEmail } from '@/components/emails/DocumentoExpiradoEmail';

export async function GET(request: Request) {
  // Proteger la ruta si es necesario, o usar un token en el query (ej: ?token=secreto)
  // const { searchParams } = new URL(request.url);
  // if (searchParams.get('token') !== process.env.CRON_SECRET) {
  //   return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  // }

  try {
    // 1. Obtener todos los documentos con fecha de expiración que NO han sido notificados
    // Y que tienen configurado un Aviso_Dias
    const documentos = await prisma.documentos_Unidad.findMany({
      where: {
        Fecha_Expiracion: { not: null },
        Aviso_Dias: { not: null },
        Notificado: false
      }
    });

    if (documentos.length === 0) {
      return NextResponse.json({ mensaje: 'No hay documentos pendientes de notificar.' });
    }

    // 2. Obtener la lista de correos de los administradores
    const administradores = await prisma.empleados.findMany({
      where: { Rol: 'ADMIN' },
      select: { Email: true }
    });
    const correosAdmins = administradores.map(admin => admin.Email);

    if (correosAdmins.length === 0) {
      return NextResponse.json({ mensaje: 'No hay administradores para notificar.' });
    }

    const hoy = new Date();
    let notificadosCount = 0;

    // 3. Evaluar cada documento
    for (const doc of documentos) {
      const fechaExp = new Date(doc.Fecha_Expiracion!);
      const diasAviso = doc.Aviso_Dias!;

      // Diferencia en días
      const diffTime = fechaExp.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Si los días restantes son menores o iguales al umbral de aviso
      if (diffDays <= diasAviso) {
        // Enviar correo
        await enviarCorreo({
          to: correosAdmins,
          subject: `⚠️ Documento por Vencer: ${doc.Consecutivo} - ${doc.Titulo}`,
          react: DocumentoExpiradoEmail({
            consecutivo: doc.Consecutivo,
            tituloDocumento: doc.Titulo,
            fechaExpiracion: fechaExp.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }),
            diasRestantes: diffDays
          })
        });

        // Marcar como notificado
        await prisma.documentos_Unidad.update({
          where: { id: doc.id },
          data: { Notificado: true }
        });

        notificadosCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      mensaje: `Proceso finalizado. Se enviaron ${notificadosCount} notificaciones.` 
    });

  } catch (error: any) {
    console.error('Error en cron de notificaciones:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}
