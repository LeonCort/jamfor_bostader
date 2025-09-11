"use client";

import { useMemo, useState } from "react";
import { useAccommodations } from "@/lib/accommodations";
import { KeyValueGroup, KeyValueRow } from "@/components/ui/key-value";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { CircleDollarSign, Ruler, BedDouble, Square, Clock, Award, ArrowUpRight, ArrowDownRight, Asterisk } from "lucide-react";
import TransitDrawer, { TransitDrawerContext } from "@/components/route/TransitDrawer";

function formatSek(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr";
}
function formatMinutes(n?: number) {
  if (n == null) return "—";
  return `${n} min`;
}
function formatDelta<T extends number>(delta: T | null | undefined, fmt: (n: number) => string) {
  if (delta == null) return null;
  if (delta === 0) return "±0";
  const sign = delta > 0 ? "+" : "";
  return `${sign}${fmt(Math.abs(delta))}`;
}
function deltaVariant(delta: number | null | undefined, goodWhenHigher: boolean): "good" | "bad" | "neutral" {
  if (delta == null || delta === 0) return "neutral";
  const favorable = goodWhenHigher ? delta > 0 : delta < 0;
  return favorable ? "good" : "bad";
}

function bestValue(values: Array<number | undefined>, goodWhenHigher: boolean): number | undefined {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length === 0) return undefined;
  return goodWhenHigher ? Math.max(...nums) : Math.min(...nums);
}

