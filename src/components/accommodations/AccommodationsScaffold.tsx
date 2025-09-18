"use client";

import { useEffect, useState } from "react";
import { Building2, Pencil, Trash2, X, CircleDollarSign, Ruler, BedDouble, Square, Briefcase, ShoppingCart, School, Clock, Users, Asterisk, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccommodations } from "@/lib/accommodations";

import { cn } from "@/lib/utils";
import { Drawer } from "vaul";
import { KeyValueGroup, KeyValueRow } from "@/components/ui/key-value";
import { Select } from "@/components/ui/select";


import TransitDrawer, { TransitDrawerContext } from "@/components/route/TransitDrawer";

import MapEmbed from "@/components/map/MapEmbed";
import { buildPlaceEmbedUrl, buildDirectionsEmbedUrl, pickEmbedKey } from "@/lib/mapsEmbedUrl";

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


export function AccommodationsScaffold({ mapsApiKey }: { mapsApiKey?: string }) {
  const { accommodations, current, places, commuteFor, remove, update, addOrUpdateCurrentMock, upsertCurrentFromUser } = useAccommodations();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmItem = accommodations.find((x) => x.id === confirmId);
  const activeId = hoveredId ?? selectedId;
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [detailsTab, setDetailsTab] = useState<"basic" | "cost" | "travel">("basic");
  const detailsItem = accommodations.find((x) => x.id === detailsId) ?? null;
  const maintenancePerMonth = detailsItem ? Math.round((detailsItem.driftkostnader ?? 0) / 12) : 0;
  const isMd = useMediaQuery("(min-width: 768px)");

  // Transit drawer state
  const [transitOpen, setTransitOpen] = useState(false);
  // Google Maps Embed state
  const resolvedKey = pickEmbedKey(mapsApiKey);
  const selected = accommodations.find((x) => x.id === selectedId) ?? current ?? accommodations[0] ?? null;
  const selectedQuery = selected?.address || selected?.title;
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | "">("");
  const selectedPlace = (places ?? []).find((p) => p.id === selectedPlaceId) ?? null;
  const destinationQuery = selectedPlace?.address || selectedPlace?.label;
  const embedSrc = resolvedKey && selectedQuery
    ? (destinationQuery
        ? buildDirectionsEmbedUrl(resolvedKey, selectedQuery, destinationQuery, "transit")
        : buildPlaceEmbedUrl(resolvedKey, selectedQuery))
    : undefined;

  const [transitCtx, setTransitCtx] = useState<TransitDrawerContext | null>(null);
  function openTransit(ctx: TransitDrawerContext) { setTransitCtx(ctx); setTransitOpen(true); }


  // Edit drawer state
  const [editId, setEditId] = useState<string | null>(null);
  const editItem = accommodations.find((x) => x.id === editId) ?? null;
  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (!editItem) return;
    setForm({
      title: editItem.title ?? "",
      address: editItem.address ?? "",
      imageUrl: editItem.imageUrl ?? "",
      boarea: editItem.boarea ?? "",
      antalRum: editItem.antalRum ?? "",
      tomtarea: editItem.tomtarea ?? "",
      hyra: editItem.hyra ?? "",
      driftkostnader: editItem.driftkostnader ?? "",
      begartPris: editItem.begartPris ?? "",
      lan: editItem.lan ?? "",
      kontantinsats: editItem.kontantinsats ?? "",
      amorteringPerManad: editItem.amorteringPerManad ?? "",
      rantaPerManad: editItem.rantaPerManad ?? "",
    });
  }, [editItem]);


  // Helpers for formatting and delta styling

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
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-4 md:py-0 md:h-[calc(100dvh-3.5rem)] md:overflow-hidden">
      <div className="grid md:h-full gap-6 md:grid-cols-[360px_1fr] lg:grid-cols-[400px_1fr]">
        {/* Left rail */}
        <aside className="space-y-6 border-e border-border py-6 md:overflow-y-auto">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Jämför dina</h1>
            <p className="text-3xl font-extrabold leading-tight tracking-tight text-primary sm:text-4xl">drömbostäder</p>
            <p className="mt-3 max-w-prose text-sm text-muted-foreground">
              Klistra in en Hemnet‑länk och se hur din drömbostad ligger till gentemot dina viktiga platser.
            </p>
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
                    "rounded-xl border border-border/60 bg-card/80 overflow-hidden shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60 cursor-pointer transition",
                    "hover:border-primary/40 hover:ring-1 hover:ring-primary/30",
                    isActive && "border-primary/60 ring-1 ring-primary/40 bg-primary/5"
                  )}
                >
                  {a.imageUrl ? (
                    // biome-ignore lint/a11y/noImgElement: decorative
                    <img src={a.imageUrl} alt="" className="h-28 w-full object-cover" />
                  ) : (
                    <div className="h-28 w-full bg-muted" />
                  )}
                  <div className="p-4">
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
                    <div className="shrink-0 -mt-1 -me-1 flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Redigera"
                        onClick={() => setEditId(a.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        aria-label="Ta bort"
                        onClick={() => setConfirmId(a.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                            value={
                              <>
                                <span className="inline-flex items-center gap-1">
                                  <span>{formatSek(a.totalMonthlyCost)}</span>
                                  {a.maintenanceUnknown ? (
                                    <span title="Driftkostnad saknas - total manadskostnad exkluderar drift">
                                      <Asterisk className="h-3 w-3 text-muted-foreground" />
                                    </span>
                                  ) : null}
                                </span>
                                {a.totalMonthlyCost != null && " / mån"}
                              </>
                            }
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
                                value={<button className="underline decoration-dotted hover:decoration-solid" onClick={() => openTransit({ origin: a.address ?? a.title, destination: p.address ?? p.label, arriveBy: p.arriveBy, direction: "to" })}>{formatMinutes(aMin)}</button>}
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
                </div>
              );
            })}
          </div>
        </aside>

        {/* Google Maps Embed panel */}
        <section className="relative md:h-full md:overflow-hidden rounded-2xl border border-border/60">
          <MapEmbed src={embedSrc} className="absolute inset-0 rounded-2xl" />

          {/* Top info banner (moved to bottom-left to avoid covering map info window) */}
          <div className="absolute left-6 bottom-6 z-20 max-w-lg rounded-xl border border-border/60 bg-card/80 p-4 text-sm shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="font-medium">Google Maps</div>
            <div className="text-muted-foreground">Klicka på en bostad till vänster för att visa platsen i kartan.</div>
            {!resolvedKey && (
              <div className="mt-2 text-xs text-destructive">
                Saknar API‑nyckel. Lägg till <code>google-map-api-key</code> eller <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> i .env.local.
              </div>
            )}
          </div>

          {/* Viktiga platser selector (over the map, higher z-index) */}
          <div className="absolute top-6 right-6 z-30 rounded-xl border border-border/60 bg-card/90 p-2 text-sm shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Viktig plats</span>
              <Select
                value={selectedPlaceId}
                onChange={(e) => setSelectedPlaceId(e.target.value)}
                className="h-8 px-2 py-1 min-w-56"
              >
                <option value="">Ingen</option>
                {places.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label || p.address || "Plats"}
                  </option>
                ))}
              </Select>
            </div>
          </div>

        </section>

        <AlertDialog open={!!confirmId} onOpenChange={(open) => { if (!open) { setConfirmId(null); } }}>
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




        {/* Edit drawer (Vaul) */}
        <Drawer.Root open={!!editItem} onOpenChange={(o) => { if (!o) setEditId(null); }} direction={isMd ? "right" : "bottom"}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-background/80" />
            <Drawer.Content className="fixed z-50 overflow-hidden border border-border/60 bg-card p-4 sm:p-6 shadow-xl inset-x-0 bottom-0 h-[70vh] rounded-t-2xl md:inset-y-0 md:right-0 md:inset-x-auto md:h-full md:w-[520px] md:rounded-t-none md:rounded-l-2xl">
              <div className="mx-auto max-w-screen-md h-full flex flex-col">
                <Drawer.Handle className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border md:hidden shrink-0" />

                <div className="flex items-start justify-between gap-3 shrink-0">
                  <div>
                    <div className="font-semibold leading-tight">Redigera bostad</div>
                    <div className="mt-1 text-xs text-muted-foreground">{editItem?.title}</div>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Stäng" onClick={() => setEditId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <form
                  className="mt-4 grow overflow-y-auto space-y-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!editId) return;
                    const toNum = (v: any) => (v === "" || v == null ? undefined : Number(String(v).replace(/\s/g, "")));
                    const driftRaw = toNum(form.driftkostnader);
                    update(editId, {
                      title: form.title || undefined,
                      address: form.address || undefined,
                      imageUrl: form.imageUrl || undefined,
                      boarea: toNum(form.boarea),
                      antalRum: toNum(form.antalRum),
                      tomtarea: toNum(form.tomtarea),
                      hyra: toNum(form.hyra),
                      driftkostnader: driftRaw === 0 ? undefined : driftRaw,
                      begartPris: toNum(form.begartPris),
                      lan: toNum(form.lan),
                      kontantinsats: toNum(form.kontantinsats),
                      amorteringPerManad: toNum(form.amorteringPerManad),
                      rantaPerManad: toNum(form.rantaPerManad),
                    });
                    setEditId(null);
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="title">Titel</Label>
                      <Input id="title" value={form.title ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="imageUrl">Bild-URL</Label>
                      <Input id="imageUrl" value={form.imageUrl ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, imageUrl: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="address">Adress</Label>
                      <Input id="address" value={form.address ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, address: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="boarea">Boarea (m²)</Label>
                      <Input id="boarea" inputMode="numeric" value={form.boarea ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, boarea: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="antalRum">Rum</Label>
                      <Input id="antalRum" inputMode="numeric" value={form.antalRum ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, antalRum: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="tomtarea">Tomtarea (m²)</Label>
                      <Input id="tomtarea" inputMode="numeric" value={form.tomtarea ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, tomtarea: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="hyra">Hyra / mån</Label>
                      <Input id="hyra" inputMode="numeric" value={form.hyra ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, hyra: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="driftkostnader">Drift / år</Label>
                      <Input id="driftkostnader" inputMode="numeric" value={form.driftkostnader ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, driftkostnader: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="begartPris">Begärt pris</Label>
                      <Input id="begartPris" inputMode="numeric" value={form.begartPris ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, begartPris: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="lan">Lån</Label>
                      <Input id="lan" inputMode="numeric" value={form.lan ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, lan: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="kontantinsats">Kontantinsats</Label>
                      <Input id="kontantinsats" inputMode="numeric" value={form.kontantinsats ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, kontantinsats: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="amorteringPerManad">Amortering / mån</Label>
                      <Input id="amorteringPerManad" inputMode="numeric" value={form.amorteringPerManad ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, amorteringPerManad: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="rantaPerManad">Ränta / mån</Label>
                      <Input id="rantaPerManad" inputMode="numeric" value={form.rantaPerManad ?? ""} onChange={(e) => setForm((f: any) => ({ ...f, rantaPerManad: e.target.value }))} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setEditId(null)}>Avbryt</Button>
                    <Button type="submit">Spara</Button>
                  </div>
                </form>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>


        {/* Details drawer using Vaul */}
        <Drawer.Root open={!!detailsItem} onOpenChange={(o) => { if (!o) setDetailsId(null); }} direction={isMd ? "right" : "bottom"}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-40 bg-background/80" />
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
                    <>
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
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Byggår</div>
                        <div>{detailsItem.constructionYear ?? "—"}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Energiklass</div>
                        <div>{(detailsItem.metrics as any)?.meta?.energyClass ?? "—"}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Dagar på Hemnet</div>
                        <div>{(detailsItem.metrics as any)?.hemnetStats?.daysOnHemnet ?? "—"}</div>
                      </div>
                      <div className="rounded-md border p-3">
                        <div className="text-xs text-muted-foreground">Visningar</div>
                        <div>{(detailsItem.metrics as any)?.hemnetStats?.timesViewed ?? "—"}</div>
                      </div>
                    </div>

                    {/* Open houses */}
                    {Array.isArray((detailsItem.metrics as any)?.openHouses) && ((detailsItem.metrics as any)?.openHouses?.length ?? 0) > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Calendar className="h-4 w-4" />
                          <span>Visningar</span>
                        </div>
                        <div className="space-y-2">
                          {((detailsItem.metrics as any)?.openHouses as any[]).map((oh, idx) => (
                            <div key={idx} className="rounded-md border p-3 flex items-center justify-between gap-3 text-xs">
                              <div className="text-muted-foreground">
                                {new Date(oh.start).toLocaleString("sv-SE", { dateStyle: "medium", timeStyle: "short" })}
                                {" — "}
                                {new Date(oh.end).toLocaleString("sv-SE", { timeStyle: "short" })}
                              </div>
                              {oh.description && <div className="truncate">{oh.description}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sources */}
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Källor</div>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {(() => {
                          const src = (detailsItem.metrics as any)?.sourceUrls ?? {};
                          const hemnet: string | undefined = src?.hemnet ?? undefined;
                          const realtor: string | undefined = src?.realtor ?? undefined;
                          return (
                            <>
                              {hemnet && (
                                <a href={hemnet} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:decoration-solid text-primary">
                                  Hemnet
                                </a>
                              )}
                              {realtor && (
                                <a href={realtor} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:decoration-solid text-primary">
                                  Mäklare
                                </a>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    </>
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




        <TransitDrawer open={transitOpen} onOpenChange={setTransitOpen} context={transitCtx} />


      </div>
    </div>
  );
}

