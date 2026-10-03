"use client";

import { AlertCircle, ChevronRight } from "lucide-react";
import { parseDateOnly } from "@/lib/utils";
import { usePendingAmounts } from "@/components/recurring/pending-amount-dialog";

// Persistent reminder on the dashboard for recurring transactions whose
// amount varies and is due — the pop-up dialog is easy to dismiss, this
// stays until every amount is filled in.
export function PendingAmountsCard() {
  const { entries, openEntry } = usePendingAmounts();
  if (entries.length === 0) return null;

  return (
    <div className="mb-8 rounded-[28px] border border-amber-500/30 bg-amber-500/[0.06] p-5">
      <div className="mb-3 flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm font-semibold text-foreground dark:text-white">
          {entries.length === 1
            ? "1 recurring amount is missing"
            : `${entries.length} recurring amounts are missing`}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => openEntry(entry.id)}
            className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 text-left hover:bg-amber-500/[0.08]"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground dark:text-white">
                {entry.name ?? (entry.direction === "in" ? "Income" : "Expense")} amount missing
              </span>
              <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                {entry.institutionName} · due{" "}
                {parseDateOnly(entry.due_date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · Click here to add it
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
