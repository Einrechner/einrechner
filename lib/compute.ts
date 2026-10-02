import {
  formatDecimal,
  formatEuro,
  formatFlexible,
  formatPercent,
  formatPercentPlain,
  parseGermanNumber,
  roundHalfAway,
} from "@/lib/format"
import { annuityLoan, compoundInterest, percentChange, percentOf, savingsPlan, shareAsPercent, simpleRoi, valueAddedTax } from "@/lib/formulas/finance"
import { carCostPerKm, electricityCost, rentBurden, subscriptionCost } from "@/lib/formulas/consumer"
import { GRID_CO2_GRAMS_PER_KWH, applianceEnergy, co2FromElectricity, ledSavings, standbyCost } from "@/lib/formulas/energy"
import { concreteVolume, flooringNeed, tileCount, wallPaint, wallpaperRolls } from "@/lib/formulas/diy"
import { compareOffers, discountPrice, installmentPurchase, isQuantityUnit, multipackPrice, unitMeta, basePrice } from "@/lib/formulas/shopping"
import type { Computation, ResultLine } from "@/lib/types"

type Read =
  | { ok: true; value: number }
  | { ok: false; message: string }

function fail(message: string): Computation {
  return { ok: false, message }
}

function num(
  values: Record<string, string>,
  id: string,
  label: string,
  opts?: { min?: number; max?: number; integer?: boolean; positive?: boolean },
): Read {
  const parsed = parseGermanNumber(values[id] ?? "")
  if (parsed === null) {
    return { ok: false, message: `Bitte für „${label}“ eine Zahl eintragen.` }
  }
  if (opts?.integer && Math.abs(parsed - Math.round(parsed)) > 1e-9) {
    return { ok: false, message: `„${label}“ muss eine ganze Zahl sein.` }
  }
  const value = opts?.integer ? Math.round(parsed) : parsed
  if (opts?.positive && value <= 0) {
    return { ok: false, message: `„${label}“ muss größer als 0 sein.` }
  }
  if (opts?.min !== undefined && value < opts.min) {
    return { ok: false, message: `„${label}“ muss mindestens ${formatFlexible(opts.min)} sein.` }
  }
  if (opts?.max !== undefined && value > opts.max) {
    return { ok: false, message: `„${label}“ darf höchstens ${formatFlexible(opts.max)} sein.` }
  }
  return { ok: true, value }
}

function optionalNum(
  values: Record<string, string>,
  id: string,
  label: string,
  opts?: { min?: number; max?: number; integer?: boolean; positive?: boolean },
): { ok: true; value: number | null } | { ok: false; message: string } {
  if (!(values[id] ?? "").trim()) return { ok: true, value: null }
  return num(values, id, label, opts)
}

function euro(label: string, value: number, emphasis = false, detail?: string): ResultLine {
  return { label, value: formatEuro(value), emphasis, detail }
}

function line(label: string, value: string, emphasis = false, detail?: string): ResultLine {
  return { label, value, emphasis, detail }
}

const PERIODS: Record<string, { perYear: number; label: string }> = {
  jaehrlich: { perYear: 1, label: "jährlich" },
  vierteljaehrlich: { perYear: 4, label: "vierteljährlich" },
  monatlich: { perYear: 12, label: "monatlich" },
}

export function computeZinseszins(values: Record<string, string>): Computation {
  const kapital = num(values, "kapital", "Startkapital", { min: 0 })
  if (!kapital.ok) return kapital
  const zins = num(values, "zins", "Jahreszins", { min: 0, max: 100 })
  if (!zins.ok) return zins
  const jahre = num(values, "jahre", "Laufzeit", { min: 0, max: 80 })
  if (!jahre.ok) return jahre
  const rhythm = PERIODS[values.rhythmus ?? ""]
  if (!rhythm) return fail("Bitte wählen, wie oft der Zins gutgeschrieben wird.")

  const result = compoundInterest({
    principal: kapital.value,
    annualRatePercent: zins.value,
    years: jahre.value,
    periodsPerYear: rhythm.perYear,
  })
  if (!result.ok) return result

  const final = roundHalfAway(result.data.final, 2)
  const interest = roundHalfAway(final - roundHalfAway(kapital.value, 2), 2)
  return {
    ok: true,
    lines: [
      euro("Endkapital", final, true, `Verzinsung ${rhythm.label}`),
      euro("Zinsertrag", interest),
      line("Perioden im Jahr", formatFlexible(rhythm.perYear, 0)),
    ],
    worked: [
      `${formatEuro(kapital.value)} × (1 + ${formatFlexible(zins.value)} ÷ 100 ÷ ${rhythm.perYear}) ^ (${rhythm.perYear} × ${formatFlexible(jahre.value)}) = ${formatEuro(final)}`,
      `Zinsertrag = ${formatEuro(final)} − ${formatEuro(kapital.value)} = ${formatEuro(interest)}`,
    ],
  }
}

