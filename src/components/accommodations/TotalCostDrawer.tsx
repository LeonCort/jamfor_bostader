"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { X, Calculator, Info, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Home } from "lucide-react";
import type { Accommodation } from "@/lib/accommodations";
import { useAccommodations } from "@/lib/accommodations";

function formatSek(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr";
}

export default function TotalCostDrawer({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Accommodation;
}) {
  const title = item.title || "Bostad";
  const total = item.totalMonthlyCost ?? undefined;
  const hyra = item.hyra ?? 0;
  const driftPerManad = item.driftkostnader ? Math.round(item.driftkostnader / 12) : 0;
  const amort = item.amorteringPerManad ?? 0;
  const ranta = item.rantaPerManad ?? 0;
  const maintenanceUnknown = item.maintenanceUnknown;

  const rows: Array<{ label: string; value: number; note?: string }> = [
    { label: "Avgift / hyra", value: hyra },
    { label: "Drift (per månad)", value: driftPerManad, note: maintenanceUnknown ? "uppskattad 0 kr (okänt)" : undefined },
    { label: "Ränta", value: ranta },
    { label: "Amortering", value: amort },
  ];

  const isMd = useMediaQuery("(min-width: 768px)");

  // Comparison dataset
  const { accommodations } = useAccommodations();
  const comparisons = React.useMemo(() => {
    const others = (accommodations || []).filter(a => a.id !== item.id && a.totalMonthlyCost != null);
    const enriched = others.map(a => ({
      a,
      total: a.totalMonthlyCost as number,
      diff: (a.totalMonthlyCost as number) - (total ?? 0)
    }));
    // sort by closeness to current item's total
    enriched.sort((x, y) => Math.abs(x.diff) - Math.abs(y.diff));
    return enriched.slice(0, 4);
  }, [accommodations, item.id, total]);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={isMd ? "right" : "bottom"}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-background/80" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 h-[86vh] rounded-t-2xl border border-border bg-card text-foreground shadow-2xl md:left-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:w-[520px] md:rounded-t-none md:rounded-l-2xl">
          <div className="mx-auto max-w-screen-md flex h-full flex-col">
            {!isMd && <Drawer.Handle className="mx-auto mt-2 mb-3 h-1.5 w-10 rounded-full bg-border" />}

            <div className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div>
                <div className="text-sm text-muted-foreground">Månadskostnad</div>
                <div className="font-medium text-foreground">{title}</div>
              </div>
              <button className="-m-1 rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Stäng" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="px-4 py-5 space-y-6">
                {/* Main total */}
                <div className="rounded-xl border bg-muted/40 p-6 text-center">
                  <div className="text-3xl font-bold mb-1">{total != null ? total.toLocaleString("sv-SE") : "—"}</div>
                  <div className="text-sm text-muted-foreground">kr/mån</div>
                </div>

                {/* Calculation basis */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                    <Info className="h-4 w-4" />
                    <span>Beräkningsgrund</span>
                  </div>
                  <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Denna beräkning inkluderar avgift/hyra, drift (12-delad), ränta och amortering. Värden är uppskattningar för jämförelse och kan avvika.
                  </div>
                </div>

                {/* Breakdown */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold mb-3">
                    <Calculator className="h-4 w-4" />
                    <span>Detaljerad uppdelning</span>
                  </div>
                  <div className="space-y-3">
                    {rows.map((r, i) => (
                      <div key={i} className="rounded-lg border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm">
                            <div className="font-medium">{r.label}</div>
                            {r.note && <div className="text-xs text-muted-foreground mt-0.5">{r.note}</div>}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatSek(r.value)}</div>
                          </div>
                        </div>
                        <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-primary" style={{ width: `${total && total>0 ? Math.min(100, (r.value/(total))*100) : 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comparison section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <TrendingUp className="h-4 w-4" />
                      <span>Jämförelse med andra fastigheter</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Mockdata</div>
                  </div>
                  <div className="rounded-xl border overflow-hidden">
                    <div className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 text-xs text-muted-foreground bg-muted/40">
                      <div>Fastighet</div>
                      <div>Kostnad</div>
                      <div>Diff</div>
                    </div>
                    <div className="divide-y">
                      {comparisons.map(({ a, total: t, diff }) => (
                        <div key={a.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2">
                          <div className="min-w-0 flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate text-sm">{a.title}</span>
                          </div>
                          <div className="text-sm font-medium">{t.toLocaleString("sv-SE")} kr/mån</div>
                          <div className={"inline-flex items-center gap-1 text-sm font-medium " + (diff <= 0 ? "text-emerald-500" : "text-red-500") }>
                            {diff <= 0 ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                            <span>{(diff>0?"+":"") + diff.toLocaleString("sv-SE")} kr/mån</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// Simple media query hook (copied from TransitDrawer)
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

