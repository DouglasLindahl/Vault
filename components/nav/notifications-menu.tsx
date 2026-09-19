"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/queries/notifications";
import type { Notification } from "@/lib/types/database";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationsMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  async function refreshUnreadCount() {
    const supabase = createClient();
    setUnreadCount(await getUnreadCount(supabase));
  }

  async function loadNotifications() {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const [list, count] = await Promise.all([
        getNotifications(supabase, { limit: 20 }),
        getUnreadCount(supabase),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshUnreadCount();
  }, []);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) await loadNotifications();
  }

  async function handleNotificationClick(notification: Notification) {
    if (!notification.read) {
      const supabase = createClient();
      await markNotificationRead(supabase, notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
  }

  async function handleMarkAllRead() {
    const supabase = createClient();
    await markAllNotificationsRead(supabase);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card/95 text-foreground shadow-[0_18px_60px_rgba(23,32,51,0.06)] dark:text-white"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-2xl border-border p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground dark:text-white">
            Notifications
          </p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-medium text-primary-surface hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="flex max-h-80 flex-col overflow-y-auto">
          {isLoading && notifications.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Loading...
            </p>
          )}
          {!isLoading && notifications.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              You&apos;re all caught up.
            </p>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleNotificationClick(n)}
              className="flex flex-col items-start gap-0.5 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-zinc-50 dark:hover:bg-white/[0.04]"
            >
              <div className="flex w-full items-center gap-2">
                {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />}
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground dark:text-white">
                  {n.title}
                </p>
                <span className="shrink-0 text-[11px] text-zinc-400">
                  {timeAgo(n.created_at)}
                </span>
              </div>
              {n.body && (
                <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {n.body}
                </p>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
