import type { LaceRole } from "@/lib/lace";

const OPTIONS: { value: LaceRole; title: string; text: string }[] = [
  {
    value: "tightening",
    title: "Tightening",
    text: "The corset has another opening (for example a zip). The lace makes it tighter.",
  },
  {
    value: "slide-on",
    title: "Sliding on",
    text: "The lace is the only opening. You slide the corset on over your shoulders.",
  },
];

export function RoleCards({ value, onChange }: { value: LaceRole; onChange: (role: LaceRole) => void }) {
  return (
    <fieldset>
      <legend className="font-serif text-xl">What is the lace for?</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {OPTIONS.map((o) => (
          <label key={o.value} className="relative block cursor-pointer">
            <input
              type="radio"
              name="lace-role"
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="peer sr-only"
            />
            <span className="block rounded border border-chalk bg-panel p-4 transition-colors peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:shadow-[inset_4px_0_0_var(--color-accent)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              <span className="block font-medium">{o.title}</span>
              <span className="mt-1 block text-sm leading-snug text-ink-soft">{o.text}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
