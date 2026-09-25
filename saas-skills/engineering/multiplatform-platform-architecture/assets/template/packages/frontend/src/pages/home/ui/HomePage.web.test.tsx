import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AppProviders } from "../../../app";
import { HomePage } from "./HomePage";

describe("HomePage (web render)", () => {
  it("composes entity, feature and widget through public APIs", () => {
    const html = renderToStaticMarkup(
      <AppProviders>
        <HomePage />
      </AppProviders>,
    );
    expect(html).toContain("<h1");
    expect(html).toContain("Produto de exemplo");
    expect(html).toMatch(/R\$.12,90/);
    expect(html).toContain(">Favoritar<");
  });
});