export function computeAnnuitaet(values: Record<string, string>): Computation {
  const kredit = num(values, "kredit", "Kreditbetrag", { min: 0 })
  if (!kredit.ok) return kredit
  const zins = num(values, "zins", "Jahreszins", { min: 0, max: 30 })
  if (!zins.ok) return zins
  const jahre = num(values, "jahre", "Laufzeit", { positive: true, max: 50 })
  if (!jahre.ok) return jahre

  const result = annuityLoan({
    principal: kredit.value,
    annualRatePercent: zins.value,
    years: jahre.value,
  })
  if (!result.ok) return result

  const monthly = roundHalfAway(result.data.monthlyPayment, 2)
  const total = roundHalfAway(monthly * result.data.months, 2)
  const interest = roundHalfAway(total - roundHalfAway(kredit.value, 2), 2)
  return {
    ok: true,
    lines: [
      euro("Monatliche Rate", monthly, true, `${formatFlexible(result.data.months, 2)} Monate`),
      euro("Gesamtzahlung", total),
      euro("Davon Zinsen", interest),
    ],
    worked: [
      `Monatszins = ${formatFlexible(zins.value)} % ÷ 12 = ${formatFlexible(zins.value / 12, 4)} %`,
      `Rate = Kredit × (Monatszins × (1 + Monatszins) ^ Monate) ÷ ((1 + Monatszins) ^ Monate − 1)`,
      `Gerundete Rate ${formatEuro(monthly)} × ${formatFlexible(result.data.months, 2)} Monate = ${formatEuro(total)}`,
    ],
  }
}

export function computeSparplan(values: Record<string, string>): Computation {
  const start = num(values, "start", "Startkapital", { min: 0 })
  if (!start.ok) return start
  const rate = num(values, "rate", "Monatliche Einzahlung", { min: 0 })
  if (!rate.ok) return rate
  const zins = num(values, "zins", "Jahreszins", { min: 0, max: 30 })
  if (!zins.ok) return zins
  const jahre = num(values, "jahre", "Laufzeit", { min: 0, max: 80 })
  if (!jahre.ok) return jahre

  const result = savingsPlan({
    initial: start.value,
    monthly: rate.value,
    annualRatePercent: zins.value,
    years: jahre.value,
  })
  if (!result.ok) return result

  const future = roundHalfAway(result.data.future, 2)
  const deposited = roundHalfAway(result.data.deposited, 2)
  const gain = roundHalfAway(future - deposited, 2)
  return {
    ok: true,
    lines: [
      euro("Guthaben am Ende", future, true, "Einzahlung am Monatsende"),
      euro("Eingezahlt", deposited),
      euro("Davon Zinsen", gain),
      euro("Aus dem Startkapital", roundHalfAway(result.data.fromInitial, 2)),
      euro("Aus den Einzahlungen", roundHalfAway(result.data.fromPayments, 2)),
    ],
    worked: [
      `Monate = ${formatFlexible(jahre.value)} × 12`,
      `Endwert der Einzahlungen = Rate × ((1 + Monatszins) ^ Monate − 1) ÷ Monatszins`,
      `Guthaben ${formatEuro(future)} − eingezahlt ${formatEuro(deposited)} = Zinsen ${formatEuro(gain)}`,
    ],
  }
}

export function computeMehrwertsteuer(values: Record<string, string>): Computation {
  const betrag = num(values, "betrag", "Betrag", { min: 0 })
  if (!betrag.ok) return betrag
  const satz = values.satz
  if (satz !== "19" && satz !== "7") return fail("Bitte 19 % oder 7 % wählen.")
  const richtung = values.richtung
  if (richtung !== "netto-zu-brutto" && richtung !== "brutto-zu-netto") {
    return fail("Bitte wählen, ob der Betrag netto oder brutto ist.")
  }

  const rate = Number(satz) / 100
  const amount = roundHalfAway(betrag.value, 2)
  const net = richtung === "netto-zu-brutto" ? amount : roundHalfAway(amount / (1 + rate), 2)
  const gross =
    richtung === "netto-zu-brutto" ? roundHalfAway(net + roundHalfAway(net * rate, 2), 2) : amount
  const tax = roundHalfAway(gross - net, 2)

  const check = valueAddedTax({
    amount: betrag.value,
    ratePercent: Number(satz),
    direction: richtung,
  })
  if (!check.ok) return check

  return {
    ok: true,
    lines: [
      euro("Netto", net, richtung === "brutto-zu-netto", richtung === "brutto-zu-netto" ? `Steuersatz ${satz} %` : undefined),
      euro("Mehrwertsteuer", tax),
      euro("Brutto", gross, richtung === "netto-zu-brutto", richtung === "netto-zu-brutto" ? `Steuersatz ${satz} %` : undefined),
    ],
    worked: [
      richtung === "netto-zu-brutto"
        ? `Steuer = ${formatEuro(net)} × ${satz} % = ${formatEuro(tax)}`
        : `Netto = ${formatEuro(gross)} ÷ (1 + ${satz} %) = ${formatEuro(net)}`,
      `${formatEuro(net)} + ${formatEuro(tax)} = ${formatEuro(gross)}`,
    ],
  }
}

