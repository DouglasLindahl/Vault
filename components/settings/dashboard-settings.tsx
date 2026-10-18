"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, RotateCcw } from "lucide-react";
import { resetDashboardLayoutAction } from "@/lib/actions/dashboard-layout";
import { Button } from "@/components/ui/button";

export function DashboardSettings() {
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reset() {
    if (!window.confirm("Reset your dashboard to the default cards and style?")) return;
    setIsResetting(true);
    setMessage(null);
    try {
      await resetDashboardLayoutAction();
      setMessage("Dashboard reset to default.");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Couldn't reset the dashboard.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button asChild className="rounded-xl bg-primary-surface text-white">
          <Link href="/protected/dashboard/customize">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Customize dashboard
          </Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={reset}
          disabled={isResetting}
          className="rounded-xl"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {isResetting ? "Resetting..." : "Reset to default"}
        </Button>
      </div>
      {message && <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>}
    </div>
  );
}
