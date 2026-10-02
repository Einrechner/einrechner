import Link from "next/link"

import { getCategory } from "@/lib/categories"
import type { Calculator } from "@/lib/types"
import { cn } from "@/lib/utils"

const accent: Record<Calculator["category"], string> = {
  finanzen: "text-teal",
  verbraucherfragen: "text-clay",
  energiesparen: "text-moss",
  heimwerken: "text-ochre",
  shopping: "text-foreground",
}

export function CalculatorCard({ calculator }: { calculator: Calculator }) {
  const category = getCategory(calculator.category)

  return (
    <Link
      href={`/rechner/${calculator.slug}`}
      className="group block h-full rounded-2xl focus-visible:outline-offset-4"
    >
      <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(28,25,21,0.04)] transition-colors group-hover:border-teal/40">
        <p className={cn("text-xs font-bold tracking-[0.14em] uppercase", accent[calculator.category])}>
          {category?.title}
        </p>
        <h3 className="mt-2 font-heading text-xl font-semibold tracking-tight text-foreground">{calculator.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{calculator.description}</p>
      </article>
    </Link>
  )
}
