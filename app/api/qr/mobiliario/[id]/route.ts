import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const nInterno = id ? decodeURIComponent(id).trim() : '';

    if (!nInterno) {
      return NextResponse.json({ error: 'Número interno no especificado' }, { status: 400 });
    }

    const item = await prisma.inventario_Mobiliario.findUnique({
      where: { N_Interno: nInterno },
      include: {
        revisiones: {
          orderBy: { Fecha_Revision: 'desc' },
          take: 10,
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Mobiliario no encontrado en el inventario' }, { status: 404 });
    }

    // Comprobar estado de sesión del usuario
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value || null;
    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
    const canAudit = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;

    let auditorNombre = cookieStore.get('user_name')?.value || null;
    if (userEmail && !auditorNombre) {
      const emp = await prisma.empleados.findUnique({
        where: { Email: userEmail },
        select: { Nombre_Empleado: true, A_Paterno: true },
      });
      if (emp) {
        auditorNombre = `${emp.Nombre_Empleado} ${emp.A_Paterno}`.trim();
      }
    }

    return NextResponse.json({
      item,
      revisiones: item.revisiones,
      user: {
        isAuthenticated: !!userEmail,
        canAudit,
        email: userEmail,
        nombre: auditorNombre || userEmail || 'Auditor',
        role: userRole,
      },
    });
  } catch (error: any) {
    console.error('Error al obtener datos del mobiliario por QR:', error);
    return NextResponse.json({ error: 'Error del servidor al consultar el mobiliario' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const nInterno = id ? decodeURIComponent(id).trim() : '';

    if (!nInterno) {
      return NextResponse.json({ error: 'Número interno no especificado' }, { status: 400 });
    }

    // 1. Candado de Autenticación y Permisos
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Debe iniciar sesión en el sistema para registrar la revisión anual.' },
        { status: 401 }
      );
    }

    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
    const canAudit = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;

    if (!canAudit) {
      return NextResponse.json(
        { error: 'Permisos insuficientes. Se requiere rol de Administrador, Gerencial o TI para auditar mobiliario.' },
        { status: 403 }
      );
    }

    // Obtener nombre del auditor
    let auditorNombre = cookieStore.get('user_name')?.value || null;
    if (!auditorNombre) {
      const emp = await prisma.empleados.findUnique({
        where: { Email: userEmail },
        select: { Nombre_Empleado: true, A_Paterno: true },
      });
      if (emp) {
        auditorNombre = `${emp.Nombre_Empleado} ${emp.A_Paterno}`.trim();
      }
    }

    const body = await request.json();
    const {
      condicion,
      dictamen,
      ubicacion_fisica,
      departamento_fisico,
      foto_evidencia,
      observaciones,
      anio,
      // Trampa Honeypot
      website,
      hp_check,
    } = body;

    // Trampa antibot silenciosa
    if (website || hp_check) {
      return NextResponse.json({ success: true, fake: true });
    }

    // 2. Validaciones obligatorias de campos
    const cleanCondicion = String(condicion || '').trim();
    const cleanDictamen = String(dictamen || '').trim();

    const condicionesValidas = ['Excelente', 'Bueno', 'Regular', 'Malo'];
    if (!condicionesValidas.includes(cleanCondicion)) {
      return NextResponse.json({ error: 'Condición física no válida' }, { status: 400 });
    }

    const dictamenesValidos = ['En uso / Activo', 'Solicitar Baja', 'Requiere Reparación'];
    if (!dictamenesValidos.includes(cleanDictamen)) {
      return NextResponse.json({ error: 'Dictamen no válido' }, { status: 400 });
    }

    // 3. Verificar existencia del mueble
    const item = await prisma.inventario_Mobiliario.findUnique({
      where: { N_Interno: nInterno },
    });

    if (!item) {
      return NextResponse.json({ error: 'El mobiliario no existe en el inventario' }, { status: 404 });
    }

    const cleanObservaciones = observaciones ? String(observaciones).slice(0, 500).trim() : null;
    const cleanFoto = foto_evidencia ? String(foto_evidencia).trim() : null;
    const anioRevision = typeof anio === 'number' && anio > 2020 ? anio : new Date().getFullYear();

    const cleanUbicacion = ubicacion_fisica ? String(ubicacion_fisica).trim() : item.Ubicacion;
    const cleanDepartamento = departamento_fisico ? String(departamento_fisico).trim() : item.Departamento;

    // Determinar nuevo estatus según el dictamen
    let nuevoEstatus = item.Estatus || 'Activo';
    if (cleanDictamen === 'Solicitar Baja') {
      nuevoEstatus = 'Baja';
    } else if (cleanDictamen === 'Requiere Reparación') {
      nuevoEstatus = 'En Reparación';
    } else if (cleanDictamen === 'En uso / Activo') {
      nuevoEstatus = 'Activo';
    }

    // 4. Transacción atómica: Crear registro histórico y actualizar estatus del mueble
    const [nuevaRevision, itemActualizado] = await prisma.$transaction([
      prisma.revision_Mobiliario.create({
        data: {
          N_Interno: nInterno,
          Anio: anioRevision,
          Auditor_Email: userEmail,
          Auditor_Nombre: auditorNombre || userEmail,
          Condicion_Fisica: cleanCondicion,
          Dictamen: cleanDictamen,
          Ubicacion_Fisica: cleanUbicacion,
          Departamento_Fisico: cleanDepartamento,
          Foto_Evidencia: cleanFoto,
          Observaciones: cleanObservaciones,
        },
      }),
      prisma.inventario_Mobiliario.update({
        where: { N_Interno: nInterno },
        data: {
          Ultima_Revision: new Date(),
          Estatus: nuevoEstatus,
          Ubicacion: cleanUbicacion,
          Departamento: cleanDepartamento,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      revision: nuevaRevision,
      item: itemActualizado,
    });
  } catch (error: any) {
    console.error('Error al registrar revisión de mobiliario:', error);
    return NextResponse.json({ error: 'Error del servidor al guardar la revisión' }, { status: 500 });
  }
}
