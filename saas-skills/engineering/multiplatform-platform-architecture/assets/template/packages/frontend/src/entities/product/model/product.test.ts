import { describe, expect, it } from "vitest";
import { formatPrice } from "./product";

describe("formatPrice", () => {
  it("formats cents as currency", () => {
    expect(formatPrice(1290, "BRL")).toMatch(/^R\$\s12,90$/);
  });
});
