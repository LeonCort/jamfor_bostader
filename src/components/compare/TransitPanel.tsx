"use client";

import * as React from "react";
import { Clock, Award, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { TransitDrawerContext } from "@/components/route/TransitDrawer";
import { bestValue, deltaVariant } from "@/lib/compareMetrics";


const toneClass = (tone: "good" | "bad" | "neutral") =>
  tone === "good" ? "stroke-chart-2" : tone === "bad" ? "stroke-chart-5" : "stroke-muted-foreground";

export type TransitPanelProps = {
  columns: any[];
  current: any | null;
  places: any[];
  gridTemplate: string;
  mobileTemplate: string;
  openTransit: (ctx: TransitDrawerContext) => void;
  commuteForTwo: (accId: string) => Record<string, { to?: number; from?: number }>;
};

export default function TransitPanel({ columns, current, places, gridTemplate, mobileTemplate, openTransit, commuteForTwo }: TransitPanelProps) {
  const isSm = useMediaQuery("(min-width: 640px)");
  if (!places?.length) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">Inga viktiga platser ännu.</div>;
  }

  return (
    <div>
      {places.map((p: any) => (
        <div key={p.id}>
          {/* Mobile rows */}
          {!isSm && (
            <div>
              {/* To place */}
              <div className="px-4 pt-3 text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5" /><span>Till {p.label || "Plats"}</span> <span className="text-[11px] text-muted-foreground/80">min</span></div>
              <div className="px-4 text-[11px] text-muted-foreground/80">Anländ senast {p.arriveBy ?? "—"}</div>
              <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                {columns.map((a: any) => {
                  const accTimes = commuteForTwo(a.id);
                  const currTimes = current ? commuteForTwo((current as any).id) : ({} as Record<string, { to?: number; from?: number }>);
                  const aMin = accTimes[p.id]?.to;
                  const cMin = current ? currTimes[p.id]?.to : undefined;
                  const d = a.kind !== "current" && cMin != null && aMin != null ? (aMin - cMin) : null;
                  const tone = deltaVariant(d as any, false);
                  return (
                    <div key={a.id + p.id + "to"} className="px-4 py-4 cursor-pointer hover:bg-muted/40 rounded-md transition-colors" onClick={() => openTransit({ origin: a.address ?? a.title, destination: p.address ?? p.label, arriveBy: p.arriveBy, direction: "to" })}>
                      <div className="group">
                        <MobileLabel label={`Till ${p.label || "Plats"}`} unit="min" />
                        <div className="flex items-center gap-1 leading-none">
                          <div className="text-xl font-bold">{aMin != null ? `${aMin} min` : "—"}</div>
                          {(() => {
                            const best = bestValue(columns.map((c: any) => commuteForTwo(c.id)[p.id]?.to), /* goodWhenHigher= */ false);
                            const isBest = aMin != null && best != null && aMin === best;
                            if (isBest) return <Award className="h-3.5 w-3.5 stroke-chart-2" />;
                            if (a.kind === "current" || d == null || d === 0) return null;
                            const up = d > 0;
                            const Icon = up ? ArrowUpRight : ArrowDownRight;
                            return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* From place */}
              <div className="px-4 pt-4 text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5" /><span>Från {p.label || "Plats"}</span> <span className="text-[11px] text-muted-foreground/80">min</span></div>
              <div className="px-4 text-[11px] text-muted-foreground/80">Lämna vid {p.leaveAt ?? "—"}</div>
              <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                {columns.map((a: any) => {
                  const accTimes = commuteForTwo(a.id);
                  const currTimes = current ? commuteForTwo((current as any).id) : ({} as Record<string, { to?: number; from?: number }>);
                  const aMin = accTimes[p.id]?.from;
                  const cMin = current ? currTimes[p.id]?.from : undefined;
                  const d = a.kind !== "current" && cMin != null && aMin != null ? (aMin - cMin) : null;
                  const tone = deltaVariant(d as any, false);
                  return (
                    <div key={a.id + p.id + "from"} className="px-4 py-4 cursor-pointer hover:bg-muted/40 rounded-md transition-colors" onClick={() => openTransit({ origin: p.address ?? p.label, destination: a.address ?? a.title, leaveAt: p.leaveAt, direction: "from" })}>
                      <div className="group">
                        <MobileLabel label={`Från ${p.label || "Plats"}`} unit="min" />
                        <div className="flex items-center gap-1 leading-none">
                          <div className="text-xl font-bold">{aMin != null ? `${aMin} min` : "—"}</div>
                          {(() => {
                            const best = bestValue(columns.map((c: any) => commuteForTwo(c.id)[p.id]?.from), /* goodWhenHigher= */ false);
                            const isBest = aMin != null && best != null && aMin === best;
                            if (isBest) return <Award className="h-3.5 w-3.5 stroke-chart-2" />;
                            if (a.kind === "current" || d == null || d === 0) return null;
                            const up = d > 0;
                            const Icon = up ? ArrowUpRight : ArrowDownRight;
                            return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Desktop rows: To and From */}
          {isSm && (
            <div>
              {/* To place */}
              <div className="min-w-[720px] grid hover:bg-muted/20 transition-colors" style={{ gridTemplateColumns: gridTemplate }}>
                <div className="px-4 py-4 text-sm text-foreground/80 sticky left-0 z-20 bg-card shadow-[8px_0_8px_-8px_rgba(0,0,0,0.2)]">
                  <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /><span>Till {p.label || "Plats"}</span></div>
                  <div className="text-[11px] text-muted-foreground/80 mt-1">min • Anländ senast {p.arriveBy ?? "—"}</div>
                </div>
                {columns.map((a: any) => {
                  const accTimes = commuteForTwo(a.id);
                  const currTimes = current ? commuteForTwo((current as any).id) : ({} as Record<string, { to?: number; from?: number }>);
                  const aMin = accTimes[p.id]?.to;
                  const cMin = current ? currTimes[p.id]?.to : undefined;
                  const d = a.kind !== "current" && cMin != null && aMin != null ? (aMin - cMin) : null;
                  const tone = deltaVariant(d as any, false);
                  return (
                    <div key={a.id + p.id + "to-desktop"} className="px-4 py-4 cursor-pointer hover:bg-muted/40 rounded-md transition-colors" onClick={() => openTransit({ origin: a.address ?? a.title, destination: p.address ?? p.label, arriveBy: p.arriveBy, direction: "to" })}>
                      <div className="group">
                        <div className="flex items-center gap-1 leading-none">
                          <div className="text-xl font-bold">{aMin != null ? `${aMin} min` : "—"}</div>
                          {(() => {
                            const best = bestValue(columns.map((c: any) => commuteForTwo(c.id)[p.id]?.to), /* goodWhenHigher= */ false);
                            const isBest = aMin != null && best != null && aMin === best;
                            if (isBest) return <Award className="h-4 w-4 stroke-chart-2" />;
                            if (a.kind === "current" || d == null || d === 0) return null;
                            const up = d > 0;
                            const Icon = up ? ArrowUpRight : ArrowDownRight;
                            return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* From place */}
              <div className="min-w-[720px] grid hover:bg-muted/20 transition-colors" style={{ gridTemplateColumns: gridTemplate }}>
                <div className="px-4 py-4 text-sm text-foreground/80 sticky left-0 z-20 bg-card shadow-[8px_0_8px_-8px_rgba(0,0,0,0.2)]">
                  <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /><span>Från {p.label || "Plats"}</span></div>
                  <div className="text-[11px] text-muted-foreground/80 mt-1">min • Lämna vid {p.leaveAt ?? "—"}</div>
                </div>
                {columns.map((a: any) => {
                  const accTimes = commuteForTwo(a.id);
                  const currTimes = current ? commuteForTwo((current as any).id) : ({} as Record<string, { to?: number; from?: number }>);
                  const aMin = accTimes[p.id]?.from;
                  const cMin = current ? currTimes[p.id]?.from : undefined;
                  const d = a.kind !== "current" && cMin != null && aMin != null ? (aMin - cMin) : null;
                  const tone = deltaVariant(d as any, false);
                  return (
                    <div key={a.id + p.id + "from-desktop"} className="px-4 py-4 cursor-pointer hover:bg-muted/40 rounded-md transition-colors" onClick={() => openTransit({ origin: p.address ?? p.label, destination: a.address ?? a.title, leaveAt: p.leaveAt, direction: "from" })}>
                      <div className="group">
                        <div className="flex items-center gap-1 leading-none">
                          <div className="text-xl font-bold">{aMin != null ? `${aMin} min` : "—"}</div>
                          {(() => {
                            const best = bestValue(columns.map((c: any) => commuteForTwo(c.id)[p.id]?.from), /* goodWhenHigher= */ false);
                            const isBest = aMin != null && best != null && aMin === best;
                            if (isBest) return <Award className="h-4 w-4 stroke-chart-2" />;
                            if (a.kind === "current" || d == null || d === 0) return null;
                            const up = d > 0;
                            const Icon = up ? ArrowUpRight : ArrowDownRight;
                            return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                          })()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


// Local media query hook for responsive switching inside this panel
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(query);
    const handler = () => setMatches(m.matches);
    handler();
    if ((m as any).addEventListener) m.addEventListener("change", handler);
    else (m as any).addListener(handler);
    return () => {
      if ((m as any).removeEventListener) m.removeEventListener("change", handler);
      else (m as any).removeListener(handler);
    };
  }, [query]);
  return matches;
}



// Tiny mobile label helper (keeps mobile cells consistent with compare page)
function MobileLabel({ label, unit, className }: { label: string; unit?: string; className?: string }) {
  return (
    <div className={(className ? className + " " : "") + "text-xs text-muted-foreground mb-1"}>
      {label} {unit ? <span className="text-[11px] text-muted-foreground/80">{unit}</span> : null}
    </div>
  );
}
