"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCalculator } from "@/lib/catalog"
import type { CalculatorField } from "@/lib/types"
import { cn } from "@/lib/utils"

export function CalculatorWorkspace({ slug }: { slug: string }) {
  const calculator = getCalculator(slug)
  const defaults = useMemo(() => {
    if (!calculator) return {}
    return Object.fromEntries(calculator.fields.map((field) => [field.id, field.defaultValue]))
  }, [calculator])
  const [values, setValues] = useState<Record<string, string>>(defaults)

  if (!calculator) return null

  const visible = calculator.fields.filter((field) => {
    if (!field.showWhen) return true
    return values[field.showWhen.id] === field.showWhen.value
  })
  const result = calculator.compute(values)
  const hero = result.ok ? (result.lines.find((line) => line.emphasis) ?? result.lines[0]) : null
  const rest = result.ok && hero ? result.lines.filter((line) => line !== hero) : []

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form
        className="rounded-2xl border border-border bg-card p-4 sm:p-6"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold text-muted-foreground">Angaben</p>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-lg"
            onClick={() => setValues(defaults)}
          >
            Beispielwerte
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Das Ergebnis aktualisiert sich beim Tippen.</p>
        <div className="mt-5 space-y-5">
          {visible.map((field, index) => {
            const previous = visible[index - 1]
            const showGroup = field.group && field.group !== previous?.group
            return (
              <div key={field.id}>
                {showGroup ? <h3 className="mb-3 font-heading text-lg font-semibold">{field.group}</h3> : null}
                <FieldControl
                  field={field}
                  slug={slug}
                  value={values[field.id] ?? ""}
                  invalid={!result.ok && result.message.includes(`„${field.label}“`)}
                  onChange={(next) => setValues((current) => ({ ...current, [field.id]: next }))}
                />
              </div>
            )
          })}
        </div>
      </form>

      <section
        aria-live="polite"
        aria-atomic="true"
        className="rounded-2xl border border-border bg-card p-4 sm:p-6 lg:sticky lg:top-24"
      >
        <h2 className="text-sm font-bold tracking-[0.14em] text-teal uppercase">Ergebnis</h2>
        {result.ok && hero ? (
          <div className="mt-4 border-t-4 border-teal pt-4">
            <p className="text-sm font-semibold text-muted-foreground">{hero.label}</p>
            <p className="mt-1 font-heading text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">
              {hero.value}
            </p>
            {hero.detail ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hero.detail}</p> : null}
            {rest.length > 0 ? (
              <dl className="mt-6 space-y-3">
                {rest.map((item) => (
                  <div key={item.label} className="flex items-baseline justify-between gap-4 border-b border-border/80 pb-3">
                    <dt className="text-sm text-muted-foreground">{item.label}</dt>
                    <dd className="text-right font-semibold tabular-nums">
                      {item.value}
                      {item.detail ? <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{item.detail}</span> : null}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {result.worked.length > 0 ? (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-foreground">Mit deinen Zahlen</h3>
                <ol className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground tabular-nums">
                  {result.worked.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-base leading-relaxed" role="status">
            {result.ok ? "Für diese Angaben gibt es kein Ergebnis." : result.message}
          </p>
        )}
      </section>
    </div>
  )
}

function FieldControl({
  field,
  slug,
  value,
  invalid,
  onChange,
}: {
  field: CalculatorField
  slug: string
  value: string
  invalid: boolean
  onChange: (value: string) => void
}) {
  const id = `${slug}-${field.id}`
  const hintId = field.hint ? `${id}-hinweis` : undefined

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base">
        {field.label}
        {field.unit ? <span className="sr-only"> in {field.unit}</span> : null}
      </Label>
      {field.kind === "select" ? (
        <select
          id={id}
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={hintId}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full rounded-xl border border-foreground/15 bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="relative">
          <Input
            id={id}
            value={value}
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={invalid || undefined}
            aria-describedby={hintId}
            onChange={(event) => onChange(event.target.value)}
            className={cn(
              "h-12 rounded-xl border-foreground/15 bg-background px-3 text-base md:text-base",
              field.unit && "pr-16",
            )}
          />
          {field.unit ? (
            <span aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
              {field.unit}
            </span>
          ) : null}
        </div>
      )}
      {field.hint ? (
        <p id={hintId} className="text-sm leading-relaxed text-muted-foreground">
          {field.hint}
        </p>
      ) : null}
    </div>
  )
}
