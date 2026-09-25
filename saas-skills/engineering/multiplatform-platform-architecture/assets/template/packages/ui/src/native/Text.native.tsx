import { Text as RNText } from "react-native";
import { resolveTextStyle, type TextProps } from "../contract/text";
import { useTheme } from "../theme/ThemeProvider";

export function Text({ children, size = "md", tone = "default", heading }: TextProps) {
  const s = resolveTextStyle(useTheme(), size, tone, heading);
  return (
    <RNText accessibilityRole={heading ? "header" : undefined} style={s}>
      {children}
    </RNText>
  );
}
