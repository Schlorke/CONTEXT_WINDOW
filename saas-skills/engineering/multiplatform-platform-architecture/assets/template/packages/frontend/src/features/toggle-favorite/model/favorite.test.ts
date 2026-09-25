import { describe, expect, it } from "vitest";
import { favoriteReducer } from "./favorite";

describe("favoriteReducer", () => {
  it("toggles and returns to the original state", () => {
    const once = favoriteReducer({ favorite: false }, { type: "toggle" });
    expect(once.favorite).toBe(true);
    expect(favoriteReducer(once, { type: "toggle" }).favorite).toBe(false);
  });
});
