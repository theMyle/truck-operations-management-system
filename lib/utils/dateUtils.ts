/**
 * Calculates the week number of the month for a given Date.
 * (e.g., Week 1, Week 2, etc.)
 */
export function getWeekOfMonth(date: Date): number {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  return Math.ceil((date.getDate() + firstDayOfWeek) / 7);
}

/**
 * Returns the number of active operating days in a given month.
 * If operationsStartDate is provided, returns partial days for start month,
 * 0 for months before start month, or full days otherwise.
 */
export function getActiveDaysInMonth(
  year: number,
  month: number, // 1-12
  operationsStartDate?: string | null // "YYYY-MM-DD"
): number {
  const daysInFullMonth = new Date(year, month, 0).getDate();
  if (!operationsStartDate) return daysInFullMonth;

  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;
  const startYearMonth = operationsStartDate.slice(0, 7);

  if (monthPrefix < startYearMonth) return 0;
  if (monthPrefix === startYearMonth) {
    return daysInFullMonth - Number(operationsStartDate.slice(8, 10)) + 1;
  }
  return daysInFullMonth;
}
