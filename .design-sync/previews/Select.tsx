import React from "react"
import { Select } from "omada-beacon"

export const Default = () => (
  <Select
    field="role"
    label="Role"
    defaultValue="member"
    options={[
      { value: "administrator", label: "Administrator" },
      { value: "collaborator", label: "Collaborator" },
      { value: "member", label: "Member" },
    ]}
    onChange={() => {}}
  />
)
