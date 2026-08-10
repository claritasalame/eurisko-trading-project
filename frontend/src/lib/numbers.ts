export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function formatPrice(value: unknown): string {
  return isFiniteNumber(value) ? `$${value.toFixed(2)}` : "—";
}

export function formatPercent(value: unknown): string {
  return isFiniteNumber(value) ? `${Math.abs(value).toFixed(2)}%` : "—";
}

export function formatChartValue(value: unknown): string {
  return isFiniteNumber(value) ? value.toFixed(2) : "—";
}
