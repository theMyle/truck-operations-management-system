/**
 * Compresses an image File using the Canvas API.
 * - Resizes if width or height exceeds `maxDimension`
 * - Re-encodes to JPEG at `quality` (0–1)
 * - Always returns a new File, so even same-size images get compressed
 *
 * Good defaults for POD photos:
 *   maxDimension = 1920 → retains readable text/details on phone shots
 *   quality = 0.80 → ~80–90% size reduction on typical phone photos
 */
export async function compressImage(
  file: File,
  maxDimension = 1920,
  quality = 0.8,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(blobUrl);

      let { width, height } = img;

      // Downscale only — never upscale
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas toBlob failed"));
            return;
          }
          // Always output as .jpg regardless of original extension
          const outputName = file.name.replace(/\.[^.]+$/, ".jpg");
          resolve(new File([blob], outputName, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = blobUrl;
  });
}