import { useState, useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { IconZip, IconX } from "@tabler/icons-react";
import React from "react";

const POD_ZIP_API = "/api/billing/pods/zip";

export interface PodRecord {
  id: string;           // UUID — matches booking.id
  bookingDr: string;
  podFileUrl?: string | null;
}

export interface DownloadOptions {
  client?: string;
  from?: string;
  to?: string;
}

export interface UsePodDownloadReturn {
  downloadPODs: (records: PodRecord[], opts?: DownloadOptions) => Promise<void>;
  downloading: boolean;
  progress: number;     // always 0 in server mode — kept so BillingModule compiles unchanged
}

export function usePodDownload(): UsePodDownloadReturn {
  const [downloading, setDownloading] = useState(false);

  const downloadPODs = useCallback(
    async (records: PodRecord[], opts: DownloadOptions = {}) => {
      // Only pass records that actually have a POD
      const podRecords = records.filter((r) => r.podFileUrl);

      if (!podRecords.length) {
        notifications.show({
          title: "No PODs available",
          message: "None of the selected records have a POD on file.",
          color: "orange",
        });
        return;
      }

      const zipName = buildZipName(opts);
      setDownloading(true);

      try {
        const response = await fetch(POD_ZIP_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingIds: podRecords.map((r) => r.id),
            zipName,
          }),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "No details");
          throw new Error(`Server returned ${response.status}: ${text}`);
        }

        const blob = await response.blob();
        triggerDownload(blob, zipName);

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
      }
    },
    [],
  );

  return { downloadPODs, downloading, progress: 0 };
}

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
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}