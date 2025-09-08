import Link from "next/link";
import { ModeToggle } from "@/components/darkmode-toggle";

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Jämför bostäder
        </Link>
        <ModeToggle />
      </div>
    </header>
  );
}

