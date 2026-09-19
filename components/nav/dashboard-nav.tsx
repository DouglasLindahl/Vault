"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import vaultLogo from "@/app/icons/vaultLogo.png";
import { AddInstitutionDialog } from "@/components/forms/add-institution-dialog";
import { ManageTagsDialog } from "@/components/forms/manage-tags-dialog";
import { NotificationsMenu } from "@/components/nav/notifications-menu";
import { useDashboardData } from "@/app/protected/dashboard/dashboard-provider";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/protected/dashboard", label: "Dashboard" },
  { href: "/protected/dashboard/transactions", label: "Transactions" },
  { href: "/protected/dashboard/recurring-transactions", label: "Recurring" },
  { href: "/protected/dashboard/stats", label: "Stats" },
];

const DRAWER_ACTION_CLASS =
  "h-auto w-full justify-start rounded-2xl border-0 px-4 py-3.5 text-base font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.04]";

function isActive(pathname: string, href: string) {
  return href === "/protected/dashboard"
    ? pathname === href
    : pathname.startsWith(href);
}

export function DashboardNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isAdmin } = useDashboardData();
  const navLinks = isAdmin ? [...links, { href: "/protected/admin", label: "Admin" }] : links;

  return (
    <div className="flex items-center justify-between gap-2 bg-background px-3 pt-6 sm:px-6">
      <Link href="/protected/dashboard" className="flex shrink-0 items-center gap-2">
        <Image src={vaultLogo} alt="Vault" className="h-8 w-8 rounded-xl object-contain" />
        <span className="hidden text-sm font-bold tracking-tight text-foreground dark:text-white sm:inline">
          Vault
        </span>
      </Link>

      {/* Desktop / tablet nav */}
      <nav className="hidden min-w-0 flex-1 gap-1 overflow-x-auto rounded-2xl bg-card/95 p-1 shadow-[0_18px_60px_rgba(23,32,51,0.06)] sm:flex sm:flex-initial">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              isActive(pathname, link.href)
                ? "bg-primary-surface text-white"
                : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-white/[0.04]",
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <NotificationsMenu />
      <Link
        href="/protected/dashboard/settings"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card/95 text-foreground shadow-[0_18px_60px_rgba(23,32,51,0.06)] dark:text-white"
        aria-label="Settings"
      >
        <Settings className="h-5 w-5" />
      </Link>

      {/* Mobile hamburger */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card/95 text-foreground shadow-[0_18px_60px_rgba(23,32,51,0.06)] dark:text-white sm:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full max-w-[280px]">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <Image src={vaultLogo} alt="Vault" className="h-8 w-8 rounded-xl object-contain" />
              <SheetTitle>Vault</SheetTitle>
            </div>
          </SheetHeader>

          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <SheetClose asChild key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "rounded-2xl px-4 py-3.5 text-base font-medium transition-colors",
                    isActive(pathname, link.href)
                      ? "bg-primary-surface text-white"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-white/[0.04]",
                  )}
                >
                  {link.label}
                </Link>
              </SheetClose>
            ))}
          </nav>

          <div className="flex flex-col gap-1 border-t border-border pt-3">
            <p className="px-4 pb-1 text-xs font-medium uppercase tracking-wide text-zinc-400">
              Manage
            </p>
            <AddInstitutionDialog triggerClassName={DRAWER_ACTION_CLASS} />
            <ManageTagsDialog triggerClassName={DRAWER_ACTION_CLASS} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
