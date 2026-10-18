"use client";

import Link from "next/link";
import { useDashboardData } from "./dashboard-provider";
import { PendingAmountsCard } from "@/components/recurring/pending-amounts-card";
import {
  DashboardGrid,
  DashboardHeader,
  DashboardSurface,
} from "@/components/dashboard/widgets";

// Renders whatever the user arranged in edit mode
// (/protected/dashboard/customize, reached from Settings). The layout is
// loaded with the rest of the dashboard data in app/protected/layout.tsx.
export default function Dashboard() {
  const { dashboardLayout: layout } = useDashboardData();
  const { theme, widgets } = layout;

  return (
    <DashboardSurface theme={theme} className="min-h-screen">
      <div className="px-6 py-10 md:px-10">
        <DashboardHeader theme={theme} />

        <PendingAmountsCard />

        {widgets.length === 0 ? (
          <div className="rounded-[var(--dash-radius,28px)] border border-dashed border-border p-10 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Your dashboard is empty.
            </p>
            <Link
              href="/protected/dashboard/customize"
              className="mt-2 inline-block text-sm font-medium text-accent"
            >
              Add some cards
            </Link>
          </div>
        ) : (
          <DashboardGrid layout={layout} />
        )}
      </div>
    </DashboardSurface>
  );
}
