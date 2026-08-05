"use client";

import { useState, useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { getPmsLogsByDateRangeAction } from "@/lib/actions/pms";
import type { TruckPmsStatus } from "@/lib/repositories/pms.repository";

export function usePmsExport(
  startDate: string,
  endDate: string,
  fleetData: TruckPmsStatus[] = []
) {
  const [exporting, setExporting] = useState(false);

  /* ── Export to PDF (PMS Maintenance Logs First) ── */
  const handleExportPdf = useCallback(async () => {
    setExporting(true);
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Fetch PMS Maintenance Logs (filtered by date if provided, or all logs)
      const res = await getPmsLogsByDateRangeAction({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res?.data?.success && res.data.data && res.data.data.length > 0) {
        const data = res.data.data;

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("PMS Maintenance Service Logs Report", 14, 14);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Date Filter: ${startDate && endDate ? `${startDate} to ${endDate}` : "All Recorded Logs"}`, 14, 20);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
        doc.text(`Total Maintenance Entries: ${data.length}`, 14, 30);

        const columns = [
          { header: "Plate Number", dataKey: "plateNumber" },
          { header: "Fleet / Unit", dataKey: "fleet" },
          { header: "PMS Date", dataKey: "pmsDate" },
          { header: "Odo (km)", dataKey: "pmsOdo" },
          { header: "Service Type", dataKey: "serviceType" },
          { header: "Cost (PHP)", dataKey: "cost" },
          { header: "Mechanic / Shop", dataKey: "performedBy" },
          { header: "Remarks", dataKey: "remarks" },
        ];

        const body = data.map((row: any) => ({
          plateNumber: `${row.plateNumber}${row.isSubcon ? " (Subcon)" : ""}`,
          fleet: `${row.fleetType || "Standard"} ${row.unitType ? `(${row.unitType})` : ""}`.trim(),
          pmsDate: row.pmsDate,
          pmsOdo: Number(row.pmsOdo).toLocaleString(),
          serviceType: row.serviceType || "—",
          cost: `PHP ${Number(row.cost || 0).toLocaleString()}`,
          performedBy: row.performedBy || "—",
          remarks: row.remarks || "—",
        }));

        autoTable(doc, {
          columns,
          body,
          startY: 34,
          styles: { fontSize: 8, cellPadding: 2, valign: "middle" },
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 8,
          },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          columnStyles: {
            plateNumber: { cellWidth: 28 },
            fleet: { cellWidth: 32 },
            pmsDate: { cellWidth: 24 },
            pmsOdo: { cellWidth: 25 },
            serviceType: { cellWidth: 25 },
            cost: { cellWidth: 25 },
            performedBy: { cellWidth: 25 },
            remarks: { cellWidth: "auto" },
          },
        });

        const filename = startDate && endDate
          ? `pms-logs-${startDate}-to-${endDate}.pdf`
          : `pms-logs-all-${new Date().toISOString().split("T")[0]}.pdf`;

        doc.save(filename);
      } else {
        // Fallback: Fleet Status Table if no maintenance logs exist yet
        if (!fleetData || fleetData.length === 0) {
          notifications.show({
            title: "No records found",
            message: "No PMS maintenance logs available to export.",
            color: "yellow",
          });
          setExporting(false);
          return;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Fleet PMS Status Summary Report", 14, 14);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 20);
        doc.text(`Total Fleet Trucks: ${fleetData.length}`, 14, 25);

        const columns = [
          { header: "Plate Number", dataKey: "plateNumber" },
          { header: "Fleet Type", dataKey: "fleetType" },
          { header: "Last PMS Date", dataKey: "lastPmsDate" },
          { header: "Last PMS Odo (km)", dataKey: "lastPmsOdo" },
          { header: "Current Odo (km)", dataKey: "currentOdo" },
          { header: "KM Traveled", dataKey: "kmSinceLastPms" },
          { header: "PMS Interval", dataKey: "pmsIntervalKm" },
          { header: "PMS Status", dataKey: "pmsStatus" },
        ];

        const body = fleetData.map((row) => ({
          plateNumber: `${row.plateNumber}${row.isSubcon ? " (Subcon)" : ""}`,
          fleetType: `${row.fleetType || "Standard"} ${row.unitType ? `(${row.unitType})` : ""}`.trim(),
          lastPmsDate: row.lastPmsDate || "—",
          lastPmsOdo: row.lastPmsOdo.toLocaleString(),
          currentOdo: row.currentOdo.toLocaleString(),
          kmSinceLastPms: `${row.kmSinceLastPms.toLocaleString()} km`,
          pmsIntervalKm: `${row.pmsIntervalKm.toLocaleString()} km`,
          pmsStatus: row.pmsStatus.toUpperCase(),
        }));

        autoTable(doc, {
          columns,
          body,
          startY: 30,
          styles: { fontSize: 8, cellPadding: 2, valign: "middle", overflow: "ellipsize" },
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 8,
          },
          alternateRowStyles: { fillColor: [245, 247, 250] },
        });

        doc.save(`fleet-pms-status-${new Date().toISOString().split("T")[0]}.pdf`);
      }

      notifications.show({ title: "PDF Exported", message: "File downloaded successfully.", color: "green" });
    } catch (err) {
      notifications.show({ title: "Export failed", message: "Could not generate PDF.", color: "red" });
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate, fleetData]);

  /* ── Export to Excel (XLSX - PMS Maintenance Logs First) ── */
  const handleExportXlsx = useCallback(async () => {
    setExporting(true);
    try {
      const XLSX = await import("xlsx-js-style");

      // Fetch PMS Maintenance Logs (filtered by date if provided, or all logs)
      const res = await getPmsLogsByDateRangeAction({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res?.data?.success && res.data.data && res.data.data.length > 0) {
        const data = res.data.data;
        const title = "PMS Maintenance Service Logs Report";
        const headers = ["Plate Number", "Type", "Fleet / Unit", "PMS Date", "Odo (km)", "Service Type", "Cost (PHP)", "Mechanic / Shop", "Remarks"];

        const exportRows = data.map((row: any) => [
          row.plateNumber,
          row.isSubcon ? "Subcon" : "Own",
          `${row.fleetType || "Standard"} ${row.unitType ? `(${row.unitType})` : ""}`.trim(),
          row.pmsDate,
          Number(row.pmsOdo).toLocaleString(),
          row.serviceType || "—",
          `PHP ${Number(row.cost || 0).toLocaleString()}`,
          row.performedBy || "—",
          row.remarks || "—",
        ]);

        const metaData: (string | number)[][] = [
          [title.toUpperCase()],
          ["Date Filter:", startDate && endDate ? `${startDate} to ${endDate}` : "All Recorded Logs"],
          ["Generated:", new Date().toLocaleString()],
          ["Total Maintenance Entries:", data.length],
          [],
          headers,
        ];

        const allRows = [...metaData, ...exportRows];
        const ws = XLSX.utils.aoa_to_sheet(allRows);

        ws["!cols"] = headers.map((h, i) => {
          const maxLen = Math.max(h.length, ...exportRows.map((r: any) => String(r[i] ?? "").length));
          return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
        });

        const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
        if (!ws[titleRef]) ws[titleRef] = { v: title.toUpperCase(), t: "s" };
        ws[titleRef].s = { font: { bold: true, sz: 16, color: { rgb: "1a56db" } } };

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

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "PMS Logs");

        const filename = startDate && endDate
          ? `pms-logs-${startDate}-to-${endDate}.xlsx`
          : `pms-logs-all-${new Date().toISOString().split("T")[0]}.xlsx`;

        XLSX.writeFile(wb, filename);
      } else {
        // Fallback: Fleet Status Table if no maintenance logs exist yet
        if (!fleetData || fleetData.length === 0) {
          notifications.show({
            title: "No records found",
            message: "No PMS maintenance logs available to export.",
            color: "yellow",
          });
          setExporting(false);
          return;
        }

        const title = "Fleet PMS Status Summary Report";
        const headers = ["Plate Number", "Type", "Fleet / Unit", "Last PMS Date", "Last PMS Odo (km)", "Current Odo (km)", "KM Traveled", "Interval (km)", "PMS Status"];

        const exportRows = fleetData.map((row) => [
          row.plateNumber,
          row.isSubcon ? "Subcon" : "Own",
          `${row.fleetType || "Standard"} ${row.unitType ? `(${row.unitType})` : ""}`.trim(),
          row.lastPmsDate || "—",
          row.lastPmsOdo.toLocaleString(),
          row.currentOdo.toLocaleString(),
          `${row.kmSinceLastPms.toLocaleString()} km`,
          `${row.pmsIntervalKm.toLocaleString()} km`,
          row.pmsStatus.toUpperCase(),
        ]);

        const metaData: (string | number)[][] = [
          [title.toUpperCase()],
          ["Generated:", new Date().toLocaleString()],
          ["Total Fleet Trucks:", fleetData.length],
          [],
          headers,
        ];

        const allRows = [...metaData, ...exportRows];
        const ws = XLSX.utils.aoa_to_sheet(allRows);

        ws["!cols"] = headers.map((h, i) => {
          const maxLen = Math.max(h.length, ...exportRows.map((r: any) => String(r[i] ?? "").length));
          return { wch: Math.min(Math.max(maxLen + 2, 12), 50) };
        });

        const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
        if (!ws[titleRef]) ws[titleRef] = { v: title.toUpperCase(), t: "s" };
        ws[titleRef].s = { font: { bold: true, sz: 16, color: { rgb: "1a56db" } } };

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

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Fleet PMS Status");
        XLSX.writeFile(wb, `fleet-pms-status-${new Date().toISOString().split("T")[0]}.xlsx`);
      }

      notifications.show({ title: "XLSX Exported", message: "File downloaded successfully.", color: "green" });
    } catch (err) {
      notifications.show({ title: "Export failed", message: "Could not generate XLSX.", color: "red" });
    } finally {
      setExporting(false);
    }
  }, [startDate, endDate, fleetData]);

  return {
    exporting,
    handleExportPdf,
    handleExportXlsx,
  };
}
