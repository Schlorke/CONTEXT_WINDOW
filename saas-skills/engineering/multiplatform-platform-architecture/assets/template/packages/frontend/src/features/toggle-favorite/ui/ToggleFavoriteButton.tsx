"use client";
import { useReducer } from "react";
import { Button } from "../../../shared/ui";
import { favoriteReducer } from "../model/favorite";

export function ToggleFavoriteButton({ initialFavorite = false }: { initialFavorite?: boolean }) {
  const [state, dispatch] = useReducer(favoriteReducer, { favorite: initialFavorite });
  return (
    <Button
      testID="toggle-favorite"
      variant={state.favorite ? "secondary" : "primary"}
      label={state.favorite ? "Remover dos favoritos" : "Favoritar"}
      onPress={() => dispatch({ type: "toggle" })}
    />
  );
}
