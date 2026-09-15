"use client";

import { useState, useCallback } from "react";
import { notifications } from "@mantine/notifications";
import { getDailyOnTimeDeliveryBreakdownAction } from "@/lib/actions/booking";

export type ExportRangeType = "today" | "week" | "month";

export function useOnTimeExport(currentDateStr?: string) {
  const [exporting, setExporting] = useState(false);

  // Helper to compute date ranges
  const getDateRange = (type: ExportRangeType, baseDateStr?: string) => {
    const baseDate = baseDateStr ? new Date(baseDateStr) : new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (type === "today") {
      const dStr = toYMD(baseDate);
      return {
        startDate: dStr,
        endDate: dStr,
        label: `Daily (${dStr})`,
        filename: `ontime-report-today-${dStr}`,
      };
    }

    if (type === "week") {
      // Calculate Monday to Sunday of the week
      const d = new Date(baseDate);
      const day = d.getDay(); // 0 is Sunday, 1 is Monday...
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const sStr = toYMD(monday);
      const eStr = toYMD(sunday);
      return {
        startDate: sStr,
        endDate: eStr,
        label: `Weekly (${sStr} to ${eStr})`,
        filename: `ontime-report-week-${sStr}-to-${eStr}`,
      };
    }

    // Month
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const sStr = toYMD(firstDay);
    const eStr = toYMD(lastDay);
    const monthName = baseDate.toLocaleString("en-US", { month: "long", year: "numeric" });
    return {
      startDate: sStr,
      endDate: eStr,
      label: `Monthly (${monthName})`,
      filename: `ontime-report-month-${sStr}-to-${eStr}`,
    };
  };

  /* ── Export to PDF ── */
  const handleExportPdf = useCallback(
    async (type: ExportRangeType, customBaseDate?: string) => {
      setExporting(true);
      try {
        const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);

        const range = getDateRange(type, customBaseDate || currentDateStr);

        const res = await getDailyOnTimeDeliveryBreakdownAction({
          startDate: range.startDate,
          endDate: range.endDate,
        });

        if (!res?.data || !res.data.trips || res.data.trips.length === 0) {
          notifications.show({
            title: "No records found",
            message: `No on-time delivery records found for ${range.label}.`,
            color: "yellow",
          });
          setExporting(false);
          return;
        }

        const reportData = res.data;
        const trips = reportData.trips;

        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

        // Header Title & Metadata
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("On-Time Delivery Compliance Report", 14, 14);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`Period: ${range.label}`, 14, 20);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);

        doc.setFont("helvetica", "bold");
        doc.text(
          `Summary: ${reportData.onTimePercentage}% On-Time (${reportData.onTimeCount} On-Time / ${reportData.totalDeliveries} Total Trips | ${reportData.lateCount} Late)`,
          14,
          30
        );

        const columns = [
          { header: "Pickup Date", dataKey: "pickupDate" },
          { header: "DR / Booking #", dataKey: "bookingDRNo" },
          { header: "Client", dataKey: "clientName" },
          { header: "Plate No.", dataKey: "plateNumber" },
          { header: "Driver", dataKey: "driverName" },
          { header: "Scheduled", dataKey: "pickupTime" },
          { header: "Actual Arrival", dataKey: "pickupArrivalTime" },
          { header: "Variance", dataKey: "variance" },
          { header: "Compliance Status", dataKey: "status" },
          { header: "Remarks", dataKey: "tripRemarks" },
        ];

        const body = trips.map((t: any) => ({
          pickupDate: t.pickupDate || "—",
          bookingDRNo: t.bookingDRNo || "—",
          clientName: t.clientName || "—",
          plateNumber: t.plateNumber || "—",
          driverName: t.driverName || "—",
          pickupTime: t.pickupTime || "—",
          pickupArrivalTime: t.pickupArrivalTime || "—",
          variance: t.isOnTime ? "On-Time" : `+${t.delayMinutes || 0}m Late`,
          status: t.isOnTime ? "ON-TIME" : "LATE",
          tripRemarks: t.tripRemarks || "—",
        }));

        autoTable(doc, {
          columns,
          body,
          startY: 34,
          styles: { fontSize: 7.5, cellPadding: 1.8, valign: "middle" },
          headStyles: {
            fillColor: [37, 99, 235],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 7.5,
          },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          columnStyles: {
            pickupDate: { cellWidth: 20 },
            bookingDRNo: { cellWidth: 26 },
            clientName: { cellWidth: 28 },
            plateNumber: { cellWidth: 22 },
            driverName: { cellWidth: 26 },
            pickupTime: { cellWidth: 20 },
            pickupArrivalTime: { cellWidth: 22 },
            variance: { cellWidth: 20 },
            status: { cellWidth: 24 },
            tripRemarks: { cellWidth: "auto" },
          },
          didParseCell: (hookData: any) => {
            if (hookData.section === "body" && hookData.column.dataKey === "status") {
              if (hookData.cell.raw === "ON-TIME") {
                hookData.cell.styles.textColor = [16, 185, 129]; // Green
                hookData.cell.styles.fontStyle = "bold";
              } else {
                hookData.cell.styles.textColor = [239, 68, 68]; // Red
                hookData.cell.styles.fontStyle = "bold";
              }
            }
          },
        });

        doc.save(`${range.filename}.pdf`);
        notifications.show({
          title: "PDF Exported",
          message: `${range.label} report downloaded successfully.`,
          color: "green",
        });
      } catch (err) {
        console.error("Error generating On-Time PDF:", err);
        notifications.show({
          title: "Export Failed",
          message: "Could not generate On-Time PDF report.",
          color: "red",
        });
      } finally {
        setExporting(false);
      }
    },
    [currentDateStr]
  );

  /* ── Export to Excel (XLSX) ── */
  const handleExportXlsx = useCallback(
    async (type: ExportRangeType, customBaseDate?: string) => {
      setExporting(true);
      try {
        const XLSX = await import("xlsx-js-style");

        const range = getDateRange(type, customBaseDate || currentDateStr);

        const res = await getDailyOnTimeDeliveryBreakdownAction({
          startDate: range.startDate,
          endDate: range.endDate,
        });

        if (!res?.data || !res.data.trips || res.data.trips.length === 0) {
          notifications.show({
            title: "No records found",
            message: `No on-time delivery records found for ${range.label}.`,
            color: "yellow",
          });
          setExporting(false);
          return;
        }

        const reportData = res.data;
        const trips = reportData.trips;
        const title = "ON-TIME DELIVERY COMPLIANCE REPORT";
        const headers = [
          "Pickup Date",
          "DR / Booking #",
          "Client Name",
          "Plate No.",
          "Driver",
          "Scheduled Time",
          "Actual Arrival",
          "Delay / Variance",
          "Compliance Status",
          "Trip Remarks",
        ];

        const exportRows = trips.map((t: any) => [
          t.pickupDate || "—",
          t.bookingDRNo || "—",
          t.clientName || "—",
          t.plateNumber || "—",
          t.driverName || "—",
          t.pickupTime || "—",
          t.pickupArrivalTime || "—",
          t.isOnTime ? "On-Time" : `+${t.delayMinutes || 0} mins`,
          t.isOnTime ? "ON-TIME" : "LATE",
          t.tripRemarks || "—",
        ]);

        const metaData: (string | number)[][] = [
          [title],
          ["Report Period:", range.label],
          ["Generated:", new Date().toLocaleString()],
          ["On-Time Delivery Rate:", `${reportData.onTimePercentage}%`],
          [
            "Summary Metrics:",
            `${reportData.onTimeCount} On-Time / ${reportData.totalDeliveries} Total Trips (${reportData.lateCount} Late)`,
          ],
          [],
          headers,
        ];

        const allRows = [...metaData, ...exportRows];
        const ws = XLSX.utils.aoa_to_sheet(allRows);

        ws["!cols"] = headers.map((h, i) => {
          const maxLen = Math.max(h.length, ...exportRows.map((r: any) => String(r[i] ?? "").length));
          return { wch: Math.min(Math.max(maxLen + 2, 12), 45) };
        });

        // Title styling
        const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
        if (!ws[titleRef]) ws[titleRef] = { v: title, t: "s" };
        ws[titleRef].s = { font: { bold: true, sz: 14, color: { rgb: "1a56db" } } };

        // Table Header row styling
        const headerRowIdx = metaData.length - 1;
        headers.forEach((_, colIdx) => {
          const ref = XLSX.utils.encode_cell({ r: headerRowIdx, c: colIdx });
          if (!ws[ref]) return;
          ws[ref].s = {
            font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "1a56db" } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: { bottom: { style: "thin", color: { rgb: "CCCCCC" } } },
          };
        });

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "On-Time Compliance");
        XLSX.writeFile(wb, `${range.filename}.xlsx`);

        notifications.show({
          title: "XLSX Exported",
          message: `${range.label} Excel file downloaded successfully.`,
          color: "green",
        });
      } catch (err) {
        console.error("Error generating On-Time XLSX:", err);
        notifications.show({
          title: "Export Failed",
          message: "Could not generate On-Time Excel spreadsheet.",
          color: "red",
        });
      } finally {
        setExporting(false);
      }
    },
    [currentDateStr]
  );

  return {
    exporting,
    handleExportPdf,
    handleExportXlsx,
  };
}
