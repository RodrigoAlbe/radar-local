"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";
import AdminShell from "@/components/admin/AdminShell";

function isAdminRoute(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/resultados") ||
    pathname.startsWith("/lead") ||
    pathname.startsWith("/pipeline") ||
    pathname.startsWith("/historico") ||
    pathname.startsWith("/settings")
  );
}

export default function AppFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (isAdminRoute(pathname)) {
    return <AdminShell>{children}</AdminShell>;
  }

  return (
    <>
      <Navigation />
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4 pb-24">
        {children}
      </main>
    </>
  );
}
