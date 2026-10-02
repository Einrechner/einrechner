import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CalculatorCard } from "@/components/calculator-card"
import { CalculatorWorkspace } from "@/components/calculator-workspace"
import { getCategory } from "@/lib/categories"
import { calculators, getCalculator, relatedCalculators } from "@/lib/catalog"

type RouteParams = { slug: string }

export function generateStaticParams(): RouteParams[] {
  return calculators.map((calculator) => ({ slug: calculator.slug }))
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug } = await params
  const calculator = getCalculator(slug)
  if (!calculator) return { title: "Rechner nicht gefunden" }
  return { title: calculator.title, description: calculator.description }
}

export default async function CalculatorPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params
  const calculator = getCalculator(slug)
  if (!calculator) notFound()

  const category = getCategory(calculator.category)
  const related = relatedCalculators(calculator)

  return (
    <article className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <nav aria-label="Brotkrumen" className="text-sm text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-teal">
              Einrechner
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/thema/${calculator.category}`} className="hover:text-teal">
              {category?.title}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground">{calculator.title}</li>
        </ol>
      </nav>

      <header className="mt-6 max-w-3xl">
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{calculator.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{calculator.description}</p>
      </header>

      <div className="mt-8">
        <CalculatorWorkspace key={calculator.slug} slug={calculator.slug} />
      </div>

      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="formel-titel">
          <h2 id="formel-titel" className="font-heading text-2xl font-semibold">
            So rechnen wir
          </h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-base leading-relaxed">
            {calculator.formula.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
        <section className="rounded-2xl border border-ochre/40 bg-[#FBF6EA] p-5 sm:p-6" aria-labelledby="tipp-titel">
          <h2 id="tipp-titel" className="font-heading text-2xl font-semibold">
            Praxistipp
          </h2>
          <p className="mt-4 text-base leading-relaxed">{calculator.tip}</p>
          {calculator.assumptions?.length ? (
            <div className="mt-5 border-t border-ochre/30 pt-4">
              <h3 className="text-sm font-bold tracking-[0.12em] text-ochre uppercase">Annahmen</h3>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed">
                {calculator.assumptions.map((assumption) => (
                  <li key={assumption}>{assumption}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      {related.length > 0 ? (
        <section className="mt-10" aria-labelledby="verwandt-titel">
          <h2 id="verwandt-titel" className="font-heading text-2xl font-semibold">
            Verwandte Rechner
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <li key={item.slug}>
                <CalculatorCard calculator={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}
