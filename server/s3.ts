import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "./config";

export const s3Client = new S3Client({
  region: config.AWS_REGION,
  ...(config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: config.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

export const S3_BUCKET = config.S3_BUCKET_NAME;

/** Upload a buffer to S3 and return the key. */
export async function uploadToS3(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
    })
  );
  return key;
}

/** Generate a short-lived presigned GET URL (default 15 min). */
export async function getPresignedUrl(
  key: string,
  expiresInSeconds = 900
): Promise<string> {
  return getSignedUrl(
    s3Client,
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    { expiresIn: expiresInSeconds }
  );
}

/** Generate a presigned GET URL valid for 1 hour (used for n8n forwarding). */
export async function getN8nPresignedUrl(key: string): Promise<string> {
  return getPresignedUrl(key, 3600);
}

/** Download an S3 object and return its contents as a Buffer. */
export async function downloadFromS3(key: string): Promise<Buffer> {
  const response = await s3Client.send(
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
  );
  if (!response.Body) {
    throw new Error(`No body in S3 response for key: ${key}`);
  }
  const stream = response.Body as Readable;
  const chunks: Buffer[] = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

/** Delete an object from S3. */
export async function deleteFromS3(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key })
  );
}

/** Build an S3 key for a document upload. */
export function buildS3Key(caseId: number, originalFilename: string): string {
  const timestamp = Date.now();
  const safeName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `documents/${caseId}/${timestamp}-${safeName}`;
}
