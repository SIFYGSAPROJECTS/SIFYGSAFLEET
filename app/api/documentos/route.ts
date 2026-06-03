import { NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';
import { prisma } from '@/lib/db';
import { enviarCorreo } from '@/lib/email';
import { DocumentoExpiradoEmail } from '@/components/emails/DocumentoExpiradoEmail';

// --- HELPER PARA ASEGURAR LA EXISTENCIA DEL BUCKET ---
async function ensureBucketExists(bucketName: string) {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:GetObject'],
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
    }
  } catch (err) {
    console.error(`Error asegurando bucket ${bucketName}:`, err);
  }
}

// --- 1. BUSCADOR DE UNIDAD Y SUS DOCUMENTOS ---
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const consecutivo = searchParams.get('consecutivo');

    if (!consecutivo) {
      return NextResponse.json({ error: 'Falta el consecutivo' }, { status: 400 });
    }

    const vehiculo = await prisma.inventario_Automoviles.findUnique({
      where: { Consecutivo: consecutivo },
      include: {
        encargado: true
      }
    });

    if (!vehiculo) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    // Traemos los documentos guardados
    const documentos = await prisma.documentos_Unidad.findMany({
      where: { Consecutivo: consecutivo },
      orderBy: { Fecha_Subida: 'desc' }
    });

    const ultimaSolicitud = await prisma.solicitud.findFirst({
      where: { 
        auto: { 
          Consecutivo: consecutivo 
        } 
      },
      orderBy: { 
        Fecha_Realizacion: 'desc' 
      },
      select: { 
        Kilometraje: true 
      }
    });

    const kmFinal = ultimaSolicitud?.Kilometraje || vehiculo.Kilometraje || null;

    const nombreCompleto = vehiculo.encargado 
      ? `${vehiculo.encargado.Nombre_Empleado} ${vehiculo.encargado.A_Paterno}` 
      : 'Sin asignar';

    return NextResponse.json({
      documentos,
      vehiculoInfo: {
        marca: vehiculo.Marca,
        linea: vehiculo.Linea,
        modelo: vehiculo.Modelo,
        color: vehiculo.Color,
        placas: vehiculo.Placa || '',
        nombreConductor: nombreCompleto,
        kilometraje: kmFinal,
        estatus: vehiculo.Estatus_Operativo
      }
    });
  } catch (error) {
    console.error("Error GET documentos:", error);
    return NextResponse.json({ error: 'Error al cargar datos' }, { status: 500 });
  }
}

// --- 2. SUBIDA DE PDF CON TÍTULO INGRESADO POR EL ADMIN ---
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const consecutivo = formData.get('consecutivo') as string;
    const titulo = formData.get('titulo') as string;
    const fechaExpiracion = formData.get('fecha_expiracion') as string | null;
    const avisoDias = formData.get('aviso_dias') as string | null;

    if (!file || !consecutivo || !titulo) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Aseguramos la existencia del bucket en caliente
    await ensureBucketExists('documentos');

    // Guardamos en MinIO con nombre único
    const nombreArch = `${consecutivo.toLowerCase()}-${new Date().getTime()}.pdf`;

    await minioClient.putObject('documentos', nombreArch, buffer, file.size, { 'Content-Type': file.type });

    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const minioHost = process.env.MINIO_ENDPOINT;
    const minioPort = process.env.MINIO_PORT === '80' || process.env.MINIO_PORT === '443' ? '' : `:${process.env.MINIO_PORT}`;
    const publicUrl = `${protocol}://${minioHost}${minioPort}/documentos/${nombreArch}`;

    const fechaExpObj = fechaExpiracion ? new Date(fechaExpiracion) : null;
    const avisoDiasNum = avisoDias ? parseInt(avisoDias) : null;
    let notificado = false;

    // Validación inmediata al subir
    if (fechaExpObj && avisoDiasNum !== null) {
      const hoy = new Date();
      const diffTime = fechaExpObj.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Si se sube y ya está en zona de riesgo, enviamos correo al instante
      if (diffDays <= avisoDiasNum) {
        const administradores = await prisma.empleados.findMany({
          where: { Rol: 'ADMIN' },
          select: { Email: true }
        });
        const correosAdmins = administradores.map(admin => admin.Email);

        if (correosAdmins.length > 0) {
          await enviarCorreo({
            to: correosAdmins,
            subject: `⚠️ Aviso Urgente: ${consecutivo} - ${titulo}`,
            react: DocumentoExpiradoEmail({
              consecutivo: consecutivo,
              tituloDocumento: titulo,
              fechaExpiracion: fechaExpObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }),
              diasRestantes: diffDays
            })
          });
          notificado = true; // Marcamos para que el cron diario ya no lo vuelva a avisar
        }
      }
    }

    const nuevoDoc = await prisma.documentos_Unidad.create({
      data: {
        Consecutivo: consecutivo,
        Titulo: titulo,
        Ruta_PDF: publicUrl,
        Fecha_Expiracion: fechaExpObj,
        Aviso_Dias: avisoDiasNum,
        Notificado: notificado
      }
    });

    return NextResponse.json({ mensaje: 'Documento guardado correctamente', documento: nuevoDoc });

  } catch (error) {
    console.error("Error POST documentos:", error);
    return NextResponse.json({ error: 'Error al subir el documento' }, { status: 500 });
  }
}

