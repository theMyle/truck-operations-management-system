import jsPDF from "jspdf";
import autoTable, { CellHookData } from "jspdf-autotable";
import { DispatchRecord } from "@/app/(app)/constant";
import { NewTripDetailsFormData } from "@/components/trip-logs/TripDetailsModal";
import { EXPENSE_CATEGORIES } from "@/components/trip-logs/ExpensesTab";

interface JsPDFWithPlugin extends jsPDF {
  lastAutoTable: { finalY: number };
}

// ─── Color Palette ───
const STEEL: [number, number, number] = [58, 110, 165];
const STEEL_LT: [number, number, number] = [235, 241, 250];
const INK: [number, number, number] = [35, 35, 40];
const MUTED: [number, number, number] = [110, 110, 118];
const RULE: [number, number, number] = [210, 213, 218];
const ROW_ALT: [number, number, number] = [249, 250, 251];
const ROW_TOT: [number, number, number] = [240, 243, 248];
const WHITE: [number, number, number] = [255, 255, 255];
const RED: [number, number, number] = [168, 43, 43];
const GREEN: [number, number, number] = [34, 139, 34];

// ─── Helpers ───
const php = (n: number) =>
  `PHP ${n.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const phpAccounting = (n: number): string =>
  n < 0 ? `(${php(Math.abs(n))})` : php(n);

const empty = "N/A";

const asText = (value?: string | number | null): string => {
  const text = String(value ?? "").trim();
  return text || empty;
};

const parseMoney = (value?: string | number | null): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value ?? "").replace(/[^\d.-]/g, "");
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

// ─── Compact Section Title ───
function sectionTitle(
  doc: jsPDF,
  label: string,
  x: number,
  y: number,
  width: number,
): number {
  doc.setFillColor(...STEEL_LT);
  doc.setDrawColor(...RULE);
  doc.roundedRect(x, y - 3.5, width, 5.5, 1, 1, "FD");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...STEEL);
  doc.text(label.toUpperCase(), x + 2.5, y);
  doc.setTextColor(...INK);
  return y + 5.5;
}

// ─── Compact Footer ───
function footer(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  ml: number,
  mr: number,
  id: string | number,
): void {
  const footY = pageH - 5.5;
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.25);
  doc.line(ml, footY - 2, pageW - mr, footY - 2);
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text("System-generated document. Do not alter.", ml, footY);
  doc.text(`Trip ID: ${id}`, pageW - mr, footY, { align: "right" });
}

// ─── Compact Signature Block ───
function drawSignatureBlock(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
): void {
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.25);
  doc.line(x, y, x + width, y);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED);
  doc.text(label, x, y + 3.5);
}

// ─── 3-Column Trip Info Grid ───
function drawTripInfoGrid(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  record: DispatchRecord,
  formValues: NewTripDetailsFormData,
): number {
  const colW = width / 3;
  const rowH = 5.2;
  const items = [
    ["Trip No.", `#${record.displayBookingNo ?? record.id}`],
    ["Date", asText(record.date)],
    ["Client", asText(record.client)],
    ["Route", asText(record.ruta)],
    ["Plate No.", asText(record.plateNo)],
    ["Driver", asText(record.driver)],
    [
      "Helper(s)",
      record.rawHelpers?.map((h) => h.helperName).join(", ") ||
        record.helper ||
        empty,
    ],
    ["Trucker", asText(record.trucker)],
    [
      "Odometer",
      `${formValues.trips[0]?.odoStart || 0} - ${formValues.trips[formValues.trips.length - 1]?.odoEnd || 0} (${Math.max(0, (formValues.trips[formValues.trips.length - 1]?.odoEnd || 0) - (formValues.trips[0]?.odoStart || 0))} km)`,
    ],
    [
      "Trip Type",
      formValues.tripType === "single"
        ? "Single Trip"
        : `Multiple (${formValues.trips.length} trips)`,
    ],
  ];

  doc.setFontSize(6.5);

  for (let i = 0; i < items.length; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const ix = x + col * colW;
    const iy = y + row * rowH;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...MUTED);
    doc.text(items[i][0], ix, iy);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    const labelWidth = doc.getTextWidth(items[i][0] + "  ");
    doc.text(items[i][1], ix + labelWidth, iy, {
      maxWidth: colW - labelWidth - 3,
    });
  }

  return y + Math.ceil(items.length / 3) * rowH + 2;
}

