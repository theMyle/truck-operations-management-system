// hooks/useDispatchExport.ts
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

function getRows(records: DispatchRecord[]) {
  return records.map((r) =>
    COLUMNS.map((col) => String(r[col.key as keyof DispatchRecord] ?? "—"))
  );
}

export function useDispatchExport(records: DispatchRecord[]) {
  /* ── PDF ── */
  const exportToPdf = useCallback(async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Booking Records", 14, 14);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);

    autoTable(doc, {
      head: [COLUMNS.map((c) => c.label)],
      body: getRows(records),
      startY: 24,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 7,
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`dispatch-records-${Date.now()}.pdf`);
  }, [records]);

  /* ── XLSX ── */
  const exportToXlsx = useCallback(async () => {
    const XLSX = await import("xlsx");

    const ws = XLSX.utils.aoa_to_sheet([
      COLUMNS.map((c) => c.label),
      ...getRows(records),
    ]);

    // Column widths
    ws["!cols"] = COLUMNS.map(() => ({ wch: 18 }));

    // Bold header row
    COLUMNS.forEach((_, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      if (ws[cellRef]) {
        ws[cellRef].s = { font: { bold: true } };
      }
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dispatch Records");
    XLSX.writeFile(wb, `dispatch-records-${Date.now()}.xlsx`);
  }, [records]);

  /* ── DOCX ── */
  const exportToDocx = useCallback(async () => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, HeadingLevel } =
      await import("docx");

    const headerCells = COLUMNS.map(
      (col) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: col.label, bold: true, size: 16 })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          shading: { fill: "2563EB" },
        })
    );

    const dataRows = records.map(
      (record) =>
        new TableRow({
          children: COLUMNS.map(
            (col) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: String(record[col.key as keyof DispatchRecord] ?? "—"),
                        size: 16,
                      }),
                    ],
                  }),
                ],
              })
          ),
        })
    );

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "Dispatch Records",
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated: ${new Date().toLocaleString()}`,
                  size: 16,
                  color: "888888",
                }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Table({
              rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows],
              width: { size: 100, type: WidthType.PERCENTAGE },
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dispatch-records-${Date.now()}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [records]);

  /* ── JPG ── */
  const exportToJpg = useCallback(async () => {
    const { default: html2canvas } = await import("html2canvas");

    // Build a temporary off-screen table
    const container = document.createElement("div");
    container.style.cssText =
      "position:fixed;left:-9999px;top:0;background:#fff;padding:16px;font-family:sans-serif;";

    const title = document.createElement("h2");
    title.textContent = "Dispatch Records";
    title.style.cssText = "font-size:14px;margin:0 0 4px;color:#1e3a8a;";
    container.appendChild(title);

    const sub = document.createElement("p");
    sub.textContent = `Generated: ${new Date().toLocaleString()}`;
    sub.style.cssText = "font-size:10px;color:#888;margin:0 0 12px;";
    container.appendChild(sub);

    const table = document.createElement("table");
    table.style.cssText =
      "border-collapse:collapse;width:100%;font-size:10px;";

    // Header
    const thead = document.createElement("thead");
    const hrow = document.createElement("tr");
    COLUMNS.forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col.label;
      th.style.cssText =
        "background:#2563eb;color:#fff;padding:6px 10px;text-align:left;font-weight:700;white-space:nowrap;";
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    records.forEach((record, i) => {
      const tr = document.createElement("tr");
      tr.style.background = i % 2 === 0 ? "#fff" : "#f5f7fa";
      COLUMNS.forEach((col) => {
        const td = document.createElement("td");
        td.textContent = String(record[col.key as keyof DispatchRecord] ?? "—");
        td.style.cssText =
          "padding:5px 10px;border-bottom:1px solid #e5e7eb;white-space:nowrap;";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
    document.body.appendChild(container);

    const canvas = await html2canvas(container, { scale: 2, backgroundColor: "#fff" });
    document.body.removeChild(container);

    const link = document.createElement("a");
    link.download = `dispatch-records-${Date.now()}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  }, [records]);

  /* ── Main handler ── */
  const handleExport = useCallback(
    async (format: string | null) => {
      if (!format) return;
      const map: Record<string, () => Promise<void>> = {
        pdf: exportToPdf,
        xlsx: exportToXlsx,
        docx: exportToDocx,
        jpg: exportToJpg,
      };
      await map[format]?.();
    },
    [exportToPdf, exportToXlsx, exportToDocx, exportToJpg]
  );

  return { handleExport };
}