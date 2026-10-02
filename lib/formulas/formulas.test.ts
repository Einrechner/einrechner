import { describe, expect, it } from "vitest"

import { roundHalfAway, parseGermanNumber } from "@/lib/format"
import { annuityLoan, compoundInterest, percentChange, percentOf, savingsPlan, shareAsPercent, simpleRoi, valueAddedTax } from "@/lib/formulas/finance"
import { carCostPerKm, electricityCost, rentBurden, subscriptionCost } from "@/lib/formulas/consumer"
import { GRID_CO2_GRAMS_PER_KWH, applianceEnergy, co2FromElectricity, ledSavings, standbyCost } from "@/lib/formulas/energy"
import { concreteVolume, flooringNeed, tileCount, wallPaint, wallpaperRolls } from "@/lib/formulas/diy"
import { basePrice, compareOffers, discountPrice, installmentPurchase, multipackPrice } from "@/lib/formulas/shopping"
import { calculators } from "@/lib/catalog"
import { searchCalculators } from "@/lib/search"
import { categories } from "@/lib/categories"

describe("roundHalfAway", () => {
  it("rounds halves away from zero", () => {
    expect(roundHalfAway(1.005, 2)).toBe(1.01)
    expect(roundHalfAway(10.005, 2)).toBe(10.01)
    expect(roundHalfAway(2.675, 2)).toBe(2.68)
    expect(roundHalfAway(-1.005, 2)).toBe(-1.01)
  })
})

describe("parseGermanNumber", () => {
  it("reads German and plain decimals", () => {
    expect(parseGermanNumber("1.234,56")).toBe(1234.56)
    expect(parseGermanNumber("1234,56")).toBe(1234.56)
    expect(parseGermanNumber("1.234")).toBe(1234)
    expect(parseGermanNumber("1,5")).toBe(1.5)
    expect(parseGermanNumber("1.5")).toBe(1.5)
    expect(parseGermanNumber("12.000")).toBe(12000)
    expect(parseGermanNumber("1,234.56")).toBe(1234.56)
    expect(parseGermanNumber(" 49,99 € ")).toBe(49.99)
    expect(parseGermanNumber("")).toBeNull()
    expect(parseGermanNumber("abc")).toBeNull()
    expect(parseGermanNumber("1.234.5")).toBeNull()
  })
})

