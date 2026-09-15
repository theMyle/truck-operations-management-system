"use client";

import { useCallback } from "react";
import { DispatchRecord } from "@/app/(app)/constant";

const COLUMNS = [
  { key: "id", label: "#" },
  { key: "tripRate", label: "Trip Rate" },
  { key: "date", label: "Date" },
  { key: "status", label: "Status" },
  { key: "client", label: "Client" },
  { key: "driver", label: "Driver" },
  { key: "helper", label: "Helper" },
  { key: "unit", label: "Unit" },
  { key: "plateNo", label: "Plate #" },
  { key: "ruta", label: "Route" },
  { key: "bookingDr", label: "Booking / DR#" },
  { key: "bookedBy", label: "Booked By" },
] as const;

export function useDispatchPrint(records: DispatchRecord[]) {
  const handlePrint = useCallback(() => {
    const rows = records
      .map(
        (r) => `
          <tr>
            ${COLUMNS.map(
              (col) =>
                `<td>${String(r[col.key as keyof DispatchRecord] ?? "—")}</td>`,
            ).join("")}
          </tr>`,
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dispatch Records</title>
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
              white-space: nowrap;
            }
            tr:nth-child(even) td { background: #f8fafc; }
            @page { margin: 12mm; size: landscape; }
          </style>
        </head>
        <body>
          <h1>Booking Records</h1>
          <p>Printed: ${new Date().toLocaleString()} · ${records.length} record${records.length !== 1 ? "s" : ""}</p>
          <table>
            <thead>
              <tr>${COLUMNS.map((col) => `<th>${col.label}</th>`).join("")}</tr>
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
  }, [records]);

  return { handlePrint };
}
