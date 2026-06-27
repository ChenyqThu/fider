import React from "react"
import { Button } from "@fider/components/common/Button"
import { Form } from "@fider/components/common/form/Form"
import { Input } from "@fider/components/common/form/Input"
import { Select } from "@fider/components/common/form/Select"
import { Field } from "@fider/components/common/form/Field"
import { Toggle } from "@fider/components/common/Toggle"
import { Message } from "@fider/components/common/Message"
import { PageTitle } from "@fider/components/common/PageTitle"

// Example screen — a workspace settings form composed from Omada Beacon
// primitives: page title, a status message, text/select inputs, and toggles.
export const Settings: React.FC = () => {
  const [emailNotif, setEmailNotif] = React.useState(true)
  const [digest, setDigest] = React.useState(false)
  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: 24 }}>
      <PageTitle title="Settings" subtitle="Manage your workspace preferences" />

      <div className="mt-4 mb-4">
        <Message type="success">Your changes have been saved.</Message>
      </div>

      <Form>
        <Input field="workspace" label="Workspace name" value="Omada" onChange={() => {}} />
        <Select
          field="visibility"
          label="Board visibility"
          defaultValue="public"
          options={[
            { value: "public", label: "Public — anyone can view" },
            { value: "private", label: "Private — members only" },
          ]}
          onChange={() => {}}
        />

        <div className="mt-4" style={{ display: "grid", gap: 12 }}>
          <Field label="Notifications">
            <Toggle field="emailNotif" active={emailNotif} label="Email me about new comments" onToggle={setEmailNotif} />
          </Field>
          <Toggle field="digest" active={digest} label="Send me the weekly digest" onToggle={setDigest} />
        </div>

        <div className="mt-4">
          <Button variant="primary">Save changes</Button>
        </div>
      </Form>
    </div>
  )
}
