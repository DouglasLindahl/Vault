"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getPendingRecurringEntriesAction } from "@/lib/actions/recurring-pending";
import { completePendingRecurringEntryAction } from "@/lib/actions/transactions";
import type { RecurringTransactionPendingWithRelations } from "@/lib/types/database";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PendingAmountBanner() {
  const router = useRouter();
  const [entries, setEntries] = useState<RecurringTransactionPendingWithRelations[]>([]);
  const [activeEntry, setActiveEntry] =
    useState<RecurringTransactionPendingWithRelations | null>(null);
  const [amount, setAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const pending = await getPendingRecurringEntriesAction();
      if (!cancelled) setEntries(pending);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function openEntry(entry: RecurringTransactionPendingWithRelations) {
    setActiveEntry(entry);
    setAmount("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!activeEntry) return;
    if (!amount || Number(amount) <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await completePendingRecurringEntryAction({
        pendingId: activeEntry.id,
        institutionId: activeEntry.institutionId,
        recurringTransactionId: activeEntry.recurring_transaction_id,
        name: activeEntry.name,
        amount: Number(amount),
        direction: activeEntry.direction,
        dueDate: activeEntry.due_date,
      });

      setEntries((prev) => prev.filter((entry) => entry.id !== activeEntry.id));
      setActiveEntry(null);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  if (entries.length === 0) return null;

  return (
    <div className="px-3 pt-6 sm:px-6">
      <div className="flex flex-col gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-900/60 dark:bg-amber-950/30">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            {entries.length === 1
              ? "1 recurring transaction needs an amount"
              : `${entries.length} recurring transactions need an amount`}
          </p>
        </div>
        <div className="flex flex-col gap-1">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm dark:bg-black/20"
            >
              <span className="min-w-0 truncate text-amber-900 dark:text-amber-100">
                {entry.name ?? entry.institutionName} · due {entry.due_date}
              </span>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 shrink-0 rounded-lg"
                onClick={() => openEntry(entry)}
              >
                Enter amount
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!activeEntry} onOpenChange={(open) => !open && setActiveEntry(null)}>
        <DialogContent className="max-w-sm rounded-[28px] border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground dark:text-white">
              Enter amount
            </DialogTitle>
            <DialogDescription>
              {activeEntry?.name ?? activeEntry?.institutionName} was due{" "}
              {activeEntry?.due_date}. How much was it?
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pending-amount">Amount</Label>
              <Input
                id="pending-amount"
                type="number"
                step="0.01"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 rounded-2xl"
              />
            </div>
            {error && (
              <div className="rounded-2xl bg-red-500/[0.07] px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-11 rounded-2xl bg-primary-surface text-white"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
