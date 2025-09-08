import { Building2, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data – we will replace with real API calls later
const people = [
  { id: 1, name: "Person 1", location: "Sergels torg, Stockholm", color: "bg-sky-500", x: 56, y: 42 },
  { id: 2, name: "Person 2", location: "Gamla stan, Stockholm", color: "bg-emerald-500", x: 62, y: 55 },
];

export default function Home() {
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
          </div>

          <div className="rounded-xl border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">Redo att börja jämföra?</div>
                <p className="text-sm text-muted-foreground">
                  Dina jämförda bostäder kommer att dyka upp här. Lägg till din första bostad för att se restider och avstånd till dina arbetsplatser.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Map/visualization area */}
        <section
          className="relative h-[calc(100vh-12rem)] rounded-2xl border border-border/60 bg-[radial-gradient(circle_at_1px_1px,theme(colors.border/25)_1px,transparent_1px)] [background-size:24px_24px]"
        >
          {/* Top info banner */}
          <div className="absolute left-6 right-6 top-6 z-10 rounded-xl border border-border/60 bg-card/80 p-4 text-sm shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="font-medium">Dina arbetsplatser</div>
            <div className="text-muted-foreground">Kartan visar dina konfigurerade arbetsadresser. Lägg till en bostad för att se restider.</div>
          </div>

          {/* Mock markers */}
          {people.map((p) => (
            <div key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${p.color} text-white shadow ring-2 ring-border/50`}
                title={p.name}
              >
                <Building2 className="h-4 w-4" />
              </div>
              <div className="mt-2 w-max rounded-md bg-card/80 px-3 py-2 text-xs shadow-sm ring-1 ring-border/60 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                <div className="font-medium">{p.name}</div>
                <div className="text-muted-foreground">{p.location}</div>
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="absolute left-6 bottom-6 rounded-lg border border-border/60 bg-card/80 p-3 text-xs shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="font-medium">Arbetsplatser</div>
            <div className="mt-2 space-y-1">
              {people.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <span className={`inline-block size-2.5 rounded-full ${p.color}`} />
                  <span className="text-muted-foreground">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Add button */}
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-6 right-6 h-10 w-10 rounded-full border border-border/60 bg-card/80 text-foreground shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60"
            aria-label="Lägg till punkt"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </section>
      </div>
    </div>
  );
}
