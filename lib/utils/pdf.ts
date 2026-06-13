import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DispatchRecord } from "@/app/(app)/constant";
import { NewTripDetailsFormData } from "@/components/trip-logs/TripDetailsModal";
import { EXPENSE_CATEGORIES } from "@/components/trip-logs/ExpensesTab";

interface JsPDFWithPlugin extends jsPDF {
    lastAutoTable: { finalY: number };
}

export function generateLiquidationPDF(
    record: DispatchRecord,
    formValues: NewTripDetailsFormData,
    refNumber?: string
) {
    const doc = new jsPDF() as JsPDFWithPlugin;
    const pageW = doc.internal.pageSize.getWidth();

    // Header Band
    doc.setFillColor(25, 113, 194);
    doc.rect(0, 0, pageW, 22, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("TRIP LIQUIDATION REPORT", 14, 14);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    // Date and Ref No right-aligned
    doc.text(
        `Generated: ${new Date().toLocaleDateString("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })}`,
        pageW - 14,
        10,
        { align: "right" }
    );
    if (refNumber) {
        doc.text(`Ref No: ${refNumber}`, pageW - 14, 16, { align: "right" });
    }

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(8);
    const meta: [string, string][] = [
        [`Trip #: ${record.id}`, `Date: ${record.date}`],
        [`Client: ${record.client}`, `Driver: ${record.driver}`],
        [`Route: ${record.ruta || "—"}`, `Plate #: ${record.plateNo || "—"}`],
        [`Trucker: ${record.trucker || "—"}`, `Helper: ${record.helper || "—"}`],
    ];
    let y = 30;
    meta.forEach(([left, right]) => {
        doc.setFont("helvetica", "bold");
        doc.text(left, 14, y);
        doc.text(right, pageW / 2, y);
        y += 6;
    });

    const budgetAmount = formValues.budget || 0;
    const collectionAmount = formValues.collectionFromCustomer || 0;
    const rfidAmount = formValues.rfidLoad || 0;
    const fuelAmt = formValues.fuelAmount || 0;
    const totalExpenses = formValues.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const grandTotal = totalExpenses + rfidAmount + fuelAmt;
    const totalFunds = budgetAmount + collectionAmount;
    const balance = totalFunds - grandTotal;
    const isOverBudget = balance < 0;

    autoTable(doc, {
        startY: y + 4,
        head: [["Budget Received", "From", "Amount"]],
        body: [
            [
                "Budget Given",
                formValues.budgetFrom || "—",
                `PHP ${budgetAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            ],
        ],
        headStyles: { fillColor: [25, 113, 194], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 2: { halign: "right", fontStyle: "bold" } },
        theme: "grid",
    });

    const expenseRows: (string | number)[][] = formValues.expenses.map(
        (e, i) => [
            i + 1,
            EXPENSE_CATEGORIES.find((c) => c.value === e.expenseCategory)?.label || "—",
            e.assignedTo || "—",
            `PHP ${e.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        ],
    );

    if (rfidAmount > 0) {
        expenseRows.push([
            expenseRows.length + 1,
            `RFID Load (${formValues.rfidPaymentType === "card" ? "Card" : formValues.rfidPaymentType === "cash" ? "Cash" : "—"})`,
            "—",
            `PHP ${rfidAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        ]);
    }

    if (fuelAmt > 0) {
        expenseRows.push([
            expenseRows.length + 1,
            `Fuel (${formValues.fuelPaymentType === "shell card" ? "Shell Card" : formValues.fuelPaymentType === "cash" ? "Cash" : "—"})`,
            "—",
            `PHP ${fuelAmt.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        ]);
    }

    expenseRows.push([
        "",
        "",
        "TOTAL EXPENSES",
        `PHP ${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
    ]);

    const totalRowIndex = expenseRows.length - 1;

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [["#", "Category", "Assigned To", "Amount"]],
        body:
            expenseRows.length > 1
                ? expenseRows
                : [["", "No expenses recorded", "", ""]],
        headStyles: { fillColor: [25, 113, 194], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 8 },
        columnStyles: { 3: { halign: "right" } },
        didParseCell: (data) => {
            if (data.section === "body" && data.row.index === totalRowIndex) {
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.fillColor = [230, 244, 255];
            }
        },
        theme: "grid",
    });

    autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 8,
        head: [["Summary", "Amount"]],
        body: [
            [
                "Budget Given",
                `PHP ${budgetAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            ],
            ...(collectionAmount > 0
                ? [
                      [
                          "Collection from Customer",
                          `PHP ${collectionAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
                      ],
                  ]
                : []),
            ...(collectionAmount > 0
                ? [
                      [
                          "Total Funds",
                          `PHP ${totalFunds.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
                      ],
                  ]
                : []),
            [
                "Total Expenses",
                `PHP ${grandTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            ],
            [
                isOverBudget ? "Over Budget" : "CASH ONHAND RETURNED",
                `PHP ${Math.abs(balance).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
            ],
        ],
        headStyles: { fillColor: [25, 113, 194], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 9 },
        columnStyles: { 1: { halign: "right" } },
        didParseCell: (data) => {
            const lastRowIndex = collectionAmount > 0 ? 4 : 2;
            if (data.section === "body" && data.row.index === lastRowIndex) {
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.textColor = isOverBudget ? [192, 0, 0] : [0, 128, 0];
                data.cell.styles.fillColor = isOverBudget
                    ? [255, 245, 245]
                    : [240, 255, 244];
            }
        },
        theme: "grid",
    });

    const sigY = doc.lastAutoTable.finalY + 20;
    doc.setDrawColor(150);
    doc.setFontSize(8);
    doc.setTextColor(100);
    const sigLines: [number, string][] = [
        [14, "Prepared by"],
        [pageW / 2 + 10, "Approved by"],
    ];
    sigLines.forEach(([x, label]) => {
        doc.line(x, sigY, x + 70, sigY);
        doc.text(label, x, sigY + 5);
    });

    doc.save(`liquidation-trip-${record.id}.pdf`);
}
