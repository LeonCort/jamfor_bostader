import type { Accommodation, FinanceSettings } from "@/lib/accommodations";

export type MetricKey =
  | "totalMonthlyCost"
  | "utropspris"
  | "kontantinsats"
  | "hyra"
  | "driftkostnaderMonthly"
  | "amorteringPerManad"
  | "rantaPerManad"
  | "boarea"
  | "antalRum"
  | "tomtarea"
  | "prisPerKvm"
  | "byggar"
  | "dagarPaHemnet"
  | "energiklass";

export type MetricContext = {
  current?: Accommodation | null;
  finance?: FinanceSettings | null;
};

export type ValuesAcrossEntry = { id: string; title?: string | null; value: number | undefined };

export type Metric = {
  key: MetricKey;
  label: string;
  unit?: string;
  goodWhenHigher: boolean;
  valueOf: (a: Accommodation, ctx: MetricContext) => number | undefined;
  format?: (n: number) => string;
  valuesAcross?: (cols: Accommodation[], ctx: MetricContext) => ValuesAcrossEntry[];
  breakdown?: (a: Accommodation, ctx: MetricContext) => { label: string; value: number; note?: string }[];
};

export function bestValue(values: Array<number | undefined>, goodWhenHigher: boolean): number | undefined {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return undefined;
  return goodWhenHigher ? Math.max(...nums) : Math.min(...nums);
}

export function deltaVariant(
  delta: number | null | undefined,
  goodWhenHigher: boolean
): "good" | "bad" | "neutral" {
  if (delta == null || delta === 0) return "neutral";
  const favorable = goodWhenHigher ? delta > 0 : delta < 0;
  return favorable ? "good" : "bad";
}

export function monthlyDrift(annual?: number) {
  return annual && annual > 0 ? Math.round(annual / 12) : undefined;
}

export function utropsprisFor(a: Accommodation): number | undefined {
  return a.kind === "current" ? a.currentValuation ?? undefined : (a as any).begartPris ?? undefined;
}

export function kontantinsatsFor(a: Accommodation): number | undefined {
  if (a.kind === "current") {
    const mortgage = (a.metrics as any)?.mortgage as { loans?: { principal: number }[] } | undefined;
    const loans = mortgage?.loans ?? [];
    const totalDebt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
    const v = a.currentValuation ?? 0;
    const cash = v > 0 ? v - totalDebt : undefined;
    return cash != null && cash > 0 ? cash : undefined;
  } else {
    const explicit = (a as any).kontantinsats as number | undefined;
    if (explicit != null) return explicit;
    const bp = (a as any).begartPris as number | undefined;
    return bp != null ? Math.round(bp * 0.15) : undefined;
  }
}

function energyScoreFromLetter(letter?: string | null): number | undefined {
  if (!letter) return undefined;
  const L = letter.trim().toUpperCase();
  const map: Record<string, number> = { A: 7, B: 6, C: 5, D: 4, E: 3, F: 2, G: 1 };
  return map[L];
}
function energyLetterFromScore(score: number): string {
  const map: Record<number, string> = { 7: "A", 6: "B", 5: "C", 4: "D", 3: "E", 2: "F", 1: "G" };
  return map[Math.max(1, Math.min(7, Math.round(score)))] ?? "?";
}

