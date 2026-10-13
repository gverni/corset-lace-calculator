import { passAt, startPassFor, type Pass } from "./lace";

export type Side = "L" | "R";
export type Surface = "outside" | "inside";

export interface Point {
  side: Side;
  eyelet: number;
}

export interface Segment {
  kind: "bar" | "cross" | "loop" | "tail";
  from: Point;
  to?: Point;
  /** Which face of the corset the lace lies on (seen from the outside). */
  surface: Surface;
}

export interface ThreadingModel {
  n: number;
  loopPosition: number;
  startPass: Pass;
  passes: Pass[]; // passes[i] is the pass at eyelet i + 1 (same on both sides)
  segments: Segment[];
}

/** The same threading is used for both roles (tightening and slide-on). */
export function buildThreading(n: number, loopPosition: number): ThreadingModel {
  const k = loopPosition;
  if (!Number.isInteger(k) || k < 1 || k > n - 1) {
    throw new RangeError("loopPosition must be a whole number between 1 and n - 1");
  }
  const startPass = startPassFor(k);
  const passes = Array.from({ length: n }, (_, i) => passAt(i + 1, startPass));

  // After passing eyelet e, the lace lies on the inside if it went in, else outside.
  const after = (e: number): Surface => (passes[e - 1] === "in" ? "inside" : "outside");

  const segments: Segment[] = [];

  // The top bar arrives at eyelet 1, so it lies on the face the lace comes from.
  segments.push({
    kind: "bar",
    from: { side: "L", eyelet: 1 },
    to: { side: "R", eyelet: 1 },
    surface: passes[0] === "in" ? "outside" : "inside",
  });

  for (let j = 1; j < n; j++) {
    if (j === k) continue; // the loop replaces the crossings on this level
    segments.push({ kind: "cross", from: { side: "L", eyelet: j }, to: { side: "R", eyelet: j + 1 }, surface: after(j) });
    segments.push({ kind: "cross", from: { side: "R", eyelet: j }, to: { side: "L", eyelet: j + 1 }, surface: after(j) });
  }

  for (const side of ["L", "R"] as Side[]) {
    segments.push({ kind: "loop", from: { side, eyelet: k }, to: { side, eyelet: k + 1 }, surface: "outside" });
  }

  for (const side of ["L", "R"] as Side[]) {
    segments.push({ kind: "tail", from: { side, eyelet: n }, surface: after(n) });
  }

  return { n, loopPosition: k, startPass, passes, segments };
}

// ---------- SVG rendering (schematic, not to scale) ----------

const W = 460;
const ROW = 44;
const LX = 165;
const RX = 295;
const TOP = 120;

const INK = "#111827";
const MUTED = "#6b7280";
const IN_COLOUR = "#0f766e";
const OUT_COLOUR = "#6d28d9";
const LOOP_COLOUR = "#c2410c";

const px = (s: Side) => (s === "L" ? LX : RX);
const py = (e: number) => TOP + (e - 1) * ROW;
const passLabel = (p: Pass) => (p === "in" ? "In" : "Out");
const passColour = (p: Pass) => (p === "in" ? IN_COLOUR : OUT_COLOUR);

