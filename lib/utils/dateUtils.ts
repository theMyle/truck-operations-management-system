/**
 * Calculates the week number of the month for a given Date.
 * (e.g., Week 1, Week 2, etc.)
 */
export function getWeekOfMonth(date: Date): number {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  return Math.ceil((date.getDate() + firstDayOfWeek) / 7);
}
