"use client";

import { useEffect, useMemo, useState } from "react";

// Core types for an accommodation/listing and extensible metrics
export type SEK = number; // store as integer (SEK)

export type Accommodation = {
  id: string;
  title: string; // e.g., "3 rok i Sundbyberg"
  address?: string;
  // Position for mock map (percentages of container). We keep lat/lng optional for future real map.
  position: { xPercent: number; yPercent: number };
  lat?: number;
  lng?: number;
  color?: string; // Tailwind bg-... class for marker color

  // Base scraped inputs
  begartPris?: SEK; // Begärt pris
  driftkostnader?: SEK; // Årlig drift
  hyra?: SEK; // Månadsavgift / hyra
  antalRum?: number; // antal rum
  boarea?: number; // m²
  biarea?: number; // m²
  tomtarea?: number; // m²

  // Derived/calculated fields (filled later)
  kontantinsats?: SEK;
  lan?: SEK;
  amorteringPerManad?: SEK;
  rantaPerManad?: SEK;

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

export function useAccommodations() {
  const [accommodations, setAccommodations] = useState<Accommodation[] | null>(null);

  // Load once on mount; seed if empty
  useEffect(() => {
    const loaded = loadFromStorage();
    if (loaded && loaded.length > 0) {
      setAccommodations(loaded);
    } else {
      const seeded = seedMockData();
      setAccommodations(seeded);
      saveToStorage(seeded);
    }
  }, []);

  const api = useMemo(() => {
    function commit(updater: (prev: Accommodation[]) => Accommodation[]) {
      setAccommodations((prev) => {
        const base = prev ?? [];
        const next = updater(base);
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

    return { add, addMock, remove, update, clear };
  }, []);

  return { accommodations: accommodations ?? [], ...api } as const;
}

