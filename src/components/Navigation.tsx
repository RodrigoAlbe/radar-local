"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, LayoutGrid, Search, Settings, User, Workflow } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutGrid, match: ["/"] },
  { href: "/search", label: "Search", icon: Search, match: ["/search", "/resultados", "/lead"] },
  { href: "/pipeline", label: "Pipeline", icon: Workflow, match: ["/pipeline"] },
  { href: "/historico", label: "History", icon: History, match: ["/historico"] },
  { href: "/settings", label: "Settings", icon: Settings, match: ["/settings"] },
] as const;

function isActive(pathname: string, item: (typeof NAV_ITEMS)[number]) {
  return item.match.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }

    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#edf1f5] bg-[#f8f9fc]/96 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <div>
            <h1 className="font-[family:var(--font-plus-jakarta)] text-base font-extrabold text-[#082d45]">
              Radar Local
            </h1>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#7a8591]">
              Sales Intelligence
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0b6d84] shadow-[0_10px_24px_rgba(15,34,49,0.08)]">
            <User className="h-4 w-4" />
          </div>
        </div>
      </header>

      <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-50 border-t border-[#edf1f5] bg-[#f8f9fc]/96 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-1 py-2 pt-3 text-[11px] transition-colors ${
                  active ? "font-semibold text-[#0b6d84]" : "text-[#6a7783] hover:text-[#0f2231]"
                }`}
              >
                <div
                  className={`rounded-full p-2 transition ${
                    active ? "bg-[#e7f1f4]" : "bg-transparent"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "stroke-[2.3]" : ""}`} />
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
