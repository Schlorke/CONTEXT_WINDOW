export interface FavoriteState {
  favorite: boolean;
}

export type FavoriteAction = { type: "toggle" };

export function favoriteReducer(state: FavoriteState, action: FavoriteAction): FavoriteState {
  switch (action.type) {
    case "toggle":
      return { favorite: !state.favorite };
    default: {
      const exhaustive: never = action.type;
      return exhaustive;
    }
  }
}
