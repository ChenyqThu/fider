import React from "react"
import { Money } from "omada-beacon"

export const Amounts = () => (
  <div style={{ display: "grid", gap: 6 }}>
    <Money locale="en" amount={49} currency="USD" />
    <Money locale="en" amount={1290} currency="EUR" />
  </div>
)
