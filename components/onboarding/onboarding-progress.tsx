"use client";

import { cn } from "@/lib/utils";

export function OnboardingProgress({
  step,
  totalSteps,
}: {
  step: number;
  totalSteps: number;
}) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const current = index + 1;

        return (
          <div
            key={current}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              current <= step
                ? "bg-[#315cff] dark:bg-pink-500"
                : "bg-zinc-200 dark:bg-white/10",
            )}
          />
        );
      })}
    </div>
  );
}
