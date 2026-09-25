import { useReducer } from "react";

export function cartReducer(state: { count: number }, _productId: string) {
  return { count: state.count + 1 };
}

export function useCart() {
  const [state, add] = useReducer(cartReducer, { count: 0 });
  return { count: state.count, add };
}
