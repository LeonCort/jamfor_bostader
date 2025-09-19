'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export function Header() {
  const pathname = usePathname();


  const current = pathname.startsWith("/settings")
    ? "settings"
    : pathname.startsWith("/compare")
    ? "compare"
    : pathname.startsWith("/overview")
    ? "overview"
    : "overview";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        {/* Left: brand */}
        <Link href="/overview" className="font-semibold tracking-tight">
          HemJakt
        </Link>

        {/* Center: nav links */}
        <nav aria-label="Primary" className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="pointer-events-auto flex items-center gap-6">
            <Link
              href="/overview"
              aria-current={current === 'overview' ? 'page' : undefined}
              className={`inline-flex items-center justify-center min-h-[44px] px-3 rounded-md text-sm font-medium transition-colors ${current === 'overview' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Översikt
            </Link>
            <Link
              href="/compare"
              aria-current={current === 'compare' ? 'page' : undefined}
              className={`inline-flex items-center justify-center min-h-[44px] px-3 rounded-md text-sm font-medium transition-colors ${current === 'compare' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Jämför
            </Link>
            <Link
              href="/settings"
              aria-current={current === 'settings' ? 'page' : undefined}
              className={`inline-flex items-center justify-center min-h-[44px] px-3 rounded-md text-sm font-medium transition-colors ${current === 'settings' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Inställningar
            </Link>
          </div>
        </nav>

        {/* Right: theme + account */}
        <div className="flex items-center gap-2">
          <ThemeTogglerButton variant="outline" size="sm" modes={['light','dark']} />
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

