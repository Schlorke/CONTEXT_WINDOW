import { Button, Stack, Text, catalog } from "../../../shared/ui";

/** Renders every catalog state with the real components of the current platform. */
export function CatalogPage() {
  return (
    <Stack padding="xl" gap="lg">
      <Text heading={1} size="xl">
        Component catalog
      </Text>
      {catalog.Button.map((entry) => (
        <Stack key={entry.name} gap="xs">
          <Text tone="muted" size="sm">{`Button / ${entry.name}`}</Text>
          <Button {...entry.props} />
        </Stack>
      ))}
      {catalog.Text.map((entry) => (
        <Text key={entry.name} {...entry.props} />
      ))}
      {catalog.Stack.map((entry) => (
        <Stack key={entry.name} {...entry.props}>
          <Text>{`Stack / ${entry.name}`}</Text>
        </Stack>
      ))}
    </Stack>
  );
}
