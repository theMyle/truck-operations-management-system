/**
 * Standard Cash Advance & Expense Parsing Utilities
 */

export interface ParsedCashAdvance {
  isCashAdvance: boolean;
  employeeName: string;
  role: "Driver" | "Helper" | "Trucker" | null;
}

/**
 * Parses an expense type string (e.g. "Cash Advance, Juan Dela Cruz (Driver)")
 * into structured information.
 */
export function parseCashAdvanceExpense(
  expenseType: string | null | undefined
): ParsedCashAdvance {
  if (!expenseType || typeof expenseType !== "string" || !expenseType.trim()) {
    return { isCashAdvance: false, employeeName: "", role: null };
  }

  const trimmed = expenseType.trim();
  const isCA = /^Cash Advance/i.test(trimmed);
  if (!isCA) {
    return { isCashAdvance: false, employeeName: trimmed, role: null };
  }

  const match = trimmed.match(/^Cash Advance(?:,\s*|\s+)(.*?)(?:\s*\((Driver|Helper|Trucker)\))?$/i);
  if (match) {
    return {
      isCashAdvance: true,
      employeeName: match[1]?.trim() || "",
      role: (match[2] as "Driver" | "Helper" | "Trucker") || null,
    };
  }

  const cleaned = trimmed
    .replace(/^Cash Advance,\s*/i, "")
    .replace(/\s*\((Driver|Helper|Trucker)\)$/i, "")
    .trim();

  return {
    isCashAdvance: true,
    employeeName: cleaned,
    role: null,
  };
}
