"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { X, Info, ArrowUpRight, ArrowDownRight, Calculator, TrendingUp, Home } from "lucide-react";
import type { Accommodation } from "@/lib/accommodations";
import { useAccommodations } from "@/lib/accommodations";

function formatValue(val?: number | string, unit?: string) {
  if (val == null || val === "") return "—";
  if (typeof val === "number") return `${val.toLocaleString("sv-SE")} ${unit ?? ""}`.trim();
  return `${val} ${unit ?? ""}`.trim();
}

function calculationBasis(ctx: CellContext, opts?: { downRate?: number; interestRateAnnual?: number; incomeMonthly?: number }): string {
  const key = ctx.metricKey;
  const acc = ctx.acc;
  const num = (n?: number) => (n != null ? n : undefined);
  const fmt = (n?: number) => (n == null ? "" : `${Math.round(n).toLocaleString("sv-SE")} kr`);
  const fmtMon = (n?: number) => (n == null ? "" : `${Math.round(n).toLocaleString("sv-SE")} kr/mån`);
  if (!key) return "Direktvärde från objektet eller beräknat enligt underlag.";

  switch (key) {
    case "totalMonthlyCost": {
      const hyra = num((acc as any).hyra as number | undefined) ?? 0;
      const driftAr = num((acc as any).driftkostnader as number | undefined) ?? 0;
      const drift = driftAr > 0 ? Math.round(driftAr / 12) : 0;
      const ranta = num((acc as any).rantaPerManad as number | undefined) ?? 0;
      const amort = num((acc as any).amorteringPerManad as number | undefined) ?? 0;
      const sum = hyra + drift + ranta + amort;
      const example = `${fmtMon(hyra)} + ${fmtMon(drift)} + ${fmtMon(ranta)} + ${fmtMon(amort)} = ${fmtMon(sum)}`;
      return `Summa av avgift/hyra + drift/12 + ränta + amortering.\nExempel: ${example}`;
    }
    case "utropspris": {
      const val = acc.kind === "current" ? (acc as any).currentValuation as number | undefined : (acc as any).begartPris as number | undefined;
      const base = acc.kind === "current"
        ? "Nuvarande bostad: baseras på uppskattat marknadsvärde."
        : "Kandidat: baseras på begärt pris från annonsen.";
      return `${base}${val ? `\nExempel: ${fmt(val)}.` : ""}`;
    }
    case "kontantinsats": {
      if (acc.kind === "current") {
        const loans = ((((acc as any).metrics)?.mortgage?.loans) ?? []) as { principal: number }[];
        const debt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
        const v = ((acc as any).currentValuation as number | undefined) ?? 0;
        const ki = v > 0 ? v - debt : undefined;
        return `Nuvarande bostad: marknadsvärde minus totala lån (summan av lånekapital).${ki != null ? `\nExempel: ${fmt(v)} − ${fmt(debt)} = ${fmt(ki)}.` : ""}`;
      } else {
        const ki = (acc as any).kontantinsats as number | undefined;
        const bp = (acc as any).begartPris as number | undefined;
        if (ki != null) {
          return `Kandidat: angiven kontantinsats från underlaget.\nExempel: ${fmt(ki)}.`;
        }
        const pct = ((opts?.downRate ?? 0.15) * 100).toLocaleString("sv-SE", { maximumFractionDigits: 2 });
        return `Kandidat: ${pct}% av utropspriset om inte angivet.\n${bp ? `Exempel: ${fmt(bp)} × ${pct}% = ${fmt(Math.round(bp * (opts?.downRate ?? 0.15)))}.` : ""}`;
      }
    }
    case "boarea":
      return "Boarea i m² enligt annons/underlag.";
    case "antalRum":
      return "Antal rum enligt annons/underlag.";
    case "tomtarea":
      return "Tomtareal i m² enligt annons/underlag.";
    case "hyra": {
      const hyra = (acc as any).hyra as number | undefined;
      return `Månadsavgift/hyra enligt förening/annons.${hyra != null ? `\nExempel: ${fmtMon(hyra)}.` : ""}`;
    }
    case "driftkostnader": {
      const driftAr = (acc as any).driftkostnader as number | undefined;
      if (driftAr != null && driftAr > 0) {
        const m = Math.round(driftAr / 12);
        return `Årlig driftkostnad. I tabellen och jämförelser används drift/12 (per månad).\nExempel: ${driftAr.toLocaleString("sv-SE")} kr/år → ${m.toLocaleString("sv-SE")} kr/mån.`;
      }
      return "Årlig driftkostnad. I tabellen och jämförelser används drift/12 (per månad). Vid okänt antas 0 kr i totalsumman.\nExempel: 24 000 kr/år → 2 000 kr/mån.";
    }
    case "amorteringPerManad": {
      const kind = acc.kind;
      const lan = (acc as any).lan as number | undefined;
      const pris = kind === "current" ? ((acc as any).currentValuation as number | undefined) : ((acc as any).begartPris as number | undefined);
      const ltv = lan && pris ? lan / pris : undefined;
      const ltvTier = ltv != null ? (ltv > 0.7 ? "2%" : ltv > 0.5 ? "1%" : "0%") : "0%";
      const monthlyIncome = opts?.incomeMonthly ?? 0;
      const annualIncome = monthlyIncome * 12;
      const dti = lan && annualIncome > 0 ? lan / annualIncome : undefined;
      const dtiAdd = dti != null && dti > 4.5 ? 1 : 0;
      const totalRatePct = (ltvTier === "2%" ? 2 : ltvTier === "1%" ? 1 : 0) + dtiAdd;
      const example = lan ? `${totalRatePct}% × ${lan.toLocaleString("sv-SE")} kr / 12 ≈ ${(Math.round((lan * (totalRatePct/100)) / 12)).toLocaleString("sv-SE")} kr/mån` : undefined;
      return `Amortering per månad. Baseras på LTV-tier (lånegrad) + ev. skuldkvotstillägg.\n• LTV-regel: >70% ⇒ 2%, >50% ⇒ 1%, annars 0%.\n• Skuldkvotstillägg: +1% om skuld / årsinkomst > 4,5x.\n${ltv != null ? `Aktuell LTV ≈ ${(ltv*100).toFixed(1)}% ⇒ ${ltvTier}. ` : ""}${dti != null ? `Skuldkvot ≈ ${dti.toFixed(2)}x${dti > 4.5 ? " ⇒ +1%" : ""}.` : ""}${example ? `\nExempel: ${example}.` : ""}`;
    }
    case "rantaPerManad": {
      const lan = (acc as any).lan as number | undefined;
      const ratePct = ((opts?.interestRateAnnual ?? 0.03) * 100).toLocaleString("sv-SE", { maximumFractionDigits: 2 });
      const example = lan ? `${lan.toLocaleString("sv-SE")} kr × ${ratePct}% / 12 ≈ ${(Math.round((lan * (opts?.interestRateAnnual ?? 0.03)) / 12)).toLocaleString("sv-SE")} kr/mån` : undefined;
      return `Räntekostnad per månad. Formel: lånebelopp × räntesats / 12.\nRäntesats: ${ratePct}% (inställning).${example ? `\nExempel: ${example}.` : ""}`;
    }
    default:
      return "Direktvärde från objektet eller beräknat enligt underlag.";
  }
}

