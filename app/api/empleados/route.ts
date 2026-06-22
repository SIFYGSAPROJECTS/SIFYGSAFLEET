import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { enviarCorreo } from '@/lib/email';
import { WelcomeEmail } from '@/components/emails/WelcomeEmail';
import { cookies } from 'next/headers';
import { logAuditoria } from '@/lib/utils/audit';

// Obtiene la lista completa de empleados ordenados alfabéticamente
export async function GET() {
  try {
    const empleados = await prisma.empleados.findMany({
      orderBy: { Nombre_Empleado: 'asc' }
    });
    return NextResponse.json(empleados);
  } catch (error) {
    console.error('Error al cargar empleados:', error);
    return NextResponse.json({ error: 'Error al cargar el personal' }, { status: 500 });
  }
}

// Crea un nuevo empleado, o si ya existe, solo actualiza sus datos y su asignación (sin enviar correo duplicado)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { Email, Nombre_Empleado, A_Paterno, A_Materno, Cargo, Departamento, Rol, Estatus_Acceso, Consecutivo_Vehiculo, C_Interno_Computo } = body;
    const emailLower = Email.toLowerCase();

    // Verificamos si el empleado ya existe
    const empleadoExistente = await prisma.empleados.findUnique({
      where: { Email: emailLower }
    });

    let nuevoEmpleado;

    if (empleadoExistente) {
      // SI YA EXISTE: Solo actualizamos sus datos y asignaciones, no reenviamos correo ni tocamos contraseña
      nuevoEmpleado = await prisma.$transaction(async (tx) => {
        const empleado = await tx.empleados.update({
          where: { Email: emailLower },
          data: {
            Nombre_Empleado, A_Paterno, A_Materno, Cargo, Departamento,
            Rol: Rol || empleadoExistente.Rol,
            Estatus_Acceso: Estatus_Acceso || empleadoExistente.Estatus_Acceso
          }
        });

        if (Consecutivo_Vehiculo) {
          await tx.inventario_Automoviles.update({
            where: { Consecutivo: Consecutivo_Vehiculo },
            data: { Email_encargado: emailLower }
          });
        }

        if (C_Interno_Computo) {
          await tx.inventario_Computo.update({
            where: { C_Interno: C_Interno_Computo },
            data: { Email_Empleado: emailLower }
          });
        }
        return empleado;
      });

      // Retornamos éxito indicando que ya existía (no enviamos correo)
      const cookieStore = await cookies();
      const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
      await logAuditoria(userEmail, 'ACTUALIZACION_ROLES', 'EMPLEADOS', `Actualización de accesos y roles del empleado ${emailLower}`);

      return NextResponse.json({ success: true, data: nuevoEmpleado, message: 'El usuario ya existía, se han actualizado sus accesos y asignaciones sin enviar correo.' });
    } else {
      // SI NO EXISTE: Flujo normal de creación (generamos contraseña y enviamos correo)
      const passwordTemporal = Math.random().toString(36).slice(-8) + "S!fy";
      const hashedPassword = await bcrypt.hash(passwordTemporal, 12);

      nuevoEmpleado = await prisma.$transaction(async (tx) => {
        const empleado = await tx.empleados.create({
          data: {
            Email: emailLower, Nombre_Empleado, A_Paterno, A_Materno, Cargo, Departamento,
            Rol: Rol || 'USER', Estatus_Acceso: Estatus_Acceso || 'Activo',
            Password: hashedPassword, 
          }
        });

        if (Consecutivo_Vehiculo) {
          await tx.inventario_Automoviles.update({
            where: { Consecutivo: Consecutivo_Vehiculo },
            data: { Email_encargado: emailLower }
          });
        }

        if (C_Interno_Computo) {
          await tx.inventario_Computo.update({
            where: { C_Interno: C_Interno_Computo },
            data: { Email_Empleado: emailLower }
          });
        }
        return empleado;
      });

      // Envío de credenciales solo a usuarios NUEVOS
      await enviarCorreo({
        to: emailLower,
        subject: '🔐 Bienvenido a SIFYGSA - Tus Credenciales de Acceso',
        react: WelcomeEmail({
          nombre: Nombre_Empleado,
          apellidoPaterno: A_Paterno,
          email: emailLower,
          passwordTemporal: passwordTemporal,
          rol: Rol || 'USER'
        })
      });

      const cookieStore = await cookies();
      const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
      await logAuditoria(userEmail, 'ALTA_EMPLEADO', 'EMPLEADOS', `Alta de nuevo empleado ${emailLower}`);

      return NextResponse.json({ success: true, data: nuevoEmpleado, message: 'Usuario creado y correo enviado.' });
    }

  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El equipo o vehículo ya está asignado a otra persona.' }, { status: 400 });
    }
    console.error('Error interno:', error);
    return NextResponse.json({ error: 'Error interno en el servidor' }, { status: 500 });
  }
}

