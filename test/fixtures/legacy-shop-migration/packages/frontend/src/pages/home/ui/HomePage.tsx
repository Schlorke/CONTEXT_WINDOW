import { Stack, Text } from "../../../shared/ui";
import { ProductList } from "../../../widgets/product-list";
import { getProducts } from "../api/products";

export function HomePage() {
  return (
    <Stack padding="xl" gap="lg">
      <Text heading={1} size="xl">
        Loja
      </Text>
      <ProductList items={getProducts()} />
    </Stack>
  );
}
