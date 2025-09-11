"use client";

import * as React from "react";
import * as Icons from "lucide-react";
import { MapPin, Home, Ruler, CircleDollarSign, ArrowRight, ArrowLeft } from "lucide-react";
import type { Accommodation } from "@/lib/accommodations";
import { useAccommodations } from "@/lib/accommodations";
import { cn } from "@/lib/utils";

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


  // viktiga platser and commute times (to/from)
  const { places, commuteForTwo } = useAccommodations();
  const times = commuteForTwo(item.id);
  const listedPlaces = React.useMemo(() => (places || []).filter(p => p.label || p.address), [places]);

  return (
    <div className={cn("bg-card rounded-2xl border border-border overflow-hidden shadow-sm", className)}>
      <div className="xl:flex">
        {/* Image */}
        <div className="relative xl:w-80 h-56 xl:h-auto xl:flex-shrink-0">
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
        <div className="flex-1 p-4 xl:p-6 space-y-5">
          {/* Header */}
          <div className="space-y-1.5">
            <h3 className="text-lg md:text-xl font-bold line-clamp-2">{item.title}</h3>
            {item.address && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="size-4" />
                <span className="truncate">{item.address}</span>
              </div>
            )}

            {/* Price/Total chips row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-muted/40 p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CircleDollarSign className="size-4" />
                  <span className="text-xs font-medium">Pris</span>
                </div>
                <div className="text-sm font-semibold">{formatSek(listingPrice)}</div>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <CircleDollarSign className="size-4" />
                  <span className="text-xs font-medium">Totalkostnad</span>
                </div>
                <div className="text-sm font-semibold">{item.totalMonthlyCost != null ? `${item.totalMonthlyCost.toLocaleString("sv-SE")} kr/mån` : "—"}</div>
              </div>
            </div>

          </div>

          {/* Stats chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Home className="size-4" />
                <span className="text-xs font-medium">Rum</span>
              </div>
              <div className="text-sm font-semibold">{item.antalRum ?? "—"}</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Ruler className="size-4" />
                <span className="text-xs font-medium">Storlek</span>
              </div>
              <div className="text-sm font-semibold">{item.boarea != null ? `${item.boarea} m²` : "—"}</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <CircleDollarSign className="size-4" />
                <span className="text-xs font-medium">Avgift</span>
              </div>
              <div className="text-sm font-semibold">{item.hyra != null ? `${item.hyra.toLocaleString("sv-SE")} kr/mån` : "—"}</div>
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
                        <div className="truncate text-sm">{p.label || p.address || "Plats"}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="inline-flex items-center gap-1 rounded-md border px-2 py-1 bg-background">
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{toMin != null ? toMin : "—"}</span>
                          <span className="text-[11px] text-muted-foreground">min</span>
                        </div>
                        <div className="inline-flex items-center gap-1 rounded-md border px-2 py-1 bg-background">
                          <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{fromMin != null ? fromMin : "—"}</span>
                          <span className="text-[11px] text-muted-foreground">min</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

