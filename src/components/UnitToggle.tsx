import type { Unit } from "@/lib/units";

const UNITS: { value: Unit; label: string }[] = [
  { value: "cm", label: "cm" },
  { value: "in", label: "inches" },
];

export function UnitToggle({ value, onChange }: { value: Unit; onChange: (unit: Unit) => void }) {
  return (
    <fieldset>
      <legend className="sr-only">Units</legend>
      <div className="flex rounded border border-chalk bg-panel p-0.5">
        {UNITS.map((u) => (
          <label key={u.value} className="relative cursor-pointer">
            <input
              type="radio"
              name="unit"
              value={u.value}
              checked={value === u.value}
              onChange={() => onChange(u.value)}
              className="peer sr-only"
            />
            <span className="block min-w-16 rounded-sm px-4 py-1.5 text-center text-sm font-medium text-ink-soft transition-colors peer-checked:bg-accent peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              {u.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
