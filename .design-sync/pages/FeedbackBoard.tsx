import React from "react"
import { Button } from "@fider/components/common/Button"
import { UserName } from "@fider/components/common/UserName"
import { Moment } from "@fider/components/common/Moment"
import { Pagination } from "@fider/components/common/Pagination"

// Example screen — composed entirely from Omada Beacon primitives. Use as a
// layout template for a feedback / idea board. Relative dates use a Date.now()
// offset so they render as "N days ago" against any clock.
const daysAgo = (n: number): Date => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

const STATUS = {
  planned: { label: "Planned", bg: "var(--colors-blue-500, #2b6cb0)" },
  started: { label: "Started", bg: "var(--colors-green-500, #38a169)" },
  review: { label: "Under review", bg: "var(--colors-gray-500, #718096)" },
}

const POSTS = [
  { id: 1, title: "Add keyboard shortcuts for power users", desc: "Navigate the board and vote without reaching for the mouse.", votes: 128, status: STATUS.planned, comments: 12, author: { id: 1, name: "Ada Lovelace", role: "administrator" }, when: daysAgo(2) },
  { id: 2, title: "Dark mode for the dashboard", desc: "A proper dark theme for late-night triage sessions.", votes: 96, status: STATUS.started, comments: 8, author: { id: 2, name: "Grace Hopper", role: "collaborator" }, when: daysAgo(5) },
  { id: 3, title: "Export feedback to CSV", desc: "Let admins pull all posts and votes into a spreadsheet.", votes: 54, status: STATUS.review, comments: 3, author: { id: 3, name: "Alan Turing" }, when: daysAgo(9) },
]

const VoteBox: React.FC<{ votes: number }> = ({ votes }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 56, height: 60, border: "1px solid var(--colors-gray-200, #e2e8f0)", borderRadius: 8 }}>
    <span style={{ fontSize: 11, lineHeight: 1, color: "var(--colors-primary-base, #0A7171)" }}>▲</span>
    <strong style={{ fontSize: 16 }}>{votes}</strong>
  </div>
)

const StatusPill: React.FC<{ status: { label: string; bg: string } }> = ({ status }) => (
  <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: "#fff", background: status.bg, whiteSpace: "nowrap" }}>{status.label}</span>
)

export const FeedbackBoard: React.FC = () => {
  const [page, setPage] = React.useState(1)
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
      <div className="flex flex-items-center justify-between mb-4">
        <div>
          <h1 className="text-display text-bold">Feature requests</h1>
          <p className="text-muted">Vote on ideas or share your own.</p>
        </div>
        <Button variant="primary">Submit idea</Button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {POSTS.map((p) => (
          <div key={p.id} style={{ display: "flex", gap: 16, padding: 16, border: "1px solid var(--colors-gray-200, #e2e8f0)", borderRadius: 10 }}>
            <VoteBox votes={p.votes} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="flex flex-items-center justify-between">
                <strong className="text-lg">{p.title}</strong>
                <StatusPill status={p.status} />
              </div>
              <p className="text-muted mt-1 mb-2">{p.desc}</p>
              <div className="flex flex-items-center" style={{ gap: 8, fontSize: 13 }}>
                <UserName user={p.author} />
                <span className="text-muted">·</span>
                <Moment locale="en" date={p.when} format="relative" />
                <span className="text-muted">·</span>
                <span className="text-muted">{p.comments} comments</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <Pagination currentPage={page} totalPages={6} onPageChange={setPage} />
      </div>
    </div>
  )
}
