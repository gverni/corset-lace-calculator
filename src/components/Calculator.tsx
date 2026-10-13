"use client";

import { useMemo, useState } from "react";
import { Field } from "./Field";
import { Results } from "./Results";
import { RoleCards } from "./RoleCards";
import { Threading } from "./Threading";
import { UnitToggle } from "./UnitToggle";
import { compute } from "@/lib/compute";
import { clampLoopPosition, convertLengthFields, defaultFields, type FieldKey, type RawFields } from "@/lib/fields";
import type { LaceRole } from "@/lib/lace";
import type { Unit } from "@/lib/units";
import { validate } from "@/lib/validation";

export default function Calculator() {
  const [role, setRole] = useState<LaceRole>("tightening");
  const [unit, setUnit] = useState<Unit>("cm");
  const [fields, setFields] = useState<RawFields>(defaultFields);

  const { errors, values } = useMemo(() => validate(role, fields), [role, fields]);
  const result = useMemo(() => (values ? compute(role, unit, values) : undefined), [role, unit, values]);

  const setField = (key: FieldKey) => (value: string) =>
    setFields((prev) => {
      const next = { ...prev, [key]: value };
      return key === "eyeletsPerSide" ? clampLoopPosition(next) : next;
    });

  const changeUnit = (next: Unit) => {
    if (next === unit) return;
    setFields((prev) => convertLengthFields(prev, unit, next));
    setUnit(next);
  };

  const slideOn = role === "slide-on";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div>
          <h1 className="font-serif text-4xl leading-none tracking-tight sm:text-5xl">Corset lace calculator</h1>
          <p className="mt-3 text-ink-soft">Work out how much lace a corset needs, and how to thread it.</p>
        </div>
        <UnitToggle value={unit} onChange={changeUnit} />
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[26rem_minmax(0,1fr)] lg:items-start lg:gap-10">
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()} noValidate>
          <RoleCards value={role} onChange={setRole} />

          <fieldset>
            <legend className="font-serif text-xl">Corset measurements</legend>
            <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <Field
                id="eyeletsPerSide"
                label="Eyelets per side"
                help="Count the eyelets in one row."
                value={fields.eyeletsPerSide}
                onChange={setField("eyeletsPerSide")}
                error={errors.eyeletsPerSide}
                inputMode="numeric"
              />
              <Field
                id="lacingLength"
                label="Lacing length"
                help="Measure from the centre of the top eyelet to the centre of the bottom eyelet."
                value={fields.lacingLength}
                onChange={setField("lacingLength")}
                error={errors.lacingLength}
                unit={unit}
              />
              {!slideOn ? (
                <Field
                  id="lacingGap"
                  label="Gap when laced"
                  help="Distance between the centres of two facing eyelets when the corset is laced."
                  value={fields.lacingGap}
                  onChange={setField("lacingGap")}
                  error={errors.lacingGap}
                  unit={unit}
                />
              ) : null}
              {slideOn ? (
                <Field
                  id="shoulderGap"
                  label="Gap at the shoulders"
                  help="The widest gap (centre to centre of facing eyelets) that still lets the corset slide on over your shoulders."
                  value={fields.shoulderGap}
                  onChange={setField("shoulderGap")}
                  error={errors.shoulderGap}
                  unit={unit}
                />
              ) : null}
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-serif text-xl">Loops and ends</legend>
            <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              <Field
                id="loopPosition"
                label="Loop position"
                help="The loop comes out of this eyelet and goes into the next one. Count from the top."
                value={fields.loopPosition}
                onChange={setField("loopPosition")}
                error={errors.loopPosition}
                inputMode="numeric"
              />
              {slideOn ? null : (
                <Field
                  id="loopLength"
                  label="Loop length"
                  help="Visible length of one loop. The calculation counts both strands of both loops (4 times this length)."
                  value={fields.loopLength}
                  onChange={setField("loopLength")}
                  error={errors.loopLength}
                  unit={unit}
                />
              )}
              <Field
                id="tailLength"
                label="Tail length (per end)"
                help="Extra lace at each end, for tying or knotting. Two ends."
                value={fields.tailLength}
                onChange={setField("tailLength")}
                error={errors.tailLength}
                unit={unit}
              />
            </div>
          </fieldset>
        </form>

        <div className="space-y-6" aria-live="polite">
          {values && result ? (
            <>
              <Results role={role} unit={unit} result={result} />
              <Threading eyeletsPerSide={values.eyeletsPerSide} loopPosition={values.loopPosition} />
            </>
          ) : (
            <section className="rounded border border-dashed border-chalk bg-panel p-6">
              <h2 className="font-serif text-2xl">Lace needed</h2>
              <p className="mt-2 text-ink-soft">Fix the fields marked in red to see the result.</p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
