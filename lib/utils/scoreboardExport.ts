import { ScoreboardEntry } from "@/components/demerit/ScoreboardTab";

interface ExportScoreboardOptions {
  scoreboard: ScoreboardEntry[];
  monthLabel: string;
  teamAvg: number;
  teamRating: string;
  ratingConfig: Record<string, { color: string; action: string }>;
}

export async function exportScoreboardToPdf({
  scoreboard,
  monthLabel,
  teamAvg,
  teamRating,
  ratingConfig,
}: ExportScoreboardOptions) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, 210, 24, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DEMERIT SCOREBOARD & RATING REPORT", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${monthLabel}`, 14, 18);

  const timestamp = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.text(`Generated: ${timestamp}`, 210 - 14, 18, { align: "right" });

  // Summary Metrics Card
  doc.setFillColor(241, 245, 249); // Slate 100
  doc.roundedRect(14, 28, 182, 14, 2, 2, "F");

  doc.setTextColor(51, 65, 85);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Personnel: ${scoreboard.length}`, 20, 36);
  doc.text(`Team Average Score: ${teamAvg}`, 90, 36);
  doc.text(`Team Rating: ${teamRating}`, 160, 36);

  // Main Data Table
  const tableColumns = [
    { header: "RANK", dataKey: "rank" },
    { header: "PERSONNEL NAME", dataKey: "personName" },
    { header: "ROLE", dataKey: "personType" },
    { header: "DEMERITS", dataKey: "totalDemerits" },
    { header: "SCORE", dataKey: "score" },
    { header: "RATING", dataKey: "rating" },
  ];

  type TableRow = {
    rank: number | string;
    personName: string;
    personType: string;
    totalDemerits: number | string;
    score: number | string;
    rating: string;
  };

  const tableBody: TableRow[] = scoreboard.map((entry) => ({
    rank: entry.rank,
    personName: entry.personName,
    personType: entry.personType === "driver" ? "Driver" : "Helper",
    totalDemerits: entry.totalDemerits,
    score: entry.score,
    rating: entry.rating,
  }));

  // Append summary / team average row
  tableBody.push({
    rank: "",
    personName: "TEAM AVERAGE",
    personType: "",
    totalDemerits: "",
    score: teamAvg,
    rating: teamRating,
  });

  autoTable(doc, {
    columns: tableColumns,
    body: tableBody,
    startY: 46,
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      valign: "middle",
      overflow: "linebreak",
      font: "helvetica",
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "center",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      rank: { halign: "center", cellWidth: 16 },
      personName: { halign: "left" },
      personType: { halign: "center", cellWidth: 28 },
      totalDemerits: { halign: "center", cellWidth: 24 },
      score: { halign: "center", cellWidth: 24, fontStyle: "bold" },
      rating: { halign: "center", cellWidth: 38 },
    },
    didParseCell: (data) => {
      // Highlight Team Average Footer Row
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [226, 232, 240];
        data.cell.styles.textColor = [15, 23, 42];
      }
    },
  });

  // Action Recommendations Policy section
  const finalY = (doc as any).lastAutoTable
    ? (doc as any).lastAutoTable.finalY + 10
    : 180;
  if (finalY < 250) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Action Recommendations Policy Guidelines", 14, finalY);

    const policyRows = Object.entries(ratingConfig).map(([rating, cfg]) => [
      rating,
      cfg.action,
    ]);

    autoTable(doc, {
      head: [["Rating Level", "Standard Action / Intervention"]],
      body: policyRows,
      startY: finalY + 4,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 44, fontStyle: "bold" },
        1: { cellWidth: "auto" },
      },
    });
  }

  const cleanFilename = `scoreboard-${monthLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;
  doc.save(cleanFilename);
}

