import { describe, it, expect } from "vitest";
import {
  clampLoopPosition,
  convertLengthFields,
  defaultFields,
  parseNumber,
  parseWholeNumber,
} from "./fields";
import { validate, visibleFields } from "./validation";
import { compute } from "./compute";
import type { ParsedFields } from "./validation";

describe("parseNumber", () => {
  it("accepts dots and commas", () => {
    expect(parseNumber("2.5")).toBe(2.5);
    expect(parseNumber("2,5")).toBe(2.5);
    expect(parseNumber(" 7 ")).toBe(7);
    expect(parseNumber(".5")).toBe(0.5);
    expect(parseNumber("3.")).toBe(3);
  });
  it("rejects everything else", () => {
    for (const bad of ["", " ", "abc", "-1", "1e3", ".", "1.2.3", "2 cm"]) {
      expect(parseNumber(bad)).toBeUndefined();
    }
  });
  it("whole numbers only", () => {
    expect(parseWholeNumber("12")).toBe(12);
    expect(parseWholeNumber("12.0")).toBe(12);
    expect(parseWholeNumber("12.5")).toBeUndefined();
  });
});

describe("convertLengthFields", () => {
  it("cm to inches keeps 2 decimals and leaves counts alone", () => {
    const r = convertLengthFields(defaultFields(), "cm", "in");
    expect(r.lacingLength).toBe("11.81");
    expect(r.lacingGap).toBe("1.18");
    expect(r.shoulderGap).toBe("9.84");
    expect(r.tailLength).toBe("5.91");
    expect(r.loopLength).toBe("4.72");
    expect(r.eyeletsPerSide).toBe("12");
    expect(r.loopPosition).toBe("6");
  });
  it("inches back to cm keeps 1 decimal", () => {
    const back = convertLengthFields(convertLengthFields(defaultFields(), "cm", "in"), "in", "cm");
    expect(back.lacingLength).toBe("30");
    expect(back.lacingGap).toBe("3");
    expect(back.shoulderGap).toBe("25");
  });
  it("leaves text that is not a number", () => {
    const r = convertLengthFields({ ...defaultFields(), lacingGap: "abc" }, "cm", "in");
    expect(r.lacingGap).toBe("abc");
  });
  it("does nothing when the unit does not change", () => {
    const f = defaultFields();
    expect(convertLengthFields(f, "cm", "cm")).toBe(f);
  });
});

describe("clampLoopPosition", () => {
  it("moves the loop up when there are fewer eyelets", () => {
    const r = clampLoopPosition({ ...defaultFields(), eyeletsPerSide: "8", loopPosition: "10" });
    expect(r.loopPosition).toBe("7");
  });
  it("leaves a valid position alone", () => {
    const f = { ...defaultFields(), eyeletsPerSide: "8", loopPosition: "7" };
    expect(clampLoopPosition(f)).toBe(f);
  });
  it("leaves things alone while the number of eyelets is not valid", () => {
    const f = { ...defaultFields(), eyeletsPerSide: "", loopPosition: "10" };
    expect(clampLoopPosition(f)).toBe(f);
    const g = { ...defaultFields(), eyeletsPerSide: "1", loopPosition: "10" };
    expect(clampLoopPosition(g)).toBe(g);
  });
});

