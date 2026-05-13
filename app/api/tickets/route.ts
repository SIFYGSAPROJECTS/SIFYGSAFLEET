import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

// Registra una nueva solicitud de servicio y notifica a los involucrados
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { consecutivo, tipo_servicio, descripcion, kilometraje } = body;

    // Verifica que el usuario tenga una sesión activa
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;

    if (!userEmail) {
      return NextResponse.json({ error: 'No se encontró sesión' }, { status: 401 });
    }

    // Valida que la unidad exista y se encuentre operativa (no dada de baja)
    const vehiculoRequerido = await prisma.inventario_Automoviles.findUnique({
      where: { Consecutivo: consecutivo }
    });

    if (!vehiculoRequerido) {
      return NextResponse.json({ error: 'El vehículo seleccionado no existe.' }, { status: 404 });
    }

    if (vehiculoRequerido.Estado_Unidad === false) {
      return NextResponse.json(
        { error: `El vehículo ${consecutivo} está dado de baja. No se pueden programar servicios hasta que sea reactivado.` },
        { status: 400 }
      );
    }

    // Restringe a los usuarios estándar a crear un máximo de un ticket por día
    const usuario = await prisma.empleados.findUnique({
      where: { Email: userEmail }
    });

    if (usuario?.Rol !== 'ADMIN') {
      const inicioDeHoy = new Date();
      inicioDeHoy.setHours(0, 0, 0, 0);

      const finDeHoy = new Date();
      finDeHoy.setHours(23, 59, 59, 999);

      const ticketDeHoy = await prisma.solicitud.findFirst({
        where: {
          Email_Empleado: userEmail,
          Fecha_Realizacion: {
            gte: inicioDeHoy,
            lte: finDeHoy
          }
        }
      });

      if (ticketDeHoy) {
        return NextResponse.json(
          { error: 'Ya has registrado una solicitud de mantenimiento el día de hoy. Solo se permite una por día.' },
          { status: 400 }
        );
      }
    }

    // Genera un folio único y registra el ticket en la base de datos
    const folioGenerado = `${consecutivo}-${Date.now()}`;

    const nuevoMantenimiento = await prisma.solicitud.create({
      data: {
        auto: { connect: { Consecutivo: consecutivo } },
        empleado: { connect: { Email: userEmail } },
        Tipo_Servicio: tipo_servicio,
        Descripcion: descripcion,
        Kilometraje: kilometraje ? parseInt(kilometraje) : null,
        Fecha_Realizacion: new Date(),
        Estado: "PENDIENTE",
        Pk_folio_ticket: folioGenerado,
      },
      include: { auto: true }
    });

    // Configura la lista de destinatarios (solicitante, encargado y administradores)
    const administradores = await prisma.empleados.findMany({
      where: { Rol: 'ADMIN' },
      select: { Email: true }
    });
    const correosAdmins = administradores.map(admin => admin.Email);

    const encargadoVehiculo = nuevoMantenimiento.auto?.Email_encargado;

    const todosLosCorreos = [userEmail, encargadoVehiculo, ...correosAdmins].filter(Boolean);
    const destinatariosFinales = Array.from(new Set(todosLosCorreos)).join(', ');

    // Envía la confirmación por correo electrónico
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const tipoServicioCapitalizado = tipo_servicio ? tipo_servicio.charAt(0).toUpperCase() + tipo_servicio.slice(1) : 'No especificado';

    // Extraer los datos de los corchetes para quitarlos de la descripción principal
    let workDesc = nuevoMantenimiento.Descripcion || '';
    
    const notaMatch = workDesc.match(/\[Nota: Corresponde a Servicio de los (.*?)\]/);
    const notaStr = notaMatch ? notaMatch[1] : null;
    workDesc = workDesc.replace(/\[Nota: Corresponde a Servicio de los .*?\]/, '').trim();
    
    const tallerMatch = workDesc.match(/\[Taller Sugerido: (.*?)\]/);
    const tallerStr = tallerMatch ? tallerMatch[1] : null;
    workDesc = workDesc.replace(/\[Taller Sugerido: .*?\]/, '').trim();
    
    const descriptionFormatted = workDesc.replace(/\n/g, '<br />');

    const mailOptions = {
      from: `"SIFYGSA Fleet" <${process.env.EMAIL_USER}>`,
      to: destinatariosFinales,
      subject: `🔧 Nueva Orden de Servicio (${tipoServicioCapitalizado}): ${nuevoMantenimiento.auto?.Placa}`,
      html: `
        <div style="background-color: #f8fafc; padding: 20px 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            <div style="background-color: #1e293b; padding: 25px 20px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: 1px;">SIFYGSA FLEET</h1>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Orden Generada Exitosamente 🔧</h2>
              <p style="color: #475569; font-size: 15px; line-height: 1.6;">Se ha registrado una nueva solicitud de servicio en el sistema. A continuación, los detalles de la unidad:</p>
              
              <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 6px; margin: 25px 0;">
                <p style="margin: 8px 0; color: #334155;"><strong>🚗 Unidad:</strong> ${nuevoMantenimiento.auto?.Marca} ${nuevoMantenimiento.auto?.Modelo} (${nuevoMantenimiento.auto?.Placa})</p>
                <p style="margin: 8px 0; color: #334155;"><strong>👤 Solicitante:</strong> ${userEmail}</p>
                <p style="margin: 8px 0; color: #334155;"><strong>📋 Servicio:</strong> ${tipoServicioCapitalizado}</p>
                ${tipo_servicio === 'preventivo' ? `<p style="margin: 8px 0; color: #334155;"><strong>⏱️ Odómetro Actual:</strong> ${nuevoMantenimiento.Kilometraje?.toLocaleString()} KM</p>` : ''}
                ${notaStr ? `<p style="margin: 8px 0; color: #334155;"><strong>⚙️ Mantenimiento de:</strong> ${notaStr}</p>` : ''}
                ${tallerStr ? `<p style="margin: 8px 0; color: #334155;"><strong>📍 Taller Sugerido:</strong> ${tallerStr}</p>` : ''}
              </div>
              
              <p style="font-weight: bold; color: #1e293b; margin-bottom: 8px;">Trabajo a realizar:</p>
              <div style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; font-style: italic; color: #475569; font-size: 14px; border: 1px solid #e2e8f0; line-height: 1.5;">
                "${descriptionFormatted}"
              </div>

              <div style="text-align: center; margin: 35px 0 15px 0;">
                <a href="https://cloud.sifygsa.com" style="background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">Dar Seguimiento a mi Orden</a>
              </div>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 5px 0;">Consulta el estatus de todos tus servicios accediendo a <strong>cloud.sifygsa.com</strong></p>
              <p style="margin: 0;">Este es un mensaje automático de SIFYGSA Fleet. Por favor no respondas a este correo.</p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, data: nuevoMantenimiento });

  } catch (error: any) {
    console.error('Error en la API:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}