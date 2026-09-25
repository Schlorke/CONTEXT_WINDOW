// Canonical design tokens. Both clients read these values through @acme/ui; no client
// defines its own colors, spacing or type scale.
export const palette = {
  brand500: "#2563EB",
  brand600: "#1D4ED8",
  neutral0: "#FFFFFF",
  neutral50: "#F8FAFC",
  neutral300: "#CBD5E1",
  neutral700: "#334155",
  neutral900: "#0F172A",
  danger600: "#DC2626",
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  border: string;
  danger: string;
  focus: string;
}

export const themes: Record<"light" | "dark", ThemeColors> = {
  light: {
    background: palette.neutral50,
    surface: palette.neutral0,
    text: palette.neutral900,
    textMuted: palette.neutral700,
    primary: palette.brand600,
    onPrimary: palette.neutral0,
    secondary: palette.neutral0,
    onSecondary: palette.brand600,
    border: palette.neutral300,
    danger: palette.danger600,
    focus: palette.brand500,
  },
  dark: {
    background: palette.neutral900,
    surface: "#1E293B",
    text: palette.neutral50,
    textMuted: palette.neutral300,
    primary: palette.brand500,
    onPrimary: palette.neutral0,
    secondary: "#1E293B",
    onSecondary: palette.neutral50,
    border: palette.neutral700,
    danger: "#F87171",
    focus: palette.neutral300,
  },
};

export const space = { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 6, md: 10 } as const;
export const border = { none: 0, hairline: 1 } as const;
export const typography = {
  size: { sm: 14, md: 16, lg: 20, xl: 28 },
  weight: { regular: "400", semibold: "600" },
  lineHeight: { sm: 20, md: 24, lg: 28, xl: 36 },
} as const;

export type SpaceToken = keyof typeof space;
export type TextSize = keyof typeof typography.size;
