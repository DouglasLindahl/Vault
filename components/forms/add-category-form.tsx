"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createCategory } from "@/lib/queries/categories";
import type { CategoryType } from "@/lib/types/database";

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

export function AddCategoryForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("expense");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Give the category a name.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You need to be logged in.");

      await createCategory(supabase, {
        user_id: user.id,
        name: name.trim(),
        type,
      });

      setName("");
      setType("expense");

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="category-name">Name</Label>
          <Input
            id="category-name"
            placeholder="Groceries"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-2xl"
          />
        </div>
        <div className="grid gap-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as CategoryType)}>
            <SelectTrigger className="h-11 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
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
        {isLoading ? "Saving..." : "Save category"}
      </Button>
    </form>
  );
}
