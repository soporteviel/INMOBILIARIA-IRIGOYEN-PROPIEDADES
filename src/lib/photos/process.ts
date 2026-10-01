import "server-only";

import sharp from "sharp";
import { detectImageKind } from "@/lib/photos/kind";
import { MAX_INPUT_EDGE, MAX_OUTPUT_EDGE, MAX_UPLOAD_BYTES, SHARP_CONCURRENCY } from "@/lib/photos/limits";

export type ProcessedPhoto = {
  bytes: Buffer;
  width: number;
  height: number;
  byteSize: number;
};

export function photoProcessError(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    return "La foto supera los 15 MB.";
  }
  const kind = detectImageKind(bytes);
  if (kind === "heic") {
    return "HEIC no está soportado. Usá JPEG, PNG o WebP.";
  }
  if (kind === "unknown") {
    return "El archivo no es un JPEG, PNG o WebP válido.";
  }
  return null;
}

let sharpActive = 0;
const sharpWaiters: Array<() => void> = [];

function acquireSharp() {
  if (sharpActive < SHARP_CONCURRENCY) {
    sharpActive += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    sharpWaiters.push(resolve);
  });
}

function releaseSharp() {
  const next = sharpWaiters.shift();
  if (next) {
    next();
    return;
  }
  sharpActive -= 1;
}

export async function processPhoto(bytes: Buffer): Promise<ProcessedPhoto> {
  await acquireSharp();
  try {
    return await processPhotoNow(bytes);
  } finally {
    releaseSharp();
  }
}

async function processPhotoNow(bytes: Buffer): Promise<ProcessedPhoto> {
  const rejected = photoProcessError(bytes);
  if (rejected) {
    throw new Error(rejected);
  }

  const source = sharp(bytes, {
    failOn: "error",
    limitInputPixels: MAX_INPUT_EDGE * MAX_INPUT_EDGE,
    sequentialRead: true,
  }).rotate();

  const meta = await source.clone().metadata();
  if (meta.format !== "jpeg" && meta.format !== "png" && meta.format !== "webp") {
    throw new Error(
      meta.format === "heif"
        ? "HEIC no está soportado. Usá JPEG, PNG o WebP."
        : "El archivo no es un JPEG, PNG o WebP válido.",
    );
  }
  if (!meta.width || !meta.height) {
    throw new Error("No se pudieron leer las dimensiones de la foto.");
  }
  if (meta.width > MAX_INPUT_EDGE || meta.height > MAX_INPUT_EDGE) {
    throw new Error("La foto supera los 8000 px de lado.");
  }

  const output = source.clone().resize({
    width: MAX_OUTPUT_EDGE,
    height: MAX_OUTPUT_EDGE,
    fit: "inside",
    withoutEnlargement: true,
  }).webp({ quality: 82 });

  const optimized = await output.toBuffer({ resolveWithObject: true });
  return {
    bytes: optimized.data,
    width: optimized.info.width,
    height: optimized.info.height,
    byteSize: optimized.data.byteLength,
  };
}
