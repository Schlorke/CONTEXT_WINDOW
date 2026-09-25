import { formatPrice } from "../utils/format";
import { Button } from "./Button";

export function ProductList({ items, onAdd }: { items: { id: string; name: string; priceCents: number }[]; onAdd: (id: string) => void }) {
  return (
    <ul>
      {items.map((p) => (
        <li key={p.id}>
          <span>{p.name}</span> <span>{formatPrice(p.priceCents)}</span> <Button label="Adicionar" onClick={() => onAdd(p.id)} />
        </li>
      ))}
    </ul>
  );
}
