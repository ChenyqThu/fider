import React from "react"
import { Dropdown, Button } from "omada-beacon"

// Dropdown opens on interaction; the static card shows the trigger handle.
export const Menu = () => (
  <Dropdown renderHandle={<Button variant="secondary">Options</Button>}>
    <Dropdown.ListItem onClick={() => {}}>Edit</Dropdown.ListItem>
    <Dropdown.ListItem onClick={() => {}}>Duplicate</Dropdown.ListItem>
    <Dropdown.Divider />
    <Dropdown.ListItem onClick={() => {}}>Delete</Dropdown.ListItem>
  </Dropdown>
)
