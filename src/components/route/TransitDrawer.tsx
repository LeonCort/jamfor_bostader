"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { X, Clock, MapPin } from "lucide-react";
import { RouteOptionsList } from "./RouteOptionsList";
import RouteDetailFullPanel from "./RouteDetailFullPanel";


// Simple media query hook for responsive Drawer direction
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

// Lightweight types compatible with our Route components
export type RouteStep = {
  id: string;
  type: "walk" | "bus" | "train" | "drive";
  instruction: string;
  duration: string;
  distance?: string;
  line?: string;
  stops?: number;
  departureTime?: string;
  arrivalTime?: string;
  location?: string;
};

export type RouteOption = {
  id: string;
  mode: "car" | "transit" | "walking" | "biking";
  duration: string;
  distance: string;
  description: string;
  departureTime?: string;
  arrivalTime?: string;
  steps: RouteStep[];
  hasAlert?: boolean;
  walkingTime?: string;
  departureLocation?: string;
};

function mockRoutes(origin?: string, destination?: string): RouteOption[] {
  // Simple deterministic mock using fixed content (adapted from prototype)
  return [
    {
      id: "1",
      mode: "transit",
      duration: "1 tim 51 min",
      distance: "11.2 km",
      description: "via 118 och 919",
      departureTime: "07:12",
      arrivalTime: "09:03",
      walkingTime: "33 min gång totalt",
      departureLocation: origin?.split(",")[0] || "Norrhagen",
      steps: [
        {
          id: "s1",
          type: "walk",
          instruction: `Gå till hållplats`,
          duration: "18 min",
          distance: "1,3 km",
          departureTime: "07:12",
          arrivalTime: "07:30",
          location: origin || "Start"
        },
        {
          id: "s2",
          type: "bus",
          instruction: "Ta buss 118 mot Uppsala Centralstation",
          duration: "21 min",
          line: "118",
          stops: 9,
          departureTime: "07:30",
          arrivalTime: "07:51",
          location: "Norrhagen"
        },
        {
          id: "s3",
          type: "train",
          instruction: "Ta tåg 919 mot Stockholm City",
          duration: "39 min",
          line: "919",
          stops: 3,
          departureTime: "08:09",
          arrivalTime: "08:48",
          location: "Uppsala Centralstation"
        },
        {
          id: "s4",
          type: "walk",
          instruction: "Gå till destination",
          duration: "15 min",
          distance: "1,1 km",
          departureTime: "08:48",
          arrivalTime: "09:03",
          location: destination || "Mål"
        }
      ]
    },
    {
      id: "2",
      mode: "transit",
      duration: "1 tim 49 min",
      distance: "10.8 km",
      description: "via 886 och SJ",
      departureTime: "06:54",
      arrivalTime: "08:43",
      steps: []
    },
    {
      id: "3",
      mode: "transit",
      duration: "1 tim 50 min",
      distance: "11.5 km",
      description: "via 805 och 817",
      departureTime: "06:46",
      arrivalTime: "08:36",
      steps: []
    }
  ];
}

export type TransitDrawerContext = {
  origin?: string;
  destination?: string;
  arriveBy?: string; // when direction === "to"
  leaveAt?: string;  // when direction === "from"
  direction?: "to" | "from";
};

export function TransitDrawer({
  open,
  onOpenChange,
  context
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: TransitDrawerContext | null;
}) {
  const origin = context?.direction === "from" ? context?.destination : context?.origin;
  const destination = context?.direction === "from" ? context?.origin : context?.destination;
  const routes = React.useMemo(() => mockRoutes(origin, destination), [origin, destination]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const selectedRoute = React.useMemo(() => routes.find(r => r.id === selectedId) ?? null, [routes, selectedId]);
  const showDetails = !!selectedRoute;
  const isMd = useMediaQuery("(min-width: 768px)");

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => { if (!o) { onOpenChange(false); setSelectedId(null); } }}
      direction={isMd ? "right" : "bottom"}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-background/80" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 h-[86vh] rounded-t-2xl border border-border bg-card text-foreground shadow-2xl md:left-auto md:right-0 md:top-0 md:bottom-0 md:h-full md:w-[520px] md:rounded-t-none md:rounded-l-2xl">
          <div className="mx-auto max-w-screen-md flex h-full flex-col">
            {!isMd && <Drawer.Handle className="mx-auto mt-2 mb-3 h-1.5 w-10 rounded-full bg-border" />}

            {/* Header */}
            {!showDetails && (
              <div className="flex items-start justify-between gap-3 border-b border-border p-4">
                <div>
                  <div className="text-sm text-muted-foreground">Från</div>
                  <div className="font-medium text-foreground">{origin || "—"}</div>
                  <div className="mt-2 text-sm text-muted-foreground">Till</div>
                  <div className="font-medium text-foreground">{destination || "—"}</div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {context?.direction === "to" ? (
                      <span>Anländ senast {context?.arriveBy ?? "—"}</span>
                    ) : (
                      <span>Lämna vid {context?.leaveAt ?? "—"}</span>
                    )}
                  </div>
                </div>
                <button
                  className="-m-1 rounded p-1 text-muted-foreground hover:bg-muted"
                  aria-label="Stäng"
                  onClick={() => onOpenChange(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {showDetails && selectedRoute ? (
                <RouteDetailFullPanel
                  route={selectedRoute as any}
                  onBackClick={() => setSelectedId(null)}
                  onClose={() => onOpenChange(false)}
                  origin={origin || "Start"}
                  destination={destination || "Mål"}
                />
              ) : (
                <div>
                  {/* Simple list header */}
                  <div className="flex items-center justify-between px-4 py-3 text-muted-foreground border-b border-border">
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span>Ruttförslag</span></div>
                    <div className="text-xs">Mockdata</div>
                  </div>
                  <RouteOptionsList routes={routes as any} selectedRoute={undefined as any} onRouteSelect={(id: string) => setSelectedId(id)} />
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export default TransitDrawer;

