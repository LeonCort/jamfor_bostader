"use client";

import { useState } from "react";
import { Building2, Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAccommodations } from "@/lib/accommodations";
import { cn } from "@/lib/utils";

function formatSek(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("sv-SE", { maximumFractionDigits: 0 }) + " kr";
}

export function AccommodationsScaffold() {
  const { accommodations, addMock, remove } = useAccommodations();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const confirmItem = accommodations.find((x) => x.id === confirmId);
  const activeId = hoveredId ?? selectedId;
  const hasActive = !!activeId;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
      <div className="grid gap-6 md:grid-cols-[360px_1fr] lg:grid-cols-[400px_1fr]">
        {/* Left rail */}
        <aside className="space-y-6 border-e border-border pe-6 py-6">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">Jämför dina</h1>
            <p className="text-3xl font-extrabold leading-tight tracking-tight text-primary sm:text-4xl">drömbostäder</p>
            <p className="mt-3 max-w-prose text-sm text-muted-foreground">
              Klistra in en Hemnet‑länk och se hur din drömbostad ligger till gentemot dina arbetsplatser.
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
                        <div className="font-medium leading-tight">{a.title}</div>
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

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">{formatSek(a.begartPris)}</span>
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">Hyra: {formatSek(a.hyra)}/mån</span>
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">{a.antalRum ?? "—"} rum</span>
                    <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">{a.boarea ?? "—"} m²</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Map/visualization area */}
        <section className="relative h-[calc(100vh-12rem)] rounded-2xl border border-border/60 bg-[radial-gradient(circle_at_1px_1px,theme(colors.border/25)_1px,transparent_1px)] [background-size:24px_24px]">
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



      </div>
    </div>
  );
}