describe("finanzen", () => {
  it("compounds yearly", () => {
    const result = compoundInterest({
      principal: 10000,
      annualRatePercent: 3,
      years: 10,
      periodsPerYear: 1,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(roundHalfAway(result.data.final, 2)).toBe(13439.16)
    expect(roundHalfAway(result.data.interest, 2)).toBe(3439.16)
  })

  it("compounds monthly", () => {
    const result = compoundInterest({
      principal: 10000,
      annualRatePercent: 3,
      years: 10,
      periodsPerYear: 12,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(roundHalfAway(result.data.final, 2)).toBe(13493.54)
  })

  it("leaves capital unchanged at zero interest", () => {
    const result = compoundInterest({
      principal: 500,
      annualRatePercent: 0,
      years: 4,
      periodsPerYear: 1,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.final).toBe(500)
  })

  it("prices an annuity and a zero-interest loan", () => {
    const loan = annuityLoan({ principal: 100000, annualRatePercent: 5, years: 10 })
    expect(loan.ok).toBe(true)
    if (!loan.ok) return
    expect(roundHalfAway(loan.data.monthlyPayment, 2)).toBe(1060.66)
    expect(loan.data.months).toBe(120)

    const free = annuityLoan({ principal: 12000, annualRatePercent: 0, years: 1 })
    expect(free.ok).toBe(true)
    if (!free.ok) return
    expect(free.data.monthlyPayment).toBe(1000)
    expect(free.data.interest).toBe(0)
  })

  it("builds a savings plan with end-of-month deposits", () => {
    const result = savingsPlan({ initial: 0, monthly: 200, annualRatePercent: 4, years: 10 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(roundHalfAway(result.data.future, 2)).toBe(29449.96)
    expect(result.data.deposited).toBe(24000)
  })

  it("converts VAT in both directions", () => {
    const gross = valueAddedTax({ amount: 100, ratePercent: 19, direction: "netto-zu-brutto" })
    expect(gross.ok).toBe(true)
    if (!gross.ok) return
    expect(gross.data.tax).toBeCloseTo(19, 10)
    expect(gross.data.gross).toBeCloseTo(119, 10)

    const reduced = valueAddedTax({ amount: 100, ratePercent: 7, direction: "netto-zu-brutto" })
    expect(reduced.ok).toBe(true)
    if (!reduced.ok) return
    expect(reduced.data.gross).toBeCloseTo(107, 10)

    const net = valueAddedTax({ amount: 119, ratePercent: 19, direction: "brutto-zu-netto" })
    expect(net.ok).toBe(true)
    if (!net.ok) return
    expect(net.data.net).toBeCloseTo(100, 8)
    expect(net.data.tax).toBeCloseTo(19, 8)
  })

  it("covers the three percentage questions and a simple ROI", () => {
    const shareAmount = percentOf(200, 19)
    expect(shareAmount.ok).toBe(true)
    if (shareAmount.ok) expect(shareAmount.data.amount).toBe(38)
    const share = shareAsPercent(50, 200)
    expect(share.ok).toBe(true)
    if (share.ok) expect(share.data.percent).toBe(25)
    expect(shareAsPercent(5, 0).ok).toBe(false)

    const change = percentChange(80, 100)
    expect(change.ok).toBe(true)
    if (change.ok) expect(change.data.percent).toBe(25)
    expect(percentChange(0, 10).ok).toBe(false)

    const roi = simpleRoi({ investment: 1000, proceeds: 1250 })
    expect(roi.ok).toBe(true)
    if (roi.ok) {
      expect(roi.data.profit).toBe(250)
      expect(roi.data.roiPercent).toBe(25)
    }
    expect(simpleRoi({ investment: 0, proceeds: 10 }).ok).toBe(false)
  })
})

describe("verbraucherfragen", () => {
  it("prices electricity per month and year", () => {
    const result = electricityCost({ kilowattHours: 250, centsPerKwh: 35, period: "monat" })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.monthly).toBeCloseTo(87.5, 8)
    expect(result.data.yearly).toBeCloseTo(1050, 8)
  })

  it("computes the rent burden", () => {
    const result = rentBurden({ warmRent: 900, netIncome: 3000 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.quotePercent).toBe(30)
    expect(rentBurden({ warmRent: 900, netIncome: 0 }).ok).toBe(false)
  })

  it("splits car costs per kilometre", () => {
    const result = carCostPerKm({
      kmPerYear: 10000,
      litersPer100km: 6,
      fuelPricePerLiter: 1.7,
      insurance: 600,
      tax: 100,
      maintenance: 400,
      depreciation: 1500,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.annualFuel).toBeCloseTo(1020, 8)
    expect(result.data.annual).toBeCloseTo(3620, 8)
    expect(result.data.perKm).toBeCloseTo(0.362, 8)
  })

  it("turns a subscription into a year", () => {
    const result = subscriptionCost(12.99)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.yearly).toBeCloseTo(155.88, 8)
    expect(result.data.threeYears).toBeCloseTo(467.64, 8)
  })
})

describe("energiesparen", () => {
  it("uses the stated grid factor of 353 g/kWh", () => {
    expect(GRID_CO2_GRAMS_PER_KWH).toBe(353)
    const result = co2FromElectricity({ kilowattHours: 3000 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.kilograms).toBeCloseTo(1059, 8)
  })

  it("computes appliance, LED and standby energy", () => {
    const appliance = applianceEnergy({ watts: 150, hoursPerDay: 4, daysPerYear: 365, pricePerKwh: 0.35 })
    expect(appliance.ok).toBe(true)
    if (!appliance.ok) return
    expect(appliance.data.kilowattHours).toBeCloseTo(219, 8)
    expect(appliance.data.cost).toBeCloseTo(76.65, 8)

    const led = ledSavings({
      wattsIncandescent: 60,
      wattsLed: 8,
      hoursPerDay: 3,
      daysPerYear: 365,
      count: 6,
      pricePerKwh: 0.35,
    })
    expect(led.ok).toBe(true)
    if (!led.ok) return
    expect(led.data.savedKilowattHours).toBeCloseTo(341.64, 8)
    expect(led.data.savedEuro).toBeCloseTo(119.574, 6)

    const standby = standbyCost({ watts: 5, hoursPerDay: 18, pricePerKwh: 0.35 })
    expect(standby.ok).toBe(true)
    if (!standby.ok) return
    expect(standby.data.kilowattHours).toBeCloseTo(32.85, 8)
    expect(standby.data.cost).toBeCloseTo(11.4975, 6)
  })
})

describe("heimwerken", () => {
  it("rounds paint up to whole cans", () => {
    const result = wallPaint({
      areaM2: 52,
      openingsM2: 6,
      coats: 2,
      coverageM2PerLiter: 8,
      canLiters: 10,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.paintableM2).toBe(46)
    expect(result.data.liters).toBeCloseTo(11.5, 8)
    expect(result.data.cans).toBe(2)
  })

  it("counts wallpaper rolls with a standard Euro roll", () => {
    const result = wallpaperRolls({
      perimeterM: 18,
      heightM: 2.5,
      rollWidthM: 0.53,
      rollLengthM: 10.05,
      rapportM: 0,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.strips).toBe(34)
    expect(result.data.stripsPerRoll).toBe(4)
    expect(result.data.rolls).toBe(9)
  })

  it("adds tile waste and flooring packs", () => {
    const tiles = tileCount({ areaM2: 15, tileLengthCm: 60, tileWidthCm: 60, wastePercent: 10 })
    expect(tiles.ok).toBe(true)
    if (!tiles.ok) return
    expect(tiles.data.tileM2).toBeCloseTo(0.36, 8)
    expect(tiles.data.count).toBe(46)

    const floor = flooringNeed({ lengthM: 4.2, widthM: 3.6, wastePercent: 8, packM2: 2.2 })
    expect(floor.ok).toBe(true)
    if (!floor.ok) return
    expect(floor.data.areaM2).toBeCloseTo(15.12, 8)
    expect(floor.data.packs).toBe(8)
  })

  it("converts concrete thickness in centimetres to bags", () => {
    const result = concreteVolume({ lengthM: 3, widthM: 0.8, thicknessCm: 15, litersPerBag: 12 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.cubicMeters).toBeCloseTo(0.36, 8)
    expect(result.data.liters).toBeCloseTo(360, 8)
    expect(result.data.bags).toBe(30)
  })
})

describe("shopping", () => {
  it("applies a discount and a base price", () => {
    const discount = discountPrice({ price: 80, percent: 25 })
    expect(discount.ok).toBe(true)
    if (!discount.ok) return
    expect(discount.data.final).toBe(60)
    expect(discount.data.saved).toBe(20)

    const grams = basePrice({ price: 1.99, quantity: 500, unit: "g" })
    expect(grams.ok).toBe(true)
    if (!grams.ok) return
    expect(grams.data.perBase).toBeCloseTo(3.98, 8)
    expect(grams.data.baseLabel).toBe("kg")

    const ml = basePrice({ price: 1.49, quantity: 750, unit: "ml" })
    expect(ml.ok).toBe(true)
    if (ml.ok) expect(ml.data.perBase).toBeCloseTo(1.49 / 0.75, 8)
  })

  it("picks the cheapest comparable offer", () => {
    const result = compareOffers([
      { label: "A", price: 2, quantity: 500, unit: "g" },
      { label: "B", price: 3.5, quantity: 1, unit: "kg" },
      { label: "C", price: 1.2, quantity: 200, unit: "g" },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.comparable).toBe(true)
    expect(result.data.offers[result.data.cheapestIndex].label).toBe("B")
    expect(result.data.offers[1].perBase).toBeCloseTo(3.5, 8)
  })

  it("refuses to crown a winner across different dimensions", () => {
    const result = compareOffers([
      { label: "A", price: 2, quantity: 1, unit: "kg" },
      { label: "B", price: 2, quantity: 1, unit: "l" },
    ])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.comparable).toBe(false)
    expect(result.data.cheapestIndex).toBe(-1)
  })

  it("sums installments and a multipack", () => {
    const rates = installmentPurchase({ cashPrice: 600, downPayment: 0, count: 12, installment: 55 })
    expect(rates.ok).toBe(true)
    if (!rates.ok) return
    expect(rates.data.total).toBe(660)
    expect(rates.data.surcharge).toBe(60)
    expect(rates.data.surchargePercent).toBe(10)

    const pack = multipackPrice({ packPrice: 2.4, packCount: 6, singlePrice: 0.55 })
    expect(pack.ok).toBe(true)
    if (!pack.ok) return
    expect(pack.data.unitPrice).toBeCloseTo(0.4, 8)
    expect(pack.data.savePerPack).toBeCloseTo(0.9, 8)
  })
})

describe("catalog", () => {
  it("ships one working calculator for every requested slug", () => {
    const slugs = calculators.map((calculator) => calculator.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(slugs).toEqual([
      "zinseszins",
      "annuitaetenkredit",
      "sparplan",
      "mehrwertsteuer",
      "prozentrechnung",
      "roi",
      "stromkosten",
      "mietbelastungsquote",
      "kfz-kosten-pro-km",
      "abo-jahreskosten",
      "geraetestromverbrauch",
      "led-ersparnis",
      "standby-kosten",
      "co2-aus-strom",
      "wandfarbe",
      "tapetenbedarf",
      "fliesenbedarf",
      "bodenbelag",
      "betonmenge",
      "rabatt",
      "grundpreis",
      "angebotsvergleich",
      "ratenkauf",
      "multipack-stueckpreis",
    ])

    for (const category of categories) {
      expect(calculators.some((calculator) => calculator.category === category.id)).toBe(true)
    }

    for (const calculator of calculators) {
      const values = Object.fromEntries(calculator.fields.map((field) => [field.id, field.defaultValue]))
      const result = calculator.compute(values)
      expect(result.ok, calculator.slug).toBe(true)
      if (result.ok) {
        expect(result.lines.length).toBeGreaterThan(0)
        expect(result.worked.length).toBeGreaterThan(0)
      }
      for (const related of calculator.related) {
        expect(slugs).toContain(related)
        expect(related).not.toBe(calculator.slug)
      }
    }
  })

  it("states the emission factor on the CO₂ calculator", () => {
    const co2 = calculators.find((calculator) => calculator.slug === "co2-aus-strom")
    expect(co2?.assumptions?.join(" ")).toContain("353")
    expect(co2?.formula.join(" ")).toContain("353")
  })

  it("finds calculators despite umlauts and empty queries", () => {
    const items = calculators.map((calculator) => ({
      ...calculator,
      categoryTitle: categories.find((category) => category.id === calculator.category)?.title ?? "",
    }))
    expect(searchCalculators(items, "   ")).toHaveLength(items.length)
    expect(searchCalculators(items, "geraet").map((item) => item.slug)).toContain("geraetestromverbrauch")
    expect(searchCalculators(items, "kein-treffer-xyz")).toHaveLength(0)
    expect(searchCalculators(items, "MwSt").map((item) => item.slug)).toContain("mehrwertsteuer")
  })
})
