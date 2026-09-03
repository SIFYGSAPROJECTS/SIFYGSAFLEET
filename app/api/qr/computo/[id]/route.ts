import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cInterno = decodeURIComponent(id).trim();

    const equipo = await prisma.inventario_Computo.findUnique({
      where: { C_Interno: cInterno },
      select: {
        C_Interno: true,
        Marca: true,
        Modelo: true,
        Usuario: true,
        Departamento: true,
        Service_Tag: true,
        Estatus: true,
      }
    });

    if (!equipo) {
      return NextResponse.json({ error: 'Equipo no encontrado en el inventario' }, { status: 404 });
    }

    // Buscar si ya existe un ticket activo para este equipo
    const ticketActivo = await prisma.solicitud_Computo.findFirst({
      where: {
        C_Interno: cInterno,
        Estado: { in: ['PENDIENTE', 'EN_PROCESO'] }
      },
      orderBy: { Fecha_Realizacion: 'desc' },
      select: {
        Pk_folio_ticket: true,
        Estado: true,
        Tipo_Servicio: true,
        Descripcion: true,
        Fecha_Realizacion: true,
        Solicitante_Nombre: true,
      }
    });

    return NextResponse.json({ equipo, ticketActivo });
  } catch (error: any) {
    console.error('Error obteniendo datos del equipo por QR:', error);
    return NextResponse.json({ error: 'Error del servidor al consultar equipo' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cInterno = decodeURIComponent(id).trim();

    const body = await request.json();
    const {
      nombre,
      oficina,
      departamento,
      telegram,
      sintoma,
      prioridad,
      descripcion,
      evidencia_url
    } = body;

    // Validación de campos obligatorios
    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ error: 'El nombre completo es obligatorio.' }, { status: 400 });
    }
    if (!oficina || !oficina.trim()) {
      return NextResponse.json({ error: 'La oficina o ubicación donde te encuentras es obligatoria.' }, { status: 400 });
    }
    if (!departamento || !departamento.trim()) {
      return NextResponse.json({ error: 'El departamento es obligatorio.' }, { status: 400 });
    }
    if (!sintoma || !sintoma.trim()) {
      return NextResponse.json({ error: 'El síntoma principal es obligatorio.' }, { status: 400 });
    }

    // Verificar que el equipo exista
    const equipo = await prisma.inventario_Computo.findUnique({
      where: { C_Interno: cInterno }
    });

    if (!equipo) {
      return NextResponse.json({ error: 'El equipo no existe en el inventario.' }, { status: 404 });
    }

    // Generar Folio Único (ej. TKT-2026-XXXX)
    const anio = new Date().getFullYear();
    const count = await prisma.solicitud_Computo.count();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const folio = `TKT-${anio}-${String(count + 1).padStart(4, '0')}`;

    // Construir descripción legible
    let descFinal = `Reporte generado por QR físico en equipo ${cInterno}.\nSolicitante: ${nombre.trim()}\nOficina: ${oficina.trim()}\nDepartamento: ${departamento.trim()}`;
    if (telegram) {
      descFinal += `\nTelegram: @${telegram.replace('@', '').trim()}`;
    }
    descFinal += `\nSíntoma: ${sintoma}`;
    if (descripcion && descripcion.trim()) {
      descFinal += `\nDetalles: ${descripcion.trim()}`;
    }

    const ticket = await prisma.solicitud_Computo.create({
      data: {
        Pk_folio_ticket: folio,
        C_Interno: cInterno,
        Email_Empleado: null,
        Solicitante_Nombre: nombre.trim(),
        Solicitante_Oficina: oficina.trim(),
        Solicitante_Depto: departamento.trim(),
        Solicitante_Telegram: telegram ? telegram.replace('@', '').trim() : null,
        Tipo_Servicio: 'Reporte de falla vía QR',
        Descripcion: descFinal,
        Prioridad: prioridad || 'Normal',
        Evidencia_URL: evidencia_url || null,
        Estado: 'PENDIENTE',
      },
      include: {
        equipo: true
      }
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error: any) {
    console.error('Error registrando reporte por QR:', error);
    return NextResponse.json({ error: 'Error del servidor al registrar el reporte.' }, { status: 500 });
  }
}
