import { typography, type TextSize, type ThemeColors } from "@acme/design-tokens";

export type TextTone = "default" | "muted" | "danger";

export interface TextProps {
  children: string | number | Array<string | number>;
  size?: TextSize;
  tone?: TextTone;
  /** Renders a heading (h1-h3 on web, accessibilityRole="header" on native). */
  heading?: 1 | 2 | 3;
}

export function resolveTextStyle(theme: ThemeColors, size: TextSize, tone: TextTone, heading?: number) {
  return {
    color: tone === "muted" ? theme.textMuted : tone === "danger" ? theme.danger : theme.text,
    fontSize: typography.size[size],
    lineHeight: typography.lineHeight[size],
    fontWeight: heading ? typography.weight.semibold : typography.weight.regular,
  } as const;
}
