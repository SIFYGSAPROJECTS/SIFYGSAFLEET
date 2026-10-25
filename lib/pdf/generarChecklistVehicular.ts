import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ChecklistPayload {
  folio: string;
  fechaRevision: string;
  consecutivo: string;
  placas: string;
  numeroSerie: string;
  marca: string;
  modelo: string;
  tipo: string;
  color: string;
  polizaSeguro: string;
  vencimientoSeguro: string;
  verificacionVehicular: string;
  kilometraje: number | string;
  millas?: number | string;
  combustible?: string;
  licenciaManejo: {
    tiene: 'SI' | 'NO';
    fechaVencimiento: string;
  };
  polizaVigente: 'SI' | 'NO';
  observaciones: string[];
  inventario: Record<string, 'SI' | 'NO'>;
  funciona: Record<string, 'SI' | 'NO'>;
  condicion: Record<string, 'SI' | 'NO'>;
  alertas: Record<string, 'SI' | 'NO'>;
  luces: string;
  herramientaYDanos: {
    gato: string;
    cable: string;
    senales: string;
    extintor: string;
    embudo: string;
    refaccion: string;
    golpes: string;
    pinturaRayada: string;
    pinturaBrizada: string;
    vidriosRotos: string;
  };
  cofreAbierto: {
    aceiteMotor: string;
    refrigerante: string;
    bandas: string;
    liquidoDH: string;
    liquidoFrenos: string;
    tuboMangueras: string;
    tapaDeposito: string;
  };
  llantas: {
    delanteraDerecha: string;
    traseraDerecha: string;
    delanteraIzquierda: string;
    traseraIzquierda: string;
  };
  responsable: string;
  inspector: string;
  firmaResponsableBase64?: string | null;
  firmaInspectorBase64?: string | null;
  fotos?: Array<{
    fase: string;
    etiqueta: string;
    url?: string;
    base64?: string;
  }>;
}

