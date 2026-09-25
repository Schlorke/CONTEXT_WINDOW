import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "../pages/index";
import { cartReducer } from "../hooks/useCart";
import { formatPrice } from "../utils/format";
import cases from "./cases.json";
import { visibleText } from "./visible-text";

describe("legacy characterization", () => {
  it.each(cases.formatPrice)("formatPrice(%o)", (c) => expect(formatPrice(c.cents).replace(/\u00a0/g, " ")).toBe(c.expected));
  it.each(cases.cart)("cart %o", (c) => expect(c.actions.reduce((s, id) => cartReducer(s, id), { count: 0 }).count).toBe(c.expectedCount));
  it("home renders the characterized text", () => expect(visibleText(renderToStaticMarkup(<Home />))).toEqual(cases.homeText));
});