export type CellContext = {
  acc: Accommodation;
  label: string;
  unit?: string;
  value?: number | string;
  delta?: number | null;
  description?: string;
  // optional richer context for comparisons/breakdowns
  metricKey?: string; // e.g., "totalMonthlyCost"
  valuesAcross?: Array<{ id: string; title?: string; value?: number | undefined }>; // for comparison table
  breakdown?: Array<{ label: string; value: number; note?: string }>; // for per-metric breakdown
};

export default function CellDetailDrawer({
  open,
  onOpenChange,
  ctx,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: CellContext | null;
}) {
  const acc = ctx?.acc;
  const isMd = useMediaQuery("(min-width: 768px)");
  const delta = ctx?.delta ?? null;
  const deltaTone = delta == null || delta === 0 ? "neutral" : delta < 0 ? "good" : "bad";
  const DeltaIcon = deltaTone === "good" ? ArrowDownRight : ArrowUpRight;
  const deltaToneClass = deltaTone === "good" ? "stroke-chart-2" : deltaTone === "bad" ? "stroke-chart-5" : "stroke-muted-foreground";

  const { finance } = useAccommodations();
  const financeOpts = React.useMemo(() => ({
    downRate: finance?.downPaymentRate,
    interestRateAnnual: finance?.interestRateAnnual,
    incomeMonthly: (finance?.incomeMonthlyPerson1 ?? 0) + (finance?.incomeMonthlyPerson2 ?? 0),
  }), [finance]);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={isMd ? "right" : "bottom"}>
        <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-background/80" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 h-[86vh] rounded-t-2xl border border-border bg-card text-foreground shadow-2xl md:left-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:w-[520px] md:rounded-t-none md:rounded-l-2xl">
          <div className="mx-auto max-w-screen-md flex h-full flex-col">
            {!isMd && <Drawer.Handle className="mx-auto mt-2 mb-3 h-1.5 w-10 rounded-full bg-border" />}

            <div className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div>
                <div className="text-xs text-muted-foreground">{ctx?.label}</div>
                <div className="font-medium text-foreground">{acc?.title ?? "Bostad"}</div>
              </div>
              <button className="-m-1 rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Stäng" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="px-4 py-5 space-y-6">
                {/* Main value */}
                <div className="rounded-xl border bg-muted/40 p-6 text-center">
                  <div className="text-3xl font-bold mb-1">{formatValue(ctx?.value, ctx?.unit)}</div>
                  {delta != null && delta !== 0 ? (
                    <div className={`inline-flex items-center gap-1 text-sm font-medium`}>
                      <DeltaIcon className={`h-4 w-4 ${deltaToneClass}`} />
                      <span className={deltaToneClass}>{`${delta > 0 ? "+" : ""}${delta.toLocaleString("sv-SE")} ${ctx?.unit ?? ""}`.trim()}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Nuvarande</div>
                  )}
                </div>

                {/* Context */}
                {ctx?.description ? (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                      <Info className="h-4 w-4" />
                      <span>Detaljer</span>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground whitespace-pre-line">
                      {ctx.description}
                    </div>
                  </div>
                ) : null}

                {/* Beräkningsgrund (all metrics) */}
                {ctx?.metricKey ? (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                      <Info className="h-4 w-4" />
                      <span>Beräkningsgrund</span>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                      {calculationBasis(ctx, financeOpts)}
                    </div>
                  </div>
                ) : null}

                {/* Breakdown (when provided) */}
                {Array.isArray(ctx?.breakdown) && (ctx?.breakdown?.length ?? 0) > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2 mt-4">
                      <Calculator className="h-4 w-4" />
                      <span>Detaljerad uppdelning</span>
                    </div>
                    <div className="space-y-3">
                      {ctx?.breakdown?.map((r, i) => (
                        <div key={i} className="rounded-lg border bg-background p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-sm">
                              <div className="font-medium">{r.label}</div>
                              {r.note && <div className="text-xs text-muted-foreground mt-0.5">{r.note}</div>}
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{typeof r.value === "number" ? `${r.value.toLocaleString("sv-SE")} ${ctx?.unit ?? ""}`.trim() : r.value}</div>
                            </div>
                          </div>
                          <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${typeof ctx?.value === "number" && ctx?.value > 0 ? Math.min(100, (r.value / (ctx.value as number)) * 100) : 0}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Comparison table */}
                {Array.isArray(ctx?.valuesAcross) && (ctx?.valuesAcross?.length ?? 0) > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <TrendingUp className="h-4 w-4" />
                        <span>Jämförelse med andra fastigheter</span>
                      </div>
                    </div>
                    <div className="rounded-xl border overflow-hidden">
                      <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 text-xs text-muted-foreground bg-muted/40">
                        <div>Fastighet</div>
                        <div>Värde</div>
                        <div>Diff</div>
                      </div>
                      <div className="divide-y">
                        {ctx.valuesAcross
                          ?.filter(v => v.id !== ctx.acc.id && v.value != null)
                          .map(v => ({ ...v, diff: (v.value as number) - (typeof ctx?.value === "number" ? (ctx.value as number) : 0) }))
                          .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))
                          .slice(0, 5)
                          .map(v => (
                            <div key={v.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2">
                              <div className="min-w-0 flex items-center gap-2">
                                <Home className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate text-sm">{v.title ?? "Bostad"}</span>
                              </div>
                              <div className="text-sm font-medium">{v.value != null ? `${(v.value as number).toLocaleString("sv-SE")} ${ctx?.unit ?? ""}`.trim() : "—"}</div>
                              <div className={`inline-flex items-center gap-1 text-sm font-medium`}>
                                {(v.diff ?? 0) <= 0 ? (
                                  <ArrowDownRight className="h-4 w-4 stroke-chart-2" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4 stroke-chart-5" />
                                )}
                                <span className={(v.diff ?? 0) <= 0 ? "stroke-chart-2 text-chart-2" : "stroke-chart-5 text-chart-5"}>{`${v.diff! > 0 ? "+" : ""}${(v.diff ?? 0).toLocaleString("sv-SE")} ${ctx?.unit ?? ""}`.trim()}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// Simple media query hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(query);
    const handler = () => setMatches(m.matches);
    handler();
    if (m.addEventListener) m.addEventListener("change", handler);
    else m.addListener(handler);
    return () => {
      if (m.removeEventListener) m.removeEventListener("change", handler);
      else m.removeListener(handler);
    };
  }, [query]);
  return matches;
}

