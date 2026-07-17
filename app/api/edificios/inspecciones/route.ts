import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const Id_Edificio = searchParams.get('Id_Edificio');

    if (!Id_Edificio) {
      return NextResponse.json({ error: 'Falta el Id del Edificio' }, { status: 400 });
    }

    const inspecciones = await prisma.inspeccion_Edificio.findMany({
      where: { Id_Edificio: parseInt(Id_Edificio) },
      include: {
        fotos: true,
        areas: {
          include: {
            detalles: true
          }
        }
      },
      orderBy: { Fecha_Inspeccion: 'desc' }
    });

    return NextResponse.json(inspecciones, { status: 200 });
  } catch (error) {
    console.error('Error fetching inspecciones:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { Id_Inspeccion, Id_Edificio, Estado, Datos_Formato, Observaciones, Fotos } = data;

    if (!Id_Edificio) {
      return NextResponse.json({ error: 'Falta el Id del Edificio' }, { status: 400 });
    }

    let inspeccionId = Id_Inspeccion;

    // Create or Update Inspection
    if (inspeccionId) {
      // Update existing
      await prisma.inspeccion_Edificio.update({
        where: { Id_Inspeccion: inspeccionId },
        data: {
          Estado,
          Datos_Formato,
          Observaciones,
        }
      });
    } else {
      // Create new
      const currentYear = new Date().getFullYear().toString().slice(-2);
      // Get count to generate consecutive
      const count = await prisma.inspeccion_Edificio.count({
        where: { Id_Edificio }
      });
      const consecutivo = `INSP-${currentYear}-${String(count + 1).padStart(4, '0')}`;

      const nueva = await prisma.inspeccion_Edificio.create({
        data: {
          Id_Edificio,
          Consecutivo: consecutivo,
          Estado,
          Datos_Formato,
          Observaciones,
        }
      });
      inspeccionId = nueva.Id_Inspeccion;
    }

    // Update photos (Cajón de Fotos)
    await prisma.foto_Inspeccion_Edificio.deleteMany({
      where: { Id_Inspeccion: inspeccionId }
    });
    
    if (Fotos && Fotos.length > 0) {
      const fotosData = Fotos.map((f: any) => ({
        Id_Inspeccion: inspeccionId,
        Url_Foto: f.url,
        Descripcion: f.descripcion || ''
      }));
      await prisma.foto_Inspeccion_Edificio.createMany({
        data: fotosData
      });
    }

    // Sync Relational Tables (Inspeccion_Area & Inspeccion_Detalle)
    // First, clear old ones for this inspection (detalles are cascaded)
    await prisma.inspeccion_Area.deleteMany({
      where: { Id_Inspeccion: inspeccionId }
    });

    if (Datos_Formato) {
      try {
        const pData = JSON.parse(Datos_Formato);
        if (pData && Array.isArray(pData.areas)) {
          for (const area of pData.areas) {
            const detallesToCreate: any[] = [];
            if (area.respuestas) {
              for (const [item, resp] of Object.entries(area.respuestas)) {
                 const r = resp as { estado: string, observacion: string };
                 if (r.estado) {
                   detallesToCreate.push({
                     Item: item,
                     Estado: r.estado,
                     Observaciones: r.observacion || ''
                   });
                 }
              }
            }

            await prisma.inspeccion_Area.create({
              data: {
                Id_Inspeccion: inspeccionId,
                Nombre: area.nombre || '',
                Puertas: area.puertas || 0,
                Luminarias: area.luminarias || 0,
                Estado: area.estado || 'No definido',
                Observaciones: area.observacion || '',
                Categorias: area.categoriasActivas ? JSON.stringify(area.categoriasActivas) : '',
                detalles: detallesToCreate.length > 0 ? { create: detallesToCreate } : undefined
              }
            });
          }
        }
      } catch(e) {
        console.error("Error parsing Datos_Formato for relational sync:", e);
      }
    }

    // Fetch the updated inspection to return
    const inspeccionActualizada = await prisma.inspeccion_Edificio.findUnique({
      where: { Id_Inspeccion: inspeccionId },
      include: {
        edificio: true,
        fotos: true
      }
    });

    return NextResponse.json(inspeccionActualizada, { status: 200 });
  } catch (error) {
    console.error('Error guardando inspección:', error);
    return NextResponse.json({ error: 'Error interno al guardar la inspección' }, { status: 500 });
  }
}
