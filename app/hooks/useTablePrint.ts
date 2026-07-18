"use client";

import { useCallback } from "react";
import { DispatchRecord } from "@/app/(app)/constant";
import { ExportColumn } from "./useTableExport";

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
              .map(
                (col) =>
                  `<td>${String(r[col.key as keyof DispatchRecord] ?? "—")}</td>`,
              )
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
              <tr>${columns.map((col) => `<th>${col.label}</th>`).join("")}</tr>
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
