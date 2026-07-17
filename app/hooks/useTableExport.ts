"use client";

import { useCallback } from "react";
import { DispatchRecord } from "@/app/(app)/constant";
import { formatTime12Hour } from "@/lib/utils/stringFormat";

export interface ExportColumn {
  key: string;
  label: string;
}

const TIME_KEYS = [
  "arrivalPickup",
  "loadingStart",
  "loadingEnd",
  "departurePickup",
  "finishDelivery",
];

function getFormattedValue(record: DispatchRecord, colKey: string): string {
  let val = record[colKey as keyof DispatchRecord];
  if (TIME_KEYS.includes(colKey) && typeof val === "string" && val.trim().length > 0) {
    return formatTime12Hour(val);
  }
  return String(val ?? "—");
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

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 14);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);

    const pdfColumns = columns.filter((col) => !TIME_KEYS.includes(col.key));

    autoTable(doc, {
      columns: pdfColumns.map((c) => ({ header: c.label, dataKey: c.key })),
      body: records.map((r) => {
        const row: Record<string, string> = {};
        pdfColumns.forEach((col) => {
          row[col.key] = getFormattedValue(r, col.key);
        });
        return row;
      }),
      startY: 24,
      styles: { 
        fontSize: 8.5, 
        cellPadding: 2.5, 
        valign: "middle", 
        overflow: "linebreak" 
      },
      columnStyles: {
        displayBookingNo: { cellWidth: 12 },
        tripRate: { cellWidth: 18 },
        date: { cellWidth: 20 },
        status: { cellWidth: 16 },
        client: { cellWidth: 32 },
        driver: { cellWidth: 32 },
        helper: { cellWidth: 28 },
        unit: { cellWidth: 18 },
        plateNo: { cellWidth: 18 },
        ruta: { cellWidth: 32 },
        bookingDr: { cellWidth: 26 },
        bookedBy: { cellWidth: 18 },
      },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8.5,
      },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      didParseCell: (data) => {
        const colKey = pdfColumns[data.column.index]?.key;

        // Center short data columns to prevent cramped/misaligned text
        if (
          [
            "displayBookingNo",
            "tripRate",
            "date",
            "status",
            "unit",
            "plateNo",
          ].includes(colKey)
        ) {
          data.cell.styles.halign = "center";
        }
      },
    });

    const filename = title.toLowerCase().replace(/\s+/g, "-");
    doc.save(`${filename}-${Date.now()}.pdf`);
  }, [records, columns, title]);

  /* ── XLSX ── */
  const exportToXlsx = useCallback(async () => {
    const XLSX = await import("xlsx-js-style");

    const exportRows = records.map((r) =>
      columns.map((col) => getFormattedValue(r, col.key))
    );
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
      font: { bold: true, sz: 16, color: { rgb: "1a56db" } },
    };

    // ── Style the column header row (row index = metaData.length - 1) ──
    const headerRowIdx = metaData.length - 1;
    headers.forEach((_, colIdx) => {
      const ref = XLSX.utils.encode_cell({ r: headerRowIdx, c: colIdx });
      if (!ws[ref]) return;

      const colKey = columns[colIdx]?.key;
      const isTimeCol = [
        "arrivalPickup",
        "loadingStart",
        "loadingEnd",
        "departurePickup",
        "finishDelivery",
      ].includes(colKey);

      ws[ref].s = {
        font: {
          bold: true,
          sz: 13,
          color: { rgb: isTimeCol ? "0f172a" : "FFFFFF" },
        },
        fill: { fgColor: { rgb: isTimeCol ? "bae6fd" : "1a56db" } },
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
          font: { sz: 12 },
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
    const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, AlignmentType, HeadingLevel, PageOrientation } =
      await import("docx");

    const headerCells = columns.map((col) => {
      const isTimeCol = [
        "arrivalPickup",
        "loadingStart",
        "loadingEnd",
        "departurePickup",
        "finishDelivery",
      ].includes(col.key);

      return new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: col.label,
                bold: true,
                size: 18,
                color: isTimeCol ? "0f172a" : "FFFFFF",
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
        shading: { fill: isTimeCol ? "BAE6FD" : "2563EB" },
        margins: {
          top: 100,
          bottom: 100,
          left: 100,
          right: 100,
        },
      });
    });

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
                        text: getFormattedValue(record, col.key),
                        size: 16,
                      }),
                    ],
                  }),
                ],
                margins: {
                  top: 100,
                  bottom: 100,
                  left: 100,
                  right: 100,
                },
              })
          ),
        })
    );

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                orientation: PageOrientation.LANDSCAPE,
              },
              margin: {
                top: 720,
                bottom: 720,
                left: 720,
                right: 720,
              },
            },
          },
          children: [
            new Paragraph({
              text: title,
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Generated: ${new Date().toLocaleString()}`,
                  size: 18,
                  color: "888888",
                }),
              ],
            }),
            new Paragraph({ text: "" }),
            new Table({
              columnWidths: columns.map((col) => {
                const key = col.key;
                if (key === "displayBookingNo") return 600;
                if (key === "tripRate") return 800;
                if (key === "date") return 1100;
                if (key === "status") return 900;
                if (key === "client") return 2200;
                if (key === "driver") return 2200;
                if (key === "helper") return 2000;
                if (key === "unit") return 1300;
                if (key === "arrivalPickup") return 1000;
                if (key === "loadingStart") return 1000;
                if (key === "loadingEnd") return 1000;
                if (key === "departurePickup") return 1000;
                if (key === "finishDelivery") return 1000;
                if (key === "plateNo") return 1100;
                if (key === "ruta") return 2500;
                if (key === "bookingDr") return 2000;
                if (key === "bookedBy") return 1300;
                return 1000;
              }),
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

    const jpgColumns = columns.filter((col) => !TIME_KEYS.includes(col.key));

    // Build a temporary off-screen table
    const container = document.createElement("div");
    container.style.cssText =
      "position:fixed;left:-9999px;top:0;background:#fff;padding:16px;font-family:sans-serif;";

    const heading = document.createElement("h2");
    heading.textContent = title;
    heading.style.cssText = "font-size:18px;margin:0 0 6px;color:#1e3a8a;font-weight:bold;";
    container.appendChild(heading);

    const sub = document.createElement("p");
    sub.textContent = `Generated: ${new Date().toLocaleString()}`;
    sub.style.cssText = "font-size:12px;color:#888;margin:0 0 16px;";
    container.appendChild(sub);

    const table = document.createElement("table");
    table.style.cssText =
      "border-collapse:collapse;width:100%;font-size:14px;";

    // Header
    const thead = document.createElement("thead");
    const hrow = document.createElement("tr");
    jpgColumns.forEach((col) => {
      const th = document.createElement("th");
      th.textContent = col.label;
      th.style.cssText =
        "background:#2563eb;color:#fff;padding:10px 14px;text-align:left;font-weight:700;white-space:nowrap;font-size:15px;";
      hrow.appendChild(th);
    });
    thead.appendChild(hrow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement("tbody");
    records.forEach((record, i) => {
      const tr = document.createElement("tr");
      tr.style.background = i % 2 === 0 ? "#fff" : "#f5f7fa";
      jpgColumns.forEach((col) => {
        const td = document.createElement("td");
        td.textContent = getFormattedValue(record, col.key);
        td.style.cssText =
          "padding:9px 14px;border-bottom:1px solid #e5e7eb;white-space:nowrap;";
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
