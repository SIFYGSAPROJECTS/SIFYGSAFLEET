import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { minioClient } from '@/lib/minio';

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
  } catch (error) {
    console.error(`Error ensuring bucket ${bucketName} exists:`, error);
  }
}

export async function GET(request: Request) {
  try {
    const edificios = await prisma.edificio.findMany({
      where: { Activo: true },
      orderBy: { Sucursal: 'asc' }
    });
    return NextResponse.json(edificios);
  } catch (error) {
    console.error('Error fetching edificios:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

async function handleFileUpload(file: File | null): Promise<string | null> {
  if (!file) return null;
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await ensureBucketExists('edificios');
  
  const nombreArch = `edificio-${new Date().getTime()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
  await minioClient.putObject('edificios', nombreArch, buffer, file.size, { 'Content-Type': file.type });
  
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  const minioHost = process.env.MINIO_ENDPOINT;
  const minioPort = process.env.MINIO_PORT === '80' || process.env.MINIO_PORT === '443' ? '' : `:${process.env.MINIO_PORT}`;
  return `${protocol}://${minioHost}${minioPort}/edificios/${nombreArch}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const Sucursal = formData.get('Sucursal') as string;
    const Direccion = formData.get('Direccion') as string;
    const departamentosStr = formData.get('Departamentos') as string;
    const file = formData.get('Foto_Portada') as File | null;
    
    if (!Sucursal || !Direccion) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const imageUrl = await handleFileUpload(file);

    const nuevoEdificio = await prisma.edificio.create({
      data: {
        Sucursal,
        Direccion,
        Departamentos: departamentosStr || '[]',
        Foto_Portada: imageUrl,
        Activo: true
      }
    });

    return NextResponse.json(nuevoEdificio, { status: 201 });
  } catch (error) {
    console.error('Error creando edificio:', error);
    return NextResponse.json({ error: 'Error al crear edificio' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const Id_Edificio = formData.get('Id_Edificio') as string;
    const Sucursal = formData.get('Sucursal') as string;
    const Direccion = formData.get('Direccion') as string;
    const departamentosStr = formData.get('Departamentos') as string;
    const file = formData.get('Foto_Portada') as File | null;
    
    if (!Id_Edificio || !Sucursal || !Direccion) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    const dataToUpdate: any = {
      Sucursal,
      Direccion,
      Departamentos: departamentosStr || '[]',
    };

    if (file && file.size > 0) {
      // Remove old file optionally here, but let's just keep it simple and upload new
      const imageUrl = await handleFileUpload(file);
      if (imageUrl) {
        dataToUpdate.Foto_Portada = imageUrl;
      }
    }

    const edificioActualizado = await prisma.edificio.update({
      where: { Id_Edificio: Number(Id_Edificio) },
      data: dataToUpdate
    });

    return NextResponse.json(edificioActualizado);
  } catch (error) {
    console.error('Error actualizando edificio:', error);
    return NextResponse.json({ error: 'Error al actualizar edificio' }, { status: 500 });
  }
}
