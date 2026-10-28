import { NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { minioClient } from '@/lib/minio';
import { verificarSesionMovil } from '@/lib/mobileAuth';
import { logAuditoria } from '@/lib/utils/audit';

export const APP_RELEASES_BUCKET = 'app-releases';
const MANIFEST_OBJECT = 'releases-manifest.json';
const MAX_RELEASE_HISTORY = 3; // Conserva los últimos 3 APKs en MinIO para cuidar el disco NVMe

export interface AppReleaseAsset {
  version: string;
  fileName: string;
  objectName: string;
  sizeBytes: number;
  notas: string;
  obligatoria: boolean;
  fechaPublicacion: string;
  publicadoPor: string;
}

export interface ReleasesManifest {
  latest: AppReleaseAsset | null;
  historial: AppReleaseAsset[];
}

async function asegurarBucketReleases() {
  const exists = await minioClient.bucketExists(APP_RELEASES_BUCKET);
  if (!exists) {
    await minioClient.makeBucket(APP_RELEASES_BUCKET, 'us-east-1');
  }
}

async function leerManifest(): Promise<ReleasesManifest> {
  try {
    const exists = await minioClient.bucketExists(APP_RELEASES_BUCKET);
    if (!exists) return { latest: null, historial: [] };

    const stream = await minioClient.getObject(APP_RELEASES_BUCKET, MANIFEST_OBJECT);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    const parsed = JSON.parse(raw) as ReleasesManifest;
    return {
      latest: parsed?.latest || null,
      historial: Array.isArray(parsed?.historial) ? parsed.historial : [],
    };
  } catch {
    return { latest: null, historial: [] };
  }
}

async function guardarManifest(manifest: ReleasesManifest) {
  await asegurarBucketReleases();
  const payload = Buffer.from(JSON.stringify(manifest, null, 2), 'utf8');
  await minioClient.putObject(APP_RELEASES_BUCKET, MANIFEST_OBJECT, payload, payload.length, {
    'Content-Type': 'application/json',
  });
}

function construirBaseOrigin(request: Request): string {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (forwardedHost) {
    const proto = forwardedProto || (forwardedHost.includes('localhost') || forwardedHost.startsWith('192.168.') ? 'http' : 'https');
    return `${proto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  try {
    const manifest = await leerManifest();
    const baseOrigin = construirBaseOrigin(request);

    const mapAsset = (item: AppReleaseAsset) => ({
      ...item,
      downloadUrl: `${baseOrigin}/api/mobile/version/download?v=${encodeURIComponent(item.version)}`,
    });

    return NextResponse.json({
      success: true,
      hasRelease: Boolean(manifest.latest),
      latest: manifest.latest ? mapAsset(manifest.latest) : null,
      historial: manifest.historial.map(mapAsset),
    });
  } catch (error) {
    console.error('Error en GET /api/mobile/version:', error);
    return NextResponse.json(
      { success: false, hasRelease: false, latest: null, historial: [] },
      { status: 200 }
    );
  }
}

/**
 * Publicación de nueva versión APK por bloques (Chunked Upload de ~4MB)
 * Evita límites de body size en proxies/Cloudflare y cuida la memoria RAM del contenedor Easypanel.
 */
export async function POST(request: Request) {
  try {
    const auth = await verificarSesionMovil(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const esAdmin = ['ADMIN', 'GERENCIAL'].includes(auth.rol) || auth.adminTi;
    if (!esAdmin) {
      return NextResponse.json(
        { error: 'Solo administradores pueden publicar nuevas versiones de la App.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const uploadId = (searchParams.get('uploadId') || '').replace(/[^a-zA-Z0-9_-]/g, '');
    const chunkIndex = parseInt(searchParams.get('chunkIndex') || '0', 10);
    const totalChunks = parseInt(searchParams.get('totalChunks') || '1', 10);
    const version = (searchParams.get('version') || '').trim().replace(/^v/i, '');
    const notas = (searchParams.get('notas') || '').trim();
    const obligatoria = searchParams.get('obligatoria') === 'true';

    if (!uploadId || !version || !/^\d+\.\d+\.\d+/.test(version)) {
      return NextResponse.json(
        { error: 'Formato de versión inválido (usa formato semántico ej. 1.1.0).' },
        { status: 400 }
      );
    }

    if (isNaN(chunkIndex) || isNaN(totalChunks) || chunkIndex < 0 || totalChunks < 1) {
      return NextResponse.json({ error: 'Parámetros de fragmento inválidos.' }, { status: 400 });
    }

    const tmpFilePath = path.join(os.tmpdir(), `sifygsa_apk_${uploadId}.part`);
    const arrayBuffer = await request.arrayBuffer();
    const chunkBuffer = Buffer.from(arrayBuffer);

    if (chunkIndex === 0 && fs.existsSync(tmpFilePath)) {
      fs.unlinkSync(tmpFilePath);
    }

    fs.appendFileSync(tmpFilePath, chunkBuffer);

    // Si aún faltan fragmentos, confirmar recepción parcial
    if (chunkIndex < totalChunks - 1) {
      return NextResponse.json({
        success: true,
        partial: true,
        chunkIndex,
        totalChunks,
      });
    }

    // Último fragmento recibido: subir archivo ensamblado a MinIO sin cargarlo en RAM
    try {
      const stat = fs.statSync(tmpFilePath);
      const cleanVersion = version.replace(/[^a-zA-Z0-9._-]/g, '');
      const fileName = `SIFYGSA-Checklist-v${cleanVersion}.apk`;
      const objectName = `apks/${fileName}`;

      await asegurarBucketReleases();
      await minioClient.fPutObject(APP_RELEASES_BUCKET, objectName, tmpFilePath, {
        'Content-Type': 'application/vnd.android.package-archive',
      });

      const manifestActual = await leerManifest();
      const nuevoAsset: AppReleaseAsset = {
        version: cleanVersion,
        fileName,
        objectName,
        sizeBytes: stat.size,
        notas: notas || `Actualización v${cleanVersion}`,
        obligatoria,
        fechaPublicacion: new Date().toISOString(),
        publicadoPor: auth.nombreCompleto,
      };

      const sinDuplicado = manifestActual.historial.filter((h) => h.version !== cleanVersion);
      const nuevoHistorial = [nuevoAsset, ...sinDuplicado];

      // Auto-rotación en MinIO si supera MAX_RELEASE_HISTORY
      const conservar = nuevoHistorial.slice(0, MAX_RELEASE_HISTORY);
      const purgar = nuevoHistorial.slice(MAX_RELEASE_HISTORY);
      for (const viejo of purgar) {
        if (viejo.objectName && viejo.objectName !== objectName) {
          await minioClient.removeObject(APP_RELEASES_BUCKET, viejo.objectName).catch(() => {});
        }
      }

      const nuevoManifest: ReleasesManifest = {
        latest: conservar[0] || nuevoAsset,
        historial: conservar,
      };

      await guardarManifest(nuevoManifest);

      await logAuditoria(
        auth.email,
        'PUBLISH_APP_RELEASE',
        'CHECKLISTS',
        `Nueva versión de App Android publicada: v${cleanVersion} (${(stat.size / (1024 * 1024)).toFixed(1)} MB)`
      );

      const baseOrigin = construirBaseOrigin(request);
      return NextResponse.json({
        success: true,
        partial: false,
        release: {
          ...nuevoAsset,
          downloadUrl: `${baseOrigin}/api/mobile/version/download?v=${encodeURIComponent(cleanVersion)}`,
        },
      });
    } finally {
      if (fs.existsSync(tmpFilePath)) {
        fs.unlinkSync(tmpFilePath);
      }
    }
  } catch (error: any) {
    console.error('Error en POST /api/mobile/version:', error);
    return NextResponse.json(
      { error: 'Error al publicar versión de la App', detalle: error?.message || String(error) },
      { status: 500 }
    );
  }
}

