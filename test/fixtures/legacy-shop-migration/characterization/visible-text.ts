export function visibleText(html: string): string[] {
  return html
    .replace(/<[^>]+>/g, "\n")
    .split("\n")
    .map((s) => s.replace(/&nbsp;|\u00a0/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
