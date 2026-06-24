import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const equipos = await request.json();

    if (!Array.isArray(equipos) || equipos.length === 0) {
      return NextResponse.json({ error: 'No se enviaron equipos para procesar.' }, { status: 400 });
    }

    let insertados = 0;
    let errores = 0;

    for (const eq of equipos) {
      try {
        if (!eq.C_Interno) {
          errores++;
          continue;
        }

        const existe = await prisma.inventario_Computo.findUnique({
          where: { C_Interno: eq.C_Interno }
        });

        if (existe) {
          // Ignorar duplicados o actualizar si se deseara
          errores++;
          continue;
        }

        const nuevoEquipo = await prisma.inventario_Computo.create({
          data: {
            C_Interno: String(eq.C_Interno),
            Empresa: eq.Empresa ? String(eq.Empresa) : null,
            Tipo: eq.Tipo ? String(eq.Tipo) : null,
            Marca: eq.Marca ? String(eq.Marca) : null,
            Modelo: eq.Modelo ? String(eq.Modelo) : null,
            Service_Tag: eq.Service_Tag ? String(eq.Service_Tag) : null,
            Cargador: eq.Cargador ? String(eq.Cargador) : null,
            Usuario: eq.Usuario ? String(eq.Usuario) : null,
            Departamento: eq.Departamento ? String(eq.Departamento) : null,
            Puesto_Proyecto: eq.Puesto_Proyecto ? String(eq.Puesto_Proyecto) : null,
            N_EMP: eq.N_EMP ? String(eq.N_EMP) : null,
            Estatus: eq.Estatus ? String(eq.Estatus) : 'Asignado',
            CR: eq.CR ? String(eq.CR) : 'NO',
            Fecha_CR: eq.Fecha_CR ? new Date(eq.Fecha_CR) : null,
            Proveedor: eq.Proveedor ? String(eq.Proveedor) : null,
          }
        });

        await prisma.historial_Registro_Computo.create({
          data: {
            C_Interno: nuevoEquipo.C_Interno,
            Detalle: 'Alta inicial por importación masiva (Excel)',
          }
        });

        insertados++;
      } catch (err) {
        console.error(`Error procesando equipo ${eq.C_Interno}:`, err);
        errores++;
      }
    }

    return NextResponse.json({ 
      message: 'Proceso de importación finalizado.', 
      insertados, 
      errores 
    }, { status: 201 });

  } catch (error) {
    console.error('Error en importación bulk:', error);
    return NextResponse.json({ error: 'Hubo un error crítico al procesar el archivo.' }, { status: 500 });
  }
}