// Actualiza los datos del empleado y gestiona la reasignación de vehículos y computadoras independientemente
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { Email, Nombre_Empleado, A_Paterno, A_Materno, Cargo, Departamento, Rol, Estatus_Acceso, Consecutivo_Vehiculo, C_Interno_Computo } = body;

    const empleadoViejo = await prisma.empleados.findUnique({
      where: { Email }
    });

    const empleadoActualizado = await prisma.$transaction(async (tx) => {
      
      // SOLO si la petición incluye Consecutivo_Vehiculo (aunque sea null), actualizamos autos
      if (Consecutivo_Vehiculo !== undefined) {
        await tx.inventario_Automoviles.updateMany({
          where: { Email_encargado: Email },
          data: { Email_encargado: null }
        });

        if (Consecutivo_Vehiculo) {
          await tx.inventario_Automoviles.update({
            where: { Consecutivo: Consecutivo_Vehiculo },
            data: { Email_encargado: Email }
          });
        }
      }

      // SOLO si la petición incluye C_Interno_Computo (aunque sea null), actualizamos computadoras
      if (C_Interno_Computo !== undefined) {
        await tx.inventario_Computo.updateMany({
          where: { Email_Empleado: Email },
          data: { Email_Empleado: null }
        });

        if (C_Interno_Computo) {
          await tx.inventario_Computo.update({
            where: { C_Interno: C_Interno_Computo },
            data: { Email_Empleado: Email }
          });
        }
      }

      // Actualiza la información principal del empleado
      const emp = await tx.empleados.update({
        where: { Email },
        data: {
          Nombre_Empleado,
          A_Paterno,
          A_Materno,
          Cargo,
          Departamento,
          Rol,
          Estatus_Acceso, 
        }
      });

      return emp;
    });

    let actionName = 'EDICION_EMPLEADO';
    let detailMsg = `Edición de datos del empleado ${Email}`;
    let changes: any = {};

    if (empleadoViejo) {
      // Computar diferencias
      const fields = ['Nombre_Empleado', 'A_Paterno', 'A_Materno', 'Cargo', 'Departamento', 'Rol', 'Estatus_Acceso'];
      const bodyData: any = { Nombre_Empleado, A_Paterno, A_Materno, Cargo, Departamento, Rol, Estatus_Acceso };
      
      fields.forEach(f => {
        if (empleadoViejo[f as keyof typeof empleadoViejo] !== bodyData[f]) {
          changes[f] = { from: empleadoViejo[f as keyof typeof empleadoViejo], to: bodyData[f] };
        }
      });

      if (empleadoViejo.Estatus_Acceso !== Estatus_Acceso && Estatus_Acceso === 'Inactivo') {
        actionName = 'BAJA_EMPLEADO';
        detailMsg = `Empleado ${Email} dado de baja (Acceso Revocado).`;
      } else if (empleadoViejo.Rol !== Rol) {
        actionName = 'ACTUALIZACION_ROLES';
        detailMsg = `Cambio de Rol para ${Email}.`;
      }
    }

    const payloadDetail = JSON.stringify({ message: detailMsg, changes });

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
    await logAuditoria(userEmail, actionName, 'EMPLEADOS', payloadDetail);

    return NextResponse.json({ success: true, data: empleadoActualizado });
  } catch (error) {
    console.error('Error al actualizar empleado:', error);
    return NextResponse.json({ error: 'Error al actualizar los datos en la base de datos' }, { status: 500 });
  }
}