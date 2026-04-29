import ExcelJS from 'exceljs';

export async function generateExcelBase64(data: any[]): Promise<string> {
  if (!data || data.length === 0) return "";

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIFY Copilot';
  const worksheet = workbook.addWorksheet('Reporte de Flota');

  // Extraer las cabeceras dinámicamente de las claves del primer objeto
  // Ignoramos objetos anidados complejos para aplanar
  const flattenObject = (obj: any, prefix = ''): any => {
    return Object.keys(obj).reduce((acc: any, k: string) => {
      const pre = prefix.length ? prefix + '_' : '';
      if (typeof obj[k] === 'object' && obj[k] !== null && !(obj[k] instanceof Date)) {
        Object.assign(acc, flattenObject(obj[k], pre + k));
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {});
  };

  const flatData = data.map(item => flattenObject(item));
  const headers = Object.keys(flatData[0]);

  worksheet.columns = headers.map(header => ({
    header: header.toUpperCase(),
    key: header,
    width: 25
  }));

  // Estilos a la cabecera (Azul Medianoche)
  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' } // Tailwind slate-900 / Midnight blue
    };
    cell.font = {
      color: { argb: 'FFFFFFFF' },
      bold: true
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  worksheet.addRows(flatData);

  // Auto-filtro
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length }
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString('base64');
}
