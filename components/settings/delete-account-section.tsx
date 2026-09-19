"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

export function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Couldn't delete account.");

      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-500/20 bg-red-500/[0.04] px-4 py-4">
      <div>
        <p className="text-sm font-medium text-foreground dark:text-white">
          Delete account
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Permanently deletes your account and all data. Cannot be undone.
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="shrink-0 rounded-xl"
          >
            Delete
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-[28px] border-border">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground dark:text-white">
              Delete your account?
            </DialogTitle>
            <DialogDescription>
              This permanently deletes your account, institutions, transactions,
              tags, and everything else. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="confirm-delete">
              Type <span className="font-semibold">DELETE</span> to confirm
            </Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
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
              variant="destructive"
              disabled={confirmText !== "DELETE" || isDeleting}
              onClick={handleDelete}
              className="rounded-xl"
            >
              {isDeleting ? "Deleting..." : "Permanently delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
