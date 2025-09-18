"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Drawer } from "vaul";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useAccommodations } from "@/lib/accommodations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { CurrencyInput, PercentInput } from "@/components/ui/formatted-input";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import { useToast } from "@/components/ui/toast";
import { Plus } from "lucide-react";

const nfSE2 = new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function parseSwedishNumber(input?: string | null): number | undefined {
  if (input == null) return undefined;
  const s = String(input).trim().replace(/\s/g, "").replace(",", ".");
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default function SettingsPage() {
  const { current, places, finance, upsertCurrentFromUser, replacePlaces, updateFinanceSettings } = useAccommodations();

  // Routing + drawer state for panelized settings
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const panelParam = searchParams.get("panel");
  const { toast } = useToast();
  const panel: "current" | "places" | "finance" | null =
    panelParam === "current" || panelParam === "places" || panelParam === "finance"
      ? (panelParam as any)
      : null;
  function openPanel(p: "current" | "places" | "finance") {
    router.push(`${pathname}?panel=${p}`);
  }
  function closePanel() {
    router.replace(pathname);
  }

  // Migration to Convex
  const migrate = useMutation(api.import.importFromClient);
  const [migrating, setMigrating] = useState(false);
  const [migrateMessage, setMigrateMessage] = useState<string | null>(null);

  // Current home form state
  const [loanRows, setLoanRows] = useState<Array<{ principal: string; rate: string }>>([{ principal: "", rate: "" }]);
  useEffect(() => {
    const existing = (((current?.metrics as any)?.mortgage?.loans) ?? []) as Array<{ principal?: number; interestRateAnnual?: number }>;
    const next = (existing && existing.length > 0)
      ? existing.map((l) => ({
          principal: l?.principal != null ? nfSE2.format(l.principal) : "",
          rate: l?.interestRateAnnual != null ? nfSE2.format((l.interestRateAnnual || 0) * 100) : "",
        }))
      : [];
    const equal = next.length === loanRows.length && next.every((n, i) => n.principal === loanRows[i]?.principal && n.rate === loanRows[i]?.rate);
    if (!equal) setLoanRows(next);
  }, [current, loanRows]);

  // Places form state
  // Loan editor state (nested drawer)
  const [loanEditorOpen, setLoanEditorOpen] = useState(false);
  const [editingLoanIndex, setEditingLoanIndex] = useState<number | null>(null);
  const [editLoan, setEditLoan] = useState<{ principal: string; rate: string }>({ principal: "", rate: "" });
  function openLoanEditor(index?: number) {
    if (index == null) {
      setEditingLoanIndex(null);
      setEditLoan({ principal: "", rate: "" });
    } else {
      const l = loanRows[index];
      setEditingLoanIndex(index);
      setEditLoan({ principal: l?.principal ?? "", rate: l?.rate ?? "" });
    }
    setLoanEditorOpen(true);
  }
  function closeLoanEditor() { setLoanEditorOpen(false); }
  function commitLoan() {
    setLoanRows((rows) => {
      if (editingLoanIndex == null) return [...rows, editLoan];
      return rows.map((r, i) => (i === editingLoanIndex ? editLoan : r));
    });
    setLoanEditorOpen(false);
  }
  function removeLoan(index: number) {
    if (typeof window !== "undefined" && window.confirm("Ta bort lånet?")) {
      setLoanRows((rows) => rows.filter((_, i) => i !== index));
    }
  }

  const [placeRows, setPlaceRows] = useState<Array<{ id?: string; label: string; address: string; icon?: string; arriveBy?: string; leaveAt?: string }>>([]);
  useEffect(() => {
    const next = (places && places.length > 0)
      ? places.map((p) => ({ id: p.id, label: p.label ?? "", address: p.address ?? "", icon: p.icon, arriveBy: p.arriveBy, leaveAt: p.leaveAt }))
      : [];
    const equal = next.length === placeRows.length && next.every((n, i) => {
      const r = placeRows[i];
      return r && r.id === n.id && r.label === n.label && r.address === n.address && r.icon === n.icon && r.arriveBy === n.arriveBy && r.leaveAt === n.leaveAt;
    });
    if (!equal) setPlaceRows(next);
  }, [places, placeRows]);
  // Places editor state (nested drawer)
  const [placeEditorOpen, setPlaceEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editPlace, setEditPlace] = useState<{ id?: string; label: string; address: string; icon?: string; arriveBy?: string; leaveAt?: string }>({ label: "", address: "", icon: "Briefcase" });

  function openPlaceEditor(index?: number) {
    if (index == null) {
      setEditingIndex(null);
      setEditPlace({ label: "", address: "", icon: "Briefcase" });
    } else {
      const p = placeRows[index];
      setEditingIndex(index);
      setEditPlace({ id: p.id, label: p.label ?? "", address: p.address ?? "", icon: p.icon, arriveBy: p.arriveBy, leaveAt: p.leaveAt });
    }
    setPlaceEditorOpen(true);
  }
  function closePlaceEditor() { setPlaceEditorOpen(false); }
  function commitPlace() {
    setPlaceRows((rows) => {
      const next = editingIndex == null ? [...rows, editPlace] : rows.map((r, i) => (i === editingIndex ? editPlace : r));
      const cleaned = next
        .map((p) => ({
          id: p.id,
          label: p.label?.trim() || undefined,
          address: p.address?.trim() || undefined,
          icon: p.icon?.trim() || undefined,
          arriveBy: p.arriveBy?.trim() || undefined,
          leaveAt: p.leaveAt?.trim() || undefined,
        }))
        .filter((p) => p.label || p.address);
      replacePlaces(cleaned);
      return next;
    });
    setPlaceEditorOpen(false);
  }
  function removePlace(index: number) {
    if (typeof window !== "undefined" && window.confirm("Ta bort platsen?")) {
      setPlaceRows((rows) => {
        const next = rows.filter((_, i) => i !== index);
        const cleaned = next
          .map((p) => ({
            id: p.id,
            label: p.label?.trim() || undefined,
            address: p.address?.trim() || undefined,
            icon: p.icon?.trim() || undefined,
            arriveBy: p.arriveBy?.trim() || undefined,
            leaveAt: p.leaveAt?.trim() || undefined,
          }))
          .filter((p) => p.label || p.address);
        replacePlaces(cleaned);
        return next;
      });
    }
  }


  const ICON_CHOICES = [
    { value: "Briefcase", label: "Arbete – Portfölj" },
    { value: "Building2", label: "Arbete – Byggnad" },
    { value: "School", label: "Skola" },
    { value: "Users", label: "Familj" },
    { value: "ShoppingCart", label: "Butik" },
  ] as const;



  const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'local';


  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6">
      {/* Mobile-only account entry */}
      <section className="sm:hidden mb-4 rounded-2xl border border-border/60 bg-card/80 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Konto</div>
            <div className="text-xs text-muted-foreground">Hantera ditt konto</div>
          </div>
          <div>
            <SignedIn>
              <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <span className="text-sm font-medium px-3 py-1.5 rounded-md hover:bg-muted cursor-pointer">Logga in</span>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Settings index: simple, well-designed links that open drawers */}
      <section className="mx-auto max-w-3xl">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => openPanel('current')}
            className="rounded-2xl border border-border/60 bg-card/80 p-4 text-left hover:bg-muted/50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="text-sm font-semibold">Nuvarande bostad</div>
            <div className="mt-1 text-xs text-muted-foreground">Fyll i uppgifter om din nuvarande bostad för en tydligare bild av skillnaderna mellan din boendesituation och de objekt du jämför med.</div>
          </button>

          <button
            type="button"
            onClick={() => openPanel('places')}
            className="rounded-2xl border border-border/60 bg-card/80 p-4 text-left hover:bg-muted/50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="text-sm font-semibold">Viktiga platser</div>
            <div className="mt-1 text-xs text-muted-foreground">Lägg till viktiga platser (t.ex. arbete, skola, familj) så beräknar vi pendlingstider och visar dem på kartan för enklare jämförelser.</div>
          </button>

          <button
            type="button"
            onClick={() => openPanel('finance')}
            className="rounded-2xl border border-border/60 bg-card/80 p-4 text-left hover:bg-muted/50 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="text-sm font-semibold">Ekonomi</div>
            <div className="mt-1 text-xs text-muted-foreground">Ange ränta, kontantinsats och inkomster – då anpassas beräkningar som amortering, LTV och månadskostnad efter din situation.</div>
          </button>
        </div>
      </section>

      {/* Settings drawers */}
      <Drawer.Root open={!!panel} onOpenChange={(o) => { if (!o) closePanel(); }}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-background/80" />
          <Drawer.Content className="fixed z-50 overflow-hidden border border-border/60 bg-card p-4 sm:p-6 shadow-xl inset-x-0 bottom-0 h-[90vh] rounded-t-2xl sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:right-auto sm:h-auto sm:w-[720px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
            <Drawer.Title className="sr-only">Inställningar</Drawer.Title>
            <div className="mx-auto max-w-screen-md flex h-full flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">
                    {panel === 'current' ? 'Ställ in nuvarande bostad' : panel === 'places' ? 'Ställ in viktiga platser' : 'Ekonomi'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {panel === 'current' ? 'Fyll i de fält du vill. Allt är valfritt.' : panel === 'places' ? 'Lägg till destinationer som du bryr dig om.' : 'Standardvärden för beräkningar.'}
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => closePanel()}>Stäng</Button>
              </div>

              <div className="mt-4 space-y-4 overflow-y-auto">
                {panel === 'current' && (
                  <form
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget as HTMLFormElement);
                      const num = (v: FormDataEntryValue | null) => parseSwedishNumber((v as string) ?? undefined);
                      const valuation = num(fd.get('valuation'));
                      const loans = loanRows
                        .map((r) => {
                          const principal = parseSwedishNumber(r.principal) ?? NaN;
                          const percent = parseSwedishNumber(r.rate) ?? NaN; // e.g. 2,35
                          const interestRateAnnual = Number.isFinite(percent) ? percent / 100 : NaN;
                          return { principal, interestRateAnnual };
                        })
                        .filter((l) => Number.isFinite(l.principal) && l.principal! > 0 && Number.isFinite(l.interestRateAnnual) && l.interestRateAnnual! > 0);

                      upsertCurrentFromUser({
                        title: (fd.get('title') as string) || undefined,
                        address: (fd.get('address') as string) || undefined,
                        hyra: num(fd.get('hyra')),
                        driftkostnader: num(fd.get('driftkostnader')),
                        antalRum: num(fd.get('antalRum')),
                        boarea: num(fd.get('boarea')),
                        biarea: num(fd.get('biarea')),
                        tomtarea: num(fd.get('tomtarea')),
                        currentValuation: valuation,
                        mortgages: loans.length ? { loans } : undefined,
                      });
                      closePanel();
                      toast({ title: "Sparat", description: "Nuvarande bostad uppdaterad.", variant: "success" });
                    }}
                  >
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="title">Titel</Label>
                      <Input name="title" id="title" defaultValue={current?.title ?? 'Nuvarande hem'} placeholder="Nuvarande hem" />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label htmlFor="address">Adress</Label>
                      <Input name="address" id="address" defaultValue={current?.address ?? ''} placeholder="T.ex. Sundbyberg, Stockholm" />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="hyra">Hyra / mån (SEK)</Label>
                      <CurrencyInput name="hyra" id="hyra" defaultValue={current?.hyra ?? ''} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="driftkostnader">Driftkostnader / år (SEK)</Label>
                      <CurrencyInput name="driftkostnader" id="driftkostnader" defaultValue={current?.driftkostnader ?? ''} />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="antalRum">Antal rum</Label>
                      <Input name="antalRum" id="antalRum" type="number" inputMode="numeric" defaultValue={current?.antalRum ?? ''} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="boarea">Boarea (m²)</Label>
                      <Input name="boarea" id="boarea" type="number" inputMode="numeric" defaultValue={current?.boarea ?? ''} />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="biarea">Biarea (m²)</Label>
                      <Input name="biarea" id="biarea" type="number" inputMode="numeric" defaultValue={current?.biarea ?? ''} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="tomtarea">Tomtarea (m²)</Label>
                      <Input name="tomtarea" id="tomtarea" type="number" inputMode="numeric" defaultValue={current?.tomtarea ?? ''} />
                    </div>

                    <div className="space-y-1 sm:col-span-2 pt-1">
                      <Label htmlFor="valuation">Marknadsvärde (SEK)</Label>
                      <CurrencyInput name="valuation" id="valuation" defaultValue={current?.currentValuation ?? ''} />
                    </div>

                    <div className="sm:col-span-2 pt-2">
                      <div className="text-sm font-medium mb-1">Bolån</div>
                      {loanRows.length === 0 ? (
                        <div className="rounded-md border border-border/60 p-4 text-center text-sm text-muted-foreground">
                          <div>Lägg till dina bolån och räntor för att få en representativ totalkostnad.</div>
                          <Button type="button" className="mt-3" onClick={() => openLoanEditor()}>Lägg till lån</Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ul className="divide-y divide-border/60 rounded-md border border-border/60 overflow-hidden">
                            {loanRows.map((l, idx) => (
                              <li key={idx} className="flex items-center justify-between gap-2 p-3">
                                <div className="text-sm">
                                  <div className="font-medium">{l.principal || '—'} kr</div>
                                  <div className="text-xs text-muted-foreground">Ränta {l.rate || '—'} %</div>
                                </div>
                                <div className="flex gap-2">
                                  <Button type="button" variant="outline" size="sm" onClick={() => openLoanEditor(idx)}>Redigera</Button>
                                  <Button type="button" variant="destructive" size="sm" onClick={() => removeLoan(idx)}>Ta bort</Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-end">
                            <Button type="button" variant="secondary" size="sm" onClick={() => openLoanEditor()}>Lägg till lån</Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Nested drawer for add/edit loan */}
                    <Drawer.Root open={loanEditorOpen} onOpenChange={(o) => { if (!o) closeLoanEditor(); }}>
                      <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 z-[60] bg-background/80" />
                        <Drawer.Content className="fixed z-[70] overflow-hidden border border-border/60 bg-card p-4 sm:p-6 shadow-xl inset-x-0 bottom-0 h-[60vh] rounded-t-2xl sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:right-auto sm:h-auto sm:w-[520px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
                          <Drawer.Title className="text-base font-semibold">Lån</Drawer.Title>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1 sm:col-span-1">
                              <Label>Belopp (SEK)</Label>
                              <CurrencyInput value={editLoan.principal} onValueChange={({ formattedValue }) => setEditLoan((l) => ({ ...l, principal: formattedValue }))} />
                            </div>
                            <div className="space-y-1 sm:col-span-1">
                              <Label>Ränta (% år)</Label>
                              <PercentInput value={editLoan.rate} onValueChange={({ formattedValue }) => setEditLoan((l) => ({ ...l, rate: formattedValue }))} />
                            </div>
                            <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
                              <Button type="button" variant="ghost" onClick={closeLoanEditor}>Avbryt</Button>
                              <Button type="button" onClick={commitLoan}>{editingLoanIndex == null ? 'Lägg till' : 'Spara'}</Button>
                            </div>
                          </div>
                        </Drawer.Content>
                      </Drawer.Portal>
                    </Drawer.Root>

                    <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
                      <Button type="submit">Spara</Button>
                    </div>
                  </form>
                )}

                {panel === 'places' && (
                  <>
                    <div className="space-y-4">
                      {placeRows.length === 0 ? (
                        <div className="rounded-md border border-border/60 p-6 text-center text-sm text-muted-foreground">
                          <div>Inga viktiga platser ännu.</div>
                          <Button type="button" variant="secondary" size="sm" className="mt-3 rounded-xl gap-2" onClick={() => openPlaceEditor()}>
                            <Plus className="h-4 w-4" /> Lägg till viktig plats
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ul className="divide-y divide-border/60 rounded-md border border-border/60 overflow-hidden">
                            {placeRows.map((p, idx) => (
                              <li key={p.id ?? idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3">
                                <div className="text-sm">
                                  <div className="font-medium">{p.label || 'Namnlös plats'}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {[p.address, p.arriveBy && `Anländ ${p.arriveBy}`, p.leaveAt && `Lämna ${p.leaveAt}`].filter(Boolean).join(' · ')}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button type="button" variant="outline" size="sm" onClick={() => openPlaceEditor(idx)}>Redigera</Button>
                                  <Button type="button" variant="destructive" size="sm" onClick={() => removePlace(idx)}>Ta bort</Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                          <div className="flex justify-start">
                            <Button type="button" variant="secondary" size="sm" className="rounded-xl gap-2" onClick={() => openPlaceEditor()}>
                              <Plus className="h-4 w-4" /> Lägg till viktig plats
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Nested drawer for add/edit place */}
                    <Drawer.Root open={placeEditorOpen} onOpenChange={(o) => { if (!o) closePlaceEditor(); }}>
                      <Drawer.Portal>
                        <Drawer.Overlay className="fixed inset-0 z-[60] bg-background/80" />
                        <Drawer.Content className="fixed z-[70] overflow-hidden border border-border/60 bg-card p-4 sm:p-6 shadow-xl inset-x-0 bottom-0 h-[75vh] rounded-t-2xl sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:right-auto sm:h-auto sm:w-[640px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
                          <Drawer.Title className="text-base font-semibold">Viktig plats</Drawer.Title>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label>Etikett</Label>
                              <Input value={editPlace.label} onChange={(e) => setEditPlace((p) => ({ ...p, label: e.target.value }))} placeholder="Arbetsplats 1" />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <Label>Adress</Label>
                              <Input value={editPlace.address} onChange={(e) => setEditPlace((p) => ({ ...p, address: e.target.value }))} placeholder="T.ex. Kungsgatan 1, Stockholm" />
                            </div>
                            <div className="space-y-1">
                              <Label>Anländ senast</Label>
                              <Input type="time" value={editPlace.arriveBy ?? ''} onChange={(e) => setEditPlace((p) => ({ ...p, arriveBy: e.target.value }))} />
                            </div>
                            <div className="space-y-1">
                              <Label>Lämna vid</Label>
                              <Input type="time" value={editPlace.leaveAt ?? ''} onChange={(e) => setEditPlace((p) => ({ ...p, leaveAt: e.target.value }))} />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <Label>Ikon</Label>
                              <Select value={editPlace.icon ?? ''} onChange={(e) => setEditPlace((p) => ({ ...p, icon: e.target.value }))}>
                                <option value="">Välj ikon…</option>
                                {ICON_CHOICES.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </Select>
                            </div>
                            <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
                              <Button type="button" variant="ghost" onClick={closePlaceEditor}>Avbryt</Button>
                              <Button type="button" onClick={commitPlace}>{editingIndex == null ? 'Lägg till' : 'Spara'}</Button>
                            </div>
                          </div>
                        </Drawer.Content>
                      </Drawer.Portal>
                    </Drawer.Root>
                  </>
                )}


                {panel === 'finance' && (
                  <div>
                    <form
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget as HTMLFormElement);
                        const num = (v: FormDataEntryValue | null) => parseSwedishNumber((v as string) ?? undefined);
                        const downPct = num(fd.get('downPaymentRate'));
                        const ratePct = num(fd.get('interestRateAnnual'));
                        const income1 = num(fd.get('income1'));
                        const income2 = num(fd.get('income2'));
                        updateFinanceSettings({
                          downPaymentRate: Number.isFinite(downPct) ? (downPct as number) / 100 : finance.downPaymentRate,
                          interestRateAnnual: Number.isFinite(ratePct) ? (ratePct as number) / 100 : finance.interestRateAnnual,
                          incomeMonthlyPerson1: Number.isFinite(income1) ? (income1 as number) : undefined,
                          incomeMonthlyPerson2: Number.isFinite(income2) ? (income2 as number) : undefined,
                        });
                      }}
                    >
                      <div className="space-y-1">
                        <Label htmlFor="downPaymentRate">Kontantinsats (% av pris)</Label>
                        <PercentInput name="downPaymentRate" id="downPaymentRate" defaultValue={((finance?.downPaymentRate ?? 0.15) * 100).toString()} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="interestRateAnnual">Ränta (% per år)</Label>
                        <PercentInput name="interestRateAnnual" id="interestRateAnnual" defaultValue={((finance?.interestRateAnnual ?? 0.03) * 100).toString()} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="income1">Inkomst person 1 / mån (SEK)</Label>
                        <CurrencyInput name="income1" id="income1" defaultValue={finance?.incomeMonthlyPerson1 ?? ''} />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="income2">Inkomst person 2 / mån (SEK)</Label>
                        <CurrencyInput name="income2" id="income2" defaultValue={finance?.incomeMonthlyPerson2 ?? ''} />
                      </div>
                      <div className="sm:col-span-2 mt-2 flex justify-end gap-2">
                        <Button type="submit">Spara</Button>
                      </div>
                    </form>

                    {DATA_SOURCE !== 'convex' && (
                      <div className="mt-6 border-t border-border/60 pt-4">
                        <h3 className="text-sm font-medium">Migrering till Convex</h3>
                        <p className="text-xs text-muted-foreground mb-2">Flytta din lokala data (bostäder, platser, ekonomi, kortinställningar) till backend.</p>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={migrating}
                            onClick={async () => {
                              setMigrating(true);
                              setMigrateMessage(null);
                              const read = (k: string) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
                              try {
                                const accommodations = read('reskollen.accommodations.v1') ?? [];
                                const places = read('reskollen.places.v1') ?? [];
                                const finance = read('reskollen.finance.v1');
                                const prefs = read('reskollen.cardConfig.v1');
                                const res = await migrate({ accommodations, places, finance, prefs });
                                setMigrateMessage(`Migrerade ${res?.accUpserts ?? 0} bostäder, ${res?.placeUpserts ?? 0} platser`);
                              } catch (e) {
                                setMigrateMessage('Fel vid migrering. Försök igen.');
                              } finally {
                                setMigrating(false);
                              }
                            }}
                          >
                            {migrating ? 'Migrerar…' : 'Migrera data till Convex'}
                          </Button>
                          {migrateMessage && (
                            <span className="text-xs text-muted-foreground">{migrateMessage}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}



              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

    </div>
  );
}