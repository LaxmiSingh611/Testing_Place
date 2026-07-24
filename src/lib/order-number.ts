export function generateOrderNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, "0");
  return `ORD-${y}${m}${d}-${suffix}`;
}
