import type { SupabaseClient } from "@supabase/supabase-js";
import type { Notification, NotificationInsert } from "@/lib/types/database";

export async function getNotifications(
  supabase: SupabaseClient,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<Notification[]> {
  let query = supabase.from("notifications").select("*");

  if (options?.unreadOnly) query = query.eq("read", false);

  query = query.order("created_at", { ascending: false });
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getUnreadCount(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("read", false);

  if (error) throw error;
  return count ?? 0;
}

export async function createNotification(
  supabase: SupabaseClient,
  input: NotificationInsert
): Promise<Notification> {
  const { data, error } = await supabase
    .from("notifications")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("read", false);
  if (error) throw error;
}
