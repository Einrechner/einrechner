import type { Metadata } from "next"

import { CalculatorCard } from "@/components/calculator-card"
import { categories } from "@/lib/categories"
import { calculatorsInCategory } from "@/lib/catalog"

export const metadata: Metadata = {
  title: "Alle Rechner",
  description: "Der komplette Einrechner-Katalog: Finanzen, Verbraucherfragen, Energiesparen, Heimwerken und Shopping.",
}

export default function AllCalculatorsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">Alle Rechner</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
        {`Jeder Rechner rechnet mit den Zahlen, die du einträgst. Darunter steht, wie gerechnet wird.`}
      </p>
      <div className="mt-10 space-y-10">
        {categories.map((category) => (
          <section key={category.id} aria-labelledby={`liste-${category.id}`}>
            <h2 id={`liste-${category.id}`} className="font-heading text-2xl font-semibold">
              {category.title}
            </h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {calculatorsInCategory(category.id).map((calculator) => (
                <li key={calculator.slug}>
                  <CalculatorCard calculator={calculator} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
