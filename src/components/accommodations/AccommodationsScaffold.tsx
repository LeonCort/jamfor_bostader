"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, MoreHorizontal, X, CircleDollarSign, Ruler, BedDouble, Square, Briefcase, ShoppingCart, School, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAccommodations } from "@/lib/accommodations";
import { cn } from "@/lib/utils";
import { Drawer } from "vaul";
import { KeyValueGroup, KeyValueRow } from "@/components/ui/key-value";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CurrencyInput, PercentInput } from "@/components/ui/formatted-input";
import { GridPattern } from "@/components/magicui/grid-pattern";


function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
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


function formatSek(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr";
}

// Swedish number helpers for inputs (comma decimals, space groupings)
const nfSE2 = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function parseSwedishNumber(input?: string | null): number | undefined {
  if (input == null) return undefined;
  const s = String(input).trim().replace(/\s/g, "").replace(",", ".");
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export function AccommodationsScaffold() {
  const { accommodations, current, places, commuteFor, addMock, addOrUpdateCurrentMock, remove, upsertCurrentFromUser, replacePlaces } = useAccommodations();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placesOpen, setPlacesOpen] = useState(false);
  const [placeRows, setPlaceRows] = useState<Array<{ id?: string; label: string; address: string; icon?: string }>>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmItem = accommodations.find((x) => x.id === confirmId);
  const activeId = hoveredId ?? selectedId;
  const hasActive = !!activeId;
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [detailsTab, setDetailsTab] = useState<"basic" | "cost" | "travel">("basic");
  const detailsItem = accommodations.find((x) => x.id === detailsId) ?? null;
  const maintenancePerMonth = detailsItem ? Math.round((detailsItem.driftkostnader ?? 0) / 12) : 0;
  const isMd = useMediaQuery("(min-width: 768px)");
  const [currentFormOpen, setCurrentFormOpen] = useState(false);
  const [loanRows, setLoanRows] = useState<Array<{ principal: string; rate: string }>>([{ principal: "", rate: "" }]);

  useEffect(() => {
    if (!currentFormOpen) return;
    const existing = (((current?.metrics as any)?.mortgage?.loans) ?? []) as Array<{ principal?: number; interestRateAnnual?: number }>;
    if (existing && existing.length > 0) {
      setLoanRows(
        existing.map((l) => ({
          principal: l?.principal != null ? nfSE2.format(l.principal) : "",
          rate: l?.interestRateAnnual != null ? nfSE2.format(l.interestRateAnnual * 100) : "",
        }))
      );
    } else {
      setLoanRows([{ principal: "", rate: "" }]);
    }
  }, [currentFormOpen, current]);

  useEffect(() => {
    if (!placesOpen) return;
    if (places && places.length > 0) {
      setPlaceRows(places.map(p => ({ id: p.id, label: p.label ?? "", address: p.address ?? "", icon: p.icon })));
    } else {
      setPlaceRows([{ label: "", address: "", icon: "Briefcase" }, { label: "", address: "", icon: "Briefcase" }]);
    }
  }, [placesOpen, places]);

  const ICON_CHOICES = [
    { value: "Briefcase", label: "Arbete – Portfölj" },
    { value: "Building2", label: "Arbete – Byggnad" },
    { value: "School", label: "Skola" },
    { value: "Users", label: "Familj" },
    { value: "ShoppingCart", label: "Butik" },
  ] as const;

  // Helpers for formatting and delta styling
  // Deterministic positions for important places (simulation on grid map)
  function hashString(s: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function seededPlacePosition(id: string): { xPercent: number; yPercent: number } {
    const h = hashString(id);
    const x = 12 + (h % 76); // 12% .. 88%
    const y = 18 + ((h >>> 8) % 64); // 18% .. 82%
    return { xPercent: x, yPercent: y };
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


  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
      <div className="grid gap-6 md:grid-cols-[360px_1fr] lg:grid-cols-[400px_1fr]">
        {/* Left rail */}
        <aside className="space-y-6 border-e border-border pe-6 py-6">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Jämför dina</h1>
            <p className="text-3xl font-extrabold leading-tight tracking-tight text-primary sm:text-4xl">drömbostäder</p>
            <p className="mt-3 max-w-prose text-sm text-muted-foreground">
              Klistra in en Hemnet‑länk och se hur din drömbostad ligger till gentemot dina viktiga platser.
            </p>
          </div>

          <div className="space-y-3">
            <input
              type="url"
              placeholder="Klistra in en Hemnet‑länk här…"
              className="w-full rounded-lg border border-transparent bg-secondary/70 px-3 py-2 text-sm text-foreground shadow-sm outline-none ring-0 transition placeholder:text-muted-foreground/80 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary/50"
            />
            <Button className="h-10 w-full shadow-sm">Analysera bostad</Button>
            <Button type="button" variant="secondary" className="h-10 w-full shadow-sm" onClick={() => addMock()}>
              Lägg till mockad bostad
            </Button>
            <Button type="button" variant="outline" className="h-10 w-full shadow-sm" onClick={() => addOrUpdateCurrentMock()}>
              Lägg till nuvarande bostad (mock)
            </Button>
            <Button type="button" variant="ghost" className="h-10 w-full shadow-sm" onClick={() => setCurrentFormOpen(true)}>
              Ställ in nuvarande bostad
            </Button>
            <Button type="button" variant="ghost" className="h-10 w-full shadow-sm" onClick={() => setPlacesOpen(true)}>
              Ställ in viktiga platser
            </Button>
          </div>

          {/* Cards list */}
          <div className="space-y-3">
            {accommodations.map((a) => {
              const isActive = activeId === a.id;
              return (
                <div
                  key={a.id}
                  role="button"
                  tabIndex={0}
                  onMouseEnter={() => setHoveredId(a.id)}
                  onMouseLeave={() => setHoveredId((prev) => (prev === a.id ? null : prev))}
                  onClick={() => setSelectedId((prev) => (prev === a.id ? null : a.id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedId((prev) => (prev === a.id ? null : a.id));
                    }
                  }}
                  className={cn(
                    "rounded-xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 cursor-pointer transition",
                    "hover:border-primary/40 hover:ring-1 hover:ring-primary/30",
                    isActive && "border-primary/60 ring-1 ring-primary/40 bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn("inline-block size-2.5 rounded-full", a.color ?? "bg-slate-500")} />
                        <div className="font-medium leading-tight flex items-center gap-2">
                          <span>{a.title}</span>
                          {a.kind === "current" && (
                            <span className="inline-flex items-center rounded-sm bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/30">
                              Nuvarande
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{a.address}</div>
                    </div>
                    <div className="shrink-0 -mt-1 -me-1">
                      <DropdownMenu open={openMenuId === a.id} onOpenChange={(o) => setOpenMenuId(o ? a.id : null)}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[10rem]">
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={(e) => {
                              e.preventDefault();
                              setOpenMenuId(null);
                              setTimeout(() => setConfirmId(a.id), 0);
                            }}
                          >
                            Ta bort
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Key comparison metrics vs current */}
                  <div className="mt-3">
                    {(() => {
                      const curr = current;
                      const costDelta = curr?.totalMonthlyCost != null && a.totalMonthlyCost != null ? a.totalMonthlyCost - curr.totalMonthlyCost : null;
                      const sizeDelta = curr?.boarea != null && a.boarea != null ? (a.boarea - curr.boarea) : null;
                      const roomsDelta = curr?.antalRum != null && a.antalRum != null ? (a.antalRum - curr.antalRum) : null;
                      const lotDelta = curr?.tomtarea != null && a.tomtarea != null ? (a.tomtarea - curr.tomtarea) : (a.tomtarea ?? null);

                      const costVar = deltaVariant(costDelta, /* goodWhenHigher= */ false);
                      const sizeVar = deltaVariant(sizeDelta, /* goodWhenHigher= */ true);
                      const roomsVar = deltaVariant(roomsDelta, /* goodWhenHigher= */ true);
                      const lotVar = deltaVariant(lotDelta, /* goodWhenHigher= */ true);


                      return (
                        <KeyValueGroup>
                          <KeyValueRow
                            icon={<CircleDollarSign className="h-3.5 w-3.5" />}
                            label="Kostnad"
                            value={<><span>{formatSek(a.totalMonthlyCost)}</span>{a.totalMonthlyCost != null && " / mån"}</>}
                            deltaText={a.kind !== "current" && curr ? formatDelta(costDelta, (n) => formatSek(n)) : null}
                            deltaTone={costVar}
                          />

                          <KeyValueRow
                            icon={<Ruler className="h-3.5 w-3.5" />}
                            label="Storlek"
                            value={<>{a.boarea ?? "—"} m²</>}
                            deltaText={a.kind !== "current" && curr ? formatDelta(sizeDelta, (n) => `${n} m²`) : null}
                            deltaTone={sizeVar}
                          />

                          <KeyValueRow
                            icon={<BedDouble className="h-3.5 w-3.5" />}
                            label="Rum"
                            value={a.antalRum ?? "—"}
                            deltaText={a.kind !== "current" && curr ? formatDelta(roomsDelta, (n) => `${n}`) : null}
                            deltaTone={roomsVar}
                          />

                          {a.tomtarea != null && (
                            <KeyValueRow
                              icon={<Square className="h-3.5 w-3.5" />}
                              label="Area"
                              value={<>{a.tomtarea} m²</>}
                              deltaText={a.kind !== "current" && curr ? formatDelta(lotDelta, (n) => `${n} m²`) : null}
                              deltaTone={lotVar}
                            />
                          )}

                          <div className="pt-1 text-xs text-muted-foreground flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Pendling</span>
                          </div>

                          {places.length === 0 && (
                            <div className="text-xs text-muted-foreground">Inga viktiga platser ännu</div>
                          )}
                          {places.map((p) => {
                            const accTimes = commuteFor(a.id);
                            const currTimes = curr ? commuteFor(curr.id) : {};
                            const aMin = accTimes[p.id];
                            const cMin = curr ? currTimes[p.id] : undefined;
                            const d = a.kind !== "current" && cMin != null && aMin != null ? (aMin - cMin) : null;
                            const tone = deltaVariant(d as any, false);
                            const iconName = p.icon ?? "Building2";
                            const Icon = iconName === "Briefcase" ? Briefcase
                              : iconName === "Building2" ? Building2
                              : iconName === "School" ? School
                              : iconName === "Users" ? Users
                              : ShoppingCart;
                            return (
                              <KeyValueRow
                                key={p.id}
                                icon={<Icon className="h-3.5 w-3.5" />}
                                label={p.label || "Plats"}
                                value={formatMinutes(aMin)}
                                deltaText={d != null ? formatDelta(d, (n) => `${n} min`) : null}
                                deltaTone={tone}
                              />
                            );
                          })}
                        </KeyValueGroup>
                      );
                    })()}
                  </div>

                  <div className="mt-2">
                    <Button variant="ghost" size="sm" onClick={() => { setDetailsId(a.id); setDetailsTab("basic"); }}>
                      Visa detaljer
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Map/visualization area */}
        <section className="relative h-[calc(100vh-12rem)] rounded-2xl border border-border/60">
          <GridPattern width={24} height={24} className="fill-border/25 stroke-border/25 dark:fill-border/15" />
          {/* Top info banner */}
          <div className="absolute left-6 right-6 top-6 z-10 rounded-xl border border-border/60 bg-card/80 p-4 text-sm shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="font-medium">Dina bostäder</div>
            <div className="text-muted-foreground">Kartan visar dina tillagda bostäder. Senare kompletterar vi med restider, kostnader m.m.</div>
          </div>

          {/* Accommodation markers */}
          {accommodations.map((a) => {
            const isActive = activeId === a.id;
            return (
              <div
                key={a.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${a.position.xPercent}%`, top: `${a.position.yPercent}%` }}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-white shadow transition-transform",
                    a.color ?? "bg-slate-500",
                    isActive ? "ring-4 ring-primary scale-110" : "ring-2 ring-border/50",
                    hasActive && !isActive ? "opacity-60" : ""
                  )}
                  title={a.title}
                >
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="mt-2 w-max rounded-md bg-card/80 px-3 py-2 text-xs shadow-sm ring-1 ring-border/60 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-muted-foreground">{a.address}</div>
                </div>
              </div>
            );
          })}

          {/* Important place markers */}
          {(places ?? []).filter((p) => p.id).map((p) => {
            const { xPercent, yPercent } = seededPlacePosition(p.id!);
            const iconName = p.icon ?? "Building2";
            const Icon = iconName === "Briefcase" ? Briefcase
              : iconName === "Building2" ? Building2
              : iconName === "School" ? School
              : iconName === "Users" ? Users
              : ShoppingCart;
            return (
              <div
                key={`place-${p.id}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-white shadow ring-2 ring-border/50 bg-slate-700",
                    hasActive ? "opacity-80" : ""
                  )}
                  title={p.label ?? "Viktig plats"}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="absolute left-6 bottom-6 rounded-lg border border-border/60 bg-card/80 p-3 text-xs shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="font-medium">Bostäder</div>
            <div className="mt-2 space-y-1">
              {accommodations.map((a) => {
                const isActive = activeId === a.id;
                return (

                  <div key={a.id} className="flex items-center gap-2">
                    <span className={cn("inline-block size-2.5 rounded-full", a.color ?? "bg-slate-500", hasActive && !isActive && "opacity-60")} />
                    <span className={cn("text-muted-foreground", hasActive && !isActive && "opacity-60")}>{a.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add button (floating) */}
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-6 right-6 h-10 w-10 rounded-full border border-border/60 bg-card/80 text-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60"
            aria-label="Lägg till mockad bostad"
            onClick={() => addMock()}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </section>

        <AlertDialog open={!!confirmId} onOpenChange={(open) => { if (!open) { setConfirmId(null); setOpenMenuId(null); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ta bort bostad?</AlertDialogTitle>
              <AlertDialogDescription>
                Vill du ta bort "{confirmItem?.title}"? Detta går inte att ångra.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmId(null)}>Avbryt</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (confirmId) {
                    remove(confirmId);
                    if (selectedId === confirmId) setSelectedId(null);
                    if (hoveredId === confirmId) setHoveredId(null);
                  }
                  setConfirmId(null);
                }}
              >
                Ta bort
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Current home setup drawer */}
        <Drawer.Root open={currentFormOpen} onOpenChange={setCurrentFormOpen} direction={isMd ? "right" : "bottom"}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
            <Drawer.Content className="fixed z-50 overflow-hidden border border-border/60 bg-card p-4 sm:p-6 shadow-xl inset-x-0 bottom-0 h-[80vh] rounded-t-2xl md:inset-y-0 md:right-0 md:inset-x-auto md:h-full md:w-[560px] md:rounded-t-none md:rounded-l-2xl">
              <div className="mx-auto max-w-screen-md h-full flex flex-col">
                <Drawer.Handle className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border md:hidden shrink-0" />
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold">Ställ in nuvarande bostad</h2>
                    <p className="text-sm text-muted-foreground">Fyll i de fält du vill. Allt är valfritt.</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setCurrentFormOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form
                  className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget as HTMLFormElement);
                    const num = (v: FormDataEntryValue | null) => parseSwedishNumber((v as string) ?? undefined);
                    const valuation = num(fd.get("valuation"));
                    const loans = loanRows
                      .map((r) => {
                        const principal = parseSwedishNumber(r.principal) ?? NaN;
                        const percent = parseSwedishNumber(r.rate) ?? NaN; // e.g. 2,35
                        const interestRateAnnual = Number.isFinite(percent) ? percent / 100 : NaN;
                        return { principal, interestRateAnnual };
                      })
                      .filter((l) => Number.isFinite(l.principal) && l.principal! > 0 && Number.isFinite(l.interestRateAnnual) && l.interestRateAnnual! > 0);

                    upsertCurrentFromUser({
                      title: (fd.get("title") as string) || undefined,
                      address: (fd.get("address") as string) || undefined,
                      hyra: num(fd.get("hyra")),
                      driftkostnader: num(fd.get("driftkostnader")),
                      antalRum: num(fd.get("antalRum")),
                      boarea: num(fd.get("boarea")),
                      biarea: num(fd.get("biarea")),
                      tomtarea: num(fd.get("tomtarea")),
                      currentValuation: valuation,
                      mortgages: loans.length ? { loans } : undefined,
                    });
                    setCurrentFormOpen(false);
                  }}
                >
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="title">Titel</Label>
                    <Input name="title" id="title" defaultValue={current?.title ?? "Nuvarande hem"} placeholder="Nuvarande hem" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label htmlFor="address">Adress</Label>
                    <Input name="address" id="address" defaultValue={current?.address ?? ""} placeholder="T.ex. Sundbyberg, Stockholm" />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="hyra">Hyra / mån (SEK)</Label>
                    <CurrencyInput name="hyra" id="hyra" defaultValue={current?.hyra ?? ""} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="driftkostnader">Driftkostnader / år (SEK)</Label>
                    <CurrencyInput name="driftkostnader" id="driftkostnader" defaultValue={current?.driftkostnader ?? ""} />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="antalRum">Antal rum</Label>
                    <Input name="antalRum" id="antalRum" type="number" inputMode="numeric" defaultValue={current?.antalRum ?? ""} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="boarea">Boarea (m²)</Label>
                    <Input name="boarea" id="boarea" type="number" inputMode="numeric" defaultValue={current?.boarea ?? ""} />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="biarea">Biarea (m²)</Label>
                    <Input name="biarea" id="biarea" type="number" inputMode="numeric" defaultValue={current?.biarea ?? ""} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="tomtarea">Tomtarea (m²)</Label>
                    <Input name="tomtarea" id="tomtarea" type="number" inputMode="numeric" defaultValue={current?.tomtarea ?? ""} />
                  </div>

                  <div className="space-y-1 sm:col-span-2 pt-1">
                    <Label htmlFor="valuation">Marknadsvärde (SEK)</Label>
                    <CurrencyInput name="valuation" id="valuation" defaultValue={current?.currentValuation ?? ""} />
                  </div>

                  <div className="sm:col-span-2 pt-2">
                    <div className="text-sm font-medium mb-1">Bolån</div>
                    <div className="space-y-2">
                      {loanRows.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                          <div className="space-y-1">
                            <Label>Belopp (SEK)</Label>
                            <CurrencyInput value={row.principal} onValueChange={({ formattedValue }) => setLoanRows((rs) => rs.map((r,i) => i===idx ? { ...r, principal: formattedValue } : r))} />
                          </div>
                          <div className="space-y-1">
                            <Label>Ränta (% år)</Label>
                            <PercentInput value={row.rate} onValueChange={({ formattedValue }) => setLoanRows((rs) => rs.map((r,i) => i===idx ? { ...r, rate: formattedValue } : r))} />
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setLoanRows((rs) => rs.filter((_,i) => i!==idx))}>Ta bort</Button>
                          </div>
                        </div>
                      ))}
                      <div>
                        <Button type="button" variant="secondary" size="sm" onClick={() => setLoanRows((rs) => [...rs, { principal: "", rate: "" }])}>Lägg till lån</Button>
                      </div>
                    </div>
                  </div>


                  <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setCurrentFormOpen(false)}>Avbryt</Button>
                    <Button type="submit">Spara</Button>

                  </div>
                </form>

                <div className="h-2" />
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {/* Important places drawer */}
        <Drawer.Root open={placesOpen} onOpenChange={setPlacesOpen} direction={isMd ? "right" : "bottom"}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
            <Drawer.Content className="fixed z-50 overflow-hidden border border-border/60 bg-card p-4 sm:p-6 shadow-xl inset-x-0 bottom-0 h-[75vh] rounded-t-2xl md:inset-y-0 md:right-0 md:inset-x-auto md:h-full md:w-[520px] md:rounded-t-none md:rounded-l-2xl">
              <div className="mx-auto max-w-screen-md h-full flex flex-col">
                <Drawer.Handle className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border md:hidden shrink-0" />

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold">Ställ in viktiga platser</h2>
                    <p className="text-sm text-muted-foreground">Lägg till destinationer som du bryr dig om. Dessa kan användas för framtida pendling.</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setPlacesOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="h-4" />

                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-3">
                    {placeRows.map((row, idx) => (
                      <div key={row.id ?? idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end border border-border/60 rounded-md p-3">
                        <div className="space-y-1">
                          <Label>Etikett</Label>
                          <Input
                            value={row.label}
                            onChange={(e) => setPlaceRows((rs) => rs.map((r, i) => i === idx ? { ...r, label: e.target.value } : r))}
                            placeholder={idx === 0 ? "Arbetsplats 1" : idx === 1 ? "Arbetsplats 2" : "T.ex. Skola"}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Adress</Label>
                          <Input
                            value={row.address}
                            onChange={(e) => setPlaceRows((rs) => rs.map((r, i) => i === idx ? { ...r, address: e.target.value } : r))}
                            placeholder="T.ex. Kungsgatan 1, Stockholm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Ikon</Label>
                          <Select value={row.icon ?? ""} onChange={(e) => setPlaceRows((rs) => rs.map((r,i)=> i===idx ? { ...r, icon: e.target.value } : r))}>
                            <option value="">Välj ikon…</option>
                            {ICON_CHOICES.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </Select>
                        </div>
                        <div className="sm:col-span-3 flex justify-end pt-1">
                          <Button type="button" variant="outline" size="sm" onClick={() => setPlaceRows((rs) => rs.filter((_, i) => i !== idx))}>Ta bort</Button>
                        </div>
                      </div>
                    ))}

                    <div>
                      <Button type="button" variant="secondary" size="sm" onClick={() => setPlaceRows((rs) => [...rs, { label: "", address: "" }])}>Lägg till plats</Button>
                    </div>
                  </div>
                </div>

                <div className="h-4" />
                <div className="flex items-center justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={() => setPlacesOpen(false)}>Avbryt</Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const cleaned = placeRows
                        .map((p) => ({ id: p.id, label: p.label?.trim() || undefined, address: p.address?.trim() || undefined, icon: p.icon?.trim() || undefined }))
                        .filter((p) => p.label || p.address);
                      replacePlaces(cleaned.length > 0 ? cleaned : [{}, {}]);
                      setPlacesOpen(false);
                    }}
                  >
                    Spara
                  </Button>
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {/* Details drawer using Vaul */}
        <Drawer.Root open={!!detailsItem} onOpenChange={(o) => { if (!o) setDetailsId(null); }} direction={isMd ? "right" : "bottom"}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />
            <Drawer.Content className="fixed z-50 overflow-hidden border border-border/60 bg-card p-4 sm:p-6 shadow-xl inset-x-0 bottom-0 h-[70vh] rounded-t-2xl md:inset-y-0 md:right-0 md:inset-x-auto md:h-full md:w-[520px] md:rounded-t-none md:rounded-l-2xl">
              <div className="mx-auto max-w-screen-md h-full flex flex-col">
                <Drawer.Handle className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border md:hidden shrink-0" />

                <div className="flex items-start justify-between gap-3 shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-block size-2.5 rounded-full", detailsItem?.color ?? "bg-slate-500")} />
                      <div className="font-semibold leading-tight">{detailsItem?.title}</div>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{detailsItem?.address}</div>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Stäng" onClick={() => setDetailsId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tabs */}
                <div className="mt-4 flex items-center gap-2 border-b border-border/60 shrink-0 bg-card">
                  {([
                    { key: "basic", label: "Grundinfo" },
                    { key: "cost", label: "Kostnader" },
                    { key: "travel", label: "Restid" },
                  ] as const).map((t) => (
                    <button
                      key={t.key}
                      className={cn(
                        "-mb-px select-none rounded-t px-3 py-2 text-xs font-medium transition",
                        detailsTab === t.key
                          ? "border-b-2 border-primary text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => setDetailsTab(t.key)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="mt-4 grow overflow-y-auto">
                  {detailsTab === "basic" && detailsItem && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Adress</div>
                        <div>{detailsItem.address ?? "—"}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Antal rum</div>
                        <div>{detailsItem.antalRum ?? "—"}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Boarea</div>
                        <div>{detailsItem.boarea ?? "—"} m²</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Biarea</div>
                        <div>{detailsItem.biarea ?? "—"} m²</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Tomtarea</div>
                        <div>{detailsItem.tomtarea ?? "—"} m²</div>
                      </div>
                      {detailsItem.kind !== "current" && (
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Begärt pris</div>
                          <div>{formatSek(detailsItem.begartPris)}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {detailsTab === "cost" && detailsItem && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Totalt / mån</div>
                        <div className="font-medium">{formatSek(detailsItem.totalMonthlyCost)}</div>
                      </div>
                      {detailsItem.kind !== "current" && (
                        <>
                          <div className="rounded-md border p-3">
                            <div className="text-xs text-muted-foreground">Kontantinsats</div>
                            <div>{formatSek(detailsItem.kontantinsats)}</div>
                          </div>
                          <div className="rounded-md border p-3">
                            <div className="text-xs text-muted-foreground">Lån</div>
                            <div>{formatSek(detailsItem.lan)}</div>
                          </div>
                        </>
                      )}
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Amortering / mån</div>
                        <div>{formatSek(detailsItem.amorteringPerManad)}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Ränta / mån</div>
                        <div>{formatSek(detailsItem.rantaPerManad)}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Hyra / mån</div>
                        <div>{formatSek(detailsItem.hyra)}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Drift / mån</div>
                        <div>{formatSek(maintenancePerMonth)}</div>
                      </div>
                    </div>
                  )}

                  {detailsTab === "travel" && (
                    <div className="space-y-3 text-sm">
                      {places.length === 0 && (
                        <div className="text-xs text-muted-foreground">Inga viktiga platser nnu</div>
                      )}
                      {places.map((p) => {
                        const times = commuteFor(detailsItem!.id);
                        const min = times[p.id];
                        const iconName = p.icon ?? "Building2";
                        const Icon = iconName === "Briefcase" ? Briefcase
                          : iconName === "Building2" ? Building2
                          : iconName === "School" ? School
                          : iconName === "Users" ? Users
                          : ShoppingCart;
                        return (
                          <div key={p.id} className="rounded-md border p-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <div className="text-xs text-muted-foreground">{p.label || "Plats"}</div>
                            </div>
                            <div>{formatMinutes(min)}</div>
                          </div>
                        );
                      })}
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Till skolan</div>
                        <div>14 min cykel</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Till city</div>
                        <div>18 min bil</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>




      </div>
    </div>
  );
}

