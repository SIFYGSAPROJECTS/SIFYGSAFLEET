import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';
import { enviarCorreo } from '@/lib/email';
import { TicketCreatedEmail } from '@/components/emails/TicketCreatedEmail';

// Registra una nueva solicitud de servicio y notifica a los involucrados
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { consecutivo, tipo_servicio, descripcion, kilometraje, tieneEvidencia } = body;

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

    // Actualiza el kilometraje en la tabla principal del vehículo para mantenerlos sincronizados
    if (kilometraje) {
      await prisma.inventario_Automoviles.update({
        where: { Consecutivo: consecutivo },
        data: { Kilometraje: parseInt(kilometraje) }
      });
    }

    // Configura la lista de destinatarios (solicitante, encargado y administradores)
    const administradores = await prisma.empleados.findMany({
      where: { Rol: 'ADMIN' },
      select: { Email: true }
    });
    const correosAdmins = administradores.map(admin => admin.Email);

    const encargadoVehiculo = nuevoMantenimiento.auto?.Email_encargado;

    const todosLosCorreos = [userEmail, encargadoVehiculo, ...correosAdmins].filter(Boolean);
    const destinatariosFinales = Array.from(new Set(todosLosCorreos)).join(', ');

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

    // Envía la confirmación por correo electrónico a través de Resend
    await enviarCorreo({
      to: destinatariosFinales.split(', '), // Resend acepta array de strings o string separado por comas, pero array es más seguro
      subject: `🔧 Nueva Orden de Servicio (${tipoServicioCapitalizado}): ${nuevoMantenimiento.auto?.Placa}`,
      react: TicketCreatedEmail({
        marca: nuevoMantenimiento.auto?.Marca || 'Desconocida',
        modelo: nuevoMantenimiento.auto?.Modelo || 'Desconocido',
        placa: nuevoMantenimiento.auto?.Placa || 'Sin Placa',
        solicitanteEmail: userEmail,
        tipoServicio: tipoServicioCapitalizado,
        kilometraje: nuevoMantenimiento.Kilometraje,
        nota: notaStr,
        taller: tallerStr,
        descripcionFormatted: descriptionFormatted,
        tieneEvidencia: tieneEvidencia
      })
    });

    return NextResponse.json({ success: true, data: nuevoMantenimiento });

  } catch (error: any) {
    console.error('Error en la API:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}