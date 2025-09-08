"use client";

import { useEffect, useMemo, useState } from "react";

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

  // Base scraped inputs
  begartPris?: SEK; // Begärt pris (not applicable for kind === "current")
  driftkostnader?: SEK; // Årlig drift
  hyra?: SEK; // Månadsavgift / hyra
  antalRum?: number; // antal rum
  boarea?: number; // m²
  biarea?: number; // m²
  tomtarea?: number; // m²

  // Derived/calculated fields (filled later)
  kontantinsats?: SEK; // not applicable for kind === "current"
  lan?: SEK;
  amorteringPerManad?: SEK;
  rantaPerManad?: SEK;

  // Main KPI: total monthly cost (all expenses combined)
  totalMonthlyCost?: SEK;

  // Extensible metrics: commute times, distances, etc.
  metrics?: Record<string, unknown>;
};

const STORAGE_KEY = "reskollen.accommodations.v1";

function randomFrom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
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

  return samples.map((s, i) => ({
    id: generateId(),
    kind: "candidate",
    title: s.title,
    address: s.address,
    position: { xPercent: 40 + i * 8 + randomBetween(-3, 3), yPercent: 40 + i * 6 + randomBetween(-3, 3) },
    color: COLOR_CLASSES[i % COLOR_CLASSES.length],
    begartPris: Math.round(randomBetween(2.8, 6.5) * 1_000_000),
    driftkostnader: Math.round(randomBetween(10_000, 25_000)),
    hyra: Math.round(randomBetween(2_800, 5_200)),
    antalRum: 2 + (i % 3),
    boarea: Math.round(randomBetween(45, 95)),
    biarea: Math.round(randomBetween(0, 20)),
    tomtarea: Math.round(randomBetween(0, 250)),
    metrics: {},
  }));
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

function computeDerived(a: Accommodation): Accommodation {
  const annualMaintenance = a.driftkostnader ?? 0;
  const maintenancePerMonth = Math.round(annualMaintenance / 12);
  const hyraPerManad = Math.round(a.hyra ?? 0);

  let kontantinsats: number | undefined = undefined;
  let lan: number | undefined = undefined;
  let amorteringPerManad: number | undefined = undefined;
  let rantaPerManad: number | undefined = undefined;

  if (a.kind !== "current" && a.begartPris && a.begartPris > 0) {
    kontantinsats = Math.round(a.begartPris * FINANCE_DEFAULTS.downPaymentRate);
    lan = Math.max(0, a.begartPris - kontantinsats);
    amorteringPerManad = Math.round((lan * FINANCE_DEFAULTS.amortizationRateAnnual) / 12);
    rantaPerManad = Math.round((lan * FINANCE_DEFAULTS.interestRateAnnual) / 12);
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
  };
}


export function useAccommodations() {
  const [accommodations, setAccommodations] = useState<Accommodation[] | null>(null);

  // Load once on mount; seed if empty
  useEffect(() => {
    const loaded = loadFromStorage();
    if (loaded && loaded.length > 0) {
      const processed = loaded.map(computeDerived);
      setAccommodations(processed);
      saveToStorage(processed);
    } else {
      const seeded = seedMockData();
      const processed = seeded.map(computeDerived);
      setAccommodations(processed);
      saveToStorage(processed);
    }
  }, []);

  const api = useMemo(() => {
    function commit(updater: (prev: Accommodation[]) => Accommodation[]) {
      setAccommodations((prev) => {
        const base = prev ?? [];
        const next = updater(base).map(computeDerived);
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

      const newItem: Accommodation = {
        id: generateId(),
        kind: "candidate",
        title: randomFrom(titles),
        address: randomFrom(places),
        position: { xPercent: Math.round(randomBetween(15, 85)), yPercent: Math.round(randomBetween(15, 80)) },
        color: randomFrom(COLOR_CLASSES),
        begartPris: Math.round(randomBetween(2.5, 8.5) * 1_000_000),
        driftkostnader: Math.round(randomBetween(8_000, 28_000)),
        hyra: Math.round(randomBetween(2_500, 6_500)),
        antalRum: Math.round(randomBetween(1, 5)),
        boarea: Math.round(randomBetween(30, 140)),
        biarea: Math.round(randomBetween(0, 25)),
        tomtarea: Math.round(randomBetween(0, 400)),
        metrics: {},
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

    // Create or update a single persistent current accommodation (mock data)
    function addOrUpdateCurrentMock() {
      const titles = ["Nuvarande hem", "Vårt hem", "Min bostad"];
      const places = [
        "Stockholm",
        "Solna, Stockholm",
        "Sundbyberg, Stockholm",
        "Bromma, Stockholm",
      ];
      const mock: Accommodation = {
        id: generateId(),
        kind: "current",
        title: randomFrom(titles),
        address: randomFrom(places),
        position: { xPercent: Math.round(randomBetween(20, 80)), yPercent: Math.round(randomBetween(20, 75)) },
        color: "bg-slate-600",
        // Fields like begartPris/kontantinsats are intentionally omitted for current
        hyra: Math.round(randomBetween(2_500, 6_500)),
        antalRum: Math.round(randomBetween(1, 5)),
        boarea: Math.round(randomBetween(30, 120)),
        metrics: {},
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

    return { add, addMock, remove, update, clear, addOrUpdateCurrentMock };
  }, []);

  const current = (accommodations ?? []).find((a) => a.kind === "current") ?? null;
  return { accommodations: accommodations ?? [], current, ...api } as const;
}

