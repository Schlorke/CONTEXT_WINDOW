import { Stack, Text } from "../../../shared/ui";
import { ProductHighlight } from "../../../widgets/product-highlight";
import { getHighlightedProduct } from "../api/sample-product";

export function HomePage() {
  return (
    <Stack padding="xl" gap="lg">
      <Text heading={1} size="xl">
        Acme
      </Text>
      <ProductHighlight product={getHighlightedProduct()} />
    </Stack>
  );
}
