"use client";

import * as React from "react";
import { useState } from "react";
import { useAccommodations } from "@/lib/accommodations";
import PropertyCard, { type CardConfig, type CardFieldKey } from "@/components/accommodations/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer } from "vaul";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { parsePropertyUrl, isHemnetListingUrl } from "@/lib/parse";
import { SlidersHorizontal, ArrowUp, ArrowDown, GripVertical } from "lucide-react";

export default function OverviewPage() {
  const { accommodations, addFromParsed } = useAccommodations();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const defaultOrder: CardFieldKey[] = ['price','totalMonthlyCost','downPayment','constructionYear','rooms','energyClass','livingArea','monthlyFee'];
  const defaultEnabled: Partial<Record<CardFieldKey, boolean>> = { price: true, totalMonthlyCost: true, downPayment: true, constructionYear: true, rooms: true, energyClass: true, livingArea: true, monthlyFee: true };
  const defaultConfig: CardConfig = { showAll: false, order: defaultOrder, enabled: defaultEnabled };
  const [cardConfig, setCardConfig] = useState<CardConfig>(defaultConfig);

  const allKeys: CardFieldKey[] = [...defaultOrder, 'operatingMonthly','kontantinsats','lan','amortering','ranta'];
  const labels: Record<CardFieldKey, string> = {
    price: 'Pris',
    totalMonthlyCost: 'Totalkostnad',
    downPayment: 'Inköpspris (15%)',
    constructionYear: 'Byggår',
    rooms: 'Rum',
    energyClass: 'Energiklass',
    livingArea: 'Storlek',
    monthlyFee: 'Avgift',
    operatingMonthly: 'Drift / mån',
    kontantinsats: 'Kontantinsats',
    lan: 'Lån',
    amortering: 'Amortering / mån',
    ranta: 'Ränta / mån',
  };

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('reskollen.cardConfig.v1');
      if (raw) setCardConfig(JSON.parse(raw));
    } catch {}
  }, []);
  React.useEffect(() => {
    try {
      localStorage.setItem('reskollen.cardConfig.v1', JSON.stringify(cardConfig));
    } catch {}
  }, [cardConfig]);
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
          <Button onClick={() => setOpen(true)}>Lägg till bostad</Button>
          <Button variant="outline" size="icon" aria-label="Anpassa kort" onClick={() => setCustomizeOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Cards list */}
      <section className="space-y-6">
        {accommodations.map((a) => (
          <PropertyCard key={a.id} item={a} config={cardConfig} />
        ))}
      </section>


      {/* Customize card drawer */}
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
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={!!cardConfig.showAll}
                      onChange={(e) => setCardConfig((prev) => ({ ...prev, showAll: e.target.checked }))}
                    />
                    Visa alla
                  </label>
                  <Button variant="secondary" size="sm" onClick={() => setCardConfig(defaultConfig)}>Återställ</Button>
                </div>
              </div>

              <div className="rounded-xl border">
                {cardConfig.order.map((k, idx) => {
                  const isOver = overIndex === idx && dragIndex !== null;
                  const isDragging = dragIndex === idx;
                  return (
                    <div
                      key={k}
                      className={[
                        "relative flex items-center justify-between gap-3 px-3 py-2 border-b last:border-b-0",
                        isDragging ? "opacity-50" : "",
                      ].join(" ")}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setOverIndex(idx);
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
                        setOverPos(pos);
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setOverIndex(idx);
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
                        setOverPos(pos);
                      }}
                      onDragLeave={() => { if (overIndex === idx) { setOverIndex(null); setOverPos(null); } }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const from = dragIndex ?? parseInt(e.dataTransfer.getData('text/plain'));
                        if (Number.isNaN(from)) { setDragIndex(null); setOverIndex(null); setOverPos(null); return; }
                        let baseTarget = idx + (overPos === 'after' ? 1 : 0);
                        setCardConfig((prev) => {
                          const order = [...prev.order];
                          const [moved] = order.splice(from, 1);
                          if (from < baseTarget) baseTarget -= 1;
                          order.splice(baseTarget, 0, moved);
                          return { ...prev, order };
                        });
                        setDragIndex(null);
                        setOverIndex(null);
                        setOverPos(null);
                      }}
                    >
                      {/* Drop indicators */}
                      {isOver && overPos === 'before' && (
                        <div className="pointer-events-none absolute left-0 right-0 top-0 h-0.5 bg-primary" />
                      )}
                      {isOver && overPos === 'after' && (
                        <div className="pointer-events-none absolute left-0 right-0 bottom-0 h-0.5 bg-primary" />
                      )}

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="h-7 w-7 grid place-items-center rounded hover:bg-muted cursor-grab"
                          draggable
                          onDragStart={(e) => {
                            setDragIndex(idx);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', String(idx));
                          }}
                          onDragEnd={() => { setDragIndex(null); setOverIndex(null); setOverPos(null); }}
                          aria-label="Dra för att flytta"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <label className="flex items-center gap-2 text-sm select-none">
                          <input
                            type="checkbox"
                            checked={cardConfig.enabled[k] !== false}
                            onChange={(e) => setCardConfig((prev) => ({ ...prev, enabled: { ...prev.enabled, [k]: e.target.checked } }))}
                          />
                          {labels[k]}
                        </label>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={idx === 0}
                          onClick={() => setCardConfig((prev) => {
                            const order = [...prev.order];
                            [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
                            return { ...prev, order };
                          })}
                          aria-label="Flytta upp"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={idx === cardConfig.order.length - 1}
                          onClick={() => setCardConfig((prev) => {
                            const order = [...prev.order];
                            [order[idx + 1], order[idx]] = [order[idx], order[idx + 1]];
                            return { ...prev, order };
                          })}
                          aria-label="Flytta ner"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Extra fält som inte är i ordningen än */}
              {allKeys.filter((k) => !cardConfig.order.includes(k)).length > 0 && (
                <div className="rounded-xl border p-3">
                  <div className="text-xs mb-2 text-muted-foreground">Övriga fält</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {allKeys.filter((k) => !cardConfig.order.includes(k)).map((k) => (
                      <button
                        key={k}
                        className="text-left rounded border px-2 py-1 text-xs hover:bg-muted"
                        onClick={() => setCardConfig((prev) => ({ ...prev, order: [...prev.order, k] }))}
                      >
                        Lägg till: {labels[k]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setCustomizeOpen(false)}>Stäng</Button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Add accommodation drawer */}
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
                <Input
                  type="url"
                  placeholder="Klistra in en länk här…"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                />
                <div className="flex items-center gap-2">
                  <Button className="w-full" onClick={handleFetch} disabled={loading || !url.trim()}>
                    {loading ? "Hämtar…" : "Hämta uppgifter"}
                  </Button>
                  <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
                    Avbryt
                  </Button>
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
