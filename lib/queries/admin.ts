import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/database";

// All of these take an admin (service-role) client — they read/write
// across users, which regular RLS-scoped queries can't do.

export async function getAllProfiles(admin: SupabaseClient): Promise<Profile[]> {
  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function adminUpdateSubscriptionStatus(
  admin: SupabaseClient,
  userId: string,
  status: Profile["subscription_status"]
): Promise<void> {
  const { error } = await admin
    .from("profiles")
    .update({ subscription_status: status })
    .eq("id", userId);
  if (error) throw error;
}
