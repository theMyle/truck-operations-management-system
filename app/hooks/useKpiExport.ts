"use client";

import { useState, useCallback } from "react";
import { notifications } from "@mantine/notifications";
import type { KpiReportSummary } from "@/lib/repositories/queries/kpi";

export function useKpiExport() {
  const [exporting, setExporting] = useState(false);

  /* ── Export to Excel (.xlsx) ── */
  const handleExportXlsx = useCallback(async (reportData: KpiReportSummary) => {
    if (!reportData) return;
    setExporting(true);

    const notifId = "kpi-export-xlsx";
    notifications.show({
      id: notifId,
      title: "Exporting Excel",
      message: "Generating KPI Monthly Summary Report...",
      color: "blue",
      loading: true,
      autoClose: false,
    });

    try {
      const XLSX = await import("xlsx-js-style");

      const headers = [
        "MONTH",
        "SUCCESSFUL TRIPS",
        "TOTAL TRIPS",
        "FLEET UTILIZATION % (20%)",
        "ON TIME DELIVERY % (25%)",
        "ON TIME PAYMENT % (15%)",
        "MAINTENANCE COMPLIANCE % (20%)",
        "MANPOWER RATING (20%)",
        "OVERALL SCORE",
        "OVERALL RATING",
      ];

      const targetRow = [
        "TARGET",
        "—",
        "—",
        "70.0%",
        "90.0%",
        "80.0%",
        "90.0%",
        "80.0",
        "—",
        "Excellent",
      ];

      const dataRows = reportData.monthlyData.map((m) => [
        m.month,
        m.hasData ? m.successfulTrips : "—",
        m.hasData ? m.totalTrips : "—",
        m.hasData ? `${(m.fleetUtilization || 0).toFixed(1)}%` : "—",
        m.hasData ? `${(m.onTimeDelivery || 0).toFixed(1)}%` : "—",
        m.hasData ? `${(m.onTimePayment || 0).toFixed(1)}%` : "—",
        m.hasData ? `${(m.maintenanceCompliance || 0).toFixed(1)}%` : "—",
        m.hasData ? `${(m.manpowerRating || 0).toFixed(1)}` : "—",
        m.hasData ? `${(m.overallScore || 0).toFixed(1)}%` : "—",
        m.hasData ? m.overallRating : "—",
      ]);

      const footerRow = [
        "FULL-YEAR AVG / TOTAL",
        (reportData.fullYearTotalTrips ?? 0) > 0 ? reportData.fullYearSuccessfulTrips : "—",
        (reportData.fullYearTotalTrips ?? 0) > 0 ? reportData.fullYearTotalTrips : "—",
        (reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgUtil || 0).toFixed(1)}%` : "—",
        (reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgDelivery || 0).toFixed(1)}%` : "—",
        (reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgPayment || 0).toFixed(1)}%` : "—",
        (reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgPms || 0).toFixed(1)}%` : "—",
        (reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgManpower || 0).toFixed(1)}` : "—",
        `${reportData.fullYearAvgScore}%`,
        reportData.fullYearAvgRating,
      ];

      const metaData: (string | number)[][] = [
        [`KRISDOMINGO TRUCKING SERVICES - KPI MONTHLY SUMMARY REPORT (${reportData.year})`],
        ["Generated:", new Date().toLocaleString()],
        ["Full-Year Avg Score:", `${reportData.fullYearAvgScore}% (${reportData.fullYearAvgRating})`],
        ["Current Month Score:", `${reportData.currentMonthScore}% (${reportData.currentMonthRating})`],
        [],
        headers,
        targetRow,
      ];

      const allRows = [...metaData, ...dataRows, footerRow];
      const ws = XLSX.utils.aoa_to_sheet(allRows);

      // ── Styling ──
      // Title
      const titleCell = ws["A1"];
      if (titleCell) {
        titleCell.s = {
          font: { bold: true, sz: 14, color: { rgb: "1E3A8A" } },
        };
      }

      // Metadata summary keys
      [1, 2, 3].forEach((r) => {
        const c0 = ws[XLSX.utils.encode_cell({ r, c: 0 })];
        const c1 = ws[XLSX.utils.encode_cell({ r, c: 1 })];
        if (c0) c0.s = { font: { bold: true, sz: 10, color: { rgb: "475569" } } };
        if (c1) c1.s = { font: { bold: true, sz: 10, color: { rgb: "1E40AF" } } };
      });

      const headerRowIdx = 5;
      const targetRowIdx = 6;
      const footerRowIdx = allRows.length - 1;

      headers.forEach((_, colIdx) => {
        // Table Header
        const hRef = XLSX.utils.encode_cell({ r: headerRowIdx, c: colIdx });
        if (ws[hRef]) {
          ws[hRef].s = {
            font: { bold: true, sz: 10, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "1E40AF" } }, // blue.8
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
          };
        }

        // Target Benchmark Row
        const tRef = XLSX.utils.encode_cell({ r: targetRowIdx, c: colIdx });
        if (ws[tRef]) {
          ws[tRef].s = {
            font: { bold: true, sz: 10, italic: true, color: { rgb: "1E3A8A" } },
            fill: { fgColor: { rgb: "DBEAFE" } }, // blue.1
            alignment: { horizontal: "center", vertical: "center" },
          };
        }

        // Footer Total / Average Row
        const fRef = XLSX.utils.encode_cell({ r: footerRowIdx, c: colIdx });
        if (ws[fRef]) {
          ws[fRef].s = {
            font: { bold: true, sz: 10, color: { rgb: "1E3A8A" } },
            fill: { fgColor: { rgb: "EFF6FF" } }, // blue.0
            alignment: { horizontal: "center", vertical: "center" },
            border: { top: { style: "medium", color: { rgb: "1E40AF" } } },
          };
        }
      });

      // Data Rows (striped)
      dataRows.forEach((_, rowOffset) => {
        const rIdx = targetRowIdx + 1 + rowOffset;
        const isEven = rowOffset % 2 === 0;
        headers.forEach((_, colIdx) => {
          const cellRef = XLSX.utils.encode_cell({ r: rIdx, c: colIdx });
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { sz: 10 },
              fill: isEven ? { fgColor: { rgb: "F8FAFC" } } : { fgColor: { rgb: "FFFFFF" } },
              alignment: { horizontal: colIdx === 0 ? "left" : "center", vertical: "center" },
            };
          }
        });
      });

      // Column widths
      ws["!cols"] = headers.map((h, i) => {
        const maxLen = Math.max(
          h.length,
          ...allRows.slice(headerRowIdx).map((r) => String(r[i] ?? "").length)
        );
        return { wch: Math.min(Math.max(maxLen + 3, 14), 32) };
      });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "KPI Summary");
      XLSX.writeFile(wb, `krisdomingo-kpi-report-${reportData.year}.xlsx`);

      notifications.update({
        id: notifId,
        title: "Export Successful",
        message: `krisdomingo-kpi-report-${reportData.year}.xlsx downloaded.`,
        color: "green",
        loading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Failed to export KPI report to Excel:", error);
      notifications.update({
        id: notifId,
        title: "Export Failed",
        message: "An error occurred while generating the Excel report.",
        color: "red",
        loading: false,
        autoClose: 4000,
      });
    } finally {
      setExporting(false);
    }
  }, []);

  /* ── Export to PDF (.pdf) ── */
  const handleExportPdf = useCallback(async (reportData: KpiReportSummary) => {
    if (!reportData) return;
    setExporting(true);

    const notifId = "kpi-export-pdf";
    notifications.show({
      id: notifId,
      title: "Exporting PDF",
      message: "Generating KPI Monthly Summary Report...",
      color: "blue",
      loading: true,
      autoClose: false,
    });

    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      // Title & Subtitle
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138); // blue.9
      doc.text("KRISDOMINGO TRUCKING SERVICES", 14, 14);

      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`KPI Monthly Summary Report (${reportData.year})`, 14, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
      doc.text(
        `Full-Year Avg Score: ${reportData.fullYearAvgScore}% (${reportData.fullYearAvgRating})   |   Current Month Score: ${reportData.currentMonthScore}% (${reportData.currentMonthRating})`,
        130,
        25
      );

      const tableHeaders = [
        "Month",
        "Trips (Comp/Tot)",
        "Fleet Util (20%)",
        "On-Time Del (25%)",
        "Payment (15%)",
        "PMS Compl (20%)",
        "Manpower (20%)",
        "Overall Score",
        "Overall Rating",
      ];

      const targetRow = [
        "TARGET",
        "—",
        "70.0%",
        "90.0%",
        "80.0%",
        "90.0%",
        "80.0",
        "—",
        "Excellent",
      ];

      const bodyRows = reportData.monthlyData.map((m) => [
        m.month,
        m.hasData ? `${m.successfulTrips} / ${m.totalTrips}` : "—",
        m.hasData ? `${(m.fleetUtilization || 0).toFixed(1)}%` : "—",
        m.hasData ? `${(m.onTimeDelivery || 0).toFixed(1)}%` : "—",
        m.hasData ? `${(m.onTimePayment || 0).toFixed(1)}%` : "—",
        m.hasData ? `${(m.maintenanceCompliance || 0).toFixed(1)}%` : "—",
        m.hasData ? `${(m.manpowerRating || 0).toFixed(1)}` : "—",
        m.hasData ? `${(m.overallScore || 0).toFixed(1)}%` : "—",
        m.hasData ? m.overallRating : "—",
      ]);

      const footerRow = [
        "FULL-YEAR AVG",
        (reportData.fullYearTotalTrips ?? 0) > 0
          ? `${reportData.fullYearSuccessfulTrips} / ${reportData.fullYearTotalTrips}`
          : "—",
        (reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgUtil || 0).toFixed(1)}%` : "—",
        (reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgDelivery || 0).toFixed(1)}%` : "—",
        (reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgPayment || 0).toFixed(1)}%` : "—",
        (reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgPms || 0).toFixed(1)}%` : "—",
        (reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgManpower || 0).toFixed(1)}` : "—",
        `${reportData.fullYearAvgScore}%`,
        reportData.fullYearAvgRating,
      ];

      autoTable(doc, {
        head: [tableHeaders],
        body: [targetRow, ...bodyRows],
        foot: [footerRow],
        startY: 28,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 2,
          halign: "center",
          valign: "middle",
        },
        headStyles: {
          fillColor: [30, 64, 175], // blue.8
          textColor: 255,
          fontStyle: "bold",
          fontSize: 8.5,
        },
        columnStyles: {
          0: { halign: "left", fontStyle: "bold", cellWidth: 32 },
          8: { cellWidth: 32 },
        },
        footStyles: {
          fillColor: [239, 246, 255],
          textColor: [30, 58, 138],
          fontStyle: "bold",
          fontSize: 8.5,
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.row.index === 0) {
            data.cell.styles.fillColor = [219, 234, 254]; // blue.1
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.textColor = [30, 58, 138];
          }
        },
      });

      doc.save(`krisdomingo-kpi-report-${reportData.year}.pdf`);

      notifications.update({
        id: notifId,
        title: "Export Successful",
        message: `krisdomingo-kpi-report-${reportData.year}.pdf downloaded.`,
        color: "green",
        loading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Failed to export KPI report to PDF:", error);
      notifications.update({
        id: notifId,
        title: "Export Failed",
        message: "An error occurred while generating the PDF report.",
        color: "red",
        loading: false,
        autoClose: 4000,
      });
    } finally {
      setExporting(false);
    }
  }, []);

  /* ── Print Report ── */
  const handlePrint = useCallback((reportData: KpiReportSummary) => {
    if (!reportData) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>KRISDOMINGO KPI Summary Report ${reportData.year}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 20px; color: #0f172a; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
            .title { font-size: 16px; font-weight: 800; color: #1e3a8a; letter-spacing: 0.5px; }
            .subtitle { font-size: 11px; color: #475569; font-weight: 600; margin-top: 2px; }
            .meta { font-size: 9px; color: #64748b; text-align: right; line-height: 1.4; }
            .summary-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
            .card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; background: #f8fafc; }
            .card.highlight { background: #eff6ff; border-color: #bfdbfe; }
            .card-title { font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase; }
            .card-value { font-size: 15px; font-weight: 800; color: #1e3a8a; margin-top: 3px; display: flex; align-items: center; justify-content: space-between; }
            .card-badge { font-size: 8.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #2563eb; color: #fff; }
            table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9px; }
            th { background: #1e40af; color: #ffffff; padding: 6px 8px; font-weight: 700; text-align: center; border: 1px solid #1e3a8a; }
            th:first-child { text-align: left; }
            td { padding: 5px 8px; border: 1px solid #e2e8f0; text-align: center; }
            td:first-child { text-align: left; font-weight: 600; }
            tr:nth-child(even) td { background: #f8fafc; }
            .target-row td { background: #dbeafe !important; font-weight: 700; color: #1e3a8a; font-style: italic; }
            .footer-row td { background: #eff6ff !important; font-weight: 800; color: #1e3a8a; border-top: 2px solid #1e40af; }
            @page { size: landscape; margin: 10mm; }
            @media print {
              body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">KRISDOMINGO TRUCKING SERVICES</div>
              <div class="subtitle">KPI Monthly Summary Report (${reportData.year})</div>
            </div>
            <div class="meta">
              <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
              <div>Executive Performance & Weighted Scorecard</div>
            </div>
          </div>

          <div class="summary-cards">
            <div class="card highlight">
              <div class="card-title">Full-Year Avg Score</div>
              <div class="card-value">
                <span>${reportData.fullYearAvgScore}%</span>
                <span class="card-badge">${reportData.fullYearAvgRating}</span>
              </div>
            </div>
            <div class="card highlight">
              <div class="card-title">Current Month Score</div>
              <div class="card-value">
                <span>${reportData.currentMonthScore}%</span>
                <span class="card-badge">${reportData.currentMonthRating}</span>
              </div>
            </div>
            <div class="card">
              <div class="card-title">Target Overall Score</div>
              <div class="card-value"><span>82.0%</span></div>
            </div>
            <div class="card">
              <div class="card-title">Report Year</div>
              <div class="card-value"><span>${reportData.year}</span></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>MONTH</th>
                <th>SUCCESSFUL TRIPS</th>
                <th>FLEET UTIL (20%)</th>
                <th>ON TIME DEL (25%)</th>
                <th>ON TIME PAY (15%)</th>
                <th>MAINT COMPL (20%)</th>
                <th>MANPOWER (20%)</th>
                <th>OVERALL SCORE</th>
                <th>OVERALL RATING</th>
              </tr>
            </thead>
            <tbody>
              <tr class="target-row">
                <td>TARGET</td>
                <td>—</td>
                <td>70.0%</td>
                <td>90.0%</td>
                <td>80.0%</td>
                <td>90.0%</td>
                <td>80.0</td>
                <td>—</td>
                <td>Excellent</td>
              </tr>
              ${reportData.monthlyData
                .map(
                  (m) => `
                <tr>
                  <td>${m.month}</td>
                  <td>${m.hasData ? `${m.successfulTrips} / ${m.totalTrips}` : "—"}</td>
                  <td>${m.hasData ? `${(m.fleetUtilization || 0).toFixed(1)}%` : "—"}</td>
                  <td>${m.hasData ? `${(m.onTimeDelivery || 0).toFixed(1)}%` : "—"}</td>
                  <td>${m.hasData ? `${(m.onTimePayment || 0).toFixed(1)}%` : "—"}</td>
                  <td>${m.hasData ? `${(m.maintenanceCompliance || 0).toFixed(1)}%` : "—"}</td>
                  <td>${m.hasData ? `${(m.manpowerRating || 0).toFixed(1)}` : "—"}</td>
                  <td><strong>${m.hasData ? `${(m.overallScore || 0).toFixed(1)}%` : "—"}</strong></td>
                  <td>${m.hasData ? m.overallRating : "—"}</td>
                </tr>`
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr class="footer-row">
                <td>FULL-YEAR AVG / TOTAL</td>
                <td>${(reportData.fullYearTotalTrips ?? 0) > 0 ? `${reportData.fullYearSuccessfulTrips} / ${reportData.fullYearTotalTrips}` : "—"}</td>
                <td>${(reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgUtil || 0).toFixed(1)}%` : "—"}</td>
                <td>${(reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgDelivery || 0).toFixed(1)}%` : "—"}</td>
                <td>${(reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgPayment || 0).toFixed(1)}%` : "—"}</td>
                <td>${(reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgPms || 0).toFixed(1)}%` : "—"}</td>
                <td>${(reportData.fullYearAvgScore ?? 0) > 0 ? `${(reportData.fullYearAvgManpower || 0).toFixed(1)}` : "—"}</td>
                <td>${reportData.fullYearAvgScore}%</td>
                <td>${reportData.fullYearAvgRating}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=1200,height=800");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 250);
  }, []);

  return {
    exporting,
    handleExportXlsx,
    handleExportPdf,
    handlePrint,
  };
}
