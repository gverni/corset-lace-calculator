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
  /** cm: widest gap that still lets the corset slide on. Slide-on only */
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
