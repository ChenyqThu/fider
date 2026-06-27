import React from "react"
import { Field, Toggle } from "omada-beacon"

export const Labeled = () => (
  <Field label="Email notifications">
    <Toggle field="notify" active={true} label="Enabled" onToggle={() => {}} />
  </Field>
)