export function computeProzent(values: Record<string, string>): Computation {
  const modus = values.modus
  if (modus === "anteil") {
    const basis = num(values, "basis", "Grundwert")
    if (!basis.ok) return basis
    const prozent = num(values, "prozent", "Prozent")
    if (!prozent.ok) return prozent
    const result = percentOf(basis.value, prozent.value)
    if (!result.ok) return result
    return {
      ok: true,
      lines: [line("Anteil", formatFlexible(result.data.amount), true, `${formatFlexible(prozent.value)} % von ${formatFlexible(basis.value)}`)],
      worked: [`${formatFlexible(basis.value)} × ${formatFlexible(prozent.value)} ÷ 100 = ${formatFlexible(result.data.amount)}`],
    }
  }
  if (modus === "satz") {
    const teil = num(values, "teil", "Prozentwert")
    if (!teil.ok) return teil
    const ganzes = num(values, "ganzes", "Grundwert")
    if (!ganzes.ok) return ganzes
    const result = shareAsPercent(teil.value, ganzes.value)
    if (!result.ok) return result
    return {
      ok: true,
      lines: [line("Prozentsatz", formatPercentPlain(result.data.percent), true)],
      worked: [`${formatFlexible(teil.value)} ÷ ${formatFlexible(ganzes.value)} × 100 = ${formatPercentPlain(result.data.percent)}`],
    }
  }
  if (modus === "veraenderung") {
    const von = num(values, "von", "Ausgangswert")
    if (!von.ok) return von
    const nach = num(values, "nach", "Neuer Wert")
    if (!nach.ok) return nach
    const result = percentChange(von.value, nach.value)
    if (!result.ok) return result
    return {
      ok: true,
      lines: [
        line("Veränderung", formatPercent(result.data.percent), true),
        line("Differenz", formatFlexible(result.data.delta)),
      ],
      worked: [`(${formatFlexible(nach.value)} − ${formatFlexible(von.value)}) ÷ ${formatFlexible(von.value)} × 100 = ${formatPercent(result.data.percent)}`],
    }
  }
  return fail("Bitte eine Rechenart wählen.")
}

export function computeRoi(values: Record<string, string>): Computation {
  const einsatz = num(values, "einsatz", "Einsatz", { min: 0 })
  if (!einsatz.ok) return einsatz
  const rueckfluss = num(values, "rueckfluss", "Rückfluss", { min: 0 })
  if (!rueckfluss.ok) return rueckfluss
  const result = simpleRoi({ investment: einsatz.value, proceeds: rueckfluss.value })
  if (!result.ok) return result
  return {
    ok: true,
    lines: [
      line("ROI", formatPercent(result.data.roiPercent), true, "Ohne Zeitgewichtung"),
      euro("Gewinn oder Verlust", result.data.profit),
    ],
    worked: [
      `(${formatEuro(rueckfluss.value)} − ${formatEuro(einsatz.value)}) ÷ ${formatEuro(einsatz.value)} × 100 = ${formatPercent(result.data.roiPercent)}`,
    ],
  }
}

export function computeStromkosten(values: Record<string, string>): Computation {
  const verbrauch = num(values, "verbrauch", "Verbrauch", { min: 0 })
  if (!verbrauch.ok) return verbrauch
  const preis = num(values, "preis", "Arbeitspreis", { min: 0 })
  if (!preis.ok) return preis
  const zeitraum = values.zeitraum === "jahr" ? "jahr" : values.zeitraum === "monat" ? "monat" : null
  if (!zeitraum) return fail("Bitte wählen, ob der Verbrauch pro Monat oder pro Jahr gilt.")
  const result = electricityCost({
    kilowattHours: verbrauch.value,
    centsPerKwh: preis.value,
    period: zeitraum,
  })
  if (!result.ok) return result
  return {
    ok: true,
    lines: [
      euro("Kosten im Jahr", result.data.yearly, true),
      euro("Kosten im Monat", result.data.monthly),
      line("Arbeitspreis", `${formatDecimal(preis.value, 2)} ct/kWh`),
    ],
    worked: [
      `${formatFlexible(verbrauch.value)} kWh × ${formatDecimal(preis.value, 2)} ct ÷ 100 = Kosten je ${zeitraum === "monat" ? "Monat" : "Jahr"}`,
      `Jahr ${formatEuro(result.data.yearly)}, Monat ${formatEuro(result.data.monthly)}`,
    ],
  }
}

export function computeMiete(values: Record<string, string>): Computation {
  const miete = num(values, "miete", "Warmmiete", { min: 0 })
  if (!miete.ok) return miete
  const einkommen = num(values, "einkommen", "Haushaltsnettoeinkommen", { positive: true })
  if (!einkommen.ok) return einkommen
  const result = rentBurden({ warmRent: miete.value, netIncome: einkommen.value })
  if (!result.ok) return result
  const quote = result.data.quotePercent
  const note =
    quote < 30
      ? "Unter der oft genannten Marke von 30 % des Haushaltsnettos."
      : quote <= 40
        ? "Über der oft genannten Marke von 30 % des Haushaltsnettos."
        : "Deutlich über der oft genannten Marke von 30 % des Haushaltsnettos."
  return {
    ok: true,
    lines: [line("Mietbelastungsquote", formatPercentPlain(quote, 1), true, note)],
    worked: [`${formatEuro(miete.value)} ÷ ${formatEuro(einkommen.value)} × 100 = ${formatPercentPlain(quote, 1)}`],
  }
}

