import { ActivityIndicator, Pressable, Text } from "react-native";
import { resolveButtonStyle, type ButtonProps } from "../contract/button";
import { useTheme } from "../theme/ThemeProvider";

export function Button({ label, onPress, variant = "primary", disabled, loading, loadingLabel = "Loading…", testID }: ButtonProps) {
  const s = resolveButtonStyle(useTheme(), variant, { disabled, loading });
  const inactive = Boolean(disabled || loading);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={loading ? loadingLabel : label}
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: s.backgroundColor,
        borderColor: s.borderColor,
        borderWidth: s.borderWidth,
        opacity: pressed ? 0.85 : s.opacity,
        paddingVertical: s.paddingVertical,
        paddingHorizontal: s.paddingHorizontal,
        borderRadius: s.borderRadius,
        flexDirection: "row",
        alignItems: "center",
        gap: s.gap,
      })}
    >
      {loading ? <ActivityIndicator color={s.color} /> : null}
      <Text style={{ color: s.color, fontSize: s.fontSize, fontWeight: s.fontWeight }}>{loading ? loadingLabel : label}</Text>
    </Pressable>
  );
}
