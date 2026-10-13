export type Unit = "cm" | "in";
export const CM_PER_INCH = 2.54;

export const toCm = (v: number, unit: Unit): number =>
  unit === "in" ? v * CM_PER_INCH : v;

export const fromCm = (v: number, unit: Unit): number =>
  unit === "in" ? v / CM_PER_INCH : v;

export const decimals = (unit: Unit): number => (unit === "in" ? 2 : 1);

export const format = (cm: number, unit: Unit): string =>
  fromCm(cm, unit).toFixed(decimals(unit));
