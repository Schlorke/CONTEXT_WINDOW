// Style resolution of the native Button: react-native is replaced by host components that record
// the props they receive, so the test sees the exact style object the component hands to React
// Native. This proves style resolution, not native rendering on a device.
import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { themes } from "@acme/design-tokens";

const recorded = vi.hoisted(() => ({ calls: [] as Array<{ host: string; props: Record<string, unknown> }> }));

vi.mock("react-native", () => {
  const host = (name: string) =>
    function Host(props: Record<string, unknown> & { children?: ReactNode }) {
      const style = typeof props.style === "function" ? (props.style as (s: { pressed: boolean }) => unknown)({ pressed: false }) : props.style;
      recorded.calls.push({ host: name, props: { ...props, style } });
      return createElement(`rn-${name.toLowerCase()}`, null, props.children);
    };
  return { Pressable: host("Pressable"), Text: host("Text"), ActivityIndicator: host("ActivityIndicator"), View: host("View") };
});

const { ThemeProvider } = await import("../theme/ThemeProvider");
const { Button } = await import("./Button.native");

const styleOf = (host: string) => recorded.calls.find((c) => c.host === host)?.props.style as Record<string, unknown> | undefined;

describe("Button (native) style resolution", () => {
  beforeEach(() => {
    recorded.calls = [];
  });
  it("hands React Native the primary background and label color from the canonical tokens", () => {
    renderToStaticMarkup(createElement(ThemeProvider, null, createElement(Button, { label: "Salvar" })));
    const pressable = styleOf("Pressable");
    const text = styleOf("Text");
    expect(String(pressable?.backgroundColor).toUpperCase()).toBe(themes.light.primary.toUpperCase());
    expect(String(text?.color).toUpperCase()).toBe(themes.light.onPrimary.toUpperCase());
    if (process.env.EXPECT_PRIMARY) expect(String(pressable?.backgroundColor).toUpperCase()).toBe(process.env.EXPECT_PRIMARY.toUpperCase());
  });
  it("exposes the disabled state to accessibility services", () => {
    renderToStaticMarkup(createElement(ThemeProvider, null, createElement(Button, { label: "Salvar", disabled: true })));
    expect(recorded.calls.find((c) => c.host === "Pressable")?.props.accessibilityState).toEqual({ disabled: true, busy: false });
  });
});
