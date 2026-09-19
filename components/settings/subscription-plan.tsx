"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/queries/snapshots";
import type { SubscriptionStatus } from "@/lib/types/database";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const FEATURES = [
  "Unlimited institutions and transactions",
  "Recurring transactions with due-date reminders",
  "Notifications for anything that needs your attention",
];

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  free: "Free plan",
  trial: "Free month — active",
  active: "Vault Plus — active",
  canceled: "Canceled",
};

export function SubscriptionPlan({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: SubscriptionStatus;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: SubscriptionStatus) {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      await updateProfile(supabase, userId, { subscription_status: status });
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  const isSubscribed = currentStatus === "trial" || currentStatus === "active";

  return (
    <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base text-foreground dark:text-white">Vault Plus</CardTitle>
        <CardDescription>
          Currently: <span className="font-medium">{STATUS_LABEL[currentStatus]}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold tabular-nums text-foreground dark:text-white">
            $4.99
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">/ month, first month free</p>
        </div>

        <ul className="flex flex-col gap-2">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-foreground dark:text-white">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              {feature}
            </li>
          ))}
        </ul>

        {error && (
          <div className="rounded-2xl bg-red-500/[0.07] px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {isSubscribed ? (
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => setStatus("canceled")}
            className="h-11 w-fit rounded-2xl"
          >
            {isLoading ? "Saving..." : "Cancel subscription"}
          </Button>
        ) : (
          <Button
            type="button"
            disabled={isLoading}
            onClick={() => setStatus("trial")}
            className="h-11 w-fit rounded-2xl bg-primary-surface text-white"
          >
            {isLoading ? "Saving..." : "Start your free month"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
