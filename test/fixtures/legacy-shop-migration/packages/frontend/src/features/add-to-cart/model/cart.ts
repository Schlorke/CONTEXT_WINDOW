export interface CartState {
  count: number;
}

export function cartReducer(state: CartState, _productId: string): CartState {
  return { count: state.count + 1 };
}
