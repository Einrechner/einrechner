import Link from "next/link"

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16">
      <p className="text-sm font-bold tracking-[0.14em] text-teal uppercase">404</p>
      <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight">Diesen Rechner gibt es nicht</h1>
      <p className="mt-3 max-w-lg text-base leading-relaxed text-muted-foreground">
        Die Adresse stimmt nicht, oder der Rechner ist noch nicht im Katalog. Such auf der Startseite oder geh über ein Thema.
      </p>
      <Link href="/" className="mt-6 inline-flex font-semibold text-teal">
        Zur Startseite
      </Link>
    </div>
  )
}
