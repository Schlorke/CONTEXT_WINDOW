export interface Product {
  id: string;
  name: string;
  priceCents: number;
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
