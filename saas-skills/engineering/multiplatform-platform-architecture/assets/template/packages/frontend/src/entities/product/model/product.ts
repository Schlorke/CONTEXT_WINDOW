export interface Product {
  id: string;
  name: string;
  priceCents: number;
  currency: "BRL" | "USD";
}

export function formatPrice(priceCents: number, currency: Product["currency"], locale = "pt-BR"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(priceCents / 100);
}
