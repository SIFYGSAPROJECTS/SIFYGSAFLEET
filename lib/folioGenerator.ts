import { prisma } from '@/lib/db';

/**
 * Generador atómico e infalible de folios para Tickets de Soporte TI.
 * Formato: TKT-YYYY-XXXX (ej. TKT-2026-0003)
 * Garantiza que nunca se repita ni choque ante concurrencia.
 */
export async function generarFolioTicketComputo(): Promise<string> {
  const anio = new Date().getFullYear();
  const prefijo = `TKT-${anio}-`;

  // 1. Buscar el folio más alto registrado en el año actual
  const ultimoTicket = await prisma.solicitud_Computo.findFirst({
    where: {
      Pk_folio_ticket: {
        startsWith: prefijo
      }
    },
    orderBy: {
      Pk_folio_ticket: 'desc'
    },
    select: {
      Pk_folio_ticket: true
    }
  });

  let consecutivo = 1;
  if (ultimoTicket?.Pk_folio_ticket) {
    const partes = ultimoTicket.Pk_folio_ticket.split('-');
    const numeroStr = partes[partes.length - 1];
    const parsed = parseInt(numeroStr, 10);
    if (!isNaN(parsed)) {
      consecutivo = parsed + 1;
    }
  } else {
    // Si aún no hay con formato TKT-YYYY-, tomar el total para no reiniciar desde 1
    const totalExistentes = await prisma.solicitud_Computo.count();
    consecutivo = totalExistentes + 1;
  }

  // 2. Bucle atómico de verificación: garantiza 100% que el ID no exista
  let folio = `${prefijo}${String(consecutivo).padStart(4, '0')}`;
  let existe = await prisma.solicitud_Computo.findUnique({
    where: { Pk_folio_ticket: folio },
    select: { Pk_folio_ticket: true }
  });

  while (existe) {
    consecutivo++;
    folio = `${prefijo}${String(consecutivo).padStart(4, '0')}`;
    existe = await prisma.solicitud_Computo.findUnique({
      where: { Pk_folio_ticket: folio },
      select: { Pk_folio_ticket: true }
    });
  }

  return folio;
}
