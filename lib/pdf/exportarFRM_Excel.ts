import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

const formatUTC = (dateString: string | Date | null) => {
  if (!dateString) return 'Pendiente';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return 'Pendiente';
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day} de ${getMonthName(d.getUTCMonth())} ${year}`;
  } catch(e) {
    return 'Pendiente';
  }
};

const getMonthName = (m: number) => {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[m];
};

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

export const exportarFRM_Excel = async (reporte: any) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIFYGSA';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Reporte de Mantenimiento');

  // Ajustar anchos de columnas: A a F (6 columnas)
  worksheet.columns = [
    { width: 22 }, // A
    { width: 22 }, // B
    { width: 22 }, // C
    { width: 22 }, // D
    { width: 25 }, // E
    { width: 25 }, // F
  ];

  let df: any = {};
  if (reporte.Datos_Formato) {
    try {
      df = typeof reporte.Datos_Formato === 'string' ? JSON.parse(reporte.Datos_Formato) : reporte.Datos_Formato;
    } catch(e){}
  }
  
  const accesorios = df.accesorios || {};
  const accesorios_series = df.accesorios_series || {};
  const reprogramacion = df.reprogramacion || {};

  // Estilos y Colores
  const borderColor = 'FFF0501E'; // Naranja SIFYGSA
  const headerFillColor = 'FFEBEBE1'; // Gris/Verde clarito
  const darkGrayFill = 'FF808080';
  
  const boldFont = { name: 'Arial', size: 10, bold: true };
  const normalFont = { name: 'Arial', size: 10 };
  const titleFont = { name: 'Arial', size: 12, bold: true };
  
  const applyBorders = (startCol: number, startRow: number, endCol: number, endRow: number) => {
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const cell = worksheet.getCell(r, c);
        cell.border = {
          top: { style: 'thin', color: { argb: borderColor } },
          left: { style: 'thin', color: { argb: borderColor } },
          bottom: { style: 'thin', color: { argb: borderColor } },
          right: { style: 'thin', color: { argb: borderColor } }
        };
        cell.alignment = { vertical: 'middle', wrapText: true, ...cell.alignment };
        if (!cell.font) cell.font = normalFont;
      }
    }
  };

  const setCellContent = (cellId: string, value: any, font = normalFont, align: any = { horizontal: 'center', vertical: 'middle' }, fill?: string) => {
    const cell = worksheet.getCell(cellId);
    cell.value = value;
    cell.font = font;
    cell.alignment = { wrapText: true, ...align };
    if (fill) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fill } };
    }
  };

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
  // ENCABEZADO Y TÍTULO
  // ==========================================
  worksheet.mergeCells('A1:B3');
  // Se insertaría el logo aquí, pero en JS puro necesitamos fetch
  try {
    const response = await fetch('/logo.png');
    if (response.ok) {
      const blob = await response.blob();
      
      const base64data = await new Promise<string>((resolve) => {
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

      const imageId = workbook.addImage({
        base64: base64data,
        extension: 'png',
      });
      worksheet.addImage(imageId, {
        tl: { col: 0.1, row: 0.1 },
        ext: { width: 140, height: 40 }
      });
    }
  } catch (e) {}

  worksheet.mergeCells('C1:D3');
  setCellContent('C1', `REGISTRO DE MANTENIMIENTO PREVENTIVO\nEQUIPO DE CÓMPUTO`, titleFont);

  worksheet.mergeCells('E1:F1');
  setCellContent('E1', 'Página 1 de 1', normalFont);
  worksheet.mergeCells('E2:F2');
  setCellContent('E2', `Fecha: ${reporte.Fecha_Ejecucion ? formatUTC(reporte.Fecha_Ejecucion) : formatUTC(reporte.Fecha_Programada)}`, normalFont);
  worksheet.mergeCells('E3:F3');
  setCellContent('E3', 'Revisión: 01', normalFont);

  applyBorders(1, 1, 6, 3);
  
  // Row 4 is a small spacer
  worksheet.getRow(4).height = 10;

  // ==========================================
  // FECHAS Y MANTENIMIENTO
  // ==========================================
  worksheet.mergeCells('A5:B5');
  setCellContent('A5', 'Mantenimiento a realizar:', boldFont, { horizontal: 'left' });
  
  const circlePrev = reporte.Tipo_Mtto?.toUpperCase() === 'PREVENTIVO' ? '⚫' : '⚪';
  const circleCorr = reporte.Tipo_Mtto?.toUpperCase() === 'CORRECTIVO' ? '⚫' : '⚪';
  
  worksheet.mergeCells('C5:D5');
  setCellContent('C5', `PREVENTIVO          ${circlePrev}`, normalFont);
  
  setCellContent('E5', `CORRECTIVO   ${circleCorr}`, normalFont);
  setCellContent('F5', 'N° de Reporte:', boldFont, { horizontal: 'left' });

  worksheet.mergeCells('A6:B6');
  setCellContent('A6', 'Fecha de Programación:', boldFont);
  worksheet.mergeCells('C6:D6');
  setCellContent('C6', formatUTC(reporte.Fecha_Programada), normalFont);
  setCellContent('E6', 'Fecha de ejecución', boldFont);
  setCellContent('F6', formatUTC(reporte.Fecha_Ejecucion), normalFont);

  applyBorders(1, 5, 6, 6);

  worksheet.getRow(7).height = 10; // spacer

  // ==========================================
  // DATOS DEL EQUIPO
  // ==========================================
  worksheet.mergeCells('A8:F8');
  setCellContent('A8', 'Datos del Equipo', boldFont, { horizontal: 'left' }, headerFillColor);
  
  setCellContent('A9', 'N° Interno:', boldFont, { horizontal: 'left' }, headerFillColor);
  setCellContent('B9', reporte.C_Interno || reporte.equipo?.C_Interno || 'N/A', normalFont);
  
  setCellContent('C9', { richText: [{ font: boldFont, text: 'Tipo: ' }, { font: normalFont, text: reporte.equipo?.Tipo || 'N/A' }] }, normalFont, { horizontal: 'left' });
  setCellContent('D9', { richText: [{ font: boldFont, text: 'Modelo: ' }, { font: normalFont, text: reporte.equipo?.Modelo || 'N/A' }] }, normalFont, { horizontal: 'left' });
  setCellContent('E9', { richText: [{ font: boldFont, text: 'Marca: ' }, { font: normalFont, text: reporte.equipo?.Marca || 'N/A' }] }, normalFont, { horizontal: 'left' });
  setCellContent('F9', { richText: [{ font: boldFont, text: 'Service TAG: ' }, { font: normalFont, text: reporte.equipo?.Service_Tag || 'N/A' }] }, normalFont, { horizontal: 'left' });
  
  worksheet.mergeCells('A10:B10');
  setCellContent('A10', `Departamento\n${reporte.equipo?.Departamento || 'N/A'}`, normalFont, { horizontal: 'center' });
  worksheet.getCell('A10').font = boldFont; // To make the first line bold we should use rich text, but a quick workaround is whole cell bold or normal. Let's use richText:
  worksheet.getCell('A10').value = { richText: [{ font: boldFont, text: 'Departamento\n' }, { font: normalFont, text: reporte.equipo?.Departamento || 'N/A' }] };

  worksheet.mergeCells('C10:D10');
  worksheet.getCell('C10').value = { richText: [{ font: boldFont, text: 'Nombre de usuario\n' }, { font: normalFont, text: fixEncoding(reporte.equipo?.Usuario) || 'N/A' }] };
  worksheet.getCell('C10').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  worksheet.mergeCells('E10:E10');
  worksheet.getCell('E10').value = { richText: [{ font: boldFont, text: 'Serie de cargador\n' }, { font: normalFont, text: reporte.equipo?.Cargador || 'N/A' }] };
  worksheet.getCell('E10').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  setCellContent('F10', '', normalFont, {}, darkGrayFill);
  
  worksheet.getRow(9).height = 20;
  worksheet.getRow(10).height = 30;
  applyBorders(1, 8, 6, 10);

  // ==========================================
  // ACCESORIOS ADICIONALES
  // ==========================================
  worksheet.mergeCells('A11:F11');
  setCellContent('A11', 'Accesorios adicionales al mantenimiento | Indicar N° Interno', boldFont, { horizontal: 'left' }, headerFillColor);
  
  worksheet.mergeCells('A12:B12');
  setCellContent('A12', `Teclado ${accesorios.teclado ? '⚫' : '⚪'} ${accesorios.teclado ? (accesorios_series.teclado || 'N/A') : 'N/A'}`, normalFont, { horizontal: 'center' });
  setCellContent('C12', `Mouse ${accesorios.mouse ? '⚫' : '⚪'} ${accesorios.mouse ? (accesorios_series.mouse || 'N/A') : 'N/A'}`, normalFont, { horizontal: 'center' });
  setCellContent('D12', `Monitor ${accesorios.monitor ? '⚫' : '⚪'} ${accesorios.monitor ? (accesorios_series.monitor || 'N/A') : 'N/A'}`, normalFont, { horizontal: 'center' });
  worksheet.mergeCells('E12:F12');
  setCellContent('E12', `Estación de trabajo ${accesorios.estacion ? '⚫' : '⚪'} ${accesorios.estacion ? (accesorios_series.estacion || 'N/A') : 'N/A'}`, normalFont, { horizontal: 'center' });

  applyBorders(1, 11, 6, 12);
  worksheet.getRow(13).height = 10;

  // ==========================================
  // DETALLES DE MANTENIMIENTO
  // ==========================================
  worksheet.mergeCells('A14:F14');
  setCellContent('A14', 'Detalles de Mantenimiento', boldFont, { horizontal: 'left' }, headerFillColor);
  
  worksheet.mergeCells('A15:C15');
  setCellContent('A15', 'PREVENTIVO', boldFont, { horizontal: 'center' });
  worksheet.mergeCells('D15:F15');
  setCellContent('D15', 'CORRECTIVO', boldFont, { horizontal: 'center' });
  
  worksheet.mergeCells('A16:C16');
  setCellContent('A16', df.preventivo || '', normalFont, { horizontal: 'left', vertical: 'top' });
  worksheet.mergeCells('D16:F16');
  setCellContent('D16', df.correctivo || '', normalFont, { horizontal: 'left', vertical: 'top' });
  
  worksheet.getRow(16).height = 60;
  applyBorders(1, 14, 6, 16);
  worksheet.getRow(17).height = 10;

  // ==========================================
  // EVIDENCIA FOTOGRÁFICA
  // ==========================================
  worksheet.mergeCells('A18:F18');
  setCellContent('A18', 'Evidencia Fotográfica', boldFont, { horizontal: 'left' }, headerFillColor);
  
  worksheet.mergeCells('A19:F19');
  
  if (photos.length > 0) {
    setCellContent('A19', '', normalFont, { horizontal: 'center', vertical: 'middle' });
    worksheet.getRow(19).height = 160;
    
    photos.forEach((base64, index) => {
      try {
        const imageId = workbook.addImage({
          base64: base64,
          extension: base64.includes('image/png') ? 'png' : 'jpeg',
        });
        worksheet.addImage(imageId, {
          tl: { col: 0.1 + (index * 2), row: 18.1 }, 
          ext: { width: 220, height: 180 }
        });
      } catch (e) {
        console.warn("No se pudo agregar una imagen a Excel", e);
      }
    });
  } else {
    setCellContent('A19', 'No se adjuntaron evidencias fotográficas.', normalFont, { horizontal: 'center', vertical: 'middle' });
    worksheet.getRow(19).height = 50;
  }
  
  applyBorders(1, 18, 6, 19);
  worksheet.getRow(20).height = 10;

  // ==========================================
  // REPROGRAMACIÓN Y OBSERVACIONES
  // ==========================================
  worksheet.mergeCells('A21:F21');
  setCellContent('A21', 'REPROGRAMACIÓN DEL PRÓXIMO MANTENIMIENTO', boldFont, { horizontal: 'center' }, headerFillColor);

  worksheet.mergeCells('A22:B22');
  setCellContent('A22', 'Realizar de inmediato', normalFont);
  setCellContent('C22', `SI  ${reprogramacion.inmediato ? '⚫' : '⚪'}`, normalFont);
  setCellContent('D22', `NO  ${!reprogramacion.inmediato ? '⚫' : '⚪'}`, normalFont);
  worksheet.mergeCells('E22:F22');
  setCellContent('E22', `Realizar el día: ${reprogramacion.fecha || ''}`, normalFont, { horizontal: 'left' });

  worksheet.mergeCells('A23:B23');
  setCellContent('A23', 'Responsable de Atender:', boldFont);
  worksheet.mergeCells('C23:D23');
  setCellContent('C23', reprogramacion.responsable || 'C.A.S.M', normalFont);
  worksheet.mergeCells('E23:F23');
  setCellContent('E23', `Dependencia: ${reprogramacion.dependencia || 'INFRAESTRUCTURA'}`, normalFont, { horizontal: 'left' });

  worksheet.mergeCells('A24:F24');
  setCellContent('A24', 'Observaciones Generales del Equipo:', boldFont, { horizontal: 'left' }, headerFillColor);
  worksheet.mergeCells('A25:F25');
  setCellContent('A25', reporte.Observaciones || 'Ninguna.', normalFont, { horizontal: 'left', vertical: 'top' });
  worksheet.getRow(25).height = 40;

  applyBorders(1, 21, 6, 25);
  worksheet.getRow(26).height = 20;

  // ==========================================
  // FIRMAS
  // ==========================================
  worksheet.mergeCells('B28:C28');
  setCellContent('B28', reporte.Firma_Tecnico || reporte.Tecnico || 'Nombre y firma', normalFont);
  worksheet.getCell('B28').border = { bottom: { style: 'thin' } };

  worksheet.mergeCells('D28:E28');
  setCellContent('D28', reporte.Firma_Responsable || fixEncoding(reporte.equipo?.Usuario) || 'Nombre y firma', normalFont);
  worksheet.getCell('D28').border = { bottom: { style: 'thin' } };

  worksheet.mergeCells('B29:C29');
  setCellContent('B29', 'Responsable de Mantenimiento', boldFont);

  worksheet.mergeCells('D29:E29');
  setCellContent('D29', 'Usuario', boldFont);

  // Generar y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const safeName = (reporte.equipo?.C_Interno || 'NA').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  saveAs(blob, `FRM_${safeName}_${reporte.Consecutivo_FRM || 'NUEVO'}.xlsx`);
};
