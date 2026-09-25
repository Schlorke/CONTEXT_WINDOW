"use client";
import { resolveStackStyle, type StackProps } from "../contract/stack";
import { useTheme } from "../theme/ThemeProvider";

export function Stack(props: StackProps) {
  const s = resolveStackStyle(useTheme(), props);
  return (
    <div style={{ display: "flex", flexDirection: s.flexDirection, gap: s.gap, padding: s.padding, backgroundColor: s.backgroundColor, border: `${s.borderWidth}px solid ${s.borderColor}`, borderRadius: s.borderRadius }}>
      {props.children}
    </div>
  );
}
