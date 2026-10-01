export const MAX_PROPERTY_PHOTOS = 20;
export const PHOTO_UPLOAD_CONCURRENCY = 3;
export const SHARP_CONCURRENCY = 2;
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const MAX_INPUT_EDGE = 8000;
export const MAX_OUTPUT_EDGE = 2048;
export const PENDING_PHOTO_TTL_MS = 60 * 60 * 1000;
export const UPLOAD_URL_SECONDS = 120;
export const VIEW_URL_SECONDS = 10 * 60;

export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type AcceptedPhotoType = (typeof ACCEPTED_PHOTO_TYPES)[number];

export function isAcceptedPhotoType(value: string): value is AcceptedPhotoType {
  return ACCEPTED_PHOTO_TYPES.includes(value as AcceptedPhotoType);
}

export function unsupportedPhotoMessage(filename: string) {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) {
    return "HEIC no está soportado. Usá JPEG, PNG o WebP.";
  }
  return "Solo se aceptan JPEG, PNG y WebP.";
}
