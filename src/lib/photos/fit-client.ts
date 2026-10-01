const MAX_EDGE = 2048;

export type FittedPhoto = {
  file: File;
  width: number;
  height: number;
};

export async function fitPhotoFile(file: File): Promise<FittedPhoto> {
  if (file.size < 800_000) {
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) {
      return { file, width: 0, height: 0 };
    }
    const width = bitmap.width;
    const height = bitmap.height;
    bitmap.close();
    if (Math.max(width, height) <= MAX_EDGE) {
      return { file, width, height };
    }
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return { file, width, height };
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) {
    return { file, width, height };
  }
  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return { file: new File([blob], name, { type: "image/webp" }), width, height };
}
