"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api as convexApi } from "@/../convex/_generated/api";

import type { PropertyData } from "./parse";

// Core types for an accommodation/listing and extensible metrics
export type SEK = number; // store as integer (SEK)

export type Accommodation = {
  id: string;
  // kind distinguishes regular candidates from the user's current home
  kind?: "candidate" | "current"; // default: candidate
  title: string; // e.g., "3 rok i Sundbyberg"
  address?: string;
  postort?: string; // e.g., stadsdel/postort
  kommun?: string;  // e.g., Uppsala kommun
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
  constructionYear?: number; // byggår

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
  // If we had to estimate driftkostnader via the schablon model
  driftkostnaderSchablon?: SEK;
  driftkostnaderIsEstimated?: boolean;

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
  // Typical Monday commute timing preferences
  arriveBy?: string; // 'HH:MM' local time to arrive at the place
  leaveAt?: string;  // 'HH:MM' local time to leave the place
};

export type TravelMode = "transit" | "driving" | "bicycling";

const COMMUTE_CACHE_KEY = "reskollen.commuteCache.v1";
type CommuteCacheEntry = { minutes: number; updatedAt: number };
function loadCommuteCache(): Record<string, CommuteCacheEntry> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(COMMUTE_CACHE_KEY) || "{}"); } catch { return {}; }
}
function saveCommuteCache(map: Record<string, CommuteCacheEntry>) {
  try { localStorage.setItem(COMMUTE_CACHE_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}
function getCacheKey(origin: string, destination: string, mode: TravelMode, arriveBy?: string | null, departAt?: string | null) {
  return `${origin}::${destination}::${mode}::${arriveBy ?? ''}::${departAt ?? ''}`;
}

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

const FINANCE_STORAGE_KEY = "reskollen.finance.v1";
export type FinanceSettings = {
  downPaymentRate: number; // e.g., 0.15
  interestRateAnnual: number; // e.g., 0.03
  incomeMonthlyPerson1?: number;
  incomeMonthlyPerson2?: number;
};
function loadFinanceFromStorage(): FinanceSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FINANCE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FinanceSettings;
  } catch { return null; }
}
function saveFinanceToStorage(f: FinanceSettings) {
  try { localStorage.setItem(FINANCE_STORAGE_KEY, JSON.stringify(f)); } catch { /* ignore */ }
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


// Coerce heterogeneous values (numbers, strings, Money-like objects) to number
function num(x: any): number | undefined {
  if (x == null) return undefined;
  if (typeof x === 'number' && Number.isFinite(x)) return x;
  if (typeof x === 'string') {
    const s = x.replace(/[^\d.,-]/g, '').replace(/\s+/g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }
  if (typeof x === 'object') {
    const amt: any = (x as any)?.amount ?? (x as any)?.value ?? (x as any)?.raw ?? (x as any)?.v;
    if (typeof amt === 'number' && Number.isFinite(amt)) return amt;
    if (typeof amt === 'string') {
      const s = amt.replace(/[^\d.,-]/g, '').replace(',', '.');
      const n = Number(s);
      return Number.isFinite(n) ? n : undefined;
    }
  }
  return undefined;
}

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
      constructionYear: Math.round(randomBetween(1945, 2022)),
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
  if (next.constructionYear == null) next.constructionYear = Math.round(randomBetween(1945, 2022));
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


// In Convex mode, avoid filling financial mocks (hyra/driftkostnader/etc.). Only ensure image placeholder.
function ensureMinimalDefaultsConvex(a: Accommodation): Accommodation {
  const next: Accommodation = { ...a };
  if (!next.imageUrl) next.imageUrl = placeholderImageUrl(next.id);
  return next;
}

// Schablonmodell för årlig driftkostnad (villa)
function computeSchablonDriftkostnad(a: Accommodation): number {
  // 1) Grundkostnad
  let total = 30000;
  // 2) Tillägg baserat på boarea
  const area = typeof a.boarea === 'number' && Number.isFinite(a.boarea) ? a.boarea : 0;
  total += area * 150;
  // 3) Justering baserat på byggår
  const y = a.constructionYear;
  if (typeof y === 'number' && Number.isFinite(y)) {
    if (y >= 1900 && y <= 1979) total = Math.round(total * 1.10);
    else if (y >= 1980 && y <= 1999) total = Math.round(total * 1.05);
    // 2000+ no change
  }
  // 4) Justering baserat på energiklass
  const energyClassRaw = ((a.metrics as any)?.meta?.energyClass ?? (a as any)?.meta?.energyClass) as string | undefined;
  if (typeof energyClassRaw === 'string') {
    const E = energyClassRaw.trim().toUpperCase();
    if (E === 'A' || E === 'B') total = Math.round(total * 0.90);
    else if (E === 'E' || E === 'F') total = Math.round(total * 1.05);
    else if (E === 'G') total = Math.round(total * 1.10);
    // C-D: no change
  }
  return Math.max(0, Math.round(total));
}

function computeDerived(a: Accommodation, finance: FinanceSettings): Accommodation {
  const hadNoDrift = a.driftkostnader == null || a.driftkostnader === 0;
  const schablon = hadNoDrift ? computeSchablonDriftkostnad(a) : undefined;
  const annualMaintenance = (schablon ?? (a.driftkostnader ?? 0));
  const maintenanceEstimated = schablon != null;
  const maintenanceUnknown = !maintenanceEstimated && (a.driftkostnader == null || a.driftkostnader === 0);
  const maintenancePerMonth = Math.round(annualMaintenance / 12);
  const hyraPerManad = Math.round(a.hyra ?? 0);

  let kontantinsats: number | undefined = undefined;
  let lan: number | undefined = undefined;
  let amorteringPerManad: number | undefined = undefined;
  let rantaPerManad: number | undefined = undefined;

  if (a.kind !== "current" && a.begartPris && a.begartPris > 0) {
    // Candidate purchase scenario (estimated)
    const downRate = Math.max(0, Math.min(1, finance.downPaymentRate ?? FINANCE_DEFAULTS.downPaymentRate));
    kontantinsats = Math.round(a.begartPris * downRate);
    lan = Math.max(0, a.begartPris - kontantinsats);
    // LTV-based amortization tiers
    const ltv = lan > 0 ? lan / a.begartPris : 0;
    let amortRateAnnual = ltv > 0.7 ? 0.02 : ltv > 0.5 ? 0.01 : 0;
    // DTI-based surcharge: +1% if debt-to-income > 4.5x (Skuldkvotstillägg)
    const monthlyIncomeTotal = (finance.incomeMonthlyPerson1 ?? 0) + (finance.incomeMonthlyPerson2 ?? 0);
    const annualIncomeTotal = monthlyIncomeTotal > 0 ? monthlyIncomeTotal * 12 : 0;
    if (annualIncomeTotal > 0) {
      const dti = lan > 0 ? lan / annualIncomeTotal : 0;
      if (dti > 4.5) amortRateAnnual += 0.01;
    }
    amorteringPerManad = Math.round((lan * amortRateAnnual) / 12);
    rantaPerManad = Math.round((lan * (finance.interestRateAnnual ?? FINANCE_DEFAULTS.interestRateAnnual)) / 12);
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
      // DTI-based surcharge: +1% if debt-to-income > 4.5x (Skuldkvotstillägg)
      const monthlyIncomeTotal = (finance.incomeMonthlyPerson1 ?? 0) + (finance.incomeMonthlyPerson2 ?? 0);
      const annualIncomeTotal = monthlyIncomeTotal > 0 ? monthlyIncomeTotal * 12 : 0;
      if (annualIncomeTotal > 0) {
        const dti = totalDebt / annualIncomeTotal;
        if (dti > 4.5) amortRateAnnual += 0.01;
      }
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
    driftkostnaderSchablon: maintenanceEstimated ? schablon : undefined,
    driftkostnaderIsEstimated: maintenanceEstimated,
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
  const COMMUTE_SOURCE = process.env.NEXT_PUBLIC_COMMUTE_SOURCE ?? 'client';
  const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE ?? 'local';


  const [accommodations, setAccommodations] = useState<Accommodation[] | null>(null);
  const [places, setPlaces] = useState<ImportantPlace[] | null>(null);
  const [finance, setFinance] = useState<FinanceSettings>({
    downPaymentRate: FINANCE_DEFAULTS.downPaymentRate,
    interestRateAnnual: FINANCE_DEFAULTS.interestRateAnnual,
  });
  // Convex hooks for server-side scheduling and reading results
  const addAccommodationConv = useMutation(convexApi.accommodations.add);
  const updateAccommodationConv = useMutation(convexApi.accommodations.update);
  const removeAccommodationConv = useMutation(convexApi.accommodations.remove);
  const upsertCurrentConv = useMutation((convexApi as any).accommodations.upsertCurrent);

  const convexAccs = useQuery(convexApi.accommodations.list, {});
  const financeRow = useQuery(convexApi.finance.get, {});
  const bulkReplacePlaces = useMutation(convexApi.places.bulkReplace);
  const upsertFinance = useMutation(convexApi.finance.upsert);

  const convexPlaces = useQuery(convexApi.places.list, {});
  const commuteResults = useQuery(convexApi.commute.listForUser, {});

  // Live Directions API results (minutes) keyed by accommodationId -> placeId -> mode
  const [realCommute, setRealCommute] = useState<Record<string, Record<string, Record<TravelMode, number>>>>({});

  // Load once on mount; seed if empty
  useEffect(() => {
    // Load finance settings first
    const loadedFinance = loadFinanceFromStorage();
    const f: FinanceSettings = loadedFinance ?? {
      downPaymentRate: FINANCE_DEFAULTS.downPaymentRate,
      interestRateAnnual: FINANCE_DEFAULTS.interestRateAnnual,
      incomeMonthlyPerson1: undefined,
      incomeMonthlyPerson2: undefined,
    };
    setFinance(f);
    if (DATA_SOURCE === 'convex') {
      // In Convex mode, skip localStorage seeding; hydrate from Convex queries via effects
      return;
    }


    const loaded = loadFromStorage();
    if (loaded && loaded.length > 0) {
      const processed = loaded.map(ensureMockCompleteness).map((a) => computeDerived(a, f));
      setAccommodations(processed);
      saveToStorage(processed);
    } else {
      const seeded = seedMockData();
      const processed = seeded.map(ensureMockCompleteness).map((a) => computeDerived(a, f));
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

  // Only populate from cache on load; no network calls here
  useEffect(() => {
    const accs = accommodations ?? [];
    const ps = places ?? [];
    if (accs.length === 0 || ps.length === 0) return;
    const cache = loadCommuteCache();
    const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

    const next: Record<string, Record<string, Record<TravelMode, number>>> = {};
    for (const a of accs) {
      for (const p of ps) {
        const origin = a.address ?? a.title;
        const destination = p.address ?? p.label;
        if (!origin || !destination) continue;
        // Only hydrate transit from cache by default
        const key = getCacheKey(origin, destination, 'transit', p.arriveBy ?? null, null);
        const entry = cache[key];

        if (entry && Date.now() - entry.updatedAt < TTL_MS) {
          next[a.id] = next[a.id] ?? {};
          next[a.id][p.id] = { ...(next[a.id][p.id] ?? {}), transit: entry.minutes } as Record<TravelMode, number>;
        }
      }
    }
    if (Object.keys(next).length > 0) {
      setRealCommute((prev) => ({ ...prev, ...next }));
    }
  }, [accommodations, places]);
  // Overlay Convex commute results onto UI when using server source
  useEffect(() => {
    if (COMMUTE_SOURCE !== 'convex') return;
    if (!commuteResults || !convexAccs || !convexPlaces) return;
    const accIdToClient = new Map<string, string>();
    for (const a of convexAccs) accIdToClient.set((a as any)._id, (a as any).clientId);
    const placeIdToClient = new Map<string, string>();
    for (const p of convexPlaces) placeIdToClient.set((p as any)._id, (p as any).clientId);

    const next: Record<string, Record<string, Record<TravelMode, number>>> = {};
    for (const r of commuteResults as any[]) {
      const aLocal = accIdToClient.get(r.accommodationId);
      const pLocal = placeIdToClient.get(r.placeId);
      if (!aLocal || !pLocal) continue;
      next[aLocal] = next[aLocal] ?? {};
      const modes = (next[aLocal][pLocal] ?? {}) as Record<TravelMode, number>;
      modes[r.mode as TravelMode] = r.minutes as number;
      next[aLocal][pLocal] = modes;
    }
    if (Object.keys(next).length > 0) {
      setRealCommute((prev) => ({ ...prev, ...next }));
    }
  }, [COMMUTE_SOURCE, commuteResults, convexAccs, convexPlaces]);
  // Hydrate finance from Convex when in Convex mode
  useEffect(() => {
    if (DATA_SOURCE !== 'convex') return;
    if (!financeRow) return;
    const f = {
      downPaymentRate: (financeRow as any).downPaymentRate ?? FINANCE_DEFAULTS.downPaymentRate,
      interestRateAnnual: (financeRow as any).interestRateAnnual ?? FINANCE_DEFAULTS.interestRateAnnual,
      incomeMonthlyPerson1: (financeRow as any).incomeMonthlyPerson1,
      incomeMonthlyPerson2: (financeRow as any).incomeMonthlyPerson2,
    } as FinanceSettings;
    setFinance(f);
  }, [DATA_SOURCE, financeRow]);

  // Hydrate accommodations from Convex when in Convex mode
  useEffect(() => {
    if (DATA_SOURCE !== 'convex') return;
    if (!convexAccs) return;
    const mapped = (convexAccs as any[]).map((a) => ({
      id: a.clientId ?? generateId(),
      kind: a.kind,
      title: a.title,
      address: a.address,
      postort: a.postort,
      kommun: a.kommun,
      imageUrl: a.imageUrl,
      color: a.color,
      position: a.position,
      begartPris: a.begartPris,
      driftkostnader: a.driftkostnader,
      hyra: a.hyra,
      antalRum: a.antalRum,
      boarea: a.boarea,
      biarea: a.biarea,
      tomtarea: a.tomtarea,
      constructionYear: a.constructionYear,
      currentValuation: a.currentValuation,
      metrics: {
        ...(a.metrics ?? {}),
        ...(a.meta ? { meta: a.meta } : {}),
        ...(a.hemnetStats ? { hemnetStats: a.hemnetStats } : {}),
        ...(a.media ? { media: a.media } : {}),
        ...(a.sourceUrls ? { sourceUrls: a.sourceUrls } : {}),
        ...(a.mortgage ? { mortgage: a.mortgage } : {}),
      },
    })) as Accommodation[];
    const processed = mapped.map(ensureMinimalDefaultsConvex).map((x) => computeDerived(x, finance));
    setAccommodations(processed);
  }, [DATA_SOURCE, convexAccs, finance]);

  // Hydrate places from Convex when in Convex mode
  useEffect(() => {
    if (DATA_SOURCE !== 'convex') return;
    if (!convexPlaces) return;
    const mapped = (convexPlaces as any[]).map((p) => ({
      id: p.clientId,
      label: p.label,
      address: p.address,
      icon: p.icon,
      arriveBy: p.arriveBy,
      leaveAt: p.leaveAt,
    })) as ImportantPlace[];
    setPlaces(mapped);
  }, [DATA_SOURCE, convexPlaces]);



  // Helper: fetch and cache minutes for a pair, defaulting to transit mode
  async function fetchCommuteForPair(accommodation: Accommodation, place: ImportantPlace, mode: TravelMode = 'transit') {
    const origin = accommodation.address ?? accommodation.title;
    const destination = place.address ?? place.label;
    if (!origin || !destination) return;

    const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
    const cacheKey = getCacheKey(origin, destination, mode, mode === 'transit' ? (place.arriveBy ?? null) : null, null);
    let cache = loadCommuteCache();
    const entry = cache[cacheKey];
    if (entry && Date.now() - entry.updatedAt < TTL_MS) {
      const minutes = entry.minutes;

      setRealCommute((prev) => ({
        ...prev,
        [accommodation.id]: {
          ...(prev[accommodation.id] ?? {}),
          [place.id]: { ...(prev[accommodation.id]?.[place.id] ?? {}), [mode]: minutes },
        },
      }));
      return;
    }

    const params = new URLSearchParams({ origin, destination, mode });
    if (mode === 'transit' && place.arriveBy) params.set('arriveBy', place.arriveBy);
    const resp = await fetch(`/api/directions?${params.toString()}`);
    if (!resp.ok) return;
    const json = await resp.json();
    const minutes: number | null = json?.minutes ?? null;
    if (minutes == null) return;

    setRealCommute((prev) => ({
      ...prev,
      [accommodation.id]: {
        ...(prev[accommodation.id] ?? {}),
        [place.id]: { ...(prev[accommodation.id]?.[place.id] ?? {}), [mode]: minutes },
      },
    }));
    cache = loadCommuteCache();
    cache[cacheKey] = { minutes, updatedAt: Date.now() };
    saveCommuteCache(cache);
  }

  async function prefetchForAccommodationOnAdd(accId: string, mode: TravelMode = 'transit') {
    const a = (accommodations ?? []).find((x) => x.id === accId);
    if (!a) return;
    const ps = (places ?? []).filter((p) => p.id && (p.label || p.address));
    const CONC = 2;
    for (let i = 0; i < ps.length; i += CONC) {
      await Promise.all(ps.slice(i, i + CONC).map((p) => fetchCommuteForPair(a, p, mode)));
    }
  }

  async function prefetchForPlaceOnAdd(placeId: string, mode: TravelMode = 'transit') {
    const p = (places ?? []).find((x) => x.id === placeId);
    if (!p) return;
    const accs = (accommodations ?? []).filter((a) => a.address || a.title);
    const CONC = 2;
    for (let i = 0; i < accs.length; i += CONC) {
      await Promise.all(accs.slice(i, i + CONC).map((a) => fetchCommuteForPair(a, p, mode)));
    }
  }


  function commuteForMode(accommodationId: string, mode: TravelMode): Record<string, number> {
    const mock = commuteIndex[accommodationId] ?? {};
    const real = realCommute[accommodationId] ?? {};
    const merged: Record<string, number> = { ...mock };
    for (const pid of Object.keys(real)) {
      const v = real[pid]?.[mode];
      if (typeof v === 'number') merged[pid] = v;
    }
    return merged;
  }

  function commuteFor(accommodationId: string): Record<string, number> {
    return commuteForMode(accommodationId, 'transit');
  }

  // Two-direction mock commute times per place: to (arriveBy) and from (leaveAt)
  const commuteIndexTwo = useMemo(() => {
    const idx: Record<string, Record<string, { to: number; from: number }>> = {};
    const accs = accommodations ?? [];
    const ps = places ?? [];
    for (const a of accs) {
      const m: Record<string, { to: number; from: number }> = {};
      for (const p of ps) {
        if (!p.id) continue;
        m[p.id] = {
          to: seededMinutes(a.id, `${p.id}::to`),
          from: seededMinutes(a.id, `${p.id}::from`),
        };
      }
      idx[a.id] = m;
    }
    return idx;
  }, [accommodations, places]);

  function commuteForTwo(accommodationId: string): Record<string, { to: number; from: number }> {
    return commuteIndexTwo[accommodationId] ?? {};
  }


  const api = useMemo(() => {
    function commit(updater: (prev: Accommodation[]) => Accommodation[]) {
      setAccommodations((prev) => {
        const base = prev ?? [];
        const filled = updater(base).map((a) => (DATA_SOURCE === 'local' ? ensureMockCompleteness(a) : ensureMinimalDefaultsConvex(a)));
        const next = filled.map((a) => computeDerived(a, finance));
        if (DATA_SOURCE === 'local') saveToStorage(next);
        return next;
      });
    }

    function add(accommodation: Omit<Accommodation, "id"> & Partial<Pick<Accommodation, "id">>) {
      const id = accommodation.id ?? generateId();
      commit((prev) => [{ ...accommodation, id }, ...prev]);
      // Also create on Convex to trigger server-side scheduling
      try { void addAccommodationConv({ clientId: id, kind: (accommodation.kind ?? 'candidate') as any, title: accommodation.title, address: accommodation.address }); } catch { /* noop */ }
      // Fetch commute times only on client if source=client; otherwise Convex handles it server-side
      if (COMMUTE_SOURCE === 'client') {
        prefetchForAccommodationOnAdd(id, 'transit');
      }
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
      // Also create on Convex to trigger server-side scheduling
      try { void addAccommodationConv({ clientId: id, kind: 'candidate', title: newItem.title, address: newItem.address }); } catch { /* noop */ }
      // Prefetch on client only when using client source
      if (COMMUTE_SOURCE === 'client') {
        prefetchForAccommodationOnAdd(id, 'transit');
      }
      return newItem;
    }

    function remove(id: string) {
      commit((prev) => prev.filter((a) => a.id !== id));
      // Best-effort: also remove on Convex so commute data is cleaned up
      try {
        const serverId = (convexAccs as any[] | undefined)?.find((a: any) => a.clientId === id)?._id;
        if (serverId) void removeAccommodationConv({ id: serverId });
      } catch {}
    }

    function update(id: string, patch: Partial<Accommodation>) {
      // Update local state first
      commit((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));

      // Best-effort: propagate edited fields to Convex when in Convex mode (so hydration won’t overwrite)
      const payload: any = {};
      const has = (k: keyof Accommodation) => Object.prototype.hasOwnProperty.call(patch, k);
      if (has('title')) payload.title = patch.title;
      if (has('address')) payload.address = patch.address;
      if (has('hyra')) payload.hyra = patch.hyra as any;
      if (has('driftkostnader')) payload.driftkostnader = patch.driftkostnader as any;
      if (has('antalRum')) payload.antalRum = patch.antalRum as any;
      if (has('boarea')) payload.boarea = patch.boarea as any;
      if (has('biarea')) payload.biarea = patch.biarea as any;
      if (has('tomtarea')) payload.tomtarea = patch.tomtarea as any;
      if (has('constructionYear')) payload.constructionYear = patch.constructionYear as any;
      if (has('begartPris')) payload.begartPris = patch.begartPris as any;
      if (has('currentValuation')) payload.currentValuation = patch.currentValuation as any;
      // meta.energyClass (stored under meta on server)
      const energyClass = (patch as any)?.metrics?.meta?.energyClass;
      if (energyClass != null) payload.meta = { energyClass } as any;

      if (Object.keys(payload).length > 0) {
        try {
          const serverId = (convexAccs as any[] | undefined)?.find((a: any) => a.clientId === id)?._id;
          if (serverId) void updateAccommodationConv({ id: serverId, patch: payload });
        } catch {}
      }
    }

    function clear() {
      commit(() => []);
    }

    function replacePlaces(next: Array<Partial<ImportantPlace>>) {
      const prevIds = new Set((places ?? []).map((p) => p.id).filter(Boolean) as string[]);
      const used = new Set<string>();
      function genUniqueId() {
        let id = generateId();
        while (used.has(id) || prevIds.has(id)) id = generateId();
        used.add(id);
        return id;
      }
      const finalized: ImportantPlace[] = [];
      for (const p of (next ?? [])) {
        let id = p.id as string | undefined;
        if (!id || used.has(id)) {
          id = genUniqueId();
        } else {
          used.add(id);
        }
        finalized.push({
          id,
          label: p.label,
          address: p.address,
          icon: p.icon,
          arriveBy: p.arriveBy,
          leaveAt: p.leaveAt,
        });
      }
      setPlaces(finalized);
      if (DATA_SOURCE === 'local') {
        savePlacesToStorage(finalized);
      } else {
        try {
          void bulkReplacePlaces({ places: finalized.map((p) => ({ clientId: p.id!, label: p.label, address: p.address, icon: p.icon, arriveBy: p.arriveBy, leaveAt: p.leaveAt })) });
        } catch {}
      }
      // Prefetch only for newly added places (client-side mock)
      for (const p of finalized) {
        if (p.id && !prevIds.has(p.id)) {
          if (COMMUTE_SOURCE === 'client') {
            prefetchForPlaceOnAdd(p.id, 'transit');
          }
        }
      }
    }

    // Create or update current accommodation from user-provided input (non-destructive)
    function upsertCurrentFromUser(input: CurrentHomeInput) {
      commit((prev) => {
        const existingIdx = prev.findIndex((a) => a.kind === "current");
        const chosenId = existingIdx >= 0 ? prev[existingIdx].id : generateId();
        const base: Accommodation = existingIdx >= 0 ? prev[existingIdx] : {
          id: chosenId,
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
          id: chosenId,
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

        // Persist to Convex when enabled
        if (DATA_SOURCE === 'convex') {
          try {
            const loans = (input.mortgages?.loans ?? []).map((l) => ({ principal: num(l.principal) ?? 0, interestRateAnnual: num(l.interestRateAnnual) ?? 0 }));
            void upsertCurrentConv({
              clientId: chosenId,
              title: updated.title,
              address: updated.address,
              hyra: updated.hyra as any,
              driftkostnader: updated.driftkostnader as any,
              antalRum: updated.antalRum as any,
              boarea: updated.boarea as any,
              biarea: updated.biarea as any,
              tomtarea: updated.tomtarea as any,
              currentValuation: updated.currentValuation as any,
              loans: loans.length ? loans : undefined,
            } as any);
          } catch {}
        }

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
        postort: (pd as any)?.postort ?? undefined,
        kommun: (pd as any)?.kommun ?? undefined,
        position: { xPercent: Math.round(randomBetween(15, 85)), yPercent: Math.round(randomBetween(15, 80)) },
        color: randomFrom(COLOR_CLASSES),
        imageUrl: pd.imageUrl ?? placeholderImageUrl(id),
        begartPris: num(pd.price),
        driftkostnader: num((pd as any)?.operatingCost ?? (pd as any)?.driftkostnad ?? (pd as any)?.driftskostnad),
        hyra: num(pd.monthlyFee ?? (pd as any)?.avgift),
        antalRum: num(pd.rooms),
        boarea: num(pd.livingArea),
        biarea: num((pd as any)?.supplementalArea),
        tomtarea: num((pd as any)?.landArea),
        constructionYear: num(pd.constructionYear),
        metrics: {
          ...(sourceUrl ? { sourceUrl } : {}),
          ...((pd as any)?.hemnetUrl || (pd as any)?.realtorUrl
            ? { sourceUrls: { hemnet: (pd as any)?.hemnetUrl, realtor: (pd as any)?.realtorUrl } }
            : {}),
          ...((pd as any)?.type || (pd as any)?.tenure || (pd as any)?.energyClass
            ? { meta: { type: (pd as any)?.type, tenure: (pd as any)?.tenure, energyClass: (pd as any)?.energyClass } }
            : {}),
          ...((pd as any)?.images || (pd as any)?.floorPlans
            ? { media: { images: (pd as any)?.images ?? [], floorPlans: (pd as any)?.floorPlans ?? [] } }
            : {}),
          ...((pd as any)?.daysOnHemnet != null || (pd as any)?.timesViewed != null || (pd as any)?.labels
            ? { hemnetStats: { daysOnHemnet: num((pd as any)?.daysOnHemnet) as any, timesViewed: num((pd as any)?.timesViewed) as any, labels: (pd as any)?.labels ?? [] } }
            : {}),
          ...((pd as any)?.openHouses
            ? { openHouses: (pd as any)?.openHouses }
            : {}),
        },
      };
      commit((prev) => [item, ...prev]);
      // Also create on Convex to persist scraped fields & trigger server-side scheduling
      try {
        void addAccommodationConv({
          clientId: id,
          kind: 'candidate' as any,
          title,
          address: pd.address ?? undefined,
          postort: (pd as any)?.postort ?? undefined,
          kommun: (pd as any)?.kommun ?? undefined,
          imageUrl: pd.imageUrl ?? undefined,
          begartPris: num(pd.price),
          driftkostnader: num((pd as any)?.operatingCost ?? (pd as any)?.driftkostnad ?? (pd as any)?.driftskostnad),
          hyra: num(pd.monthlyFee ?? (pd as any)?.avgift),
          antalRum: num(pd.rooms),
          boarea: num(pd.livingArea),
          biarea: num((pd as any)?.supplementalArea),
          tomtarea: num((pd as any)?.landArea),
          constructionYear: num(pd.constructionYear),
          meta: ((pd as any)?.type || (pd as any)?.tenure || (pd as any)?.energyClass)
            ? { type: (pd as any)?.type ?? undefined, tenure: (pd as any)?.tenure ?? undefined, energyClass: (pd as any)?.energyClass ?? undefined }
            : undefined,
          sourceUrls: ((pd as any)?.hemnetUrl || (pd as any)?.realtorUrl)
            ? { hemnet: (pd as any)?.hemnetUrl, realtor: (pd as any)?.realtorUrl }
            : undefined,
          media: ((pd as any)?.images || (pd as any)?.floorPlans)
            ? { images: (pd as any)?.images ?? [], floorPlans: (pd as any)?.floorPlans ?? [] }
            : undefined,
          hemnetStats: ((pd as any)?.daysOnHemnet != null || (pd as any)?.timesViewed != null || (pd as any)?.labels)
            ? { daysOnHemnet: num((pd as any)?.daysOnHemnet) as any, timesViewed: num((pd as any)?.timesViewed) as any, labels: (pd as any)?.labels ?? [] }
            : undefined,
        });
      } catch { /* noop */ }
      // Prefetch on client only when using client source
      if (COMMUTE_SOURCE === 'client') {
        prefetchForAccommodationOnAdd(id, 'transit');
      }
      return item;
    }

    function updateFinanceSettings(patch: Partial<FinanceSettings>) {
      setFinance((prev) => {
        const next = { ...prev, ...patch } as FinanceSettings;
        if (DATA_SOURCE === 'local') {
          saveFinanceToStorage(next);
        } else {
          try { void upsertFinance(next as any); } catch {}
        }
        // Recompute all accommodations with new finance settings
        setAccommodations((prevAcc) => {
          const base = prevAcc ?? [];
          const recalculated = base.map(ensureMockCompleteness).map((a) => computeDerived(a, next));
          if (DATA_SOURCE === 'local') saveToStorage(recalculated);
          return recalculated;
        });
        return next;
      });
    }

    return { add, addMock, addFromParsed, remove, update, clear, addOrUpdateCurrentMock, upsertCurrentFromUser, replacePlaces, updateFinanceSettings };
  }, []);

  const current = (accommodations ?? []).find((a) => a.kind === "current") ?? null;
  return { accommodations: accommodations ?? [], current, places: places ?? [], finance, commuteFor, commuteForMode, commuteForTwo, ...api } as const;
}

