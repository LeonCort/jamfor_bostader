"use client";

import * as React from "react";
import { useAccommodations } from "@/lib/accommodations";
import PropertyCard from "@/components/accommodations/PropertyCard";

export default function OverviewPage() {
  const { accommodations } = useAccommodations();

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold">Översikt</h1>
        <p className="text-sm text-muted-foreground">En snabb översikt över dina bostäder.</p>
      </header>

      {/* Single column list of cards */}
      <section className="space-y-6">
        {accommodations.map((a) => (
          <PropertyCard key={a.id} item={a} />
        ))}
      </section>
    </div>
  );
}
