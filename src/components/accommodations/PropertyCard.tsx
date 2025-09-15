"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { MapPin, Home, Ruler, CircleDollarSign, ArrowRight, ArrowLeft, Calendar, Pencil, Trash2, PiggyBank } from "lucide-react";
import type { Accommodation } from "@/lib/accommodations";
import { useAccommodations } from "@/lib/accommodations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer } from "vaul";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import TransitDrawer, { TransitDrawerContext } from "@/components/route/TransitDrawer";
import TotalCostDrawer from "@/components/accommodations/TotalCostDrawer";

export type PropertyCardProps = {
  item: Accommodation;
  className?: string;
};

function formatSek(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr";
}

function LucideIcon({ name, className }: { name?: string; className?: string }) {
  const Cmp = (name ? (Icons as any)[name] : null) || Icons.MapPin;
  return <Cmp className={className} />;
}

export default function PropertyCard({ item, className }: PropertyCardProps) {
  const pricePerSqm = React.useMemo(() => {
    if (!item.begartPris || !item.boarea || item.boarea === 0) return undefined;
    return Math.round(item.begartPris / item.boarea);
  }, [item.begartPris, item.boarea]);

  const listingPrice = item.begartPris ?? (item.kind === "current" ? item.currentValuation : undefined);

  const locationLine = React.useMemo(() => {
    if (item.postort || item.kommun) {
      return [item.postort, item.kommun].filter(Boolean).join(", ");
    }
    return item.address;
  }, [item.postort, item.kommun, item.address]);

  // viktiga platser and commute times (to/from)
  const { places, commuteForTwo, remove, update } = useAccommodations();

  // Down payment (15% of price) or current = market value - loan
  const downPayment = React.useMemo(() => {
    const price = listingPrice;
    if (item.kind === "current") {
      const val = item.currentValuation ?? price ?? 0;
      if (item.lan != null) {
        const dp = Math.max(0, Math.round(val - (item.lan || 0)));
        return dp;
      }
    }
    return price != null ? Math.round(price * 0.15) : undefined;
  }, [item.kind, item.currentValuation, item.lan, listingPrice]);
  const times = commuteForTwo(item.id);
  const listedPlaces = React.useMemo(() => (places || []).filter(p => p.label || p.address), [places]);

  // local drawers/state
  const [editOpen, setEditOpen] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(item.title);
  const [editAddress, setEditAddress] = React.useState(item.address ?? "");

  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const [transitOpen, setTransitOpen] = React.useState(false);
  const [transitCtx, setTransitCtx] = React.useState<TransitDrawerContext | null>(null);
  const openTransit = React.useCallback((ctx: TransitDrawerContext) => { setTransitCtx(ctx); setTransitOpen(true); }, []);

  const [costOpen, setCostOpen] = React.useState(false);

  return (
    <div className={cn("bg-card rounded-2xl border border-border overflow-hidden shadow-sm", className)}>
      <div className="lg:flex">
        {/* Image */}
        <div className="relative lg:w-80 h-56 lg:h-auto lg:flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.imageUrl || "https://picsum.photos/seed/home/640/360"}
            alt={item.title}
            className="w-full h-full object-cover"
          />
          {pricePerSqm != null && (
            <div className="absolute bottom-3 left-3 bg-background/95 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-semibold border">
              {pricePerSqm.toLocaleString("sv-SE")} kr/m²
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 lg:p-6 space-y-5">
          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-lg md:text-xl font-bold line-clamp-2">{item.title}</h3>
                {locationLine && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="size-4" />
                    <span className="truncate">{locationLine}</span>
                  </div>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {(() => {
                  const src = (item.metrics as any)?.sourceUrls ?? {};
                  const hemnet: string | undefined = src?.hemnet ?? undefined;
                  const realtor: string | undefined = src?.realtor ?? undefined;
                  return (
                    <>
                      {hemnet && (
                        <a href={hemnet} target="_blank" rel="noopener noreferrer" className="text-xs underline decoration-dotted hover:decoration-solid text-primary">
                          Hemnet
                        </a>
                      )}
                      {realtor && (
                        <a href={realtor} target="_blank" rel="noopener noreferrer" className="text-xs underline decoration-dotted hover:decoration-solid text-primary">
                          Mäklare
                        </a>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="shrink-0 -mt-1 -me-1 flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Redigera" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" aria-label="Ta bort" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Price/Total chips row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-xl bg-muted/40 p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CircleDollarSign className="size-4" />
                  <span className="text-xs font-medium">Pris</span>
                </div>
                <div className="text-lg font-semibold">{formatSek(listingPrice)}</div>
              </div>
              <button type="button" onClick={() => setCostOpen(true)} className="text-left rounded-xl bg-muted/40 p-3 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer transition-transform transform-gpu hover:-translate-y-[1px] hover:shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CircleDollarSign className="size-4" />
                  <span className="text-xs font-medium">Totalkostnad</span>
                </div>
                <div className="text-lg font-semibold">{item.totalMonthlyCost != null ? `${item.totalMonthlyCost.toLocaleString("sv-SE")} kr/mån` : "—"}</div>
              </button>
              <div className="rounded-xl bg-muted/40 p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <PiggyBank className="size-4" />
                  <span className="text-xs font-medium">Inköpspris (15%)</span>
                </div>
                <div className="text-lg font-semibold">{downPayment != null ? `${downPayment.toLocaleString("sv-SE")} kr` : "—"}</div>
              </div>
            </div>
          </div>

          {/* Stats chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="size-4" />
                <span className="text-xs font-medium">Byggår</span>
              </div>
              <div className="text-lg font-semibold">{item.constructionYear ?? "—"}</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Home className="size-4" />
                <span className="text-xs font-medium">Rum</span>
              </div>
              <div className="text-lg font-semibold">{item.antalRum ?? "—"}</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Ruler className="size-4" />
                <span className="text-xs font-medium">Storlek</span>
              </div>
              <div className="text-lg font-semibold">{item.boarea != null ? `${item.boarea} m²` : "—"}</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CircleDollarSign className="size-4" />
                <span className="text-xs font-medium">Avgift</span>
              </div>
              <div className="text-lg font-semibold">{item.hyra != null ? `${item.hyra.toLocaleString("sv-SE")} kr/mån` : "—"}</div>
            </div>
          </div>

          {/* Viktiga platser */}
          {listedPlaces.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Restider till viktiga platser</div>
              <div className="space-y-2">
                {listedPlaces.map((p) => {
                  const t = times[p.id];
                  const toMin = t?.to; // arriveBy
                  const fromMin = t?.from; // leaveAt
                  return (
                    <div key={p.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <LucideIcon name={p.icon} className="h-4 w-4 text-muted-foreground" />
                        <div className="truncate text-md">{p.label || p.address || "Plats"}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <button type="button" className="inline-flex items-center gap-1 rounded-md border px-2 py-1 bg-background hover:bg-muted/50" onClick={() => openTransit({ origin: item.address ?? item.title, destination: p.address ?? p.label, arriveBy: p.arriveBy, direction: "to" })}>
                          <ArrowRight className="h-4.5 w-4.5 text-muted-foreground" />
                          <span className="text-lg font-medium">{toMin != null ? toMin : "—"}</span>
                          <span className="text-lg text-muted-foreground">min</span>
                        </button>
                        <button type="button" className="inline-flex items-center gap-1 rounded-md border px-2 py-1 bg-background hover:bg-muted/50" onClick={() => openTransit({ origin: item.address ?? item.title, destination: p.address ?? p.label, leaveAt: p.leaveAt, direction: "from" })}>
                          <ArrowLeft className="h-4.5 w-4.5 text-muted-foreground" />
                          <span className="font-medium text-lg">{fromMin != null ? fromMin : "—"}</span>
                          <span className="text-lg text-muted-foreground">min</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Drawers & dialogs */}
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ta bort bostad?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta går inte att ångra. Bostaden tas bort från listan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={() => { setConfirmOpen(false); remove(item.id); }}>Ta bort</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Drawer.Root open={editOpen} onOpenChange={setEditOpen}>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-40 bg-background/80" />
              <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 h-[70vh] rounded-t-2xl border border-border/60 bg-card p-4 sm:p-6 shadow-xl md:right-0 md:inset-y-0 md:inset-x-auto md:h-full md:w-[520px] md:rounded-t-none md:rounded-l-2xl">
                <div className="mx-auto max-w-screen-md h-full flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold leading-tight">Redigera bostad</div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.title}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setEditOpen(false)}>Stäng</Button>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Titel</div>
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Adress</div>
                      <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                    </div>
                    <div className="pt-2 flex justify-end">
                      <Button onClick={() => { update(item.id, { title: editTitle, address: editAddress }); setEditOpen(false); }}>Spara</Button>
                    </div>
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          <TransitDrawer open={transitOpen} onOpenChange={setTransitOpen} context={transitCtx} />

          <TotalCostDrawer open={costOpen} onOpenChange={setCostOpen} item={item} />


        </div>
      </div>
    </div>
  );
}

