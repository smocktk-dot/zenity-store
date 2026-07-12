export function calcDiscount(totalPurchases: number): number {
  if (totalPurchases >= 20) return 50;
  if (totalPurchases >= 10) return 40;
  return 35;
}
