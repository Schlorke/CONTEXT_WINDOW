import { Stack } from "expo-router";
import { AppProviders } from "@acme/frontend/app";

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProviders>
  );
}
