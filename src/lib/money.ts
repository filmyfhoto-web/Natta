/** All prices are stored as integer satang (1 THB = 100 satang) to avoid float rounding. */

export function baht(satang: number): string {
  return (satang / 100).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function bahtToSatang(baht: number | string): number {
  const n = typeof baht === "string" ? Number(baht) : baht;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}
