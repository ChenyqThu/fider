import React from "react"
import { Toggle } from "omada-beacon"

export const States = () => (
  <div style={{ display: "grid", gap: 12 }}>
    <Toggle field="on" active={true} label="Notifications on" onToggle={() => {}} />
    <Toggle field="off" active={false} label="Notifications off" onToggle={() => {}} />
    <Toggle field="disabled" active={true} disabled label="Locked" onToggle={() => {}} />
  </div>
)
