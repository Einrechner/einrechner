import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CalculatorCard } from "@/components/calculator-card"
import { categories, getCategory, isCategoryId } from "@/lib/categories"
import { calculatorsInCategory } from "@/lib/catalog"

type RouteParams = { slug: string }

export function generateStaticParams(): RouteParams[] {
  return categories.map((category) => ({ slug: category.id }))
}

export async function generateMetadata({ params }: { params: Promise<RouteParams> }): Promise<Metadata> {
  const { slug } = await params
  const category = getCategory(slug)
  if (!category) return { title: "Thema nicht gefunden" }
  return { title: category.title, description: category.description }
}

export default async function CategoryPage({ params }: { params: Promise<RouteParams> }) {
  const { slug } = await params
  if (!isCategoryId(slug)) notFound()
  const category = getCategory(slug)
  if (!category) notFound()
  const items = calculatorsInCategory(category.id)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <nav aria-label="Brotkrumen" className="text-sm text-muted-foreground">
        <Link href="/" className="hover:text-teal">
          Einrechner
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-foreground">{category.title}</span>
      </nav>
      <h1 className="mt-6 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{category.title}</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">{category.lede}</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((calculator) => (
          <li key={calculator.slug}>
            <CalculatorCard calculator={calculator} />
          </li>
        ))}
      </ul>
    </div>
  )
}
