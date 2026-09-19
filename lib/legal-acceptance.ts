import type { SupabaseClient, User } from "@supabase/supabase-js";
import { updateProfile } from "@/lib/queries/snapshots";

// components/auth-form.tsx / sign-up-form.tsx record terms/privacy
// acceptance on the auth user's metadata at signup time, since there's no
// session yet to write to `profiles` with when email confirmation is
// required. This copies it into `profiles` (where it's easy to query/show
// on the account) the first time we see an authenticated request from this
// user that hasn't recorded it there yet.
export async function syncLegalAcceptance(
  supabase: SupabaseClient,
  user: User,
): Promise<void> {
  const metadata = user.user_metadata ?? {};
  if (!metadata.terms_accepted_at && !metadata.privacy_accepted_at) return;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("terms_accepted_at, privacy_accepted_at")
    .eq("id", user.id)
    .maybeSingle();
  if (error || !profile) return;

  const update: Record<string, string> = {};
  if (!profile.terms_accepted_at && metadata.terms_accepted_at) {
    update.terms_accepted_at = metadata.terms_accepted_at;
    if (metadata.terms_version) update.terms_version = metadata.terms_version;
  }
  if (!profile.privacy_accepted_at && metadata.privacy_accepted_at) {
    update.privacy_accepted_at = metadata.privacy_accepted_at;
    if (metadata.privacy_version) update.privacy_version = metadata.privacy_version;
  }

  if (Object.keys(update).length > 0) {
    await updateProfile(supabase, user.id, update);
  }
}
