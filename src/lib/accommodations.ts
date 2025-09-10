"use client";

import { useEffect, useMemo, useState } from "react";
import type { PropertyData } from "./parse";

// Core types for an accommodation/listing and extensible metrics
export type SEK = number; // store as integer (SEK)

export type Accommodation = {
  id: string;
  // kind distinguishes regular candidates from the user's current home
  kind?: "candidate" | "current"; // default: candidate
  title: string; // e.g., "3 rok i Sundbyberg"
  address?: string;
  // Position for mock map (percentages of container). We keep lat/lng optional for future real map.
  position: { xPercent: number; yPercent: number };
  lat?: number;
  lng?: number;
  color?: string; // Tailwind bg-... class for marker color
  imageUrl?: string; // optional listing image URL (scraped/provided); placeholder used when missing

  // Base scraped inputs
  begartPris?: SEK; // Begärt pris (not applicable for kind === "current")
  driftkostnader?: SEK; // Årlig drift
  hyra?: SEK; // Månadsavgift / hyra
  antalRum?: number; // antal rum
  boarea?: number; // m²
  biarea?: number; // m²
  tomtarea?: number; // m²

  // Current home specific
  currentValuation?: SEK; // Marknadsvärde (SEK) for current home

  // Derived/calculated fields (filled later)
  kontantinsats?: SEK; // not applicable for kind === "current"
  lan?: SEK;
  amorteringPerManad?: SEK;
  rantaPerManad?: SEK;

  // Main KPI: total monthly cost (all expenses combined)
  totalMonthlyCost?: SEK;
  // Whether annual maintenance/driftkostnader was missing (so monthly total excludes it)
  maintenanceUnknown?: boolean;

  // Extensible metrics: commute times, distances, etc.
  metrics?: Record<string, unknown>;
};

const STORAGE_KEY = "reskollen.accommodations.v1";
const PLACES_STORAGE_KEY = "reskollen.places.v1";

export type ImportantPlace = {
  id: string;
  label?: string;
  address?: string;
  icon?: string; // Lucide icon name, optional
};

function randomFrom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function loadPlacesFromStorage(): ImportantPlace[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PLACES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ImportantPlace[];
    return parsed;
  } catch {
    return null;
  }
}

