import type { Formula } from "@/lib/formulas/finance"

/**
 * Direkter CO₂-Emissionsfaktor des deutschen Stromverbrauchs 2024.
 * Umweltbundesamt, vorläufiger Wert, ohne Vorketten: 353 g CO₂/kWh.
 */
export const GRID_CO2_GRAMS_PER_KWH = 353

export function applianceEnergy(input: {
  watts: number
  hoursPerDay: number
  daysPerYear: number
  pricePerKwh: number
}): Formula<{ kilowattHours: number; cost: number }> {
  if (input.watts < 0 || input.hoursPerDay < 0 || input.daysPerYear < 0 || input.pricePerKwh < 0) {
    return { ok: false, message: "Leistung, Zeit und Preis dürfen nicht negativ sein." }
  }
  if (input.hoursPerDay > 24) {
    return { ok: false, message: "Ein Tag hat 24 Stunden." }
  }
  if (input.daysPerYear > 366) {
    return { ok: false, message: "Ein Jahr hat höchstens 366 Tage." }
  }
  const kilowattHours = (input.watts * input.hoursPerDay * input.daysPerYear) / 1000
  return { ok: true, data: { kilowattHours, cost: kilowattHours * input.pricePerKwh } }
}

export function ledSavings(input: {
  wattsIncandescent: number
  wattsLed: number
  hoursPerDay: number
  daysPerYear: number
  count: number
  pricePerKwh: number
}): Formula<{
  kilowattHoursIncandescent: number
  kilowattHoursLed: number
  savedKilowattHours: number
  savedEuro: number
}> {
  const oldLamp = applianceEnergy({
    watts: input.wattsIncandescent,
    hoursPerDay: input.hoursPerDay,
    daysPerYear: input.daysPerYear,
    pricePerKwh: input.pricePerKwh,
  })
  if (!oldLamp.ok) return oldLamp
  const led = applianceEnergy({
    watts: input.wattsLed,
    hoursPerDay: input.hoursPerDay,
    daysPerYear: input.daysPerYear,
    pricePerKwh: input.pricePerKwh,
  })
  if (!led.ok) return led
  if (input.count < 0 || !Number.isInteger(input.count)) {
    return { ok: false, message: "Die Anzahl der Lampen muss eine ganze Zahl ab 0 sein." }
  }

  const kilowattHoursIncandescent = oldLamp.data.kilowattHours * input.count
  const kilowattHoursLed = led.data.kilowattHours * input.count
  const savedKilowattHours = kilowattHoursIncandescent - kilowattHoursLed
  return {
    ok: true,
    data: {
      kilowattHoursIncandescent,
      kilowattHoursLed,
      savedKilowattHours,
      savedEuro: savedKilowattHours * input.pricePerKwh,
    },
  }
}

export function standbyCost(input: {
  watts: number
  hoursPerDay: number
  pricePerKwh: number
}): Formula<{ kilowattHours: number; cost: number }> {
  return applianceEnergy({
    watts: input.watts,
    hoursPerDay: input.hoursPerDay,
    daysPerYear: 365,
    pricePerKwh: input.pricePerKwh,
  })
}

export function co2FromElectricity(input: {
  kilowattHours: number
  gramsPerKwh?: number
}): Formula<{ grams: number; kilograms: number; tonnes: number }> {
  if (input.kilowattHours < 0) {
    return { ok: false, message: "Der Verbrauch darf nicht negativ sein." }
  }
  const factor = input.gramsPerKwh ?? GRID_CO2_GRAMS_PER_KWH
  const grams = input.kilowattHours * factor
  return { ok: true, data: { grams, kilograms: grams / 1000, tonnes: grams / 1_000_000 } }
}
