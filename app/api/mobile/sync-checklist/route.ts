import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { minioClient, uploadToMinio } from '@/lib/minio';
import { generarChecklistVehicularPDF, ChecklistPayload } from '@/lib/pdf/generarChecklistVehicular';
import { logAuditoria } from '@/lib/utils/audit';
import { verificarSesionMovil } from '@/lib/mobileAuth';

const MAX_CHECKLISTS_POR_UNIDAD = 10; // Retención inteligente: conserva los últimos 10 PDFs por unidad y purga los más antiguos de MinIO

export async function POST(request: Request) {
  try {
    const auth = await verificarSesionMovil(request);
    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error, code: 'UNAUTHORIZED' },
        { status: auth.status }
      );
    }

    const body: ChecklistPayload & {
      responsableEmail?: string;
      inspectorEmail?: string;
    } = await request.json();

    if (!body.consecutivo) {
      return NextResponse.json({ error: 'Falta el consecutivo del vehículo' }, { status: 400 });
    }

    const consecutivoUpper = body.consecutivo.toUpperCase().trim();
    const consecutivoFolder = consecutivoUpper.toLowerCase();
    const fechaStr = body.fechaRevision || new Date().toISOString().slice(0, 10);
    const folio = body.folio || `CHK-${consecutivoUpper}-${Date.now().toString().slice(-6)}`;
    const inspectorFinal = body.inspector || auth.nombreCompleto;

    // 1. Generar el PDF oficial (HOJA DE REVISION DE VEHICULOS + Anexo Fotográfico con fotos y firmas ya incrustadas)
    //    Estrategia Ahorro NVMe (Single-Artifact Storage):
    //    No guardamos fotos ni firmas sueltas por duplicado en MinIO; todo queda dentro del único PDF comprimido (~250KB).
    const pdfBuffer = await generarChecklistVehicularPDF({
      ...body,
      inspector: inspectorFinal,
      consecutivo: consecutivoUpper,
      folio,
    });

    const pdfObjectName = `${consecutivoFolder}/${fechaStr}_${folio}.pdf`;
    const pdfPublicUrl = await uploadToMinio(pdfObjectName, pdfBuffer, 'application/pdf', 'checklists');

    // 2. Preparar el JSON ligero (sin base64 pesado) para pre-cargar respuestas en futuros checklists
    const {
      fotos: rawFotos,
      firmaResponsableBase64: _fr,
      firmaInspectorBase64: _fi,
      ...datosEstructurados
    } = body;

    const resumenFotos = Array.isArray(rawFotos)
      ? rawFotos.map((f) => ({ fase: f.fase, etiqueta: f.etiqueta, incrustadaEnPdf: true }))
      : [];

    const kmNum = body.kilometraje ? parseInt(String(body.kilometraje).replace(/\D/g, ''), 10) : null;

    const opcionesFecha: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const fechaLegible = new Date().toLocaleDateString('es-MX', opcionesFecha);
    const tituloAuto = `Checklist ${fechaLegible} (${folio})`;

    // 3. Garantizar que la unidad exista en Inventario_Automoviles (evita error FK P2003 si es unidad nueva o semilla como AVH-016)
    const autoExistente = await prisma.inventario_Automoviles.findUnique({
      where: { Consecutivo: consecutivoUpper },
    });

    const vencimientoPolizaDate =
      body.vencimientoSeguro && /^\d{4}-\d{2}-\d{2}$/.test(body.vencimientoSeguro)
        ? new Date(body.vencimientoSeguro)
        : undefined;

    if (!autoExistente) {
      const placaLimpia = body.placas ? body.placas.toUpperCase().trim() : `SN-${consecutivoUpper}`;
      // Verificar que la placa no colisione con otra unidad
      const placaOcupada = await prisma.inventario_Automoviles.findUnique({ where: { Placa: placaLimpia } });

      await prisma.inventario_Automoviles.create({
        data: {
          Consecutivo: consecutivoUpper,
          Placa: placaOcupada ? `${placaLimpia}-${consecutivoUpper}` : placaLimpia,
          Marca: body.marca || 'NISSAN',
          Linea: body.tipo || 'NP300',
          Modelo: body.modelo || '2020',
          Color: body.color || 'BLANCO',
          Numero_Serie: body.numeroSerie || null,
          Poliza_Seguro: body.polizaSeguro || null,
          Vencimiento_Poliza: vencimientoPolizaDate || null,
          Kilometraje: kmNum && !isNaN(kmNum) && kmNum > 0 ? kmNum : null,
          Estado_Unidad: true,
          Estatus_Operativo: 'Activo en flota',
        },
      });
    } else {
      // 4. Actualizar kilometraje y Vencimiento_Poliza del vehículo existente en Inventario_Automoviles
      const updateAutoData: Record<string, any> = {};
      if (kmNum && !isNaN(kmNum) && kmNum > 0) {
        updateAutoData.Kilometraje = kmNum;
      }
      if (vencimientoPolizaDate) {
        updateAutoData.Vencimiento_Poliza = vencimientoPolizaDate;
      }
      if (body.polizaSeguro) {
        updateAutoData.Poliza_Seguro = body.polizaSeguro;
      }
      if (body.numeroSerie && !autoExistente.Numero_Serie) {
        updateAutoData.Numero_Serie = body.numeroSerie;
      }

      if (Object.keys(updateAutoData).length > 0) {
        await prisma.inventario_Automoviles
          .update({
            where: { Consecutivo: consecutivoUpper },
            data: updateAutoData,
          })
          .catch(() => {});
      }
    }

    // 5. Guardar o actualizar registro en la tabla Checklist de PostgreSQL (Idempotente por Folio_Checklist)
    const checklistExistente = await prisma.checklist.findFirst({
      where: {
        Consecutivo: consecutivoUpper,
        Folio_Checklist: folio,
      },
    });

    const checklistData = {
      Consecutivo: consecutivoUpper,
      Titulo: tituloAuto,
      Ruta_PDF: pdfPublicUrl,
      Folio_Checklist: folio,
      Kilometraje: kmNum && !isNaN(kmNum) ? kmNum : null,
      Responsable: body.responsable || null,
      Inspector: inspectorFinal || null,
      Datos_JSON: JSON.stringify(datosEstructurados),
      Fotos_JSON: JSON.stringify(resumenFotos),
      Firma_Responsable: body.firmaResponsableBase64 ? 'INCRUSTADA_EN_PDF' : null,
      Firma_Inspector: body.firmaInspectorBase64 ? 'INCRUSTADA_EN_PDF' : null,
      Origen: 'APP_ANDROID',
    };

    const nuevoChecklist = checklistExistente
      ? await prisma.checklist.update({
          where: { id: checklistExistente.id },
          data: checklistData,
        })
      : await prisma.checklist.create({
          data: checklistData,
        });

    // 5. Actualizar fecha de vencimiento de licencia del conductor si aplica
    if (
      body.responsableEmail &&
      body.licenciaManejo?.fechaVencimiento &&
      /^\d{4}-\d{2}-\d{2}$/.test(body.licenciaManejo.fechaVencimiento)
    ) {
      await prisma.empleados
        .update({
          where: { Email: body.responsableEmail },
          data: {
            Vencimiento_Licencia: new Date(body.licenciaManejo.fechaVencimiento),
          },
        })
        .catch(() => {});
    }

    // 6. Auto-rotación de disco NVMe: Si la unidad supera MAX_CHECKLISTS_POR_UNIDAD, borrar los PDFs antiguos de MinIO
    const todosChecklists = await prisma.checklist.findMany({
      where: { Consecutivo: consecutivoUpper },
      orderBy: { Fecha_Subida: 'desc' },
    });

    if (todosChecklists.length > MAX_CHECKLISTS_POR_UNIDAD) {
      const antiguos = todosChecklists.slice(MAX_CHECKLISTS_POR_UNIDAD);
      for (const viejo of antiguos) {
        if (viejo.Ruta_PDF && viejo.Ruta_PDF.includes('/checklists/')) {
          const parts = viejo.Ruta_PDF.split('/checklists/');
          if (parts[1]) {
            await minioClient.removeObject('checklists', parts[1]).catch(() => {});
          }
        }
        await prisma.checklist.delete({ where: { id: viejo.id } }).catch(() => {});
      }
    }

    await logAuditoria(
      auth.email || body.inspectorEmail || inspectorFinal || 'App Android',
      'SYNC_CHECKLIST_MOVIL',
      'CHECKLISTS',
      `Checklist móvil sincronizado (${folio}) para unidad ${consecutivoUpper} por ${auth.nombreCompleto} (PDF optimizado con ${resumenFotos.length} fotos incrustadas).`
    );

    return NextResponse.json({
      success: true,
      id: nuevoChecklist.id,
      folio,
      pdfUrl: pdfPublicUrl,
      pesoPdfKB: Math.round(pdfBuffer.length / 1024),
      mensaje: 'Checklist PDF optimizado guardado en MinIO sin duplicar fotos',
    });
  } catch (error: any) {
    console.error('Error en /api/mobile/sync-checklist:', error);
    return NextResponse.json(
      { error: 'Error al sincronizar el checklist', detalle: error?.message || String(error) },
      { status: 500 }
    );
  }
}
