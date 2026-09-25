import { themes } from "@acme/design-tokens";
import { describe, expect, it } from "vitest";
import { resolveButtonStyle } from "./button";

describe("resolveButtonStyle", () => {
  it("takes colors from the canonical tokens", () => {
    expect(resolveButtonStyle(themes.light, "primary", {}).backgroundColor).toBe(themes.light.primary);
    expect(resolveButtonStyle(themes.dark, "secondary", {}).color).toBe(themes.dark.onSecondary);
  });
  it("dims disabled and loading states", () => {
    expect(resolveButtonStyle(themes.light, "primary", { disabled: true }).opacity).toBeLessThan(1);
    expect(resolveButtonStyle(themes.light, "primary", { loading: true }).opacity).toBeLessThan(1);
    expect(resolveButtonStyle(themes.light, "primary", {}).opacity).toBe(1);
  });
});
