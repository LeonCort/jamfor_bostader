"use client";

import * as React from "react";

type CompareRowProps = {
  label: string;
  unit?: string;
  gridTemplate: string;
  labelClassName?: string; // e.g., py-4 or py-5
  children: React.ReactNode; // one grid cell per accommodation
};

export default function CompareRow({ label, unit, gridTemplate, labelClassName, children }: CompareRowProps) {
  return (
    <div className="min-w-[720px] grid hover:bg-muted/20 transition-colors" style={{ gridTemplateColumns: gridTemplate }}>
      <div className={`px-4 ${labelClassName ?? "py-4"} text-sm text-foreground/80 sticky left-0 z-20 bg-card shadow-[8px_0_8px_-8px_rgba(0,0,0,0.2)]`}>
        <div>{label}</div>
        {unit ? <div className="text-[11px] text-muted-foreground/80 mt-1">{unit}</div> : null}
      </div>
      {children}
    </div>
  );
}

