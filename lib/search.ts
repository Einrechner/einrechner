export type SearchableCalculator = {
  slug: string
  title: string
  description: string
  categoryTitle: string
  keywords: string[]
}

export function foldGerman(value: string): string {
  return value
    .toLocaleLowerCase("de-DE")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
}

export function searchCalculators<T extends SearchableCalculator>(items: T[], query: string): T[] {
  const folded = foldGerman(query.trim())
  if (!folded) return items
  const terms = folded.split(/\s+/).filter(Boolean)
  return items.filter((item) => {
    const haystack = foldGerman(
      [item.title, item.description, item.categoryTitle, ...item.keywords].join(" "),
    )
    return terms.every((term) => haystack.includes(term))
  })
}
