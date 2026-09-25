import type { Product } from "../../../entities/product";

export function getProducts(): Product[] {
  return [
    { id: "cafe", name: "Café", priceCents: 1290 },
    { id: "pao", name: "Pão", priceCents: 500 },
  ];
}