export async function generarChecklistVehicularPDF(data: ChecklistPayload): Promise<Buffer> {
  const doc = new jsPDF('p', 'mm', 'letter');
  const pageWidth = doc.internal.pageSize.getWidth();

  const headerBg: [number, number, number] = [230, 234, 240];
  const sectionBg: [number, number, number] = [30, 41, 59];
  const borderCol: [number, number, number] = [148, 163, 184];
  const darkText: [number, number, number] = [15, 23, 42];

  const baseStyles = {
    fontSize: 7,
    textColor: darkText,
    cellPadding: 1.2,
    lineColor: borderCol,
    lineWidth: 0.2,
    valign: 'middle' as const,
  };

  const margin = { left: 10, right: 10 };

  // ==========================================
  // 1. ENCABEZADO OFICIAL: HOJA DE REVISION DE VEHICULOS
  // ==========================================
  autoTable(doc, {
    startY: 8,
    margin,
    theme: 'grid',
    styles: baseStyles,
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold', halign: 'center' },
      1: { cellWidth: 96, fontStyle: 'bold', fontSize: 10, halign: 'center', fillColor: headerBg },
      2: { cellWidth: 30, fontStyle: 'bold', fillColor: headerBg },
      3: { cellWidth: 30, halign: 'center' },
    },
    body: [
      [
        { content: 'SIFYGSA FLEET\nCONTROL VEHICULAR', rowSpan: 3 },
        { content: 'HOJA DE REVISIÓN DE VEHÍCULOS', rowSpan: 3 },
        'Página:',
        '1 de 1',
      ],
      ['FECHA REVISIÓN:', data.fechaRevision || new Date().toISOString().slice(0, 10)],
      ['CONSECUTIVO / FOLIO:', data.folio || data.consecutivo],
    ],
  });

  let y = (doc as any).lastAutoTable.finalY + 1.5;

  // ==========================================
  // 2. DATOS DE SERIE, PLACAS Y VIGENCIAS
  // ==========================================
  autoTable(doc, {
    startY: y,
    margin,
    theme: 'grid',
    styles: baseStyles,
    body: [
      [
        { content: 'N° DE SERIE', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'PLACAS', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'MARCA', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'MODELO', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'TIPO / LÍNEA', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'ID UNIDAD', styles: { fontStyle: 'bold', fillColor: headerBg } },
      ],
      [
        data.numeroSerie || 'N/A',
        data.placas || 'N/A',
        data.marca || 'N/A',
        data.modelo || 'N/A',
        data.tipo || 'N/A',
        { content: data.consecutivo || 'N/A', styles: { fontStyle: 'bold' } },
      ],
      [
        { content: 'N° DE PÓLIZA DE SEGURO', colSpan: 2, styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'VTO. SEGURO', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'V. VEHICULAR (ENGOMADO)', colSpan: 2, styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'COLOR', styles: { fontStyle: 'bold', fillColor: headerBg } },
      ],
      [
        { content: data.polizaSeguro || 'N/A', colSpan: 2 },
        data.vencimientoSeguro || 'N/A',
        { content: data.verificacionVehicular || 'N/A', colSpan: 2 },
        data.color || 'N/A',
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 1.5;

  // ==========================================
  // 3. OBSERVACIONES (1 AL 9)
  // ==========================================
  const obs = Array.from({ length: 9 }, (_, i) => data.observaciones?.[i] || '');
  autoTable(doc, {
    startY: y,
    margin,
    theme: 'grid',
    styles: { ...baseStyles, fontSize: 6.5, cellPadding: 0.9 },
    body: [
      [{ content: 'OBSERVACIONES GENERALES DE LA UNIDAD', colSpan: 3, styles: { fontStyle: 'bold', fillColor: sectionBg, textColor: [255, 255, 255] } }],
      [`1.- ${obs[0]}`, `4.- ${obs[3]}`, `7.- ${obs[6]}`],
      [`2.- ${obs[1]}`, `5.- ${obs[4]}`, `8.- ${obs[7]}`],
      [`3.- ${obs[2]}`, `6.- ${obs[5]}`, `9.- ${obs[8]}`],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 1.5;

  // ==========================================
  // 4. LICENCIA DE MANEJO Y PÓLIZA DE SEGURO
  // ==========================================
  autoTable(doc, {
    startY: y,
    margin,
    theme: 'grid',
    styles: baseStyles,
    body: [
      [
        { content: 'L. DE MANEJO:', styles: { fontStyle: 'bold', fillColor: headerBg } },
        `SI [${data.licenciaManejo?.tiene === 'SI' ? 'X' : ' '}]   NO [${data.licenciaManejo?.tiene === 'NO' ? 'X' : ' '}]`,
        { content: 'FECHA VENCIMIENTO:', styles: { fontStyle: 'bold', fillColor: headerBg } },
        data.licenciaManejo?.fechaVencimiento || 'N/A',
        { content: 'PÓLIZA DE SEGURO EN UNIDAD:', styles: { fontStyle: 'bold', fillColor: headerBg } },
        `SI [${data.polizaVigente === 'SI' ? 'X' : ' '}]   NO [${data.polizaVigente === 'NO' ? 'X' : ' '}]`,
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 1.5;

  // ==========================================
  // 5. MATRIZ DE 4 COLUMNAS (INVENTARIO | FUNCIONA | CONDICIÓN | ALERTA)
  // ==========================================
  const mark = (val?: 'SI' | 'NO') => `[${val === 'SI' ? 'SI' : val === 'NO' ? 'NO' : ' - '}]`;

  const rowsMatriz = [
    ['TAPETES', mark(data.inventario?.tapetes), 'CLAXON', mark(data.funciona?.claxon), 'PEDAL DE EMBRAGUE', mark(data.condicion?.pedalEmbrague), 'AVISO CAMBIAR LLANTA', mark(data.alertas?.cambiarLlanta)],
    ['ESTÉREO', mark(data.inventario?.estereo), 'LIMPIAPARABRISAS', mark(data.funciona?.limpiaparabrisas), 'PALANCA DE VELOC.', mark(data.condicion?.palancaVelocidades), 'AVISO DE SERVICIO', mark(data.alertas?.servicio)],
    ['PANTALLA', mark(data.inventario?.pantalla), 'CLIMA/CALEFACTOR', mark(data.funciona?.clima), 'FRENO DE MANO', mark(data.condicion?.frenoMano), 'AVISO CHECAR BATERÍA', mark(data.alertas?.bateria)],
    ['ENCENDEDOR', mark(data.inventario?.encendedor), 'GPS', mark(data.funciona?.gps), 'ASIENTOS/VESTIDURA', mark(data.condicion?.asientos), 'AVISO CHECAR MOTOR', mark(data.alertas?.motor)],
    ['TARJETA DE CIRCULACIÓN', mark(data.inventario?.tarjetaCirculacion), 'VENTANA', mark(data.funciona?.ventana), 'Km ACTUAL', String(data.kilometraje || ''), 'AVISO CHECAR LLANTA', mark(data.alertas?.checarLlanta)],
    ['PÓLIZA DE GARANTÍA', mark(data.inventario?.polizaGarantia), 'SEGUROS', mark(data.funciona?.seguros), 'Millas', String(data.millas || 'N/A'), 'AVISO CHECAR FRENOS', mark(data.alertas?.frenos)],
    [
      'MANUAL DE PROPIETARIO',
      mark(data.inventario?.manualPropietario),
      'ESPEJOS',
      mark(data.funciona?.espejos),
      { content: 'GASOLINA', styles: { fontStyle: 'bold' as const, fillColor: headerBg } },
      data.combustible
        ? data.combustible === 'VACIO'
          ? 'RESERVA (E)'
          : data.combustible === 'LLENO'
          ? 'LLENO (F)'
          : `${data.combustible} TANQUE`
        : '1/2 TANQUE',
      'AVISO CHECAR ABS',
      mark(data.alertas?.abs),
    ],
    ['DADO DE SEGURIDAD', mark(data.inventario?.dadoSeguridad), 'QUEMACOCOS', mark(data.funciona?.quemacocos), '', '', 'AVISO CHECAR BOLSAS', mark(data.alertas?.bolsas)],
  ];

  autoTable(doc, {
    startY: y,
    margin,
    theme: 'grid',
    styles: { ...baseStyles, fontSize: 6.3, cellPadding: 0.9 },
    head: [[
      { content: 'INVENTARIO', colSpan: 2, styles: { halign: 'center', fillColor: sectionBg, textColor: [255, 255, 255] } },
      { content: 'FUNCIONA', colSpan: 2, styles: { halign: 'center', fillColor: sectionBg, textColor: [255, 255, 255] } },
      { content: 'CONDICIÓN', colSpan: 2, styles: { halign: 'center', fillColor: sectionBg, textColor: [255, 255, 255] } },
      { content: 'ALERTA TABLERO', colSpan: 2, styles: { halign: 'center', fillColor: sectionBg, textColor: [255, 255, 255] } },
    ]],
    body: [
      ...rowsMatriz,
      [
        { content: 'INSPECCIÓN DE LUCES INTERNAS / EXTERNAS:', colSpan: 3, styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: data.luces || 'FUNCIONANDO CORRECTAMENTE', colSpan: 5 },
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 1.5;

  // ==========================================
  // 6. HERRAMIENTA Y CARROCERÍA EXTERIOR
  // ==========================================
  const hd = data.herramientaYDanos || ({} as any);
  autoTable(doc, {
    startY: y,
    margin,
    theme: 'grid',
    styles: { ...baseStyles, fontSize: 6.5 },
    body: [
      [
        { content: `GATO: ${hd.gato || 'SI'}`, styles: { fontStyle: 'bold' } },
        { content: `SEÑALES: ${hd.senales || 'SI'}`, styles: { fontStyle: 'bold' } },
        { content: `EMBUDO: ${hd.embudo || 'SI'}`, styles: { fontStyle: 'bold' } },
        { content: `GOLPES: ${hd.golpes || 'NO'}`, styles: { fontStyle: 'bold' } },
        { content: `PINTURA BRIZADA: ${hd.pinturaBrizada || 'NO'}`, styles: { fontStyle: 'bold' } },
      ],
      [
        { content: `CABLE: ${hd.cable || 'SI'}`, styles: { fontStyle: 'bold' } },
        { content: `EXTINTOR: ${hd.extintor || 'SI'}`, styles: { fontStyle: 'bold' } },
        { content: `REFACCIÓN: ${hd.refaccion || 'SI'}`, styles: { fontStyle: 'bold' } },
        { content: `PINTURA RAYADA: ${hd.pinturaRayada || 'NO'}`, styles: { fontStyle: 'bold' } },
        { content: `VIDRIOS ROTOS: ${hd.vidriosRotos || 'NO'}`, styles: { fontStyle: 'bold' } },
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 1.5;

  // ==========================================
  // 7. REVISIÓN A COFRE ABIERTO (NIVELES/FUGAS/TAPONES)
  // ==========================================
  const cf = data.cofreAbierto || ({} as any);
  autoTable(doc, {
    startY: y,
    margin,
    theme: 'grid',
    styles: { ...baseStyles, fontSize: 6.3, halign: 'center' },
    body: [
      [{ content: 'REVISIÓN A COFRE ABIERTO: NIVELES / FUGAS / TAPONES', colSpan: 7, styles: { fontStyle: 'bold', fillColor: sectionBg, textColor: [255, 255, 255] } }],
      [
        { content: 'ACEITE MOTOR', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'REFRIGERANTE', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'BANDAS', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'LÍQUIDO D.H.', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'LÍQUIDO DE FRENOS', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'TUBO/MANGUERAS', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'TAPA DE DEPÓSITO', styles: { fontStyle: 'bold', fillColor: headerBg } },
      ],
      [
        cf.aceiteMotor || 'BIEN',
        cf.refrigerante || 'BIEN',
        cf.bandas || 'BIEN',
        cf.liquidoDH || 'BIEN',
        cf.liquidoFrenos || 'BIEN',
        cf.tuboMangueras || 'BIEN',
        cf.tapaDeposito || 'BIEN',
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 1.5;

  // ==========================================
  // 8. REVISIÓN DE LLANTAS
  // ==========================================
  const ll = data.llantas || ({} as any);
  autoTable(doc, {
    startY: y,
    margin,
    theme: 'grid',
    styles: { ...baseStyles, fontSize: 6.5, halign: 'center' },
    body: [
      [{ content: 'REVISIÓN DE LLANTAS', colSpan: 4, styles: { fontStyle: 'bold', fillColor: sectionBg, textColor: [255, 255, 255] } }],
      [
        { content: 'DELANTERA DERECHA', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'TRASERA DERECHA', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'DELANTERA IZQUIERDA', styles: { fontStyle: 'bold', fillColor: headerBg } },
        { content: 'TRASERA IZQUIERDA', styles: { fontStyle: 'bold', fillColor: headerBg } },
      ],
      [
        ll.delanteraDerecha || 'BUENA',
        ll.traseraDerecha || 'BUENA',
        ll.delanteraIzquierda || 'BUENA',
        ll.traseraIzquierda || 'BUENA',
      ],
    ],
  });

  y = (doc as any).lastAutoTable.finalY + 4;

  // ==========================================
  // 9. FIRMAS (NOMBRE DEL RESPONSABLE Y REVISA)
  // ==========================================
  autoTable(doc, {
    startY: y,
    margin,
    theme: 'grid',
    styles: { ...baseStyles, minCellHeight: 18 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold', fillColor: headerBg },
      1: { cellWidth: 78 },
      2: { cellWidth: 25, fontStyle: 'bold', fillColor: headerBg },
      3: { cellWidth: 53 },
    },
    body: [
      ['NOMBRE DEL RESPONSABLE:', data.responsable || 'SIN ASIGNAR', 'FIRMA:', ''],
      ['REVISA (INSPECTOR):', data.inspector || 'INSPECTOR DE FLOTA', 'FIRMA:', ''],
    ],
    didDrawCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 3) {
        const isResp = hookData.row.index === 0;
        const sig = isResp ? data.firmaResponsableBase64 : data.firmaInspectorBase64;
        if (!sig) return;

        // Soporte para firma vectorial ligera en JSON (0 KB extra en PDF)
        if (sig.startsWith('{')) {
          try {
            const parsed = JSON.parse(sig) as {
              w: number;
              h: number;
              bbox?: { minX: number; maxX: number; minY: number; maxY: number };
              strokes: Array<Array<{ x: number; y: number }>>;
            };

            let minX = parsed.bbox?.minX ?? 9999;
            let maxX = parsed.bbox?.maxX ?? 0;
            let minY = parsed.bbox?.minY ?? 9999;
            let maxY = parsed.bbox?.maxY ?? 0;

            if (minX === 9999) {
              for (const stroke of parsed.strokes || []) {
                for (const pt of stroke) {
                  if (pt.x < minX) minX = pt.x;
                  if (pt.x > maxX) maxX = pt.x;
                  if (pt.y < minY) minY = pt.y;
                  if (pt.y > maxY) maxY = pt.y;
                }
              }
            }

            const rawW = Math.max(maxX - minX, 10);
            const rawH = Math.max(maxY - minY, 10);

            // Espacio disponible en la celda del PDF
            const targetW = 44;
            const targetH = 13.5;

            // Escala uniforme que preserva la caligrafía real (sin aplastar la firma)
            const scale = Math.min(targetW / rawW, targetH / rawH, 0.22);
            const renderedW = rawW * scale;
            const renderedH = rawH * scale;

            // Centrar la firma perfectamente en la celda
            const offsetX = hookData.cell.x + (hookData.cell.width - renderedW) / 2;
            const offsetY = hookData.cell.y + (hookData.cell.height - renderedH) / 2;

            doc.setDrawColor(16, 37, 66); // Tinta ejecutiva tipo bolígrafo
            doc.setLineWidth(0.5);
            doc.setLineCap(2); // 'round'
            doc.setLineJoin(2); // 'round'

            for (const stroke of parsed.strokes || []) {
              for (let i = 1; i < stroke.length; i++) {
                const p1 = stroke[i - 1];
                const p2 = stroke[i];
                doc.line(
                  offsetX + (p1.x - minX) * scale,
                  offsetY + (p1.y - minY) * scale,
                  offsetX + (p2.x - minX) * scale,
                  offsetY + (p2.y - minY) * scale
                );
              }
            }
          } catch (e) {
            // ignore JSON signature rendering issue
          }
        } else if (sig.startsWith('data:image/png') || sig.startsWith('data:image/jpeg')) {
          try {
            const fmt = sig.includes('image/png') ? 'PNG' : 'JPEG';
            doc.addImage(sig, fmt, hookData.cell.x + 4, hookData.cell.y + 1.5, 42, 15);
          } catch (e) {
            // ignore raster signature rendering issue
          }
        }
      }
    },
  });

  // ==========================================
  // 10. HOJA ANEXA: EVIDENCIA FOTOGRÁFICA POR FASES
  // ==========================================
  const fotosConImagen = (data.fotos || []).filter((f) => f.base64 && f.base64.startsWith('data:image'));
  if (fotosConImagen.length > 0) {
    doc.addPage();
    autoTable(doc, {
      startY: 10,
      margin,
      theme: 'grid',
      styles: baseStyles,
      body: [
        [
          {
            content: `ANEXO DE EVIDENCIA FOTOGRÁFICA — UNIDAD ${data.consecutivo} (${data.placas}) — FOLIO ${data.folio}`,
            styles: { fontStyle: 'bold', fontSize: 9, fillColor: sectionBg, textColor: [255, 255, 255], halign: 'center' },
          },
        ],
      ],
    });

    let photoY = (doc as any).lastAutoTable.finalY + 5;
    const colW = (pageWidth - 25) / 2;
    const boxH = 68;

    fotosConImagen.forEach((foto, idx) => {
      const col = idx % 2;
      if (col === 0 && idx > 0) {
        photoY += boxH + 8;
      }
      if (photoY + boxH > 265) {
        doc.addPage();
        photoY = 15;
      }
      const x = 10 + col * (colW + 5);
      doc.setDrawColor(...borderCol);
      doc.rect(x, photoY, colW, boxH);
      doc.setFillColor(...headerBg);
      doc.rect(x, photoY, colW, 7, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkText);
      doc.text(`${foto.fase.toUpperCase()} — ${foto.etiqueta}`, x + 3, photoY + 4.8);

      if (foto.base64) {
        try {
          const fmt = foto.base64.includes('image/png') ? 'PNG' : 'JPEG';
          doc.addImage(foto.base64, fmt, x + 3, photoY + 9, colW - 6, boxH - 12);
        } catch (e) {
          // ignore
        }
      }
    });
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
