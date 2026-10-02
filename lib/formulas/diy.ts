import type { Formula } from "@/lib/formulas/finance"

/** Whole packs, rolls, tiles or bags. Values that are only a floating-point hair over an integer stay on that integer. */
export function ceilUnits(value: number): number {
  if (value <= 0) return 0
  const nearest = Math.round(value)
  if (Math.abs(value - nearest) < 1e-9) return nearest
  return Math.ceil(value)
}

export function wallPaint(input: {
  areaM2: number
  openingsM2: number
  coats: number
  coverageM2PerLiter: number
  canLiters: number
}): Formula<{ paintableM2: number; liters: number; cans: number }> {
  if (input.areaM2 < 0 || input.openingsM2 < 0 || input.coats < 0) {
    return { ok: false, message: "Fläche, Abzüge und Anstriche dürfen nicht negativ sein." }
  }
  if (input.coverageM2PerLiter <= 0) {
    return { ok: false, message: "Die Reichweite muss größer als 0 sein." }
  }
  if (input.canLiters <= 0) {
    return { ok: false, message: "Die Gebindegröße muss größer als 0 sein." }
  }

  const paintableM2 = Math.max(0, input.areaM2 - input.openingsM2)
  const liters = (paintableM2 * input.coats) / input.coverageM2PerLiter
  return {
    ok: true,
    data: { paintableM2, liters, cans: ceilUnits(liters / input.canLiters) },
  }
}

export function wallpaperRolls(input: {
  perimeterM: number
  heightM: number
  rollWidthM: number
  rollLengthM: number
  rapportM: number
}): Formula<{ strips: number; stripsPerRoll: number; rolls: number; stripHeightM: number }> {
  if (input.perimeterM < 0 || input.heightM < 0 || input.rapportM < 0) {
    return { ok: false, message: "Maße dürfen nicht negativ sein." }
  }
  if (input.rollWidthM <= 0 || input.rollLengthM <= 0) {
    return { ok: false, message: "Rollenbreite und Rollenlänge müssen größer als 0 sein." }
  }

  const stripHeightM = input.heightM + input.rapportM
  if (stripHeightM <= 0) {
    return { ok: false, message: "Die Bahnhöhe muss größer als 0 sein." }
  }

  const strips = ceilUnits(input.perimeterM / input.rollWidthM)
  const stripsPerRoll = Math.floor(input.rollLengthM / stripHeightM + 1e-9)

  if (stripsPerRoll < 1) {
    const rolls = strips * ceilUnits(stripHeightM / input.rollLengthM)
    return { ok: true, data: { strips, stripsPerRoll: 0, rolls, stripHeightM } }
  }

  return {
    ok: true,
    data: {
      strips,
      stripsPerRoll,
      rolls: ceilUnits(strips / stripsPerRoll),
      stripHeightM,
    },
  }
}

export function tileCount(input: {
  areaM2: number
  tileLengthCm: number
  tileWidthCm: number
  wastePercent: number
}): Formula<{ tileM2: number; neededM2: number; count: number }> {
  if (input.areaM2 < 0 || input.wastePercent < 0) {
    return { ok: false, message: "Fläche und Verschnitt dürfen nicht negativ sein." }
  }
  if (input.tileLengthCm <= 0 || input.tileWidthCm <= 0) {
    return { ok: false, message: "Das Fliesenmaß muss größer als 0 sein." }
  }

  const tileM2 = (input.tileLengthCm / 100) * (input.tileWidthCm / 100)
  const neededM2 = input.areaM2 * (1 + input.wastePercent / 100)
  return {
    ok: true,
    data: { tileM2, neededM2, count: ceilUnits(neededM2 / tileM2) },
  }
}

export function flooringNeed(input: {
  lengthM: number
  widthM: number
  wastePercent: number
  packM2: number
}): Formula<{ areaM2: number; neededM2: number; packs: number }> {
  if (input.lengthM < 0 || input.widthM < 0 || input.wastePercent < 0) {
    return { ok: false, message: "Maße und Verschnitt dürfen nicht negativ sein." }
  }
  if (input.packM2 <= 0) {
    return { ok: false, message: "Der Paketinhalt muss größer als 0 sein." }
  }

  const areaM2 = input.lengthM * input.widthM
  const neededM2 = areaM2 * (1 + input.wastePercent / 100)
  return {
    ok: true,
    data: { areaM2, neededM2, packs: ceilUnits(neededM2 / input.packM2) },
  }
}

export function concreteVolume(input: {
  lengthM: number
  widthM: number
  thicknessCm: number
  litersPerBag: number
}): Formula<{ cubicMeters: number; liters: number; bags: number }> {
  if (input.lengthM < 0 || input.widthM < 0 || input.thicknessCm < 0) {
    return { ok: false, message: "Maße dürfen nicht negativ sein." }
  }
  if (input.litersPerBag <= 0) {
    return { ok: false, message: "Die Ergiebigkeit je Sack muss größer als 0 sein." }
  }

  const cubicMeters = input.lengthM * input.widthM * (input.thicknessCm / 100)
  const liters = cubicMeters * 1000
  return {
    ok: true,
    data: {
      cubicMeters,
      liters,
      bags: ceilUnits(cubicMeters / (input.litersPerBag / 1000)),
    },
  }
}
