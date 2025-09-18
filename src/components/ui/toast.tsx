"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { X } from "lucide-react";

export type Toast = {
  id?: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
  durationMs?: number;
};

type ToastCtx = {
  toast: (t: Toast) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Required<Toast>[]>([]);

  const api = useMemo(() => ({
    toast(t: Toast) {
      const id = t.id ?? Math.random().toString(36).slice(2, 10);
      const duration = t.durationMs ?? 2600;
      const full: Required<Toast> = {
        id,
        title: t.title ?? "",
        description: t.description ?? "",
        variant: t.variant ?? "default",
        durationMs: duration,
      };
      setToasts((prev) => [...prev, full]);
      // auto-remove
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id));
      }, duration);
    },
  }), []);

  return (
    <Ctx.Provider value={api}>
      {children}
      {/* Container */}
      <div
        className="pointer-events-none fixed inset-x-0 z-[80] flex items-end justify-center gap-2 px-3 sm:bottom-6 sm:right-6 sm:left-auto sm:justify-end"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)" }}
      >
        <ul className="space-y-2 w-full sm:w-[360px]">
          {toasts.map((t) => (
            <li key={t.id} className={[
              "pointer-events-auto rounded-md border px-3 py-2 text-sm shadow-md",
              t.variant === "success" ? "border-emerald-600/30 bg-emerald-600/10 text-emerald-100" :
              t.variant === "destructive" ? "border-rose-600/30 bg-rose-600/10 text-rose-100" :
              "border-border/60 bg-card text-foreground",
            ].join(" ")}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  {t.title && <div className="font-medium leading-tight">{t.title}</div>}
                  {t.description && <div className="text-xs opacity-80 leading-snug">{t.description}</div>}
                </div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent/10 hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Ctx.Provider>
  );
}

