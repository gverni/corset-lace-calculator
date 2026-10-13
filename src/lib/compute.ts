import { calculate, type LaceResult, type LaceRole } from "./lace";
import { toCm, type Unit } from "./units";
import type { ParsedFields } from "./validation";

/** Takes the numbers as typed (in `unit`) and returns the result in cm. */
export function compute(role: LaceRole, unit: Unit, v: ParsedFields): LaceResult {
  const cm = (x: number) => toCm(x, unit);
  return calculate({
    role,
    eyeletsPerSide: v.eyeletsPerSide,
    lacingLength: cm(v.lacingLength),
    lacingGap: cm(v.lacingGap),
    tailLength: cm(v.tailLength),
    loopPosition: v.loopPosition,
    loopLength: v.loopLength === undefined ? undefined : cm(v.loopLength),
    shoulderGap: v.shoulderGap === undefined ? undefined : cm(v.shoulderGap),
  });
}
