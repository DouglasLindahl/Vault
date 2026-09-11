"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createInstitution } from "@/lib/queries/institutions";
import { createRecurringTransaction } from "@/lib/queries/recurring-transactions";
import type { Category, Direction, Frequency, InstitutionType } from "@/lib/types/database";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

type RecurringRow = {
  name: string;
  categoryId: string;
  direction: Direction;
  amount: string;
  frequency: Frequency;
};

function emptyRow(): RecurringRow {
  return { name: "", categoryId: "", direction: "out", amount: "", frequency: "monthly" };
}

export function AddInstitutionForm({ categories }: { categories: Category[] }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [type, setType] = useState<InstitutionType>("bank");
  const [startingBalance, setStartingBalance] = useState("");
  const [rows, setRows] = useState<RecurringRow[]>([emptyRow()]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function updateRow(index: number, patch: Partial<RecurringRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Give the institution a name.");
      return;
    }

    const activeRows = rows.filter((r) => r.amount.trim() !== "");
    if (activeRows.some((r) => !r.categoryId)) {
      setError("Pick a category for every recurring transaction.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You need to be logged in.");

      const institution = await createInstitution(supabase, {
        user_id: user.id,
        name: name.trim(),
        type,
        starting_balance: startingBalance ? Number(startingBalance) : 0,
      });

      for (const row of activeRows) {
        await createRecurringTransaction(supabase, {
          user_id: user.id,
          institution_id: institution.id,
          category_id: row.categoryId,
          name: row.name.trim() || null,
          amount: Number(row.amount),
          direction: row.direction,
          frequency: row.frequency,
        });
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] dark:border-white/[0.07] dark:bg-[#141416]/95">
      <CardHeader>
        <CardTitle className="text-xl text-[#172033] dark:text-white">Add institution</CardTitle>
        <CardDescription>Name it, set a starting balance, and add anything that moves on a schedule.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="institution-name">Name</Label>
              <Input
                id="institution-name"
                placeholder="SEB"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as InstitutionType)}>
                <SelectTrigger className="h-11 rounded-2xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="crypto">Crypto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="starting-balance">Current balance</Label>
            <Input
              id="starting-balance"
              type="number"
              step="0.01"
              placeholder="300.00"
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              className="h-11 rounded-2xl sm:w-48"
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label>Recurring transactions</Label>
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1 text-xs font-medium text-[#315cff] dark:text-pink-400"
              >
                <Plus className="h-3.5 w-3.5" /> Add row
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 rounded-2xl border border-[#e5e2da] p-3 sm:grid-cols-[1fr_1fr_auto_1fr_auto_auto] sm:items-center dark:border-white/[0.07]"
                >
                  <Input
                    placeholder="Name (optional)"
                    value={row.name}
                    onChange={(e) => updateRow(i, { name: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                  <Select
                    value={row.categoryId}
                    onValueChange={(v) => updateRow(i, { categoryId: v })}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={row.direction}
                    onValueChange={(v) => updateRow(i, { direction: v as Direction })}
                  >
                    <SelectTrigger className="h-10 w-24 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">In</SelectItem>
                      <SelectItem value="out">Out</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    value={row.amount}
                    onChange={(e) => updateRow(i, { amount: e.target.value })}
                    className="h-10 rounded-xl"
                  />
                  <Select
                    value={row.frequency}
                    onValueChange={(v) => updateRow(i, { frequency: v as Frequency })}
                  >
                    <SelectTrigger className="h-10 w-28 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-red-500 dark:hover:bg-white/[0.04]"
                    aria-label="Remove row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
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
            {isLoading ? "Saving..." : "Save institution"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
