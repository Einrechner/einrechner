export const CATEGORY_IDS = [
  "finanzen",
  "verbraucherfragen",
  "energiesparen",
  "heimwerken",
  "shopping",
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

export type FieldOption = {
  value: string
  label: string
}

export type CalculatorField = {
  id: string
  label: string
  unit?: string
  kind: "number" | "select"
  defaultValue: string
  integer?: boolean
  hint?: string
  group?: string
  options?: FieldOption[]
  showWhen?: { id: string; value: string }
}

export type ResultLine = {
  label: string
  value: string
  emphasis?: boolean
  detail?: string
}

export type Computation =
  | { ok: true; lines: ResultLine[]; worked: string[] }
  | { ok: false; message: string }

export type Calculator = {
  slug: string
  title: string
  description: string
  category: CategoryId
  keywords: string[]
  highlighted?: boolean
  fields: CalculatorField[]
  formula: string[]
  tip: string
  assumptions?: string[]
  related: string[]
  compute: (values: Record<string, string>) => Computation
}

export type Category = {
  id: CategoryId
  title: string
  description: string
  lede: string
}
