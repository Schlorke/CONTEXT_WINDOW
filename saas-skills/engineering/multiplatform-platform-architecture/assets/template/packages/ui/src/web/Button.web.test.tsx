import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { themes } from "@acme/design-tokens";
import { ThemeProvider } from "../theme/ThemeProvider";
import { Button } from "./Button.web";

const render = (el: ReactElement) => renderToStaticMarkup(<ThemeProvider>{el}</ThemeProvider>);
const background = (html: string) => html.match(/background-color:\s*([^;"]+)/)?.[1]?.trim().toUpperCase();

describe("Button (web)", () => {
  it("renders a native button with the label", () => {
    const html = render(<Button label="Salvar" />);
    expect(html).toMatch(/^<button type="button"/);
    expect(html).toContain(">Salvar<");
  });
  it("exposes disabled and busy states to assistive technology", () => {
    expect(render(<Button label="Salvar" disabled />)).toContain('aria-disabled="true"');
    const loading = render(<Button label="Salvar" loading />);
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain("disabled");
  });
  it("renders the primary background from the canonical token", () => {
    const rendered = background(render(<Button label="Salvar" />));
    expect(rendered).toBe(themes.light.primary.toUpperCase());
    if (process.env.EXPECT_PRIMARY) expect(rendered).toBe(process.env.EXPECT_PRIMARY.toUpperCase());
  });
});
