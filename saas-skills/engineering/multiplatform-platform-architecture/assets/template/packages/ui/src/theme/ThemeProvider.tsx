"use client";
import { createContext, useContext, type ReactNode } from "react";
import { themes, type ThemeColors } from "@acme/design-tokens";

const ThemeContext = createContext<ThemeColors>(themes.light);

export function ThemeProvider({ scheme = "light", children }: { scheme?: "light" | "dark"; children: ReactNode }) {
  return <ThemeContext.Provider value={themes[scheme]}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeColors {
  return useContext(ThemeContext);
}
