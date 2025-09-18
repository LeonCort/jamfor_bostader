'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTab } from "@/components/animate-ui/components/base/tabs";
import { ModeToggle } from "@/components/darkmode-toggle";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const current = pathname.startsWith("/settings")
    ? "settings"
    : pathname.startsWith("/compare")
    ? "compare"
    : pathname.startsWith("/map")
    ? "map"
    : pathname.startsWith("/overview")
    ? "overview"
    : "overview";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        {/* Left: brand */}
        <Link href="/overview" className="font-semibold tracking-tight">
          Jämför bostäder
        </Link>

        {/* Center: tabs */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="pointer-events-auto">
            <Tabs
              value={current}
              onValueChange={(v) => {
                if (v === current) return;
                const href = v === "overview" ? "/overview" : v === "map" ? "/map" : v === "compare" ? "/compare" : "/settings";
                router.push(href);
              }}
            >
              <div className="relative">
                <TabsList>
                  <TabsTab value="overview">Översikt</TabsTab>
                  <TabsTab value="map">Karta</TabsTab>
                  <TabsTab value="compare">Jämför</TabsTab>
                  <TabsTab value="settings">Inställningar</TabsTab>
                </TabsList>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Right: theme + account */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          <SignedIn>
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <span className="text-sm font-medium px-2 py-1 rounded-md hover:bg-muted cursor-pointer">Logga in</span>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </header>
  );
}

