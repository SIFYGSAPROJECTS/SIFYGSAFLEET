import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Parser para CSV con soporte de comillas y saltos de línea internos
function parseCSV(text: string) {
  const lines: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Saltar comilla escapada
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentField.trim());
      if (currentRow.some(val => val.length > 0)) {
        lines.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(val => val.length > 0)) {
      lines.push(currentRow);
    }
  }

  return lines;
}

async function main() {
  const csvPath = path.join(process.cwd(), 'AC (2).csv');
  console.log(`Leyendo archivo CSV: ${csvPath}`);

  if (!fs.existsSync(csvPath)) {
    console.error(`El archivo no existe: ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(content);

  console.log(`Filas detectadas en el CSV: ${rows.length}`);

  let insertados = 0;
  let actualizados = 0;
  let errores = 0;

  for (const row of rows) {
    if (!row || row.length < 5) continue;

    const nInterno = row[0]?.trim();
    if (!nInterno || nInterno.toLowerCase().includes('n_interno')) continue;

    const empresa = row[1]?.trim() || 'SIFYGSA';
    const tipo = row[2]?.trim() || 'Aire Acondicionado';
    const descripcion = row[3]?.trim() || '';
    const modelo = row[4]?.trim() || '';
    const departamento = row[5]?.trim() || '';
    // Limpieza de saltos de línea internos en ubicación
    const ubicacion = (row[6] || '').replace(/[\r\n]+/g, ' ').trim();
    const proveedor = (row[7] || '').replace(/[\r\n]+/g, ' ').trim();
    const estatus = (row[8] || 'Activo').replace(/[\r\n]+/g, ' ').trim();

    try {
      const existing = await prisma.inventario_Aires_Acondicionados.findUnique({
        where: { N_Interno: nInterno }
      });

      await prisma.inventario_Aires_Acondicionados.upsert({
        where: { N_Interno: nInterno },
        update: {
          Empresa: empresa,
          Tipo: tipo,
          Descripcion: descripcion,
          Modelo: modelo,
          Departamento: departamento,
          Ubicacion: ubicacion,
          Proveedor: proveedor,
          Estatus: estatus,
        },
        create: {
          N_Interno: nInterno,
          Empresa: empresa,
          Tipo: tipo,
          Descripcion: descripcion,
          Modelo: modelo,
          Departamento: departamento,
          Ubicacion: ubicacion,
          Proveedor: proveedor,
          Estatus: estatus,
        },
      });

      if (existing) {
        actualizados++;
      } else {
        insertados++;
      }
      console.log(`[OK] ${nInterno} - ${descripcion} (${ubicacion}) -> ${estatus}`);
    } catch (err) {
      console.error(`Error procesando ${nInterno}:`, err);
      errores++;
    }
  }

  console.log('\n--- RESUMEN DE IMPORTACIÓN DE CLIMAS ---');
  console.log(`Nuevos insertados: ${insertados}`);
  console.log(`Actualizados: ${actualizados}`);
  console.log(`Errores: ${errores}`);
  console.log(`Total procesados: ${insertados + actualizados}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