export function renderThreadingSvg(m: ThreadingModel): string {
  const { n, loopPosition: k } = m;
  const H = py(n) + 60 + 130;

  const title = `${n} eyelets per side, loop between eyelets ${k} and ${k + 1}`;
  const sub = `Eyelet 1: ${passLabel(m.startPass)}. Laced side seen from outside, as worn. Not to scale.`;

  const line = (a: Point, b: Point, s: Surface) => {
    const dash = s === "inside" ? ' stroke-dasharray="6 5"' : "";
    const col = s === "inside" ? MUTED : INK;
    return `<line x1="${px(a.side)}" y1="${py(a.eyelet)}" x2="${px(b.side)}" y2="${py(b.eyelet)}" stroke="${col}" stroke-width="2"${dash}/>`;
  };

  const parts: string[] = [];
  parts.push(`<rect width="${W}" height="${H}" rx="10" fill="#ffffff"/>`);
  parts.push(`<text x="24" y="34" font-size="16" font-weight="600" fill="${INK}">${title}</text>`);
  parts.push(`<text x="24" y="56" font-size="12" fill="${MUTED}">${sub}</text>`);

  // inside segments first (dashed), then outside segments
  const straight = m.segments.filter((s) => s.kind === "cross" || s.kind === "bar");
  for (const s of straight.filter((s) => s.surface === "inside")) parts.push(line(s.from, s.to as Point, "inside"));
  for (const s of straight.filter((s) => s.surface === "outside")) parts.push(line(s.from, s.to as Point, "outside"));

  // tails
  for (const s of m.segments.filter((s) => s.kind === "tail")) {
    const x = px(s.from.side);
    const y = py(s.from.eyelet);
    const dash = s.surface === "inside" ? ' stroke-dasharray="6 5"' : "";
    const col = s.surface === "inside" ? MUTED : INK;
    parts.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 36}" stroke="${col}" stroke-width="2"${dash}/>`);
    parts.push(`<text x="${x}" y="${y + 52}" font-size="11" text-anchor="middle" fill="${MUTED}">end</text>`);
  }

  // loops (outside, bulging away from the centre)
  for (const s of m.segments.filter((s) => s.kind === "loop")) {
    const x = px(s.from.side);
    const dir = s.from.side === "L" ? -1 : 1;
    const y1 = py(s.from.eyelet);
    const y2 = py((s.to as Point).eyelet);
    parts.push(
      `<path d="M ${x} ${y1} C ${x + dir * 80} ${y1 - 14}, ${x + dir * 80} ${y2 + 14}, ${x} ${y2}" fill="none" stroke="${LOOP_COLOUR}" stroke-width="3"/>`
    );
    parts.push(
      `<text x="${x + dir * 36}" y="${(y1 + y2) / 2 + 4}" font-size="12" font-weight="600" text-anchor="middle" fill="${LOOP_COLOUR}">loop</text>`
    );
  }

  parts.push(`<text x="${(LX + RX) / 2}" y="${py(1) - 12}" font-size="11" text-anchor="middle" fill="${MUTED}">top bar</text>`);

  // eyelets and the number / pass ruler on each side
  for (let e = 1; e <= n; e++) {
    const p = m.passes[e - 1];
    const isLoop = e === k || e === k + 1;
    for (const side of ["L", "R"] as Side[]) {
      const x = px(side);
      const y = py(e);
      if (isLoop) parts.push(`<circle cx="${x}" cy="${y}" r="12" fill="#ffedd5" stroke="${LOOP_COLOUR}" stroke-width="1.5"/>`);
      parts.push(`<circle cx="${x}" cy="${y}" r="6" fill="#ffffff" stroke="${passColour(p)}" stroke-width="3"/>`);
    }
    const label = `${e}  ${passLabel(p)}`;
    const weight = isLoop ? "700" : "400";
    parts.push(`<text x="${LX - 84}" y="${py(e) + 4}" font-size="13" font-weight="${weight}" text-anchor="end" fill="${passColour(p)}">${label}</text>`);
    parts.push(`<text x="${RX + 84}" y="${py(e) + 4}" font-size="13" font-weight="${weight}" text-anchor="start" fill="${passColour(p)}">${label}</text>`);
  }

  // legend
  const ly = py(n) + 90;
  parts.push(`<line x1="24" y1="${ly}" x2="64" y2="${ly}" stroke="${INK}" stroke-width="2"/>`);
  parts.push(`<text x="74" y="${ly + 4}" font-size="12" fill="${INK}">Lace on the outside (visible)</text>`);
  parts.push(`<line x1="24" y1="${ly + 22}" x2="64" y2="${ly + 22}" stroke="${MUTED}" stroke-width="2" stroke-dasharray="6 5"/>`);
  parts.push(`<text x="74" y="${ly + 26}" font-size="12" fill="${INK}">Lace on the inside (hidden)</text>`);
  parts.push(`<text x="24" y="${ly + 50}" font-size="12" fill="${INK}"><tspan fill="${IN_COLOUR}" font-weight="600">In</tspan> = lace goes from outside to inside.  <tspan fill="${OUT_COLOUR}" font-weight="600">Out</tspan> = from inside to outside.</text>`);
  parts.push(`<text x="24" y="${ly + 72}" font-size="12" fill="${LOOP_COLOUR}">The loop comes out of eyelet ${k} and goes into eyelet ${k + 1}, on each side.</text>`);

  const desc = `Eyelet pass directions from the top: ${m.passes.map((p, i) => `${i + 1} ${passLabel(p)}`).join(", ")}.`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif">` +
    `<title id="t">${title}</title><desc id="d">${desc}</desc>` +
    parts.join("") +
    `</svg>`
  );
}