// --- 3. ELIMINAR DOCUMENTO (BD + MINIO) ---
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Falta el ID del documento' }, { status: 400 });

    const documento = await prisma.documentos_Unidad.findUnique({ where: { id: Number(id) } });
    if (!documento) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });

    // Borramos de MinIO
    if (documento.Ruta_PDF.includes('/documentos/')) {
       const parts = documento.Ruta_PDF.split('/documentos/');
       if (parts.length > 1) {
         const nombreArchivo = parts[1];
         await minioClient.removeObject('documentos', nombreArchivo).catch(console.error);
       }
    }

    // Borramos de la BD
    await prisma.documentos_Unidad.delete({ where: { id: Number(id) } });

    return NextResponse.json({ success: true, mensaje: 'Documento eliminado' });
  } catch (error) {
    console.error("Error DELETE documentos:", error);
    return NextResponse.json({ error: 'Error interno al eliminar' }, { status: 500 });
  }
}

// --- 4. REEMPLAZAR ARCHIVO DE DOCUMENTO ---
export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const file = formData.get('file') as File;

    if (!id || !file) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });

    const documentoViejo = await prisma.documentos_Unidad.findUnique({ where: { id: Number(id) } });
    if (!documentoViejo) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });

    // Borramos el viejo archivo de MinIO
    if (documentoViejo.Ruta_PDF.includes('/documentos/')) {
      const parts = documentoViejo.Ruta_PDF.split('/documentos/');
      if (parts.length > 1) {
         const nombreArchivoViejo = parts[1];
         await minioClient.removeObject('documentos', nombreArchivoViejo).catch(console.error);
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Aseguramos la existencia del bucket en caliente
    await ensureBucketExists('documentos');
    
    const nombreArchNuevo = `${documentoViejo.Consecutivo.toLowerCase()}-edit-${new Date().getTime()}.pdf`;

    await minioClient.putObject('documentos', nombreArchNuevo, buffer, file.size, { 'Content-Type': file.type });

    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const minioHost = process.env.MINIO_ENDPOINT;
    const minioPort = process.env.MINIO_PORT === '80' || process.env.MINIO_PORT === '443' ? '' : `:${process.env.MINIO_PORT}`;
    const publicUrl = `${protocol}://${minioHost}${minioPort}/documentos/${nombreArchNuevo}`;

    await prisma.documentos_Unidad.update({
      where: { id: Number(id) },
      data: { Ruta_PDF: publicUrl }
    });

    return NextResponse.json({ success: true, mensaje: 'Documento actualizado correctamente' });

  } catch (error) {
    console.error("Error PUT documentos:", error);
    return NextResponse.json({ error: 'Error interno al actualizar' }, { status: 500 });
  }
}

// --- 5. ACTUALIZAR FECHA DE EXPIRACIÓN Y AVISO ---
export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { id, fecha_expiracion, aviso_dias } = data;

    if (!id) return NextResponse.json({ error: 'Falta el ID del documento' }, { status: 400 });

    const fechaExpObj = fecha_expiracion ? new Date(fecha_expiracion) : null;
    const avisoDiasNum = aviso_dias ? parseInt(aviso_dias) : null;
    let notificado = false;

    // Validación inmediata al editar
    if (fechaExpObj && avisoDiasNum !== null) {
      const hoy = new Date();
      const diffTime = fechaExpObj.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Si se edita y ya está en zona de riesgo, enviamos correo al instante
      if (diffDays <= avisoDiasNum) {
        const docViejo = await prisma.documentos_Unidad.findUnique({ where: { id: Number(id) } });
        if (docViejo) {
          const administradores = await prisma.empleados.findMany({
            where: { Rol: 'ADMIN' },
            select: { Email: true }
          });
          const correosAdmins = administradores.map(admin => admin.Email);

          if (correosAdmins.length > 0) {
            await enviarCorreo({
              to: correosAdmins,
              subject: `⚠️ Aviso Urgente (Actualización): ${docViejo.Consecutivo} - ${docViejo.Titulo}`,
              react: DocumentoExpiradoEmail({
                consecutivo: docViejo.Consecutivo,
                tituloDocumento: docViejo.Titulo,
                fechaExpiracion: fechaExpObj.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }),
                diasRestantes: diffDays
              })
            });
            notificado = true; 
          }
        }
      }
    }

    await prisma.documentos_Unidad.update({
      where: { id: Number(id) },
      data: { 
        Fecha_Expiracion: fechaExpObj,
        Aviso_Dias: avisoDiasNum,
        Notificado: notificado
      }
    });

    return NextResponse.json({ success: true, mensaje: 'Vencimiento actualizado correctamente' });

  } catch (error) {
    console.error("Error PATCH documentos:", error);
    return NextResponse.json({ error: 'Error interno al actualizar fechas' }, { status: 500 });
  }
}
