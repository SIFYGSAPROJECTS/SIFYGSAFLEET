import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { enviarCorreo } from '@/lib/email';
import { render } from '@react-email/render';
import MantenimientoReprogramadoEmail from '@/components/emails/MantenimientoReprogramadoEmail';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { id, accion, motivo } = data;

    if (!id || !accion) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    const reporte = await prisma.reporte_Mantenimiento.findUnique({
      where: { Id_Reporte: parseInt(id) },
      include: {
        equipo: true
      }
    });

    if (!reporte) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 });
    }

    if (accion === 'confirmar') {
      await prisma.reporte_Mantenimiento.update({
        where: { Id_Reporte: parseInt(id) },
        data: {
          Confirmado: true,
          Estado: 'CONFIRMADO',
        }
      });
      return NextResponse.json({ success: true, message: 'Mantenimiento confirmado exitosamente' });
    } 
    
    if (accion === 'reprogramar') {
      await prisma.reporte_Mantenimiento.update({
        where: { Id_Reporte: parseInt(id) },
        data: {
          Confirmado: false,
          Estado: 'REPROGRAMADO',
          Motivo_Rechazo: motivo || 'No especificado',
        }
      });

      // Notificar al admin sobre la solicitud de reprogramación
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const fechaString = new Date(reporte.Fecha_Programada).toLocaleDateString('es-MX', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        const emailHtml = await render(
          MantenimientoReprogramadoEmail({
            equipoData: {
              C_Interno: reporte.C_Interno,
              Usuario: reporte.equipo.Usuario || 'Desconocido'
            },
            fechaOriginal: fechaString,
            motivo: motivo || 'No especificado',
            appUrl
          })
        );
        
        // Asumiendo que hay un correo de admin de TI configurado o enviamos al correo por defecto
        const adminEmail = process.env.ADMIN_TI_EMAIL || 'sistemas@sifygsa.com';
        
        await enviarCorreo({
          to: adminEmail,
          subject: `⚠️ Reprogramación solicitada: Mantenimiento de ${reporte.C_Interno}`,
          react: emailHtml
        });
      } catch (emailError) {
        console.error('Error enviando email a admin:', emailError);
      }

      return NextResponse.json({ success: true, message: 'Solicitud de reprogramación enviada' });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error en confirmación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