export const metrics: Record<MetricKey, Metric> = {
  totalMonthlyCost: {
    key: "totalMonthlyCost",
    label: "Månadskostnad",
    unit: "kr/mån",
    goodWhenHigher: false,
    valueOf: (a) => a.totalMonthlyCost ?? undefined,
    valuesAcross: (cols) => cols.map((c) => ({ id: c.id, title: c.title, value: c.totalMonthlyCost ?? undefined })),
    breakdown: (a, ctx) => {
      const finance = ctx.finance ?? null;
      const hyra = Math.round(a.hyra ?? 0);
      const driftIsEst = !!(a as any).driftkostnaderIsEstimated;
      const drift = driftIsEst
        ? Math.round((((a as any).driftkostnaderSchablon ?? 0) as number) / 12)
        : a.driftkostnader
        ? Math.round(a.driftkostnader / 12)
        : 0;
      const ranta = Math.round(a.rantaPerManad ?? 0);
      const amort = Math.round(a.amorteringPerManad ?? 0);
      const note = driftIsEst ? "Schablonvärde enligt modell" : (a.maintenanceUnknown ? "uppskattad 0 kr (okänt)" : undefined);
      // +1% skuldkvotstillägg badge if lan/income ratio > 4.5
      const incomes = ((finance?.incomeMonthlyPerson1 ?? 0) + (finance?.incomeMonthlyPerson2 ?? 0)) * 12;
      const lan = (a as any).lan as number | undefined;
      const extra = lan != null && incomes > 0 && lan / incomes > 4.5 ? "+1% skuldkvotstillägg" : undefined;
      return [
        { label: "Avgift / hyra", value: hyra },
        { label: "Drift (per månad)", value: drift, note },
        { label: "Ränta", value: ranta },
        { label: "Amortering", value: amort, note: extra },
      ];
    },
  },
  utropspris: {
    key: "utropspris",
    label: "Utropspris",
    unit: "kr",
    goodWhenHigher: false,
    valueOf: (a) => utropsprisFor(a),
    valuesAcross: (cols) => cols.map((c) => ({ id: c.id, title: c.title, value: utropsprisFor(c) })),
  },
  kontantinsats: {
    key: "kontantinsats",
    label: "Kontantinsats",
    unit: "kr",
    goodWhenHigher: false,
    valueOf: (a) => kontantinsatsFor(a),
    valuesAcross: (cols) => cols.map((c) => ({ id: c.id, title: c.title, value: kontantinsatsFor(c) })),
  },
  prisPerKvm: {
    key: "prisPerKvm",
    label: "Pris per m²",
    unit: "kr/m²",
    goodWhenHigher: false,
    valueOf: (a) => {
      const price = utropsprisFor(a);
      const area = a.boarea;
      return price != null && area != null && area > 0 ? Math.round(price / area) : undefined;
    },
    valuesAcross: (cols) => cols.map((c) => {
      const price = utropsprisFor(c);
      const area = c.boarea;
      return { id: c.id, title: c.title, value: price != null && area != null && area > 0 ? Math.round(price / area) : undefined };
    }),
  },
  hyra: {
    key: "hyra",
    label: "Hyra/avgift",
    unit: "kr/mån",
    goodWhenHigher: false,
    valueOf: (a) => (a.hyra != null ? Math.round(a.hyra) : undefined),
    valuesAcross: (cols) => cols.map((c) => ({ id: c.id, title: c.title, value: c.hyra != null ? Math.round(c.hyra) : undefined })),
  },
  driftkostnaderMonthly: {
    key: "driftkostnaderMonthly",
    label: "Driftkostnad",
    unit: "kr/mån",
    goodWhenHigher: false,
    valueOf: (a) => {
      const isEst = !!(a as any).driftkostnaderIsEstimated;
      return isEst ? monthlyDrift((a as any).driftkostnaderSchablon) : monthlyDrift(a.driftkostnader);
    },
    valuesAcross: (cols) => cols.map((c) => {
      const isEst = !!(c as any).driftkostnaderIsEstimated;
      return { id: c.id, title: c.title, value: isEst ? monthlyDrift((c as any).driftkostnaderSchablon) : monthlyDrift(c.driftkostnader) };
    }),
  },
  amorteringPerManad: {
    key: "amorteringPerManad",
    label: "Amortering",
    unit: "kr/mån",
    goodWhenHigher: false,
    valueOf: (a) => a.amorteringPerManad ?? undefined,
    valuesAcross: (cols) => cols.map((c) => ({ id: c.id, title: c.title, value: c.amorteringPerManad ?? undefined })),
  },
  rantaPerManad: {
    key: "rantaPerManad",
    label: "Ränta",
    unit: "kr/mån",
    goodWhenHigher: false,
    valueOf: (a) => a.rantaPerManad ?? undefined,
    valuesAcross: (cols) => cols.map((c) => ({ id: c.id, title: c.title, value: c.rantaPerManad ?? undefined })),
  },
  boarea: {
    key: "boarea",
    label: "Bostadsyta",
    unit: "m²",
    goodWhenHigher: true,
    valueOf: (a) => a.boarea ?? undefined,
    valuesAcross: (cols) => cols.map((c) => ({ id: c.id, title: c.title, value: c.boarea ?? undefined })),
  },
  antalRum: {
    key: "antalRum",
    label: "Antal rum",
    unit: "rum",
    goodWhenHigher: true,
    valueOf: (a) => a.antalRum ?? undefined,
    valuesAcross: (cols) => cols.map((c) => ({ id: c.id, title: c.title, value: c.antalRum ?? undefined })),
  },
  tomtarea: {
    key: "tomtarea",
    label: "Tomtareal",
    unit: "m²",
    goodWhenHigher: true,
    valueOf: (a) => a.tomtarea ?? undefined,
    valuesAcross: (cols) => cols.map((c) => ({ id: c.id, title: c.title, value: c.tomtarea ?? undefined })),
  },
  byggar: {
    key: "byggar",
    label: "Byggår",
    goodWhenHigher: true,
    valueOf: (a) => a.constructionYear ?? undefined,
    valuesAcross: (cols) => cols.map((c) => ({ id: c.id, title: c.title, value: c.constructionYear ?? undefined })),
  },
  dagarPaHemnet: {
    key: "dagarPaHemnet",
    label: "Dagar på Hemnet",
    unit: "dagar",
    goodWhenHigher: false,
    valueOf: (a) => (a.metrics as any)?.hemnetStats?.daysOnHemnet ?? undefined,
    valuesAcross: (cols) => cols.map((c) => ({ id: c.id, title: c.title, value: (c.metrics as any)?.hemnetStats?.daysOnHemnet ?? undefined })),
  },
  energiklass: {
    key: "energiklass",
    label: "Energiklass",
    goodWhenHigher: true,
    valueOf: (a) => energyScoreFromLetter((a.metrics as any)?.meta?.energyClass),
    format: (n) => energyLetterFromScore(n),
    valuesAcross: (cols) => cols.map((c) => ({ id: c.id, title: c.title, value: energyScoreFromLetter((c.metrics as any)?.meta?.energyClass) })),
  },
};

