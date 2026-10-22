interface ToggleProps {
  checked: boolean
  onChange: (next: boolean) => void
  /** Accessible name; the visible label usually sits next to the toggle. */
  label: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="toggle"
      disabled={disabled}
      onClick={() => onChange(!checked)}
    />
  )
}
