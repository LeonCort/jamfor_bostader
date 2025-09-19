"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function LandingPage() {
  const router = useRouter();

  function RedirectToOverview() {
    useEffect(() => {
      router.replace("/overview");
    }, []); // router is stable, no need to include in deps
    return null;
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200/60 bg-white/70 dark:bg-slate-900/50 p-8 shadow-sm text-center">
        <SignedOut>
          <h1 className="text-2xl font-semibold tracking-tight">Välkommen till Reskollen</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Logga in eller skapa ett konto för att gå till appen.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <SignInButton mode="modal">
              <button className="inline-flex items-center rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400">
                Logga in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">
                Skapa konto
              </button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <RedirectToOverview />
          <p className="text-slate-600 dark:text-slate-300">Omdirigerar till Översikt…</p>
        </SignedIn>
      </div>
    </div>
  );
}

