/**
 * usePodDownload.ts
 *
 * Dual-mode POD downloader:
 *   - PROTOTYPE  → client-side JSZip (fetches POD images from public URLs, zips in-browser)
 *   - PRODUCTION → server-side endpoint (streams a zip from the server; drop-in swap)
 *
 * Usage:
 *   const { downloadPODs, downloading, progress } = usePodDownload();
 *   await downloadPODs(filteredRecords, { client: "Lazada", from: "2025-05-01", to: "2025-05-31" });
 *
 * Toggle behaviour by setting USE_SERVER_SIDE = true once your API route is ready.
 */

import { useState, useCallback } from "react";
import JSZip from "jszip";
import { notifications } from "@mantine/notifications";
import { IconZip, IconX } from "@tabler/icons-react";
import React from "react";

// ─── Config ──────────────────────────────────────────────────────────────────

/**
 * Flip to `true` when your /api/billing/pods/zip endpoint is deployed.
 * Everything else in this hook stays the same.
 */
const USE_SERVER_SIDE = false;

/**
 * Base URL where individual POD files are publicly accessible.
 * e.g. /uploads/pods/pod_LZD00421.jpg  →  { POD_BASE_URL }/pod_LZD00421.jpg
 *
 * In production this is typically your Next.js /public/uploads/pods/ folder
 * or a cloud storage bucket URL.
 */
const POD_BASE_URL = "/uploads/pods";

/** Server-side zip endpoint (see /api/billing/pods/zip route below). */
const POD_ZIP_API = "/api/billing/pods/zip";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Minimal shape the hook needs — only the three fields it actually reads.
 * Your BillingRecord / DispatchRecord just needs to satisfy this interface;
 * extra fields are ignored.
 */
export interface PodRecord {
  id: number;
  bookingDr: string;
  podFile?: string | null;
  podFileUrl?: string | null;
}

export interface DownloadOptions {
  /** Used to build the zip filename: PODs_Lazada_2025-05-01_2025-05-31.zip */
  client?: string;
  from?: string;
  to?: string;
}

export interface UsePodDownloadReturn {
  downloadPODs: (records: PodRecord[], opts?: DownloadOptions) => Promise<void>;
  downloading: boolean;
  /** 0–100 progress percentage (client-side mode only; server-side is indeterminate) */
  progress: number;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePodDownload(): UsePodDownloadReturn {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const downloadPODs = useCallback(
    async (records: PodRecord[], opts: DownloadOptions = {}) => {
      const podRecords = records.filter((r) => r.podFile);

      if (!podRecords.length) {
        notifications.show({
          title: "No PODs available",
          message: "None of the selected records have a receipt / POD on file.",
          color: "orange",
        });
        return;
      }

      const zipName = buildZipName(opts);
      setDownloading(true);
      setProgress(0);

      try {
        if (USE_SERVER_SIDE) {
          await downloadServerSide(podRecords, zipName);
        } else {
          await downloadClientSide(podRecords, zipName, setProgress);
        }

        notifications.show({
          title: "Download ready",
          message: `${podRecords.length} POD(s) saved as ${zipName}`,
          color: "green",
          icon: React.createElement(IconZip, { size: 16 }),
        });
      } catch (err) {
        console.error("[usePodDownload]", err);
        notifications.show({
          title: "Download failed",
          message: err instanceof Error ? err.message : "Unknown error",
          color: "red",
          icon: React.createElement(IconX, { size: 16 }),
        });
      } finally {
        setDownloading(false);
        setProgress(0);
      }
    },
    [],
  );

  return { downloadPODs, downloading, progress };
}

// ─── Client-side (JSZip prototype) ───────────────────────────────────────────

async function downloadClientSide(
  records: PodRecord[],
  zipName: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder("PODs")!;

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const filename = record.podFile!;
    const url = record.podFileUrl || `${POD_BASE_URL}/${filename}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(
        `[POD] Could not fetch ${url} — skipping (${response.status})`,
      );
      continue;
    }

    const blob = await response.blob();
    // Prefix with booking number for easy sorting inside the zip
    const zipFilename = `${record.bookingDr}_${filename}`;
    folder.file(zipFilename, blob);

    onProgress(Math.round(((i + 1) / records.length) * 90));
  }

  const zipBlob = await zip.generateAsync(
    { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
    (meta) => onProgress(90 + Math.round(meta.percent * 0.1)),
  );

  triggerDownload(zipBlob, zipName);
}

// ─── Server-side (production) ─────────────────────────────────────────────────

async function downloadServerSide(
  records: PodRecord[],
  zipName: string,
): Promise<void> {
  const bookingIds = records.map((r) => r.id);

  const response = await fetch(POD_ZIP_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookingIds, zipName }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "No details");
    throw new Error(`Server returned ${response.status}: ${errorText}`);
  }

  const blob = await response.blob();
  triggerDownload(blob, zipName);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildZipName(opts: DownloadOptions): string {
  const parts = ["PODs"];
  if (opts.client) parts.push(opts.client.replace(/\s+/g, "_"));
  if (opts.from) parts.push(opts.from);
  if (opts.to && opts.to !== opts.from) parts.push(opts.to);
  return parts.join("_") + ".zip";
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so the browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
