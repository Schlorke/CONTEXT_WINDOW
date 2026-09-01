# Advanced React Component Patterns

Reference examples for `react-saas-architecture`. Load this file only when the
task includes component API design, not for folder ownership alone.

## Compound components

Use a parent context when related children share coordinated state.

```tsx
export const Select = ({ children }) => {
  const [open, setOpen] = useState(false);
  return (
    <SelectContext.Provider value={{ open, setOpen }}>
      {children}
    </SelectContext.Provider>
  );
};
```

## Headless components

Separate behavior from presentation when multiple visual surfaces share the
same interaction model.

```tsx
export const useDropdown = () => {
  const [open, setOpen] = useState(false);
  return { open, setOpen, toggle: () => setOpen((value) => !value) };
};
```

## Controlled and uncontrolled APIs

Offer both only when consumers need both ownership models.

```tsx
<Input defaultValue="John" onChange={handler} />
<Input value={name} onChange={(event) => setName(event.target.value)} />
```

## Ref forwarding and polymorphism

Forward refs when consumers require DOM access. Add polymorphism only when the
semantic element genuinely varies.

```tsx
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <button ref={ref} {...props} />,
);
```

## Render props

Render props remain useful for behavior that must expose state without owning
presentation, though hooks are usually simpler in function-component code.

```tsx
<DataProvider>
  {(data, loading) => (loading ? <Spinner /> : <List items={data} />)}
</DataProvider>
```

## Composition over inheritance

Compose variants from stable primitives instead of subclassing components.

```tsx
const PrimaryButton = (props: ButtonProps) => (
  <Button variant="primary" {...props} />
);
```
