import React from "react"
import { DisplayError } from "omada-beacon"

// General (non-field) errors render as the form-level error list.
export const WithErrors = () => (
  <DisplayError
    error={{
      errors: [{ message: "Title is required." }, { message: "Please fix the highlighted fields before continuing." }],
    }}
  />
)
