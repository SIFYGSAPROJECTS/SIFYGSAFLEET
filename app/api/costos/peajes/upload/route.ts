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

    const getCellText = (cell: ExcelJS.Cell) => {
      const val = cell.value;
      if (val !== null && typeof val === 'object' && 'richText' in val) {
        return val.richText.map((rt: any) => rt.text).join('').trim();
      }
      return cell.text?.trim() || cell.value?.toString().trim() || '';
    };

    const getNumericValue = (cell: ExcelJS.Cell) => {
      const val = cell.value;
      if (val && typeof val === 'object' && 'result' in val) {
        return Number(val.result) || 0;
      }
      return Number(val) || 0;
    };

    const parseTime = (val: any): { h: number, m: number, s: number } => {
      if (val instanceof Date) {
        return { h: val.getHours(), m: val.getMinutes(), s: val.getSeconds() };
      }
      if (typeof val === 'number') {
        const totalSeconds = Math.round(val * 86400);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return { h, m, s };
      }
      if (typeof val === 'string') {
        const parts = val.split(':');
        if (parts.length >= 2) {
          return { h: parseInt(parts[0]) || 0, m: parseInt(parts[1]) || 0, s: parseInt(parts[2]) || 0 };
        }
      }
      return { h: 0, m: 0, s: 0 };
    };

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Saltar encabezados

      try {
        const ConsecutivoRaw = getCellText(row.getCell(2));
        const Importe = getNumericValue(row.getCell(8));

        // Si no hay consecutivo ni importe, asumimos que es una fila vacía al final del Excel y la ignoramos
        if (!ConsecutivoRaw && !Importe) {
          return;
        }

        const Tag = getCellText(row.getCell(1)) || 'N/A';
        const Consecutivo = ConsecutivoRaw.toUpperCase();
        const FechaRaw = row.getCell(3).value;
        const HoraRaw = row.getCell(4).value;
        const Caseta = getCellText(row.getCell(5)) || 'No especificada';
        const Carril = getCellText(row.getCell(6)) || 'N/A';
        const Clase = getCellText(row.getCell(7)) || '1';
        const FechaAplicacion = getCellText(row.getCell(9));
        const HoraAplicacion = getCellText(row.getCell(10));
        const Consecar = getCellText(row.getCell(11));
        
        if (!Consecutivo) {
          errores++;
          lastErrorReason = `Fila ${rowNumber}: Falta Consecutivo`;
          return;
        }

        if (!validConsecutivos.has(Consecutivo)) {
          errores++;
          lastErrorReason = `Fila ${rowNumber}: Consecutivo "${Consecutivo}" no existe en Base de Datos. (Ejemplos válidos: ${Array.from(validConsecutivos).slice(0,3).join(', ')})`;
          return;
        }

        let Fecha_Hora = new Date();
        if (FechaRaw instanceof Date) {
          Fecha_Hora = new Date(FechaRaw);
        } else if (typeof FechaRaw === 'string') {
          Fecha_Hora = new Date(FechaRaw);
        } else if (typeof FechaRaw === 'number') {
           Fecha_Hora = new Date(Math.round((FechaRaw - 25569) * 86400 * 1000));
        }

        // Apply time
        if (HoraRaw) {
          const timeObj = parseTime(HoraRaw);
          Fecha_Hora.setHours(timeObj.h, timeObj.m, timeObj.s);
        }

        registrosAGuardar.push({
          Tag,
          Consecutivo,
          Fecha_Hora,
          Caseta,
          Carril,
          Clase,
          Importe,
          Fecha_Aplicacion: FechaAplicacion || null,
          Hora_Aplicacion: HoraAplicacion || null,
          Consecar: Consecar || null
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

    // --- LÓGICA ANTI-DUPLICADOS ---
    const consecutivosInFile = Array.from(new Set(registrosAGuardar.map(r => r.Consecutivo)));
    const existingPeajes = await prisma.costos_Peajes.findMany({
      where: { Consecutivo: { in: consecutivosInFile } },
      select: { Consecutivo: true, Fecha_Hora: true, Caseta: true, Importe: true }
    });

    const existingHashes = new Set(
      existingPeajes.map(p => `${p.Consecutivo}_${p.Fecha_Hora.getTime()}_${p.Caseta.toLowerCase()}_${p.Importe}`)
    );

    const registrosUnicos = [];
    let duplicados = 0;

    for (const reg of registrosAGuardar) {
      const hash = `${reg.Consecutivo}_${reg.Fecha_Hora.getTime()}_${reg.Caseta.toLowerCase()}_${reg.Importe}`;
      if (existingHashes.has(hash)) {
        duplicados++;
      } else {
        registrosUnicos.push(reg);
        existingHashes.add(hash); // Evitar duplicados dentro del mismo Excel
      }
    }

    if (registrosUnicos.length === 0) {
      return NextResponse.json({ error: `Todos los registros del archivo ya existían en la base de datos (Duplicados ignorados: ${duplicados}).` }, { status: 400 });
    }

    await prisma.costos_Peajes.createMany({
      data: registrosUnicos,
      skipDuplicates: true
    });

    return NextResponse.json({ 
      message: 'Importación exitosa', 
      procesados: registrosUnicos.length, 
      errores,
      duplicados
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error importing excel peajes:', error);
    return NextResponse.json({ error: 'Error procesando el archivo: ' + error.message }, { status: 500 });
  }
}
