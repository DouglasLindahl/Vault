"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createInstitutionAction } from "@/lib/actions/institutions";
import type { InstitutionType } from "@/lib/types/database";
import { todayDateOnly } from "@/lib/utils";
import { useDashboardData } from "@/app/protected/dashboard/dashboard-provider";
import { CurrencySelect } from "@/components/forms/currency-select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddInstitutionForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const { baseCurrency } = useDashboardData();

  const [name, setName] = useState("");
  const [type, setType] = useState<InstitutionType>("bank");
  const [currency, setCurrency] = useState(baseCurrency);
  const [startingBalance, setStartingBalance] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Give the institution a name.");
      return;
    }

    setIsLoading(true);

    try {
      await createInstitutionAction({
        name: name.trim(),
        type,
        startingBalance: startingBalance ? Number(startingBalance) : 0,
        asOfDate: todayDateOnly(),
        currency,
      });

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="institution-name">Name</Label>
          <Input
            id="institution-name"
            placeholder="Institution name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-2xl"
          />
        </div>
        <div className="grid gap-2">
          <Label>Type</Label>
          <Select
            value={type}
            onValueChange={(v) => setType(v as InstitutionType)}
          >
            <SelectTrigger className="h-11 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bank">Bank</SelectItem>
              <SelectItem value="investment">Investment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Currency</Label>
          <CurrencySelect value={currency} onChange={setCurrency} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="starting-balance">Current balance ({currency})</Label>
          <Input
            id="starting-balance"
            type="number"
            step="0.01"
            placeholder="0"
            value={startingBalance}
            onChange={(e) => setStartingBalance(e.target.value)}
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
        className="h-12 rounded-2xl bg-primary-surface text-white"
      >
        {isLoading ? "Saving..." : "Save institution"}
      </Button>
    </form>
  );
}
