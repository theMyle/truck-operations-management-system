/**
 * Client-side PDF compression using Ghostscript compiled to WebAssembly.
 *
 * Compression runs in a **Web Worker** so the main thread (and UI) stays
 * fully responsive — even for 100 MB+ files.
 *
 * The WASM module (~16 MB) lives in /public/gs/ and is loaded on-demand
 * inside the worker the first time a user uploads a PDF.  After the initial
 * fetch the browser caches the binary.
 *
 * Hardcoded to the `ebook` preset (150 dpi) — best balance between
 * file-size savings and readable quality for POD documents.
 */

export interface PdfCompressionProgress {
  /** Status text to display in the UI while compressing. */
  message: string;
}

/**
 * Compress a single PDF `File` in the browser using Ghostscript WASM.
 *
 * Runs entirely in a Web Worker — the main thread never blocks.
 *
 * @param file          The original PDF `File` object.
 * @param onProgress    Optional callback for status updates (e.g. "Compressing PDF…").
 * @param preset        Ghostscript quality preset — hardcoded to `ebook` (150 dpi).
 * @returns             A new `File` containing the compressed PDF.
 *                      If the compressed version is *larger* than the original,
 *                      the original file is returned unchanged.
 */
export async function compressPdf(
  file: File,
  onProgress?: (status: PdfCompressionProgress) => void,
  preset: "screen" | "ebook" | "printer" = "ebook",
): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();

  onProgress?.({ message: "Starting compression engine…" });

  return new Promise<File>((resolve, reject) => {
    const worker = new Worker("/gs/pdf-worker.js");

    worker.onmessage = (e) => {
      const data = e.data;

      if (data.type === "status") {
        onProgress?.({ message: data.message });
        return;
      }

      if (data.type === "error") {
        worker.terminate();
        reject(new Error(data.message));
        return;
      }

      if (data.type === "result") {
        worker.terminate();

        const compressedBuffer = data.compressedBuffer as ArrayBuffer;

        // Safety net: if Ghostscript made the file bigger, return the original.
        if (compressedBuffer.byteLength >= file.size) {
          onProgress?.({ message: "Already optimised — using original." });
          resolve(file);
          return;
        }

        const savings = ((1 - compressedBuffer.byteLength / file.size) * 100).toFixed(0);
        onProgress?.({ message: `Compressed — ${savings}% smaller` });

        const outputName = file.name.replace(/\.pdf$/i, "_compressed.pdf");
        resolve(new File([compressedBuffer], outputName, { type: "application/pdf" }));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(new Error(err.message || "PDF compression worker failed"));
    };

    // Transfer the buffer to the worker (zero-copy)
    worker.postMessage({ arrayBuffer, preset }, [arrayBuffer]);
  });
}