// ─── Main PDF Generator ───
export function generateLiquidationPDF(
  record: DispatchRecord,
  formValues: NewTripDetailsFormData,
  refNumber?: string,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as JsPDFWithPlugin;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const ML = 10;
  const MR = 10;
  const CW = pageW - ML - MR;
  const FOOTER_H = 8;
  const SIG_H = 14;
  const SIG_Y = pageH - FOOTER_H - SIG_H - 2;

  // ─── Pre-calculate all values ───
  const budgetAmount = formValues.budget || 0;
  const collectionAmount = formValues.collectionFromCustomer || 0;
  const rfidAmount = formValues.rfidLoad || 0;
  const fuelAmt = formValues.fuelAmount || 0;
  const driverRateAmt = formValues.driverRate || 0;
  const helperRatesTotal = (formValues.helperRates || []).reduce(
    (s, h) => s + (h.rate || 0),
    0,
  );
  const manpowerTotal = driverRateAmt + helperRatesTotal;
  const totalExpenses = formValues.expenses.reduce(
    (s, e) => s + (e.amount || 0),
    0,
  );
  const grandTotal = totalExpenses + rfidAmount + fuelAmt + manpowerTotal;
  const totalFunds = budgetAmount + collectionAmount;
  const balance = totalFunds - grandTotal;
  const isOverBudget = balance < 0;
  const returnedAmount = formValues.cashOnHandReturned || 0;
  const discrepancy = returnedAmount - balance;
  const hasDiscrepancy =
    !isOverBudget && returnedAmount > 0 && Math.abs(discrepancy) > 0.01;
  const tripRateAmt = parseMoney(record?.tripRate);
  const netIncome = tripRateAmt - grandTotal;

  // ─── Table Styles ───
  const HEAD_S = {
    fillColor: WHITE,
    textColor: MUTED as [number, number, number],
    fontSize: 6.5,
    fontStyle: "bold" as const,
    cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
    lineColor: RULE as [number, number, number],
    lineWidth: { bottom: 0.3, top: 0, left: 0, right: 0 },
  };
  const BODY_S = {
    fontSize: 6.5,
    cellPadding: { top: 1.8, bottom: 1.8, left: 2, right: 2 },
    textColor: INK as [number, number, number],
    lineColor: RULE as [number, number, number],
    lineWidth: { bottom: 0.2, top: 0, left: 0, right: 0 },
    overflow: "linebreak" as const,
  };
  const ALT_S = { fillColor: ROW_ALT as [number, number, number] };
  const TOT_CB = (totalIdx: number) => (data: CellHookData) => {
    if (data.section === "body" && data.row.index === totalIdx) {
      data.cell.styles.fontStyle = "bold";
      data.cell.styles.fillColor = ROW_TOT;
      data.cell.styles.textColor = INK;
    }
  };

  // ═══════════════════════════════════════
  // HEADER (14mm)
  // ═══════════════════════════════════════
  const HEADER_H = 14;
  doc.setFillColor(...STEEL);
  doc.rect(0, 0, pageW, HEADER_H, "F");

  doc.setTextColor(...WHITE);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TRIP LIQUIDATION REPORT", ML, 9);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  let rightText = dateStr;
  if (refNumber) rightText += `  |  Ref: ${refNumber}`;
  rightText += `  |  Trip #${record.displayBookingNo ?? record.id}`;
  doc.text(rightText, pageW - MR, 9, { align: "right" });

  // ═══════════════════════════════════════
  // ROW 1: TRIP INFORMATION (Full Width, 3-Column Grid)
  // ═══════════════════════════════════════
  let y = HEADER_H + 5;
  y = sectionTitle(doc, "Trip Information", ML, y, CW);
  y = drawTripInfoGrid(doc, ML, y + 1, CW, record, formValues);

  // ═══════════════════════════════════════
  // ROW 2: BUDGET & FUNDS + MANPOWER (Side by Side)
  // ═══════════════════════════════════════
  const GAP = 5;
  const COL_W = (CW - GAP) / 2;
  const row2Y = y + 3;

  // Left: Budget & Funds
  let leftY = sectionTitle(doc, "Budget & Funds", ML, row2Y, COL_W);

  const budgetRows: (string | number)[][] = [
    ["Budget Given", asText(formValues.budgetFrom), php(budgetAmount)],
  ];
  if (collectionAmount > 0) {
    budgetRows.push(["Collection", "Customer", php(collectionAmount)]);
  }
  if (rfidAmount > 0) {
    budgetRows.push([
      "RFID Load",
      formValues.rfidPaymentType === "card" ? "Card" : "Cash",
      php(rfidAmount),
    ]);
  }
  if (fuelAmt > 0) {
    budgetRows.push([
      "Fuel",
      formValues.fuelPaymentType === "shell card" ? "Shell Card" : "Cash",
      php(fuelAmt),
    ]);
  }
  budgetRows.push(["", "Total Funds", php(totalFunds)]);
  const budgetTotalIdx = budgetRows.length - 1;

  autoTable(doc, {
    startY: leftY + 1,
    head: [["Item", "Source", "Amount"]],
    body: budgetRows,
    headStyles: HEAD_S,
    bodyStyles: BODY_S,
    alternateRowStyles: ALT_S,
    columnStyles: {
      0: { cellWidth: COL_W * 0.35 },
      1: { cellWidth: COL_W * 0.35 },
      2: { halign: "right", cellWidth: COL_W * 0.3 },
    },
    tableWidth: COL_W,
    margin: { left: ML, right: 0, bottom: 0 },
    didParseCell: TOT_CB(budgetTotalIdx),
    theme: "plain",
  });
  leftY = doc.lastAutoTable.finalY;

  // Right: Manpower Rates (if any)
  let rightY = row2Y;
  if (manpowerTotal > 0) {
    rightY = sectionTitle(
      doc,
      "Manpower Rates",
      ML + COL_W + GAP,
      row2Y,
      COL_W,
    );

    const manpowerRows: (string | number)[][] = [];
    if (driverRateAmt > 0) {
      manpowerRows.push([
        "Driver",
        formValues.driverName || record.driver || empty,
        php(driverRateAmt),
      ]);
    }
    (formValues.helperRates || [])
      .filter((h) => h.rate > 0)
      .forEach((h) => {
        manpowerRows.push(["Helper", asText(h.helperName), php(h.rate)]);
      });
    manpowerRows.push(["", "Total", php(manpowerTotal)]);
    const manpowerTotalIdx = manpowerRows.length - 1;

    autoTable(doc, {
      startY: rightY + 1,
      head: [["Role", "Name", "Rate"]],
      body: manpowerRows,
      headStyles: HEAD_S,
      bodyStyles: BODY_S,
      alternateRowStyles: ALT_S,
      columnStyles: {
        0: { cellWidth: COL_W * 0.22 },
        1: { cellWidth: COL_W * 0.48 },
        2: { halign: "right", cellWidth: COL_W * 0.3 },
      },
      tableWidth: COL_W,
      margin: { left: ML + COL_W + GAP, right: MR, bottom: 0 },
      didParseCell: TOT_CB(manpowerTotalIdx),
      theme: "plain",
    });
    rightY = doc.lastAutoTable.finalY;
  }

  y = Math.max(leftY, rightY) + 5;

  // ═══════════════════════════════════════
  // ROW 3: EXPENSES (Full Width, expands to fill space)
  // ═══════════════════════════════════════
  y = sectionTitle(doc, "Expenses", ML, y, CW);

  const expRows: (string | number)[][] = formValues.expenses.map((e, i) => [
    i + 1,
    EXPENSE_CATEGORIES.find((c) => c.value === e.expenseCategory)?.label ||
      empty,
    asText(e.assignedTo),
    php(e.amount || 0),
  ]);

  if (rfidAmount > 0) {
    expRows.push([expRows.length + 1, "RFID Load", empty, php(rfidAmount)]);
  }
  if (fuelAmt > 0) {
    expRows.push([expRows.length + 1, "Fuel", empty, php(fuelAmt)]);
  }
  if (driverRateAmt > 0) {
    expRows.push([
      expRows.length + 1,
      "Driver Rate",
      formValues.driverName || record.driver || empty,
      php(driverRateAmt),
    ]);
  }
  (formValues.helperRates || [])
    .filter((h) => h.rate > 0)
    .forEach((h) => {
      expRows.push([
        expRows.length + 1,
        "Helper Rate",
        asText(h.helperName),
        php(h.rate),
      ]);
    });

  expRows.push(["", "", "TOTAL", php(grandTotal)]);
  const expTotalIdx = expRows.length - 1;

  // Calculate available space and adjust padding
  const summaryNeeds = 45; // Approx space for summary section
  const available = SIG_Y - y - summaryNeeds - 8;
  const rowCount = expRows.length;
  const minRowH = 5; // Minimum row height
  const needed = rowCount * minRowH;

  // If we have extra space, distribute it as padding
  let extraPadding = 0;
  if (available > needed && rowCount > 1) {
    extraPadding = Math.min(3, (available - needed) / rowCount / 2);
  }

  autoTable(doc, {
    startY: y + 1,
    head: [["#", "Category", "Assigned To", "Amount"]],
    body: expRows.length > 1 ? expRows : [["", "No expenses recorded", "", ""]],
    headStyles: HEAD_S,
    bodyStyles: {
      ...BODY_S,
      cellPadding: {
        top: 1.8 + extraPadding,
        bottom: 1.8 + extraPadding,
        left: 2,
        right: 2,
      },
    },
    alternateRowStyles: ALT_S,
    columnStyles: {
      0: { cellWidth: CW * 0.06 },
      1: { cellWidth: CW * 0.4 },
      2: { cellWidth: CW * 0.27 },
      3: { halign: "right", cellWidth: CW * 0.27 },
    },
    tableWidth: CW,
    margin: { left: ML, right: MR, bottom: 0 },
    didParseCell: TOT_CB(expTotalIdx),
    theme: "plain",
  });
  y = doc.lastAutoTable.finalY + 5;

  // ═══════════════════════════════════════
  // ROW 4: FINANCIAL SUMMARY (Full Width)
  // ═══════════════════════════════════════
  y = sectionTitle(doc, "Financial Summary", ML, y, CW);

  const summaryRows: (string | number)[][] = [
    ["Total Funds", "Budget + Collection", php(totalFunds)],
    ["Total Expenses", "All costs", php(grandTotal)],
    [
      isOverBudget ? "Over Budget" : "Expected Return",
      isOverBudget ? "Expenses exceed funds" : "Funds - Expenses",
      php(Math.abs(balance)),
    ],
  ];

  if (returnedAmount > 0) {
    summaryRows.push([
      "Cash Turnover",
      formValues.cashOnHandReturnedToWhom
        ? `To ${formValues.cashOnHandReturnedToWhom}`
        : "By driver",
      php(returnedAmount),
    ]);

    summaryRows.push([
      hasDiscrepancy
        ? `Discrepancy (${discrepancy > 0 ? "Over" : "Short"})`
        : "Remittance",
      hasDiscrepancy ? "Differs from expected" : "Reconciled",
      hasDiscrepancy ? phpAccounting(discrepancy) : "Reconciled",
    ]);
  }

  if (tripRateAmt > 0) {
    summaryRows.push(["Trip Rate", "Revenue", php(tripRateAmt)]);
    summaryRows.push([
      "Net Income",
      "Rate - Expenses",
      phpAccounting(netIncome),
    ]);
  }

  const netIncomeIdx = tripRateAmt > 0 ? summaryRows.length - 1 : -1;

  autoTable(doc, {
    startY: y + 1,
    head: [["Metric", "Notes", "Amount"]],
    body: summaryRows,
    headStyles: HEAD_S,
    bodyStyles: BODY_S,
    alternateRowStyles: ALT_S,
    columnStyles: {
      0: { cellWidth: CW * 0.3 },
      1: { cellWidth: CW * 0.4 },
      2: { halign: "right", cellWidth: CW * 0.3 },
    },
    tableWidth: CW,
    margin: { left: ML, right: MR, bottom: 0 },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      if (data.row.index === 1 || data.row.index === netIncomeIdx) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = ROW_TOT;
        if (data.row.index === netIncomeIdx && netIncome < 0) {
          data.cell.styles.textColor = RED;
        } else if (data.row.index === netIncomeIdx && netIncome > 0) {
          data.cell.styles.textColor = GREEN;
        } else {
          data.cell.styles.textColor = INK;
        }
      }
    },
    theme: "plain",
  });

  // ═══════════════════════════════════════
  // SIGNATURES (Anchored to bottom of page)
  // ═══════════════════════════════════════
  const sigW = 60;
  const sigGap = 25;
  const totalSigWidth = sigW * 2 + sigGap;
  const sigStartX = (pageW - totalSigWidth) / 2;

  drawSignatureBlock(doc, sigStartX, SIG_Y, sigW, "Prepared by");
  drawSignatureBlock(
    doc,
    sigStartX + sigW + sigGap,
    SIG_Y,
    sigW,
    "Approved by",
  );

  // ═══════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════
  footer(doc, pageW, pageH, ML, MR, record.id);

  doc.save(
    `liquidation-trip-${record.client}-${record.displayBookingNo}-${Date.now}.pdf`,
  );
}
