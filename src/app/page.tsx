"use client";

import * as React from "react";
import { useState } from "react";
import { useAccommodations } from "@/lib/accommodations";
import PropertyCard from "@/components/accommodations/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer } from "vaul";
import { Spinner } from "@/components/ui/shadcn-io/spinner";
import { parsePropertyUrl, isHemnetListingUrl } from "@/lib/parse";

export default function OverviewPage() {
  const { accommodations, addFromParsed } = useAccommodations();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <Button onClick={() => setOpen(true)}>Lägg till bostad</Button>
      </header>

      {/* Cards list */}
      <section className="space-y-6">
        {accommodations.map((a) => (
          <PropertyCard key={a.id} item={a} />
        ))}
      </section>

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
