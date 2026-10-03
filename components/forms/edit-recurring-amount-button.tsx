"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { updateRecurringAmountAction } from "@/lib/actions/recurring-transactions";

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
  DialogTrigger,
} from "@/components/ui/dialog";

export function EditRecurringAmountButton({
  id,
  name,
  amount: currentAmount,
}: {
  id: string;
  name: string;
  amount: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(currentAmount));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setAmount(String(currentAmount));
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = Number(amount);
    if (!amount || !(value > 0)) {
      setError("Enter an amount greater than zero.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await updateRecurringAmountAction(id, value);
      setOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't update the amount.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-foreground dark:hover:bg-white/[0.04] dark:hover:text-white"
          aria-label="Edit amount"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-[28px] border-border">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground dark:text-white">
            Edit amount
          </DialogTitle>
          <DialogDescription>
            Changes {name} from its next occurrence on. Past transactions stay as they were.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`recurring-amount-${id}`}>Amount</Label>
            <Input
              id={`recurring-amount-${id}`}
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
  );
}
