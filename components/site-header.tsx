import Link from "next/link"

import { Mark } from "@/components/mark"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5 rounded-md">
          <Mark />
          <span className="font-heading text-xl font-semibold tracking-tight text-foreground">Einrechner</span>
        </Link>
        <nav aria-label="Hauptnavigation" className="flex items-center gap-4 text-sm font-semibold">
          <Link href="/rechner" className="rounded-md text-foreground hover:text-teal">
            Alle Rechner
          </Link>
        </nav>
      </div>
    </header>
  )
}
