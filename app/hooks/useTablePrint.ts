"use client";

import { useCallback } from "react";
import { DispatchRecord } from "@/app/(app)/constant";
import { ExportColumn } from "./useTableExport";
import { toTitleCase } from "@/lib/utils/stringFormat";

export function getDepartureInGarageTime(timeStr: string | null | undefined): string {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.trim() || timeStr === "—") {
    return "—";
  }

  const str = timeStr.trim();

  // 1. Parse 12-hour format with AM/PM (e.g. "8:00 AM", "08:30 PM", "12:00 PM")
  const match12 = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();

    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    let newHours = (hours - 2 + 24) % 24;
    const newPeriod = newHours >= 12 ? "PM" : "AM";
    let displayHours = newHours % 12;
    if (displayHours === 0) displayHours = 12;

    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${formattedMinutes} ${newPeriod}`;
  }

  // 2. Parse 24-hour or HH:MM format (e.g. "08:00", "14:30")
  const match24 = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24) {
    let hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);

    let newHours = (hours - 2 + 24) % 24;
    const newPeriod = newHours >= 12 ? "PM" : "AM";
    let displayHours = newHours % 12;
    if (displayHours === 0) displayHours = 12;

    const formattedMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${formattedMinutes} ${newPeriod}`;
  }

  return str;
}

export function useTablePrint(
  records: DispatchRecord[],
  columns: ExportColumn[],
  title: string
) {
  const handlePrint = useCallback(() => {
    const rows = records
      .map(
        (r) => `
          <tr>
            ${columns
              .map((col) => {
                const val = r[col.key as keyof DispatchRecord];
                let text = col.key === "bookedBy" ? toTitleCase(String(val ?? "")) : String(val ?? "—");
                if (col.key === "pickUpTime") {
                  text = getDepartureInGarageTime(String(val ?? ""));
                }
                return `<td>${text}</td>`;
              })
              .join("")}
          </tr>`,
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 15px; color: #1e3a8a; margin-bottom: 2px; }
            p  { font-size: 9px; color: #888; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; }
            th {
              padding: 6px 10px;
              text-align: left;
              font-size: 9px;
              font-weight: 700;
              color: #fff;
              background: #2563eb;
              white-space: nowrap;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            td {
              padding: 5px 10px;
              font-size: 10px;
              border-bottom: 1px solid #e5e7eb;
              white-space: pre-wrap;
            }
            tr:nth-child(even) td { background: #f8fafc; }
            @page { margin: 12mm; size: landscape; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Printed: ${new Date().toLocaleString()} · ${records.length} record${records.length !== 1 ? "s" : ""}</p>
          <table>
            <thead>
              <tr>${columns.map((col) => `<th>${col.key === "pickUpTime" ? "Departure in Garage" : col.label}</th>`).join("")}</tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>`;

    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.onload = () => {
      win.print();
      win.close();
    };
  }, [records, columns, title]);

  return { handlePrint };
}
