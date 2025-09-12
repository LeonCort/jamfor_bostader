"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { X, Info, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Accommodation } from "@/lib/accommodations";

function formatValue(val?: number | string, unit?: string) {
  if (val == null || val === "") return "—";
  if (typeof val === "number") return `${val.toLocaleString("sv-SE")} ${unit ?? ""}`.trim();
  return `${val} ${unit ?? ""}`.trim();
}

export type CellContext = {
  acc: Accommodation;
  label: string;
  unit?: string;
  value?: number | string;
  delta?: number | null;
  description?: string;
};

export default function CellDetailDrawer({
  open,
  onOpenChange,
  ctx,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctx: CellContext | null;
}) {
  const acc = ctx?.acc;
  const isMd = useMediaQuery("(min-width: 768px)");
  const delta = ctx?.delta ?? null;
  const deltaTone = delta == null || delta === 0 ? "neutral" : delta < 0 ? "good" : "bad";
  const DeltaIcon = deltaTone === "good" ? ArrowDownRight : ArrowUpRight;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={isMd ? "right" : "bottom"}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-background/80" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 h-[86vh] rounded-t-2xl border border-border bg-card text-foreground shadow-2xl md:left-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:w-[520px] md:rounded-t-none md:rounded-l-2xl">
          <div className="mx-auto max-w-screen-md flex h-full flex-col">
            {!isMd && <Drawer.Handle className="mx-auto mt-2 mb-3 h-1.5 w-10 rounded-full bg-border" />}

            <div className="flex items-start justify-between gap-3 border-b border-border p-4">
              <div>
                <div className="text-xs text-muted-foreground">{ctx?.label}</div>
                <div className="font-medium text-foreground">{acc?.title ?? "Bostad"}</div>
              </div>
              <button className="-m-1 rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Stäng" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="px-4 py-5 space-y-6">
                {/* Main value */}
                <div className="rounded-xl border bg-muted/40 p-6 text-center">
                  <div className="text-3xl font-bold mb-1">{formatValue(ctx?.value, ctx?.unit)}</div>
                  {delta != null && delta !== 0 ? (
                    <div className={`inline-flex items-center gap-1 text-sm font-medium ${delta < 0 ? "text-emerald-600" : "text-red-600"}`}>
                      <DeltaIcon className="h-4 w-4" />
                      <span>{`${delta > 0 ? "+" : ""}${delta.toLocaleString("sv-SE")} ${ctx?.unit ?? ""}`.trim()}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Nuvarande</div>
                  )}
                </div>

                {/* Context */}
                {ctx?.description ? (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                      <Info className="h-4 w-4" />
                      <span>Detaljer</span>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground whitespace-pre-line">
                      {ctx.description}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

// Simple media query hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
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

