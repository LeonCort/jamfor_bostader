"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useAccommodations } from "@/lib/accommodations";
import { KeyValueGroup, KeyValueRow } from "@/components/ui/key-value";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import CellDetailDrawer, { CellContext } from "@/components/compare/CellDetailDrawer";
import { CircleDollarSign, Ruler, BedDouble, Square, Award, ArrowUpRight, ArrowDownRight, Asterisk } from "lucide-react";
import TransitDrawer, { TransitDrawerContext } from "@/components/route/TransitDrawer";
import CompareRow from "@/components/compare/CompareRow";
import CompareCell from "@/components/compare/CompareCell";
import TransitPanel from "@/components/compare/TransitPanel";

import { bestValue, deltaVariant, metrics, type MetricKey } from "@/lib/compareMetrics";


function formatSek(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr";
}

export default function ComparePage() {
  const { accommodations, current, places, commuteForTwo, finance } = useAccommodations();

  const columns = useMemo(() => {
    const list = [...accommodations];
    list.sort((a, b) => (a.kind === "current" ? -1 : b.kind === "current" ? 1 : 0));
    return list;
  }, [accommodations]);
  const gridTemplate = useMemo(() => `minmax(200px,1fr) repeat(${columns.length}, minmax(180px,1fr))`, [columns.length]);
  const [cellOpen, setCellOpen] = useState(false);
  const [cellCtx, setCellCtx] = useState<CellContext | null>(null);
  function openCell(ctx: CellContext) { setCellCtx(ctx); setCellOpen(true); }
  const mobileTemplate = useMemo(() => `repeat(${columns.length}, minmax(160px,1fr))`, [columns.length]);
  const toneClass = (tone: "good" | "bad" | "neutral") =>
    tone === "good" ? "stroke-chart-2" : tone === "bad" ? "stroke-chart-5" : "stroke-muted-foreground";

  const isSm = useMediaQuery("(min-width: 640px)");

  const [transitOpen, setTransitOpen] = useState(false);
  const [transitCtx, setTransitCtx] = useState<TransitDrawerContext | null>(null);
  function openTransit(ctx: TransitDrawerContext) { setTransitCtx(ctx); setTransitOpen(true); }

  // Detached sticky header syncing with horizontal scroller
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const headerViewportRef = useRef<HTMLDivElement | null>(null);
  const headerContentRef = useRef<HTMLDivElement | null>(null);

  // Keep header horizontally aligned with the body scroller
  useEffect(() => {
    const scroller = scrollerRef.current;
    const header = headerContentRef.current;
    if (!scroller || !header) return;
    const sync = () => {
      header.style.transform = `translateX(${-scroller.scrollLeft}px)`;
    };
    sync();
    scroller.addEventListener("scroll", sync, { passive: true } as any);
    return () => scroller.removeEventListener("scroll", sync);
  }, [columns.length]);

  // Ensure the header viewport matches the scroller width (prevents misalignment)
  useEffect(() => {
    const scroller = scrollerRef.current;
    const viewport = headerViewportRef.current;
    if (!scroller || !viewport) return;
    const setWidth = () => { viewport.style.width = `${scroller.clientWidth}px`; };
    setWidth();
    const ResizeObs = (window as any).ResizeObserver;
    const ro = ResizeObs ? new ResizeObs(setWidth) : null;
    ro?.observe(scroller);
    window.addEventListener("resize", setWidth);
    return () => {
      ro?.disconnect?.();
      window.removeEventListener("resize", setWidth);
    };
  }, [columns.length]);


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
        {/* Detached sticky header */}
        <div className="sticky top-14 z-30 mb-2 sm:mb-3">
          <div className="bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70 border-b border-border">
            <div ref={headerViewportRef} className="overflow-hidden">
              <div ref={headerContentRef} className="grid" style={{ gridTemplateColumns: isSm ? gridTemplate : mobileTemplate }}>
                {isSm ? (<div className="px-4 py-3 text-xs text-muted-foreground">&nbsp;</div>) : null}
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
          </div>
        </div>
        {/* Shared horizontal scroller for desktop and up */
        }
        <div ref={scrollerRef} className="overflow-x-auto" onScroll={() => { const s = scrollerRef.current, h = headerContentRef.current; if (!s || !h) return; h.style.transform = `translateX(${-s.scrollLeft}px)`; }}>


          <div className="min-w-full sm:min-w-[960px]">


        {/* Overall */}
        <section>
          {isSm ? (
            <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
              <div className="px-4 pt-4 pb-2 text-sm font-medium text-foreground sticky left-0 z-20 bg-card shadow-[8px_0_8px_-8px_rgba(0,0,0,0.2)]">Övergripande</div>
              {columns.map((a) => (<div key={a.id} />))}
            </div>
          ) : (
            <div className="px-4 pt-4 pb-2 text-sm font-medium text-foreground">Övergripande</div>
          )}
          <div>
            {/* Mobile rendering (no per-row scrollers); labels above values */}
            {!isSm && (
              <div>
                {/* Rows (registry-driven) */}
                {(["totalMonthlyCost", "utropspris", "prisPerKvm", "kontantinsats", "dagarPaHemnet"] as MetricKey[]).map((key: MetricKey) => {
                  const M = metrics[key];
                  const unitForCell = M.unit?.startsWith("kr") ? "kr" : M.unit;
                  return (
                    <div key={key} className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                      {columns.map((a) => {
                        const base = current ? M.valueOf(current, { current, finance }) : undefined;
                        const val = M.valueOf(a, { current, finance });
                        const delta = a.kind !== "current" && base != null && val != null ? val - base : null;
                        const tone = deltaVariant(delta as any, M.goodWhenHigher);
                        const best = bestValue(columns.map((c) => M.valueOf(c, { current, finance })), M.goodWhenHigher);
                        const valuesAcross = metrics[key].valuesAcross
                          ? metrics[key].valuesAcross!(columns, { current, finance })
                          : columns.map((c) => ({ id: c.id, title: c.title, value: metrics[key].valueOf(c, { current, finance }) }));
                        const valueText = val != null
                          ? (M.unit?.startsWith("kr") ? `${val.toLocaleString("sv-SE")} kr` : `${val.toLocaleString("sv-SE")} ${M.unit ?? ""}`)
                          : "—";
                        return (
                          <div key={a.id + key} className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => openCell({
                                acc: a,
                                label: M.label,
                                unit: unitForCell,
                                value: val,
                                delta,
                                metricKey: key,
                                valuesAcross: valuesAcross.map(v => ({ id: v.id, title: v.title ?? undefined, value: v.value })),

                                breakdown: key === "totalMonthlyCost" ? metrics[key].breakdown?.(a, { current, finance }) : undefined,
                              })}
                              className="w-full text-left px-4 py-4 rounded-md hover:bg-muted/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <MobileLabel label={M.label} unit={M.unit} />
                              <div className="flex items-center gap-1 leading-none">
                                <div className="text-xl font-bold inline-flex items-center gap-1">
                                  {valueText}
                                  {key === "totalMonthlyCost" && (((a as any).driftkostnaderIsEstimated) || ((a as any).maintenanceUnknown)) ? (
                                    (a as any).maintenanceUnknown ? (
                                      <span title="Driftkostnad saknas - total manadskostnad exkluderar drift">
                                        <Asterisk className="h-3 w-3 text-muted-foreground" />
                                      </span>
                                    ) : (
                                      <Asterisk className="h-3 w-3 text-muted-foreground" />
                                    )
                                  ) : null}
                                </div>
                                {(() => {
                                  const isBest = val != null && best != null && val === best;
                                  if (isBest) return <Award className="h-3.5 w-3.5 stroke-chart-2" />;
                                  if (a.kind === "current" || !delta || delta === 0) return null;
                                  const up = (delta as number) > 0;
                                  const Icon = up ? ArrowUpRight : ArrowDownRight;
                                  return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                                })()}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}





                {/* Kontantinsats (mobile) */}
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
                      <div key={a.id + "ki"} className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => openCell({
                            acc: a,
                            label: "Kontantinsats",
                            unit: "kr",
                            value: val ?? undefined,
                            delta,
                            metricKey: "kontantinsats",
                            valuesAcross: columns.map(c => {
                              if (c.kind === "current") {
                                const loans = (((c.metrics as any)?.mortgage?.loans) ?? []) as { principal: number }[];
                                const debt = loans.reduce((s, l) => s + (l?.principal ?? 0), 0);
                                const v = c.currentValuation ?? 0;
                                return { id: c.id, title: c.title, value: v > 0 ? v - debt : undefined };
                              } else {
                                const ki = (c as any).kontantinsats as number | undefined;
                                if (ki != null) return { id: c.id, title: c.title, value: ki };
                                const bp = (c as any).begartPris as number | undefined;
                                return { id: c.id, title: c.title, value: bp != null ? Math.round(bp * 0.15) : undefined };
                              }
                            }),
                          })}
                          className="w-full text-left px-4 py-4 rounded-md hover:bg-muted/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <MobileLabel label="Kontantinsats" unit="kr" />
                          <div className="flex items-center gap-1 leading-none">
                            <div className="text-xl font-bold">{val != null ? `${val.toLocaleString("sv-SE")} kr` : "—"}</div>
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
                              if (isBest) return <Award className="h-3.5 w-3.5 stroke-chart-2" />;
                              if (a.kind === "current" || !delta || delta === 0) return null;
                              const up = (delta as number) > 0;
                              const Icon = up ? ArrowUpRight : ArrowDownRight;
                              return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                            })()}
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Desktop: label column on the left */}
            {isSm && (
              <div className="block">
              <div className="min-w-[720px]">

                {/* Rows (registry-driven) */}
                {(["totalMonthlyCost", "utropspris", "prisPerKvm", "kontantinsats", "dagarPaHemnet"] as MetricKey[]).map((key) => {
                  const M = metrics[key];
                  const unitForCell = M.unit?.startsWith("kr") ? "kr" : M.unit;
                  return (
                    <CompareRow key={key} label={M.label} unit={M.unit} gridTemplate={gridTemplate} labelClassName="py-5">
                      {columns.map((a) => {
                        const base = current ? M.valueOf(current, { current, finance }) : undefined;
                        const val = M.valueOf(a, { current, finance });
                        const delta = a.kind !== "current" && base != null && val != null ? val - base : null;
                        const tone = deltaVariant(delta as any, M.goodWhenHigher);
                        const best = bestValue(columns.map((c) => M.valueOf(c, { current, finance })), M.goodWhenHigher);
                        const valuesAcross = metrics[key].valuesAcross
                          ? metrics[key].valuesAcross!(columns, { current, finance })
                          : columns.map((c) => ({ id: c.id, title: c.title, value: metrics[key].valueOf(c, { current, finance }) }));
                        const valueText = val != null
                          ? (M.unit?.startsWith("kr") ? `${val.toLocaleString("sv-SE")} kr` : `${val.toLocaleString("sv-SE")} ${M.unit ?? ""}`)
                          : "\u2014";
                        return (
                          <div key={a.id + key}>
                            <CompareCell onClick={() => openCell({
                              acc: a,
                              label: M.label,
                              unit: unitForCell,
                              value: val,
                              delta,
                              metricKey: key,
                              valuesAcross: valuesAcross.map(v => ({ id: v.id, title: v.title ?? undefined, value: v.value })),
                              breakdown: key === "totalMonthlyCost" ? metrics[key].breakdown?.(a, { current, finance }) : undefined,
                            })}>
                              <div className="text-xl font-bold inline-flex items-center gap-1">
                                {valueText}
                                {key === "totalMonthlyCost" && (((a as any).driftkostnaderIsEstimated) || ((a as any).maintenanceUnknown)) ? (
                                  (a as any).maintenanceUnknown ? (
                                    <span title="Driftkostnad saknas - total manadskostnad exkluderar drift">
                                      <Asterisk className="h-4 w-4 text-muted-foreground" />
                                    </span>
                                  ) : (
                                    <Asterisk className="h-4 w-4 text-muted-foreground" />
                                  )
                                ) : null}
                              </div>
                              {(() => {
                                const isBest = val != null && best != null && val === best;
                                if (isBest) return <Award className="h-4 w-4 stroke-chart-2" />;
                                if (a.kind === "current" || !delta || delta === 0) return null;
                                const up = (delta as number) > 0;
                                const Icon = up ? ArrowUpRight : ArrowDownRight;
                                return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                              })()}
                            </CompareCell>
                          </div>
                        );
                      })}
                    </CompareRow>
                  );
                })}




              </div>
            </div>
            )}
          </div>
        </section>

        {/* House details */}
        <section>
          {isSm ? (
            <div className="grid border-t border-border" style={{ gridTemplateColumns: gridTemplate }}>
              <div className="px-4 py-3 text-sm font-medium text-foreground sticky left-0 z-20 bg-card shadow-[8px_0_8px_-8px_rgba(0,0,0,0.2)]">Husdetaljer</div>
              {columns.map((a) => (<div key={a.id} />))}
            </div>
          ) : (
            <div className="border-t border-border px-4 py-3 text-sm font-medium text-foreground">Husdetaljer</div>
          )}
          <div>

            {/* Rows (registry-driven) */}
            {(["boarea", "antalRum", "tomtarea", "byggar", "energiklass"] as MetricKey[]).map((key) => {
              const M = metrics[key];
              return (
                <div key={key}>
                  {/* Mobile row */}
                  {!isSm && (
                    <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                      {columns.map((a) => {
                        const base = current ? M.valueOf(current, { current, finance }) : undefined;
                        const val = M.valueOf(a, { current, finance });
                        const delta = a.kind !== "current" && base != null && val != null ? val - base : null;
                        const tone = deltaVariant(delta as any, M.goodWhenHigher);
                        const best = bestValue(columns.map((c) => M.valueOf(c, { current, finance })), M.goodWhenHigher);
                        const valuesAcross = columns.map((c) => ({ id: c.id, title: c.title, value: M.valueOf(c, { current, finance }) }));
                        return (
                          <div key={a.id + key} className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => openCell({
                                acc: a,
                                label: M.label,
                                unit: M.unit,
                                value: val,
                                delta,
                                metricKey: key,
                                valuesAcross,
                              })}
                              className="w-full text-left px-4 py-4 rounded-md hover:bg-muted/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <MobileLabel label={M.label} unit={M.unit} />
                              <div className="flex items-center gap-1 leading-none">
                                <div className="text-xl font-bold">{val != null ? `${val.toLocaleString("sv-SE")} ${M.unit ?? ""}` : "—"}</div>
                                {(() => {
                                  const isBest = val != null && best != null && val === best;
                                  if (isBest) return <Award className="h-3.5 w-3.5 stroke-chart-2" />;
                                  if (a.kind === "current" || !delta || delta === 0) return null;
                                  const up = (delta as number) > 0;
                                  const Icon = up ? ArrowUpRight : ArrowDownRight;
                                  return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                                })()}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Desktop row */}
                  {isSm && (
                    <CompareRow label={M.label} unit={M.unit} gridTemplate={gridTemplate}>
                      {columns.map((a) => {
                        const base = current ? M.valueOf(current, { current, finance }) : undefined;
                        const val = M.valueOf(a, { current, finance });
                        const delta = a.kind !== "current" && base != null && val != null ? val - base : null;
                        const tone = deltaVariant(delta as any, M.goodWhenHigher);
                        const best = bestValue(columns.map((c) => M.valueOf(c, { current, finance })), M.goodWhenHigher);
                        const valuesAcross = columns.map((c) => ({ id: c.id, title: c.title, value: M.valueOf(c, { current, finance }) }));
                        return (
                          <div key={a.id + key}>
                            <CompareCell onClick={() => openCell({ acc: a, label: M.label, unit: M.unit, value: val, delta, metricKey: key, valuesAcross })}>
                              <div className="text-xl font-bold">{val != null ? `${val.toLocaleString("sv-SE")} ${M.unit ?? ""}` : "—"}</div>
                              {(() => {
                                const isBest = val != null && best != null && val === best;
                                if (isBest) return <Award className="h-4 w-4 stroke-chart-2" />;
                                if (a.kind === "current" || !delta || delta === 0) return null;
                                const up = (delta as number) > 0;
                                const Icon = up ? ArrowUpRight : ArrowDownRight;
                                return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                              })()}
                            </CompareCell>
                          </div>
                        );
                      })}
                    </CompareRow>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Costs */}
        <section>
          {isSm ? (
            <div className="grid border-t border-border" style={{ gridTemplateColumns: gridTemplate }}>
              <div className="px-4 py-3 text-sm font-medium text-foreground sticky left-0 z-20 bg-card shadow-[8px_0_8px_-8px_rgba(0,0,0,0.2)]">Kostnader</div>
              {columns.map((a) => (<div key={a.id} />))}
            </div>
          ) : (
            <div className="border-t border-border px-4 py-3 text-sm font-medium text-foreground">Kostnader</div>
          )}
          <div>

            {/* Rows (registry-driven) */}
            {(["hyra", "driftkostnaderMonthly", "amorteringPerManad", "rantaPerManad", "lan"] as MetricKey[]).map((key) => {
              const M = metrics[key];
              const unitForCell = M.unit?.startsWith("kr") ? "kr" : M.unit;
              return (
                <div key={key}>
                  {/* Mobile row */}
                  {!isSm && (
                    <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                      {columns.map((a) => {
                        const base = current ? M.valueOf(current, { current, finance }) : undefined;
                        const val = M.valueOf(a, { current, finance });
                        const delta = a.kind !== "current" && base != null && val != null ? val - base : null;
                        const tone = deltaVariant(delta as any, M.goodWhenHigher);
                        const best = bestValue(columns.map((c) => M.valueOf(c, { current, finance })), M.goodWhenHigher);
                        const valuesAcross = columns.map((c) => ({ id: c.id, title: c.title, value: M.valueOf(c, { current, finance }) }));
                        const valueText = val != null ? (M.unit?.startsWith("kr") ? `${val.toLocaleString("sv-SE")} kr` : `${val.toLocaleString("sv-SE")} ${M.unit ?? ""}`) : "—";
                        return (
                          <div key={a.id + key} className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => openCell({ acc: a, label: M.label, unit: unitForCell, value: val, delta, metricKey: key, valuesAcross })}
                              className="w-full text-left px-4 py-4 rounded-md hover:bg-muted/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <MobileLabel label={M.label} unit={M.unit} />
                              <div className="flex items-center gap-1 leading-none">
                                <div className="text-xl font-bold inline-flex items-center gap-1">
                                  {valueText}
                                  {key === "driftkostnaderMonthly" && ((a as any).driftkostnaderIsEstimated) ? (
                                    <Asterisk className="h-4 w-4 text-muted-foreground" />
                                  ) : null}
                                </div>
                                {(() => {
                                  const isBest = val != null && best != null && val === best;
                                  if (isBest) return <Award className="h-3.5 w-3.5 stroke-chart-2" />;
                                  if (a.kind === "current" || !delta || delta === 0) return null;
                                  const up = (delta as number) > 0;
                                  const Icon = up ? ArrowUpRight : ArrowDownRight;
                                  return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                                })()}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Desktop row */}
                  {isSm && (
                    <CompareRow label={M.label} unit={M.unit} gridTemplate={gridTemplate}>
                      {columns.map((a) => {
                        const base = current ? M.valueOf(current, { current, finance }) : undefined;
                        const val = M.valueOf(a, { current, finance });
                        const delta = a.kind !== "current" && base != null && val != null ? val - base : null;
                        const tone = deltaVariant(delta as any, M.goodWhenHigher);
                        const best = bestValue(columns.map((c) => M.valueOf(c, { current, finance })), M.goodWhenHigher);
                        const valuesAcross = columns.map((c) => ({ id: c.id, title: c.title, value: M.valueOf(c, { current, finance }) }));
                        const valueText = val != null ? (M.unit?.startsWith("kr") ? `${val.toLocaleString("sv-SE")} kr` : `${val.toLocaleString("sv-SE")} ${M.unit ?? ""}`) : "—";
                        return (
                          <div key={a.id + key}>
                            <CompareCell onClick={() => openCell({ acc: a, label: M.label, unit: unitForCell, value: val, delta, metricKey: key, valuesAcross })}>
                              <div className="text-xl font-bold inline-flex items-center gap-1">
                                {valueText}
                                {key === "driftkostnaderMonthly" && ((a as any).driftkostnaderIsEstimated) ? (
                                  <Asterisk className="h-4 w-4 text-muted-foreground" />
                                ) : null}
                              </div>
                              {(() => {
                                const isBest = val != null && best != null && val === best;
                                if (isBest) return <Award className="h-4 w-4 stroke-chart-2" />;
                                if (a.kind === "current" || !delta || delta === 0) return null;
                                const up = (delta as number) > 0;
                                const Icon = up ? ArrowUpRight : ArrowDownRight;
                                return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                              })()}
                            </CompareCell>
                          </div>
                        );
                      })}
                    </CompareRow>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Transit */}
        <section>
          {isSm ? (
            <div className="grid border-t border-border" style={{ gridTemplateColumns: gridTemplate }}>
              <div className="px-4 py-3 text-sm font-medium text-foreground sticky left-0 z-20 bg-card shadow-[8px_0_8px_-8px_rgba(0,0,0,0.2)]">Pendling</div>
              {columns.map((a) => (<div key={a.id} />))}
            </div>
          ) : (
            <div className="border-t border-border px-4 py-3 text-sm font-medium text-foreground">Pendling</div>
          )}
          <div>
            <TransitPanel
              columns={columns}
              current={current}
              places={places}
              gridTemplate={gridTemplate}
              mobileTemplate={mobileTemplate}
              openTransit={openTransit}
              commuteForTwo={commuteForTwo}
            />

          </div>
        </section>
          </div>
        </div>

      </div>
      <CellDetailDrawer open={cellOpen} onOpenChange={setCellOpen} ctx={cellCtx} />

        <TransitDrawer open={transitOpen} onOpenChange={setTransitOpen} context={transitCtx} />
    </div>
  );
}

// Simple media query hook (co-located for this page)
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
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




// Mobile-only label helper
function MobileLabel({ label, unit, className }: { label: string; unit?: string; className?: string }) {
  return (
    <div className={(className ? className + " " : "") + "text-xs text-muted-foreground mb-1"}>
      {label} {unit ? <span className="text-[11px] text-muted-foreground/80">{unit}</span> : null}
    </div>
  );
}
