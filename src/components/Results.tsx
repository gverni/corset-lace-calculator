import type { LaceResult, LaceRole } from "@/lib/lace";
import { format, type Unit } from "@/lib/units";

type ResultsProps = { role: LaceRole; unit: Unit; result: LaceResult };

export function Results({ role, unit, result }: ResultsProps) {
  const other: Unit = unit === "cm" ? "in" : "cm";
  const f = (cm: number) => `${format(cm, unit)} ${unit}`;
  const slideOn = role === "slide-on";

  return (
    <section aria-labelledby="results-heading" className="rounded border border-chalk bg-panel p-5 sm:p-6">
      <h2 id="results-heading" className="font-serif text-2xl">
        Lace needed
      </h2>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <div>
          <dt className="text-ink-soft">Eyelet spacing</dt>
          <dd className="num mt-0.5 text-base">{f(result.eyeletSpacing)}</dd>
        </div>
        <div>
          <dt className="text-ink-soft">Crossing length</dt>
          <dd className="num mt-0.5 text-base">{f(result.crossingLength)}</dd>
        </div>
        {slideOn ? (
          <div className="col-span-2">
            <dt className="text-ink-soft">Minimum loop length</dt>
            <dd className="num mt-0.5 text-base">{f(result.loopLength)}</dd>
            <dd className="mt-1 leading-snug text-ink-soft">
              Each loop must be at least this long (visible length) so the corset can open to the shoulder gap. Worked out as if the corset is laced with no gap.
            </dd>
          </div>
        ) : null}
      </dl>

      <table className="mt-6 w-full border-collapse text-left">
        <caption className="sr-only">Lace length breakdown</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Part</th>
            <th scope="col">Length</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-chalk-soft border-y border-chalk-soft">
          {slideOn ? null : (
            <Row name="Top bar" calc="Straight piece across the top eyelets" value={f(result.topBarLength)} />
          )}
          <Row name="Crossings" calc={`${result.crossingCount} × ${f(result.crossingLength)}`} value={f(result.crossingCount * result.crossingLength)} />
          <Row name="Loops" calc={`4 × ${f(result.loopLength)}`} value={f(result.loopsLace)} />
          <Row name="Ends" calc={`2 × ${f(result.tailsLace / 2)}`} value={f(result.tailsLace)} />
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-ink">
            <th scope="row" className="pt-4 align-baseline text-base font-medium">
              Total lace length
            </th>
            <td className="pt-4 text-right align-baseline">
              <span className="num font-serif text-4xl leading-none sm:text-5xl">{format(result.totalLaceLength, unit)}</span>
              {" "}
              <span className="text-base">{unit}</span>
              <span className="num mt-1 block text-sm text-ink-soft">
                {format(result.totalLaceLength, other)} {other}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>

      {slideOn ? (
        <p className="mt-5 border-l-2 border-accent bg-accent-soft px-3 py-2 text-sm leading-snug">
          When the corset is laced, each loop will be about <span className="num font-medium">{f(result.loopLength)}</span> long (visible length), if it is laced with no gap.
        </p>
      ) : null}
    </section>
  );
}

function Row({ name, calc, value }: { name: string; calc: string; value: string }) {
  return (
    <tr>
      <th scope="row" className="py-3 pr-4 align-top font-normal">
        <span className="block">{name}</span>
        <span className="num block text-sm text-ink-soft">{calc}</span>
      </th>
      <td className="num py-3 text-right align-top">{value}</td>
    </tr>
  );
}
