import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 1. AHORA RECIBIMOS TAMBIÉN EL TIPO DE SERVICIO
    const { consecutivo, tipo_servicio, descripcion, kilometraje } = body;

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;

    if (!userEmail) {
      return NextResponse.json({ error: 'No se encontró sesión' }, { status: 401 });
    }

    // --- CANDADO DE ESTADO DEL VEHÍCULO ---
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

    // --- FILTRO VIP ---
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

    // --- GUARDAMOS EN LA BASE DE DATOS ---
    const folioGenerado = `${consecutivo}-${Date.now()}`;

    const nuevoMantenimiento = await prisma.solicitud.create({
      data: {
        auto: { connect: { Consecutivo: consecutivo } },
        empleado: { connect: { Email: userEmail } },
        // 2. GUARDAMOS EL NUEVO CAMPO EN LA BASE DE DATOS
        Tipo_Servicio: tipo_servicio, 
        Descripcion: descripcion,
        // Si no es preventivo, el kilometraje puede venir como null o undefined
        Kilometraje: kilometraje ? parseInt(kilometraje) : null,
        Fecha_Realizacion: new Date(),
        Estado: "PENDIENTE", 
        Pk_folio_ticket: folioGenerado, 
      },
      include: { auto: true } 
    });

    // --- ENVÍO DE CORREOS ---
    const administradores = await prisma.empleados.findMany({
      where: { Rol: 'ADMIN' },
      select: { Email: true }
    });
    const correosAdmins = administradores.map(admin => admin.Email);

    const encargadoVehiculo = nuevoMantenimiento.auto?.Email_encargado;
    
    const todosLosCorreos = [userEmail, encargadoVehiculo, ...correosAdmins].filter(Boolean);
    const destinatariosFinales = Array.from(new Set(todosLosCorreos)).join(', ');

    console.log(`📧 Preparando envío de correo a: ${destinatariosFinales}`);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // 3. AGREGAMOS EL TIPO DE SERVICIO AL CORREO CORPORATIVO
    const tipoServicioCapitalizado = tipo_servicio ? tipo_servicio.charAt(0).toUpperCase() + tipo_servicio.slice(1) : 'No especificado';

    const mailOptions = {
      from: `"SIFYGSA Fleet" <${process.env.EMAIL_USER}>`,
      to: destinatariosFinales, 
      subject: `🔧 Nueva Orden de Servicio (${tipoServicioCapitalizado}): ${nuevoMantenimiento.auto?.Placa}`,
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
              <p><strong>Tipo de Servicio:</strong> ${tipoServicioCapitalizado}</p>
              ${tipo_servicio === 'preventivo' ? `<p><strong>Kilometraje:</strong> ${nuevoMantenimiento.Kilometraje?.toLocaleString()} KM</p>` : ''}
            </div>
            <p><strong>Trabajo a realizar:</strong></p>
            <p style="background-color: #f1f5f9; padding: 15px; border-radius: 6px; font-style: italic;">"${nuevoMantenimiento.Descripcion}"</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado con éxito');

    return NextResponse.json({ success: true, data: nuevoMantenimiento });

  } catch (error: any) {
    console.error('❌ Error en la API:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}