export default function ComparePage() {
  const { accommodations, current, places, commuteForTwo } = useAccommodations();

  const columns = useMemo(() => {
    const list = [...accommodations];
    list.sort((a, b) => (a.kind === "current" ? -1 : b.kind === "current" ? 1 : 0));
    return list;
  }, [accommodations]);
  const gridTemplate = useMemo(() => `minmax(200px,1fr) repeat(${columns.length}, minmax(180px,1fr))`, [columns.length]);
  const mobileTemplate = useMemo(() => `repeat(${columns.length}, minmax(160px,1fr))`, [columns.length]);
  const toneClass = (tone: "good" | "bad" | "neutral") =>
    tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-red-600" : "text-muted-foreground";

  const bestMonthlyCost = useMemo(() => bestValue(columns.map(c => c.totalMonthlyCost), /* goodWhenHigher= */ false), [columns]);
  const [transitOpen, setTransitOpen] = useState(false);
  const [transitCtx, setTransitCtx] = useState<TransitDrawerContext | null>(null);
  function openTransit(ctx: TransitDrawerContext) { setTransitCtx(ctx); setTransitOpen(true); }


  if (!columns.length) {
    return (
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">Jämför</h1>
        <p className="mt-2 text-muted-foreground">Lägg till bostäder på översiktsvyn för att jämföra dem här.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 space-y-6">

      {/* Comparison sections */}



      <div className="rounded-xl border bg-card">
        {/* Sticky header inside card (desktop) */}
        <div className="hidden sm:block sticky top-14 z-30 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70 border-b border-border">
          <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="px-4 py-3 text-xs text-muted-foreground">&nbsp;</div>
            {columns.map((a) => (
              <div key={a.id} className="px-4 py-3">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="cursor-default">
                      {a.imageUrl ? (
                        <img src={a.imageUrl} alt={a.title} className="h-16 w-full object-cover rounded-md mb-2" />
                      ) : (
                        <div className="h-16 w-full bg-muted rounded-md mb-2" />
                      )}
                      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{a.kind === "current" ? "Nuvarande" : "Potentiell"}</div>
                      <div className="font-medium leading-tight line-clamp-2">{a.title}</div>
                      {a.address ? <div className="text-xs text-muted-foreground line-clamp-1">{a.address}</div> : null}
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent align="center" className="w-72">
                    <div>
                      {a.imageUrl ? (
                        <img src={a.imageUrl} alt={a.title} className="h-28 w-full object-cover rounded mb-3" />
                      ) : null}
                      <div className="font-semibold leading-tight">{a.title}</div>
                      {a.address ? <div className="text-xs text-muted-foreground mb-3">{a.address}</div> : null}
                      <KeyValueGroup>
                        <KeyValueRow icon={<CircleDollarSign className="h-3.5 w-3.5" />} label="Kostnad" value={<>{formatSek(a.totalMonthlyCost)}{a.totalMonthlyCost != null && " / mån"}</>} />
                        <KeyValueRow icon={<Ruler className="h-3.5 w-3.5" />} label="Storlek" value={<>{a.boarea ?? "—"} m²</>} />
                        <KeyValueRow icon={<BedDouble className="h-3.5 w-3.5" />} label="Rum" value={a.antalRum ?? "—"} />
                        {a.tomtarea != null ? (
                          <KeyValueRow icon={<Square className="h-3.5 w-3.5" />} label="Tomtareal" value={<>{a.tomtarea} m²</>} />
                        ) : null}
                      </KeyValueGroup>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            ))}
          </div>
        </div>

        {/* Overall */}
        <section>
          <div className="px-4 pt-4 pb-2 text-sm font-medium text-foreground">Övergripande</div>
          <div>
            {/* Mobile: header + row label on top, horizontal columns */}
            <div className="sm:hidden">
              <div className="grid border-b" style={{ gridTemplateColumns: mobileTemplate }}>
                {columns.map((a) => (
                  <div key={a.id} className="px-4 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {a.title}
                  </div>
                ))}
              </div>
              <div className="px-4 pt-3 text-xs text-muted-foreground">Månadskostnad <span className="text-[11px] text-muted-foreground/80">kr/mån</span></div>
              <div className="overflow-x-auto">
                <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                  {columns.map((a) => {
                    const delta = current && a.totalMonthlyCost != null && current.totalMonthlyCost != null ? a.totalMonthlyCost - current.totalMonthlyCost : null;
                    const tone = deltaVariant(delta as any, false);
                    return (
                      <div key={a.id} className="px-4 py-4">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="group">
                              <div className="flex items-center gap-1 leading-none">
                                <div className="text-3xl font-extrabold inline-flex items-center gap-1">
                                  {a.totalMonthlyCost != null ? a.totalMonthlyCost.toLocaleString("sv-SE") : "—"}
                                  {a.maintenanceUnknown ? (
                                    <span title="Driftkostnad saknas - total manadskostnad exkluderar drift">
                                      <Asterisk className="h-3 w-3 text-muted-foreground" />
                                    </span>
                                  ) : null}
                                </div>
                                {(() => {
                                  const val = a.totalMonthlyCost;
                                  const isBest = val != null && bestMonthlyCost != null && val === bestMonthlyCost;
                                  if (isBest) return <Award className="h-3.5 w-3.5 text-emerald-600" />;
                                  if (a.kind === "current" || !delta || delta === 0) return null;
                                  const up = delta > 0;
                                  const Icon = up ? ArrowUpRight : ArrowDownRight;
                                  return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                                })()}
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="text-sm">
                            {a.kind !== "current" && delta != null && delta !== 0 ? formatDelta(delta as any, (n) => `${n.toLocaleString("sv-SE")} kr/mån`) : "Nuvarande"}
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Utropspris (mobile) */}
              <div className="px-4 pt-6 text-xs text-muted-foreground">Utropspris <span className="text-[11px] text-muted-foreground/80">kr</span></div>
              <div className="overflow-x-auto">
                <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                  {columns.map((a) => {
                    const base = current ? (current.kind === "current" ? current.currentValuation : (current as any).begartPris) : undefined;
                    const val = a.kind === "current" ? a.currentValuation : (a as any).begartPris;
                    const delta = base != null && val != null ? val - base : null;
                    const tone = deltaVariant(delta as any, false);
                    return (
                      <div key={a.id + "utp"} className="px-4 py-4">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="group">
                              <div className="flex items-center gap-1 leading-none">
                                <div className="text-2xl font-semibold">{val != null ? val.toLocaleString("sv-SE") : "—"}</div>
                                {(() => {
                                  const best = bestValue(columns.map((c) => c.kind === "current" ? c.currentValuation : (c as any).begartPris), /* goodWhenHigher= */ false);
                                  const isBest = val != null && best != null && val === best;
                                  if (isBest) return <Award className="h-3.5 w-3.5 text-emerald-600" />;
                                  if (a.kind === "current" || !delta || delta === 0) return null;
                                  const up = (delta as number) > 0;
                                  const Icon = up ? ArrowUpRight : ArrowDownRight;
                                  return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                                })()}
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="text-sm">
                            {a.kind !== "current" && delta != null && delta !== 0 ? formatDelta(delta as any, (n) => `${n.toLocaleString("sv-SE")} kr`) : "Nuvarande"}
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kontantinsats (mobile) */}
              <div className="px-4 pt-6 text-xs text-muted-foreground">Kontantinsats <span className="text-[11px] text-muted-foreground/80">(15%)</span> <span className="text-[11px] text-muted-foreground/80">kr</span></div>
              <div className="overflow-x-auto">
                <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                  {columns.map((a) => {
                    const base = (() => {
                      if (!current) return undefined;
                      if (current.kind === "current") {
                        const loans = (((current.metrics as any)?.mortgage?.loans) ?? []) as { principal: number }[];
                        const debt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
                        const v = current.currentValuation ?? 0;
                        return v > 0 ? v - debt : undefined;
                      } else {
                        const ki = (current as any).kontantinsats as number | undefined;
                        if (ki != null) return ki;
                        const bp = (current as any).begartPris as number | undefined;
                        return bp != null ? Math.round(bp * 0.15) : undefined;
                      }
                    })();
                    const val = (() => {
                      if (a.kind === "current") {
                        const loans = (((a.metrics as any)?.mortgage?.loans) ?? []) as { principal: number }[];
                        const debt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
                        const v = a.currentValuation ?? 0;
                        return v > 0 ? v - debt : undefined;
                      } else {
                        const ki = (a as any).kontantinsats as number | undefined;
                        if (ki != null) return ki;
                        const bp = (a as any).begartPris as number | undefined;
                        return bp != null ? Math.round(bp * 0.15) : undefined;
                      }
                    })();
                    const delta = base != null && val != null ? (val - base) : null;
                    const tone = deltaVariant(delta as any, false);
                    return (
                      <div key={a.id + "ki"} className="px-4 py-4">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="group">
                              <div className="flex items-center gap-1 leading-none">
                                <div className="text-2xl font-semibold">{val != null ? val.toLocaleString("sv-SE") : "—"}</div>
                                {(() => {
                                  const best = bestValue(columns.map((c) => {
                                    if (c.kind === "current") {
                                      const loans = (((c.metrics as any)?.mortgage?.loans) ?? []) as { principal: number }[];
                                      const debt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
                                      const v = c.currentValuation ?? 0;
                                      return v > 0 ? v - debt : undefined;
                                    } else {
                                      const ki = (c as any).kontantinsats as number | undefined;
                                      if (ki != null) return ki;
                                      const bp = (c as any).begartPris as number | undefined;
                                      return bp != null ? Math.round(bp * 0.15) : undefined;
                                    }
                                  }), /* goodWhenHigher= */ false);
                                  const isBest = val != null && best != null && val === best;
                                  if (isBest) return <Award className="h-3.5 w-3.5 text-emerald-600" />;
                                  if (a.kind === "current" || !delta || delta === 0) return null;
                                  const up = (delta as number) > 0;
                                  const Icon = up ? ArrowUpRight : ArrowDownRight;
                                  return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                                })()}
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="text-sm">
                            {a.kind !== "current" && delta != null && delta !== 0 ? formatDelta(delta as any, (n) => `${n.toLocaleString("sv-SE")} kr`) : "Nuvarande"}
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Desktop: label column on the left */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[720px]">

                <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
                  <div className="px-4 py-5 text-sm text-foreground/80"><div>Månadskostnad</div><div className="text-[11px] text-muted-foreground/80 mt-1">kr/mån</div></div>
                  {columns.map((a) => {
                    const delta = current && a.totalMonthlyCost != null && current.totalMonthlyCost != null ? a.totalMonthlyCost - current.totalMonthlyCost : null;
                    const tone = deltaVariant(delta as any, false);
                    return (
                      <div key={a.id} className="px-4 py-4">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="group">
                              <div className="flex items-center gap-1 leading-none">
                                <div className="text-3xl font-extrabold inline-flex items-center gap-1">
                                  {a.totalMonthlyCost != null ? a.totalMonthlyCost.toLocaleString("sv-SE") : "—"}
                                  {a.maintenanceUnknown ? (
                                    <span title="Driftkostnad saknas - total manadskostnad exkluderar drift">
                                      <Asterisk className="h-4 w-4 text-muted-foreground" />
                                    </span>
                                  ) : null}
                                </div>
                                {(() => {
                                  const val = a.totalMonthlyCost;
                                  const isBest = val != null && bestMonthlyCost != null && val === bestMonthlyCost;
                                  if (isBest) return <Award className="h-4 w-4 text-emerald-600" />;
                                  if (a.kind === "current" || !delta || delta === 0) return null;
                                  const up = delta > 0;
                                  const Icon = up ? ArrowUpRight : ArrowDownRight;
                                  return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                                })()}
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="text-sm">
                            {a.kind !== "current" && delta != null && delta !== 0 ? formatDelta(delta as any, (n) => `${n.toLocaleString("sv-SE")} kr/mån`) : "Nuvarande"}
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    );
                  })}
                </div>

                {/* Utropspris (desktop) */}
                <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
                  <div className="px-4 py-5 text-sm text-foreground/80"><div>Utropspris</div><div className="text-[11px] text-muted-foreground/80 mt-1">kr</div></div>
                  {columns.map((a) => {
                    const base = current ? (current.kind === "current" ? current.currentValuation : (current as any).begartPris) : undefined;
                    const val = a.kind === "current" ? a.currentValuation : (a as any).begartPris;
                    const delta = base != null && val != null ? val - base : null;
                    const tone = deltaVariant(delta as any, false);
                    return (
                      <div key={a.id + "utp-desktop"} className="px-4 py-4">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="group">
                              <div className="flex items-center gap-1 leading-none">
                                <div className="text-3xl font-bold">{val != null ? val.toLocaleString("sv-SE") : "\u2014"}</div>
                                {(() => {
                                  const best = bestValue(columns.map((c) => c.kind === "current" ? c.currentValuation : (c as any).begartPris), /* goodWhenHigher= */ false);
                                  const isBest = val != null && best != null && val === best;
                                  if (isBest) return <Award className="h-4 w-4 text-emerald-600" />;
                                  if (a.kind === "current" || !delta || delta === 0) return null;
                                  const up = (delta as number) > 0;
                                  const Icon = up ? ArrowUpRight : ArrowDownRight;
                                  return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                                })()}
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="text-sm">
                            {a.kind !== "current" && delta != null && delta !== 0 ? formatDelta(delta as any, (n) => `${n.toLocaleString("sv-SE")} kr`) : "Nuvarande"}
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    );
                  })}
                </div>

                {/* Kontantinsats (desktop) */}
                <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
                  <div className="px-4 py-5 text-sm text-foreground/80"><div>Kontantinsats <span className="text-muted-foreground/80">(15%)</span></div><div className="text-[11px] text-muted-foreground/80 mt-1">kr</div></div>
                  {columns.map((a) => {
                    const base = (() => {
                      if (!current) return undefined;
                      if (current.kind === "current") {
                        const loans = (((current.metrics as any)?.mortgage?.loans) ?? []) as { principal: number }[];
                        const debt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
                        const v = current.currentValuation ?? 0;
                        return v > 0 ? v - debt : undefined;
                      } else {
                        const ki = (current as any).kontantinsats as number | undefined;
                        if (ki != null) return ki;
                        const bp = (current as any).begartPris as number | undefined;
                        return bp != null ? Math.round(bp * 0.15) : undefined;
                      }
                    })();
                    const val = (() => {
                      if (a.kind === "current") {
                        const loans = (((a.metrics as any)?.mortgage?.loans) ?? []) as { principal: number }[];
                        const debt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
                        const v = a.currentValuation ?? 0;
                        return v > 0 ? v - debt : undefined;
                      } else {
                        const ki = (a as any).kontantinsats as number | undefined;
                        if (ki != null) return ki;
                        const bp = (a as any).begartPris as number | undefined;
                        return bp != null ? Math.round(bp * 0.15) : undefined;
                      }
                    })();
                    const delta = base != null && val != null ? (val - base) : null;
                    const tone = deltaVariant(delta as any, false);
                    return (
                      <div key={a.id + "ki-desktop"} className="px-4 py-4">
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="group">
                              <div className="flex items-center gap-1 leading-none">
                                <div className="text-3xl font-bold">{val != null ? val.toLocaleString("sv-SE") : "\u2014"}</div>
                                {(() => {
                                  const best = bestValue(columns.map((c) => {
                                    if (c.kind === "current") {
                                      const loans = (((c.metrics as any)?.mortgage?.loans) ?? []) as { principal: number }[];
                                      const debt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
                                      const v = c.currentValuation ?? 0;
                                      return v > 0 ? v - debt : undefined;
                                    } else {
                                      const ki = (c as any).kontantinsats as number | undefined;
                                      if (ki != null) return ki;
                                      const bp = (c as any).begartPris as number | undefined;
                                      return bp != null ? Math.round(bp * 0.15) : undefined;
                                    }
                                  }), /* goodWhenHigher= */ false);
                                  const isBest = val != null && best != null && val === best;
                                  if (isBest) return <Award className="h-4 w-4 text-emerald-600" />;
                                  if (a.kind === "current" || !delta || delta === 0) return null;
                                  const up = (delta as number) > 0;
                                  const Icon = up ? ArrowUpRight : ArrowDownRight;
                                  return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                                })()}
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="text-sm">
                            {a.kind !== "current" && delta != null && delta !== 0 ? formatDelta(delta as any, (n) => `${n.toLocaleString("sv-SE")} kr`) : "Nuvarande"}
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* House details */}
        <section>
          <div className="px-4 py-3 text-sm font-medium text-foreground border-t border-border">Husdetaljer</div>
          <div>
            {/* Mobile header */}
            <div className="sm:hidden grid border-b" style={{ gridTemplateColumns: mobileTemplate }}>
              {columns.map((a) => (
                <div key={a.id} className="px-4 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  {a.title}
                </div>
              ))}
            </div>

            {/* Desktop header */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[720px]">

              </div>
            </div>

            {/* Rows */}
            {[{ key: "boarea", label: "Bostadsyta", unit: "m²", good: true }, { key: "antalRum", label: "Antal rum", unit: "rum", good: true }, { key: "tomtarea", label: "Tomtareal", unit: "m²", good: true }].map((row) => (
              <div key={row.key}>
                {/* Mobile row */}
                <div className="sm:hidden">
                  <div className="px-4 pt-3 text-xs text-muted-foreground">{row.label} <span className="text-[11px] text-muted-foreground/80">{row.unit}</span></div>
                  <div className="overflow-x-auto">
                    <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                      {columns.map((a) => {
                        const base = (current as any)?.[row.key] as number | undefined;
                        const val = (a as any)[row.key] as number | undefined;
                        const delta = base != null && val != null ? val - base : null;
                        const tone = deltaVariant(delta as any, row.good);
                        return (
                          <div key={a.id + row.key} className="px-4 py-4">
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div className="group">
                                  <div className="flex items-center gap-1 leading-none">
                                    <div className="text-3xl font-bold">{val != null ? val : "—"}</div>
                                    {(() => {
                                      const best = bestValue(columns.map((c) => (c as any)[row.key] as number | undefined), row.good);
                                      const isBest = val != null && best != null && val === best;
                                      if (isBest) return <Award className="h-3.5 w-3.5 text-emerald-600" />;
                                      if (a.kind === "current" || !delta || delta === 0) return null;
                                      const up = (delta as number) > 0;
                                      const Icon = up ? ArrowUpRight : ArrowDownRight;
                                      return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                                    })()}
                                  </div>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent className="text-sm">
                                {a.kind !== "current" && delta != null && delta !== 0 ? formatDelta(delta as any, (n) => `${n}${row.unit ? " " + row.unit : ""}`) : "Nuvarande"}
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Desktop row */}
                <div className="hidden sm:block overflow-x-auto">
                  <div className="min-w-[720px] grid" style={{ gridTemplateColumns: gridTemplate }}>
                    <div className="px-4 py-4 text-sm text-foreground/80"><div>{row.label}</div><div className="text-[11px] text-muted-foreground/80 mt-1">{row.unit}</div></div>
                    {columns.map((a) => {
                      const base = (current as any)?.[row.key] as number | undefined;
                      const val = (a as any)[row.key] as number | undefined;
                      const delta = base != null && val != null ? val - base : null;
                      const tone = deltaVariant(delta as any, row.good);
                      return (
                        <div key={a.id + row.key} className="px-4 py-4">
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="group">
                                <div className="flex items-center gap-1 leading-none">
                                  <div className="text-3xl font-bold">{val != null ? val : "—"}</div>
                                  {(() => {
                                    const best = bestValue(columns.map((c) => (c as any)[row.key] as number | undefined), row.good);
                                    const isBest = val != null && best != null && val === best;
                                    if (isBest) return <Award className="h-4 w-4 text-emerald-600" />;
                                    if (a.kind === "current" || !delta || delta === 0) return null;
                                    const up = (delta as number) > 0;
                                    const Icon = up ? ArrowUpRight : ArrowDownRight;
                                    return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                                  })()}
                                </div>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="text-sm">
                              {a.kind !== "current" && delta != null && delta !== 0 ? formatDelta(delta as any, (n) => `${n}${row.unit ? " " + row.unit : ""}`) : "Nuvarande"}
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Costs */}
        <section>
          <div className="px-4 py-3 text-sm font-medium text-foreground border-t border-border">Kostnader</div>
          <div>
            {/* Mobile header */}
            <div className="sm:hidden grid border-b" style={{ gridTemplateColumns: mobileTemplate }}>
              {columns.map((a) => (
                <div key={a.id} className="px-4 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  {a.title}
                </div>
              ))}
            </div>

            {/* Desktop header */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[720px]">

              </div>
            </div>

            {[{ key: "hyra", label: "Hyra/avgift", unit: "kr/mån", fmt: (n: number) => `${n.toLocaleString("sv-SE")} kr/mån`, good: false }, { key: "driftkostnader", label: "Driftkostnad", unit: "kr/mån", fmt: (n: number) => `${Math.round(n / 12).toLocaleString("sv-SE")} kr/mån`, good: false }, { key: "amorteringPerManad", label: "Amortering", unit: "kr/mån", fmt: (n: number) => `${n.toLocaleString("sv-SE")} kr/mån`, good: false }, { key: "rantaPerManad", label: "Ränta", unit: "kr/mån", fmt: (n: number) => `${n.toLocaleString("sv-SE")} kr/mån`, good: false }].map((row) => (
              <div key={row.key}>
                {/* Mobile row */}
                <div className="sm:hidden">
                  <div className="px-4 pt-3 text-xs text-muted-foreground">{row.label} <span className="text-[11px] text-muted-foreground/80">{row.unit}</span></div>
                  <div className="overflow-x-auto">
                    <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                      {columns.map((a) => {
                        const base = (() => {
                          if (!current) return undefined;
                          if (row.key === "utropspris") return current.kind === "current" ? current.currentValuation : (current as any).begartPris;
                          if (row.key === "kontantinsats") {
                            if (current.kind === "current") {
                              const mortgage = (current.metrics as any)?.mortgage as { loans?: { principal: number }[] } | undefined;
                              const loans = mortgage?.loans ?? [];
                              const totalDebt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
                              const valuation = current.currentValuation ?? 0;
                              return valuation > 0 ? valuation - totalDebt : undefined;
                            } else {
                              const bp = (current as any).begartPris as number | undefined;
                              return bp != null ? Math.round(bp * 0.15) : undefined;
                            }
                          }
                          if (row.key === "driftkostnader") return (current as any)?.driftkostnader as number | undefined;
                          return (current as any)?.[row.key] as number | undefined;
                        })();
                        const raw = (() => {
                          if (row.key === "utropspris") return a.kind === "current" ? a.currentValuation : (a as any).begartPris;
                          if (row.key === "kontantinsats") {
                            if (a.kind === "current") {
                              const mortgage = (a.metrics as any)?.mortgage as { loans?: { principal: number }[] } | undefined;
                              const loans = mortgage?.loans ?? [];
                              const totalDebt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
                              const valuation = a.currentValuation ?? 0;
                              return valuation > 0 ? valuation - totalDebt : undefined;
                            } else {
                              const ki = (a as any).kontantinsats as number | undefined;
                              if (ki != null) return ki;
                              const bp = (a as any).begartPris as number | undefined;
                              return bp != null ? Math.round(bp * 0.15) : undefined;
                            }
                          }
                          return (a as any)[row.key] as number | undefined;
                        })();
                        const val = raw != null ? (row.key === "driftkostnader" ? (raw > 0 ? Math.round(raw / 12) : undefined) : raw) : undefined;
                        const baseAdj = base != null ? (row.key === "driftkostnader" ? (base > 0 ? Math.round(base / 12) : undefined) : base) : undefined;
                        const delta = baseAdj != null && val != null ? val - baseAdj : null;
                        const tone = deltaVariant(delta as any, false);
                        return (
                          <div key={a.id + row.key} className="px-4 py-4">
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div className="group">
                                  <div className="flex items-center gap-1 leading-none">
                                    <div className="text-2xl font-semibold">{val != null ? val.toLocaleString("sv-SE") : "—"}</div>
                                    {(() => {
                                      const best = bestValue(columns.map((c) => {
                                        const rawC = (() => {
                                          if (row.key === "utropspris") return c.kind === "current" ? c.currentValuation : (c as any).begartPris;
                                          if (row.key === "kontantinsats") {
                                            if (c.kind === "current") {
                                              const mortgage = (c.metrics as any)?.mortgage as { loans?: { principal: number }[] } | undefined;
                                              const loans = mortgage?.loans ?? [];
                                              const totalDebt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
                                              const valuation = c.currentValuation ?? 0;
                                              return valuation > 0 ? valuation - totalDebt : undefined;
                                            } else {
                                              const ki = (c as any).kontantinsats as number | undefined;
                                              if (ki != null) return ki;
                                              const bp = (c as any).begartPris as number | undefined;
                                              return bp != null ? Math.round(bp * 0.15) : undefined;
                                            }
                                          }
                                          return (c as any)[row.key] as number | undefined;
                                        })();
                                        return rawC != null ? (row.key === "driftkostnader" ? (rawC > 0 ? Math.round(rawC / 12) : undefined) : rawC) : undefined;
                                      }), /* goodWhenHigher= */ false);
                                      const isBest = val != null && best != null && val === best;
                                      if (isBest) return <Award className="h-3.5 w-3.5 text-emerald-600" />;
                                      if (a.kind === "current" || !delta || delta === 0) return null;
                                      const up = (delta as number) > 0;
                                      const Icon = up ? ArrowUpRight : ArrowDownRight;
                                      return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                                    })()}
                                  </div>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent className="text-sm">
                                {a.kind !== "current" && delta != null && delta !== 0 ? formatDelta(delta as any, (n) => `${n.toLocaleString("sv-SE")} ${row.unit ?? ""}`.trim()) : "Nuvarande"}
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Desktop row */}
                <div className="hidden sm:block overflow-x-auto">
                  <div className="min-w-[720px] grid" style={{ gridTemplateColumns: gridTemplate }}>
                    <div className="px-4 py-4 text-sm text-foreground/80"><div>{row.label}</div><div className="text-[11px] text-muted-foreground/80 mt-1">{row.unit}</div></div>
                    {columns.map((a) => {
                      const base = (() => {
                        if (!current) return undefined;
                        if (row.key === "utropspris") return current.kind === "current" ? current.currentValuation : (current as any).begartPris;
                        if (row.key === "kontantinsats") {
                          if (current.kind === "current") {
                            const mortgage = (current.metrics as any)?.mortgage as { loans?: { principal: number }[] } | undefined;
                            const loans = mortgage?.loans ?? [];
                            const totalDebt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
                            const valuation = current.currentValuation ?? 0;
                            return valuation > 0 ? valuation - totalDebt : undefined;
                          } else {
                            const bp = (current as any).begartPris as number | undefined;
                            return bp != null ? Math.round(bp * 0.15) : undefined;
                          }
                        }
                        if (row.key === "driftkostnader") return (current as any)?.driftkostnader as number | undefined;
                        return (current as any)?.[row.key] as number | undefined;
                      })();
                      const raw = (() => {
                        if (row.key === "utropspris") return a.kind === "current" ? a.currentValuation : (a as any).begartPris;
                        if (row.key === "kontantinsats") {
                          if (a.kind === "current") {
                            const mortgage = (a.metrics as any)?.mortgage as { loans?: { principal: number }[] } | undefined;
                            const loans = mortgage?.loans ?? [];
                            const totalDebt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
                            const valuation = a.currentValuation ?? 0;
                            return valuation > 0 ? valuation - totalDebt : undefined;
                          } else {
                            const ki = (a as any).kontantinsats as number | undefined;
                            if (ki != null) return ki;
                            const bp = (a as any).begartPris as number | undefined;
                            return bp != null ? Math.round(bp * 0.15) : undefined;
                          }
                        }
                        return (a as any)[row.key] as number | undefined;
                      })();
                      const val = raw != null ? (row.key === "driftkostnader" ? (raw > 0 ? Math.round(raw / 12) : undefined) : raw) : undefined;
                      const baseAdj = base != null ? (row.key === "driftkostnader" ? (base > 0 ? Math.round(base / 12) : undefined) : base) : undefined;
                      const delta = baseAdj != null && val != null ? val - baseAdj : null;
                      const tone = deltaVariant(delta as any, false);
                      return (
                        <div key={a.id + row.key} className="px-4 py-4">
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <div className="group">
                                <div className="flex items-center gap-1 leading-none">
                                  <div className="text-2xl font-semibold">{val != null ? val.toLocaleString("sv-SE") : "—"}</div>
                                  {(() => {
                                    const best = bestValue(columns.map((c) => {
                                      const rawC = (() => {
                                        if (row.key === "utropspris") return c.kind === "current" ? c.currentValuation : (c as any).begartPris;
                                        if (row.key === "kontantinsats") {
                                          if (c.kind === "current") {
                                            const mortgage = (c.metrics as any)?.mortgage as { loans?: { principal: number }[] } | undefined;
                                            const loans = mortgage?.loans ?? [];
                                            const totalDebt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
                                            const valuation = c.currentValuation ?? 0;
                                            return valuation > 0 ? valuation - totalDebt : undefined;
                                          } else {
                                            const ki = (c as any).kontantinsats as number | undefined;
                                            if (ki != null) return ki;
                                            const bp = (c as any).begartPris as number | undefined;
                                            return bp != null ? Math.round(bp * 0.15) : undefined;
                                          }
                                        }
                                        return (c as any)[row.key] as number | undefined;
                                      })();
                                      return rawC != null ? (row.key === "driftkostnader" ? (rawC > 0 ? Math.round(rawC / 12) : undefined) : rawC) : undefined;
                                    }), /* goodWhenHigher= */ false);
                                    const isBest = val != null && best != null && val === best;
                                    if (isBest) return <Award className="h-4 w-4 text-emerald-600" />;
                                    if (a.kind === "current" || !delta || delta === 0) return null;
                                    const up = (delta as number) > 0;
                                    const Icon = up ? ArrowUpRight : ArrowDownRight;
                                    return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                                  })()}
                                </div>
                              </div>
                            </HoverCardTrigger>
                            <HoverCardContent className="text-sm">
                              {a.kind !== "current" && delta != null && delta !== 0 ? formatDelta(delta as any, (n) => `${n.toLocaleString("sv-SE")} ${row.unit ?? ""}`.trim()) : "Nuvarande"}
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Transit */}
        <section>
          <div className="px-4 py-3 text-sm font-medium text-foreground border-t border-border">Pendling</div>
          <div>
            {/* Mobile header */}
            <div className="sm:hidden grid border-b" style={{ gridTemplateColumns: mobileTemplate }}>
              {columns.map((a) => (
                <div key={a.id} className="px-4 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  {a.title}
                </div>
              ))}
            </div>

            {/* Desktop header */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[720px]">

              </div>
            </div>

            {places.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">Inga viktiga platser ännu.</div>
            ) : (
              places.map((p) => (
                <div key={p.id}>
                  {/* Mobile rows: To and From */}
                  <div className="sm:hidden">
                    {/* To place */}
                    <div className="px-4 pt-3 text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5" /><span>Till {p.label || "Plats"}</span> <span className="text-[11px] text-muted-foreground/80">min</span></div>
                    <div className="px-4 text-[11px] text-muted-foreground/80">Anländ senast {p.arriveBy ?? "—"}</div>
                    <div className="overflow-x-auto">
                      <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                        {columns.map((a) => {
                          const accTimes = commuteForTwo(a.id);
                          const currTimes = current ? commuteForTwo(current.id) : {} as Record<string, { to: number; from: number }>;
                          const aMin = accTimes[p.id]?.to;
                          const cMin = current ? currTimes[p.id]?.to : undefined;
                          const d = a.kind !== "current" && cMin != null && aMin != null ? (aMin - cMin) : null;
                          const tone = deltaVariant(d as any, false);
                          return (
                            <div key={a.id + p.id + "to"} className="px-4 py-4 cursor-pointer" onClick={() => openTransit({ origin: a.address ?? a.title, destination: p.address ?? p.label, arriveBy: p.arriveBy, direction: "to" })}>
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <div className="group">
                                    <div className="flex items-center gap-1 leading-none">
                                      <div className="text-3xl font-bold">{aMin != null ? aMin : "—"}</div>
                                      {(() => {
                                        const best = bestValue(columns.map((c) => commuteForTwo(c.id)[p.id]?.to), /* goodWhenHigher= */ false);
                                        const isBest = aMin != null && best != null && aMin === best;
                                        if (isBest) return <Award className="h-3.5 w-3.5 text-emerald-600" />;
                                        if (a.kind === "current" || d == null || d === 0) return null;
                                        const up = d > 0;
                                        const Icon = up ? ArrowUpRight : ArrowDownRight;
                                        return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                                      })()}
                                    </div>
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardContent className="text-sm">
                                  {d != null ? formatDelta(d, (n) => `${n} min`) : "Nuvarande"}
                                </HoverCardContent>
                              </HoverCard>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* From place */}
                    <div className="px-4 pt-4 text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5" /><span>Från {p.label || "Plats"}</span> <span className="text-[11px] text-muted-foreground/80">min</span></div>
                    <div className="px-4 text-[11px] text-muted-foreground/80">Lämna vid {p.leaveAt ?? "—"}</div>
                    <div className="overflow-x-auto">
                      <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                        {columns.map((a) => {
                          const accTimes = commuteForTwo(a.id);
                          const currTimes = current ? commuteForTwo(current.id) : {} as Record<string, { to: number; from: number }>;
                          const aMin = accTimes[p.id]?.from;
                          const cMin = current ? currTimes[p.id]?.from : undefined;
                          const d = a.kind !== "current" && cMin != null && aMin != null ? (aMin - cMin) : null;
                          const tone = deltaVariant(d as any, false);
                          return (
                            <div key={a.id + p.id + "from"} className="px-4 py-4 cursor-pointer" onClick={() => openTransit({ origin: p.address ?? p.label, destination: a.address ?? a.title, leaveAt: p.leaveAt, direction: "from" })}>
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <div className="group">
                                    <div className="flex items-center gap-1 leading-none">
                                      <div className="text-3xl font-bold">{aMin != null ? aMin : "—"}</div>
                                      {(() => {
                                        const best = bestValue(columns.map((c) => commuteForTwo(c.id)[p.id]?.from), /* goodWhenHigher= */ false);
                                        const isBest = aMin != null && best != null && aMin === best;
                                        if (isBest) return <Award className="h-3.5 w-3.5 text-emerald-600" />;
                                        if (a.kind === "current" || d == null || d === 0) return null;
                                        const up = d > 0;
                                        const Icon = up ? ArrowUpRight : ArrowDownRight;
                                        return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                                      })()}
                                    </div>
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardContent className="text-sm">
                                  {d != null ? formatDelta(d, (n) => `${n} min`) : "Nuvarande"}
                                </HoverCardContent>
                              </HoverCard>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Desktop rows: To and From */}
                  <div className="hidden sm:block overflow-x-auto">
                    {/* To place */}
                    <div className="min-w-[720px] grid" style={{ gridTemplateColumns: gridTemplate }}>
                      <div className="px-4 py-4 text-sm text-foreground/80"><div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /><span>Till {p.label || "Plats"}</span></div><div className="text-[11px] text-muted-foreground/80 mt-1">min • Anländ senast {p.arriveBy ?? "—"}</div></div>
                      {columns.map((a) => {
                        const accTimes = commuteForTwo(a.id);
                        const currTimes = current ? commuteForTwo(current.id) : {} as Record<string, { to: number; from: number }>;
                        const aMin = accTimes[p.id]?.to;
                        const cMin = current ? currTimes[p.id]?.to : undefined;
                        const d = a.kind !== "current" && cMin != null && aMin != null ? (aMin - cMin) : null;
                        const tone = deltaVariant(d as any, false);
                        return (
                          <div key={a.id + p.id + "to-desktop"} className="px-4 py-4 cursor-pointer" onClick={() => openTransit({ origin: a.address ?? a.title, destination: p.address ?? p.label, arriveBy: p.arriveBy, direction: "to" })}>
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div className="group">
                                  <div className="flex items-center gap-1 leading-none">
                                    <div className="text-3xl font-bold">{aMin != null ? aMin : "—"}</div>
                                    {(() => {
                                      const best = bestValue(columns.map((c) => commuteForTwo(c.id)[p.id]?.to), /* goodWhenHigher= */ false);
                                      const isBest = aMin != null && best != null && aMin === best;
                                      if (isBest) return <Award className="h-4 w-4 text-emerald-600" />;
                                      if (a.kind === "current" || d == null || d === 0) return null;
                                      const up = d > 0;
                                      const Icon = up ? ArrowUpRight : ArrowDownRight;
                                      return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                                    })()}
                                  </div>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent className="text-sm">
                                {d != null ? formatDelta(d, (n) => `${n} min`) : "Nuvarande"}
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        );
                      })}
                    </div>

                    {/* From place */}
                    <div className="min-w-[720px] grid" style={{ gridTemplateColumns: gridTemplate }}>
                      <div className="px-4 py-4 text-sm text-foreground/80"><div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /><span>Från {p.label || "Plats"}</span></div><div className="text-[11px] text-muted-foreground/80 mt-1">min • Lämna vid {p.leaveAt ?? "—"}</div></div>
                      {columns.map((a) => {
                        const accTimes = commuteForTwo(a.id);
                        const currTimes = current ? commuteForTwo(current.id) : {} as Record<string, { to: number; from: number }>;
                        const aMin = accTimes[p.id]?.from;
                        const cMin = current ? currTimes[p.id]?.from : undefined;
                        const d = a.kind !== "current" && cMin != null && aMin != null ? (aMin - cMin) : null;
                        const tone = deltaVariant(d as any, false);
                        return (
                          <div key={a.id + p.id + "from-desktop"} className="px-4 py-4 cursor-pointer" onClick={() => openTransit({ origin: p.address ?? p.label, destination: a.address ?? a.title, leaveAt: p.leaveAt, direction: "from" })}>
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div className="group">
                                  <div className="flex items-center gap-1 leading-none">
                                    <div className="text-3xl font-bold">{aMin != null ? aMin : "—"}</div>
                                    {(() => {
                                      const best = bestValue(columns.map((c) => commuteForTwo(c.id)[p.id]?.from), /* goodWhenHigher= */ false);
                                      const isBest = aMin != null && best != null && aMin === best;
                                      if (isBest) return <Award className="h-4 w-4 text-emerald-600" />;
                                      if (a.kind === "current" || d == null || d === 0) return null;
                                      const up = d > 0;
                                      const Icon = up ? ArrowUpRight : ArrowDownRight;
                                      return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                                    })()}
                                  </div>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent className="text-sm">
                                {d != null ? formatDelta(d, (n) => `${n} min`) : "Nuvarande"}
                              </HoverCardContent>
                            </HoverCard>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
        <TransitDrawer open={transitOpen} onOpenChange={setTransitOpen} context={transitCtx} />
    </div>
  );
}

