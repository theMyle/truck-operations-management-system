"use client";

import { adjustTimeByHours, adjustDateByDays } from "@/lib/utils/dateTime";
export { adjustDateByDays } from "@/lib/utils/dateTime";

import { useCallback } from "react";
import { DispatchRecord } from "@/types/dispatch";
import { ExportColumn } from "./useTableExport";
import { toTitleCase } from "@/lib/utils/stringFormat";

// (adjustDateByDays centralized in @/lib/utils/dateTime)

export function getDepartureInGarageTime(
  timeStr: string | null | undefined,
  dateStr?: string | null | undefined
): string {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.trim() || timeStr === "—") {
    return "—";
  }

  const adjusted = adjustTimeByHours(timeStr, -2);
  if (!adjusted) return timeStr;

  if (adjusted.isPreviousDay && dateStr && dateStr.trim() && dateStr !== "—") {
    const departureDate = adjustDateByDays(dateStr, -1);
    return `${adjusted.timeFormatted}\n${departureDate}`;
  }

  return adjusted.timeFormatted;
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
                  text = getDepartureInGarageTime(String(val ?? ""), r.pickUpDate || r.date);
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
