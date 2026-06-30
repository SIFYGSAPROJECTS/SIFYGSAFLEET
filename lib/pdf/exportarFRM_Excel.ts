import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export const exportarFRM_Excel = async (reporte: any) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIFYGSA';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Reporte de Mantenimiento');

  // Ajustar anchos de columnas
  worksheet.columns = [
    { width: 3 },  // A (Espaciador)
    { width: 25 }, // B
    { width: 30 }, // C
    { width: 20 }, // D
    { width: 30 }, // E
    { width: 3 },  // F (Espaciador)
  ];

  // Estilos
  const titleFont = { name: 'Arial', size: 14, bold: true };
  const headerFont = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  const normalFont = { name: 'Arial', size: 10 };
  
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF009966' } }; // Verde SIFYGSA
  const lightFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };

  // ==========================================
  // ENCABEZADO Y TÍTULO
  // ==========================================
  worksheet.mergeCells('B2:E2');
  const titleCell = worksheet.getCell('B2');
  titleCell.value = 'REGISTRO DE MANTENIMIENTO PREVENTIVO/CORRECTIVO';
  titleCell.font = titleFont;
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('D4:E4');
  worksheet.getCell('D4').value = `FRM: ${reporte.Consecutivo_FRM}`;
  worksheet.getCell('D4').font = { bold: true };
  worksheet.getCell('D4').alignment = { horizontal: 'right' };

  const fechaFormat = reporte.Fecha_Ejecucion ? new Date(reporte.Fecha_Ejecucion) : new Date(reporte.Fecha_Programada);
  worksheet.mergeCells('D5:E5');
  worksheet.getCell('D5').value = `Fecha: ${format(fechaFormat, 'dd/MM/yyyy')}`;
  worksheet.getCell('D5').alignment = { horizontal: 'right' };

  // ==========================================
  // DATOS DEL EQUIPO
  // ==========================================
  let row = 7;
  worksheet.mergeCells(`B${row}:E${row}`);
  const headerEquipo = worksheet.getCell(`B${row}`);
  headerEquipo.value = 'DATOS DEL EQUIPO';
  headerEquipo.font = headerFont;
  headerEquipo.fill = headerFill as any;
  headerEquipo.alignment = { horizontal: 'center' };
  
  row++;
  worksheet.getCell(`B${row}`).value = 'N° Interno:';
  worksheet.getCell(`C${row}`).value = reporte.equipo.C_Interno;
  worksheet.getCell(`D${row}`).value = 'Service TAG:';
  worksheet.getCell(`E${row}`).value = reporte.equipo.Service_Tag || 'N/A';
  
  row++;
  worksheet.getCell(`B${row}`).value = 'Tipo:';
  worksheet.getCell(`C${row}`).value = reporte.equipo.Tipo || 'N/A';
  worksheet.getCell(`D${row}`).value = 'Marca:';
  worksheet.getCell(`E${row}`).value = reporte.equipo.Marca || 'N/A';

  row++;
  worksheet.getCell(`B${row}`).value = 'Modelo:';
  worksheet.getCell(`C${row}`).value = reporte.equipo.Modelo || 'N/A';
  worksheet.getCell(`D${row}`).value = 'Cargador:';
  worksheet.getCell(`E${row}`).value = reporte.equipo.Cargador || 'N/A';

  row++;
  worksheet.getCell(`B${row}`).value = 'Usuario:';
  worksheet.getCell(`C${row}`).value = reporte.equipo.Usuario || 'N/A';
  worksheet.getCell(`D${row}`).value = 'Departamento:';
  worksheet.getCell(`E${row}`).value = reporte.equipo.Departamento || 'N/A';

  // Aplicar fondo gris a los labels
  for(let r = 8; r <= 11; r++) {
    worksheet.getCell(`B${r}`).fill = lightFill as any;
    worksheet.getCell(`B${r}`).font = { bold: true };
    worksheet.getCell(`D${r}`).fill = lightFill as any;
    worksheet.getCell(`D${r}`).font = { bold: true };
    
    // Borders
    ['B', 'C', 'D', 'E'].forEach(col => {
      worksheet.getCell(`${col}${r}`).border = {
        top: {style:'thin', color: {argb:'FFDDDDDD'}},
        left: {style:'thin', color: {argb:'FFDDDDDD'}},
        bottom: {style:'thin', color: {argb:'FFDDDDDD'}},
        right: {style:'thin', color: {argb:'FFDDDDDD'}}
      };
    });
  }

  row += 3;

  // ==========================================
  // PARTES CAMBIADAS
  // ==========================================
  worksheet.mergeCells(`B${row}:E${row}`);
  const headerPartes = worksheet.getCell(`B${row}`);
  headerPartes.value = 'PARTES REEMPLAZADAS O INSTALADAS';
  headerPartes.font = headerFont;
  headerPartes.fill = headerFill as any;
  headerPartes.alignment = { horizontal: 'center' };

  row++;
  ['Componente', 'Parte Anterior', 'Parte Nueva', 'Motivo del Cambio'].forEach((h, i) => {
    const cols = ['B', 'C', 'D', 'E'];
    const cell = worksheet.getCell(`${cols[i]}${row}`);
    cell.value = h;
    cell.fill = lightFill as any;
    cell.font = { bold: true };
  });

  row++;
  if (reporte.partes_cambiadas && reporte.partes_cambiadas.length > 0) {
    reporte.partes_cambiadas.forEach((parte: any) => {
      worksheet.getCell(`B${row}`).value = parte.Nombre_Parte;
      worksheet.getCell(`C${row}`).value = parte.Parte_Anterior || 'N/A';
      worksheet.getCell(`D${row}`).value = parte.Parte_Nueva || 'N/A';
      worksheet.getCell(`E${row}`).value = parte.Motivo_Cambio || '';
      row++;
    });
  } else {
    worksheet.mergeCells(`B${row}:E${row}`);
    worksheet.getCell(`B${row}`).value = 'No se registraron cambios de partes en este mantenimiento.';
    worksheet.getCell(`B${row}`).alignment = { horizontal: 'center' };
    worksheet.getCell(`B${row}`).font = { italic: true };
    row++;
  }

  row += 2;

  row += 2;

  // ==========================================
  // DETALLES Y OBSERVACIONES (Se recibe / Se entrega)
  // ==========================================
  worksheet.mergeCells(`B${row}:E${row}`);
  const headerObs = worksheet.getCell(`B${row}`);
  headerObs.value = 'DETALLES DE MANTENIMIENTO';
  headerObs.font = headerFont;
  headerObs.fill = headerFill as any;
  headerObs.alignment = { horizontal: 'center' };
  
  row++;
  worksheet.mergeCells(`B${row}:D${row}`);
  worksheet.getCell(`B${row}`).value = reporte.Tipo_Mtto === 'Preventivo' ? 'PREVENTIVO' : 'N/A';
  worksheet.getCell(`E${row}`).value = reporte.Tipo_Mtto === 'Correctivo' ? 'CORRECTIVO' : 'N/A';
  worksheet.getCell(`B${row}`).font = { bold: true };
  worksheet.getCell(`E${row}`).font = { bold: true };
  
  row++;
  worksheet.mergeCells(`B${row}:E${row+1}`);
  worksheet.getCell(`B${row}`).value = `Se recibe: \n${reporte.Observaciones || 'Sin observaciones al recibir'}`;
  worksheet.getCell(`B${row}`).alignment = { wrapText: true, vertical: 'top' };
  
  row += 2;
  worksheet.mergeCells(`B${row}:E${row+1}`);
  worksheet.getCell(`B${row}`).value = `Se entrega: \n${reporte.Actividades_Extra || 'Sin observaciones al entregar'}`;
  worksheet.getCell(`B${row}`).alignment = { wrapText: true, vertical: 'top' };

  row += 3;
  // ==========================================
  // EVIDENCIA FOTOGRÁFICA
  // ==========================================
  worksheet.mergeCells(`B${row}:E${row}`);
  const headerEvid = worksheet.getCell(`B${row}`);
  headerEvid.value = 'EVIDENCIA FOTOGRÁFICA';
  headerEvid.font = headerFont;
  headerEvid.fill = headerFill as any;
  headerEvid.alignment = { horizontal: 'center' };
  
  row++;
  if (reporte.partes_cambiadas && reporte.partes_cambiadas.some((p:any) => p.Evidencia_URL)) {
    worksheet.mergeCells(`B${row}:E${row}`);
    worksheet.getCell(`B${row}`).value = 'Ver evidencias fotográficas adjuntas en el sistema.';
    worksheet.getCell(`B${row}`).font = { italic: true };
  } else {
    worksheet.mergeCells(`B${row}:E${row+4}`);
    worksheet.getCell(`B${row}`).value = '[Espacio para evidencia fotográfica]';
    worksheet.getCell(`B${row}`).alignment = { horizontal: 'center', vertical: 'middle' };
  }

  row += 6;

  // ==========================================
  // REPROGRAMACIÓN
  // ==========================================
  worksheet.mergeCells(`B${row}:E${row}`);
  const headerReprog = worksheet.getCell(`B${row}`);
  headerReprog.value = 'REPROGRAMACIÓN DEL PRÓXIMO MANTENIMIENTO';
  headerReprog.font = headerFont;
  headerReprog.fill = headerFill as any;
  headerReprog.alignment = { horizontal: 'center' };

  row++;
  worksheet.getCell(`B${row}`).value = 'Realizar de inmediato';
  worksheet.getCell(`C${row}`).value = 'SI O';
  worksheet.getCell(`D${row}`).value = 'NO O';
  worksheet.getCell(`E${row}`).value = `Realizar el día: _________________`;
  
  row++;
  worksheet.getCell(`B${row}`).value = 'Responsable de Atender:';
  worksheet.getCell(`C${row}`).value = 'C.A.S.M'; // Example from template
  worksheet.getCell(`D${row}`).value = 'Dependencia:';
  worksheet.getCell(`E${row}`).value = 'INFRAESTRUCTURA';

  row++;
  worksheet.mergeCells(`B${row}:E${row}`);
  worksheet.getCell(`B${row}`).value = 'Observaciones Generales del Equipo:';
  worksheet.getCell(`B${row}`).font = { bold: true };

  row += 3;
  // ==========================================
  // FIRMAS
  // ==========================================
  worksheet.mergeCells(`B${row}:C${row}`);
  worksheet.mergeCells(`D${row}:E${row}`);
  worksheet.getCell(`B${row}`).value = 'Nombre y firma';
  worksheet.getCell(`D${row}`).value = 'Nombre y firma';
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'center' };
  worksheet.getCell(`D${row}`).alignment = { horizontal: 'center' };
  worksheet.getCell(`B${row}`).font = { bold: true };
  worksheet.getCell(`D${row}`).font = { bold: true };

  row += 2;
  worksheet.mergeCells(`B${row}:C${row}`);
  worksheet.mergeCells(`D${row}:E${row}`);
  worksheet.getCell(`B${row}`).value = reporte.Tecnico || 'Citlali Astrid Sanchez Martinez';
  worksheet.getCell(`D${row}`).value = reporte.equipo.Usuario || 'Usuario del Equipo';
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'center' };
  worksheet.getCell(`D${row}`).alignment = { horizontal: 'center' };
  worksheet.getCell(`B${row}`).border = { bottom: { style: 'thin' } };
  worksheet.getCell(`D${row}`).border = { bottom: { style: 'thin' } };

  row++;
  worksheet.mergeCells(`B${row}:C${row}`);
  worksheet.mergeCells(`D${row}:E${row}`);
  worksheet.getCell(`B${row}`).value = 'Responsable de Mantenimiento';
  worksheet.getCell(`D${row}`).value = 'Usuario';
  worksheet.getCell(`B${row}`).alignment = { horizontal: 'center' };
  worksheet.getCell(`D${row}`).alignment = { horizontal: 'center' };

  // Generar y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const safeName = reporte.equipo.C_Interno.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  saveAs(blob, `FRM_${safeName}_${reporte.Consecutivo_FRM}.xlsx`);
};
