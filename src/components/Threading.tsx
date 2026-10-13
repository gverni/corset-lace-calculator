import { buildThreading, renderThreadingSvg, type Surface } from "@/lib/diagram";
import type { Pass } from "@/lib/lace";

const passWord = (p: Pass) => (p === "in" ? "In" : "Out");
const passClass = (p: Pass) => (p === "in" ? "text-pass-in" : "text-pass-out");
const face = (s: Surface) => (s === "outside" ? "on the outside (visible)" : "on the inside (hidden)");

type ThreadingProps = { eyeletsPerSide: number; loopPosition: number };

export function Threading({ eyeletsPerSide: n, loopPosition: k }: ThreadingProps) {
  const model = buildThreading(n, k);
  // The string is built from numbers and fixed text only, never from user text.
  const svg = renderThreadingSvg(model);
  const bar = model.segments.find((s) => s.kind === "bar");
  const tail = model.segments.find((s) => s.kind === "tail");

  return (
    <section aria-labelledby="threading-heading" className="rounded border border-chalk bg-panel p-5 sm:p-6">
      <h2 id="threading-heading" className="font-serif text-2xl">
        Threading guide
      </h2>
      <p className="mt-3 leading-snug">
        Start with <strong className={passClass(model.startPass)}>{passWord(model.startPass)}</strong> at eyelet 1. The loop comes out of
        eyelet {k} and goes into eyelet {k + 1}.
      </p>
      <p className="mt-2 text-sm leading-snug text-ink-soft">
        <strong className="text-pass-in">In</strong> means the lace goes through the eyelet from the outside to the inside.{" "}
        <strong className="text-pass-out">Out</strong> means from the inside to the outside.
      </p>

      <ul className="mt-4 space-y-1 text-sm">
        {bar ? <li>Top bar: {face(bar.surface)}</li> : null}
        {tail ? <li>Lace ends: {face(tail.surface)}</li> : null}
      </ul>

      {/* On phones the drawing runs edge to edge inside the card, so the labels stay readable. */}
      <div className="diagram -mx-5 mt-5 sm:mx-0" dangerouslySetInnerHTML={{ __html: svg }} />

      <details open className="mt-6">
        <summary className="cursor-pointer text-sm font-medium">Pass at each eyelet</summary>
        <table className="mt-3 w-full max-w-sm text-left text-sm">
          <thead>
            <tr className="border-b border-chalk">
              <th scope="col" className="py-1.5 pr-4 font-medium">
                Eyelet
              </th>
              <th scope="col" className="py-1.5 font-medium">
                Pass
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-chalk-soft">
            {model.passes.map((p, i) => {
              const eyelet = i + 1;
              return (
                <tr key={eyelet}>
                  <td className="num py-1.5 pr-4">{eyelet}</td>
                  <td className="py-1.5">
                    <span className={`font-medium ${passClass(p)}`}>{passWord(p)}</span>
                    {eyelet === k ? <span className="text-ink-soft"> (loop starts here)</span> : null}
                    {eyelet === k + 1 ? <span className="text-ink-soft"> (loop ends here)</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </details>
    </section>
  );
}
