import { NextResponse } from 'next/server';
import { uploadToMinio } from '@/lib/minio';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // Create a unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const prefixParam = formData.get('prefix') as string;
    const prefix = prefixParam ? prefixParam.replace(/^\/+/, '').replace(/\/*$/, '/') : 'evidencias_mtto/';
    const bucketParam = formData.get('bucket') as string;

    // Upload to MinIO
    const url = await uploadToMinio(`${prefix}${filename}`, buffer, file.type, bucketParam || 'documentos');

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error uploading to MinIO:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}
