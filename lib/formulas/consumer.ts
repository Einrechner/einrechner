import type { Formula } from "@/lib/formulas/finance"

export function electricityCost(input: {
  kilowattHours: number
  centsPerKwh: number
  period: "monat" | "jahr"
}): Formula<{ monthly: number; yearly: number }> {
  if (input.kilowattHours < 0 || input.centsPerKwh < 0) {
    return { ok: false, message: "Verbrauch und Preis dürfen nicht negativ sein." }
  }
  const periodCost = input.kilowattHours * (input.centsPerKwh / 100)
  const monthly = input.period === "monat" ? periodCost : periodCost / 12
  const yearly = input.period === "jahr" ? periodCost : periodCost * 12
  return { ok: true, data: { monthly, yearly } }
}

export function rentBurden(input: {
  warmRent: number
  netIncome: number
}): Formula<{ quotePercent: number }> {
  if (input.warmRent < 0) {
    return { ok: false, message: "Die Miete darf nicht negativ sein." }
  }
  if (input.netIncome <= 0) {
    return { ok: false, message: "Das Haushaltsnettoeinkommen muss größer als 0 sein." }
  }
  return { ok: true, data: { quotePercent: (input.warmRent / input.netIncome) * 100 } }
}

export function carCostPerKm(input: {
  kmPerYear: number
  litersPer100km: number
  fuelPricePerLiter: number
  insurance: number
  tax: number
  maintenance: number
  depreciation: number
}): Formula<{
  fuelPerKm: number
  annualFuel: number
  annualFixed: number
  annual: number
  perKm: number
}> {
  if (input.kmPerYear <= 0) {
    return { ok: false, message: "Die Jahreskilometer müssen größer als 0 sein." }
  }
  const numbers = [
    input.litersPer100km,
    input.fuelPricePerLiter,
    input.insurance,
    input.tax,
    input.maintenance,
    input.depreciation,
  ]
  if (numbers.some((value) => value < 0)) {
    return { ok: false, message: "Kosten und Verbrauch dürfen nicht negativ sein." }
  }

  const fuelPerKm = (input.litersPer100km / 100) * input.fuelPricePerLiter
  const annualFuel = fuelPerKm * input.kmPerYear
  const annualFixed = input.insurance + input.tax + input.maintenance + input.depreciation
  const annual = annualFuel + annualFixed
  return {
    ok: true,
    data: { fuelPerKm, annualFuel, annualFixed, annual, perKm: annual / input.kmPerYear },
  }
}

export function subscriptionCost(monthly: number): Formula<{
  yearly: number
  threeYears: number
  perDay: number
}> {
  if (monthly < 0) {
    return { ok: false, message: "Der Monatspreis darf nicht negativ sein." }
  }
  const yearly = monthly * 12
  return { ok: true, data: { yearly, threeYears: yearly * 3, perDay: yearly / 365 } }
}
