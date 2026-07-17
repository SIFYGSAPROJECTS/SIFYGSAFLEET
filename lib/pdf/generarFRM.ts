import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

const fixEncoding = (str: string) => {
  if (!str) return str;
  let current = str;
  let previous = "";
  let attempts = 0;
  while (current !== previous && attempts < 3) {
    previous = current;
    try {
      current = decodeURIComponent(escape(current));
    } catch (e) {
      break;
    }
    attempts++;
  }
  return previous.replace(/\u00A0/g, ' ');
};

const formatUTC = (dateString: string | Date | null) => {
  if (!dateString) return 'Pendiente';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Pendiente';
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch(e) {
    return 'Pendiente';
  }
};

export const generarFRM_PDF = async (reporte: any) => {
  const doc = new jsPDF('p', 'mm', 'letter');
  
  // ==========================================
  // CONFIGURACIÓN DE COLORES Y ESTILOS
  // ==========================================
  const borderColor: [number, number, number] = [240, 80, 30]; // Naranja/Rojo SIFYGSA
  const darkGray: [number, number, number] = [0, 0, 0];
  const lightGray: [number, number, number] = [245, 245, 245];
  const headerBg: [number, number, number] = [235, 235, 225]; // Beige claro
  
  const defaultStyles = {
    fontSize: 8,
    textColor: darkGray,
    cellPadding: 1.5,
    lineColor: borderColor,
    lineWidth: 0.3
  };
  
  const tableMargin = { left: 13, right: 13 };

  // Parse Datos_Formato
  let df: any = {};
  if (reporte.Datos_Formato) {
    try {
      df = typeof reporte.Datos_Formato === 'string' ? JSON.parse(reporte.Datos_Formato) : reporte.Datos_Formato;
    } catch(e){}
  }
  
  const accesorios = df.accesorios || {};
  const reprogramacion = df.reprogramacion || {};

  // ==========================================
  // LOGO
  // ==========================================
  let base64data: string | null = null;
  try {
    const logoUrl = '/logo.png'; 
    const response = await fetch(logoUrl);
    if (response.ok) {
      const blob = await response.blob();
      base64data = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
              if (a > 0) {
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                // Si el pixel es blanco/gris claro (baja saturación y alto brillo)
                if (max - min < 40 && max > 180) {
                  // Convertir a gris muy oscuro/negro
                  const darken = 30; 
                  data[i] = darken;
                  data[i+1] = darken;
                  data[i+2] = darken;
                }
              }
            }
            ctx.putImageData(imgData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } else {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          }
        };
        img.onerror = () => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        };
        img.src = URL.createObjectURL(blob);
      });
    }
  } catch (e) {
    console.warn("No se pudo cargar el logo:", e);
  }

  // ==========================================
  // CARGAR FOTOS EVIDENCIA
  // ==========================================
  const loadPhotoAsBase64 = async (url: string | null) => {
    if (!url) return null;
    try {
      const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.base64;
    } catch(e) {
      return null;
    }
  };

  const [fotoAntes, fotoDespues, fotosExtra] = await Promise.all([
    loadPhotoAsBase64(reporte.Foto_Antes),
    loadPhotoAsBase64(reporte.Foto_Despues),
    loadPhotoAsBase64(reporte.Fotos_Extra)
  ]);
  const photos = [fotoAntes, fotoDespues, fotosExtra].filter(Boolean) as string[];

  // ==========================================
  // Header Table
  // ==========================================
  autoTable(doc, {
    startY: 10,
    margin: tableMargin,
    theme: 'grid',
    styles: { ...defaultStyles, halign: 'center', valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 90, fontStyle: 'bold', fontSize: 10 },
      2: { cellWidth: 55, halign: 'center' }
    },
    body: [
      [
        { content: '', rowSpan: 3 }, 
        { content: `REGISTRO DE MANTENIMIENTO ${reporte.Tipo_Mtto?.toUpperCase() || ''}\nEQUIPO DE CÓMPUTO`, rowSpan: 3 }, 
        'Página 1 de 1'
      ],
      [`Fecha: ${reporte.Fecha_Ejecucion ? formatUTC(reporte.Fecha_Ejecucion) : formatUTC(reporte.Fecha_Programada)}`],
      ['Revisión: 01']
    ],
    didDrawCell: (data) => {
      // Draw logo in the first cell
      if (data.row.index === 0 && data.column.index === 0 && base64data) {
        doc.addImage(base64data, 'PNG', data.cell.x + 2, data.cell.y + 2, 40, 15);
      }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 1;

  // ==========================================
  // Fechas y Mantenimiento
  // ==========================================
  autoTable(doc, {
    startY: currentY,
    margin: tableMargin,
    theme: 'grid',
    styles: defaultStyles,
    columnStyles: { 
      0: { fontStyle: 'bold', fillColor: headerBg, cellWidth: 45 },
      1: { cellWidth: 50 },
      2: { cellWidth: 45 },
      3: { cellWidth: 50 }
    },
    body: [
      [
        'Mantenimiento a realizar:', 
        { content: `PREVENTIVO [ ${reporte.Tipo_Mtto?.toUpperCase() === 'PREVENTIVO' ? 'X' : ' '} ]`, colSpan: 1 }, 
        { content: `CORRECTIVO [ ${reporte.Tipo_Mtto?.toUpperCase() === 'CORRECTIVO' ? 'X' : ' '} ]`, colSpan: 2 }
      ],
      ['Fecha de Programación:', formatUTC(reporte.Fecha_Programada), 'Fecha de ejecución:', formatUTC(reporte.Fecha_Ejecucion)]
    ]
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 1;

  // ==========================================
  // Datos del Equipo
  // ==========================================
  autoTable(doc, {
    startY: currentY,
    margin: tableMargin,
    theme: 'grid',
    styles: defaultStyles,
    columnStyles: { 
      0: { fontStyle: 'bold', fillColor: headerBg, cellWidth: 35 },
      1: { cellWidth: 35 },
      2: { fontStyle: 'bold', fillColor: headerBg, cellWidth: 20 },
      3: { cellWidth: 35 },
      4: { fontStyle: 'bold', fillColor: headerBg, cellWidth: 20 },
      5: { cellWidth: 45 }
    },
    body: [
      [{ content: 'Datos del Equipo', colSpan: 6, styles: { fillColor: headerBg, fontStyle: 'bold' } }],
      ['N° Interno:', reporte.C_Interno || reporte.equipo?.C_Interno, 'Tipo:', reporte.equipo?.Tipo || 'N/A', 'Modelo:', reporte.equipo?.Modelo || 'N/A'],
      ['Marca:', reporte.equipo?.Marca || 'N/A', 'Service TAG:', reporte.equipo?.Service_Tag || 'N/A', 'Depto:', reporte.equipo?.Departamento || 'N/A'],
      ['Nombre de usuario:', { content: fixEncoding(reporte.equipo?.Usuario) || 'N/A', colSpan: 2 }, 'Serie de cargador:', { content: reporte.equipo?.Cargador || 'N/A', colSpan: 2 }]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 1;

  // ==========================================
  // Accesorios Adicionales
  // ==========================================
  autoTable(doc, {
    startY: currentY,
    margin: tableMargin,
    theme: 'grid',
    styles: defaultStyles,
    columnStyles: {
      0: { cellWidth: 47.5 },
      1: { cellWidth: 47.5 },
      2: { cellWidth: 47.5 },
      3: { cellWidth: 47.5 }
    },
    body: [
      [{ content: 'Accesorios adicionales al mantenimiento | Indicar N° Serie o Interno', colSpan: 4, styles: { fillColor: headerBg, fontStyle: 'bold' } }],
      [
        `Teclado    [ ${accesorios.teclado ? 'X' : ' '} ] ${accesorios.teclado ? (df.accesorios_series?.teclado || '') : 'N/A'}`,
        `Mouse    [ ${accesorios.mouse ? 'X' : ' '} ] ${accesorios.mouse ? (df.accesorios_series?.mouse || '') : 'N/A'}`,
        `Monitor    [ ${accesorios.monitor ? 'X' : ' '} ] ${accesorios.monitor ? (df.accesorios_series?.monitor || '') : 'N/A'}`,
        `Estación    [ ${accesorios.estacion ? 'X' : ' '} ] ${accesorios.estacion ? (df.accesorios_series?.estacion || '') : 'N/A'}`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 1;

  // ==========================================
  // Detalles de Mantenimiento
  // ==========================================
  autoTable(doc, {
    startY: currentY,
    margin: tableMargin,
    theme: 'grid',
    styles: defaultStyles,
    columnStyles: { 0: { cellWidth: 95 }, 1: { cellWidth: 95 } },
    body: [
      [{ content: 'Detalles de Mantenimiento', colSpan: 2, styles: { fillColor: headerBg, fontStyle: 'bold' } }],
      [{ content: 'PREVENTIVO', styles: { fontStyle: 'bold', fillColor: headerBg, halign: 'center' } }, { content: 'CORRECTIVO', styles: { fontStyle: 'bold', fillColor: headerBg, halign: 'center' } }],
      [df.preventivo || '', df.correctivo || '']
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 1;
  
  // ==========================================
  // Evidencia Fotográfica
  // ==========================================
  autoTable(doc, {
    startY: currentY,
    margin: tableMargin,
    theme: 'grid',
    styles: defaultStyles,
    body: [
      [{ content: 'Evidencia Fotográfica', styles: { fillColor: headerBg, fontStyle: 'bold' } }],
      [{ content: photos.length > 0 ? '\n\n\n\n\n' : '\n\n\n', styles: { minCellHeight: photos.length > 0 ? 35 : 20 } }] 
    ],
    didDrawCell: (data) => {
      if (data.row.index === 1 && data.column.index === 0 && photos.length > 0) {
        const cell = data.cell;
        const padding = 5;
        const availableWidth = cell.width - padding * 2;
        // Calculate dynamic width based on number of photos to fit side-by-side
        const gap = 5;
        const photoW = (availableWidth - (gap * (photos.length - 1))) / photos.length;
        const maxPhotoW = Math.min(photoW, 60); // Don't make them too huge
        const photoH = 38; // Fit within the 45 minCellHeight
        
        photos.forEach((base64, index) => {
          const x = cell.x + padding + (index * (maxPhotoW + gap));
          const y = cell.y + 3; 
          const format = base64.includes('image/png') ? 'PNG' : 'JPEG';
          doc.addImage(base64, format, x, y, maxPhotoW, photoH);
        });
      }
    }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 1;

  // ==========================================
  // Reprogramación
  // ==========================================
  autoTable(doc, {
    startY: currentY,
    margin: tableMargin,
    theme: 'grid',
    styles: defaultStyles,
    columnStyles: { 
      0: { fontStyle: 'bold', fillColor: headerBg, cellWidth: 45 },
      1: { cellWidth: 40 },
      2: { cellWidth: 40 },
      3: { cellWidth: 65 }
    },
    body: [
      [{ content: 'REPROGRAMACIÓN DEL PRÓXIMO MANTENIMIENTO', colSpan: 4, styles: { fillColor: headerBg, fontStyle: 'bold' } }],
      ['Realizar de inmediato', `SI [ ${reprogramacion.inmediato ? 'X' : ' '} ]`, `NO [ ${!reprogramacion.inmediato ? 'X' : ' '} ]`, `Realizar el día: ${reprogramacion.fecha || ''}`],
      ['Responsable de Atender:', { content: reprogramacion.responsable || '', colSpan: 2 }, `Dependencia: ${reprogramacion.dependencia || ''}`]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 1;

  // ==========================================
  // Observaciones Generales
  // ==========================================
  autoTable(doc, {
    startY: currentY,
    margin: tableMargin,
    theme: 'grid',
    styles: defaultStyles,
    body: [
      [{ content: 'Observaciones Generales del Equipo:', styles: { fontStyle: 'bold', fillColor: headerBg } }],
      [{ content: reporte.Observaciones || 'Ninguna.', styles: { minCellHeight: 15 } }]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // ==========================================
  // Firmas
  // ==========================================
  if (currentY > 245) {
    doc.addPage();
    currentY = 40;
  }

  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.5);
  
  // Firma Técnico
  doc.line(30, currentY, 90, currentY);
  doc.setFontSize(9);
  doc.text(reporte.Firma_Tecnico || reporte.Tecnico || 'Nombre y firma', 60, currentY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text("Responsable de Mantenimiento", 60, currentY + 10, { align: 'center' });

  // Firma Usuario
  doc.setFont('helvetica', 'normal');
  doc.line(120, currentY, 180, currentY);
  doc.text(reporte.Firma_Responsable || fixEncoding(reporte.equipo?.Usuario) || 'Nombre y firma', 150, currentY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text("Usuario", 150, currentY + 10, { align: 'center' });

  return doc;
};
