import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getVerificationPeriods } from '@/lib/utils/verificaciones';
import { verificarSesionMovil } from '@/lib/mobileAuth';

const NOMBRES_MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

function obtenerBimestrePlaca(placa?: string | null): string {
  if (!placa) return 'N/A';
  const periodos = getVerificationPeriods(placa, new Date().getFullYear());
  if (!periodos || periodos.length === 0) return 'N/A';
  const m1 = NOMBRES_MESES[periodos[0].fechaInicio.getMonth()];
  const m2 = NOMBRES_MESES[periodos[0].fechaFin.getMonth()];
  return `${m1}/${m2}`;
}

export async function GET(request: Request) {
  try {
    const auth = await verificarSesionMovil(request);
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error, code: 'UNAUTHORIZED' },
        { status: auth.status }
      );
    }

    const anioActual = new Date().getFullYear();

    const vehiculos = await prisma.inventario_Automoviles.findMany({
      where: { Estado_Unidad: true },
      include: {
        encargado: true,
        documentos: {
          orderBy: { Fecha_Subida: 'desc' },
        },
        verificaciones: {
          where: { Anio: anioActual },
          orderBy: { Periodo: 'desc' },
        },
        checklists: {
          orderBy: { Fecha_Subida: 'desc' },
          take: 1,
        },
        solicitudes: {
          orderBy: { Fecha_Realizacion: 'desc' },
          take: 1,
          select: { Kilometraje: true },
        },
      },
      orderBy: { Consecutivo: 'asc' },
    });

    const inspectores = await prisma.empleados.findMany({
      where: { Estatus_Acceso: 'Activo' },
      select: {
        Email: true,
        Nombre_Empleado: true,
        A_Paterno: true,
        A_Materno: true,
        Cargo: true,
        Rol: true,
        Vencimiento_Licencia: true,
      },
      orderBy: { Nombre_Empleado: 'asc' },
    });

    const catalogo = vehiculos.map((v) => {
      // Buscar fecha de expiración de póliza en Vencimiento_Poliza o en Documentos_Unidad
      const docPoliza = v.documentos.find((d) =>
        /poliza|póliza|seguro/i.test(d.Titulo)
      );
      const docTarjeta = v.documentos.find((d) =>
        /tarjeta|circulaci/i.test(d.Titulo)
      );

      const vencimientoPoliza =
        v.Vencimiento_Poliza?.toISOString().slice(0, 10) ||
        docPoliza?.Fecha_Expiracion?.toISOString().slice(0, 10) ||
        null;

      const vencimientoTarjeta =
        docTarjeta?.Fecha_Expiracion?.toISOString().slice(0, 10) || null;

      const vencimientoLicencia =
        v.encargado?.Vencimiento_Licencia?.toISOString().slice(0, 10) || null;

      const ultimoChecklist = v.checklists[0] || null;
      let ultimoChecklistDatos = null;
      if (ultimoChecklist?.Datos_JSON) {
        try {
          ultimoChecklistDatos = JSON.parse(ultimoChecklist.Datos_JSON);
        } catch {
          ultimoChecklistDatos = null;
        }
      }

      const kmUltimo =
        ultimoChecklist?.Kilometraje ||
        v.Kilometraje ||
        v.solicitudes[0]?.Kilometraje ||
        0;

      const bimestreEngomado = obtenerBimestrePlaca(v.Placa);
      const verificacionActual = v.verificaciones[0] || null;

      const nombreResponsable = v.encargado
        ? `${v.encargado.Nombre_Empleado} ${v.encargado.A_Paterno} ${v.encargado.A_Materno || ''}`.trim()
        : '';

      return {
        consecutivo: v.Consecutivo,
        placas: v.Placa,
        marca: v.Marca || '',
        modelo: v.Modelo || '',
        linea: v.Linea || '',
        color: v.Color || '',
        numeroSerie: v.Numero_Serie || '',
        polizaSeguro: v.Poliza_Seguro || '',
        vencimientoPoliza,
        vencimientoTarjeta,
        tieneTarjetaCirculacionDoc: Boolean(docTarjeta),
        tienePolizaDoc: Boolean(docPoliza || v.Poliza_Seguro),
        bimestreVerificacion: bimestreEngomado,
        estadoVerificacion: verificacionActual?.Estado || 'PENDIENTE',
        fechaFinVerificacion: verificacionActual?.Fecha_Fin_Plazo?.toISOString().slice(0, 10) || null,
        kilometrajeActual: kmUltimo,
        estatusOperativo: v.Estatus_Operativo,
        ubicacion: v.Ubicacion || '',
        departamento: v.Departamento || '',
        responsableEmail: v.Email_encargado || '',
        responsableNombre: nombreResponsable,
        vencimientoLicencia,
        ultimoChecklistFecha: ultimoChecklist?.Fecha_Subida?.toISOString() || null,
        ultimoChecklistFolio: ultimoChecklist?.Folio_Checklist || null,
        ultimoChecklistDatos,
      };
    });

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      vehiculos: catalogo,
      empleados: inspectores.map((e) => ({
        email: e.Email,
        nombreCompleto: `${e.Nombre_Empleado} ${e.A_Paterno} ${e.A_Materno || ''}`.trim(),
        cargo: e.Cargo || '',
        rol: e.Rol,
        vencimientoLicencia: e.Vencimiento_Licencia?.toISOString().slice(0, 10) || null,
      })),
    });
  } catch (error) {
    console.error('Error en /api/mobile/catalogo:', error);
    return NextResponse.json({ error: 'Error al obtener catálogo móvil' }, { status: 500 });
  }
}
