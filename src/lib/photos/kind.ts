export type ImageKind = "jpeg" | "png" | "webp" | "heic" | "unknown";

const HEIC_BRANDS = new Set(["heic", "heix", "hevc", "hevx", "heif", "mif1", "msf1"]);

export function detectImageKind(bytes: Uint8Array): ImageKind {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return "webp";
  }
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === "ftyp") {
    const brand = ascii(bytes, 8, 12).toLowerCase();
    if (HEIC_BRANDS.has(brand)) {
      return "heic";
    }
  }
  return "unknown";
}

export function imageContentType(bytes: Uint8Array) {
  const kind = detectImageKind(bytes);
  if (kind === "jpeg") {
    return "image/jpeg";
  }
  if (kind === "png") {
    return "image/png";
  }
  if (kind === "webp") {
    return "image/webp";
  }
  return null;
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}
