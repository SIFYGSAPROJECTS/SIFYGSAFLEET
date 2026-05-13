import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import nodemailer from 'nodemailer';

// Actualiza el estado de un ticket y envía notificaciones automáticas por correo
export async function PUT(request: Request) {
  try {
    const { folio, estado, lugar, fecha, hora, asesor, numeroAsesor, linkTaller } = await request.json();

    // Actualiza los detalles de la cita y la información del asesor en la base de datos
    const ticketActualizado = await prisma.solicitud.update({
      where: { Pk_folio_ticket: folio },
      data: {
        Estado: estado,
        Lugar_Cita: lugar || null,
        Fecha_Cita: fecha || null,
        Hora_Cita: hora || null,
        Asesor: asesor || null,
        Num_Asesor: numeroAsesor || null,
        Link_Taller: linkTaller || null
      },
      include: {
        empleado: true,
        auto: true
      }
    });

    // Envía notificaciones por correo electrónico al empleado según el nuevo estado
    if (ticketActualizado.empleado?.Email) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      let mailOptions = null;

      if (estado === 'CITA') {
        mailOptions = {
          from: process.env.EMAIL_USER,
          to: ticketActualizado.empleado.Email,
          subject: `📅 Cita Confirmada: Mantenimiento SIFYGSA - Folio: ${folio}`,
          html: `
            <div style="background-color: #f8fafc; padding: 20px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #1e293b; padding: 25px 20px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 1px;">SIFYGSA FLEET</h1>
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #0f172a; margin-top: 0; font-size: 20px; text-align: center;">¡Cita Programada! 📅</h2>
                  <p style="color: #475569; font-size: 15px; line-height: 1.6; text-align: center;">Tu unidad tiene una cita de servicio confirmada. Aquí están los detalles:</p>
                  
                  <div style="background-color: #f8fafc; border-left: 4px solid #0ea5e9; padding: 20px; border-radius: 6px; margin: 25px 0;">
                    <p style="margin: 8px 0; color: #334155;"><strong>📍 Lugar:</strong> ${lugar || 'Por confirmar'}</p>
                    <p style="margin: 8px 0; color: #334155;"><strong>📅 Fecha:</strong> ${fecha || 'Por confirmar'}</p>
                    <p style="margin: 8px 0; color: #334155;"><strong>⏰ Hora:</strong> ${hora || 'Por confirmar'}</p>
                    ${asesor ? `<p style="margin: 8px 0; color: #334155;"><strong>👤 Asesor:</strong> ${asesor}</p>` : ''}
                    ${numeroAsesor ? `<p style="margin: 8px 0; color: #334155;"><strong>📞 Tel. Asesor:</strong> ${numeroAsesor}</p>` : ''}
                  </div>
                  
                  <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; border: 1px solid #bfdbfe;">
                    <p style="margin: 0; color: #1d4ed8; font-weight: bold;">🚗 Unidad: ${ticketActualizado.auto?.Marca} ${ticketActualizado.auto?.Modelo} (${ticketActualizado.auto?.Placa})</p>
                  </div>

                  <div style="text-align: center; margin: 35px 0 15px 0;">
                    ${linkTaller ? `<a href="${linkTaller}" style="background-color: #e2e8f0; color: #475569; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; margin-right: 10px;">Ver en Mapa</a>` : ''}
                    <a href="https://cloud.sifygsa.com" style="background-color: #0f172a; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">Consultar en Plataforma</a>
                  </div>
                </div>
                
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 5px 0; color: #dc2626; font-weight: bold;">⚠️ Por favor, llega 10 minutos antes de tu cita.</p>
                  <p style="margin: 0;">Consulta detalles adicionales en <strong>cloud.sifygsa.com</strong></p>
                </div>
              </div>
            </div>
          `
        };
      } else if (estado === 'EN TALLER') {
        mailOptions = {
          from: process.env.EMAIL_USER,
          to: ticketActualizado.empleado.Email,
          subject: `🛠️ Unidad en Mantenimiento - Folio: ${folio}`,
          html: `
            <div style="background-color: #f8fafc; padding: 20px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #1e293b; padding: 25px 20px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 1px;">SIFYGSA FLEET</h1>
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #d97706; margin-top: 0; font-size: 20px; text-align: center;">Vehículo en Taller 🛠️</h2>
                  <p style="color: #475569; font-size: 15px; line-height: 1.6;">Hola <strong>${ticketActualizado.empleado.Nombre_Empleado}</strong>, te confirmamos que tu unidad ha ingresado exitosamente al taller para su servicio.</p>
                  
                  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 6px; margin: 25px 0;">
                    <p style="margin: 8px 0; color: #78350f;"><strong>🚗 Unidad:</strong> ${ticketActualizado.auto?.Marca} ${ticketActualizado.auto?.Modelo}</p>
                    <p style="margin: 8px 0; color: #78350f;"><strong>🔢 Placas:</strong> ${ticketActualizado.auto?.Placa}</p>
                    <p style="margin: 8px 0; color: #78350f;"><strong>📋 Folio:</strong> ${folio}</p>
                  </div>
                  
                  <p style="color: #475569; font-size: 14px; text-align: center;">Te notificaremos por este medio en cuanto el vehículo esté listo para su recolección.</p>

                  <div style="text-align: center; margin: 35px 0 15px 0;">
                    <a href="https://cloud.sifygsa.com/dashboard/servicios" style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">Seguir el Avance en SIFYGSA</a>
                  </div>
                </div>
                
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 5px 0;">Accede a <strong>cloud.sifygsa.com</strong> para revisar tu historial.</p>
                  <p style="margin: 0;">Este es un mensaje automático de SIFYGSA Fleet.</p>
                </div>
              </div>
            </div>
          `
        };
      } else if (estado === 'LISTO') {
        mailOptions = {
          from: process.env.EMAIL_USER,
          to: ticketActualizado.empleado.Email,
          subject: `✅ Tu unidad está lista para recolección - Folio: ${folio}`,
          html: `
            <div style="background-color: #f8fafc; padding: 20px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="background-color: #1e293b; padding: 25px 20px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 1px;">SIFYGSA FLEET</h1>
                </div>
                <div style="padding: 30px;">
                  <h2 style="color: #16a34a; margin-top: 0; font-size: 20px; text-align: center;">¡Tu vehículo está listo! 🚗✨</h2>
                  <p style="color: #475569; font-size: 15px; line-height: 1.6;">Hola <strong>${ticketActualizado.empleado.Nombre_Empleado}</strong>, te informamos que el servicio de mantenimiento de tu unidad ha concluido exitosamente. Ya puedes pasar a recogerla.</p>
                  
                  <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; border-radius: 6px; margin: 25px 0;">
                    <p style="margin: 8px 0; color: #14532d;"><strong>🚗 Vehículo:</strong> ${ticketActualizado.auto?.Marca} ${ticketActualizado.auto?.Modelo}</p>
                    <p style="margin: 8px 0; color: #14532d;"><strong>🔢 Placas:</strong> ${ticketActualizado.auto?.Placa}</p>
                    <p style="margin: 8px 0; color: #14532d;"><strong>📋 Folio:</strong> ${folio}</p>
                    ${asesor ? `<p style="margin: 8px 0; color: #14532d;"><strong>👤 Asesor a cargo:</strong> ${asesor}</p>` : ''}
                    ${numeroAsesor ? `<p style="margin: 8px 0; color: #14532d;"><strong>📞 Teléfono Asesor:</strong> ${numeroAsesor}</p>` : ''}
                  </div>

                  <div style="text-align: center; margin: 35px 0 15px 0;">
                    ${linkTaller ? `<a href="${linkTaller}" style="background-color: #e2e8f0; color: #475569; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; margin-right: 10px;">Ver Mapa del Taller</a>` : ''}
                    <a href="https://cloud.sifygsa.com/dashboard/servicios" style="background-color: #0f172a; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">Confirmar en Plataforma</a>
                  </div>
                </div>
                
                <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 5px 0;">Asegúrate de revisar la unidad antes de retirarla del taller.</p>
                  <p style="margin: 0;">Para más información, entra a <strong>cloud.sifygsa.com</strong></p>
                </div>
              </div>
            </div>
          `,
        };
      }

      if (mailOptions) {
        await transporter.sendMail(mailOptions);
      }
    }

    return NextResponse.json({ success: true, data: ticketActualizado });

  } catch (error) {
    console.error('Error al cambiar estado o enviar correo:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}