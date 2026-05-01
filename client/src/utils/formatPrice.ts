export const formatPrice = (price: number | null | undefined, currency = 'FCFA'): string => {
  return `${(price ?? 0).toLocaleString('fr-FR')} ${currency}`;
};

export const getDiscountPercent = (price: number, compareAt: number): number => {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
};
