import type { ButtonProps } from "./contract/button";
import type { StackProps } from "./contract/stack";
import type { TextProps } from "./contract/text";

/**
 * Component catalog rendered by both clients (/catalog). It lists the states that design review
 * signs off; a unit test fails when an exported component has no entry here.
 */
export const catalog = {
  Button: [
    { name: "primary", props: { label: "Primary action", variant: "primary" } },
    { name: "secondary", props: { label: "Secondary action", variant: "secondary" } },
    { name: "disabled", props: { label: "Disabled", disabled: true } },
    { name: "loading", props: { label: "Save", loading: true } },
  ] satisfies Array<{ name: string; props: ButtonProps }>,
  Text: [
    { name: "heading", props: { children: "Heading", heading: 2, size: "lg" } },
    { name: "body", props: { children: "Body text" } },
    { name: "muted", props: { children: "Muted text", tone: "muted", size: "sm" } },
  ] satisfies Array<{ name: string; props: TextProps }>,
  Stack: [{ name: "surface", props: { surface: true, padding: "md" } }] satisfies Array<{ name: string; props: StackProps }>,
} as const;
