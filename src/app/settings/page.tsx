"use client";

import { useEffect, useState } from "react";
import { useAccommodations } from "@/lib/accommodations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CurrencyInput, PercentInput } from "@/components/ui/formatted-input";

const nfSE2 = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function parseSwedishNumber(input?: string | null): number | undefined {
  if (input == null) return undefined;
  const s = String(input).trim().replace(/\s/g, "").replace(",", ".");
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default function SettingsPage() {
  const { current, places, upsertCurrentFromUser, replacePlaces } = useAccommodations();

  // Current home form state
  const [loanRows, setLoanRows] = useState<Array<{ principal: string; rate: string }>>([{ principal: "", rate: "" }]);
  useEffect(() => {
    const existing = (((current?.metrics as any)?.mortgage?.loans) ?? []) as Array<{ principal?: number; interestRateAnnual?: number }>;
    if (existing && existing.length > 0) {
      setLoanRows(
        existing.map((l) => ({
          principal: l?.principal != null ? nfSE2.format(l.principal) : "",
          rate: l?.interestRateAnnual != null ? nfSE2.format((l.interestRateAnnual || 0) * 100) : "",
        }))
      );
    } else {
      setLoanRows([{ principal: "", rate: "" }]);
    }
  }, [current]);

  // Places form state
  const [placeRows, setPlaceRows] = useState<Array<{ id?: string; label: string; address: string; icon?: string }>>([]);
  useEffect(() => {
    if (places && places.length > 0) {
      setPlaceRows(places.map((p) => ({ id: p.id, label: p.label ?? "", address: p.address ?? "", icon: p.icon })));
    } else {
      setPlaceRows([{ label: "", address: "", icon: "Briefcase" }, { label: "", address: "", icon: "Briefcase" }]);
    }
  }, [places]);

  const ICON_CHOICES = [
    { value: "Briefcase", label: "Arbete – Portfölj" },
    { value: "Building2", label: "Arbete – Byggnad" },
    { value: "School", label: "Skola" },
    { value: "Users", label: "Familj" },
    { value: "ShoppingCart", label: "Butik" },
  ] as const;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inställningar</h1>
        <p className="mt-2 text-muted-foreground">Hantera din nuvarande bostad och dina viktiga platser.</p>
      </div>

      {/* Current home section */}
      <section className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-6">
        <h2 className="text-base font-semibold">Ställ in nuvarande bostad</h2>
        <p className="text-sm text-muted-foreground">Fyll i de fält du vill. Allt är valfritt.</p>

        <form
          className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget as HTMLFormElement);
            const num = (v: FormDataEntryValue | null) => parseSwedishNumber((v as string) ?? undefined);
            const valuation = num(fd.get("valuation"));
            const loans = loanRows
              .map((r) => {
                const principal = parseSwedishNumber(r.principal) ?? NaN;
                const percent = parseSwedishNumber(r.rate) ?? NaN; // e.g. 2,35
                const interestRateAnnual = Number.isFinite(percent) ? percent / 100 : NaN;
                return { principal, interestRateAnnual };
              })
              .filter((l) => Number.isFinite(l.principal) && l.principal! > 0 && Number.isFinite(l.interestRateAnnual) && l.interestRateAnnual! > 0);

            upsertCurrentFromUser({
              title: (fd.get("title") as string) || undefined,
              address: (fd.get("address") as string) || undefined,
              hyra: num(fd.get("hyra")),
              driftkostnader: num(fd.get("driftkostnader")),
              antalRum: num(fd.get("antalRum")),
              boarea: num(fd.get("boarea")),
              biarea: num(fd.get("biarea")),
              tomtarea: num(fd.get("tomtarea")),
              currentValuation: valuation,
              mortgages: loans.length ? { loans } : undefined,
            });
          }}
        >
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="title">Titel</Label>
            <Input name="title" id="title" defaultValue={current?.title ?? "Nuvarande hem"} placeholder="Nuvarande hem" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="address">Adress</Label>
            <Input name="address" id="address" defaultValue={current?.address ?? ""} placeholder="T.ex. Sundbyberg, Stockholm" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="hyra">Hyra / mån (SEK)</Label>
            <CurrencyInput name="hyra" id="hyra" defaultValue={current?.hyra ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="driftkostnader">Driftkostnader / år (SEK)</Label>
            <CurrencyInput name="driftkostnader" id="driftkostnader" defaultValue={current?.driftkostnader ?? ""} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="antalRum">Antal rum</Label>
            <Input name="antalRum" id="antalRum" type="number" inputMode="numeric" defaultValue={current?.antalRum ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="boarea">Boarea (m²)</Label>
            <Input name="boarea" id="boarea" type="number" inputMode="numeric" defaultValue={current?.boarea ?? ""} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="biarea">Biarea (m²)</Label>
            <Input name="biarea" id="biarea" type="number" inputMode="numeric" defaultValue={current?.biarea ?? ""} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="tomtarea">Tomtarea (m²)</Label>
            <Input name="tomtarea" id="tomtarea" type="number" inputMode="numeric" defaultValue={current?.tomtarea ?? ""} />
          </div>

          <div className="space-y-1 sm:col-span-2 pt-1">
            <Label htmlFor="valuation">Marknadsvärde (SEK)</Label>
            <CurrencyInput name="valuation" id="valuation" defaultValue={current?.currentValuation ?? ""} />
          </div>

          <div className="sm:col-span-2 pt-2">
            <div className="text-sm font-medium mb-1">Bolån</div>
            <div className="space-y-2">
              {loanRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
                  <div className="space-y-1">
                    <Label>Belopp (SEK)</Label>
                    <CurrencyInput value={row.principal} onValueChange={({ formattedValue }) => setLoanRows((rs) => rs.map((r,i) => i===idx ? { ...r, principal: formattedValue } : r))} />
                  </div>
                  <div className="space-y-1">
                    <Label>Ränta (% år)</Label>
                    <PercentInput value={row.rate} onValueChange={({ formattedValue }) => setLoanRows((rs) => rs.map((r,i) => i===idx ? { ...r, rate: formattedValue } : r))} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setLoanRows((rs) => rs.filter((_,i) => i!==idx))}>Ta bort</Button>
                  </div>
                </div>
              ))}
              <div>
                <Button type="button" variant="secondary" size="sm" onClick={() => setLoanRows((rs) => [...rs, { principal: "", rate: "" }])}>Lägg till lån</Button>
              </div>
            </div>
          </div>

          <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
            <Button type="submit">Spara</Button>
          </div>
        </form>
      </section>

      {/* Important places section */}
      <section className="rounded-2xl border border-border/60 bg-card/80 p-4 sm:p-6">
        <h2 className="text-base font-semibold">Ställ in viktiga platser</h2>
        <p className="text-sm text-muted-foreground">Lägg till destinationer som du bryr dig om. Dessa kan användas för framtida pendling.</p>

        <div className="mt-4 space-y-3">
          {placeRows.map((row, idx) => (
            <div key={row.id ?? idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end border border-border/60 rounded-md p-3">
              <div className="space-y-1">
                <Label>Etikett</Label>
                <Input
                  value={row.label}
                  onChange={(e) => setPlaceRows((rs) => rs.map((r, i) => i === idx ? { ...r, label: e.target.value } : r))}
                  placeholder={idx === 0 ? "Arbetsplats 1" : idx === 1 ? "Arbetsplats 2" : "T.ex. Skola"}
                />
              </div>
              <div className="space-y-1">
                <Label>Adress</Label>
                <Input
                  value={row.address}
                  onChange={(e) => setPlaceRows((rs) => rs.map((r, i) => i === idx ? { ...r, address: e.target.value } : r))}
                  placeholder="T.ex. Kungsgatan 1, Stockholm"
                />
              </div>
              <div className="space-y-1">
                <Label>Ikon</Label>
                <Select value={row.icon ?? ""} onChange={(e) => setPlaceRows((rs) => rs.map((r,i)=> i===idx ? { ...r, icon: e.target.value } : r))}>
                  <option value="">Välj ikon…</option>
                  {ICON_CHOICES.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
              </div>
              <div className="sm:col-span-3 flex justify-end pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setPlaceRows((rs) => rs.filter((_, i) => i !== idx))}>Ta bort</Button>
              </div>
            </div>
          ))}

          <div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setPlaceRows((rs) => [...rs, { label: "", address: "" }])}>Lägg till plats</Button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              onClick={() => {
                const cleaned = placeRows
                  .map((p) => ({ id: p.id, label: p.label?.trim() || undefined, address: p.address?.trim() || undefined, icon: p.icon?.trim() || undefined }))
                  .filter((p) => p.label || p.address);
                replacePlaces(cleaned.length > 0 ? cleaned : [{}, {}]);
              }}
            >
              Spara platser
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}