export function computeKfz(values: Record<string, string>): Computation {
  const km = num(values, "km", "Jahreskilometer", { positive: true })
  if (!km.ok) return km
  const verbrauch = num(values, "verbrauch", "Verbrauch", { min: 0 })
  if (!verbrauch.ok) return verbrauch
  const sprit = num(values, "sprit", "Kraftstoffpreis", { min: 0 })
  if (!sprit.ok) return sprit
  const versicherung = num(values, "versicherung", "Versicherung", { min: 0 })
  if (!versicherung.ok) return versicherung
  const steuer = num(values, "steuer", "Kfz-Steuer", { min: 0 })
  if (!steuer.ok) return steuer
  const wartung = num(values, "wartung", "Wartung", { min: 0 })
  if (!wartung.ok) return wartung
  const wertverlust = num(values, "wertverlust", "Wertverlust", { min: 0 })
  if (!wertverlust.ok) return wertverlust

  const result = carCostPerKm({
    kmPerYear: km.value,
    litersPer100km: verbrauch.value,
    fuelPricePerLiter: sprit.value,
    insurance: versicherung.value,
    tax: steuer.value,
    maintenance: wartung.value,
    depreciation: wertverlust.value,
  })
  if (!result.ok) return result
  return {
    ok: true,
    lines: [
      euro("Kosten je Kilometer", result.data.perKm, true),
      euro("Kosten im Jahr", result.data.annual),
      euro("Davon Kraftstoff", result.data.annualFuel),
      euro("Davon fixe Kosten", result.data.annualFixed),
    ],
    worked: [
      `Kraftstoff je km = ${formatFlexible(verbrauch.value)} l ÷ 100 × ${formatEuro(sprit.value)} = ${formatEuro(result.data.fuelPerKm)}`,
      `Jahreskosten ${formatEuro(result.data.annual)} ÷ ${formatFlexible(km.value)} km = ${formatEuro(result.data.perKm)}`,
    ],
  }
}

export function computeAbo(values: Record<string, string>): Computation {
  const monat = num(values, "monat", "Monatspreis", { min: 0 })
  if (!monat.ok) return monat
  const result = subscriptionCost(monat.value)
  if (!result.ok) return result
  return {
    ok: true,
    lines: [
      euro("Kosten im Jahr", result.data.yearly, true),
      euro("Kosten in drei Jahren", result.data.threeYears),
      euro("Umgerechnet je Tag", result.data.perDay),
    ],
    worked: [
      `${formatEuro(monat.value)} × 12 = ${formatEuro(result.data.yearly)}`,
      `${formatEuro(result.data.yearly)} × 3 = ${formatEuro(result.data.threeYears)}`,
    ],
  }
}

export function computeGeraet(values: Record<string, string>): Computation {
  const watt = num(values, "watt", "Leistung", { min: 0 })
  if (!watt.ok) return watt
  const stunden = num(values, "stunden", "Stunden pro Tag", { min: 0, max: 24 })
  if (!stunden.ok) return stunden
  const tage = num(values, "tage", "Tage im Jahr", { min: 0, max: 366 })
  if (!tage.ok) return tage
  const preis = num(values, "preis", "Strompreis", { min: 0 })
  if (!preis.ok) return preis
  const result = applianceEnergy({
    watts: watt.value,
    hoursPerDay: stunden.value,
    daysPerYear: tage.value,
    pricePerKwh: preis.value,
  })
  if (!result.ok) return result
  return {
    ok: true,
    lines: [
      euro("Stromkosten im Jahr", result.data.cost, true),
      line("Verbrauch im Jahr", `${formatDecimal(result.data.kilowattHours, 2)} kWh`),
    ],
    worked: [
      `${formatFlexible(watt.value)} W × ${formatFlexible(stunden.value)} h × ${formatFlexible(tage.value)} Tage ÷ 1000 = ${formatDecimal(result.data.kilowattHours, 2)} kWh`,
      `${formatDecimal(result.data.kilowattHours, 2)} kWh × ${formatEuro(preis.value)} = ${formatEuro(result.data.cost)}`,
    ],
  }
}

