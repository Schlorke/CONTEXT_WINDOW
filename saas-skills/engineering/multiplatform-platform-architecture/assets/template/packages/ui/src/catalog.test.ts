import { describe, expect, it } from "vitest";
import * as ui from "./index.web";

describe("component catalog", () => {
  it("has an entry for every exported component", () => {
    const components = Object.keys(ui).filter((k) => /^[A-Z]/.test(k) && k !== "ThemeProvider");
    expect(components.sort()).toEqual(Object.keys(ui.catalog).sort());
  });
});
