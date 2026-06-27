import React from "react"
import { Moment } from "omada-beacon"

// `relative` runs Intl.RelativeTimeFormat against the live clock, so use an
// offset from now (not a fixed date) — a hardcoded date drifts into the future
// of the build machine's clock and degrades to raw seconds. The absolute
// formats take a fixed date so they render a stable, readable timestamp.
const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)

export const Formats = () => (
  <div style={{ display: "grid", gap: 8 }}>
    <Moment locale="en" date={twoDaysAgo} format="relative" />
    <Moment locale="en" date="2026-06-20T10:00:00Z" format="full" />
    <Moment locale="en" date="2026-06-20T10:00:00Z" format="date" />
  </div>
)
