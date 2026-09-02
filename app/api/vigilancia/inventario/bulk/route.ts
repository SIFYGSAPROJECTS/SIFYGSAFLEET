import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

async function checkIsAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get('user_email')?.value;
  if (!userEmail) return false;
  const userRole = cookieStore.get('user_role')?.value || 'USER';
  const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
  return ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;
}

export async function POST(req: Request) {
  if (!(await checkIsAdmin())) {
    return NextResponse.json({ error: 'Acceso no autorizado. Se requieren permisos de Administrador.' }, { status: 403 });
  }
  try {
    const body = await req.json();
    const { equipos } = body;

    if (!Array.isArray(equipos) || equipos.length === 0) {
      return NextResponse.json({ error: 'La lista de equipos está vacía o es inválida.' }, { status: 400 });
    }

    let insertados = 0;
    let actualizados = 0;
    const errores: any[] = [];

    for (const [index, row] of equipos.entries()) {
      const consecutivo = row.Consecutivo || row.consecutivo || row.ID || row.N_Interno || row.Codigo;
      if (!consecutivo || typeof consecutivo !== 'string' || !consecutivo.trim()) {
        errores.push({ fila: index + 1, error: 'Consecutivo no especificado o inválido' });
        continue;
      }

      const consecutivoClean = consecutivo.trim().toUpperCase();

      try {
        const existente = await prisma.inventario_Vigilancia.findUnique({
          where: { Consecutivo: consecutivoClean },
        });

        const dataPayload = {
          Equipo_NVR: (row.Equipo_NVR || row.NVR || row.Grabador || '')?.toString().trim() || null,
          Servidor_Datos: (row.Servidor_Datos || row.Servidor || row.Storage || '')?.toString().trim() || null,
          Tipo_Camara: (row.Tipo_Camara || row.Tipo || row.Camara || '')?.toString().trim() || null,
          Tipo_Canon: (row.Tipo_Canon || row.Canon || row.Lente || '')?.toString().trim() || null,
          Marca_Modelo: (row.Marca_Modelo || row.Modelo || row.Marca || '')?.toString().trim() || null,
          Ubicacion: (row.Ubicacion || row.Sede || row.Planta || '')?.toString().trim() || null,
          Zona_Area: (row.Zona_Area || row.Zona || row.Area || '')?.toString().trim() || null,
          Direccion_IP: (row.Direccion_IP || row.IP || '')?.toString().trim() || null,
          Canal_NVR: (row.Canal_NVR || row.Canal || row.CH || '')?.toString().trim() || null,
          Resolucion: (row.Resolucion || row.Calidad || '')?.toString().trim() || null,
          Estatus: (row.Estatus || row.Estado || 'En Línea')?.toString().trim() || 'En Línea',
          Notas: (row.Notas || row.Observaciones || '')?.toString().trim() || null,
        };

        if (existente) {
          await prisma.inventario_Vigilancia.update({
            where: { Consecutivo: consecutivoClean },
            data: dataPayload,
          });
          actualizados++;
        } else {
          await prisma.inventario_Vigilancia.create({
            data: {
              Consecutivo: consecutivoClean,
              ...dataPayload,
            },
          });
          insertados++;
        }
      } catch (e: any) {
        errores.push({ fila: index + 1, consecutivo: consecutivoClean, error: e.message });
      }
    }

    return NextResponse.json({
      success: true,
      totalProcesados: equipos.length,
      insertados,
      actualizados,
      errores,
    });
  } catch (error: any) {
    console.error('Error en carga masiva de vigilancia:', error);
    return NextResponse.json({ error: error.message || 'Error al procesar carga masiva' }, { status: 500 });
  }
}
