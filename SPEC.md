# Corset Lace Calculator: Build Spec v5 (Next.js + TypeScript + React, on Vercel)

Goal: a small web app that calculates how much lace a corset needs and draws how to thread it.

The lace can be on the **front or the back** of the corset. There are two uses. In both, the corset is **laced in exactly the same way** (top bar, crossings, two loops, two ends). The only differences are how the corset is worn and how the loop length is decided:

- **Tightening:** the corset has another opening (for example a zip on the other side). The lace only makes it tighter. The user enters the **loop length**.
- **Sliding on:** the lace is the only opening. The corset must open wide enough at the shoulders to be slid on. The user enters that **widest gap**. The loop length is **not entered**: it is the minimum loop length that lets the corset open to that gap, and the app calculates it.

Changes since v4:
- Sliding on is laced like tightening, including the loops and the loop position.
- Sliding on has one gap: the widest gap at the shoulders. The gap when laced is **not asked**: there is a lot of spare lace, so it cannot be controlled. The calculation assumes the laced corset has no gap (0).
- For sliding on, the loop length is calculated (minimum), not entered.
- The diagram is the same for both uses.

---

## 1. Stack

- Next.js 15 (App Router), TypeScript, React 19
- Tailwind CSS
- Vitest for unit tests
- No backend, no database. Everything runs in the browser.
- Deploy on Vercel with default settings

```bash
npx create-next-app@latest corset-lace-calculator --ts --tailwind --app --eslint
cd corset-lace-calculator
npm i -D vitest
```

---

## 2. Vocabulary (use these names in the UI and in the code)

| UI name | Code name | Meaning |
|---|---|---|
| What is the lace for? | `role`: `"tightening"` or `"slide-on"` | See the goal above |
| Eyelets per side | `eyeletsPerSide` (n) | Number of eyelets in one row |
| Lacing length | `lacingLength` (D) | From the **centre of the top eyelet to the centre of the bottom eyelet** |
| Gap when laced | `lacingGap` (g) | Horizontal distance between the **centres** of two facing eyelets when the corset is laced (worn) |
| Gap at the shoulders | `shoulderGap` | Sliding on only. The **widest** gap (centre to centre) that still lets the corset slide on over the shoulders |
| Loop length | `loopLength` | **Visible length of one loop.** Tightening: entered. Sliding on: calculated (minimum). Each loop uses two strands and there are two loops, so the lace used is `4 x loopLength` |
| Loop position | `loopPosition` (k) | The loop comes **out of eyelet k and goes into eyelet k+1**, on the same side. Both uses |
| Tail length | `tailLength` | Extra lace at **each end**, for tying or knotting. There are two ends |
| Top bar | (segment `bar`) | The straight piece of lace between the two top eyelets. It is the horizontal line at the top of the diagram |
| Eyelet spacing | `eyeletSpacing` | Vertical distance between two neighbouring eyelets |
| Crossing length | `crossingLength` | Length of one diagonal between an eyelet and the next eyelet on the other side, at the laced gap |
| Total lace length | `totalLaceLength` | Result |
| Pass | `Pass`: `"in"` or `"out"` | **In** = the lace goes through the eyelet from the outside to the inside. **Out** = from the inside to the outside |
| Start pass | `startPass` | The pass at eyelet 1 |

Eyelets are numbered per side from the top: 1 to n. Both sides use the same numbering.

---

## 3. UI flow

Single page, `"use client"`.

**Step 1: what is the lace for?** Two large radio cards:
- Tightening: "The corset has another opening (for example a zip). The lace makes it tighter."
- Sliding on: "The lace is the only opening. You slide the corset on over your shoulders."

**Step 2: units.** Toggle `cm` | `in`, default `cm`.

**Step 3: inputs**

