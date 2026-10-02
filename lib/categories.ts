import type { Category, CategoryId } from "@/lib/types"

export const categories: Category[] = [
  {
    id: "finanzen",
    title: "Finanzen",
    description: "Zinsen, Kredite, Sparpläne, Steuer und eine einfache Rendite.",
    lede: "Was aus Geld wird — und was ein Kredit über die Rate hinaus kostet.",
  },
  {
    id: "verbraucherfragen",
    title: "Verbraucherfragen",
    description: "Stromrechnung, Mietanteil, Autokosten und laufende Abos.",
    lede: "Alltagskosten, auf den Monat, das Jahr oder den Kilometer gerechnet.",
  },
  {
    id: "energiesparen",
    title: "Energiesparen",
    description: "Geräteverbrauch, LED gegen Glühbirne, Standby und CO₂ aus Strom.",
    lede: "Watt und Stunden, übersetzt in Euro und Kilowattstunden.",
  },
  {
    id: "heimwerken",
    title: "Heimwerken",
    description: "Farbe, Tapete, Fliesen, Bodenbelag und Beton für das nächste Projekt.",
    lede: "Mengen, bevor du in den Baumarkt fährst.",
  },
  {
    id: "shopping",
    title: "Shopping",
    description: "Rabatt, Grundpreis, drei Angebote, Raten und Multipacks.",
    lede: "Welches Angebot wirklich günstiger ist — nicht nur welches lauter wirbt.",
  },
]

export function getCategory(id: string): Category | undefined {
  return categories.find((category) => category.id === id)
}

export function isCategoryId(id: string): id is CategoryId {
  return categories.some((category) => category.id === id)
}
