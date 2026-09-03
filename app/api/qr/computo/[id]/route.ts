import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Cache ligero en memoria para rate-limiting por IP (Cooldown de 10 segundos)
const ipCooldownMap = new Map<string, number>();

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
        Estado: { in: ['PENDIENTE', 'EN_PROCESO', 'EN PROCESO'] }
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

    // 1. Rate Limiting por IP (Prevenir spam de clics en ráfaga)
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const lastRequest = ipCooldownMap.get(ip);
    if (lastRequest && (now - lastRequest) < 10000) { // 10 segundos de cooldown
      return NextResponse.json(
        { error: 'Por favor espera unos segundos antes de enviar otro reporte.' },
        { status: 429 }
      );
    }
    ipCooldownMap.set(ip, now);

    // Limpieza periódica de mapa de IPs
    if (ipCooldownMap.size > 1000) {
      ipCooldownMap.clear();
    }

    const body = await request.json();
    const {
      nombre,
      oficina,
      departamento,
      telegram,
      sintoma,
      prioridad,
      descripcion,
      evidencia_url,
      // Honeypot anti-bots (campo señuelo)
      website,
      hp_check
    } = body;

    // 2. Trampa Honeypot: Si un bot llenó el campo oculto, descartar silenciosamente
    if (website || hp_check) {
      return NextResponse.json({ 
        success: true, 
        ticket: { Pk_folio_ticket: 'TKT-BOT-DISCARDED' } 
      });
    }

    // 3. Sanitización y límites de longitud de caracteres
    const cleanNombre = String(nombre || '').slice(0, 100).trim();
    const cleanOficina = String(oficina || '').slice(0, 100).trim();
    const cleanDepto = String(departamento || '').slice(0, 100).trim();
    const cleanSintoma = String(sintoma || '').slice(0, 100).trim();
    const cleanTelegram = telegram ? String(telegram).replace('@', '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 50).trim() : null;
    const cleanDescripcion = descripcion ? String(descripcion).slice(0, 500).trim() : '';
    const cleanPrioridad = ['Normal', 'Urgente'].includes(prioridad) ? prioridad : 'Normal';

    // Validación de campos obligatorios
    if (!cleanNombre) {
      return NextResponse.json({ error: 'El nombre completo es obligatorio.' }, { status: 400 });
    }
    if (!cleanOficina) {
      return NextResponse.json({ error: 'La oficina o ubicación donde te encuentras es obligatoria.' }, { status: 400 });
    }
    if (!cleanDepto) {
      return NextResponse.json({ error: 'El departamento es obligatorio.' }, { status: 400 });
    }
    if (!cleanSintoma) {
      return NextResponse.json({ error: 'El síntoma principal es obligatorio.' }, { status: 400 });
    }

    // 4. Verificar existencia del equipo en inventario
    const equipo = await prisma.inventario_Computo.findUnique({
      where: { C_Interno: cInterno }
    });

    if (!equipo) {
      return NextResponse.json({ error: 'El equipo no existe en el inventario.' }, { status: 404 });
    }

    // 5. Candado en Backend Anti-Duplicados:
    // Si ya existe un ticket PENDIENTE o EN PROCESO para este equipo, rechazar con 409
    const ticketDuplicado = await prisma.solicitud_Computo.findFirst({
      where: {
        C_Interno: cInterno,
        Estado: { in: ['PENDIENTE', 'EN_PROCESO', 'EN PROCESO'] }
      },
      select: { Pk_folio_ticket: true, Fecha_Realizacion: true }
    });

    if (ticketDuplicado) {
      return NextResponse.json({
        error: `Este equipo ya cuenta con un reporte en proceso activo (#${ticketDuplicado.Pk_folio_ticket}). No es posible generar reportes duplicados hasta que el actual sea atendido por TI.`,
        folioActivo: ticketDuplicado.Pk_folio_ticket
      }, { status: 409 });
    }

    // Generar Folio Único (ej. TKT-2026-XXXX)
    const anio = new Date().getFullYear();
    const count = await prisma.solicitud_Computo.count();
    const folio = `TKT-${anio}-${String(count + 1).padStart(4, '0')}`;

    // Construir descripción legible
    let descFinal = `Reporte generado por QR físico en equipo ${cInterno}.\nSolicitante: ${cleanNombre}\nOficina: ${cleanOficina}\nDepartamento: ${cleanDepto}`;
    if (cleanTelegram) {
      descFinal += `\nTelegram: @${cleanTelegram}`;
    }
    descFinal += `\nSíntoma: ${cleanSintoma}`;
    if (cleanDescripcion) {
      descFinal += `\nDetalles: ${cleanDescripcion}`;
    }

    // 6. Inserción protegida por Prisma (Consultas parametrizadas con 0% riesgo SQL Injection)
    const ticket = await prisma.solicitud_Computo.create({
      data: {
        Pk_folio_ticket: folio,
        C_Interno: cInterno,
        Email_Empleado: null,
        Solicitante_Nombre: cleanNombre,
        Solicitante_Oficina: cleanOficina,
        Solicitante_Depto: cleanDepto,
        Solicitante_Telegram: cleanTelegram,
        Tipo_Servicio: cleanSintoma,
        Descripcion: descFinal,
        Prioridad: cleanPrioridad,
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
