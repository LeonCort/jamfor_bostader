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
import { SlidersHorizontal, GripVertical, Building2, MapPin, Plus } from "lucide-react";

export default function OverviewPage() {
  const { accommodations, current, places, addFromParsed, addOrUpdateCurrentMock, replacePlaces } = useAccommodations();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const router = useRouter();




  const defaultOrder = React.useMemo<CardFieldKey[]>(() => (
    ['price','totalMonthlyCost','downPayment','constructionYear','rooms','energyClass','livingArea','monthlyFee']
  ), []);
  const defaultEnabled = React.useMemo<Partial<Record<CardFieldKey, boolean>>>(() => (
    { price: true, totalMonthlyCost: true, downPayment: true, constructionYear: true, rooms: true, energyClass: true, livingArea: true, monthlyFee: true }
  ), []);
  const defaultConfig = React.useMemo<CardConfig>(() => (
    { showAll: false, showCommute: true, commuteMode: 'transit', order: defaultOrder, enabled: defaultEnabled }
  ), [defaultOrder, defaultEnabled]);
  const [cardConfig, setCardConfig] = useState<CardConfig>(defaultConfig);
  const deferredCardConfig = React.useDeferredValue(cardConfig);

  const allKeys: CardFieldKey[] = [...defaultOrder, 'plotArea','operatingMonthly','kontantinsats','lan','amortering','ranta'];
  const labels: Record<CardFieldKey, string> = {
    price: 'Pris', totalMonthlyCost: 'Totalkostnad', downPayment: 'Inköpspris (15%)', constructionYear: 'Byggår', rooms: 'Rum', energyClass: 'Energiklass', livingArea: 'Storlek', plotArea: 'Tomtarea', monthlyFee: 'Avgift', operatingMonthly: 'Drift / mån', kontantinsats: 'Kontantinsats', lan: 'Lån', amortering: 'Amortering / mån', ranta: 'Ränta / mån',
  };

  type Preset = 'minimal' | 'kostnader' | 'allt' | 'custom';
  const [preset, setPreset] = useState<Preset>('minimal');
  const [savedCustom, setSavedCustom] = useState<CardConfig>(defaultConfig);

  const minimalConfig: CardConfig = React.useMemo(() => ({
    showAll: false,
    showCommute: true,
    commuteMode: 'transit',
    order: ['price','totalMonthlyCost','livingArea','operatingMonthly'],
    enabled: { price: true, totalMonthlyCost: true, livingArea: true, operatingMonthly: true },
  }), []);
  const kostnaderConfig: CardConfig = React.useMemo(() => ({
    showAll: false,
    showCommute: false,
    commuteMode: 'transit',
    order: ['price','operatingMonthly','kontantinsats','monthlyFee','lan','ranta','amortering'],
    enabled: { price: true, operatingMonthly: true, kontantinsats: true, monthlyFee: true, lan: true, ranta: true, amortering: true },
  }), []);
  const alltConfig: CardConfig = React.useMemo(() => ({
    showAll: true,
    showCommute: true,
    commuteMode: 'transit',
    order: defaultOrder,
    enabled: {},
  }), [defaultOrder]);

  const configFor = React.useCallback((p: Preset, custom: CardConfig): CardConfig => {
    switch (p) {
      case 'minimal': return minimalConfig;
      case 'kostnader': return kostnaderConfig;
      case 'allt': return alltConfig;
      case 'custom':
      default: return custom;
    }
  }, [minimalConfig, kostnaderConfig, alltConfig]);

  function equalCardConfig(a?: CardConfig, b?: CardConfig): boolean {
    if (!a || !b) return false;
    if (a.showAll !== b.showAll || a.showCommute !== b.showCommute || a.commuteMode !== b.commuteMode) return false;
    const ao = a.order?.join('|') ?? ''; const bo = b.order?.join('|') ?? '';
    if (ao !== bo) return false;
    const ae = a.enabled ?? {}; const be = b.enabled ?? {};
    const ak = Object.keys(ae).sort().join('|'); const bk = Object.keys(be).sort().join('|');
    if (ak !== bk) return false;
    for (const k of Object.keys(ae)) {
      const key = k as keyof typeof ae;
      if (ae[key] !== be[key]) return false;
    }
    return true;
  }

  // Initial load: preset + custom config (migrates old key if present)
  React.useEffect(() => {
    try {
      const p = (localStorage.getItem('hemjakt.cardPreset.v1') as Preset | null) ?? 'minimal';
      const rawCustom = localStorage.getItem('hemjakt.cardConfig.custom.v1') ?? localStorage.getItem('hemjakt.cardConfig.v1');
      const custom = rawCustom ? (JSON.parse(rawCustom) as CardConfig) : defaultConfig;
      setSavedCustom(custom);
      setPreset(p);
      setCardConfig(prev => equalCardConfig(prev, configFor(p, custom)) ? prev : configFor(p, custom));
    } catch {}
  }, [configFor, defaultConfig]);

  // Persist preset
  React.useEffect(() => { try { localStorage.setItem('hemjakt.cardPreset.v1', preset); } catch {} }, [preset]);


  // Persist custom config only when editing in custom mode; avoid loops
  React.useEffect(() => {
    if (preset !== 'custom') return;
    try {
      localStorage.setItem('hemjakt.cardConfig.custom.v1', JSON.stringify(cardConfig));
      setSavedCustom(prev => equalCardConfig(prev, cardConfig) ? prev as CardConfig : cardConfig);
    } catch {}
  }, [preset, cardConfig]);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6 space-y-6">
      <header className="flex items-center justify-between gap-3">
              {/* Left: Preset tabs inline */}
        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1">
          {([
            { key: 'minimal', label: 'Minimal' },
            { key: 'kostnader', label: 'Kostnader' },
            { key: 'allt', label: 'Allt' },
            { key: 'custom', label: 'Eget' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setPreset(t.key);
                const base = configFor(t.key, savedCustom);
                const next = t.key === 'custom' ? { ...base, showAll: false } : base;
                setCardConfig(prev => equalCardConfig(prev, next) ? prev : next);
              }}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${preset === t.key ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* Right: Customize (fixed slot) + Add property */}
        <div className="flex items-center gap-2">
          <button
            className={`inline-flex items-center rounded-md border px-2.5 py-2 text-sm ${preset === 'custom' ? '' : 'invisible pointer-events-none'}`}
            aria-label="Anpassa kort"
            onClick={() => setCustomizeOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
          <button className="hidden sm:inline-flex items-center rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium" onClick={() => setOpen(true)}>
            Lägg till bostad
          </button>
        </div>

      </header>


      <section className="space-y-6">
        {accommodations.map((a) => (
          <PropertyCard key={a.id} item={a} config={deferredCardConfig} />
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
          <Drawer.Content className="fixed z-50 overflow-hidden border border-border/60 bg-card p-4 sm:p-6 shadow-xl inset-x-0 bottom-0 h-[90vh] rounded-t-2xl sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:right-auto sm:h-auto sm:w-[560px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
            <div className="mx-auto max-w-screen-sm flex flex-col gap-4 overflow-auto pb-[env(safe-area-inset-bottom)]">
              <Drawer.Handle className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border sm:hidden" />
              <Drawer.Title className="sr-only">Anpassa kort</Drawer.Title>
              <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Anpassa kort</h2>
                  <p className="text-xs text-muted-foreground">Välj vilka fält som visas och i vilken ordning.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={!!cardConfig.showAll} onChange={(e) => setCardConfig((prev) => ({ ...prev, showAll: e.target.checked }))} /> Visa alla
                  </label>
                  <label className="flex items-center gap-2 text-xs">
                    <input type="checkbox" checked={cardConfig.showCommute !== false} onChange={(e) => setCardConfig((prev) => ({ ...prev, showCommute: e.target.checked }))} /> Visa restider
                  </label>
                  {cardConfig.showCommute !== false && (
                    <div className="inline-flex items-center gap-2 text-xs w-full sm:w-auto">
                      <span>Mode</span>
                      <select className="w-[120px] rounded border bg-background px-2 py-1 text-xs" value={cardConfig.commuteMode ?? 'transit'} onChange={(e) => setCardConfig((prev) => ({ ...prev, commuteMode: e.target.value as 'transit' | 'driving' | 'bicycling' }))}>
                        <option value="transit">Transit</option>
                        <option value="driving">Bil</option>
                        <option value="bicycling">Cykel</option>
                      </select>
                    </div>
                  )}

                </div>
              </div>

              {(() => {
                const o = cardConfig.order ?? defaultOrder;
                const display = [...o, ...allKeys.filter((k) => !o.includes(k))] as CardFieldKey[];
                const en = cardConfig.enabled ?? defaultEnabled;
                function setEnabled(k: CardFieldKey, on: boolean) {
                  setCardConfig((prev) => ({ ...prev, enabled: { ...(prev.enabled ?? {}), [k]: on } }));
                }
                function onDropAt(i: number, pos: 'before' | 'after') {
                  if (dragIndex == null) return;
                  let toIndex = i + (pos === 'after' ? 1 : 0);
                  const fromIndex = dragIndex;
                  const next = [...display];
                  const [item] = next.splice(fromIndex, 1);
                  if (toIndex > fromIndex) toIndex -= 1;
                  next.splice(toIndex, 0, item);
                  setCardConfig((prev) => ({ ...prev, order: next }));
                  setDragIndex(null); setOverIndex(null); setOverPos(null);
                }
                return (
                  <div className="mt-4 space-y-2 max-h-[65vh] overflow-y-auto">
                    {display.map((k, i) => (
                      <div
                        key={k}
                        className="relative flex items-center justify-between rounded-md border bg-muted/20 px-3 py-3 min-h-12 select-none"
                        draggable
                        onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', k); } catch {} }}
                        onDragEnd={() => { setDragIndex(null); setOverIndex(null); setOverPos(null); }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          const mid = rect.top + rect.height / 2;
                          setOverIndex(i);
                          setOverPos(e.clientY < mid ? 'before' : 'after');
                        }}
                        onDrop={(e) => { e.preventDefault(); onDropAt(i, overPos ?? 'after'); }}
                      >
                        {/* Placement indicator */}
                        {overIndex === i && (
                          <div className={`pointer-events-none absolute left-2 right-2 h-0.5 bg-primary ${overPos === 'before' ? 'top-0 -translate-y-1/2' : 'bottom-0 translate-y-1/2'}`} />
                        )}
                        <label className="flex items-center gap-3 text-sm">
                          <span className="text-muted-foreground cursor-grab active:cursor-grabbing"><GripVertical className="h-4 w-4" /></span>
                          <input
                            type="checkbox"
                            checked={!!cardConfig.showAll || (en[k] !== false)}
                            onChange={(e) => setEnabled(k, e.target.checked)}
                            disabled={!!cardConfig.showAll}
                          />
                          <span>{labels[k]}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>


      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-background/80" />
          <Drawer.Content className="fixed z-50 overflow-hidden border border-border/60 bg-card p-4 sm:p-6 shadow-xl inset-x-0 bottom-0 h-[50vh] rounded-t-2xl sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:right-auto sm:h-auto sm:w-[520px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
            <div className="mx-auto max-w-screen-sm flex flex-col gap-4 overflow-auto pb-[env(safe-area-inset-bottom)]">
              <Drawer.Handle className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-border sm:hidden" />
              <Drawer.Title className="sr-only">L&auml;gg till bostad</Drawer.Title>
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
      {/* Mobile FAB for adding property */}
      <button
        type="button"
        aria-label="Lägg till bostad"
        onClick={() => setOpen(true)}
        className="sm:hidden fixed right-4 bottom-24 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-black/20 flex items-center justify-center"
      >
        <Plus className="h-6 w-6" />
      </button>

    </div>

  );
}

