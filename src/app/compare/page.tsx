"use client";

import { useMemo } from "react";
import { useAccommodations } from "@/lib/accommodations";
import { KeyValueGroup, KeyValueRow } from "@/components/ui/key-value";
import { CircleDollarSign, Ruler, BedDouble, Square, Clock, Award, ArrowUpRight, ArrowDownRight } from "lucide-react";

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
  const { accommodations, current, places, commuteFor } = useAccommodations();

  const columns = useMemo(() => accommodations, [accommodations]);
  const gridTemplate = useMemo(() => `minmax(200px,1fr) repeat(${columns.length}, minmax(180px,1fr))`, [columns.length]);
  const mobileTemplate = useMemo(() => `repeat(${columns.length}, minmax(160px,1fr))`, [columns.length]);
  const toneClass = (tone: "good" | "bad" | "neutral") =>
    tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-red-600" : "text-muted-foreground";

  const bestMonthlyCost = useMemo(() => bestValue(columns.map(c => c.totalMonthlyCost), /* goodWhenHigher= */ false), [columns]);

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
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Jämför bostäder</h1>
        <p className="mt-2 text-muted-foreground">Kompakt kortöversikt följt av tydliga jämförelser i olika sektioner.</p>
      </header>

      {/* Compact cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {columns.map((a) => {
          const isCurrent = a.kind === "current";
          const curr = current;
          const costDelta = curr?.totalMonthlyCost != null && a.totalMonthlyCost != null ? (a.totalMonthlyCost - curr.totalMonthlyCost) : null;
          const sizeDelta = curr?.boarea != null && a.boarea != null ? (a.boarea - curr.boarea) : null;
          const roomsDelta = curr?.antalRum != null && a.antalRum != null ? (a.antalRum - curr.antalRum) : null;
          const lotDelta = curr?.tomtarea != null && a.tomtarea != null ? (a.tomtarea - curr.tomtarea) : (a.tomtarea ?? null);

          return (
            <div key={a.id} className="rounded-xl border bg-card overflow-hidden shadow-sm">
              {a.imageUrl ? (
                <img src={a.imageUrl} alt={a.title} className="h-28 w-full object-cover" />
              ) : (
                <div className="h-28 w-full bg-muted" />)
              }
              <div className="p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">{isCurrent ? "Nuvarande" : "Potentiell"}</div>
                    <div className="font-semibold">{a.title}</div>
                    {a.address ? <div className="text-xs text-muted-foreground">{a.address}</div> : null}
                  </div>
                  <span className="inline-block size-2.5 rounded-full mt-1" style={{ background: "currentColor" }} />
                </div>
                <div className="mt-3">
                  <KeyValueGroup>
                    <KeyValueRow icon={<CircleDollarSign className="h-3.5 w-3.5" />} label="Kostnad" value={<><span>{formatSek(a.totalMonthlyCost)}</span>{a.totalMonthlyCost != null && " / mån"}</>} deltaText={a.kind !== "current" && curr ? formatDelta(costDelta, (n) => formatSek(n)) : null} deltaTone={deltaVariant(costDelta as any, false)} />
                    <KeyValueRow icon={<Ruler className="h-3.5 w-3.5" />} label="Storlek" value={<>{a.boarea ?? "—"} m²</>} deltaText={a.kind !== "current" && curr ? formatDelta(sizeDelta, (n) => `${n} m²`) : null} deltaTone={deltaVariant(sizeDelta as any, true)} />
                    <KeyValueRow icon={<BedDouble className="h-3.5 w-3.5" />} label="Rum" value={a.antalRum ?? "—"} deltaText={a.kind !== "current" && curr ? formatDelta(roomsDelta, (n) => `${n}`) : null} deltaTone={deltaVariant(roomsDelta as any, true)} />
                    {a.tomtarea != null ? (
                      <KeyValueRow icon={<Square className="h-3.5 w-3.5" />} label="Tomtareal" value={<>{a.tomtarea} m²</>} deltaText={a.kind !== "current" && curr ? formatDelta(lotDelta, (n) => `${n} m²`) : null} deltaTone={deltaVariant(lotDelta as any, true)} />
                    ) : null}
                  </KeyValueGroup>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison sections */}
      <div className="space-y-8">
        {/* Overall */}
        <section>
          <div className="mb-3 text-sm font-medium text-muted-foreground">Övergripande</div>
          <div className="rounded-xl border bg-card">
            {/* Mobile: header + row label on top, horizontal columns */}
            <div className="sm:hidden">
              <div className="grid border-b" style={{ gridTemplateColumns: mobileTemplate }}>
                {columns.map((a) => (
                  <div key={a.id} className="px-4 py-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {a.title}
                  </div>
                ))}
              </div>
              <div className="px-4 pt-3 text-xs text-muted-foreground">Månadskostnad</div>
              <div className="overflow-x-auto">
                <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                  {columns.map((a) => {
                    const delta = current && a.totalMonthlyCost != null && current.totalMonthlyCost != null ? a.totalMonthlyCost - current.totalMonthlyCost : null;
                    const tone = deltaVariant(delta as any, false);
                    return (
                      <div key={a.id} className="px-4 py-4">
                        <div className="group">
                          <div className="flex items-center gap-1 leading-none">
                            <div className="text-3xl font-extrabold">{a.totalMonthlyCost != null ? a.totalMonthlyCost.toLocaleString("sv-SE") : "—"}</div>
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
                          <div className="relative mt-1 h-4 w-fit">
                            <div className="absolute inset-0 text-[11px] text-muted-foreground transition-opacity group-hover:opacity-0">kr/mån</div>
                            <div className={`absolute inset-0 text-[11px] ${toneClass(tone)} opacity-0 transition-opacity group-hover:opacity-100`}>{a.kind !== "current" ? formatDelta(delta as any, (n) => `${n.toLocaleString("sv-SE")} kr/mån`) : "Nuvarande"}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Desktop: label column on the left */}
            <div className="hidden sm:block overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid border-b" style={{ gridTemplateColumns: gridTemplate }}>
                  <div className="px-4 py-3 text-xs text-muted-foreground">&nbsp;</div>
                  {columns.map((a) => (
                    <div key={a.id} className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {a.title}
                    </div>
                  ))}
                </div>
                <div className="grid" style={{ gridTemplateColumns: gridTemplate }}>
                  <div className="px-4 py-5 text-sm text-muted-foreground">Månadskostnad</div>
                  {columns.map((a) => {
                    const delta = current && a.totalMonthlyCost != null && current.totalMonthlyCost != null ? a.totalMonthlyCost - current.totalMonthlyCost : null;
                    const tone = deltaVariant(delta as any, false);
                    return (
                      <div key={a.id} className="px-4 py-4">
                        <div className="group">
                          <div className="flex items-center gap-1 leading-none">
                            <div className="text-4xl font-extrabold">{a.totalMonthlyCost != null ? a.totalMonthlyCost.toLocaleString("sv-SE") : "—"}</div>
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
                          <div className="relative mt-1 h-4 w-fit">
                            <div className="absolute inset-0 text-[11px] text-muted-foreground transition-opacity group-hover:opacity-0">kr/mån</div>
                            <div className={`absolute inset-0 text-[11px] ${toneClass(tone)} opacity-0 transition-opacity group-hover:opacity-100`}>{a.kind !== "current" ? formatDelta(delta as any, (n) => `${n.toLocaleString("sv-SE")} kr/mån`) : "Nuvarande"}</div>
                          </div>
                        </div>
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
          <div className="mb-3 text-sm font-medium text-muted-foreground">Husdetaljer</div>
          <div className="rounded-xl border bg-card">
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
                <div className="grid border-b" style={{ gridTemplateColumns: gridTemplate }}>
                  <div className="px-4 py-3 text-xs text-muted-foreground">&nbsp;</div>
                  {columns.map((a) => (
                    <div key={a.id} className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {a.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rows */}
            {[{ key: "boarea", label: "Bostadsyta", unit: "m²", good: true }, { key: "antalRum", label: "Antal rum", unit: "rum", good: true }, { key: "tomtarea", label: "Tomtareal", unit: "m²", good: true }].map((row) => (
              <div key={row.key}>
                {/* Mobile row */}
                <div className="sm:hidden">
                  <div className="px-4 pt-3 text-xs text-muted-foreground">{row.label}</div>
                  <div className="overflow-x-auto">
                    <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                      {columns.map((a) => {
                        const base = (current as any)?.[row.key] as number | undefined;
                        const val = (a as any)[row.key] as number | undefined;
                        const delta = base != null && val != null ? val - base : null;
                        const tone = deltaVariant(delta as any, row.good);
                        return (
                          <div key={a.id + row.key} className="px-4 py-4">
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
                              <div className="relative mt-1 h-4 w-fit">
                                <div className="absolute inset-0 text-[11px] text-muted-foreground transition-opacity group-hover:opacity-0">{row.unit}</div>
                                <div className={`absolute inset-0 text-[11px] ${toneClass(tone)} opacity-0 transition-opacity group-hover:opacity-100`}>{a.kind !== "current" ? formatDelta(delta as any, (n) => `${n}${row.unit ? " " + row.unit : ""}`) : "Nuvarande"}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Desktop row */}
                <div className="hidden sm:block overflow-x-auto border-t">
                  <div className="min-w-[720px] grid" style={{ gridTemplateColumns: gridTemplate }}>
                    <div className="px-4 py-4 text-sm text-muted-foreground">{row.label}</div>
                    {columns.map((a) => {
                      const base = (current as any)?.[row.key] as number | undefined;
                      const val = (a as any)[row.key] as number | undefined;
                      const delta = base != null && val != null ? val - base : null;
                      const tone = deltaVariant(delta as any, row.good);
                      return (
                        <div key={a.id + row.key} className="px-4 py-4">
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
                            <div className="relative mt-1 h-4 w-fit">
                              <div className="absolute inset-0 text-[11px] text-muted-foreground transition-opacity group-hover:opacity-0">{row.unit}</div>
                              <div className={`absolute inset-0 text-[11px] ${toneClass(tone)} opacity-0 transition-opacity group-hover:opacity-100`}>{a.kind !== "current" ? formatDelta(delta as any, (n) => `${n}${row.unit ? " " + row.unit : ""}`) : "Nuvarande"}</div>
                            </div>
                          </div>
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
          <div className="mb-3 text-sm font-medium text-muted-foreground">Kostnader</div>
          <div className="rounded-xl border bg-card">
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
                <div className="grid border-b" style={{ gridTemplateColumns: gridTemplate }}>
                  <div className="px-4 py-3 text-xs text-muted-foreground">&nbsp;</div>
                  {columns.map((a) => (
                    <div key={a.id} className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {a.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {[{ key: "hyra", label: "Hyra/avgift", fmt: (n: number) => `${n.toLocaleString("sv-SE")} kr/mån`, good: false }, { key: "driftkostnader", label: "Driftkostnad", fmt: (n: number) => `${Math.round(n / 12).toLocaleString("sv-SE")} kr/mån`, good: false }, { key: "amorteringPerManad", label: "Amortering", fmt: (n: number) => `${n.toLocaleString("sv-SE")} kr/mån`, good: false }, { key: "rantaPerManad", label: "Ränta", fmt: (n: number) => `${n.toLocaleString("sv-SE")} kr/mån`, good: false }].map((row) => (
              <div key={row.key}>
                {/* Mobile row */}
                <div className="sm:hidden">
                  <div className="px-4 pt-3 text-xs text-muted-foreground">{row.label}</div>
                  <div className="overflow-x-auto">
                    <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                      {columns.map((a) => {
                        const base = (current as any)?.[row.key] as number | undefined;
                        const raw = (a as any)[row.key] as number | undefined;
                        const val = raw != null ? (row.key === "driftkostnader" ? Math.round(raw / 12) : raw) : undefined;
                        const delta = base != null && val != null ? val - (row.key === "driftkostnader" ? Math.round(base / 12) : base) : null;
                        const tone = deltaVariant(delta as any, false);
                        return (
                          <div key={a.id + row.key} className="px-4 py-4">
                            <div className="group">
                              <div className="flex items-center gap-1 leading-none">
                                <div className="text-2xl font-semibold">{val != null ? val.toLocaleString("sv-SE") : "—"}</div>
                                {(() => {
                                  const best = bestValue(columns.map((c) => {
                                    const rawC = (c as any)[row.key] as number | undefined;
                                    return rawC != null ? (row.key === "driftkostnader" ? Math.round(rawC / 12) : rawC) : undefined;
                                  }), /* goodWhenHigher= */ false);
                                  const isBest = val != null && best != null && val === best;
                                  if (isBest) return <Award className="h-3.5 w-3.5 text-emerald-600" />;
                                  if (a.kind === "current" || !delta || delta === 0) return null;
                                  const up = (delta as number) > 0;
                                  const Icon = up ? ArrowUpRight : ArrowDownRight;
                                  return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                                })()}
                              </div>
                              <div className="relative mt-1 h-4 w-fit">
                                <div className="absolute inset-0 text-[11px] text-muted-foreground transition-opacity group-hover:opacity-0">kr/mån</div>
                                <div className={`absolute inset-0 text-[11px] ${toneClass(tone)} opacity-0 transition-opacity group-hover:opacity-100`}>{a.kind !== "current" ? formatDelta(delta as any, (n) => `${n.toLocaleString("sv-SE")} kr/mån`) : "Nuvarande"}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Desktop row */}
                <div className="hidden sm:block overflow-x-auto border-t">
                  <div className="min-w-[720px] grid" style={{ gridTemplateColumns: gridTemplate }}>
                    <div className="px-4 py-4 text-sm text-muted-foreground">{row.label}</div>
                    {columns.map((a) => {
                      const base = (current as any)?.[row.key] as number | undefined;
                      const raw = (a as any)[row.key] as number | undefined;
                      const val = raw != null ? (row.key === "driftkostnader" ? Math.round(raw / 12) : raw) : undefined;
                      const delta = base != null && val != null ? val - (row.key === "driftkostnader" ? Math.round(base / 12) : base) : null;
                      const tone = deltaVariant(delta as any, false);
                      return (
                        <div key={a.id + row.key} className="px-4 py-4">
                          <div className="group">
                            <div className="flex items-center gap-1 leading-none">
                              <div className="text-2xl font-semibold">{val != null ? val.toLocaleString("sv-SE") : "—"}</div>
                              {(() => {
                                const best = bestValue(columns.map((c) => {
                                  const rawC = (c as any)[row.key] as number | undefined;
                                  return rawC != null ? (row.key === "driftkostnader" ? Math.round(rawC / 12) : rawC) : undefined;
                                }), /* goodWhenHigher= */ false);
                                const isBest = val != null && best != null && val === best;
                                if (isBest) return <Award className="h-4 w-4 text-emerald-600" />;
                                if (a.kind === "current" || !delta || delta === 0) return null;
                                const up = (delta as number) > 0;
                                const Icon = up ? ArrowUpRight : ArrowDownRight;
                                return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                              })()}
                            </div>
                            <div className="relative mt-1 h-4 w-fit">
                              <div className="absolute inset-0 text-[11px] text-muted-foreground transition-opacity group-hover:opacity-0">kr/mån</div>
                              <div className={`absolute inset-0 text-[11px] ${toneClass(tone)} opacity-0 transition-opacity group-hover:opacity-100`}>{a.kind !== "current" ? formatDelta(delta as any, (n) => `${n.toLocaleString("sv-SE")} kr/mån`) : "Nuvarande"}</div>
                            </div>
                          </div>
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
          <div className="mb-3 text-sm font-medium text-muted-foreground">Pendling</div>
          <div className="rounded-xl border bg-card">
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
                <div className="grid border-b" style={{ gridTemplateColumns: gridTemplate }}>
                  <div className="px-4 py-3 text-xs text-muted-foreground">&nbsp;</div>
                  {columns.map((a) => (
                    <div key={a.id} className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {a.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {places.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted-foreground">Inga viktiga platser ännu.</div>
            ) : (
              places.map((p) => (
                <div key={p.id}>
                  {/* Mobile row */}
                  <div className="sm:hidden">
                    <div className="px-4 pt-3 text-xs text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5" /><span>{p.label || "Plats"}</span></div>
                    <div className="overflow-x-auto">
                      <div className="grid" style={{ gridTemplateColumns: mobileTemplate }}>
                        {columns.map((a) => {
                          const accTimes = commuteFor(a.id);
                          const currTimes = current ? commuteFor(current.id) : {} as Record<string, number>;
                          const aMin = accTimes[p.id];
                          const cMin = current ? currTimes[p.id] : undefined;
                          const d = a.kind !== "current" && cMin != null && aMin != null ? (aMin - cMin) : null;
                          const tone = deltaVariant(d as any, false);
                          return (
                            <div key={a.id + p.id} className="px-4 py-4">
                              <div className="group">
                              <div className="flex items-center gap-1 leading-none">
                                <div className="text-3xl font-bold">{aMin != null ? aMin : ""}</div>
                                  {(() => {
                                  const best = bestValue(columns.map((c) => {
                                    const times = commuteFor(c.id);
                                    return times[p.id];
                                  }), /* goodWhenHigher= */ false);
                                  const isBest = aMin != null && best != null && aMin === best;
                                  if (isBest) return <Award className="h-3.5 w-3.5 text-emerald-600" />;
                                  if (a.kind === "current" || d == null || d === 0) return null;
                                  const up = d > 0;
                                  const Icon = up ? ArrowUpRight : ArrowDownRight;
                                  return <Icon className={`h-3.5 w-3.5 ${toneClass(tone)}`} />;
                                })()}
                              </div>
                              <div className="relative mt-1 h-4 w-fit">
                                <div className="absolute inset-0 text-[11px] text-muted-foreground transition-opacity group-hover:opacity-0">min</div>
                                <div className={`absolute inset-0 text-[11px] ${toneClass(tone)} opacity-0 transition-opacity group-hover:opacity-100`}>{d != null ? formatDelta(d, (n) => `${n} min`) : "Nuvarande"}</div>
                              </div>
                            </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Desktop row */}
                  <div className="hidden sm:block overflow-x-auto border-t">
                    <div className="min-w-[720px] grid" style={{ gridTemplateColumns: gridTemplate }}>
                      <div className="px-4 py-4 text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-3.5 w-3.5" /><span>{p.label || "Plats"}</span></div>
                      {columns.map((a) => {
                        const accTimes = commuteFor(a.id);
                        const currTimes = current ? commuteFor(current.id) : {} as Record<string, number>;
                        const aMin = accTimes[p.id];
                        const cMin = current ? currTimes[p.id] : undefined;
                        const d = a.kind !== "current" && cMin != null && aMin != null ? (aMin - cMin) : null;
                        const tone = deltaVariant(d as any, false);
                        return (
                          <div key={a.id + p.id} className="px-4 py-4">
                            <div className="group">
                              <div className="flex items-center gap-1 leading-none">
                                <div className="text-3xl font-bold">{aMin != null ? aMin : ""}</div>
                                {(() => {
                                  const best = bestValue(columns.map((c) => {
                                    const times = commuteFor(c.id);
                                    return times[p.id];
                                  }), /* goodWhenHigher= */ false);
                                  const isBest = aMin != null && best != null && aMin === best;
                                  if (isBest) return <Award className="h-4 w-4 text-emerald-600" />;
                                  if (a.kind === "current" || d == null || d === 0) return null;
                                  const up = d > 0;
                                  const Icon = up ? ArrowUpRight : ArrowDownRight;
                                  return <Icon className={`h-4 w-4 ${toneClass(tone)}`} />;
                                })()}
                              </div>
                              <div className="relative mt-1 h-4 w-fit">
                                <div className="absolute inset-0 text-[11px] text-muted-foreground transition-opacity group-hover:opacity-0">min</div>
                                <div className={`absolute inset-0 text-[11px] ${toneClass(tone)} opacity-0 transition-opacity group-hover:opacity-100`}>{d != null ? formatDelta(d, (n) => `${n} min`) : "Nuvarande"}</div>
                              </div>
                            </div>
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
    </div>
  );
}

