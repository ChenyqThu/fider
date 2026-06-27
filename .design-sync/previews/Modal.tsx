import React from "react"
import { Modal, Button } from "omada-beacon"

export const Dialog = () => (
  // The wrapper keeps #root non-empty (Modal.Window portals to <body>).
  <div style={{ minHeight: 360 }}>
    <Modal.Window isOpen={true} onClose={() => {}} size="small" canClose>
    <Modal.Header>Delete this post?</Modal.Header>
    <Modal.Content>This action cannot be undone. The post and its comments will be permanently removed.</Modal.Content>
    <Modal.Footer>
      <Button variant="tertiary" onClick={() => {}}>
        Cancel
      </Button>
      <Button variant="danger" onClick={() => {}}>
        Delete
      </Button>
    </Modal.Footer>
    </Modal.Window>
  </div>
)
