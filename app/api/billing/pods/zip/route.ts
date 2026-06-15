import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { booking } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import JSZip from "jszip";

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

    const zip = new JSZip();
    const folder = zip.folder("PODs")!;

    // Fetch all images concurrently — skip failures, don't abort the whole zip
    await Promise.allSettled(
      withPod.map(async (row) => {
        const url = row.PODLink!;
        const res = await fetch(url);

        if (!res.ok) {
          console.warn(`[POD ZIP] Failed to fetch ${url} — ${res.status}`);
          return;
        }

        const buffer = await res.arrayBuffer();
        const ext = url.split(".").pop()?.split("?")[0] ?? "jpg"; // strip query params if any
        const filename = `${row.bookingDRNo}.${ext}`;
        folder.file(filename, buffer);
      }),
    );

    const zipBuffer = await zip.generateAsync({
      type: "arraybuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipName}"`,
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