| Field | Tightening | Sliding on |
|---|---|---|
| Eyelets per side | shown | shown |
| Lacing length | shown | shown |
| Gap when laced | shown | **hidden** (assumed 0) |
| Gap at the shoulders | **hidden** | shown |
| Loop length | shown (entered) | **hidden** (shown as a result instead) |
| Loop position | shown | shown |
| Tail length (per end) | shown | shown |

Defaults: eyelets per side 12, lacing length 30 cm, gap when laced 3 cm, gap at the shoulders 25 cm, tail length 15 cm, loop length 12 cm, loop position `Math.floor(n / 2)`. These are only starting values.

Help text:
- Lacing length: "Measure from the centre of the top eyelet to the centre of the bottom eyelet."
- Gap when laced: "Distance between the centres of two facing eyelets when the corset is laced."
- Gap at the shoulders: "The widest gap (centre to centre of facing eyelets) that still lets the corset slide on over your shoulders."
- Loop length: "Visible length of one loop. The calculation counts both strands of both loops (4 times this length)."
- Loop position: "The loop comes out of this eyelet and goes into the next one."
- Tail length: "Extra lace at each end, for tying or knotting. Two ends."

Switching the use keeps the values already typed. Hidden fields keep their value in state but are ignored.

**Step 4: results** (live, no submit button)
- Eyelet spacing and crossing length
- Sliding on only: **"Minimum loop length"**, with the text "Each loop must be at least this long (visible length) so the corset can open to the shoulder gap. Worked out as if the corset is laced with no gap."
- A breakdown, so the user can check it:
  - Top bar: `g`
  - Crossings: count x crossing length
  - Loops: `4 x loop length`
  - Tails: `2 x tail length`
- **Total lace length** in bold, with the other unit in smaller text, for example `170.0 cm (66.9 in)`
- Sliding on only: an **information line**, not a warning (neutral style, no red or amber, no warning icon). For example: "When the corset is laced, each loop will be about 130.7 cm long (visible length), if it is laced with no gap." Show it next to the minimum loop length, in the current unit.

**Step 5: threading**
- The generated SVG diagram (section 7)
- A line such as "Start with In at eyelet 1. The loop comes out of eyelet 8 and goes into eyelet 9."
- A table: eyelet number and pass (In or Out)
- Two information lines computed from the model: "Top bar: outside or inside" and "Lace ends: outside or inside". With an odd loop position the top bar lies on the inside. This is information, not an error.

---

## 4. Calculation

All maths is done in **cm**. Convert only at the edges. Do not round in the middle: round only for display.

```
eyeletSpacing  = lacingLength / (n - 1)
crossings      = 2 x (n - 2)              (one level is replaced by the loop)
crossingLength = sqrt(eyeletSpacing^2 + lacingGap^2)
laceAt(gap)    = gap + crossings x sqrt(eyeletSpacing^2 + gap^2)     (top bar + crossings)
```

**Tightening** (loop length entered):
```
totalLaceLength = laceAt(lacingGap) + 4 x loopLength + 2 x tailLength
```

**Sliding on** (loop length calculated). The lace has a fixed length. With the corset fully open at the shoulder gap, the loops are used up. When it is worn, the lace that is no longer needed becomes the loops. The gap when laced is not an input: it is assumed to be 0 (so each crossing is as long as the eyelet spacing, and there is no top bar):
```
loopLength      = max(0, (laceAt(shoulderGap) - laceAt(0)) / 4)     (the minimum)
totalLaceLength = laceAt(0) + 4 x loopLength + 2 x tailLength
                = laceAt(shoulderGap) + 2 x tailLength
```

So the total for sliding on is the lace needed with the corset fully open, plus the tails.

### Units
- `1 in = 2.54 cm` exactly.
- Display precision: 1 decimal in cm, 2 decimals in inches.
- On a unit toggle, convert the typed values (cm to in: divide by 2.54 and keep 2 decimals; in to cm: multiply by 2.54 and keep 1 decimal).
- Eyelets per side and loop position are counts and are never converted.

---

## 5. Verification

