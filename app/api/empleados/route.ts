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
    const { Email, Nombre_Empleado, A_Paterno, A_Materno, Cargo, Departamento, Rol, Estatus_Acceso, Consecutivo_Vehiculo, Equipos_Computo, Admin_TI } = body;
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
            Admin_TI: Admin_TI !== undefined ? Admin_TI : empleadoExistente.Admin_TI,
            Estatus_Acceso: Estatus_Acceso || empleadoExistente.Estatus_Acceso
          }
        });

        if (Consecutivo_Vehiculo) {
          await tx.inventario_Automoviles.update({
            where: { Consecutivo: Consecutivo_Vehiculo },
            data: { Email_encargado: emailLower }
          });
        }

        if (Equipos_Computo && Array.isArray(Equipos_Computo)) {
          // Limpiar equipos anteriores de este usuario
          await tx.inventario_Computo.updateMany({
            where: { Email_Empleado: emailLower },
            data: { Email_Empleado: null }
          });
          
          if (Equipos_Computo.length > 0) {
            // Asignar nuevos equipos
            await tx.inventario_Computo.updateMany({
              where: { C_Interno: { in: Equipos_Computo } },
              data: { Email_Empleado: emailLower }
            });
          }
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
            Admin_TI: Admin_TI || false,
            Password: hashedPassword, 
          }
        });

        if (Consecutivo_Vehiculo) {
          await tx.inventario_Automoviles.update({
            where: { Consecutivo: Consecutivo_Vehiculo },
            data: { Email_encargado: emailLower }
          });
        }

        if (Equipos_Computo && Array.isArray(Equipos_Computo) && Equipos_Computo.length > 0) {
          await tx.inventario_Computo.updateMany({
            where: { C_Interno: { in: Equipos_Computo } },
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
    const { Email, Nombre_Empleado, A_Paterno, A_Materno, Cargo, Departamento, Rol, Estatus_Acceso, Consecutivo_Vehiculo, Equipos_Computo, Admin_TI } = body;

    const empleadoViejo = await prisma.empleados.findUnique({
      where: { Email },
      include: {
        autos_encargados: { select: { Consecutivo: true } },
        inventarioComputos: { select: { C_Interno: true } }
      }
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

      // SOLO si la petición incluye Equipos_Computo, actualizamos computadoras
      if (Equipos_Computo !== undefined && Array.isArray(Equipos_Computo)) {
        // Liberar todos los equipos que tenía previamente este empleado
        await tx.inventario_Computo.updateMany({
          where: { Email_Empleado: Email },
          data: { Email_Empleado: null }
        });

        if (Equipos_Computo.length > 0) {
          // Asignar los equipos que vienen en la petición
          await tx.inventario_Computo.updateMany({
            where: { C_Interno: { in: Equipos_Computo } },
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
          Admin_TI,
          Estatus_Acceso, 
        }
      });

      return emp;
    });

    let actionName = 'EDICION_EMPLEADO';
    let detailMsg = `Edición de datos del empleado ${Email}`;
    let changes: any = {};

    if (empleadoViejo) {
      // Computar diferencias campos normales
      const fields = ['Nombre_Empleado', 'A_Paterno', 'A_Materno', 'Cargo', 'Departamento', 'Rol', 'Estatus_Acceso', 'Admin_TI'];
      const bodyData: any = { Nombre_Empleado, A_Paterno, A_Materno, Cargo, Departamento, Rol, Estatus_Acceso, Admin_TI };
      
      fields.forEach(f => {
        if (empleadoViejo[f as keyof typeof empleadoViejo] !== bodyData[f]) {
          changes[f] = { from: empleadoViejo[f as keyof typeof empleadoViejo], to: bodyData[f] };
        }
      });

      // Computar diferencias de unidades asignadas
      if (Consecutivo_Vehiculo !== undefined) {
        const oldVehiculos = empleadoViejo.autos_encargados.map((v: any) => v.Consecutivo).join(', ') || 'Ninguno';
        const newVehiculo = Consecutivo_Vehiculo || 'Ninguno';
        if (oldVehiculos !== newVehiculo) {
          changes['Vehículo Asignado'] = { from: oldVehiculos, to: newVehiculo };
        }
      }

      if (Equipos_Computo !== undefined && Array.isArray(Equipos_Computo)) {
        const oldComputos = empleadoViejo.inventarioComputos.map((c: any) => c.C_Interno).join(', ') || 'Ninguno';
        const newComputos = Equipos_Computo.join(', ') || 'Ninguno';
        if (oldComputos !== newComputos) {
          changes['Equipo(s) de Cómputo'] = { from: oldComputos, to: newComputos };
        }
      }

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