"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

// Pops up automatically (instead of a persistent banner) whenever there's a
// recurring transaction whose amount varies and is due. Works through
// entries one at a time; each one also has a matching notification in the
// bell menu (created by lib/due-check.ts), so closing this dialog without
// finishing isn't a dead end — and it reopens the next time the app loads,
// since the entry stays "pending" until an amount is entered.
export function PendingAmountDialog() {
  const router = useRouter();
  const [entries, setEntries] = useState<RecurringTransactionPendingWithRelations[]>([]);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const pending = await getPendingRecurringEntriesAction();
      if (cancelled) return;
      setEntries(pending);
      if (pending.length > 0) setOpen(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeEntry = entries[0] ?? null;

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

      const remaining = entries.slice(1);
      setEntries(remaining);
      setAmount("");
      if (remaining.length === 0) setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  if (!activeEntry) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm rounded-[28px] border-border">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground dark:text-white">
            Enter amount
          </DialogTitle>
          <DialogDescription>
            {entries.length === 1
              ? "1 recurring transaction needs an amount right now."
              : `${entries.length} recurring transactions need an amount right now.`}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-white/[0.04]">
          <p className="text-lg font-semibold text-foreground dark:text-white">
            {activeEntry.name ?? (activeEntry.direction === "in" ? "Income" : "Expense")}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Due {activeEntry.due_date}
          </p>
        </div>

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
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => setOpen(false)}
              className="h-11 rounded-2xl"
            >
              Do it later
            </Button>
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
  );
}