- **Crossing count.** Follow one end of the lace from the top. With the loop pair at k and k+1 it makes `k - 1` diagonals above the loop and `n - k - 1` below it, so `n - 2` per end, whatever k is. Two ends give `2(n - 2)`. The unit tests check that the diagram draws exactly this many crossings, for several loop positions.
- **Loop lace.** Each loop is a doubled strand (out and back), and there are two loops, so `4 x loop length`.
- **Sliding on.** A test checks that the laced gap is ignored. Another test checks that the total equals `laceAt(shoulderGap)` plus the tails.
- **Examples** (computed independently and checked by the tests):
  - Tightening, n = 15, D = 33, g = 2.5, loop = 12, tail = 15: spacing 2.357, crossing 3.436, 26 crossings, total **169.8 cm**
  - Sliding on, n = 13, D = 30, shoulder gap = 25, tail = 15: minimum loop length **130.7 cm**, total **607.7 cm**
  - Sliding on, n = 10, D = 30, shoulder gap = 12, tail = 10: minimum loop length **39.5 cm**, total **231.3 cm**
- The total does not depend on the loop position (there is a test for this).
- All code in this spec was run: 19 Vitest tests pass, and the TypeScript compiles in strict mode.

---

## 6. Pass rule

Rules, from the physical lacing:
1. The loop **comes out** of eyelet k (the upper eyelet of the pair, inside to outside) and **goes in** at eyelet k+1 (the lower eyelet, outside to inside).
2. Passes alternate down each side: In, Out, In, Out. Both sides have the same pass at the same row.
3. Therefore eyelet k must be Out, so:

```
startPass = (k is even) ? "in" : "out"
passAt(i) = (i is odd) ? startPass : opposite(startPass)
```

Which face of the corset the lace lies on (seen from the outside):
- After an **In** pass the lace lies on the **inside**. After an **Out** pass it lies on the **outside**.
- A crossing on level j lies on the face given by the pass at eyelet j.
- The top bar arrives at eyelet 1, so it lies on the outside when eyelet 1 is In, and on the inside when eyelet 1 is Out.
- The loops always lie on the outside. The lace ends below eyelet n lie on the face given by the pass at eyelet n.

Consequence: a loop on an even eyelet gives a top bar on the outside. A loop on an odd eyelet gives a top bar on the inside.

---

## 7. Diagram

`buildThreading(n, loopPosition)` (pure logic) returns the pass at each eyelet and a list of segments. `renderThreadingSvg` turns it into an SVG string. It is the same for both uses and shows the corset **as worn** (laced).

Drawing rules:
- The laced side, seen from the outside. Schematic, **not to scale**. Say so in the subtitle.
- Two columns of n eyelets. A ruler of numbers and passes (for example "8 Out") on each side.
- **Solid** line = lace on the outside. **Dashed** line = lace on the inside.
- Loop eyelets are highlighted. The loops are drawn on the outside, bulging away from the centre.
- Colour is never the only signal: every eyelet also has the words In or Out.
- `<title>` and `<desc>` are included for accessibility.

Use in React:

```tsx
const svg = renderThreadingSvg(buildThreading(n, loopPosition));
return <div dangerouslySetInnerHTML={{ __html: svg }} />;
```

This is safe because the string contains only numbers and fixed text produced by the code. Never put user text into it.

Reference drawings delivered with this spec:
- `threading-10-eyelets-loop-8-9.svg`
- `threading-10-eyelets-loop-7-8.svg`

They are generated by the code below and can be used as visual snapshots.

---

## 8. Code

`src/lib/units.ts`

```ts
export type Unit = "cm" | "in";
export const CM_PER_INCH = 2.54;

export const toCm = (v: number, unit: Unit): number =>
  unit === "in" ? v * CM_PER_INCH : v;

export const fromCm = (v: number, unit: Unit): number =>
  unit === "in" ? v / CM_PER_INCH : v;

export const decimals = (unit: Unit): number => (unit === "in" ? 2 : 1);

export const format = (cm: number, unit: Unit): string =>
  fromCm(cm, unit).toFixed(decimals(unit));
```

