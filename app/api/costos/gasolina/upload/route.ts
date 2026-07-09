import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import ExcelJS from 'exceljs';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer as any);

    const worksheet = workbook.worksheets[0]; // Tomar la primera hoja
    if (!worksheet) {
      return NextResponse.json({ error: 'El archivo Excel está vacío' }, { status: 400 });
    }

    // Obtener todos los consecutivos válidos para evitar errores de Foreign Key
    const autos = await prisma.inventario_Automoviles.findMany({ select: { Consecutivo: true } });
    const validConsecutivos = new Set(autos.map(a => a.Consecutivo.trim().toUpperCase()));

    const registrosAGuardar: any[] = [];
    let errores = 0;
    let procesados = 0;
    let lastErrorReason = '';

    // Función auxiliar para extraer el texto seguro
    const getCellText = (cell: ExcelJS.Cell) => {
      const val = cell.value;
      if (val !== null && typeof val === 'object' && 'richText' in val) {
        return val.richText.map((rt: any) => rt.text).join('').trim();
      }
      return cell.text?.trim() || cell.value?.toString().trim() || '';
    };

    // Iterar sobre las filas (asumiendo que la fila 1 son encabezados)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar encabezados

      try {
        const FechaRaw = row.getCell(1).value;
        const ConsecutivoRaw = getCellText(row.getCell(2));
        const Consecutivo = ConsecutivoRaw.toUpperCase();
        const Estacion = getCellText(row.getCell(3)) || 'No especificada';
        const Combustible = getCellText(row.getCell(4)) || 'No especificado';
        const LitrosRaw = row.getCell(5).value;
        const PrecioRaw = row.getCell(6).value;
        const TotalRaw = row.getCell(7).value;
        
        // Validaciones mínimas
        if (!Consecutivo) {
          errores++;
          lastErrorReason = `Fila ${rowNumber}: Falta Consecutivo ("${Consecutivo}")`;
          return;
        }

        // Si el consecutivo no existe en el inventario, marcar como error y saltar
        if (!validConsecutivos.has(Consecutivo)) {
          errores++;
          lastErrorReason = `Fila ${rowNumber}: Consecutivo "${Consecutivo}" no existe en Base de Datos. (Ejemplos válidos: ${Array.from(validConsecutivos).slice(0,3).join(', ')})`;
          return;
        }

        let Fecha_Hora = new Date();
        if (FechaRaw instanceof Date) {
          Fecha_Hora = FechaRaw;
        } else if (typeof FechaRaw === 'string') {
          Fecha_Hora = new Date(FechaRaw);
        } else if (typeof FechaRaw === 'number') {
           Fecha_Hora = new Date(Math.round((FechaRaw - 25569) * 86400 * 1000));
        }

        const getNumericValue = (cell: ExcelJS.Cell) => {
          const val = cell.value;
          if (val && typeof val === 'object' && 'result' in val) {
            return Number(val.result) || 0;
          }
          return Number(val) || 0;
        };

        const Litros = getNumericValue(row.getCell(5));
        const Precio = getNumericValue(row.getCell(6));
        
        // Recalcular el total automáticamente en base a Litros * Precio para evitar problemas con celdas de fórmula vacías o NaN
        let Total = getNumericValue(row.getCell(7));
        if (Total === 0 && Litros > 0 && Precio > 0) {
          Total = parseFloat((Litros * Precio).toFixed(4));
        } else if (Total === 0) {
           Total = parseFloat((Litros * Precio).toFixed(4));
        }

        registrosAGuardar.push({
          Fecha_Hora,
          Consecutivo,
          Estacion,
          Combustible,
          Litros,
          Precio,
          Total
        });
        procesados++;
      } catch (err: any) {
        errores++;
        lastErrorReason = `Fila ${rowNumber}: Error interno - ${err.message}`;
      }
    });

    if (registrosAGuardar.length === 0) {
      return NextResponse.json({ error: `No se procesó ningún registro válido. Último error detectado: ${lastErrorReason}` }, { status: 400 });
    }

    // Insertar usando createMany
    await prisma.costos_Gasolina.createMany({
      data: registrosAGuardar,
      skipDuplicates: true
    });

    return NextResponse.json({ 
      message: 'Importación exitosa', 
      procesados, 
      errores 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error importing excel gasolina:', error);
    return NextResponse.json({ error: 'Error procesando el archivo: ' + error.message }, { status: 500 });
  }
}