export function computeLed(values: Record<string, string>): Computation {
  const alt = num(values, "alt", "Glühbirne", { min: 0 })
  if (!alt.ok) return alt
  const neu = num(values, "neu", "LED", { min: 0 })
  if (!neu.ok) return neu
  const stunden = num(values, "stunden", "Stunden pro Tag", { min: 0, max: 24 })
  if (!stunden.ok) return stunden
  const tage = num(values, "tage", "Tage im Jahr", { min: 0, max: 366 })
  if (!tage.ok) return tage
  const anzahl = num(values, "anzahl", "Anzahl Lampen", { min: 0, integer: true })
  if (!anzahl.ok) return anzahl
  const preis = num(values, "preis", "Strompreis", { min: 0 })
  if (!preis.ok) return preis
  const result = ledSavings({
    wattsIncandescent: alt.value,
    wattsLed: neu.value,
    hoursPerDay: stunden.value,
    daysPerYear: tage.value,
    count: anzahl.value,
    pricePerKwh: preis.value,
  })
  if (!result.ok) return result
  return {
    ok: true,
    lines: [
      euro("Ersparnis im Jahr", result.data.savedEuro, true),
      line("Weniger Verbrauch", `${formatDecimal(result.data.savedKilowattHours, 2)} kWh`),
      line("Glühbirnen", `${formatDecimal(result.data.kilowattHoursIncandescent, 2)} kWh`),
      line("LEDs", `${formatDecimal(result.data.kilowattHoursLed, 2)} kWh`),
    ],
    worked: [
      `kWh = Watt × Stunden × Tage × Anzahl ÷ 1000`,
      `Ersparnis = (${formatDecimal(result.data.kilowattHoursIncandescent, 2)} − ${formatDecimal(result.data.kilowattHoursLed, 2)}) kWh × ${formatEuro(preis.value)}`,
    ],
  }
}

export function computeStandby(values: Record<string, string>): Computation {
  const watt = num(values, "watt", "Standby-Leistung", { min: 0 })
  if (!watt.ok) return watt
  const stunden = num(values, "stunden", "Standby-Stunden pro Tag", { min: 0, max: 24 })
  if (!stunden.ok) return stunden
  const preis = num(values, "preis", "Strompreis", { min: 0 })
  if (!preis.ok) return preis
  const result = standbyCost({
    watts: watt.value,
    hoursPerDay: stunden.value,
    pricePerKwh: preis.value,
  })
  if (!result.ok) return result
  return {
    ok: true,
    lines: [
      euro("Standby-Kosten im Jahr", result.data.cost, true, "gerechnet mit 365 Tagen"),
      line("Verbrauch im Jahr", `${formatDecimal(result.data.kilowattHours, 2)} kWh`),
    ],
    worked: [
      `${formatFlexible(watt.value)} W × ${formatFlexible(stunden.value)} h × 365 ÷ 1000 = ${formatDecimal(result.data.kilowattHours, 2)} kWh`,
      `${formatDecimal(result.data.kilowattHours, 2)} kWh × ${formatEuro(preis.value)} = ${formatEuro(result.data.cost)}`,
    ],
  }
}

export function computeCo2(values: Record<string, string>): Computation {
  const verbrauch = num(values, "verbrauch", "Stromverbrauch", { min: 0 })
  if (!verbrauch.ok) return verbrauch
  const result = co2FromElectricity({ kilowattHours: verbrauch.value })
  if (!result.ok) return result
  return {
    ok: true,
    lines: [
      line("CO₂", `${formatDecimal(result.data.kilograms, 2)} kg`, true, `${formatFlexible(GRID_CO2_GRAMS_PER_KWH, 0)} g je kWh`),
      line("In Tonnen", `${formatDecimal(result.data.tonnes, 3)} t`),
    ],
    worked: [
      `${formatFlexible(verbrauch.value)} kWh × ${GRID_CO2_GRAMS_PER_KWH} g/kWh ÷ 1000 = ${formatDecimal(result.data.kilograms, 2)} kg CO₂`,
    ],
  }
}

export function computeWandfarbe(values: Record<string, string>): Computation {
  const flaeche = num(values, "flaeche", "Wandfläche", { min: 0 })
  if (!flaeche.ok) return flaeche
  const abzuege = num(values, "abzuege", "Abzüge", { min: 0 })
  if (!abzuege.ok) return abzuege
  const anstriche = num(values, "anstriche", "Anstriche", { min: 0 })
  if (!anstriche.ok) return anstriche
  const reichweite = num(values, "reichweite", "Reichweite", { positive: true })
  if (!reichweite.ok) return reichweite
  const gebinde = num(values, "gebinde", "Gebindegröße", { positive: true })
  if (!gebinde.ok) return gebinde
  const result = wallPaint({
    areaM2: flaeche.value,
    openingsM2: abzuege.value,
    coats: anstriche.value,
    coverageM2PerLiter: reichweite.value,
    canLiters: gebinde.value,
  })
  if (!result.ok) return result
  const note =
    flaeche.value - abzuege.value < 0
      ? "Die Abzüge sind größer als die Fläche, es bleibt nichts zu streichen."
      : undefined
  return {
    ok: true,
    lines: [
      line("Gebinde", `${formatFlexible(result.data.cans, 0)} Stück`, true, note),
      line("Farbe", `${formatDecimal(result.data.liters, 2)} l`),
      line("Zu streichende Fläche", `${formatDecimal(result.data.paintableM2, 2)} m²`),
    ],
    worked: [
      `Fläche ${formatFlexible(flaeche.value)} m² − Abzüge ${formatFlexible(abzuege.value)} m² = ${formatDecimal(result.data.paintableM2, 2)} m²`,
      `${formatDecimal(result.data.paintableM2, 2)} m² × ${formatFlexible(anstriche.value)} Anstriche ÷ ${formatFlexible(reichweite.value)} m²/l = ${formatDecimal(result.data.liters, 2)} l`,
      `${formatDecimal(result.data.liters, 2)} l ÷ ${formatFlexible(gebinde.value)} l je Gebinde, aufgerundet = ${formatFlexible(result.data.cans, 0)}`,
    ],
  }
}

