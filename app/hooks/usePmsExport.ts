"use client";

import { useState, useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { getPmsLogsByDateRangeAction } from "@/lib/actions/pms";

export function usePmsExport(startDate: string, endDate: string) {
  const [exporting, setExporting] = useState(false);

  const fetchExportData = async () => {
    if (!startDate || !endDate) {
      notifications.show({
        title: "Date range required",
        message: "Please select both start and end dates.",
        color: "orange",
      });
      return null;
    }
    if (startDate > endDate) {
      notifications.show({
        title: "Invalid date range",
        message: "Start date cannot be after end date.",
        color: "orange",
      });
      return null;
    }

    const res = await getPmsLogsByDateRangeAction({ startDate, endDate });
    if (!res?.data?.success || !res.data.data || res.data.data.length === 0) {
      notifications.show({
        title: "No records found",
        message: "No PMS logs found for the selected date range.",
        color: "yellow",
      });
      return null;
    }
    return res.data.data;
  };

  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      const data = await fetchExportData();
      if (!data) return;

      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PMS Maintenance Report", 14, 14);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 20);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
      doc.text(`Total Records: ${data.length}`, 14, 30);

      const columns = [
        { header: "Plate Number", dataKey: "plateNumber" },
        { header: "Fleet / Unit", dataKey: "fleet" },
        { header: "PMS Date", dataKey: "pmsDate" },
        { header: "Odo (km)", dataKey: "pmsOdo" },
        { header: "Service Type", dataKey: "serviceType" },
        { header: "Cost (₱)", dataKey: "cost" },
        { header: "Mechanic / Shop", dataKey: "performedBy" },
        { header: "Remarks", dataKey: "remarks" },
      ];

      const body = data.map((row: any) => ({
        plateNumber: `${row.plateNumber}${row.isSubcon ? " (Subcon)" : ""}`,
        fleet: `${row.fleetType || "Standard"} ${row.unitType ? `(${row.unitType})` : ""}`.trim(),
        pmsDate: row.pmsDate,
        pmsOdo: Number(row.pmsOdo).toLocaleString(),
        serviceType: row.serviceType || "—",
        cost: `₱${Number(row.cost || 0).toLocaleString()}`,
        performedBy: row.performedBy || "—",
        remarks: row.remarks || "—",
      }));

      autoTable(doc, {
        columns,
        body,
        startY: 34,
        styles: { fontSize: 8, cellPadding: 1.5, valign: "middle", overflow: "linebreak" },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8,
        },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });

      doc.save(`pms-report-${startDate}-to-${endDate}.pdf`);
      notifications.show({ title: "PDF Exported", message: "File downloaded.", color: "green" });
    } catch (err) {
      notifications.show({ title: "Export failed", message: "Could not generate PDF.", color: "red" });
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate]);

  const handleExportXlsx = useCallback(async () => {
    setExporting(true);
    try {
      const data = await fetchExportData();
      if (!data) return;

      const XLSX = await import("xlsx-js-style");

      const title = "PMS Maintenance Report";
      const headers = ["Plate Number", "Type", "Fleet / Unit", "PMS Date", "Odo (km)", "Service Type", "Cost (₱)", "Mechanic / Shop", "Remarks"];

      const exportRows = data.map((row: any) => [
        row.plateNumber,
        row.isSubcon ? "Subcon" : "Own",
        `${row.fleetType || "Standard"} ${row.unitType ? `(${row.unitType})` : ""}`.trim(),
        row.pmsDate,
        Number(row.pmsOdo).toLocaleString(),
        row.serviceType || "—",
        `₱${Number(row.cost || 0).toLocaleString()}`,
        row.performedBy || "—",
        row.remarks || "—",
      ]);

      const metaData: (string | number)[][] = [
        [title.toUpperCase()],
        ["Date Range:", `${startDate} to ${endDate}`],
        ["Generated:", new Date().toLocaleString()],
        ["Total Records:", data.length],
        [],
        headers,
      ];

      const allRows = [...metaData, ...exportRows];
      const ws = XLSX.utils.aoa_to_sheet(allRows);

      ws["!cols"] = headers.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...exportRows.map((r: any) => String(r[i] ?? "").length)
        );
        return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
      });

      const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
      if (!ws[titleRef]) ws[titleRef] = { v: title.toUpperCase(), t: "s" };
      ws[titleRef].s = {
        font: { bold: true, sz: 16, color: { rgb: "1a56db" } },
      };

      const headerRowIdx = metaData.length - 1;
      headers.forEach((_, colIdx) => {
        const ref = XLSX.utils.encode_cell({ r: headerRowIdx, c: colIdx });
        if (!ws[ref]) return;
        ws[ref].s = {
          font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1a56db" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: { bottom: { style: "thin", color: { rgb: "CCCCCC" } } },
        };
      });

      exportRows.forEach((_, rowOffset: number) => {
        const rowIdx = headerRowIdx + 1 + rowOffset;
        const isEven = rowOffset % 2 === 0;
        headers.forEach((_, colIdx) => {
          const ref = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
          if (!ws[ref]) return;
          ws[ref].s = {
            fill: isEven ? { fgColor: { rgb: "EEF4FF" } } : { fgColor: { rgb: "FFFFFF" } },
            font: { sz: 11 },
            alignment: { vertical: "center", wrapText: true },
            border: {
              bottom: { style: "hair", color: { rgb: "DDDDDD" } },
              right: { style: "hair", color: { rgb: "DDDDDD" } },
            },
          };
        });
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "PMS Report");
      XLSX.writeFile(wb, `pms-report-${startDate}-to-${endDate}.xlsx`);
      notifications.show({ title: "XLSX Exported", message: "File downloaded.", color: "green" });
    } catch (err) {
      notifications.show({ title: "Export failed", message: "Could not generate XLSX.", color: "red" });
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate]);

  return {
    exporting,
    handleExportPdf,
    handleExportXlsx,
  };
}
