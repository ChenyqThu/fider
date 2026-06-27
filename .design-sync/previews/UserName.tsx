import React from "react"
import { UserName } from "omada-beacon"

export const Roles = () => (
  <div style={{ display: "grid", gap: 8 }}>
    <UserName user={{ id: 1, name: "Ada Lovelace", role: "administrator" }} />
    <UserName user={{ id: 2, name: "Grace Hopper", role: "collaborator" }} />
    <UserName user={{ id: 3, name: "Alan Turing", role: "visitor" }} />
  </div>
)
