import { NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const BUCKET_NAME = 'mobiliario-evidencias';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB máximo para prevenir ataques de denegación de servicio (DoS)

async function checkIsAuthorized(): Promise<{ authorized: boolean; email?: string }> {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('user_email')?.value;
    if (!userEmail) return { authorized: false };

    const userRole = cookieStore.get('user_role')?.value || 'USER';
    const userAdminTi = cookieStore.get('user_admin_ti')?.value === 'true';
    const isAuthorized = ['ADMIN', 'GERENCIAL'].includes(userRole) || userAdminTi;

    return { authorized: isAuthorized, email: userEmail };
  } catch {
    return { authorized: false };
  }
}

async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:GetObject'],
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    }
  } catch (err) {
    console.error(`Error configurando bucket ${BUCKET_NAME}:`, err);
  }
}

export async function POST(request: Request) {
  try {
    // 1. Candado de Autenticación y Autorización
    const auth = await checkIsAuthorized();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: 'No autorizado. Se requieren permisos para subir evidencias de auditoría.' },
        { status: 403 }
      );
    }

    await ensureBucketExists();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo.' }, { status: 400 });
    }

    // 2. Candado de Tamaño de Archivo (Máx 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 5 MB.' }, 
        { status: 413 }
      );
    }

    // 3. Candado de MIME Type permitido (Solo imágenes seguras)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se aceptan imágenes JPG, PNG o WEBP.' }, 
        { status: 400 }
      );
    }

    // 4. Candado de Extensión de Archivo
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const parts = file.name.split('.');
    const cleanExt = parts[parts.length - 1].toLowerCase().trim();

    if (!allowedExtensions.includes(cleanExt)) {
      return NextResponse.json(
        { error: 'Extensión de archivo no permitida.' }, 
        { status: 400 }
      );
    }

    // 5. Renombrado Criptográfico Seguro (UUID + timestamp) para neutralizar inyecciones de ruta
    const randomHash = crypto.randomUUID().replace(/-/g, '');
    const uniqueFilename = `mob_rev_${Date.now()}_${randomHash}.${cleanExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 6. Guardado en MinIO (Aislamiento como objeto binario estático, no ejecutable)
    await minioClient.putObject(BUCKET_NAME, uniqueFilename, buffer, file.size, {
      'Content-Type': file.type,
      'X-Content-Type-Options': 'nosniff', // Prevenir MIME sniffing en el navegador
    });

    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const minioHost = process.env.MINIO_ENDPOINT;
    const minioPort = process.env.MINIO_PORT === '80' || process.env.MINIO_PORT === '443' ? '' : `:${process.env.MINIO_PORT}`;
    const publicUrl = `${protocol}://${minioHost}${minioPort}/${BUCKET_NAME}/${uniqueFilename}`;

    return NextResponse.json({ url: publicUrl, filename: uniqueFilename });
  } catch (error: any) {
    console.error('Error subiendo evidencia de mobiliario a MinIO:', error);
    return NextResponse.json({ error: 'Error interno al procesar el archivo.' }, { status: 500 });
  }
}
