import { CM_PER_INCH, type Unit } from "./units";

export type FieldKey =
  | "eyeletsPerSide"
  | "lacingLength"
  | "lacingGap"
  | "shoulderGap"
  | "tailLength"
  | "loopLength"
  | "loopPosition";

/** What the user has typed, as text. Lengths are in the unit currently selected. */
export type RawFields = Record<FieldKey, string>;

export const LENGTH_FIELDS = [
  "lacingLength",
  "lacingGap",
  "shoulderGap",
  "tailLength",
  "loopLength",
] as const satisfies readonly FieldKey[];

/** Starting values, in cm. */
export function defaultFields(): RawFields {
  return {
    eyeletsPerSide: "12",
    lacingLength: "30",
    lacingGap: "3",
    shoulderGap: "25",
    tailLength: "15",
    loopLength: "12",
    loopPosition: "6", // Math.floor(12 / 2)
  };
}

/** Accepts "2.5" and "2,5". Returns undefined for anything else, including empty text. */
export function parseNumber(text: string): number | undefined {
  const t = text.trim().replace(",", ".");
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export function parseWholeNumber(text: string): number | undefined {
  const n = parseNumber(text);
  return n !== undefined && Number.isInteger(n) ? n : undefined;
}

/**
 * Converts the typed lengths when the unit changes. cm to in keeps 2 decimals,
 * in to cm keeps 1 decimal. Text that is not a number is left alone.
 */
export function convertLengthFields(raw: RawFields, from: Unit, to: Unit): RawFields {
  if (from === to) return raw;
  const digits = to === "in" ? 2 : 1;
  const next = { ...raw };
  for (const key of LENGTH_FIELDS) {
    const n = parseNumber(raw[key]);
    if (n === undefined) continue;
    const converted = from === "cm" ? n / CM_PER_INCH : n * CM_PER_INCH;
    next[key] = String(Number(converted.toFixed(digits)));
  }
  return next;
}

/** If the number of eyelets drops below the loop position, move the loop up to the last pair. */
export function clampLoopPosition(raw: RawFields): RawFields {
  const n = parseWholeNumber(raw.eyeletsPerSide);
  const k = parseWholeNumber(raw.loopPosition);
  if (n !== undefined && n >= 2 && k !== undefined && k > n - 1) {
    return { ...raw, loopPosition: String(n - 1) };
  }
  return raw;
}