export function computeTapete(values: Record<string, string>): Computation {
  const umfang = num(values, "umfang", "Raumumfang", { min: 0 })
  if (!umfang.ok) return umfang
  const hoehe = num(values, "hoehe", "Raumhöhe", { min: 0 })
  if (!hoehe.ok) return hoehe
  const breite = num(values, "breite", "Rollenbreite", { positive: true })
  if (!breite.ok) return breite
  const laenge = num(values, "laenge", "Rollenlänge", { positive: true })
  if (!laenge.ok) return laenge
  const rapport = num(values, "rapport", "Rapport", { min: 0 })
  if (!rapport.ok) return rapport
  const result = wallpaperRolls({
    perimeterM: umfang.value,
    heightM: hoehe.value,
    rollWidthM: breite.value,
    rollLengthM: laenge.value,
    rapportM: rapport.value,
  })
  if (!result.ok) return result
  const detail =
    result.data.stripsPerRoll === 0
      ? "Eine Bahn ist länger als eine Rolle. Jede Bahn braucht deshalb mehr als eine Rolle."
      : `${formatFlexible(result.data.stripsPerRoll, 0)} Bahnen je Rolle`
  return {
    ok: true,
    lines: [
      line("Rollen", `${formatFlexible(result.data.rolls, 0)} Stück`, true, detail),
      line("Bahnen", `${formatFlexible(result.data.strips, 0)}`),
      line("Bahnhöhe inkl. Rapport", `${formatDecimal(result.data.stripHeightM, 2)} m`),
    ],
    worked: [
      `Bahnen = ${formatFlexible(umfang.value)} m ÷ ${formatFlexible(breite.value)} m, aufgerundet = ${formatFlexible(result.data.strips, 0)}`,
      `Bahnhöhe = ${formatFlexible(hoehe.value)} m + ${formatFlexible(rapport.value)} m Rapport`,
      `Rollen = Bahnen ÷ ganze Bahnen je Rolle, aufgerundet = ${formatFlexible(result.data.rolls, 0)}`,
    ],
  }
}

export function computeFliesen(values: Record<string, string>): Computation {
  const flaeche = num(values, "flaeche", "Fläche", { min: 0 })
  if (!flaeche.ok) return flaeche
  const laenge = num(values, "laenge", "Fliesenlänge", { positive: true })
  if (!laenge.ok) return laenge
  const breite = num(values, "breite", "Fliesenbreite", { positive: true })
  if (!breite.ok) return breite
  const verschnitt = num(values, "verschnitt", "Verschnitt", { min: 0, max: 100 })
  if (!verschnitt.ok) return verschnitt
  const result = tileCount({
    areaM2: flaeche.value,
    tileLengthCm: laenge.value,
    tileWidthCm: breite.value,
    wastePercent: verschnitt.value,
  })
  if (!result.ok) return result
  return {
    ok: true,
    lines: [
      line("Fliesen", `${formatFlexible(result.data.count, 0)} Stück`, true),
      line("Fläche inkl. Verschnitt", `${formatDecimal(result.data.neededM2, 2)} m²`),
      line("Eine Fliese", `${formatDecimal(result.data.tileM2, 4)} m²`),
    ],
    worked: [
      `Fliese = ${formatFlexible(laenge.value)} cm × ${formatFlexible(breite.value)} cm = ${formatDecimal(result.data.tileM2, 4)} m²`,
      `${formatFlexible(flaeche.value)} m² × (1 + ${formatFlexible(verschnitt.value)} %) = ${formatDecimal(result.data.neededM2, 2)} m²`,
      `${formatDecimal(result.data.neededM2, 2)} ÷ ${formatDecimal(result.data.tileM2, 4)}, aufgerundet = ${formatFlexible(result.data.count, 0)} Fliesen`,
    ],
  }
}

export function computeBoden(values: Record<string, string>): Computation {
  const laenge = num(values, "laenge", "Raumlänge", { min: 0 })
  if (!laenge.ok) return laenge
  const breite = num(values, "breite", "Raumbreite", { min: 0 })
  if (!breite.ok) return breite
  const verschnitt = num(values, "verschnitt", "Verschnitt", { min: 0, max: 100 })
  if (!verschnitt.ok) return verschnitt
  const paket = num(values, "paket", "Inhalt je Paket", { positive: true })
  if (!paket.ok) return paket
  const result = flooringNeed({
    lengthM: laenge.value,
    widthM: breite.value,
    wastePercent: verschnitt.value,
    packM2: paket.value,
  })
  if (!result.ok) return result
  return {
    ok: true,
    lines: [
      line("Pakete", `${formatFlexible(result.data.packs, 0)} Stück`, true),
      line("Bedarf inkl. Verschnitt", `${formatDecimal(result.data.neededM2, 2)} m²`),
      line("Raumfläche", `${formatDecimal(result.data.areaM2, 2)} m²`),
    ],
    worked: [
      `${formatFlexible(laenge.value)} m × ${formatFlexible(breite.value)} m = ${formatDecimal(result.data.areaM2, 2)} m²`,
      `${formatDecimal(result.data.areaM2, 2)} m² × (1 + ${formatFlexible(verschnitt.value)} %) = ${formatDecimal(result.data.neededM2, 2)} m²`,
      `${formatDecimal(result.data.neededM2, 2)} ÷ ${formatFlexible(paket.value)} m² je Paket, aufgerundet = ${formatFlexible(result.data.packs, 0)}`,
    ],
  }
}

