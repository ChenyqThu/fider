# Omada Beacon — building with these components

These are the real React primitives shipped by Omada Beacon (a Fider-based
feedback platform). They are **prop-driven**: each component owns its look through
internal BEM `c-*` classes, so you style it by passing **props**, not class names.
Reserve the utility classes below for your own layout glue around the components.

## Setup

No global provider is required for the primitives. Components take explicit data
through props (e.g. `Avatar`/`UserName` receive a `user` object; `DisplayError`
receives an `error` object) — pass that data directly; do not reach for app
context. Form inputs (`Input`, `TextArea`, `Select`, `Checkbox`, `RadioButton`)
read validation state from `Form`, so compose them **inside `<Form>`**.

## Styling idiom

Style components through their props — never by hand-writing their `c-*` classes:

- `Button` — `variant` ("primary" | "secondary" | "tertiary" | "danger" | "link"), `size` ("small" | "default" | "large")
- `Message` — `type` ("success" | "warning" | "error"), `showIcon`
- `Toggle` — `active`, `disabled`; `Avatar` — `size` ("small" | "normal" | "large")
- Inputs — `field` (required), `label`, `placeholder`, `disabled`

For your **own** layout/spacing around components, use these utility classes
(Tailwind-like, already in the stylesheet — do NOT add Tailwind):

| Need | Classes |
|---|---|
| Flex | `flex`, `flex-x`, `flex-y`, `flex-items-center`, `justify-between` |
| Grid | `grid`, `grid-cols-1`, `grid-cols-4` (only these column counts ship; for 2/3 columns use `flex`+`gap-*` or an inline `gridTemplateColumns` style) |
| Gap | `gap-1`, `gap-2`, `gap-4` |
| Margin | `mt-1`…`mt-8`, `mb-1`…`mb-8`, `mr-1`…`mr-4`, `ml-1`/`ml-2`, `mx-auto` |
| Text | `text-body`, `text-header`, `text-display`, `text-lg`, `text-2xl`, `text-center`, `text-bold` |
| Size | `w-full` |

## Color / theme

Colors come from CSS custom properties on `:root` — use `var(--colors-*)`, e.g.
`var(--colors-primary-base)` (the Omada brand teal), `var(--colors-gray-700)`,
`var(--colors-green-500)`. The brand accent is driven by `--primary-color`
(`#0A7171`). Dark mode is `body[data-theme="dark"]`.

## Where the truth lives

- `styles.css` — the full token + component-style closure (read it before styling).
- Each component's `<Name>.d.ts` (its exact props) and `<Name>.prompt.md` (usage).

## Idiomatic snippet

```tsx
import { Form, Input, Button, Message } from "omada-beacon"

function NewIdea() {
  return (
    <Form>
      <Message type="success" showIcon>Idea posted — your team can vote on it.</Message>
      <Input field="title" label="Title" placeholder="Add keyboard shortcuts" />
      <div className="flex flex-items-center justify-between mt-4">
        <span className="text-body">Public to your workspace</span>
        <Button variant="primary">Post idea</Button>
      </div>
    </Form>
  )
}
```
