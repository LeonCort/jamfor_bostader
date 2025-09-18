"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { MapPin, Ruler, CircleDollarSign, Calendar, Pencil, Trash2, PiggyBank, X, Bed, Leaf } from "lucide-react";
import type { Accommodation } from "@/lib/accommodations";
import { useAccommodations } from "@/lib/accommodations";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/formatted-input";

import { Drawer } from "vaul";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import TransitDrawer, { TransitDrawerContext } from "@/components/route/TransitDrawer";
import TotalCostDrawer from "@/components/accommodations/TotalCostDrawer";

export type CardFieldKey =
  | "price"
  | "totalMonthlyCost"
  | "downPayment"
  | "constructionYear"
  | "rooms"
  | "livingArea"
  | "plotArea"
  | "monthlyFee"
  | "operatingMonthly"
  | "kontantinsats"
  | "lan"
  | "amortering"
  | "ranta"
  | "energyClass";

function formatMinutes(n?: number) {
  if (n == null) return "—";
  const h = Math.floor(n / 60);
  const m = Math.round(n % 60);
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}


export type CardConfig = {
  showAll?: boolean;
  showCommute?: boolean; // Toggle for showing 'Viktiga platser' on the card
  commuteMode?: 'transit' | 'driving' | 'bicycling';
  order: CardFieldKey[];
  enabled: Partial<Record<CardFieldKey, boolean>>;
};

export type PropertyCardProps = {
  item: Accommodation;
  className?: string;
  config?: CardConfig;
};

function formatSek(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr";
}

