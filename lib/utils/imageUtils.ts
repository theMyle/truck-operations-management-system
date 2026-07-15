import { jsPDF } from "jspdf";

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

/**
 * Merges multiple image Files into a single multi-page PDF document.
 * Each image is resized/compressed beforehand to keep file size low.
 */
export async function mergeImagesToPdf(
  files: File[],
  maxDimension = 1920,
  quality = 0.8,
): Promise<File> {
  const imgDataList: { dataUrl: string; width: number; height: number }[] = [];

  for (const file of files) {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const imgObj = new Image();
      const url = URL.createObjectURL(file);
      imgObj.onload = () => {
        URL.revokeObjectURL(url);
        resolve(imgObj);
      };
      imgObj.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Failed to load image: ${file.name}`));
      };
      imgObj.src = url;
    });

    let { width, height } = img;
    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    imgDataList.push({ dataUrl, width, height });
  }

  if (imgDataList.length === 0) {
    throw new Error("No images to merge");
  }

  // Use standard A4 page format with orientation matching the first image
  const first = imgDataList[0];
  const doc = new jsPDF({
    orientation: first.height > first.width ? "p" : "l",
    unit: "pt",
    format: "a4",
  });

  let isFirst = true;
  for (const img of imgDataList) {
    const orientation = img.height > img.width ? "p" : "l";
    if (isFirst) {
      isFirst = false;
    } else {
      doc.addPage("a4", orientation);
    }

    // Get dimensions of the current A4 page
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Scale image to fit the A4 page while maintaining aspect ratio
    const ratio = Math.min(pageWidth / img.width, pageHeight / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;

    // Center it on the page
    const x = (pageWidth - w) / 2;
    const y = (pageHeight - h) / 2;

    doc.addImage(img.dataUrl, "JPEG", x, y, w, h);
  }

  const pdfBlob = doc.output("blob");
  const mergedName = files[0].name.replace(/\.[^.]+$/, "") + "_merged.pdf";
  return new File([pdfBlob], mergedName, { type: "application/pdf" });
}