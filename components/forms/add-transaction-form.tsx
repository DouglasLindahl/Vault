"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createTransaction } from "@/lib/queries/transactions";
import type { Category, Direction, Institution } from "@/lib/types/database";

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

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function AddTransactionForm({
  institutions,
  categories,
}: {
  institutions: Institution[];
  categories: Category[];
}) {
  const router = useRouter();

  const [institutionId, setInstitutionId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [direction, setDirection] = useState<Direction>("out");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today());
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

      await createTransaction(supabase, {
        user_id: user.id,
        institution_id: institutionId,
        category_id: categoryId,
        name: name.trim() || null,
        amount: Number(amount),
        direction,
        date,
      });

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
        <CardTitle className="text-xl text-[#172033] dark:text-white">Add transaction</CardTitle>
        <CardDescription>Log a one-off in or out for any account.</CardDescription>
      </CardHeader>
      <CardContent>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-2xl"
              />
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
            {isLoading ? "Saving..." : "Save transaction"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
