"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createTransaction } from "@/lib/queries/transactions";
import { createRecurringTransaction } from "@/lib/queries/recurring-transactions";
import type { Direction, Frequency } from "@/lib/types/database";
import { cn, todayDateOnly } from "@/lib/utils";

type InstitutionOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };

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

export function AddTransactionForm({
  institutions,
  categories,
  onSuccess,
}: {
  institutions: InstitutionOption[];
  categories: CategoryOption[];
  onSuccess?: () => void;
}) {
  const router = useRouter();

  const [institutionId, setInstitutionId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<Direction>("out");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayDateOnly());
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!institutionId) return setError("Pick an institution.");
    if (!categoryId) return setError("Pick a category.");
    if (!amount || Number(amount) <= 0) return setError("Enter an amount greater than zero.");

    setIsLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You need to be logged in.");

      if (recurring) {
        await createRecurringTransaction(supabase, {
          user_id: user.id,
          institution_id: institutionId,
          category_id: categoryId,
          name: name.trim() || null,
          amount: Number(amount),
          direction,
          frequency,
          start_date: date,
        });
      } else {
        await createTransaction(supabase, {
          user_id: user.id,
          institution_id: institutionId,
          category_id: categoryId,
          name: name.trim() || null,
          amount: Number(amount),
          direction,
          date,
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
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="flex items-center justify-between rounded-2xl border border-[#e5e2da] px-4 py-3 dark:border-white/[0.07]">
            <div>
              <p className="text-sm font-medium text-[#172033] dark:text-white">
                Recurring
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Repeats on a schedule instead of happening once.
              </p>
            </div>
            <Switch checked={recurring} onCheckedChange={setRecurring} />
          </div>

          {error && (
            <div className="rounded-2xl bg-red-500/[0.07] px-4 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 rounded-2xl bg-[#172033] text-white dark:bg-gradient-to-r dark:from-pink-500 dark:to-fuchsia-600"
          >
            {isLoading ? "Saving..." : recurring ? "Save recurring transaction" : "Save transaction"}
          </Button>
    </form>
  );
}
