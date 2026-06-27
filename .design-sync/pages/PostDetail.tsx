import React from "react"
import { Button } from "@fider/components/common/Button"
import { UserName } from "@fider/components/common/UserName"
import { Avatar } from "@fider/components/common/Avatar"
import { Moment } from "@fider/components/common/Moment"
import { Markdown } from "@fider/components/common/Markdown"
import { Form } from "@fider/components/common/form/Form"
import { TextArea } from "@fider/components/common/form/TextArea"

// Example screen — a single feedback post with its comment thread and composer,
// composed from Omada Beacon primitives. Avatars use gravatar identicons (a
// UserName is always shown alongside so the comment reads even if an image fails).
const daysAgo = (n: number): Date => new Date(Date.now() - n * 24 * 60 * 60 * 1000)
const gravatar = (hex: string): string => `https://www.gravatar.com/avatar/${hex}?d=identicon`

const COMMENTS = [
  { user: { id: 2, name: "Grace Hopper", role: "collaborator" }, avatarURL: gravatar("11111111111111111111111111111111"), when: daysAgo(1), text: "Huge +1 — this would save me real time every day." },
  { user: { id: 3, name: "Alan Turing" }, avatarURL: gravatar("22222222222222222222222222222222"), when: daysAgo(3), text: "Could we also get a shortcut to jump straight to search?" },
]

const DESCRIPTION = [
  "We spend a lot of time navigating the board with the mouse. A small set of shortcuts would make triage much faster:",
  "",
  "- `j` / `k` to move between ideas",
  "- `v` to vote on the focused idea",
  "- `c` to jump to the comment box",
  "",
  "This would make the whole board feel **much** snappier for daily users.",
].join("\n")

export const PostDetail: React.FC = () => (
  <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
    <div style={{ display: "flex", gap: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 64, height: 68, border: "1px solid var(--colors-gray-200, #e2e8f0)", borderRadius: 8 }}>
        <span style={{ fontSize: 12, color: "var(--colors-primary-base, #0A7171)" }}>▲</span>
        <strong style={{ fontSize: 18 }}>128</strong>
        <span style={{ fontSize: 11 }} className="text-muted">votes</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 className="text-display text-bold">Add keyboard shortcuts for power users</h1>
        <div className="flex flex-items-center mt-1" style={{ gap: 8, fontSize: 13 }}>
          <UserName user={{ id: 1, name: "Ada Lovelace", role: "administrator" }} />
          <span className="text-muted">·</span>
          <Moment locale="en" date={daysAgo(2)} format="relative" />
          <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#fff", background: "var(--colors-blue-500, #2b6cb0)" }}>Planned</span>
        </div>
      </div>
    </div>

    <div className="mt-4">
      <Markdown style="full" text={DESCRIPTION} />
    </div>

    <hr style={{ border: "none", borderTop: "1px solid var(--colors-gray-200, #e2e8f0)", margin: "24px 0" }} />

    <h3 className="text-header text-bold mb-2">2 comments</h3>
    <div style={{ display: "grid", gap: 16 }}>
      {COMMENTS.map((c, i) => (
        <div key={i} style={{ display: "flex", gap: 12 }}>
          <Avatar user={{ name: c.user.name, avatarURL: c.avatarURL }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="flex flex-items-center" style={{ gap: 8, fontSize: 13 }}>
              <UserName user={c.user} />
              <span className="text-muted">·</span>
              <Moment locale="en" date={c.when} format="relative" />
            </div>
            <p className="mt-1">{c.text}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="mt-4">
      <Form>
        <TextArea field="comment" label="Leave a comment" placeholder="Share your thoughts…" minRows={3} onChange={() => {}} />
        <div className="mt-2">
          <Button variant="primary">Post comment</Button>
        </div>
      </Form>
    </div>
  </div>
)
