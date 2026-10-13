import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { buildThreading, renderThreadingSvg } from "./diagram";

const read = (name: string) => readFileSync(new URL(`../../docs/${name}`, import.meta.url), "utf8");

describe("reference drawings", () => {
  it("10 eyelets, loop between 8 and 9", () => {
    expect(renderThreadingSvg(buildThreading(10, 8))).toBe(read("threading-10-eyelets-loop-8-9.svg"));
  });
  it("10 eyelets, loop between 7 and 8", () => {
    expect(renderThreadingSvg(buildThreading(10, 7))).toBe(read("threading-10-eyelets-loop-7-8.svg"));
  });
});
