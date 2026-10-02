"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

import { CalculatorCard } from "@/components/calculator-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { categories } from "@/lib/categories"
import { calculators, highlightedCalculators } from "@/lib/catalog"
import { compoundInterest } from "@/lib/formulas/finance"
import { formatEuro } from "@/lib/format"
import { searchCalculators } from "@/lib/search"

const indexed = calculators.map((calculator) => ({
  ...calculator,
  categoryTitle: categories.find((category) => category.id === calculator.category)?.title ?? "",
}))

export function CatalogBrowser() {
  const [query, setQuery] = useState("")
  const trimmed = query.trim()
  const results = useMemo(() => searchCalculators(indexed, trimmed), [trimmed])
  const preview = compoundInterest({
    principal: 10000,
    annualRatePercent: 3,
    years: 10,
    periodsPerYear: 1,
  })
  const previewText = preview.ok ? formatEuro(preview.data.final) : ""

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-8 sm:py-12">
      <section className="grid items-end gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
        <div>
          <p className="text-sm font-bold tracking-[0.16em] text-teal uppercase">Kostenlos und ohne Konto</p>
          <h1 className="mt-3 font-heading text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Einrechner
          </h1>
          <p className="mt-3 max-w-xl font-heading text-2xl leading-snug text-foreground sm:text-3xl">
            Die Zahl, bevor du entscheidest.
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Kreditrate, Stromkosten, Farbeimer oder Grundpreis: trag die Zahlen ein und sieh das Ergebnis sofort,
            dazu die Formel in Klartext und einen Praxistipp. Der Katalog wächst, die Nutzung bleibt frei.
          </p>
          <form className="mt-6 max-w-xl" role="search" onSubmit={(event) => event.preventDefault()}>
            <Label htmlFor="rechner-suche" className="text-base">
              Welchen Rechner suchst du?
            </Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="rechner-suche"
                value={query}
                onValueChange={setQuery}
                placeholder="z. B. Tapete, Mehrwertsteuer, Standby"
                className="h-12 rounded-xl border-foreground/15 bg-card px-3 text-base md:text-base"
                autoComplete="off"
              />
              {trimmed ? (
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 shrink-0 rounded-xl px-4"
                  onClick={() => setQuery("")}
                >
                  Leeren
                </Button>
              ) : null}
            </div>
          </form>
        </div>
        <Link
          href="/rechner/zinseszins"
          className="rounded-2xl border border-border bg-card p-5 shadow-[0_12px_40px_-24px_rgba(15,79,76,0.45)]"
        >
          <p className="text-xs font-bold tracking-[0.14em] text-teal uppercase">Beispiel</p>
          <p className="mt-3 font-heading text-lg leading-snug">10.000 € für 10 Jahre zu 3 % Zins, jährlich</p>
          <p className="mt-4 font-heading text-4xl font-semibold tracking-tight tabular-nums">{previewText}</p>
          <p className="mt-2 text-sm text-muted-foreground">Endkapital im Zinseszins-Rechner. Tippen und selbst nachrechnen.</p>
        </Link>
      </section>

      {trimmed ? (
        <section aria-labelledby="suchergebnis-titel">
          <h2 id="suchergebnis-titel" className="font-heading text-3xl font-semibold tracking-tight">
            {results.length === 0 ? `Nichts zu „${trimmed}“` : `${results.length} Rechner zu „${trimmed}“`}
          </h2>
          {results.length === 0 ? (
            <div role="status" className="mt-4 rounded-2xl border border-dashed border-border bg-card px-5 py-8">
              <p className="max-w-lg text-base leading-relaxed">
                Zu „{trimmed}“ gibt es noch keinen Rechner. Prüf die Schreibweise oder geh über eines der Themen.
              </p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/thema/${category.id}`}
                      className="inline-flex rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold hover:border-teal"
                    >
                      {category.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((calculator) => (
                <li key={calculator.slug}>
                  <CalculatorCard calculator={calculator} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section aria-labelledby="themen-titel">
        <h2 id="themen-titel" className="font-heading text-3xl font-semibold tracking-tight">
          Fünf Themen
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category, index) => (
            <li key={category.id}>
              <Link
                href={`/thema/${category.id}`}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 hover:border-teal/40"
              >
                <span className="font-heading text-sm font-semibold text-ochre tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="mt-3 font-heading text-xl font-semibold">{category.title}</span>
                <span className="mt-2 text-sm leading-relaxed text-muted-foreground">{category.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {trimmed ? null : (
        <section aria-labelledby="oft-titel">
          <h2 id="oft-titel" className="font-heading text-3xl font-semibold tracking-tight">
            Oft gebraucht
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {highlightedCalculators().map((calculator) => (
              <li key={calculator.slug}>
                <CalculatorCard calculator={calculator} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