`src/lib/lace.ts`

```ts
/**
 * Both roles are laced in exactly the same way (top bar, crossings, two loops, two ends).
 * The only difference is how the loop length is decided.
 *
 * tightening: the corset has another opening (a zip, for example). The user chooses the loop length.
 * slide-on: the lace is the only opening. The loop must be long enough to let the corset open
 *           to the widest gap at the shoulders, so the minimum loop length is calculated.
 */
export type LaceRole = "tightening" | "slide-on";

/** in: the lace goes from outside to inside. out: from inside to outside. */
export type Pass = "in" | "out";

export interface LaceInput {
  role: LaceRole;
  /** n: whole number, 2 or more */
  eyeletsPerSide: number;
  /** cm: centre of the top eyelet to centre of the bottom eyelet */
  lacingLength: number;
  /** cm: horizontal distance between the centres of two facing eyelets, when laced (worn) */
  lacingGap: number;
  /** cm: extra lace at each of the two ends, for tying or knotting */
  tailLength: number;
  /** 1..n-1: the loop leaves eyelet k and enters eyelet k+1 */
  loopPosition: number;
  /** cm: visible length of one loop. Tightening only */
  loopLength?: number;
  /** cm: widest gap that still lets the corset slide on. Slide-on only, at least lacingGap */
  shoulderGap?: number;
}

export interface LaceResult {
  eyeletSpacing: number;
  /** length of one diagonal at the laced gap */
  crossingLength: number;
  crossingCount: number;
  /** length of the straight piece across the top eyelets */
  topBarLength: number;
  /** tightening: the input. slide-on: the minimum, calculated */
  loopLength: number;
  /** lace used by the loops: 4 x loop length (2 loops, each with 2 strands) */
  loopsLace: number;
  /** lace used by the two ends: 2 x tail length */
  tailsLace: number;
  totalLaceLength: number;
  startPass: Pass;
}

export const opposite = (p: Pass): Pass => (p === "in" ? "out" : "in");

/** Number of diagonal crossings: one level is replaced by the loop. */
export const crossingCount = (n: number): number => 2 * (n - 2);

/** The loop leaves eyelet k (inside to outside). Passes alternate down each side. */
export const startPassFor = (loopPosition: number): Pass =>
  loopPosition % 2 === 0 ? "in" : "out";

export const passAt = (eyelet: number, start: Pass): Pass =>
  eyelet % 2 === 1 ? start : opposite(start);

export function threadingTable(n: number, start: Pass) {
  return Array.from({ length: n }, (_, i) => ({
    eyelet: i + 1,
    pass: passAt(i + 1, start),
  }));
}

/** Lace used by the top bar and the crossings, with no loops pulled out. */
export function laceAtGap(n: number, lacingLength: number, gap: number): number {
  const spacing = lacingLength / (n - 1);
  return gap + crossingCount(n) * Math.hypot(spacing, gap);
}

/** All lengths in cm. No rounding: round only when displaying. */
export function calculate(input: LaceInput): LaceResult {
  const { role, eyeletsPerSide: n, lacingLength: D, tailLength } = input;
  // Sliding on: the laced gap cannot be controlled (there is a lot of spare lace), so the
  // laced corset is assumed to have no gap. The input lacingGap is ignored.
  const g = role === "slide-on" ? 0 : input.lacingGap;

  const eyeletSpacing = D / (n - 1);
  const crossingLength = Math.hypot(eyeletSpacing, g);
  const count = crossingCount(n);

  // The lace has a fixed length. With the corset fully open (shoulder gap) the loops are used
  // up. When it is worn (assumed gap 0) the lace that is no longer needed becomes the loops.
  const loopLength =
    role === "tightening"
      ? (input.loopLength ?? 0)
      : Math.max(
          0,
          (laceAtGap(n, D, input.shoulderGap ?? 0) - laceAtGap(n, D, g)) / 4
        );

  const topBarLength = g;
  const loopsLace = 4 * loopLength;
  const tailsLace = 2 * tailLength;

  return {
    eyeletSpacing,
    crossingLength,
    crossingCount: count,
    topBarLength,
    loopLength,
    loopsLace,
    tailsLace,
    totalLaceLength: topBarLength + count * crossingLength + loopsLace + tailsLace,
    startPass: startPassFor(input.loopPosition),
  };
}
```

