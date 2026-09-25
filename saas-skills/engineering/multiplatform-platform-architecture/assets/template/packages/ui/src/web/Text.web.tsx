"use client";
import { resolveTextStyle, type TextProps } from "../contract/text";
import { useTheme } from "../theme/ThemeProvider";

export function Text({ children, size = "md", tone = "default", heading }: TextProps) {
  const s = resolveTextStyle(useTheme(), size, tone, heading);
  const Tag = heading ? (`h${heading}` as "h1" | "h2" | "h3") : "p";
  return <Tag style={{ margin: 0, ...s }}>{children}</Tag>;
}