function savePlacesToStorage(list: ImportantPlace[]) {
  try {
    localStorage.setItem(PLACES_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

// Deterministic pseudo-random for mock commute generation
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seededMinutes(accommodationId: string, placeId: string): number {
  const h = hashString(`${accommodationId}::${placeId}`);
  // 12..60 minutes (inclusive lower bound)
  return 12 + (h % 49); // 12..60
}

function placeholderImageUrl(seed: string): string {
  // Stable placeholder; using picsum with deterministic seed yields a consistent image per item
  const s = seed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || 'home';
  return `https://picsum.photos/seed/${s}/640/360`;
}

const COLOR_CLASSES = [
  "bg-sky-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
];

function seedMockData(): Accommodation[] {
  const samples: Array<Partial<Accommodation> & { title: string; address: string }> = [
    { title: "2 rok nära Odenplan", address: "Vasastan, Stockholm" },
    { title: "3 rok i Sundbyberg", address: "Sundbyberg, Stockholm" },
    { title: "Radhus i Nacka", address: "Nacka, Stockholm" },
  ];

  return samples.map((s, i) => {
    const id = generateId();
    return {
      id,
      kind: "candidate",
      title: s.title,
      address: s.address,
      position: { xPercent: 40 + i * 8 + randomBetween(-3, 3), yPercent: 40 + i * 6 + randomBetween(-3, 3) },
      color: COLOR_CLASSES[i % COLOR_CLASSES.length],
      imageUrl: placeholderImageUrl(id),
      begartPris: Math.round(randomBetween(2.8, 6.5) * 1_000_000),
      driftkostnader: Math.round(randomBetween(10_000, 25_000)),
      hyra: Math.round(randomBetween(2_800, 5_200)),
      antalRum: 2 + (i % 3),
      boarea: Math.round(randomBetween(45, 95)),
      biarea: Math.round(randomBetween(0, 20)),
      tomtarea: Math.round(randomBetween(0, 250)),
      metrics: {
        commute: {
          work: Math.round(randomBetween(18, 55)),
          grocery: Math.round(randomBetween(3, 15)),
          school: Math.round(randomBetween(6, 25)),
        },
      },
    };
  });
}

function loadFromStorage(): Accommodation[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Accommodation[];
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(list: Accommodation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}
// Defaults and calculation helpers for financial KPIs
const FINANCE_DEFAULTS = {
  downPaymentRate: 0.15, // 15% kontantinsats
  amortizationRateAnnual: 0.02, // 2% per year
  interestRateAnnual: 0.03, // 3% per year
} as const;

// Fills in missing mock fields for older localStorage records without overwriting existing values
function ensureMockCompleteness(a: Accommodation): Accommodation {
  const next: Accommodation = { ...a };
  // Basic numbers
  if (next.antalRum == null) next.antalRum = Math.round(randomBetween(1, 5));
  if (next.boarea == null) next.boarea = Math.round(randomBetween(30, 120));
  if (next.kind !== "current") {
    if (next.begartPris == null) next.begartPris = Math.round(randomBetween(2.5, 8.5) * 1_000_000);
    if (next.driftkostnader == null) next.driftkostnader = Math.round(randomBetween(8_000, 28_000));
  }
  if (next.hyra == null) next.hyra = Math.round(randomBetween(2_500, 6_500));
  if (next.tomtarea == null && Math.random() < 0.6) next.tomtarea = Math.round(randomBetween(100, 900));
  if (!next.imageUrl) next.imageUrl = placeholderImageUrl(next.id);

  // Commute metrics
  const hasCommute = (next.metrics as any)?.commute != null;
  if (!hasCommute) {
    next.metrics = {
      ...(next.metrics ?? {}),
      commute: {
        work: Math.round(randomBetween(18, 55)),
        grocery: Math.round(randomBetween(3, 15)),
        school: Math.round(randomBetween(6, 25)),
      },
    };
  }
  return next;
}

function computeDerived(a: Accommodation): Accommodation {
  const maintenanceUnknown = a.driftkostnader == null || a.driftkostnader === 0; // treat 0 as missing
  const annualMaintenance = maintenanceUnknown ? 0 : (a.driftkostnader!);
  const maintenancePerMonth = Math.round(annualMaintenance / 12);
  const hyraPerManad = Math.round(a.hyra ?? 0);

  let kontantinsats: number | undefined = undefined;
  let lan: number | undefined = undefined;
  let amorteringPerManad: number | undefined = undefined;
  let rantaPerManad: number | undefined = undefined;

  if (a.kind !== "current" && a.begartPris && a.begartPris > 0) {
    // Candidate purchase scenario (estimated)
    kontantinsats = Math.round(a.begartPris * FINANCE_DEFAULTS.downPaymentRate);
    lan = Math.max(0, a.begartPris - kontantinsats);
    amorteringPerManad = Math.round((lan * FINANCE_DEFAULTS.amortizationRateAnnual) / 12);
    rantaPerManad = Math.round((lan * FINANCE_DEFAULTS.interestRateAnnual) / 12);
  } else if (a.kind === "current") {
    // Current home with optional mortgage details
    const mortgage = (a.metrics as any)?.mortgage as
      | { loans?: { principal: number; interestRateAnnual: number }[] }
      | undefined;
    const loans = mortgage?.loans ?? [];
    const totalDebt = loans.reduce((sum, l) => sum + (l?.principal ?? 0), 0);
    const monthlyInterest = loans.reduce(
      (sum, l) => sum + Math.round(((l?.principal ?? 0) * (l?.interestRateAnnual ?? 0)) / 12),
      0
    );

    // Compute amortization rate based on LTV tiers if valuation is present
    let amortRateAnnual = 0;
    const valuation = a.currentValuation ?? 0;
    if (valuation > 0 && totalDebt > 0) {
      const ltv = totalDebt / valuation;
      if (ltv > 0.7) amortRateAnnual = 0.02;
      else if (ltv > 0.5) amortRateAnnual = 0.01;
      else amortRateAnnual = 0;
      // Note: additional 1% for high debt-to-income not applied (no income data yet)
    }
    const monthlyAmort = Math.round((totalDebt * amortRateAnnual) / 12);

    amorteringPerManad = monthlyAmort > 0 ? monthlyAmort : undefined;
    rantaPerManad = monthlyInterest > 0 ? monthlyInterest : undefined;
  }

  const totalMonthlyCost =
    (hyraPerManad || 0) +
    (maintenancePerMonth || 0) +
    (amorteringPerManad || 0) +
    (rantaPerManad || 0);

  return {
    ...a,
    kontantinsats,
    lan,
    amorteringPerManad,
    rantaPerManad,
    totalMonthlyCost,
    maintenanceUnknown,
  };
}


export type CurrentHomeInput = {
  title?: string;
  address?: string;
  hyra?: SEK;
  driftkostnader?: SEK; // annual
  antalRum?: number;
  boarea?: number;
  biarea?: number;
  tomtarea?: number;
  currentValuation?: SEK;
  mortgages?: { loans: { principal: SEK; interestRateAnnual: number }[] };
  workplaces?: {
    person1?: { name?: string; address?: string };
    person2?: { name?: string; address?: string };
  };
};

export function useAccommodations() {
  const [accommodations, setAccommodations] = useState<Accommodation[] | null>(null);
  const [places, setPlaces] = useState<ImportantPlace[] | null>(null);

  // Load once on mount; seed if empty
  useEffect(() => {
    const loaded = loadFromStorage();
    if (loaded && loaded.length > 0) {
      const processed = loaded.map(ensureMockCompleteness).map(computeDerived);

      setAccommodations(processed);
      saveToStorage(processed);
    } else {
      const seeded = seedMockData();
      const processed = seeded.map(ensureMockCompleteness).map(computeDerived);
      setAccommodations(processed);
      saveToStorage(processed);
    }
    // load places
    const loadedPlaces = loadPlacesFromStorage();
    if (loadedPlaces && loadedPlaces.length > 0) setPlaces(loadedPlaces);
    else setPlaces([{ id: generateId(), label: undefined, address: undefined }, { id: generateId(), label: undefined, address: undefined }]);
  }, []);
  const commuteIndex = useMemo(() => {
    const idx: Record<string, Record<string, number>> = {};
    const accs = accommodations ?? [];
    const ps = places ?? [];
    for (const a of accs) {
      const m: Record<string, number> = {};
      for (const p of ps) {
        if (!p.id) continue;
        m[p.id] = seededMinutes(a.id, p.id);
      }
      idx[a.id] = m;
    }
    return idx;
  }, [accommodations, places]);

  function commuteFor(accommodationId: string): Record<string, number> {
    return commuteIndex[accommodationId] ?? {};
  }


  const api = useMemo(() => {
    function commit(updater: (prev: Accommodation[]) => Accommodation[]) {
      setAccommodations((prev) => {
        const base = prev ?? [];
        const next = updater(base).map(ensureMockCompleteness).map(computeDerived);
        saveToStorage(next);
        return next;
      });
    }

    function add(accommodation: Omit<Accommodation, "id"> & Partial<Pick<Accommodation, "id">>) {
      const id = accommodation.id ?? generateId();
      commit((prev) => [{ ...accommodation, id }, ...prev]);
    }

    function addMock() {
      const titles = [

        "Ljus 3:a med balkong",
        "Charmig 2:a nära vatten",
        "Nyproducerad 4:a",
        "Radhus med trädgård",
      ];
      const places = [
        "Södermalm, Stockholm",
        "Solna, Stockholm",
        "Bromma, Stockholm",
        "Täby, Stockholm",
      ];

      const id = generateId();
      const newItem: Accommodation = {
        id,
        kind: "candidate",
        title: randomFrom(titles),
        address: randomFrom(places),
        position: { xPercent: Math.round(randomBetween(15, 85)), yPercent: Math.round(randomBetween(15, 80)) },
        color: randomFrom(COLOR_CLASSES),
        imageUrl: placeholderImageUrl(id),
        begartPris: Math.round(randomBetween(2.5, 8.5) * 1_000_000),
        driftkostnader: Math.round(randomBetween(8_000, 28_000)),
        hyra: Math.round(randomBetween(2_500, 6_500)),
        antalRum: Math.round(randomBetween(1, 5)),
        boarea: Math.round(randomBetween(30, 140)),
        biarea: Math.round(randomBetween(0, 25)),
        tomtarea: Math.round(randomBetween(0, 400)),
        metrics: {
          commute: {
            work: Math.round(randomBetween(18, 55)),
            grocery: Math.round(randomBetween(3, 15)),
            school: Math.round(randomBetween(6, 25)),
          },
        },
      };
      commit((prev) => [newItem, ...prev]);
      return newItem;
    }

    function remove(id: string) {
      commit((prev) => prev.filter((a) => a.id !== id));
    }

    function update(id: string, patch: Partial<Accommodation>) {
      commit((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    }

    function clear() {
      commit(() => []);
    }

    function replacePlaces(next: Array<Partial<ImportantPlace>>) {
      const finalized: ImportantPlace[] = (next ?? []).map((p) => ({
        id: p.id ?? generateId(),
        label: p.label,
        address: p.address,
        icon: p.icon,
      }));
      setPlaces(finalized);
      savePlacesToStorage(finalized);
    }

    // Create or update current accommodation from user-provided input (non-destructive)
    function upsertCurrentFromUser(input: CurrentHomeInput) {
      commit((prev) => {
        const existingIdx = prev.findIndex((a) => a.kind === "current");
        const base: Accommodation = existingIdx >= 0 ? prev[existingIdx] : {
          id: generateId(),
          kind: "current",
          title: "Nuvarande hem",
          address: undefined,
          position: { xPercent: Math.round(randomBetween(20, 80)), yPercent: Math.round(randomBetween(20, 75)) },
          color: "bg-slate-600",
        } as Accommodation;

        const nextMetrics = {
          ...(base.metrics ?? {}),
          workplaces: input.workplaces ?? (base.metrics as any)?.workplaces,
          mortgage: input.mortgages ?? (base.metrics as any)?.mortgages ?? (base.metrics as any)?.mortgage,
        } as Record<string, unknown>;

        const updated: Accommodation = {
          ...base,
          kind: "current",
          title: input.title ?? base.title,
          address: input.address ?? base.address,
          hyra: input.hyra ?? base.hyra,
          driftkostnader: input.driftkostnader ?? base.driftkostnader,
          antalRum: input.antalRum ?? base.antalRum,
          boarea: input.boarea ?? base.boarea,
          biarea: input.biarea ?? base.biarea,
          tomtarea: input.tomtarea ?? base.tomtarea,
          currentValuation: input.currentValuation ?? base.currentValuation,
          metrics: nextMetrics,
        };

        if (existingIdx >= 0) {
          const arr = [...prev];
          arr[existingIdx] = updated;
          return arr;
        }
        return [updated, ...prev];
      });
    }

    // Create or update a single persistent current accommodation (mock data)
    function addOrUpdateCurrentMock() {
      const titles = ["Nuvarande hem", "Vårt hem", "Min bostad"];
      const places = [
        "Stockholm",
        "Solna, Stockholm",
        "Sundbyberg, Stockholm",
        "Bromma, Stockholm",
      ];
      const id = generateId();
      const mock: Accommodation = {
        id,
        kind: "current",
        title: randomFrom(titles),
        address: randomFrom(places),
        position: { xPercent: Math.round(randomBetween(20, 80)), yPercent: Math.round(randomBetween(20, 75)) },
        color: "bg-slate-600",
        imageUrl: placeholderImageUrl(id),
        // Fields like begartPris/kontantinsats are intentionally omitted for current
        hyra: Math.round(randomBetween(2_500, 6_500)),
        antalRum: Math.round(randomBetween(1, 5)),
        boarea: Math.round(randomBetween(30, 120)),
        metrics: {
          commute: {
            work: Math.round(randomBetween(18, 55)),
            grocery: Math.round(randomBetween(3, 15)),
            school: Math.round(randomBetween(6, 25)),
          },
        },
      };

      commit((prev) => {
        const existingIdx = prev.findIndex((a) => a.kind === "current");
        if (existingIdx >= 0) {
          const updated = { ...prev[existingIdx], ...mock, id: prev[existingIdx].id };
          const next = [...prev];
          next[existingIdx] = updated;
          return next;
        }
        return [mock, ...prev];
      });
    }

    function addFromParsed(pd: PropertyData, sourceUrl?: string) {
      const id = generateId();
      const titleFromAddress = pd.address ? pd.address.split(",")[0] : null;
      const title = titleFromAddress || (pd.rooms && pd.livingArea ? `${pd.rooms} rok, ${pd.livingArea} m²` : "Importerad bostad");
      const item: Accommodation = {
        id,
        kind: "candidate",
        title,
        address: pd.address ?? undefined,
        position: { xPercent: Math.round(randomBetween(15, 85)), yPercent: Math.round(randomBetween(15, 80)) },
        color: randomFrom(COLOR_CLASSES),
        imageUrl: pd.imageUrl ?? placeholderImageUrl(id),
        begartPris: pd.price ?? undefined,
        driftkostnader: pd.operatingCost ?? undefined,
        hyra: pd.monthlyFee ?? undefined,
        antalRum: pd.rooms ?? undefined,
        boarea: pd.livingArea ?? undefined,
        metrics: {
          ...(sourceUrl ? { sourceUrl } : {}),
        },
      };
      commit((prev) => [item, ...prev]);
      return item;
    }

    return { add, addMock, addFromParsed, remove, update, clear, addOrUpdateCurrentMock, upsertCurrentFromUser, replacePlaces };
  }, []);

  const current = (accommodations ?? []).find((a) => a.kind === "current") ?? null;
  return { accommodations: accommodations ?? [], current, places: places ?? [], commuteFor, ...api } as const;
}

