/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as React from 'react'

type ModalProps = {
  children?: React.ReactNode
  onClose: () => void
}
export default function Modal({ children, onClose }: ModalProps) {
  return (
    <div className="modalShroud">
      <div className="modal">
        <button onClick={onClose} className="modalClose">
          <span className="icon">close</span>
        </button>
        <div className="modalContent">{children}</div>
      </div>
    </div>
  )
}