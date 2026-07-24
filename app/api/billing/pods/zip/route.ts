export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { booking } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

const MAX_RETRIES = 3;
const FETCH_TIMEOUT_MS = 15_000; // 15 seconds per image
const BATCH_SIZE = 5; // fetch 5 images concurrently at a time

/** Fetch with timeout and retries */
async function fetchWithRetry(
  url: string,
  retries = MAX_RETRIES,
): Promise<ArrayBuffer | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!res.ok) {
        console.warn(
          `[POD ZIP] Attempt ${attempt}/${retries} failed for ${url} — ${res.status}`,
        );
        if (attempt === retries) return null;
        // Wait before retrying (exponential backoff: 500ms, 1s, 2s)
        await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
        continue;
      }

      return await res.arrayBuffer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[POD ZIP] Attempt ${attempt}/${retries} error for ${url} — ${msg}`,
      );
      if (attempt === retries) return null;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { bookingIds, zipName } = (await req.json()) as {
      bookingIds: string[];
      zipName: string;
    };

    if (!bookingIds?.length) {
      return NextResponse.json(
        { error: "No booking IDs provided" },
        { status: 400 },
      );
    }

    // Pull only what we need — id, DR number, PODLink
    const rows = await db
      .select({
        id: booking.id,
        bookingDRNo: booking.bookingDRNo,
        PODLink: booking.PODLink,
      })
      .from(booking)
      .where(inArray(booking.id, bookingIds));

    const withPod = rows.filter((r) => r.PODLink);

    if (!withPod.length) {
      return NextResponse.json(
        { error: "No PODs found for selected records" },
        { status: 404 },
      );
    }

    const { default: JSZip } = await import("jszip");
    const zip = new JSZip();
    const folder = zip.folder("PODs")!;
    let successCount = 0;
    let failCount = 0;
    const seenFilenames = new Map<string, number>();

    // Process in batches to avoid overwhelming the storage service
    for (let i = 0; i < withPod.length; i += BATCH_SIZE) {
      const batch = withPod.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (row) => {
          const url = row.PODLink!;
          const buffer = await fetchWithRetry(url);

          if (!buffer) {
            failCount++;
            console.warn(`[POD ZIP] Gave up on ${row.bookingDRNo} (${url})`);
            return;
          }

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
        }),
      );
    }

    if (successCount === 0) {
      return NextResponse.json(
        {
          error: `All ${withPod.length} POD downloads failed. The storage service may be temporarily unavailable.`,
        },
        { status: 502 },
      );
    }

    const zipBuffer = await zip.generateAsync({
      type: "arraybuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
        "X-Pod-Success": String(successCount),
        "X-Pod-Failed": String(failCount),
        "X-Pod-Total": String(withPod.length),
      },
    });
  } catch (err) {
    console.error("[POD ZIP route]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

