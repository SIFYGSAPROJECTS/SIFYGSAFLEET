import { NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';

const BUCKET_NAME = 'tickets-gastos';

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

    // Validar tipo de archivo (PDF e imágenes)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Formato no soportado. Solo se permiten PDFs e imágenes (JPG, PNG, WEBP).' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExt = file.name.split('.').pop() || 'file';
    const cleanExt = fileExt.toLowerCase();
    const uniqueFilename = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${cleanExt}`;

    await minioClient.putObject(BUCKET_NAME, uniqueFilename, buffer, file.size, {
      'Content-Type': file.type,
    });

    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const minioHost = process.env.MINIO_ENDPOINT;
    const minioPort = process.env.MINIO_PORT === '80' || process.env.MINIO_PORT === '443' ? '' : `:${process.env.MINIO_PORT}`;
    const publicUrl = `${protocol}://${minioHost}${minioPort}/${BUCKET_NAME}/${uniqueFilename}`;

    return NextResponse.json({ url: publicUrl, filename: uniqueFilename });
  } catch (error: any) {
    console.error('Error subiendo ticket a MinIO:', error);
    return NextResponse.json({ error: 'Error interno al subir el comprobante.' }, { status: 500 });
  }
}
