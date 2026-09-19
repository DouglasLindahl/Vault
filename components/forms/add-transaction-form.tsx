"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createTransactionAction } from "@/lib/actions/transactions";
import { createRecurringTransactionAction } from "@/lib/actions/recurring-transactions";
import { createTag } from "@/lib/queries/tags";
import type { Direction, Frequency } from "@/lib/types/database";
import type { TagOption } from "@/lib/types";
import { cn, todayDateOnly } from "@/lib/utils";

type InstitutionOption = { id: string; name: string };

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagPicker } from "@/components/forms/tag-picker";

export function AddTransactionForm({
  institutions,
  tags,
  onSuccess,
}: {
  institutions: InstitutionOption[];
  tags: TagOption[];
  onSuccess?: () => void;
}) {
  const router = useRouter();

  const [institutionId, setInstitutionId] = useState("");
  const [availableTags, setAvailableTags] = useState<TagOption[]>(tags);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<Direction>("out");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayDateOnly());
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [isEstimate, setIsEstimate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreateTag({ name, color }: { name: string; color: string }) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to be logged in.");

    const tag = await createTag(supabase, { user_id: user.id, name, color });
    const option: TagOption = { id: tag.id, name: tag.name, color: tag.color };
    setAvailableTags((prev) => [...prev, option]);
    return option;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!institutionId) return setError("Pick an institution.");
    if (!amount || Number(amount) <= 0) return setError("Enter an amount greater than zero.");

    setIsLoading(true);

    try {
      if (recurring) {
        await createRecurringTransactionAction({
          institutionId,
          name: name.trim() || null,
          amount: Number(amount),
          direction,
          frequency,
          startDate: date,
          isEstimate,
          tagIds,
        });
      } else {
        await createTransactionAction({
          institutionId,
          name: name.trim() || null,
          amount: Number(amount),
          direction,
          date,
          tagIds,
        });
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Institution</Label>
              <Select value={institutionId} onValueChange={setInstitutionId}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Tags</Label>
              <TagPicker
                tags={availableTags}
                selectedIds={tagIds}
                onChange={setTagIds}
                onCreateTag={handleCreateTag}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transaction-name">Name (optional)</Label>
            <Input
              id="transaction-name"
              placeholder="Groceries — Aldi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-2xl"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Direction</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as Direction)}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">In</SelectItem>
                  <SelectItem value="out">Out</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="42.10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-11 rounded-2xl"
              />
            </div>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 gap-4",
              recurring && "sm:grid-cols-2",
            )}
          >
            <div className="grid gap-2">
              <Label htmlFor="date">{recurring ? "Start date" : "Date"}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-2xl"
              />
            </div>

            {recurring && (
              <div className="grid gap-2">
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground dark:text-white">
                Recurring
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Repeats on a schedule instead of happening once.
              </p>
            </div>
            <Switch checked={recurring} onCheckedChange={setRecurring} />
          </div>

          {recurring && (
            <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground dark:text-white">
                  Amount varies each time
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  You&apos;ll be prompted to enter the actual amount whenever this comes due.
                </p>
              </div>
              <Switch checked={isEstimate} onCheckedChange={setIsEstimate} />
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-500/[0.07] px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 rounded-2xl bg-primary-surface text-white"
          >
            {isLoading ? "Saving..." : recurring ? "Save recurring transaction" : "Save transaction"}
          </Button>
    </form>
  );
}
