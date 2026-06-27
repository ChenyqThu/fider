import React from "react"
import { Form, Input } from "omada-beacon"

// Input reads Form's ValidationContext — its only true render is inside a Form.
export const States = () => (
  <Form>
    <Input field="name" label="Display name" value="Ada Lovelace" onChange={() => {}} />
    <Input field="email" label="Email" placeholder="you@example.com" onChange={() => {}} />
    <Input field="locked" label="Disabled" value="Read only" disabled onChange={() => {}} />
  </Form>
)
