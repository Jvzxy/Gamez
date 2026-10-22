import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  /** Accessible name for the dialog. */
  label: string
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

/**
 * Built on the native <dialog> element, so focus trapping, Escape to close and
 * the backdrop come from the browser. Children only mount while open, which
 * resets any form state each time the dialog is reopened.
 */
export function Modal({ open, onClose, label, size = 'md', children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const sizeClass = size === 'md' ? '' : ` modal--${size}`

  return (
    <dialog
      ref={ref}
      className={`modal${sizeClass}`}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => {
        // A click on the dialog element itself (not its content) is a backdrop click.
        if (event.target === event.currentTarget) onClose()
      }}
    >
      {open ? <div className="modal__panel">{children}</div> : null}
    </dialog>
  )
}
