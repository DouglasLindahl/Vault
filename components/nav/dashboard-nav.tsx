"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

const links = [
  { href: "/protected/dashboard", label: "Dashboard" },
  { href: "/protected/dashboard/transactions", label: "Transactions" },
  { href: "/protected/dashboard/recurring-transactions", label: "Recurring" },
  { href: "/protected/dashboard/stats", label: "Stats" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between gap-2 bg-zinc-50 px-3 pt-6 dark:bg-[#0c0c0e] sm:px-6">
      <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-2xl bg-white/95 p-1 shadow-[0_18px_60px_rgba(23,32,51,0.06)] dark:bg-[#141416]/95 sm:flex-initial">
        {links.map((link) => {
          const active =
            link.href === "/protected/dashboard"
              ? pathname === link.href
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[#172033] text-white dark:bg-gradient-to-r dark:from-pink-500 dark:to-fuchsia-600"
                  : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-white/[0.04]",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <LogoutButton className="shrink-0" />
    </div>
  );
}
