# Registry Templates and Advanced Portability Cases

Reference file for `component-reuse-portability`.

## Shared Components README Template

```markdown
## Shared Components

### Button

- **Source:** Button.tsx
- **Props:** `children`, `variant`, `size`, `disabled`, `asChild`
- **Dependencies:** none
- **Status:** stable (v1.0.0)

### DataTable

- **Source:** DataTable.tsx
- **Props:** `data`, `columns`, `onRowClick`
- **Dependencies:** Button, cn utility
- **Status:** beta
```

## Registry JSON Example

```json
{
  "components": {
    "Button": {
      "path": "src/shared/components/Button",
      "dependencies": [],
      "status": "stable"
    },
    "DataTable": {
      "path": "src/shared/components/DataTable",
      "dependencies": ["Button"],
      "status": "beta"
    }
  }
}
```

## Case: Optional External Dependencies

Use this pattern when a feature can degrade gracefully instead of forcing every target project to install extra packages:

1. Isolate the optional behavior behind a prop or adapter.
2. Document the optional package in the shared README and registry entry.
3. Keep the core component useful without the dependency.

## Case: Feature Flags in Source Components

Replace source-project feature flags with explicit props before exporting the component. The target project should decide whether the feature stays on, off, or becomes its own wrapper component.

## Case: Monorepo Component Packages

If the source component already lives in an internal package such as `@org/ui`, prefer consuming the package directly instead of copying files. Verify `main`, `types`, and peer dependencies in `package.json` before installation.
