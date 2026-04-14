"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import {
  Bell,
  CircleHelp,
  History,
  LayoutGrid,
  Plus,
  Search,
  Settings,
  UserCircle2,
  Workflow,
} from "lucide-react";

const PRIMARY_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutGrid, match: ["/"] },
  {
    href: "/search",
    label: "Search",
    icon: Search,
    match: ["/search", "/resultados", "/lead"],
  },
  { href: "/pipeline", label: "Pipeline", icon: Workflow, match: ["/pipeline"] },
  { href: "/historico", label: "History", icon: History, match: ["/historico"] },
  { href: "/settings", label: "Settings", icon: Settings, match: ["/settings"] },
] as const;

function isItemActive(pathname: string, item: (typeof PRIMARY_NAV)[number]): boolean {
  return item.match.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }

    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleHeaderSearch = () => {
    const searchField = document.getElementById("page-search") as
      | HTMLInputElement
      | null;

    if (searchField) {
      searchField.scrollIntoView({ behavior: "smooth", block: "center" });
      searchField.focus();
      return;
    }

    router.push("/search");
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-[#0f2231] lg:flex lg:font-[family:var(--font-plus-jakarta)]">
      <div className="lg:hidden">
        <Navigation />
      </div>

      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:bg-[#f8f9fc] lg:py-8">
        <div className="px-6">
          <p className="text-[1.7rem] font-black tracking-tight text-[#082d45]">
            Radar Local
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[#7a8591]">
            Sales Intelligence
          </p>
        </div>

        <nav
          aria-label="Navegacao principal"
          className="mt-10 flex-1 space-y-1 px-4"
        >
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const active = isItemActive(pathname, item);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  active
                    ? "border-r-4 border-[#0b6d84] bg-[#eef3f7] text-[#0b3348]"
                    : "text-[#5f6f7d] hover:bg-[#eef2f6] hover:text-[#0b3348]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-6">
          <Link
            href="/search"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#0a5064] to-[#0b7b8a] px-4 py-3 text-sm font-bold text-white shadow-[0_18px_34px_rgba(0,91,113,0.22)] transition hover:opacity-95"
          >
            <Plus className="h-4 w-4" />
            New Prospect
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-3 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#093447] to-[#0b6d84] text-white shadow-[0_14px_28px_rgba(0,66,83,0.18)]">
            <UserCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#0f2231]">Alex Rivera</p>
            <p className="text-xs text-[#7a8591]">Premium Account</p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 hidden items-center justify-between bg-[#f6f7fb]/92 px-8 py-6 backdrop-blur-xl lg:flex">
          <button
            type="button"
            onClick={handleHeaderSearch}
            aria-label="Buscar prospects, leads ou regioes"
            className="flex w-full max-w-md items-center gap-3 rounded-full bg-[#e9edf2] px-4 py-2.5 text-left text-sm text-[#7a8591] transition hover:bg-[#e2e8ef]"
          >
            <Search className="h-4 w-4" />
            <span>Search prospects, leads or regions...</span>
          </button>

          <div className="ml-6 flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0f2231] shadow-[0_8px_20px_rgba(15,34,49,0.06)] transition hover:text-[#0b6d84]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0f2231] shadow-[0_8px_20px_rgba(15,34,49,0.06)] transition hover:text-[#0b6d84]"
              aria-label="Help"
            >
              <CircleHelp className="h-4 w-4" />
            </button>
            <div
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0b6d84] shadow-[0_10px_24px_rgba(15,34,49,0.08)]"
            >
              <UserCircle2 className="h-5 w-5" />
            </div>
          </div>
        </header>

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-5 pb-24 lg:px-8 lg:py-8 lg:pb-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
