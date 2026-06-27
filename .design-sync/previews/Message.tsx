import React from "react"
import { Message } from "omada-beacon"

export const Types = () => (
  <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
    <Message type="success">Your changes have been saved.</Message>
    <Message type="warning">Your trial ends in 3 days.</Message>
    <Message type="error">Something went wrong. Please try again.</Message>
  </div>
)

export const WithoutIcon = () => (
  <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
    <Message type="success" showIcon={false}>
      Saved without an icon.
    </Message>
  </div>
)
