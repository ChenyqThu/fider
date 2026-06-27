import React from "react"
import { SocialSignInButton } from "omada-beacon"

export const Providers = () => (
  <div style={{ display: "grid", gap: 10, maxWidth: 320 }}>
    <SocialSignInButton option={{ displayName: "Google", provider: "google" }} />
    <SocialSignInButton option={{ displayName: "GitHub", provider: "github" }} />
    <SocialSignInButton option={{ displayName: "Microsoft", provider: "microsoft" }} />
  </div>
)
