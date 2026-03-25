import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

export const BUCKETS = {
  RUNBOOKS: process.env.S3_BUCKET_RUNBOOKS || 'xp-compressor-runbooks',
  REPORTS: process.env.S3_BUCKET_REPORTS || 'xp-compressor-reports',
  PHOTOS: process.env.S3_BUCKET_PHOTOS || 'xp-compressor-photos',
};

export const getPresignedUrl = async (bucket: string, key: string, expiresIn = 3600) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(client, command, { expiresIn });
};

export const getUploadUrl = async (bucket: string, key: string, contentType: string, expiresIn = 300) => {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return await getSignedUrl(client, command, { expiresIn });
};

export const uploadText = async (bucket: string, key: string, content: string) => {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: content,
    ContentType: 'text/plain',
  });
  return await client.send(command);
};
