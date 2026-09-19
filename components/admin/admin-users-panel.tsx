"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile, SubscriptionStatus } from "@/lib/types/database";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STATUS_OPTIONS: SubscriptionStatus[] = ["free", "trial", "active", "canceled"];

function SendNotificationCard({ profiles }: { profiles: Profile[] }) {
  const [targetId, setTargetId] = useState<string>("broadcast");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSend() {
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setIsSending(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          broadcast: targetId === "broadcast",
          userId: targetId === "broadcast" ? undefined : targetId,
          title: title.trim(),
          body: body.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't send notification.");
      setTitle("");
      setBody("");
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
      <CardHeader>
        <CardTitle className="text-base text-foreground dark:text-white">
          Send notification
        </CardTitle>
        <CardDescription>Message all users, or one specifically.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label>Recipient</Label>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger className="h-11 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="broadcast">Everyone</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.display_name ?? p.email ?? p.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notify-title">Title</Label>
          <Input
            id="notify-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 rounded-2xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="notify-body">Message (optional)</Label>
          <Input
            id="notify-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="h-11 rounded-2xl"
          />
        </div>
        {error && (
          <div className="rounded-2xl bg-red-500/[0.07] px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
            Notification sent.
          </div>
        )}
        <Button
          type="button"
          disabled={isSending}
          onClick={handleSend}
          className="h-11 w-fit rounded-2xl bg-primary-surface text-white"
        >
          {isSending ? "Sending..." : "Send"}
        </Button>
      </CardContent>
    </Card>
  );
}

function UserRow({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [status, setStatus] = useState<SubscriptionStatus>(profile.subscription_status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(next: SubscriptionStatus) {
    setStatus(next);
    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id, status: next }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't update subscription.");
      router.refresh();
    } catch {
      setStatus(profile.subscription_status);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Couldn't delete user.");
      setDeleteOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-2 py-3 hover:bg-zinc-50 dark:hover:bg-white/[0.03]">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground dark:text-white">
          {profile.display_name ?? "Unnamed"}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{profile.email}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Select
          value={status}
          onValueChange={(v) => handleStatusChange(v as SubscriptionStatus)}
          disabled={isUpdating}
        >
          <SelectTrigger className="h-9 rounded-xl text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="destructive" size="sm" className="rounded-xl">
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[28px] border-border">
            <DialogHeader>
              <DialogTitle className="text-xl text-foreground dark:text-white">
                Delete {profile.email}?
              </DialogTitle>
              <DialogDescription>
                Permanently deletes this user&apos;s account and all their data. Cannot be
                undone.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2">
              <Label htmlFor={`confirm-delete-${profile.id}`}>
                Type <span className="font-semibold">DELETE</span> to confirm
              </Label>
              <Input
                id={`confirm-delete-${profile.id}`}
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
                {isDeleting ? "Deleting..." : "Permanently delete user"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export function AdminUsersPanel({ profiles }: { profiles: Profile[] }) {
  return (
    <div className="flex flex-col gap-6">
      <SendNotificationCard profiles={profiles} />

      <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base text-foreground dark:text-white">
            Users ({profiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {profiles.map((p) => (
            <UserRow key={p.id} profile={p} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
