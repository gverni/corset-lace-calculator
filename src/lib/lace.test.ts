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
    const a = calculate(base);
    const b = calculate({ ...base, lacingGap: 9 });
    expect(b).toEqual(a);
  });

  it("matches a tightening corset with zero gap that uses the derived loop length", () => {
    const s = calculate(base);
    const t = calculate({
      role: "tightening",
      eyeletsPerSide: 13,
      lacingLength: 30,
      lacingGap: 0,
      tailLength: 15,
      loopPosition: 6,
      loopLength: s.loopLength,
    });
    expect(t.totalLaceLength).toBeCloseTo(s.totalLaceLength, 9);
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
