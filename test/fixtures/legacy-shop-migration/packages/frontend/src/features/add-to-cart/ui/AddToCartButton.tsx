"use client";
import { Button } from "../../../shared/ui";

export function AddToCartButton({ productId, onAdd }: { productId: string; onAdd: (id: string) => void }) {
  return <Button label="Adicionar" onPress={() => onAdd(productId)} />;
}
