import type { ReactNode } from "react";
import { Stack, Text } from "../../../shared/ui";
import { formatPrice, type Product } from "../model/product";

export function ProductRow({ product, action }: { product: Product; action?: ReactNode }) {
  return (
    <Stack direction="row" gap="sm">
      <Text>{product.name}</Text>
      <Text tone="muted">{formatPrice(product.priceCents)}</Text>
      {action}
    </Stack>
  );
}