describe("validate", () => {
  it("the default values are valid for both uses", () => {
    for (const role of ["tightening", "slide-on"] as const) {
      const v = validate(role, defaultFields());
      expect(v.errors).toEqual({});
      expect(v.values).toBeDefined();
    }
  });

  it("only returns the values for the fields that are visible", () => {
    const t = validate("tightening", defaultFields()).values as ParsedFields;
    expect(t.loopLength).toBe(12);
    expect(t.shoulderGap).toBeUndefined();
    const s = validate("slide-on", defaultFields()).values as ParsedFields;
    expect(s.shoulderGap).toBe(25);
    expect(s.loopLength).toBeUndefined();
  });

  it("ignores hidden fields, even when they are wrong", () => {
    expect(validate("tightening", { ...defaultFields(), shoulderGap: "abc" }).errors).toEqual({});
    expect(validate("slide-on", { ...defaultFields(), loopLength: "abc" }).errors).toEqual({});
  });

  it("lists the visible fields for each use", () => {
    expect(visibleFields("tightening")).toContain("loopLength");
    expect(visibleFields("tightening")).not.toContain("shoulderGap");
    expect(visibleFields("slide-on")).toContain("shoulderGap");
    expect(visibleFields("slide-on")).not.toContain("loopLength");
  });

  it("checks the number of eyelets", () => {
    for (const bad of ["", "1", "0", "2.5", "abc"]) {
      expect(validate("tightening", { ...defaultFields(), eyeletsPerSide: bad }).errors.eyeletsPerSide).toBe(
        "Enter a whole number, 2 or more."
      );
    }
    expect(validate("tightening", { ...defaultFields(), eyeletsPerSide: "2", loopPosition: "1" }).errors).toEqual({});
  });

  it("lengths must be greater than 0, tails and loops may be 0", () => {
    expect(validate("tightening", { ...defaultFields(), lacingLength: "0" }).errors.lacingLength).toBe(
      "Enter a number greater than 0."
    );
    expect(validate("tightening", { ...defaultFields(), lacingGap: "" }).errors.lacingGap).toBe(
      "Enter a number greater than 0."
    );
    expect(validate("tightening", { ...defaultFields(), tailLength: "0", loopLength: "0" }).errors).toEqual({});
    expect(validate("tightening", { ...defaultFields(), tailLength: "" }).errors.tailLength).toBe(
      "Enter a number, 0 or more."
    );
  });

  it("sliding on does not need the gap when laced", () => {
    expect(validate("slide-on", { ...defaultFields(), lacingGap: "" }).errors).toEqual({});
    expect(validate("slide-on", { ...defaultFields(), shoulderGap: "0" }).errors.shoulderGap).toBe(
      "Enter a number greater than 0."
    );
  });

  it("the loop position must be a whole number from 1 to n - 1", () => {
    const f = { ...defaultFields(), eyeletsPerSide: "12" };
    expect(validate("tightening", { ...f, loopPosition: "12" }).errors.loopPosition).toBe("Enter a whole number from 1 to 11.");
    expect(validate("tightening", { ...f, loopPosition: "0" }).errors.loopPosition).toBe("Enter a whole number from 1 to 11.");
    expect(validate("tightening", { ...f, loopPosition: "2.5" }).errors.loopPosition).toBe("Enter a whole number from 1 to 11.");
    expect(validate("tightening", { ...f, loopPosition: "11" }).errors).toEqual({});
  });

  it("accepts a decimal comma", () => {
    const v = validate("tightening", { ...defaultFields(), lacingGap: "2,5" });
    expect(v.values?.lacingGap).toBe(2.5);
  });

  it("gives no values when anything is wrong", () => {
    expect(validate("tightening", { ...defaultFields(), lacingGap: "x" }).values).toBeUndefined();
  });
});

describe("compute", () => {
  it("default values, tightening", () => {
    const v = validate("tightening", defaultFields()).values as ParsedFields;
    const r = compute("tightening", "cm", v);
    expect(r.eyeletSpacing).toBeCloseTo(2.727273, 5);
    expect(r.crossingLength).toBeCloseTo(4.054382, 5);
    expect(r.totalLaceLength).toBeCloseTo(162.0876, 3);
  });

  it("default values, slide-on", () => {
    const v = validate("slide-on", defaultFields()).values as ParsedFields;
    const r = compute("slide-on", "cm", v);
    expect(r.loopLength).toBeCloseTo(118.3552, 3);
    expect(r.totalLaceLength).toBeCloseTo(557.9664, 3);
  });

  it("the same corset in inches gives the same result in cm", () => {
    for (const role of ["tightening", "slide-on"] as const) {
      const cm = validate(role, defaultFields()).values as ParsedFields;
      const inches: ParsedFields = {
        ...cm,
        lacingLength: cm.lacingLength / 2.54,
        lacingGap: cm.lacingGap / 2.54,
        tailLength: cm.tailLength / 2.54,
        loopLength: cm.loopLength === undefined ? undefined : cm.loopLength / 2.54,
        shoulderGap: cm.shoulderGap === undefined ? undefined : cm.shoulderGap / 2.54,
      };
      const a = compute(role, "cm", cm);
      const b = compute(role, "in", inches);
      expect(b.totalLaceLength).toBeCloseTo(a.totalLaceLength, 9);
      expect(b.loopLength).toBeCloseTo(a.loopLength, 9);
    }
  });
});
