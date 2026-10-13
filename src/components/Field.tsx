type FieldProps = {
  id: string;
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  /** Shown after the number, for example "cm". Leave out for counts. */
  unit?: string;
  error?: string;
  inputMode?: "decimal" | "numeric";
};

export function Field({ id, label, help, value, onChange, unit, error, inputMode = "decimal" }: FieldProps) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div
        className={`mt-1.5 flex items-stretch rounded border bg-panel focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent ${
          error ? "border-danger" : "border-chalk"
        }`}
      >
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${errorId} ${helpId}` : helpId}
          // 16px or larger stops iOS Safari zooming in when the field is focused.
          className="num min-w-0 flex-1 rounded bg-transparent px-3 py-2 text-base outline-none"
        />
        {unit ? (
          <span className="flex items-center border-l border-chalk px-3 text-sm text-ink-soft" aria-hidden="true">
            {unit}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      <p id={helpId} className="mt-1.5 text-sm leading-snug text-ink-soft">
        {help}
      </p>
    </div>
  );
}
