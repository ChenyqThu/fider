import React from "react"
import { Checkbox } from "omada-beacon"

export const States = () => (
  <div style={{ display: "grid", gap: 12 }}>
    <Checkbox field="comments" checked onChange={() => {}}>
      Email me about new comments
    </Checkbox>
    <Checkbox field="digest" onChange={() => {}}>
      Send me the weekly digest
    </Checkbox>
  </div>
)
