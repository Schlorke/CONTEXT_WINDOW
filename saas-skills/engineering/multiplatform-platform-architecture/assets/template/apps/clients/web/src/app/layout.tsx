import type { ReactNode } from "react";
import { AppProviders } from "@acme/frontend/app";

export const metadata = { title: "Acme", description: "Acme web client" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0 }}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
