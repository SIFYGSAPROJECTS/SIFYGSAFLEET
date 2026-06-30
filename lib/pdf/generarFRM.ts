import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export const generarFRM_PDF = async (reporte: any) => {
  const doc = new jsPDF('p', 'mm', 'letter');
  
  // ==========================================
  // CONFIGURACIÓN DE COLORES Y ESTILOS
  // ==========================================
  const primaryColor: [number, number, number] = [0, 153, 102];
  const darkGray: [number, number, number] = [50, 50, 50];
  const lightGray: [number, number, number] = [240, 240, 240];
  
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
  // LOGO Y ENCABEZADO
  // ==========================================
  try {
    const logoUrl = '/SFG-Logo.png'; 
    const response = await fetch(logoUrl);
    if (response.ok) {
      const blob = await response.blob();
      const base64data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      doc.addImage(base64data, 'PNG', 14, 10, 40, 15);
    }
  } catch (e) {
    console.warn("No se pudo cargar el logo:", e);
  }

  // Header Table
  autoTable(doc, {
    startY: 10,
    margin: { left: 55 },
    theme: 'plain',
    styles: { cellPadding: 1, fontSize: 9, textColor: darkGray },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 70, halign: 'right' }
    },
    body: [
      ['REGISTRO DE MANTENIMIENTO PREVENTIVO', 'Página 1 de 1'],
      ['EQUIPO DE CÓMPUTO', `Fecha: ${reporte.Fecha_Ejecucion ? format(new Date(reporte.Fecha_Ejecucion), "dd/MM/yyyy") : format(new Date(reporte.Fecha_Programada), "dd/MM/yyyy")}`],
      ['', 'Revisión: 01'],
      ['', `N° de Reporte: ${reporte.Consecutivo_FRM}`]
    ]
  });

  let currentY = 32;

  // Fechas y Mantenimiento
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 9, textColor: darkGray, cellPadding: 2 },
    columnStyles: { 
      0: { fontStyle: 'bold', fillColor: lightGray, cellWidth: 45 },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', fillColor: lightGray, cellWidth: 45 },
      3: { cellWidth: 50 }
    },
    body: [
      ['Mantenimiento a realizar:', reporte.Tipo_Mtto, 'PREVENTIVO [ ' + (reporte.Tipo_Mtto==='PREVENTIVO'?'X':' ') + ' ]', 'CORRECTIVO [ ' + (reporte.Tipo_Mtto==='CORRECTIVO'?'X':' ') + ' ]'],
      ['Fecha de Programación:', format(new Date(reporte.Fecha_Programada), "dd 'de' MMMM yyyy"), 'Fecha de ejecución:', reporte.Fecha_Ejecucion ? format(new Date(reporte.Fecha_Ejecucion), "dd 'de' MMMM yyyy") : 'Pendiente']
    ]
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Datos del Equipo
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 9, textColor: darkGray, cellPadding: 2 },
    columnStyles: { 
      0: { fontStyle: 'bold', fillColor: lightGray, cellWidth: 35 },
      1: { cellWidth: 35 },
      2: { fontStyle: 'bold', fillColor: lightGray, cellWidth: 20 },
      3: { cellWidth: 35 },
      4: { fontStyle: 'bold', fillColor: lightGray, cellWidth: 20 },
      5: { cellWidth: 45 }
    },
    body: [
      [{ content: 'Datos del Equipo', colSpan: 6, styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' } }],
      ['N° Interno:', reporte.equipo?.C_Interno, 'Tipo:', reporte.equipo?.Tipo || 'N/A', 'Modelo:', reporte.equipo?.Modelo || 'N/A'],
      ['Marca:', reporte.equipo?.Marca || 'N/A', 'Service TAG:', reporte.equipo?.Service_Tag || 'N/A', 'Depto:', reporte.equipo?.Departamento || 'N/A'],
      ['Nombre de usuario:', { content: reporte.equipo?.Usuario || 'N/A', colSpan: 2 }, 'Serie de cargador:', { content: reporte.equipo?.Cargador || 'N/A', colSpan: 2 }]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Accesorios Adicionales
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 9, textColor: darkGray, cellPadding: 2 },
    body: [
      [{ content: 'Accesorios adicionales al mantenimiento | Indicar N° Interno', colSpan: 4, styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' } }],
      [
        `Teclado    [ ${accesorios.teclado ? 'X' : ' '} ] N/A`,
        `Mouse    [ ${accesorios.mouse ? 'X' : ' '} ] N/A`,
        `Monitor    [ ${accesorios.monitor ? 'X' : ' '} ] N/A`,
        `Estación de trabajo    [ ${accesorios.estacion ? 'X' : ' '} ] N/A`
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Detalles de Mantenimiento
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 9, textColor: darkGray, cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 95 }, 1: { cellWidth: 95 } },
    body: [
      [{ content: 'Detalles de Mantenimiento', colSpan: 2, styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' } }],
      [{ content: 'PREVENTIVO', styles: { fontStyle: 'bold', fillColor: lightGray, halign: 'center' } }, { content: 'CORRECTIVO', styles: { fontStyle: 'bold', fillColor: lightGray, halign: 'center' } }],
      [df.preventivo || '', df.correctivo || '']
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Reprogramación
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 9, textColor: darkGray, cellPadding: 2 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: lightGray, cellWidth: 40 } },
    body: [
      [{ content: 'REPROGRAMACIÓN DEL PRÓXIMO MANTENIMIENTO', colSpan: 4, styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' } }],
      ['Realizar de inmediato', `SI [ ${reprogramacion.inmediato ? 'X' : ' '} ]`, `NO [ ${!reprogramacion.inmediato ? 'X' : ' '} ]`, `Realizar el día: ${reprogramacion.fecha || ''}`],
      ['Responsable de Atender:', { content: reprogramacion.responsable || '', colSpan: 2 }, `Dependencia: ${reprogramacion.dependencia || ''}`]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 5;

  // Observaciones Generales
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 9, textColor: darkGray, cellPadding: 2 },
    body: [
      [{ content: 'Observaciones Generales del Equipo:', styles: { fontStyle: 'bold', fillColor: lightGray } }],
      [{ content: reporte.Observaciones || 'Ninguna.', styles: { minCellHeight: 20 } }]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 20;

  // Firmas
  if (currentY > 230) {
    doc.addPage();
    currentY = 40;
  }

  doc.setDrawColor(...darkGray);
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
  doc.text(reporte.Firma_Responsable || reporte.equipo?.Usuario || 'Nombre y firma', 150, currentY + 5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text("Usuario", 150, currentY + 10, { align: 'center' });

  return doc;
};
