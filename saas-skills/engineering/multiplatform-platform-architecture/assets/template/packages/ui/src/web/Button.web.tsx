"use client";
import { resolveButtonStyle, type ButtonProps } from "../contract/button";
import { useTheme } from "../theme/ThemeProvider";

export function Button({ label, onPress, variant = "primary", disabled, loading, loadingLabel = "Loading…", testID }: ButtonProps) {
  const s = resolveButtonStyle(useTheme(), variant, { disabled, loading });
  const inactive = Boolean(disabled || loading);
  return (
    <button
      type="button"
      data-testid={testID}
      onClick={inactive ? undefined : onPress}
      disabled={inactive}
      aria-disabled={inactive || undefined}
      aria-busy={loading || undefined}
      style={{
        backgroundColor: s.backgroundColor,
        color: s.color,
        border: `${s.borderWidth}px solid ${s.borderColor}`,
        opacity: s.opacity,
        padding: `${s.paddingVertical}px ${s.paddingHorizontal}px`,
        borderRadius: s.borderRadius,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        cursor: inactive ? "not-allowed" : "pointer",
      }}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
