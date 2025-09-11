"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type MapEmbedProps = {
  src?: string;
  title?: string;
  className?: string;
};

export function MapEmbed({ src, title, className }: MapEmbedProps) {
  if (!src) {
    return (
      <div className={cn("w-full h-full min-h-[360px] rounded-2xl bg-muted/40", className)} />
    );
  }
  return (
    <iframe
      title={title ?? "Google Maps"}
      src={src}
      className={cn("w-full h-full min-h-[360px] rounded-2xl", className)}
      style={{ border: 0 }}
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}

export default MapEmbed;

