import { Stack, Text } from "../../../shared/ui";
import { formatPrice, type Product } from "../model/product";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Stack gap="xs">
      <Text heading={3} size="lg">
        {product.name}
      </Text>
      <Text tone="muted">{formatPrice(product.priceCents, product.currency)}</Text>
    </Stack>
  );
}
