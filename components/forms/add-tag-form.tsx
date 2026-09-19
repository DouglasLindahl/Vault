"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createTag } from "@/lib/queries/tags";
import { TAG_COLORS } from "@/lib/tag-colors";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddTagForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Give the tag a name.");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You need to be logged in.");

      await createTag(supabase, {
        user_id: user.id,
        name: name.trim(),
        color,
      });

      setName("");
      setColor(TAG_COLORS[0]);

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="tag-name">Name</Label>
        <Input
          id="tag-name"
          placeholder="Groceries"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-2xl"
        />
      </div>

      <div className="grid gap-2">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "h-7 w-7 shrink-0 rounded-full ring-offset-2 ring-offset-background transition-all",
                color === c && "ring-2 ring-foreground",
              )}
              style={{ backgroundColor: c }}
              aria-label={`Choose color ${c}`}
            />
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
        className="h-12 rounded-2xl bg-primary-surface text-white"
      >
        {isLoading ? "Saving..." : "Save tag"}
      </Button>
    </form>
  );
}
