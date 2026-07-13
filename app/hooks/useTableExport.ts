// hooks/useTableExport.ts
"use client";

import { useCallback } from "react";
import { DispatchRecord } from "@/app/(app)/constant";

export interface ExportColumn {
  key: string;
  label: string;
}

function getRows(records: DispatchRecord[], columns: ExportColumn[]) {
  return records.map((r) =>
    columns.map((col) => String(r[col.key as keyof DispatchRecord] ?? "—"))
  );
}

export function useTableExport(
  records: DispatchRecord[],
  columns: ExportColumn[],
  title: string
) {
  /* ── PDF ── */
  const exportToPdf = useCallback(async () => {
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 14);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);

    autoTable(doc, {
      head: [columns.map((c) => c.label)],
      body: getRows(records, columns),
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

    const filename = title.toLowerCase().replace(/\s+/g, "-");
    doc.save(`${filename}-${Date.now()}.pdf`);
  }, [records, columns, title]);

  /* ── XLSX ── */
  const exportToXlsx = useCallback(async () => {
    const XLSX = await import("xlsx-js-style");

    const exportRows = getRows(records, columns);
    const headers = columns.map((c) => c.label);

    // ── Build worksheet from array of arrays so we can insert metadata rows ──
    const metaData: (string | number)[][] = [
      [title.toUpperCase()],
      ["Generated:", new Date().toLocaleString()],
      ["Total Records:", records.length],
      [], // blank separator
      headers, // column header row
    ];

    const allRows = [...metaData, ...exportRows];

    const ws = XLSX.utils.aoa_to_sheet(allRows);

    // ── Column widths ──
    ws["!cols"] = columns.map((col, colIdx) => {
      const maxLen = Math.max(
        col.label.length,
        ...exportRows.map((r) => String(r[colIdx] ?? "").length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
    });

    // ── Style the title row (row 0, col 0) as large bold ──
    const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
    if (!ws[titleRef]) ws[titleRef] = { v: title.toUpperCase(), t: "s" };
    ws[titleRef].s = {
      font: { bold: true, sz: 14, color: { rgb: "1a56db" } },
    };

    // ── Style the column header row (row index = metaData.length - 1) ──
    const headerRowIdx = metaData.length - 1;
    headers.forEach((_, colIdx) => {
      const ref = XLSX.utils.encode_cell({ r: headerRowIdx, c: colIdx });
      if (!ws[ref]) return;
      ws[ref].s = {
        font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1a56db" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          bottom: { style: "thin", color: { rgb: "CCCCCC" } },
        },
      };
    });

    // ── Stripe data rows alternating light blue / white ──
    exportRows.forEach((_, rowOffset) => {
      const rowIdx = headerRowIdx + 1 + rowOffset;
      const isEven = rowOffset % 2 === 0;
      headers.forEach((_, colIdx) => {
        const ref = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
        if (!ws[ref]) return;
        ws[ref].s = {
          fill: isEven
            ? { fgColor: { rgb: "EEF4FF" } }
            : { fgColor: { rgb: "FFFFFF" } },
          alignment: { vertical: "center" },
          border: {
            bottom: { style: "hair", color: { rgb: "DDDDDD" } },
            right: { style: "hair", color: { rgb: "DDDDDD" } },
          },
        };
      });
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31)); // Excel sheet names limited to 31 chars

    const filename = title.toLowerCase().replace(/\s+/g, "-");
    XLSX.writeFile(wb, `${filename}-${Date.now()}.xlsx`);
  }, [records, columns, title]);

  /* ── DOCX ── */
  const exportToDocx = useCallback(async () => {
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, HeadingLevel } =
      await import("docx");

    const headerCells = columns.map(
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
          children: columns.map(
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
              text: title,
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
    const filename = title.toLowerCase().replace(/\s+/g, "-");
    a.download = `${filename}-${Date.now()}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [records, columns, title]);

  /* ── JPG ── */
  const exportToJpg = useCallback(async () => {
    const { default: html2canvas } = await import("html2canvas");

    // Build a temporary off-screen table
    const container = document.createElement("div");
    container.style.cssText =
      "position:fixed;left:-9999px;top:0;background:#fff;padding:16px;font-family:sans-serif;";

    const heading = document.createElement("h2");
    heading.textContent = title;
    heading.style.cssText = "font-size:14px;margin:0 0 4px;color:#1e3a8a;";
    container.appendChild(heading);

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
    columns.forEach((col) => {
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
      columns.forEach((col) => {
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
    const filename = title.toLowerCase().replace(/\s+/g, "-");
    link.download = `${filename}-${Date.now()}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    link.click();
  }, [records, columns, title]);

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
