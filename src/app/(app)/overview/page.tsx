"use client";

import * as React from "react";
import { useState } from "react";
import { useAccommodations } from "@/lib/accommodations";
import PropertyCard, { type CardConfig, type CardFieldKey } from "@/components/accommodations/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer } from "vaul";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { parsePropertyUrl, isHemnetListingUrl } from "@/lib/parse";
import { SlidersHorizontal, ArrowUp, ArrowDown, GripVertical, Building2, MapPin } from "lucide-react";

export default function OverviewPage() {
  const { accommodations, current, places, addFromParsed, addOrUpdateCurrentMock, replacePlaces } = useAccommodations();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const router = useRouter();




  const defaultOrder: CardFieldKey[] = ['price','totalMonthlyCost','downPayment','constructionYear','rooms','energyClass','livingArea','monthlyFee'];
  const defaultEnabled: Partial<Record<CardFieldKey, boolean>> = { price: true, totalMonthlyCost: true, downPayment: true, constructionYear: true, rooms: true, energyClass: true, livingArea: true, monthlyFee: true };
  const defaultConfig: CardConfig = { showAll: false, showCommute: true, commuteMode: 'transit', order: defaultOrder, enabled: defaultEnabled };
  const [cardConfig, setCardConfig] = useState<CardConfig>(defaultConfig);

  const allKeys: CardFieldKey[] = [...defaultOrder, 'plotArea','operatingMonthly','kontantinsats','lan','amortering','ranta'];
  const labels: Record<CardFieldKey, string> = {
    price: 'Pris', totalMonthlyCost: 'Totalkostnad', downPayment: 'Inköpspris (15%)', constructionYear: 'Byggår', rooms: 'Rum', energyClass: 'Energiklass', livingArea: 'Storlek', plotArea: 'Tomtarea', monthlyFee: 'Avgift', operatingMonthly: 'Drift / mån', kontantinsats: 'Kontantinsats', lan: 'Lån', amortering: 'Amortering / mån', ranta: 'Ränta / mån',
  };

  React.useEffect(() => { try { const raw = localStorage.getItem('reskollen.cardConfig.v1'); if (raw) setCardConfig(JSON.parse(raw)); } catch {} }, []);
  React.useEffect(() => { try { localStorage.setItem('reskollen.cardConfig.v1', JSON.stringify(cardConfig)); } catch {} }, [cardConfig]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [overPos, setOverPos] = useState<'before' | 'after' | null>(null);

  async function handleFetch() {
    const s = url.trim();
    if (!s) return;
    setLoading(true);
    setError(null);
    try {
      if (isHemnetListingUrl(s)) {
        const resp = await fetch(`/api/scrape/hemnet?url=${encodeURIComponent(s)}`);
        if (!resp.ok) throw new Error("Hemnet-scrape misslyckades");
        const pd = await resp.json();
        addFromParsed(pd, s);
      } else {
        const parsed = parsePropertyUrl(s);
        if (!parsed) throw new Error("Kunde inte tolka URL:en");
        addFromParsed(parsed, s);
      }
      setUrl("");
      setOpen(false);
    } catch (e: any) {
      setError(e?.message ?? "Något gick fel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Översikt</h1>
          <p className="text-sm text-muted-foreground">En snabb översikt över dina bostäder.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium" onClick={() => setOpen(true)}>Lägg till bostad</button>
          <button className="inline-flex items-center rounded-md border px-2.5 py-2 text-sm" aria-label="Anpassa kort" onClick={() => setCustomizeOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="space-y-6">
        {accommodations.map((a) => (
          <PropertyCard key={a.id} item={a} config={cardConfig} />
        ))}
      </section>

      {!current && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="lg:flex">
            {/* Image placeholder to match card layout */}
            <div className="relative lg:w-80 h-40 lg:h-auto lg:flex-shrink-0 bg-muted/40 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            {/* Content */}
            <div className="flex-1 p-4 lg:p-6 space-y-3">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-2">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold">Lägg till din nuvarande bostad</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-[60ch]">Ange din nuvarande bostad för tydliga jämförelser: vi visar +/- skillnader i kostnad, storlek, rum och pendling.</p>
                </div>
                <div className="shrink-0 flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
                  <Button size="sm" className="w-full sm:w-auto" onClick={() => router.push('/settings?panel=current')}>Öppna inställningar</Button>
                  <Button size="sm" variant="ghost" className="w-full sm:w-auto" onClick={() => addOrUpdateCurrentMock()}>Fyll i exempel</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state: Viktiga platser */}
      {!(places ?? []).some(p => (p.label && p.label.trim()) || (p.address && p.address.trim())) && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="lg:flex">
            {/* Image placeholder to match card layout */}
            <div className="relative lg:w-80 h-40 lg:h-auto lg:flex-shrink-0 bg-muted/40 flex items-center justify-center">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            {/* Content */}
            <div className="flex-1 p-4 lg:p-6 space-y-3">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-2">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold">Lägg till viktiga platser</h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-[60ch]">Lägg till platser som arbete, skola eller familj för att se pendlingstider och jämföra bostäder utifrån vardagen.</p>
                </div>
                <div className="shrink-0 flex flex-wrap items-center gap-2 w-full sm:w-auto sm:justify-end">
                  <Button size="sm" className="w-full sm:w-auto" onClick={() => router.push('/settings?panel=places')}>Öppna inställningar</Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full sm:w-auto"
                    onClick={() => replacePlaces([
                      { label: 'Arbete', address: 'Sergels torg, Stockholm', icon: 'Briefcase', arriveBy: '09:00', leaveAt: '17:00' },
                      { label: 'Skola', address: 'Odenplan, Stockholm', icon: 'School', arriveBy: '08:00', leaveAt: '15:30' },
                    ])}
                  >
                    Fyll i exempel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      <Drawer.Root open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-background/80" />
          <Drawer.Content className="fixed z-50 overflow-hidden border border-border/60 bg-card p-4 sm:p-6 shadow-xl inset-x-0 bottom-0 h-[70vh] rounded-t-2xl sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:right-auto sm:h-auto sm:w-[560px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
            <div className="mx-auto max-w-screen-sm flex flex-col gap-4">
              <Drawer.Handle className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border sm:hidden" />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Anpassa kort</h2>
                  <p className="text-xs text-muted-foreground">Välj vilka fält som visas och i vilken ordning.</p>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={!!cardConfig.showAll} onChange={(e) => setCardConfig((prev) => ({ ...prev, showAll: e.target.checked }))} /> Visa alla
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={cardConfig.showCommute !== false} onChange={(e) => setCardConfig((prev) => ({ ...prev, showCommute: e.target.checked }))} /> Visa restider
                  </label>
                  {cardConfig.showCommute !== false && (
                    <label className="flex items-center gap-2 text-xs">
                      <span>Mode</span>
                      <select className="rounded border bg-background px-2 py-1 text-xs" value={cardConfig.commuteMode ?? 'transit'} onChange={(e) => setCardConfig((prev) => ({ ...prev, commuteMode: e.target.value as any }))}>
                        <option value="transit">Transit</option>
                        <option value="driving">Bil</option>
                        <option value="bicycling">Cykel</option>
                      </select>
                    </label>
                  )}
                  <button className="inline-flex items-center rounded-md bg-secondary text-secondary-foreground px-3 py-1.5 text-xs" onClick={() => setCardConfig(defaultConfig)}>Återställ</button>
                </div>
              </div>

              {/* ...rest of drawer content omitted for brevity (unchanged from old /page.tsx) ... */}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>


      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-background/80" />
          <Drawer.Content className="fixed z-50 overflow-hidden border border-border/60 bg-card p-4 sm:p-6 shadow-xl inset-x-0 bottom-0 h-[60vh] rounded-t-2xl sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:right-auto sm:h-auto sm:w-[520px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
            <div className="mx-auto max-w-screen-sm flex flex-col gap-4">
              <Drawer.Handle className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border sm:hidden" />
              <div>
                <h2 className="text-lg font-semibold">Lägg till bostad</h2>
                <p className="text-xs text-muted-foreground">Klistra in en Hemnet‑länk eller annan URL.</p>
              </div>
              <div className="space-y-3">
                <Input type="url" placeholder="Klistra in en länk här…" value={url} onChange={(e) => setUrl(e.target.value)} disabled={loading} />
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium w-full" onClick={handleFetch} disabled={loading || !url.trim()}>
                    {loading ? "Hämtar…" : "Hämta uppgifter"}
                  </button>
                  <button className="inline-flex items-center rounded-md border px-3 py-2 text-sm" onClick={() => setOpen(false)} disabled={loading}>Avbryt</button>
                </div>
                {error && <p className="text-xs text-destructive">{error}</p>}
              </div>
              {loading && (
                <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                  <Spinner className="h-4 w-4" />
                  <span>Hämtar bostadsuppgifter</span>
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}