export function computeBeton(values: Record<string, string>): Computation {
  const laenge = num(values, "laenge", "Länge", { min: 0 })
  if (!laenge.ok) return laenge
  const breite = num(values, "breite", "Breite", { min: 0 })
  if (!breite.ok) return breite
  const dicke = num(values, "dicke", "Dicke", { min: 0 })
  if (!dicke.ok) return dicke
  const ergiebigkeit = num(values, "ergiebigkeit", "Ergiebigkeit je 25-kg-Sack", { positive: true })
  if (!ergiebigkeit.ok) return ergiebigkeit
  const result = concreteVolume({
    lengthM: laenge.value,
    widthM: breite.value,
    thicknessCm: dicke.value,
    litersPerBag: ergiebigkeit.value,
  })
  if (!result.ok) return result
  return {
    ok: true,
    lines: [
      line("Beton", `${formatDecimal(result.data.cubicMeters, 3)} m³`, true),
      line("Volumen", `${formatDecimal(result.data.liters, 1)} l`),
      line("Säcke à 25 kg", `${formatFlexible(result.data.bags, 0)} Stück`, false, `${formatFlexible(ergiebigkeit.value)} l fertiger Beton je Sack`),
    ],
    worked: [
      `${formatFlexible(laenge.value)} m × ${formatFlexible(breite.value)} m × ${formatFlexible(dicke.value)} cm ÷ 100 = ${formatDecimal(result.data.cubicMeters, 3)} m³`,
      `${formatDecimal(result.data.liters, 1)} l ÷ ${formatFlexible(ergiebigkeit.value)} l je Sack, aufgerundet = ${formatFlexible(result.data.bags, 0)} Säcke`,
    ],
  }
}

export function computeRabatt(values: Record<string, string>): Computation {
  const preis = num(values, "preis", "Ursprünglicher Preis", { min: 0 })
  if (!preis.ok) return preis
  const rabatt = num(values, "rabatt", "Rabatt", { min: 0, max: 100 })
  if (!rabatt.ok) return rabatt
  const result = discountPrice({ price: preis.value, percent: rabatt.value })
  if (!result.ok) return result
  const original = roundHalfAway(preis.value, 2)
  const final = roundHalfAway(result.data.final, 2)
  const saved = roundHalfAway(original - final, 2)
  return {
    ok: true,
    lines: [
      euro("Neuer Preis", final, true),
      euro("Du sparst", saved),
    ],
    worked: [
      `${formatEuro(original)} × ${formatFlexible(rabatt.value)} % = Ersparnis, neuer Preis ${formatEuro(final)}`,
      `${formatEuro(original)} − ${formatEuro(final)} = ${formatEuro(saved)}`,
    ],
  }
}

export function computeGrundpreis(values: Record<string, string>): Computation {
  const preis = num(values, "preis", "Preis", { min: 0 })
  if (!preis.ok) return preis
  const menge = num(values, "menge", "Menge", { positive: true })
  if (!menge.ok) return menge
  const einheit = values.einheit ?? ""
  if (!isQuantityUnit(einheit)) return fail("Bitte eine Einheit wählen.")
  const result = basePrice({ price: preis.value, quantity: menge.value, unit: einheit })
  if (!result.ok) return result
  const meta = unitMeta(einheit)
  return {
    ok: true,
    lines: [
      euro(`Grundpreis je ${result.data.baseLabel}`, result.data.perBase, true),
      euro(`Preis je ${meta.enteredLabel}`, result.data.perEntered),
    ],
    worked: [
      `${formatEuro(preis.value)} ÷ (${formatFlexible(menge.value)} ${meta.enteredLabel} in ${result.data.baseLabel}) = ${formatEuro(result.data.perBase)} / ${result.data.baseLabel}`,
    ],
  }
}

