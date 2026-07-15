/**
 * Web Worker for PDF compression via Ghostscript WASM.
 *
 * Runs off the main thread so the UI stays responsive even for large files.
 * Communicates via postMessage: receives an ArrayBuffer, returns a compressed one.
 */

/* global importScripts, globalThis */

// Ghostscript WASM loader shims
globalThis.exports = {};
importScripts("/gs/gs.js");

const createModuleFromExports = globalThis.exports.Module;
delete globalThis.exports;

let gsFactory = null;

function getFactory() {
  if (!gsFactory) {
    gsFactory = function () {
      return (createModuleFromExports || createModule).apply(undefined, arguments);
    };
  }
  return gsFactory;
}

self.onmessage = async function (e) {
  const { arrayBuffer, preset } = e.data;

  try {
    self.postMessage({ type: "status", message: "Loading compression engine…" });

    const initGhostscript = getFactory();
    const gs = await initGhostscript({
      locateFile: (f) => `/gs/${f}`,
    });

    self.postMessage({ type: "status", message: "Compressing PDF…" });

    const bytes = new Uint8Array(arrayBuffer);
    gs.FS.writeFile("/input.pdf", bytes);

    gs.callMain([
      "-sDEVICE=pdfwrite",
      "-dCompatibilityLevel=1.4",
      `-dPDFSETTINGS=/${preset}`,
      "-dNOPAUSE",
      "-dQUIET",
      "-dBATCH",
      "-sOutputFile=/output.pdf",
      "/input.pdf",
    ]);

    const out = gs.FS.readFile("/output.pdf");

    // Copy into a transferable ArrayBuffer
    const result = new Uint8Array(out).buffer;

    self.postMessage(
      { type: "result", compressedBuffer: result, originalSize: bytes.length },
      [result] // Transfer, not copy — near-instant
    );
  } catch (err) {
    self.postMessage({ type: "error", message: String(err?.message || err) });
  }
};
