import { ProductCard, type Product } from "../../../entities/product";
import { ToggleFavoriteButton } from "../../../features/toggle-favorite";
import { Stack } from "../../../shared/ui";

export function ProductHighlight({ product }: { product: Product }) {
  return (
    <Stack surface padding="lg" gap="md">
      <ProductCard product={product} />
      <ToggleFavoriteButton />
    </Stack>
  );
}