function parseSwedishNumber(input?: string): number | undefined {
  if (!input) return undefined;
  const s = String(input).trim().replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function LucideIcon({ name, className }: { name?: string; className?: string }) {
  const Cmp = (name ? (Icons as any)[name] : null) || Icons.MapPin;
  return <Cmp className={className} />;
}

export default function PropertyCard({ item, className, config }: PropertyCardProps) {
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

  // viktiga platser and commute times
  const { places, commuteForMode, remove, update } = useAccommodations();

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

  // Full edit state for KPIs
  const [editBegartPris, setEditBegartPris] = React.useState(item.begartPris != null ? item.begartPris.toLocaleString('sv-SE') : "");
  const [editCurrentValuation, setEditCurrentValuation] = React.useState(item.currentValuation != null ? item.currentValuation.toLocaleString('sv-SE') : "");
  const [editHyra, setEditHyra] = React.useState(item.hyra != null ? item.hyra.toLocaleString('sv-SE') : "");
  const [editDriftkostnader, setEditDriftkostnader] = React.useState(item.driftkostnader != null ? item.driftkostnader.toLocaleString('sv-SE') : "");
  const [editAntalRum, setEditAntalRum] = React.useState(item.antalRum != null ? String(item.antalRum) : "");
  const [editBoarea, setEditBoarea] = React.useState(item.boarea != null ? String(item.boarea) : "");
  const [editBiarea, setEditBiarea] = React.useState(item.biarea != null ? String(item.biarea) : "");
  const [editTomtarea, setEditTomtarea] = React.useState(item.tomtarea != null ? String(item.tomtarea) : "");
  const [editConstructionYear, setEditConstructionYear] = React.useState(item.constructionYear != null ? String(item.constructionYear) : "");
  const [editEnergyClass, setEditEnergyClass] = React.useState(String((((item as any)?.metrics?.meta) as any)?.energyClass ?? ""));

  const startEdit = React.useCallback(() => {
    setEditTitle(item.title);
    setEditAddress(item.address ?? "");
    setEditBegartPris(item.begartPris != null ? item.begartPris.toLocaleString('sv-SE') : "");
    setEditCurrentValuation(item.currentValuation != null ? item.currentValuation.toLocaleString('sv-SE') : "");
    setEditHyra(item.hyra != null ? item.hyra.toLocaleString('sv-SE') : "");
    setEditDriftkostnader(item.driftkostnader != null ? item.driftkostnader.toLocaleString('sv-SE') : "");
    setEditAntalRum(item.antalRum != null ? String(item.antalRum) : "");
    setEditBoarea(item.boarea != null ? String(item.boarea) : "");
    setEditBiarea(item.biarea != null ? String(item.biarea) : "");
    setEditTomtarea(item.tomtarea != null ? String(item.tomtarea) : "");
    setEditConstructionYear(item.constructionYear != null ? String(item.constructionYear) : "");
    setEditEnergyClass(String((((item as any)?.metrics?.meta) as any)?.energyClass ?? ""));
    setEditOpen(true);
  }, [item]);

  const commuteMode = config?.commuteMode ?? 'transit';
  const singleTimes = commuteForMode(item.id, commuteMode);
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

  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [detailsTab, setDetailsTab] = React.useState<'basic' | 'cost' | 'travel'>('basic');

  const maintenancePerMonth = item.driftkostnader != null ? Math.round(item.driftkostnader / 12) : undefined;

  const defaultOrder: CardFieldKey[] = ['price','totalMonthlyCost','downPayment','constructionYear','rooms','energyClass','livingArea','monthlyFee'];
  const allKeys: CardFieldKey[] = [...defaultOrder, 'plotArea','operatingMonthly','kontantinsats','lan','amortering','ranta'];
  const order = config?.order ?? defaultOrder;
  const enabled = config?.enabled ?? {};
  const primaryKeys = order.filter((k) => enabled[k] !== false);
  const keys: CardFieldKey[] = (config?.showAll ? [...primaryKeys, ...allKeys.filter((k) => !primaryKeys.includes(k))] : primaryKeys) as CardFieldKey[];
  const showCommute = config?.showCommute !== false;

  const specs: Record<CardFieldKey, { label: string; icon: any; value: string; clickable?: boolean; onClick?: () => void }> = {
    price: { label: 'Pris', icon: CircleDollarSign, value: formatSek(listingPrice) },
    totalMonthlyCost: { label: 'Totalkostnad', icon: CircleDollarSign, value: item.totalMonthlyCost != null ? `${item.totalMonthlyCost.toLocaleString('sv-SE')} kr/mån` : '—', clickable: true, onClick: () => setCostOpen(true) },
    downPayment: { label: 'Inköpspris (15%)', icon: PiggyBank, value: downPayment != null ? `${downPayment.toLocaleString('sv-SE')} kr` : '—' },
    constructionYear: { label: 'Byggår', icon: Calendar, value: item.constructionYear != null ? String(item.constructionYear) : '—' },
    rooms: { label: 'Rum', icon: Bed, value: item.antalRum != null ? String(item.antalRum) : '—' },
    energyClass: { label: 'Energiklass', icon: Leaf, value: String(((item as any)?.metrics?.meta as any)?.energyClass ?? '—') },
    livingArea: { label: 'Storlek', icon: Ruler, value: item.boarea != null ? `${item.boarea} m²` : '—' },
    plotArea: { label: 'Tomtarea', icon: Ruler, value: item.tomtarea != null ? `${item.tomtarea} m²` : '—' },
    monthlyFee: { label: 'Avgift', icon: CircleDollarSign, value: item.hyra != null ? `${item.hyra.toLocaleString('sv-SE')} kr/mån` : '—' },
    operatingMonthly: { label: 'Drift / mån', icon: CircleDollarSign, value: maintenancePerMonth != null ? `${maintenancePerMonth.toLocaleString('sv-SE')} kr/mån` : '—' },
    kontantinsats: { label: 'Kontantinsats', icon: PiggyBank, value: formatSek(item.kontantinsats) },
    lan: { label: 'Lån', icon: CircleDollarSign, value: formatSek(item.lan) },
    amortering: { label: 'Amortering / mån', icon: CircleDollarSign, value: formatSek(item.amorteringPerManad) },
    ranta: { label: 'Ränta / mån', icon: CircleDollarSign, value: formatSek(item.rantaPerManad) },
  };

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

          {/* Top-left chips over image */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-background/95 backdrop-blur-sm px-2 py-1 text-xs border">
              <Bed className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{item.antalRum != null ? item.antalRum : '—'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-background/95 backdrop-blur-sm px-2 py-1 text-xs border">
              <Leaf className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{String(((item as any)?.metrics?.meta as any)?.energyClass ?? '—')}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-background/95 backdrop-blur-sm px-2 py-1 text-xs border">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{item.constructionYear ?? '—'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-background/95 backdrop-blur-sm px-2 py-1 text-xs border">
              <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{item.boarea != null ? `${item.boarea} m²` : '—'}</span>
            </div>
          </div>

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
                <Button variant="secondary" size="sm" onClick={() => setDetailsOpen(true)}>Visa detaljer</Button>
                {(() => {
                  const src = (item.metrics as any)?.sourceUrls ?? {};
                  const hemnet: string | undefined = src?.hemnet ?? undefined;
                  const realtor: string | undefined = src?.realtor ?? undefined;
                  return (
                    <div className="hidden sm:flex items-center gap-2">
                      {hemnet && (
                        <Button asChild variant="ghost" size="sm" className="gap-1.5">
                          <a href={hemnet} target="_blank" rel="noopener noreferrer">
                            <Icons.ExternalLink className="h-3.5 w-3.5" /> Hemnet
                          </a>
                        </Button>
                      )}
                      {realtor && (
                        <Button asChild variant="ghost" size="sm" className="gap-1.5">
                          <a href={realtor} target="_blank" rel="noopener noreferrer">
                            <Icons.ExternalLink className="h-3.5 w-3.5" /> Mäklare
                          </a>
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Anpassningsbara chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {keys.map((k) => {
                const s = specs[k];
                if (!s) return null;
                const Icon = s.icon;
                const inner = (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Icon className="size-4" />
                      <span className="text-xs font-medium">{s.label}</span>
                    </div>
                    <div className="text-lg font-semibold">{s.value}</div>
                  </>
                );
                return s.clickable ? (
                  <button key={k} type="button" onClick={s.onClick} className="text-left rounded-xl bg-muted/40 p-3 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring transition">
                    {inner}
                  </button>
                ) : (
                  <div key={k} className="rounded-xl bg-muted/40 p-3">{inner}</div>
                );
              })}
            </div>
          </div>

          {/* Restider som metrik-chips */}
          {showCommute && listedPlaces.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {listedPlaces.map((p) => {
                const min = singleTimes[p.id];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openTransit({ origin: item.address ?? item.title, destination: p.address ?? p.label, arriveBy: p.arriveBy, direction: "to" })}
                    className="text-left rounded-xl bg-muted/40 p-3 hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring transition"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <LucideIcon name={p.icon} className="size-4" />
                      <span className="text-xs font-medium">Restid</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground -mt-0.5 mb-1 truncate">– {p.label || p.address || 'Plats'}</div>
                    <div className="text-lg font-semibold">{formatMinutes(min)}</div>
                  </button>
                );
              })}
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
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1 sm:col-span-2">
                      <div className="text-xs text-muted-foreground">Titel</div>
                      <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <div className="text-xs text-muted-foreground">Adress</div>
                      <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                    </div>

                    {item.kind !== 'current' && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Begärt pris</div>
                        <CurrencyInput value={editBegartPris} onValueChange={({ formattedValue }) => setEditBegartPris(formattedValue)} decimalScale={0} />
                      </div>
                    )}
                    {item.kind === 'current' && (
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Marknadsvärde</div>
                        <CurrencyInput value={editCurrentValuation} onValueChange={({ formattedValue }) => setEditCurrentValuation(formattedValue)} decimalScale={0} />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Hyra / mån</div>
                      <CurrencyInput value={editHyra} onValueChange={({ formattedValue }) => setEditHyra(formattedValue)} decimalScale={0} />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Drift / år</div>
                      <CurrencyInput value={editDriftkostnader} onValueChange={({ formattedValue }) => setEditDriftkostnader(formattedValue)} decimalScale={0} />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Antal rum</div>
                      <Input inputMode="numeric" value={editAntalRum} onChange={(e) => setEditAntalRum(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Boarea (m²)</div>
                      <Input inputMode="numeric" value={editBoarea} onChange={(e) => setEditBoarea(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Biarea (m²)</div>
                      <Input inputMode="numeric" value={editBiarea} onChange={(e) => setEditBiarea(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Tomtarea (m²)</div>
                      <Input inputMode="numeric" value={editTomtarea} onChange={(e) => setEditTomtarea(e.target.value)} />
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Byggår</div>
                      <Input inputMode="numeric" value={editConstructionYear} onChange={(e) => setEditConstructionYear(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">Energiklass</div>
                      <Input value={editEnergyClass} onChange={(e) => setEditEnergyClass(e.target.value)} placeholder="t.ex. C" />
                    </div>

                    <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>Avbryt</Button>
                      <Button
                        type="button"
                        onClick={() => {
                          const patch: any = {
                            title: editTitle,
                            address: editAddress || undefined,
                            driftkostnader: parseSwedishNumber(editDriftkostnader),
                            hyra: parseSwedishNumber(editHyra),
                            antalRum: editAntalRum ? Number(editAntalRum) : undefined,
                            boarea: editBoarea ? Number(editBoarea) : undefined,
                            biarea: editBiarea ? Number(editBiarea) : undefined,
                            tomtarea: editTomtarea ? Number(editTomtarea) : undefined,
                            constructionYear: editConstructionYear ? Number(editConstructionYear) : undefined,
                          };
                          if (item.kind !== 'current') {
                            patch.begartPris = parseSwedishNumber(editBegartPris);
                          } else {
                            patch.currentValuation = parseSwedishNumber(editCurrentValuation);
                          }
                          patch.metrics = { ...(item as any).metrics, meta: { ...(((item as any)?.metrics as any)?.meta ?? {}), energyClass: editEnergyClass || undefined } };
                          update(item.id, patch);
                          setEditOpen(false);
                        }}
                      >
                        Spara
                      </Button>
                    </div>
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          <TransitDrawer open={transitOpen} onOpenChange={setTransitOpen} context={transitCtx} />

          <TotalCostDrawer open={costOpen} onOpenChange={setCostOpen} item={item} />

          {/* Visa detaljer drawer */}
          <Drawer.Root open={detailsOpen} onOpenChange={setDetailsOpen}>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-40 bg-background/80" />
              <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 h-[70vh] rounded-t-2xl border border-border/60 bg-card p-4 sm:p-6 shadow-xl md:right-0 md:inset-y-0 md:inset-x-auto md:h-full md:w-[520px] md:rounded-t-none md:rounded-l-2xl">
                <div className="mx-auto max-w-screen-md h-full flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold leading-tight">{item.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{item.address}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="icon" aria-label="Redigera" onClick={startEdit}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label="Ta bort" onClick={() => setConfirmOpen(true)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Stäng" onClick={() => setDetailsOpen(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="mt-4 flex items-center gap-2 border-b border-border/60">
                    {([
                      { key: 'basic', label: 'Grundinfo' },
                      { key: 'cost', label: 'Kostnader' },
                      { key: 'travel', label: 'Restid' },
                    ] as const).map((t) => (
                      <button
                        key={t.key}
                        className={cn('-mb-px select-none rounded-t px-3 py-2 text-xs font-medium transition', detailsTab === t.key ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground')}
                        onClick={() => setDetailsTab(t.key)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 grow overflow-y-auto">
                    {detailsTab === 'basic' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Adress</div>
                          <div>{item.address ?? '—'}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Antal rum</div>
                          <div>{item.antalRum ?? '—'}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Boarea</div>
                          <div>{item.boarea ?? '—'} m²</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Biarea</div>
                          <div>{item.biarea ?? '—'} m²</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Tomtarea</div>
                          <div>{item.tomtarea ?? '—'} m²</div>
                        </div>
                        {item.kind !== 'current' && (
                          <div className="rounded-md border p-3">
                            <div className="text-xs text-muted-foreground">Begärt pris</div>
                            <div>{formatSek(item.begartPris)}</div>
                          </div>
                        )}
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Byggår</div>
                          <div>{item.constructionYear ?? '—'}</div>
                        </div>
                      </div>
                    )}

                    {detailsTab === 'cost' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Totalt / mån</div>
                          <div className="font-medium">{formatSek(item.totalMonthlyCost)}</div>
                        </div>
                        {item.kind !== 'current' && (
                          <>
                            <div className="rounded-md border p-3">
                              <div className="text-xs text-muted-foreground">Kontantinsats</div>
                              <div>{formatSek(item.kontantinsats)}</div>
                            </div>
                            <div className="rounded-md border p-3">
                              <div className="text-xs text-muted-foreground">Lån</div>
                              <div>{formatSek(item.lan)}</div>
                            </div>
                          </>
                        )}
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Amortering / mån</div>
                          <div>{formatSek(item.amorteringPerManad)}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Ränta / mån</div>
                          <div>{formatSek(item.rantaPerManad)}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Hyra / mån</div>
                          <div>{formatSek(item.hyra)}</div>
                        </div>
                        <div className="rounded-md border p-3">
                          <div className="text-xs text-muted-foreground">Drift / mån</div>
                          <div>{maintenancePerMonth != null ? `${maintenancePerMonth.toLocaleString('sv-SE')} kr/mån` : '—'}</div>
                        </div>
                      </div>
                    )}

                    {detailsTab === 'travel' && (
                      <div className="space-y-3 text-sm">
                        {listedPlaces.map((p) => {
                          const times1 = commuteForMode(item.id, commuteMode);
                          const min = times1[p.id];
                          return (
                            <div key={p.id} className="rounded-md border p-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <LucideIcon name={p.icon} className="h-4 w-4" />
                                <div className="text-xs text-muted-foreground">{p.label || 'Plats'}</div>
                              </div>
                              <div>{formatMinutes(min)}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>



        </div>
      </div>
    </div>
  );
}

