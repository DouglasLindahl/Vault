import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DailySnapshot,
  DailySnapshotInsert,
  Profile,
  ProfileUpdate,
} from "@/lib/types/database";

export async function getSnapshots(
  supabase: SupabaseClient,
  options?: { startDate?: string; endDate?: string }
): Promise<DailySnapshot[]> {
  let query = supabase.from("daily_snapshots").select("*");

  if (options?.startDate) query = query.gte("date", options.startDate);
  if (options?.endDate) query = query.lte("date", options.endDate);

  const { data, error } = await query.order("date", { ascending: true });
  if (error) throw error;
  return data;
}

// One row per user per day — insert-or-update depending on
// whether today's snapshot already exists.
export async function upsertSnapshot(
  supabase: SupabaseClient,
  input: DailySnapshotInsert
): Promise<DailySnapshot> {
  const { data, error } = await supabase
    .from("daily_snapshots")
    .upsert(input, { onConflict: "user_id,date" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProfile(
  supabase: SupabaseClient,
  id: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateProfile(
  supabase: SupabaseClient,
  id: string,
  input: ProfileUpdate
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
