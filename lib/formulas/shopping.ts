import type { Formula } from "@/lib/formulas/finance"

export const QUANTITY_UNITS = ["g", "kg", "ml", "l", "m", "stueck"] as const
export type QuantityUnit = (typeof QUANTITY_UNITS)[number]

const UNIT_META: Record<
  QuantityUnit,
  { base: string; factorToBase: number; baseLabel: string; enteredLabel: string }
> = {
  g: { base: "kg", factorToBase: 0.001, baseLabel: "kg", enteredLabel: "g" },
  kg: { base: "kg", factorToBase: 1, baseLabel: "kg", enteredLabel: "kg" },
  ml: { base: "l", factorToBase: 0.001, baseLabel: "l", enteredLabel: "ml" },
  l: { base: "l", factorToBase: 1, baseLabel: "l", enteredLabel: "l" },
  m: { base: "m", factorToBase: 1, baseLabel: "m", enteredLabel: "m" },
  stueck: { base: "stueck", factorToBase: 1, baseLabel: "Stück", enteredLabel: "Stück" },
}

export function unitMeta(unit: QuantityUnit) {
  return UNIT_META[unit]
}

export function isQuantityUnit(value: string): value is QuantityUnit {
  return (QUANTITY_UNITS as readonly string[]).includes(value)
}

export function discountPrice(input: {
  price: number
  percent: number
}): Formula<{ saved: number; final: number }> {
  if (input.price < 0) {
    return { ok: false, message: "Der Preis darf nicht negativ sein." }
  }
  if (input.percent < 0 || input.percent > 100) {
    return { ok: false, message: "Der Rabatt muss zwischen 0 und 100 Prozent liegen." }
  }
  const saved = input.price * (input.percent / 100)
  return { ok: true, data: { saved, final: input.price - saved } }
}

export function basePrice(input: {
  price: number
  quantity: number
  unit: QuantityUnit
}): Formula<{ perBase: number; baseLabel: string; base: string; perEntered: number }> {
  if (input.price < 0) {
    return { ok: false, message: "Der Preis darf nicht negativ sein." }
  }
  if (input.quantity <= 0) {
    return { ok: false, message: "Die Menge muss größer als 0 sein." }
  }
  const meta = UNIT_META[input.unit]
  const baseQuantity = input.quantity * meta.factorToBase
  return {
    ok: true,
    data: {
      perBase: input.price / baseQuantity,
      baseLabel: meta.baseLabel,
      base: meta.base,
      perEntered: input.price / input.quantity,
    },
  }
}

export type PricedOffer = {
  label: string
  price: number
  quantity: number
  unit: QuantityUnit
  perBase: number
  baseLabel: string
  base: string
}

export function compareOffers(
  offers: { label: string; price: number; quantity: number; unit: QuantityUnit }[],
): Formula<{ offers: PricedOffer[]; comparable: boolean; cheapestIndex: number }> {
  if (offers.length === 0) {
    return { ok: false, message: "Trag mindestens ein vollständiges Angebot ein." }
  }

  const priced: PricedOffer[] = []
  for (const offer of offers) {
    const result = basePrice(offer)
    if (!result.ok) return { ok: false, message: `${offer.label}: ${result.message}` }
    priced.push({
      label: offer.label,
      price: offer.price,
      quantity: offer.quantity,
      unit: offer.unit,
      perBase: result.data.perBase,
      baseLabel: result.data.baseLabel,
      base: result.data.base,
    })
  }

  const bases = new Set(priced.map((offer) => offer.base))
  const comparable = bases.size === 1
  let cheapestIndex = -1
  if (comparable) {
    cheapestIndex = priced.reduce(
      (best, offer, index, all) => (offer.perBase < all[best].perBase ? index : best),
      0,
    )
  }

  return { ok: true, data: { offers: priced, comparable, cheapestIndex } }
}

export function installmentPurchase(input: {
  cashPrice: number
  downPayment: number
  count: number
  installment: number
}): Formula<{ total: number; surcharge: number; surchargePercent: number | null }> {
  if (input.cashPrice < 0 || input.downPayment < 0 || input.installment < 0) {
    return { ok: false, message: "Beträge dürfen nicht negativ sein." }
  }
  if (!Number.isInteger(input.count) || input.count < 1) {
    return { ok: false, message: "Die Anzahl der Raten muss eine ganze Zahl ab 1 sein." }
  }

  const total = input.downPayment + input.count * input.installment
  const surcharge = total - input.cashPrice
  const surchargePercent = input.cashPrice === 0 ? null : (surcharge / input.cashPrice) * 100
  return { ok: true, data: { total, surcharge, surchargePercent } }
}

export function multipackPrice(input: {
  packPrice: number
  packCount: number
  singlePrice: number | null
}): Formula<{
  unitPrice: number
  singlePrice: number | null
  savePerUnit: number | null
  savePerPack: number | null
}> {
  if (input.packPrice < 0) {
    return { ok: false, message: "Der Packungspreis darf nicht negativ sein." }
  }
  if (!Number.isInteger(input.packCount) || input.packCount < 1) {
    return { ok: false, message: "Die Stückzahl muss eine ganze Zahl ab 1 sein." }
  }
  if (input.singlePrice !== null && input.singlePrice < 0) {
    return { ok: false, message: "Der Einzelpreis darf nicht negativ sein." }
  }

  const unitPrice = input.packPrice / input.packCount
  if (input.singlePrice === null) {
    return {
      ok: true,
      data: { unitPrice, singlePrice: null, savePerUnit: null, savePerPack: null },
    }
  }

  const savePerUnit = input.singlePrice - unitPrice
  return {
    ok: true,
    data: {
      unitPrice,
      singlePrice: input.singlePrice,
      savePerUnit,
      savePerPack: savePerUnit * input.packCount,
    },
  }
}
