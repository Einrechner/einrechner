/** Kaufmännisch runden: bei genau 5 von der Null weg. */
export function roundHalfAway(value: number, digits: number): number {
  if (!Number.isFinite(value)) return value
  const sign = value < 0 ? -1 : 1
  const absRounded = Number(
    Math.round(Number(`${Math.abs(value)}e${digits}`)) + `e-${digits}`,
  )
  return sign * absRounded
}

export function formatDecimal(value: number, digits = 2): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatFlexible(value: number, maxDigits = 4): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits,
  }).format(value)
}

export function formatEuro(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(roundHalfAway(value, 2))
}

export function formatPercent(value: number, digits = 2): string {
  const rounded = roundHalfAway(value, digits)
  const body = formatDecimal(rounded, digits)
  if (rounded > 0) return `+${body} %`
  return `${body} %`
}

export function formatPercentPlain(value: number, digits = 2): string {
  return `${formatDecimal(roundHalfAway(value, digits), digits)} %`
}

/**
 * Accepts German input (1.234,56), a plain decimal comma or dot,
 * and grouped thousands. Returns null when the text is not a number.
 */
export function parseGermanNumber(raw: string): number | null {
  let text = raw.trim().replace(/\s/g, "").replace(/€/g, "").replace(/%/g, "")
  if (!text) return null

  const lastComma = text.lastIndexOf(",")
  const lastDot = text.lastIndexOf(".")

  if (lastComma !== -1 && lastDot !== -1) {
    text =
      lastComma > lastDot
        ? text.replace(/\./g, "").replace(",", ".")
        : text.replace(/,/g, "")
  } else if (lastComma !== -1) {
    text = text.replace(",", ".")
  } else if (lastDot !== -1 && /^[+-]?\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, "")
  }

  if (!/^[+-]?\d+(\.\d+)?$/.test(text)) return null
  const value = Number(text)
  return Number.isFinite(value) ? value : null
}
