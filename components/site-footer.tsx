import Link from "next/link"

import { categories } from "@/lib/categories"

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <p className="font-heading text-lg font-semibold">Einrechner</p>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
            Die Ergebnisse sind Orientierungshilfen für den Alltag, keine Steuer-,
            Rechts- oder Anlageberatung. Geldbeträge runden wir kaufmännisch auf den Cent, Stückzahlen auf ganze
            Gebinde auf.
          </p>
        </div>
        <nav aria-label="Themen">
          <p className="text-sm font-semibold">Themen</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {categories.map((category) => (
              <li key={category.id}>
                <Link href={`/thema/${category.id}`} className="rounded-md text-foreground hover:text-teal">
                  {category.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