export function computeVergleich(values: Record<string, string>): Computation {
  const offers = []
  for (const index of [1, 2, 3] as const) {
    const label = `Angebot ${index}`
    const priceRaw = (values[`a${index}preis`] ?? "").trim()
    const qtyRaw = (values[`a${index}menge`] ?? "").trim()
    if (!priceRaw && !qtyRaw) continue
    const price = num(values, `a${index}preis`, `${label}, Preis`, { min: 0 })
    if (!price.ok) return price
    const qty = num(values, `a${index}menge`, `${label}, Menge`, { positive: true })
    if (!qty.ok) return qty
    const unit = values[`a${index}einheit`] ?? ""
    if (!isQuantityUnit(unit)) return fail(`${label}: Bitte eine Einheit wählen.`)
    offers.push({ label, price: price.value, quantity: qty.value, unit })
  }

  const result = compareOffers(offers)
  if (!result.ok) return result

  const lines: ResultLine[] = []
  if (result.data.comparable && result.data.cheapestIndex >= 0) {
    const winner = result.data.offers[result.data.cheapestIndex]
    lines.push(
      euro(
        `Günstigster Grundpreis`,
        winner.perBase,
        true,
        `${winner.label}, je ${winner.baseLabel}`,
      ),
    )
  } else {
    lines.push(
      line(
        "Vergleich",
        "Unterschiedliche Einheiten",
        true,
        "Wir nennen jeden Grundpreis, küren aber nur bei derselben Bezugsgröße einen Sieger.",
      ),
    )
  }

  for (const [index, offer] of result.data.offers.entries()) {
    const cheapest = result.data.comparable && index === result.data.cheapestIndex
    lines.push(
      euro(
        offer.label,
        offer.perBase,
        false,
        `${formatEuro(offer.price)} für ${formatFlexible(offer.quantity)} ${unitMeta(offer.unit).enteredLabel}${cheapest ? " · günstigster" : ""}`,
      ),
    )
  }

  return {
    ok: true,
    lines,
    worked: result.data.offers.map(
      (offer) =>
        `${offer.label}: ${formatEuro(offer.price)} ÷ Menge in ${offer.baseLabel} = ${formatEuro(offer.perBase)} / ${offer.baseLabel}`,
    ),
  }
}

export function computeRatenkauf(values: Record<string, string>): Computation {
  const bar = num(values, "bar", "Barpreis", { min: 0 })
  if (!bar.ok) return bar
  const anzahlung = num(values, "anzahlung", "Anzahlung", { min: 0 })
  if (!anzahlung.ok) return anzahlung
  const anzahl = num(values, "anzahl", "Anzahl Raten", { integer: true, positive: true, max: 120 })
  if (!anzahl.ok) return anzahl
  const rate = num(values, "rate", "Ratenhöhe", { min: 0 })
  if (!rate.ok) return rate
  const result = installmentPurchase({
    cashPrice: bar.value,
    downPayment: anzahlung.value,
    count: anzahl.value,
    installment: rate.value,
  })
  if (!result.ok) return result
  const total = roundHalfAway(result.data.total, 2)
  const cash = roundHalfAway(bar.value, 2)
  const surcharge = roundHalfAway(total - cash, 2)
  const percent = cash === 0 ? null : (surcharge / cash) * 100
  return {
    ok: true,
    lines: [
      euro("Gesamt aus Anzahlung und Raten", total, true),
      euro(surcharge >= 0 ? "Aufpreis gegenüber bar" : "Vorteil gegenüber bar", Math.abs(surcharge)),
      line(
        "Aufpreis in Prozent",
        percent === null ? "nicht definiert" : formatPercent(percent),
        false,
        cash === 0 ? "Beim Barpreis 0 € lässt sich kein Prozent-Aufpreis bilden." : undefined,
      ),
    ],
    worked: [
      `${formatEuro(anzahlung.value)} + ${formatFlexible(anzahl.value, 0)} × ${formatEuro(rate.value)} = ${formatEuro(total)}`,
      `${formatEuro(total)} − Barpreis ${formatEuro(cash)} = ${formatEuro(surcharge)}`,
    ],
  }
}

export function computeMultipack(values: Record<string, string>): Computation {
  const packung = num(values, "packung", "Preis der Packung", { min: 0 })
  if (!packung.ok) return packung
  const stueck = num(values, "stueck", "Stück in der Packung", { integer: true, positive: true })
  if (!stueck.ok) return stueck
  const einzel = optionalNum(values, "einzel", "Einzelpreis", { min: 0 })
  if (!einzel.ok) return einzel
  const result = multipackPrice({
    packPrice: packung.value,
    packCount: stueck.value,
    singlePrice: einzel.value,
  })
  if (!result.ok) return result
  const lines: ResultLine[] = [
    euro("Stückpreis in der Packung", result.data.unitPrice, true),
  ]
  const worked = [
    `${formatEuro(packung.value)} ÷ ${formatFlexible(stueck.value, 0)} = ${formatEuro(result.data.unitPrice)}`,
  ]
  if (result.data.singlePrice !== null && result.data.savePerPack !== null && result.data.savePerUnit !== null) {
    lines.push(euro("Einzelpreis", result.data.singlePrice))
    lines.push(
      euro(
        result.data.savePerPack >= 0 ? "Vorteil der Packung" : "Aufpreis der Packung",
        Math.abs(result.data.savePerPack),
        false,
        `${formatEuro(Math.abs(result.data.savePerUnit))} je Stück`,
      ),
    )
    worked.push(
      `(${formatEuro(result.data.singlePrice)} − ${formatEuro(result.data.unitPrice)}) × ${formatFlexible(stueck.value, 0)} = ${formatEuro(result.data.savePerPack)}`,
    )
  }
  return { ok: true, lines, worked }
}
