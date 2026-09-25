import { View } from "react-native";
import { resolveStackStyle, type StackProps } from "../contract/stack";
import { useTheme } from "../theme/ThemeProvider";

export function Stack(props: StackProps) {
  const s = resolveStackStyle(useTheme(), props);
  return <View style={s}>{props.children}</View>;
}
