"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Scale, Settings } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const current = pathname.startsWith("/settings")
    ? "settings"
    : pathname.startsWith("/compare")
    ? "compare"
    : pathname.startsWith("/overview")
    ? "overview"
    : "overview";

  const items: Array<{
    key: "overview" | "compare" | "settings";
    href: string;
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: "overview", href: "/overview", label: "Översikt", icon: <Home size={22} /> },
    { key: "compare", href: "/compare", label: "Jämför", icon: <Scale size={22} /> },
    { key: "settings", href: "/settings", label: "Inställningar", icon: <Settings size={22} /> },
  ];

  return (
    <nav
      className="sm:hidden fixed inset-x-0 bottom-0 z-50 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto max-w-screen-2xl h-16 px-3 flex items-stretch justify-between gap-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const active = current === item.key;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="[&>*]:stroke-[1.75]">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

