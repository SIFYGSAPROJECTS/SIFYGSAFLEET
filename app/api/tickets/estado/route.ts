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
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; color: #334155; border: 1px solid #f1f5f9; border-radius: 16px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 25px;">
                <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 5px;">¡Cita Programada! </h1>
                <p style="color: #64748b; font-size: 16px; margin-top: 0;">Tu unidad tiene una cita de servicio confirmada.</p>
              </div>

              <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <h3 style="margin-top: 0; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Detalles de la Cita</h3>
                <p style="margin: 12px 0;"><strong>📍 Lugar:</strong> ${lugar || 'Por confirmar'}</p>
                <p style="margin: 12px 0;"><strong>📅 Fecha:</strong> ${fecha || 'Por confirmar'}</p>
                <p style="margin: 12px 0;"><strong>⏰ Hora:</strong> ${hora || 'Por confirmar'}</p>
                ${asesor ? `<p style="margin: 12px 0;"><strong>👤 Asesor:</strong> ${asesor}</p>` : ''}
                ${numeroAsesor ? `<p style="margin: 12px 0;"><strong>📞 Tel. Asesor:</strong> ${numeroAsesor}</p>` : ''}
              </div>

              <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                 <p style="margin: 0; color: #1d4ed8; font-weight: bold;">Vehículo: ${ticketActualizado.auto?.Marca} ${ticketActualizado.auto?.Modelo} (${ticketActualizado.auto?.Placa})</p>
              </div>

              ${linkTaller ? `
                <div style="text-align: center; margin-top: 25px;">
                  <a href="${linkTaller}" style="background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver Ubicación en Mapa</a>
                </div>
              ` : ''}

              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #f1f5f9; pt: 20px;">
                Este es un mensaje automático de SIFYGSA Fleet. Por favor, llega 10 minutos antes de tu cita.
              </p>
            </div>
          `
        };
      } else if (estado === 'EN TALLER') {
        mailOptions = {
          from: process.env.EMAIL_USER,
          to: ticketActualizado.empleado.Email,
          subject: `🛠️ Unidad en Mantenimiento - Folio: ${folio}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; color: #333; border: 1px solid #e5e7eb; border-radius: 12px;">
              <h2 style="color: #d97706; text-align: center;">Tu vehículo ya está en taller 🛠️</h2>
              <p>Hola <strong>${ticketActualizado.empleado.Nombre_Empleado}</strong>,</p>
              <p>Te confirmamos que tu unidad ha ingresado exitosamente al taller para su servicio de mantenimiento.</p>
              
              <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; border-left: 5px solid #d97706; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Unidad:</strong> ${ticketActualizado.auto?.Marca} ${ticketActualizado.auto?.Modelo}</p>
                <p style="margin: 5px 0;"><strong>Placas:</strong> ${ticketActualizado.auto?.Placa}</p>
                <p style="margin: 5px 0;"><strong>Estatus:</strong> Ingreso a Taller Autorizado</p>
              </div>
              
              <p>Te notificaremos en cuanto el vehículo esté listo para su recolección.</p>
              
              <p style="color: #9ca3af; font-size: 11px; text-align: center; margin-top: 30px;">
                Mensaje generado por SIFYGSA Fleet Management System.
              </p>
            </div>
          `
        };
      } else if (estado === 'LISTO') {
        mailOptions = {
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
                ${linkTaller ? `<p style="margin: 5px 0;"><strong>Ubicación del Taller:</strong> <a href="${linkTaller}" style="color: #0ea5e9; text-decoration: underline;">Ver en Mapa</a></p>` : ''}
              </div>
              
              <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">
                Este es un mensaje automático del Sistema de Gestión de Flota SIFYGSA.
              </p>
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