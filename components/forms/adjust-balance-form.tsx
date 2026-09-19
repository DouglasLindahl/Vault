"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateInstitutionBalanceAction } from "@/lib/actions/institutions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdjustBalanceForm({
  institutionId,
  currentBalance,
  onSuccess,
}: {
  institutionId: string;
  currentBalance: number;
  onSuccess?: () => void;
}) {
  const router = useRouter();

  const [balance, setBalance] = useState(currentBalance.toFixed(2));
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (balance.trim() === "" || Number.isNaN(Number(balance))) {
      setError("Enter a valid balance.");
      return;
    }

    setIsLoading(true);

    try {
      await updateInstitutionBalanceAction(institutionId, Number(balance));

      if (onSuccess) {
        onSuccess();
      } else {
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
      <div className="grid gap-2">
        <Label htmlFor="adjust-balance">New balance</Label>
        <Input
          id="adjust-balance"
          type="number"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="h-11 rounded-2xl"
        />
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
        {isLoading ? "Saving..." : "Save balance"}
      </Button>
    </form>
  );
}