export async function exportScoreboardToXlsx({
  scoreboard,
  monthLabel,
  teamAvg,
  teamRating,
}: Omit<ExportScoreboardOptions, "ratingConfig">) {
  const XLSX = await import("xlsx-js-style");

  const title = "DEMERIT SCOREBOARD REPORT";
  const headers = [
    "Rank",
    "Personnel Name",
    "Role",
    "Total Demerits",
    "Score",
    "Rating",
  ];

  const exportRows = scoreboard.map((entry) => [
    entry.rank,
    entry.personName,
    entry.personType === "driver" ? "Driver" : "Helper",
    entry.totalDemerits,
    entry.score,
    entry.rating,
  ]);

  const summaryRow = ["", "TEAM AVERAGE", "", "", teamAvg, teamRating];

  const metaData: (string | number)[][] = [
    [title],
    ["Period:", monthLabel],
    ["Generated Date:", new Date().toLocaleString()],
    ["Total Personnel:", scoreboard.length],
    ["Team Average Score:", `${teamAvg} (${teamRating})`],
    [],
    headers,
  ];

  const allRows = [...metaData, ...exportRows, summaryRow];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws["!cols"] = [
    { wch: 8 },  // Rank
    { wch: 28 }, // Personnel Name
    { wch: 14 }, // Role
    { wch: 16 }, // Total Demerits
    { wch: 12 }, // Score
    { wch: 20 }, // Rating
  ];

  // Title Style
  const titleRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (!ws[titleRef]) ws[titleRef] = { v: title, t: "s" };
  ws[titleRef].s = {
    font: { bold: true, sz: 16, color: { rgb: "1E293B" } },
  };

  // Header Row Index
  const headerRowIdx = 6;
  headers.forEach((_, colIdx) => {
    const ref = XLSX.utils.encode_cell({ r: headerRowIdx, c: colIdx });
    if (!ws[ref]) return;
    ws[ref].s = {
      font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E293B" } },
      alignment: {
        horizontal: colIdx === 1 ? "left" : "center",
        vertical: "center",
      },
      border: { bottom: { style: "medium", color: { rgb: "0F172A" } } },
    };
  });

  // Data Rows Styling
  exportRows.forEach((_, rowOffset) => {
    const rowIdx = headerRowIdx + 1 + rowOffset;
    const isEven = rowOffset % 2 === 0;
    headers.forEach((_, colIdx) => {
      const ref = XLSX.utils.encode_cell({ r: rowIdx, c: colIdx });
      if (!ws[ref]) return;

      const isName = colIdx === 1;
      const isDemerits = colIdx === 3;
      const isScore = colIdx === 4;
      const val = ws[ref].v;

      ws[ref].s = {
        fill: isEven ? { fgColor: { rgb: "F8FAFC" } } : { fgColor: { rgb: "FFFFFF" } },
        font: {
          sz: 10,
          bold: isScore,
          color: isDemerits && Number(val) > 0 ? { rgb: "DC2626" } : undefined,
        },
        alignment: {
          horizontal: isName ? "left" : "center",
          vertical: "center",
        },
        border: {
          bottom: { style: "thin", color: { rgb: "E2E8F0" } },
          right: { style: "thin", color: { rgb: "E2E8F0" } },
          left: { style: "thin", color: { rgb: "E2E8F0" } },
        },
      };
    });
  });

  // Summary / Team Average Row Styling
  const summaryRowIdx = headerRowIdx + 1 + exportRows.length;
  headers.forEach((_, colIdx) => {
    const ref = XLSX.utils.encode_cell({ r: summaryRowIdx, c: colIdx });
    if (!ws[ref]) return;
    ws[ref].s = {
      fill: { fgColor: { rgb: "E2E8F0" } },
      font: { bold: true, sz: 11, color: { rgb: "0F172A" } },
      alignment: {
        horizontal: colIdx === 1 ? "left" : "center",
        vertical: "center",
      },
      border: {
        top: { style: "medium", color: { rgb: "0F172A" } },
        bottom: { style: "double", color: { rgb: "0F172A" } },
      },
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Scoreboard");
  const cleanFilename = `scoreboard-${monthLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`;
  XLSX.writeFile(wb, cleanFilename);
}