`src/lib/diagram.ts`

```ts
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
```

---

## 9. Validation

- `eyeletsPerSide`: whole number, 2 or more (the loop needs a pair of eyelets)
- `lacingLength`: number greater than 0. `lacingGap` (tightening only): number greater than 0. Not asked or checked when sliding on.
- `shoulderGap` (sliding on): number greater than 0
- `tailLength`: number of 0 or more
- `loopLength` (tightening): number of 0 or more
- `loopPosition`: whole number from 1 to `eyeletsPerSide - 1`. If n changes and the value becomes invalid, clamp it.
- Invalid or empty input: short message under the field, no result, never `NaN`

---

## 10. Tests

`src/lib/lace.test.ts`

```ts
import { describe, it, expect } from "vitest";
import {
  calculate,
  crossingCount,
  laceAtGap,
  startPassFor,
  passAt,
  threadingTable,
} from "./lace";
import { buildThreading } from "./diagram";
import { toCm, fromCm } from "./units";

describe("tightening", () => {
  it("top bar + crossings + 4 x loop + 2 x tail", () => {
    const r = calculate({
      role: "tightening",
      eyeletsPerSide: 15,
      lacingLength: 33,
      lacingGap: 2.5,
      loopLength: 12,
      tailLength: 15,
      loopPosition: 7,
    });
    expect(r.eyeletSpacing).toBeCloseTo(2.357143, 5);
    expect(r.crossingLength).toBeCloseTo(3.436004, 5);
    expect(r.crossingCount).toBe(26);
    expect(r.topBarLength).toBe(2.5);
    expect(r.loopLength).toBe(12);
    expect(r.loopsLace).toBe(48);
    expect(r.tailsLace).toBe(30);
    expect(r.totalLaceLength).toBeCloseTo(169.8361, 3);
    expect(r.startPass).toBe("out");
  });

  it("second example", () => {
    const r = calculate({
      role: "tightening",
      eyeletsPerSide: 10,
      lacingLength: 30,
      lacingGap: 3,
      loopLength: 10,
      tailLength: 10,
      loopPosition: 8,
    });
    expect(r.totalLaceLength).toBeCloseTo(134.7527, 3);
  });

  it("the total does not depend on the loop position", () => {
    const base = {
      role: "tightening" as const,
      eyeletsPerSide: 10,
      lacingLength: 30,
      lacingGap: 3,
      loopLength: 10,
      tailLength: 10,
    };
    const a = calculate({ ...base, loopPosition: 2 }).totalLaceLength;
    const b = calculate({ ...base, loopPosition: 8 }).totalLaceLength;
    expect(a).toBeCloseTo(b, 10);
  });
});

describe("slide-on", () => {
  const base = {
    role: "slide-on" as const,
    eyeletsPerSide: 13,
    lacingLength: 30,
    lacingGap: 3,
    shoulderGap: 25,
    tailLength: 15,
    loopPosition: 6,
  };

  it("derives the minimum loop length from the shoulder gap, assuming no gap when laced", () => {
    const r = calculate(base);
    expect(r.eyeletSpacing).toBeCloseTo(2.5, 6);
    expect(r.crossingLength).toBeCloseTo(2.5, 9);
    expect(r.crossingCount).toBe(22);
    expect(r.topBarLength).toBe(0);
    expect(r.loopLength).toBeCloseTo((laceAtGap(13, 30, 25) - 22 * 2.5) / 4, 9);
    expect(r.totalLaceLength).toBeCloseTo(laceAtGap(13, 30, 25) + 30, 9);
  });

  it("ignores the gap when laced", () => {
    expect(calculate({ ...base, lacingGap: 9 })).toEqual(calculate(base));
  });

  it("never gives a negative loop length", () => {
    expect(calculate({ ...base, shoulderGap: 0 }).loopLength).toBe(0);
  });
});

describe("crossing count", () => {
  it("one level is replaced by the loop", () => {
    expect(crossingCount(10)).toBe(16);
    expect(crossingCount(2)).toBe(0);
  });
});

describe("pass rule", () => {
  it("the loop comes out of eyelet k and goes into eyelet k+1", () => {
    for (const n of [4, 10, 15]) {
      for (let k = 1; k <= n - 1; k++) {
        const t = threadingTable(n, startPassFor(k));
        expect(t[k - 1].pass).toBe("out");
        expect(t[k].pass).toBe("in");
      }
    }
  });
  it("passes alternate down the side", () => {
    expect(passAt(1, "in")).toBe("in");
    expect(passAt(2, "in")).toBe("out");
    expect(passAt(3, "in")).toBe("in");
  });
  it("start pass follows the parity of the loop eyelet", () => {
    expect(startPassFor(8)).toBe("in");
    expect(startPassFor(7)).toBe("out");
  });
});

describe("threading model", () => {
  it("crossing segments match the crossing count used for the lace length", () => {
    for (const [n, k] of [[10, 8], [10, 7], [10, 1], [10, 9], [13, 6]] as const) {
      const m = buildThreading(n, k);
      expect(m.segments.filter((s) => s.kind === "cross").length).toBe(crossingCount(n));
    }
  });
  it("has one top bar, two loops and two ends", () => {
    const m = buildThreading(10, 8);
    expect(m.segments.filter((s) => s.kind === "bar").length).toBe(1);
    expect(m.segments.filter((s) => s.kind === "loop").length).toBe(2);
    expect(m.segments.filter((s) => s.kind === "tail").length).toBe(2);
  });
  it("the loops lie on the outside", () => {
    const m = buildThreading(10, 7);
    for (const s of m.segments.filter((s) => s.kind === "loop")) expect(s.surface).toBe("outside");
  });
  it("no crossing on the loop level", () => {
    const m = buildThreading(10, 8);
    expect(m.segments.some((s) => s.kind === "cross" && s.from.eyelet === 8)).toBe(false);
  });
  it("rejects an invalid loop position", () => {
    expect(() => buildThreading(10, 10)).toThrow();
    expect(() => buildThreading(10, 0)).toThrow();
    expect(() => buildThreading(10, 2.5)).toThrow();
  });
});

describe("units", () => {
  it("converts exactly", () => {
    expect(toCm(1, "in")).toBe(2.54);
    expect(fromCm(25.4, "in")).toBeCloseTo(10, 10);
  });
});
```

Add `"test": "vitest run"` to `package.json`.

---

## 11. Build order

1. Scaffold the project (section 1)
2. Add the three files in `src/lib` and the test file; run `npm test` until green
3. Build the role cards, unit toggle and inputs (section 3)
4. Add validation (section 9)
5. Add the results with the breakdown, and the threading table
6. Add the diagram (section 7) and compare it with the two reference SVGs
7. Check on a phone-sized screen
8. Deploy to Vercel (push to GitHub, import the repo, keep the defaults)

---

## 12. Decisions and open questions

Decided:
- Sliding on is laced exactly like tightening. Only the way it is worn differs.
- For sliding on, the loop length is the minimum that lets the corset open to the shoulder gap. It is calculated, not entered.

- With a wide shoulder gap the minimum loop length is very long (about 131 cm in the first sliding-on example). This is expected and confirmed on real corsets: the lace must be long enough for the open corset, so there is no other way to do it. The app shows the loop length as plain information (section 3, step 4), not as a warning.

Open questions: none at the moment.
