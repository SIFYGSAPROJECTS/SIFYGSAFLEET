import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const telefonia = await prisma.inventario_Telefonia.findMany({
      orderBy: { N_Interno: 'asc' },
    });
    return NextResponse.json(telefonia);
  } catch (error) {
    console.error('Error fetching telefonia:', error);
    return NextResponse.json({ error: 'Error al obtener inventario' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { N_Interno, Empresa, Cliente, Marca, Modelo, Usuario, Departamento, Ubicacion, IMEI, ICCID, Region_SIM, Cuenta, Numero, Plan, PZO, Estatus } = body;

    if (!N_Interno) {
      return NextResponse.json({ error: 'N_Interno es requerido' }, { status: 400 });
    }

    const nuevoTelefono = await prisma.inventario_Telefonia.create({
      data: {
        N_Interno: N_Interno.toString(),
        Empresa: Empresa?.toString(),
        Cliente: Cliente?.toString(),
        Marca: Marca?.toString(),
        Modelo: Modelo?.toString(),
        Usuario: Usuario?.toString(),
        Departamento: Departamento?.toString(),
        Ubicacion: Ubicacion?.toString(),
        IMEI: IMEI?.toString(),
        ICCID: ICCID?.toString(),
        Region_SIM: Region_SIM?.toString(),
        Cuenta: Cuenta?.toString(),
        Numero: Numero?.toString(),
        Plan: Plan?.toString(),
        PZO: PZO ? parseInt(PZO.toString(), 10) : 0,
        Estatus: Estatus?.toString() || 'Activo',
      },
    });

    return NextResponse.json(nuevoTelefono, { status: 201 });
  } catch (error: any) {
    console.error('Error creating telefono:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un equipo con ese N_Interno' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error al crear equipo' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { N_Interno, Empresa, Cliente, Marca, Modelo, Usuario, Departamento, Ubicacion, IMEI, ICCID, Region_SIM, Cuenta, Numero, Plan, PZO, Estatus } = body;

    if (!N_Interno) {
      return NextResponse.json({ error: 'N_Interno es requerido' }, { status: 400 });
    }

    const actualizado = await prisma.inventario_Telefonia.update({
      where: { N_Interno: N_Interno.toString() },
      data: {
        Empresa: Empresa?.toString(),
        Cliente: Cliente?.toString(),
        Marca: Marca?.toString(),
        Modelo: Modelo?.toString(),
        Usuario: Usuario?.toString(),
        Departamento: Departamento?.toString(),
        Ubicacion: Ubicacion?.toString(),
        IMEI: IMEI?.toString(),
        ICCID: ICCID?.toString(),
        Region_SIM: Region_SIM?.toString(),
        Cuenta: Cuenta?.toString(),
        Numero: Numero?.toString(),
        Plan: Plan?.toString(),
        PZO: PZO !== undefined && PZO !== null ? parseInt(PZO.toString(), 10) : 0,
        Estatus: Estatus?.toString(),
      },
    });

    return NextResponse.json(actualizado);
  } catch (error) {
    console.error('Error updating telefono:', error);
    return NextResponse.json({ error: 'Error al actualizar equipo' }, { status: 500 });
  }
}
