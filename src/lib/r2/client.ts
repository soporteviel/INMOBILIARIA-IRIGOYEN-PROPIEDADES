import "server-only";

import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { UPLOAD_URL_SECONDS, VIEW_URL_SECONDS, type AcceptedPhotoType } from "@/lib/photos/limits";

const ENV_NAMES = ["R2_BUCKET_NAME", "R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"] as const;

type R2Config = {
  bucket: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export function missingR2Env() {
  return ENV_NAMES.filter((name) => !process.env[name]?.trim());
}

function readConfig(): R2Config | null {
  const missing = missingR2Env();
  if (missing.length > 0) {
    return null;
  }
  return {
    bucket: process.env.R2_BUCKET_NAME!.trim(),
    endpoint: process.env.R2_ENDPOINT!.trim(),
    accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
  };
}

let client: S3Client | null = null;

function r2Client(config: R2Config) {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }
  return client;
}

export function sourceObjectKey(propertyId: string, photoId: string) {
  return `properties/${propertyId}/${photoId}/source`;
}

export function finalObjectKey(propertyId: string, photoId: string) {
  return `properties/${propertyId}/${photoId}.webp`;
}

export function r2ConfigError() {
  const missing = missingR2Env();
  if (missing.length === 0) {
    return null;
  }
  return `Falta configurar ${missing.join(", ")} en el servidor.`;
}

export async function signPhotoUpload(key: string, contentType: AcceptedPhotoType, byteSize: number) {
  const config = readConfig();
  if (!config) {
    throw new Error(r2ConfigError() ?? "Falta configurar R2.");
  }
  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: byteSize,
  });
  return getSignedUrl(r2Client(config), command, { expiresIn: UPLOAD_URL_SECONDS });
}

export async function signPhotoView(key: string) {
  const config = readConfig();
  if (!config) {
    throw new Error(r2ConfigError() ?? "Falta configurar R2.");
  }
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });
  return getSignedUrl(r2Client(config), command, { expiresIn: VIEW_URL_SECONDS });
}

export async function readObject(key: string) {
  const config = readConfig();
  if (!config) {
    throw new Error(r2ConfigError() ?? "Falta configurar R2.");
  }
  const response = await r2Client(config).send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }),
  );
  if (!response.Body) {
    throw new Error("El archivo subido está vacío.");
  }
  const bytes = Buffer.from(await response.Body.transformToByteArray());
  if (bytes.byteLength === 0) {
    throw new Error("El archivo subido está vacío.");
  }
  return { bytes, contentLength: response.ContentLength ?? bytes.byteLength };
}

export async function writeObject(key: string, bytes: Buffer, contentType: string) {
  const config = readConfig();
  if (!config) {
    throw new Error(r2ConfigError() ?? "Falta configurar R2.");
  }
  await r2Client(config).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: bytes,
      ContentType: contentType,
      CacheControl: "private, max-age=31536000",
    }),
  );
}

export async function deleteObject(key: string) {
  const config = readConfig();
  if (!config) {
    throw new Error(r2ConfigError() ?? "Falta configurar R2.");
  }
  try {
    await r2Client(config).send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "NotFound" || name === "NoSuchKey") {
      return;
    }
    throw error;
  }
}

/**
 * CORS exacto del bucket noelia-irigoyen-assets.
 * No usar comodines de origen. No hace público el bucket.
 *
 * AllowedOrigins:
 *   http://localhost:3000
 *   https://inmobiliaria-irigoyen-propiedades.vercel.app
 * AllowedMethods: GET, PUT, HEAD
 * AllowedHeaders: content-type, content-length
 * ExposeHeaders: ETag
 * MaxAgeSeconds: 3600
 */
export const R2_CORS_ORIGINS = [
  "http://localhost:3000",
  "https://inmobiliaria-irigoyen-propiedades.vercel.app",
] as const;
