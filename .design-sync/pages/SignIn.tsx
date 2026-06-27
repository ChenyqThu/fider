import React from "react"
import { Button } from "@fider/components/common/Button"
import { Form } from "@fider/components/common/form/Form"
import { Input } from "@fider/components/common/form/Input"
import { SocialSignInButton } from "@fider/components/common/SocialSignInButton"

// Example screen — a centered sign-in panel composed from Omada Beacon
// primitives: social providers, a divider, and an email form.
export const SignIn: React.FC = () => (
  <div style={{ minHeight: 480, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
    <div style={{ width: "100%", maxWidth: 360 }}>
      <div className="text-center mb-4">
        <h1 className="text-display text-bold">Sign in to Omada</h1>
        <p className="text-muted">Share feedback and vote on ideas.</p>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <SocialSignInButton option={{ displayName: "Google", provider: "google" }} />
        <SocialSignInButton option={{ displayName: "GitHub", provider: "github" }} />
        <SocialSignInButton option={{ displayName: "Microsoft", provider: "microsoft" }} />
      </div>

      <div className="flex flex-items-center" style={{ gap: 12, margin: "20px 0" }}>
        <span style={{ flex: 1, height: 1, background: "var(--colors-gray-200, #e2e8f0)" }} />
        <span className="text-muted" style={{ fontSize: 13 }}>or</span>
        <span style={{ flex: 1, height: 1, background: "var(--colors-gray-200, #e2e8f0)" }} />
      </div>

      <Form>
        <Input field="email" label="Email" placeholder="you@company.com" onChange={() => {}} />
        <div className="mt-2">
          <Button variant="primary" className="w-full">
            Continue with email
          </Button>
        </div>
      </Form>
    </div>
  </div>
)
