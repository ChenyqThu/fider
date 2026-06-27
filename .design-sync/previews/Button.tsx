import React from "react"
import { Button } from "omada-beacon"

// Usage harvested from public/pages/DesignSystem/DesignSystem.page.tsx.

export const Variants = () => (
  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="tertiary">Tertiary</Button>
    <Button variant="danger">Danger</Button>
    <Button variant="link">Link</Button>
  </div>
)

export const Sizes = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <Button variant="primary" size="small">Small</Button>
    <Button variant="primary" size="default">Default</Button>
    <Button variant="primary" size="large">Large</Button>
  </div>
)

export const Disabled = () => (
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <Button variant="primary" disabled>Disabled</Button>
    <Button variant="secondary" disabled>Disabled</Button>
  </div>
)
