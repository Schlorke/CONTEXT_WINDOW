import { ProductList } from "../components/ProductList";
import { products } from "../data/products";
import { useCart } from "../hooks/useCart";

export default function Home() {
  const cart = useCart();
  return (
    <main>
      <h1>Loja</h1>
      <ProductList items={products} onAdd={cart.add} />
      <p>Itens no carrinho: {cart.count}</p>
    </main>
  );
}
