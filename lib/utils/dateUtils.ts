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
 * - For months before operationsStartDate: 0 (company wasn't operating yet).
 * - For the operations-start month: partial days from the start date to month end.
 * - For the current, still-in-progress month: partial days from month start (or
 *   operations start, if that's later) up to and including today — NOT the full
 *   month, since the remaining days haven't happened yet and would otherwise
 *   understate utilization/capacity metrics that are computed against this value.
 * - For any other (fully completed, past) month: the full number of days in that month.
 */
export function getActiveDaysInMonth(
  year: number,
  month: number, // 1-12
  operationsStartDate?: string | null // "YYYY-MM-DD"
): number {
  const daysInFullMonth = new Date(year, month, 0).getDate();
  const monthPrefix = `${year}-${String(month).padStart(2, "0")}`;

  let startDay = 1;
  if (operationsStartDate) {
    const startYearMonth = operationsStartDate.slice(0, 7);
    if (monthPrefix < startYearMonth) return 0;
    if (monthPrefix === startYearMonth) {
      startDay = Number(operationsStartDate.slice(8, 10));
    }
  }

  const today = new Date();
  const todayYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const endDay = monthPrefix === todayYearMonth ? today.getDate() : daysInFullMonth;

  return Math.max(0, endDay - startDay + 1);
}
