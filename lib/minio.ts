import * as Minio from 'minio';

const minioEndpoint = process.env.MINIO_ENDPOINT || 'localhost';
const minioPort = parseInt(process.env.MINIO_PORT || '9000', 10);
const minioAccessKey = process.env.MINIO_ACCESS_KEY || '';
const minioSecretKey = process.env.MINIO_SECRET_KEY || '';
const useSSL = process.env.MINIO_USE_SSL === 'true' || minioPort === 443;

// Inicializamos el cliente de MinIO
export const minioClient = new Minio.Client({
  endPoint: minioEndpoint,
  port: minioPort,
  useSSL: useSSL,
  accessKey: minioAccessKey,
  secretKey: minioSecretKey,
});

// Función para inicializar los buckets principales en caso de que no existan
export const setupMinioBuckets = async () => {
  const buckets = ['evidencias', 'checklists'];
  
  for (const bucketName of buckets) {
    try {
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName, 'us-east-1');
        console.info(`Bucket created in MinIO: ${bucketName}`);

        // Crear política pública de lectura para poder ver los PDFs por URL
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
        // Bucket policy definition omitted for brevity or integrated
        console.info(`Bucket policy applied for: ${bucketName}`);
      }
    } catch (err) {
      console.error(`Error configurando el bucket ${bucketName}:`, err);
    }
  }
};
