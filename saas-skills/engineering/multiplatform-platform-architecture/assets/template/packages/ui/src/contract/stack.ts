import { border, radius, space, type SpaceToken, type ThemeColors } from "@acme/design-tokens";
import type { ReactNode } from "react";

export interface StackProps {
  children?: ReactNode;
  direction?: "row" | "column";
  gap?: SpaceToken;
  padding?: SpaceToken;
  surface?: boolean;
}

export function resolveStackStyle(theme: ThemeColors, props: StackProps) {
  return {
    flexDirection: props.direction ?? "column",
    gap: space[props.gap ?? "md"],
    padding: space[props.padding ?? "none"],
    backgroundColor: props.surface ? theme.surface : "transparent",
    borderColor: props.surface ? theme.border : "transparent",
    borderWidth: props.surface ? border.hairline : border.none,
    borderRadius: radius.md,
  } as const;
}
