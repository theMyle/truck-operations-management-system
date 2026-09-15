import { useState, useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { IconZip, IconX } from "@tabler/icons-react";
import React from "react";
import JSZip from "jszip";

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
  progress: number;
}

const BATCH_SIZE = 5;

export function usePodDownload(): UsePodDownloadReturn {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

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
      setProgress(0);

      try {
        const zip = new JSZip();
        const folder = zip.folder("PODs")!;
        let successCount = 0;
        let failCount = 0;
        const total = podRecords.length;
        const seenFilenames = new Map<string, number>();

        // Process in batches to avoid overwhelming browser/CDN
        for (let i = 0; i < total; i += BATCH_SIZE) {
          const batch = podRecords.slice(i, i + BATCH_SIZE);

          await Promise.all(
            batch.map(async (row) => {
              const url = row.podFileUrl!;
              try {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Fetch status ${res.status}`);

                const buffer = await res.arrayBuffer();

                const urlDecoded = decodeURIComponent(url);
                const urlParts = urlDecoded.split("/");
                const lastPart = urlParts[urlParts.length - 1] || "pod.jpg";
                const cleanFilename = lastPart.split("?")[0] || "pod.jpg";

                const dotIndex = cleanFilename.lastIndexOf(".");
                let baseName = dotIndex !== -1 ? cleanFilename.substring(0, dotIndex) : cleanFilename;
                const ext = dotIndex !== -1 ? cleanFilename.substring(dotIndex + 1) : "jpg";

                // Sanitize filename for ZIP compatibility
                baseName = baseName.trim().replace(/[\\/:*?"<>|]/g, "_");
                const standardFilename = `${baseName}.${ext}`;

                let count = seenFilenames.get(standardFilename) || 0;
                let filename = standardFilename;

                if (count > 0) {
                  filename = `${baseName}_${count}.${ext}`;
                }

                seenFilenames.set(standardFilename, count + 1);
                folder.file(filename, buffer);
                successCount++;
              } catch (err) {
                failCount++;
                console.warn(`[usePodDownload] Failed for URL ${url} —`, err);
              } finally {
                // Update progress percentage
                setProgress(() => {
                  const nextCompleted = successCount + failCount;
                  return Math.round((nextCompleted / total) * 100);
                });
              }
            })
          );
        }

        if (successCount === 0) {
          throw new Error("All POD downloads failed. The storage service may be temporarily unavailable.");
        }

        // Generate Zip on client side
        const blob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        triggerDownload(blob, zipName);

        if (failCount > 0) {
          notifications.show({
            title: "Download complete (with issues)",
            message: `${successCount} of ${total} POD(s) saved. ${failCount} failed to download from storage.`,
            color: "yellow",
            icon: React.createElement(IconZip, { size: 16 }),
            autoClose: 8000,
          });
        } else {
          notifications.show({
            title: "Download ready",
            message: `${successCount} POD(s) saved as ${zipName}`,
            color: "green",
            icon: React.createElement(IconZip, { size: 16 }),
          });
        }
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

  return { downloadPODs, downloading, progress };
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