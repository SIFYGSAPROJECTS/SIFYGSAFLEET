import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { consecutivo, descripcion, kilometraje } = body;

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;

    if (!userEmail) {
      return NextResponse.json({ error: 'No se encontró sesión' }, { status: 401 });
    }

    // --- INICIO DEL FILTRO VIP ---
    // 1. Buscamos quién está intentando hacer el ticket
    const usuario = await prisma.empleados.findUnique({
      where: { Email: userEmail }
    });

    // 2. Si NO es ADMIN, revisamos si ya hizo uno hoy
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

      // Si el empleado ya tiene un ticket hoy, le bloqueamos el paso
      if (ticketDeHoy) {
        return NextResponse.json(
          { error: 'Ya has registrado una solicitud de mantenimiento el día de hoy. Solo se permite una por día.' }, 
          { status: 400 }
        );
      }
    }
    // --- FIN DEL FILTRO VIP ---

    // 3. GUARDAMOS EN LA BASE DE DATOS
    // Generamos un folio único al instante (Ej. V-02-170879...)
    const folioGenerado = `${consecutivo}-${Date.now()}`;

    const nuevoMantenimiento = await prisma.solicitud.create({
      data: {
        auto: { connect: { Consecutivo: consecutivo } },
        empleado: { connect: { Email: userEmail } },
        Descripcion: descripcion,
        Kilometraje: parseInt(kilometraje),
        Fecha_Realizacion: new Date(),
        Estado: "PENDIENTE", 
        Pk_folio_ticket: folioGenerado, // <--- ¡Devolvemos el folio obligatorio!
      },
      include: { auto: true } 
    });

    // 4. BUSCAMOS A LOS JEFES (Administradores)
    const administradores = await prisma.empleados.findMany({
      where: { Rol: 'ADMIN' },
      select: { Email: true }
    });
    const correosAdmins = administradores.map(admin => admin.Email);

    // 5. ARMAMOS LA LISTA DE DESTINATARIOS
    const encargadoVehiculo = nuevoMantenimiento.auto?.Email_encargado;
    
    // Juntamos todos los correos y el "Set" elimina los repetidos
    const todosLosCorreos = [userEmail, encargadoVehiculo, ...correosAdmins].filter(Boolean);
    const destinatariosFinales = Array.from(new Set(todosLosCorreos)).join(', ');

    console.log(`📧 Preparando envío de correo a: ${destinatariosFinales}`);

    // 6. CONFIGURAMOS A NODEMAILER CON TU .ENV
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // 7. DISEÑAMOS EL CORREO CORPORATIVO
    const mailOptions = {
      from: `"SIFYGSA Fleet" <${process.env.EMAIL_USER}>`,
      to: destinatariosFinales, 
      subject: `🔧 Nueva Orden de Servicio: ${nuevoMantenimiento.auto?.Placa}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="background-color: #1e293b; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SIFYGSA Fleet</h1>
          </div>
          <div style="padding: 30px;">
            <h2 style="color: #0f172a; margin-top: 0;">Orden Generada Exitosamente</h2>
            <p style="color: #475569;">Se ha registrado una nueva solicitud de servicio. Detalles de la unidad:</p>
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <p><strong>Unidad:</strong> ${nuevoMantenimiento.auto?.Marca} ${nuevoMantenimiento.auto?.Modelo} (${nuevoMantenimiento.auto?.Placa})</p>
              <p><strong>Solicita:</strong> ${userEmail}</p>
              <p><strong>Kilometraje:</strong> ${nuevoMantenimiento.Kilometraje.toLocaleString()} KM</p>
            </div>
            <p><strong>Trabajo a realizar:</strong></p>
            <p style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; font-style: italic;">"${nuevoMantenimiento.Descripcion}"</p>
          </div>
        </div>
      `,
    };

    // 8. ¡ENVIAMOS EL CORREO!
    await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado con éxito');

    return NextResponse.json({ success: true, data: nuevoMantenimiento });

  } catch (error: any) {
    // Para cualquier error inesperado
    console.error('❌ Error en la API:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}