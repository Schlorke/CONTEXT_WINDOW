"use client";
import type { ReactNode } from "react";
import { ThemeProvider } from "../../shared/ui";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ThemeProvider scheme="light">{children}</ThemeProvider>;
}
