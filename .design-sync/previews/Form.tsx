import React from "react"
import { Form, Input, Button } from "omada-beacon"

// Form provides ValidationContext; fields compose inside it.
export const SignInForm = () => (
  <Form>
    <Input field="email" label="Email" value="ada@omada.com" onChange={() => {}} />
    <Input field="password" label="Password" placeholder="••••••••" onChange={() => {}} />
    <Button variant="primary" type="submit">
      Sign in
    </Button>
  </Form>
)
