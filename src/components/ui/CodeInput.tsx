interface CodeInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  label: string
  length?: number
  invalid?: boolean
  autoFocus?: boolean
}

/**
 * One numeric field styled as a code entry. A single input keeps paste, autofill
 * (autocomplete="one-time-code") and screen readers working without focus juggling.
 */
export function CodeInput({ id, value, onChange, label, length = 6, invalid, autoFocus }: CodeInputProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input code-input"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        placeholder={'•'.repeat(length)}
        value={value}
        autoFocus={autoFocus}
        aria-invalid={invalid ? true : undefined}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, length))}
      />
    </div>
  )
}
