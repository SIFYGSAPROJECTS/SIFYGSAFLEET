import { NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';
import crypto from 'crypto';

const BUCKET_NAME = 'climas-evidencias';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB máximo para prevenir ataques de denegación de servicio (DoS)

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
    await ensureBucketExists();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo.' }, { status: 400 });
    }

    // 1. Candado de Tamaño de Archivo (Máx 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 5 MB.' }, 
        { status: 413 }
      );
    }

    // 2. Candado de MIME Type permitido (Solo imágenes y PDFs)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se aceptan imágenes JPG, PNG, WEBP o documentos PDF.' }, 
        { status: 400 }
      );
    }

    // 3. Candado de Extensión de Archivo
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
    const parts = file.name.split('.');
    if (parts.length < 2) {
      return NextResponse.json({ error: 'Nombre de archivo inválido.' }, { status: 400 });
    }
    const cleanExt = parts[parts.length - 1].toLowerCase().trim();

    if (!allowedExtensions.includes(cleanExt)) {
      return NextResponse.json(
        { error: 'Extensión de archivo no permitida.' }, 
        { status: 400 }
      );
    }

    // 4. Renombrado Criptográfico Seguro (UUID + timestamp) para neutralizar inyecciones de ruta
    const randomHash = crypto.randomUUID().replace(/-/g, '');
    const uniqueFilename = `evidencia_${Date.now()}_${randomHash}.${cleanExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 5. Guardado en MinIO (Aislamiento como objeto binario estático, no ejecutable)
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
    console.error('Error subiendo archivo a MinIO:', error);
    return NextResponse.json({ error: 'Error interno al procesar el archivo.' }, { status: 500 });
  }
}
