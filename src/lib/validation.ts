import type { LaceRole } from "./lace";
import { parseNumber, parseWholeNumber, type FieldKey, type RawFields } from "./fields";

export type FieldErrors = Partial<Record<FieldKey, string>>;

/** Numbers in the unit the user is working in. */
export interface ParsedFields {
  eyeletsPerSide: number;
  lacingLength: number;
  lacingGap: number;
  shoulderGap?: number; // slide-on only
  tailLength: number;
  loopLength?: number; // tightening only
  loopPosition: number;
}

export interface Validation {
  errors: FieldErrors;
  /** Only present when there are no errors. */
  values?: ParsedFields;
}

/** The fields the user can see for each use. Hidden fields are ignored. */
export function visibleFields(role: LaceRole): FieldKey[] {
  return role === "tightening"
    ? ["eyeletsPerSide", "lacingLength", "lacingGap", "loopPosition", "loopLength", "tailLength"]
    : ["eyeletsPerSide", "lacingLength", "shoulderGap", "loopPosition", "tailLength"];
}

const MSG = {
  eyelets: "Enter a whole number, 2 or more.",
  positive: "Enter a number greater than 0.",
  nonNegative: "Enter a number, 0 or more.",
} as const;

export function validate(role: LaceRole, raw: RawFields): Validation {
  const errors: FieldErrors = {};

  const n = parseWholeNumber(raw.eyeletsPerSide);
  if (n === undefined || n < 2) errors.eyeletsPerSide = MSG.eyelets;

  const lacingLength = parseNumber(raw.lacingLength);
  if (lacingLength === undefined || lacingLength <= 0) errors.lacingLength = MSG.positive;

  // Not used when sliding on (the laced gap is assumed to be 0).
  const lacingGap = role === "slide-on" ? 0 : parseNumber(raw.lacingGap);
  if (lacingGap === undefined || lacingGap <= 0) {
    if (role !== "slide-on") errors.lacingGap = MSG.positive;
  }

  const tailLength = parseNumber(raw.tailLength);
  if (tailLength === undefined) errors.tailLength = MSG.nonNegative;

  const loopPosition = parseWholeNumber(raw.loopPosition);
  if (loopPosition === undefined || loopPosition < 1) {
    errors.loopPosition =
      n !== undefined && n >= 2
        ? `Enter a whole number from 1 to ${n - 1}.`
        : "Enter a whole number, 1 or more.";
  } else if (n !== undefined && n >= 2 && loopPosition > n - 1) {
    errors.loopPosition = `Enter a whole number from 1 to ${n - 1}.`;
  }

  let shoulderGap: number | undefined;
  let loopLength: number | undefined;

  if (role === "slide-on") {
    shoulderGap = parseNumber(raw.shoulderGap);
    if (shoulderGap === undefined || shoulderGap <= 0) {
      errors.shoulderGap = MSG.positive;
    }
  } else {
    loopLength = parseNumber(raw.loopLength);
    if (loopLength === undefined) errors.loopLength = MSG.nonNegative;
  }

  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    values: {
      eyeletsPerSide: n as number,
      lacingLength: lacingLength as number,
      lacingGap: lacingGap as number,
      shoulderGap,
      tailLength: tailLength as number,
      loopLength,
      loopPosition: loopPosition as number,
    },
  };
}
