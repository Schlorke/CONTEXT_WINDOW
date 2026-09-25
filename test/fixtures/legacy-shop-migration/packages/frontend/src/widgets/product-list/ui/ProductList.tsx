"use client";
import { useReducer } from "react";
import { ProductRow, type Product } from "../../../entities/product";
import { AddToCartButton, cartReducer } from "../../../features/add-to-cart";
import { Stack, Text } from "../../../shared/ui";

export function ProductList({ items }: { items: Product[] }) {
  const [cart, add] = useReducer(cartReducer, { count: 0 });
  return (
    <Stack gap="md">
      {items.map((p) => (
        <ProductRow key={p.id} product={p} action={<AddToCartButton productId={p.id} onAdd={add} />} />
      ))}
      <Text>{`Itens no carrinho: ${cart.count}`}</Text>
    </Stack>
  );
}
