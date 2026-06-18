import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { logAuditoria } from '@/lib/utils/audit';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const equipos = await prisma.inventario_Computo.findMany({
      orderBy: { C_Interno: 'desc' },
      include: {
        empleado: {
          select: {
            Nombre_Empleado: true,
            A_Paterno: true,
            A_Materno: true
          }
        }
      }
    });
    return NextResponse.json(equipos);
  } catch (error) {
    console.error('Error fetching equipos computo:', error);
    return NextResponse.json({ error: 'Error al obtener los equipos de cómputo' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      C_Interno, Empresa, Tipo, Marca, Modelo, Service_Tag, Cargador, 
      Usuario, Departamento, Puesto_Proyecto, N_EMP, Estatus, CR, Fecha_CR, Proveedor
    } = body;

    // Verificar si existe el codigo interno
    const existe = await prisma.inventario_Computo.findUnique({
      where: { C_Interno }
    });

    if (existe) {
      return NextResponse.json({ error: 'El código interno (C_Interno) ya existe.' }, { status: 400 });
    }

    const nuevoEquipo = await prisma.inventario_Computo.create({
      data: {
        C_Interno,
        Empresa,
        Tipo,
        Marca,
        Modelo,
        Service_Tag,
        Cargador,
        Usuario,
        Departamento,
        Puesto_Proyecto,
        N_EMP,
        Estatus: Estatus || 'Asignado',
        CR,
        Fecha_CR: Fecha_CR ? new Date(Fecha_CR) : null,
        Proveedor
      }
    });

    // Guardar registro en el historial (Alta)
    await prisma.historial_Registro_Computo.create({
      data: {
        C_Interno: nuevoEquipo.C_Interno,
        Detalle: 'Alta inicial del equipo',
      }
    });

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
    await logAuditoria(userEmail, 'ALTA_EQUIPO', 'COMPUTO', `Alta de equipo de cómputo ${nuevoEquipo.C_Interno}`);

    return NextResponse.json({ message: 'Equipo de cómputo registrado con éxito.', equipo: nuevoEquipo }, { status: 201 });
  } catch (error) {
    console.error('Error creating equipo:', error);
    return NextResponse.json({ error: 'Hubo un error al crear el equipo de cómputo.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      C_Interno, Empresa, Tipo, Marca, Modelo, Service_Tag, Cargador, 
      Usuario, Departamento, Puesto_Proyecto, N_EMP, Estatus, CR, Fecha_CR, Proveedor
    } = body;

    const equipoViejo = await prisma.inventario_Computo.findUnique({
      where: { C_Interno }
    });

    const equipoActualizado = await prisma.inventario_Computo.update({
      where: { C_Interno },
      data: {
        Empresa,
        Tipo,
        Marca,
        Modelo,
        Service_Tag,
        Cargador,
        Usuario,
        Departamento,
        Puesto_Proyecto,
        N_EMP,
        Estatus,
        CR,
        Fecha_CR: Fecha_CR ? new Date(Fecha_CR) : null,
        Proveedor
      }
    });

    // Guardar registro en el historial (Edicion)
    await prisma.historial_Registro_Computo.create({
      data: {
        C_Interno: equipoActualizado.C_Interno,
        Detalle: 'Actualización de datos / estatus del equipo',
      }
    });

    let actionName = 'EDICION_EQUIPO';
    let detailMsg = `Actualización de equipo de cómputo ${equipoActualizado.C_Interno}`;

    if (equipoViejo) {
      if (equipoViejo.Estatus !== Estatus && (Estatus === 'Baja' || Estatus === 'Inactivo' || Estatus === 'Desechado')) {
        actionName = 'BAJA_EQUIPO';
        detailMsg = `Equipo de cómputo ${equipoActualizado.C_Interno} dado de baja.`;
      } else if (equipoViejo.Usuario !== Usuario && Usuario) {
        actionName = 'ASIGNACION_EQUIPO';
        detailMsg = `Equipo de cómputo ${equipoActualizado.C_Interno} asignado al usuario ${Usuario}.`;
      }
    }

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value || 'Sistema';
    await logAuditoria(userEmail, actionName, 'COMPUTO', detailMsg);

    return NextResponse.json({ message: 'Equipo de cómputo actualizado con éxito.', equipo: equipoActualizado });
  } catch (error) {
    console.error('Error updating equipo:', error);
    return NextResponse.json({ error: 'Hubo un error al actualizar el equipo de cómputo.' }, { status: 500 });
  }
}
