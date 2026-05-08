import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

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
        const Servicio = getCellText(row.getCell(2));
        const ConsecutivoRaw = getCellText(row.getCell(3));
        const Consecutivo = ConsecutivoRaw.toUpperCase();
        const Costo_MO_Raw = row.getCell(4).value;
        const Costo_Ref_Raw = row.getCell(5).value;
        
        const ProveedorRaw = getCellText(row.getCell(7)) || 'No especificado';
        const EmpresaRaw = getCellText(row.getCell(8)) || 'S/E';
        const Tipo_MttoRaw = getCellText(row.getCell(9)) || 'Preventivo';
        const Factura_CDGRaw = getCellText(row.getCell(10)) || '';

        // Validaciones mínimas
        if (!Consecutivo || !Servicio) {
          errores++;
          lastErrorReason = `Fila ${rowNumber}: Falta Consecutivo ("${Consecutivo}") o Servicio ("${Servicio}")`;
          return;
        }

        // Si el consecutivo no existe en el inventario, marcar como error y saltar
        if (!validConsecutivos.has(Consecutivo)) {
          errores++;
          lastErrorReason = `Fila ${rowNumber}: Consecutivo "${Consecutivo}" no existe en Base de Datos. (Ejemplos válidos: ${Array.from(validConsecutivos).slice(0,3).join(', ')})`;
          return;
        }

        let Fecha = new Date();
        if (FechaRaw instanceof Date) {
          Fecha = FechaRaw;
        } else if (typeof FechaRaw === 'string') {
          Fecha = new Date(FechaRaw);
        } else if (typeof FechaRaw === 'number') {
           Fecha = new Date(Math.round((FechaRaw - 25569) * 86400 * 1000));
        }

        const Costo_MO = Number(Costo_MO_Raw) || 0;
        const Costo_Refacciones = Number(Costo_Ref_Raw) || 0;
        const Total = Costo_MO + Costo_Refacciones;

        const Proveedor = ProveedorRaw;
        const Empresa = EmpresaRaw;
        const Tipo_Mtto = Tipo_MttoRaw;
        const Factura_CDG = Factura_CDGRaw ? Factura_CDGRaw : null;

        registrosAGuardar.push({
          Fecha,
          Servicio,
          Consecutivo,
          Costo_MO,
          Costo_Refacciones,
          Total,
          Proveedor,
          Empresa,
          Tipo_Mtto,
          Factura_CDG
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
    await prisma.costos_Mantenimiento.createMany({
      data: registrosAGuardar,
      skipDuplicates: true
    });

    return NextResponse.json({ 
      message: 'Importación exitosa', 
      procesados, 
      errores 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error importing excel:', error);
    return NextResponse.json({ error: 'Error procesando el archivo: ' + error.message }, { status: 500 });
  }
}
