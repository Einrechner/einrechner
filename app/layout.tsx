import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { Fraunces, Source_Sans_3 } from "next/font/google"

import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

import "./globals.css"

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Einrechner — Alltagsrechner",
    template: "%s · Einrechner",
  },
  description:
    "Rechner für Finanzen, Verbraucherfragen, Energiesparen, Heimwerken und Shopping. Sofort ein Ergebnis, die Formel dazu und ein Praxistipp.",
}

export const viewport: Viewport = {
  themeColor: "#0F4F4C",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={`${sourceSans.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#inhalt"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2"
        >
          Zum Inhalt
        </a>
        <SiteHeader />
        <main id="inhalt" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
