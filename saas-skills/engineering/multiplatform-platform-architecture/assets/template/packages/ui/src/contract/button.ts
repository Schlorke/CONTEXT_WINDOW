import { border, radius, space, typography, type ThemeColors } from "@acme/design-tokens";

export type ButtonVariant = "primary" | "secondary";

/** Public contract shared by Button.web.tsx and Button.native.tsx. */
export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  testID?: string;
}

export interface ButtonStyle {
  backgroundColor: string;
  color: string;
  borderColor: string;
  borderWidth: number;
  gap: number;
  opacity: number;
  paddingVertical: number;
  paddingHorizontal: number;
  borderRadius: number;
  fontSize: number;
  fontWeight: "400" | "600";
}

/** Platform-agnostic style resolution from tokens; every platform variant uses this. */
export function resolveButtonStyle(theme: ThemeColors, variant: ButtonVariant, state: { disabled?: boolean; loading?: boolean }): ButtonStyle {
  const primary = variant === "primary";
  return {
    backgroundColor: primary ? theme.primary : theme.secondary,
    color: primary ? theme.onPrimary : theme.onSecondary,
    borderColor: primary ? theme.primary : theme.border,
    borderWidth: border.hairline,
    gap: space.sm,
    opacity: state.disabled || state.loading ? 0.6 : 1,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
  };
}
