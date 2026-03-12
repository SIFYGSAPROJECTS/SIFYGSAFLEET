import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import nodemailer from 'nodemailer';

export async function PUT(request: Request) {
  try {
    
    const { folio, estado, lugar, fecha, hora, asesor, numeroAsesor } = await request.json();

    // 1. Actualizamos el ticket incluyendo el número de asesor
    const ticketActualizado = await prisma.solicitud.update({
      where: { Pk_folio_ticket: folio },
      data: { 
        Estado: estado,
        Lugar_Cita: lugar || null,
        Fecha_Cita: fecha || null,
        Hora_Cita: hora || null,
        Asesor: asesor || null,
        Num_Asesor: numeroAsesor || null //  GUARDAMOS EL TELÉFONO
      },
      include: {
        empleado: true, 
        auto: true      
      }
    });

    // 2. ¡NOTIFICACIÓN POR CORREO!
    if (estado === 'LISTO' && ticketActualizado.empleado?.Email) {
      
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: ticketActualizado.empleado.Email,
        subject: `✅ Tu unidad está lista para recolección - Folio: ${folio}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #16a34a; text-align: center;">¡Tu vehículo está listo! 🚗✨</h2>
            <p>Hola <strong>${ticketActualizado.empleado.Nombre_Empleado}</strong>,</p>
            <p>Te informamos que el servicio de mantenimiento de tu unidad ha concluido exitosamente y ya puedes pasar a recogerla al taller.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #16a34a; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Vehículo:</strong> ${ticketActualizado.auto?.Marca} ${ticketActualizado.auto?.Modelo}</p>
              <p style="margin: 5px 0;"><strong>Placas:</strong> ${ticketActualizado.auto?.Placa}</p>
              <p style="margin: 5px 0;"><strong>Folio de Servicio:</strong> ${folio}</p>
              ${asesor ? `<p style="margin: 5px 0;"><strong>Asesor a cargo:</strong> ${asesor}</p>` : ''}
              ${numeroAsesor ? `<p style="margin: 5px 0;"><strong>Teléfono Asesor:</strong> ${numeroAsesor}</p>` : ''}
            </div>
            
            <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
              Este es un mensaje automático del Sistema de Gestión de Flota SIFYGSA.
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`✉️ Correo de recolección enviado con éxito a: ${ticketActualizado.empleado.Email}`);
    }

    return NextResponse.json({ success: true, data: ticketActualizado });
    
  } catch (error) {
    console.error('❌ Error al cambiar estado o enviar correo:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}