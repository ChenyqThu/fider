import React from "react"
import { RadioButton } from "omada-beacon"

export const Default = () => (
  <RadioButton
    label="Post visibility"
    field="visibility"
    defaultOption={{ label: "Public", value: "public" }}
    options={[
      { label: "Public", value: "public" },
      { label: "Private", value: "private" },
    ]}
    onSelect={() => {}}
  />
)
