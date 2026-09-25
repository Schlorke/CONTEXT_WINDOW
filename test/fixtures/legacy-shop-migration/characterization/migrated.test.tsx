import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppProviders } from "../packages/frontend/src/app";
import { formatPrice } from "../packages/frontend/src/entities/product";
import { cartReducer } from "../packages/frontend/src/features/add-to-cart";
import { HomePage } from "../packages/frontend/src/pages/home";
import cases from "./cases.json";
import { visibleText } from "./visible-text";

describe("migrated characterization (same cases as legacy)", () => {
  it.each(cases.formatPrice)("formatPrice(%o)", (c) => expect(formatPrice(c.cents).replace(/\u00a0/g, " ")).toBe(c.expected));
  it.each(cases.cart)("cart %o", (c) => expect(c.actions.reduce((s, id) => cartReducer(s, id), { count: 0 }).count).toBe(c.expectedCount));
  it("home renders the characterized text", () =>
    expect(visibleText(renderToStaticMarkup(<AppProviders><HomePage /></AppProviders>))).toEqual(cases.homeText));
});
