"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type DeltaTone = "good" | "bad" | "neutral";

export type KeyValueProps = {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: React.ReactNode;
  deltaText?: string | null;
  deltaTone?: DeltaTone; // semantic tone for the delta
  className?: string;
};

export function KeyValueRow({ icon, label, value, deltaText, deltaTone = "neutral", className }: KeyValueProps) {
  const deltaClass =
    deltaTone === "good"
      ? "text-emerald-600"
      : deltaTone === "bad"
      ? "text-red-600"
      : "text-muted-foreground";

  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon ? <span className="text-muted-foreground/90">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-sm font-medium text-foreground">{value}</div>
        {deltaText ? <div className={cn("text-xs", deltaClass)}>({deltaText})</div> : null}
      </div>
    </div>
  );
}

export function KeyValueGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-1", className)}>{children}</div>;
}

