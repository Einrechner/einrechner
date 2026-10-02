export type FormulaOk<T> = { ok: true; data: T }
export type FormulaFail = { ok: false; message: string }
export type Formula<T> = FormulaOk<T> | FormulaFail

export function compoundInterest(input: {
  principal: number
  annualRatePercent: number
  years: number
  periodsPerYear: number
}): Formula<{ final: number; interest: number }> {
  if (input.principal < 0) {
    return { ok: false, message: "Das Startkapital darf nicht negativ sein." }
  }
  if (input.annualRatePercent < 0) {
    return { ok: false, message: "Der Jahreszins darf nicht negativ sein." }
  }
  if (input.years < 0) {
    return { ok: false, message: "Die Laufzeit darf nicht negativ sein." }
  }
  if (input.periodsPerYear <= 0) {
    return { ok: false, message: "Die Verzinsung braucht mindestens eine Periode im Jahr." }
  }

  const rate = input.annualRatePercent / 100
  const final =
    input.principal *
    (1 + rate / input.periodsPerYear) ** (input.periodsPerYear * input.years)

  if (!Number.isFinite(final)) {
    return {
      ok: false,
      message: "Diese Kombination wird so groß, dass sie sich nicht mehr sinnvoll anzeigen lässt.",
    }
  }

  return { ok: true, data: { final, interest: final - input.principal } }
}

export function annuityLoan(input: {
  principal: number
  annualRatePercent: number
  years: number
}): Formula<{ monthlyPayment: number; months: number; total: number; interest: number }> {
  if (input.principal < 0) {
    return { ok: false, message: "Der Kreditbetrag darf nicht negativ sein." }
  }
  if (input.annualRatePercent < 0) {
    return { ok: false, message: "Der Jahreszins darf nicht negativ sein." }
  }
  if (input.years <= 0) {
    return { ok: false, message: "Die Laufzeit muss größer als 0 sein." }
  }

  const months = input.years * 12
  const monthlyRate = input.annualRatePercent / 100 / 12
  let monthlyPayment: number

  if (monthlyRate === 0) {
    monthlyPayment = input.principal / months
  } else {
    const growth = (1 + monthlyRate) ** months
    monthlyPayment = (input.principal * (monthlyRate * growth)) / (growth - 1)
  }

  if (!Number.isFinite(monthlyPayment)) {
    return {
      ok: false,
      message: "Diese Kombination lässt sich nicht als Rate darstellen.",
    }
  }

  const total = monthlyPayment * months
  return {
    ok: true,
    data: {
      monthlyPayment,
      months,
      total,
      interest: total - input.principal,
    },
  }
}

export function savingsPlan(input: {
  initial: number
  monthly: number
  annualRatePercent: number
  years: number
}): Formula<{
  future: number
  deposited: number
  gain: number
  fromInitial: number
  fromPayments: number
}> {
  if (input.initial < 0 || input.monthly < 0) {
    return { ok: false, message: "Beträge dürfen nicht negativ sein." }
  }
  if (input.annualRatePercent < 0) {
    return { ok: false, message: "Der Jahreszins darf nicht negativ sein." }
  }
  if (input.years < 0) {
    return { ok: false, message: "Die Laufzeit darf nicht negativ sein." }
  }

  const months = input.years * 12
  const monthlyRate = input.annualRatePercent / 100 / 12
  const fromInitial = input.initial * (1 + monthlyRate) ** months
  const fromPayments =
    monthlyRate === 0
      ? input.monthly * months
      : input.monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate)

  const future = fromInitial + fromPayments
  if (!Number.isFinite(future)) {
    return {
      ok: false,
      message: "Diese Kombination wird so groß, dass sie sich nicht mehr sinnvoll anzeigen lässt.",
    }
  }

  const deposited = input.initial + input.monthly * months
  return {
    ok: true,
    data: {
      future,
      deposited,
      gain: future - deposited,
      fromInitial,
      fromPayments,
    },
  }
}

export function valueAddedTax(input: {
  amount: number
  ratePercent: number
  direction: "netto-zu-brutto" | "brutto-zu-netto"
}): Formula<{ net: number; tax: number; gross: number }> {
  if (input.amount < 0) {
    return { ok: false, message: "Der Betrag darf nicht negativ sein." }
  }
  if (input.ratePercent < 0) {
    return { ok: false, message: "Der Steuersatz darf nicht negativ sein." }
  }

  const rate = input.ratePercent / 100
  if (input.direction === "netto-zu-brutto") {
    const tax = input.amount * rate
    return { ok: true, data: { net: input.amount, tax, gross: input.amount + tax } }
  }

  const net = input.amount / (1 + rate)
  return { ok: true, data: { net, tax: input.amount - net, gross: input.amount } }
}

export function percentOf(base: number, percent: number): Formula<{ amount: number }> {
  return { ok: true, data: { amount: (base * percent) / 100 } }
}

export function shareAsPercent(part: number, whole: number): Formula<{ percent: number }> {
  if (whole === 0) {
    return {
      ok: false,
      message: "Der Grundwert darf nicht 0 sein, sonst ist der Anteil nicht als Prozent definiert.",
    }
  }
  return { ok: true, data: { percent: (part / whole) * 100 } }
}

export function percentChange(from: number, to: number): Formula<{ percent: number; delta: number }> {
  if (from === 0) {
    return {
      ok: false,
      message: "Der Ausgangswert darf nicht 0 sein, sonst ist die Veränderung nicht als Prozent definiert.",
    }
  }
  return { ok: true, data: { percent: ((to - from) / from) * 100, delta: to - from } }
}

export function simpleRoi(input: {
  investment: number
  proceeds: number
}): Formula<{ profit: number; roiPercent: number }> {
  if (input.investment === 0) {
    return {
      ok: false,
      message: "Der Einsatz darf nicht 0 sein, sonst ist die Rendite nicht definiert.",
    }
  }
  if (input.investment < 0 || input.proceeds < 0) {
    return { ok: false, message: "Einsatz und Rückfluss dürfen nicht negativ sein." }
  }
  const profit = input.proceeds - input.investment
  return { ok: true, data: { profit, roiPercent: (profit / input.investment) * 100 } }
}
