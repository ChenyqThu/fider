import React from "react"
import { Form, TextArea } from "omada-beacon"

export const Default = () => (
  <Form>
    <TextArea
      field="description"
      label="Description"
      placeholder="Describe your idea…"
      value="We should add keyboard shortcuts so power users can navigate without the mouse."
      minRows={3}
      onChange={() => {}}
    />
  </Form>
)
