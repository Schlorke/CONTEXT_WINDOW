import type { Product } from "../../../entities/product";

// Placeholder data source for the template; replace with the real API call of the product.
export function getHighlightedProduct(): Product {
  return { id: "sample", name: "Produto de exemplo", priceCents: 1290, currency: "BRL" };
}
