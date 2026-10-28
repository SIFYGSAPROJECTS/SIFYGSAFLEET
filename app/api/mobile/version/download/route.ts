import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { minioClient } from '@/lib/minio';
import { APP_RELEASES_BUCKET, ReleasesManifest } from '../route';

const MANIFEST_OBJECT = 'releases-manifest.json';

async function obtenerManifest(): Promise<ReleasesManifest> {
  const stream = await minioClient.getObject(APP_RELEASES_BUCKET, MANIFEST_OBJECT);
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as ReleasesManifest;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedVersion = searchParams.get('v')?.trim().replace(/^v/i, '');

    const manifest = await obtenerManifest();
    const target = requestedVersion
      ? manifest.historial.find((h) => h.version === requestedVersion) || manifest.latest
      : manifest.latest;

    if (!target || !target.objectName) {
      return NextResponse.json(
        { error: 'Aún no hay ningún instalador APK publicado en SIFYGSAFLEET.' },
        { status: 404 }
      );
    }

    const stat = await minioClient.statObject(APP_RELEASES_BUCKET, target.objectName);
    const nodeStream = await minioClient.getObject(APP_RELEASES_BUCKET, target.objectName);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': String(stat.size),
        'Content-Disposition': `attachment; filename="${target.fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error descargando APK desde MinIO:', error);
    return NextResponse.json(
      { error: 'No se pudo descargar el instalador APK solicitado.' },
      { status: 404 }
    );
  }
}

