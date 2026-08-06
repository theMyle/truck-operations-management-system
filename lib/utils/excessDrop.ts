/**
 * Helper utility for calculating Excess Drop fees based on company rules:
 * - Drops 1, 2, and 3 are standard included drops (₱0 fee).
 * - Excess drops apply when noOfDrops > 3 (Excess count = noOfDrops - 3).
 * - Own Unit / Client Rate: ₱300 per excess drop.
 * - Subcon Trucker Rate: ₱200 per excess drop.
 * - Respects custom user overrides if explicitly set.
 */

export function calculateExcessDropFee(
  noOfDrops: number | string | undefined | null,
  isSubcon: boolean = false,
  customRate?: string | number | null
): number {
  // 1. If user explicitly entered/saved a custom excess drop rate, use it!
  if (customRate !== undefined && customRate !== null && customRate !== "") {
    const parsed = Number(customRate);
    if (!isNaN(parsed)) return Math.max(0, parsed);
  }

  // 2. Otherwise calculate based on threshold > 3 drops
  const drops = Number(noOfDrops) || 1;
  if (drops <= 3) return 0;

  const excessCount = drops - 3;
  const ratePerExcessDrop = isSubcon ? 200 : 300;
  return excessCount * ratePerExcessDrop;
}
