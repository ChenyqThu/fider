import React from "react"
import { Fider, FiderContext } from "@fider/services/fider"

// Modal.Window portals into #root-modal; create it at module load (before any
// component renders) so the dialog has a portal target in preview cards.
// Append to <body> (NOT #root — React clears #root's children on mount).
if (typeof document !== "undefined" && !document.getElementById("root-modal")) {
  const el = document.createElement("div")
  el.id = "root-modal"
  document.body.appendChild(el)
}

// Initialize the Fider singleton with mock data BEFORE any component mounts.
// The default singleton has undefined settings/session, so components calling
// useFider() (Avatar, UserName, Logo, SignInControl, ...) would crash reading
// fider.session/settings. This populates a realistic preview tenant/user.
Fider.initialize({
  page: "",
  contextID: "preview",
  props: {},
  settings: {
    environment: "production",
    mode: "multi",
    locale: "en",
    domain: "omada",
    globalAssetsURL: "",
    tenantAssetsURL: "",
    baseURL: "",
    oauth: [],
    isBillingEnabled: false,
    hasLegal: false,
  },
  user: {
    id: 1,
    name: "Ada Lovelace",
    email: "ada@omada.com",
    role: "administrator",
    status: "active",
    avatarType: "gravatar",
    avatarURL: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp",
    isAdministrator: true,
    isCollaborator: true,
  },
  tenant: {
    id: 1,
    name: "Omada",
    subdomain: "omada",
    locale: "en",
    isPrivate: false,
    isPro: true,
    status: "active",
  },
} as any)

export const PreviewProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  React.useLayoutEffect(() => {
    // Tokens default to :root (light) in omada-styles.css, but set the attr too
    // so any component that explicitly reads body[data-theme] behaves.
    document.body.setAttribute("data-theme", "light")
  }, [])
  return <FiderContext.Provider value={Fider}>{children}</FiderContext.Provider>
}
