import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeLayout, type DashboardLayout } from "@/lib/dashboard-layout";
import { toCurrency, type CurrencyCode } from "@/lib/currency";

type DashboardPrefs = {
  displayName: string | null;
  baseCurrency: CurrencyCode;
  layout: DashboardLayout;
};

// Never throws: if the profile row or the dashboard_layout column is
// missing (phase11 SQL not run yet), the default layout is used.
export async function getDashboardPrefs(
  supabase: SupabaseClient,
  userId: string,
): Promise<DashboardPrefs> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, currency, dashboard_layout")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Couldn't load dashboard layout:", error.message);
    const { data: fallback } = await supabase
      .from("profiles")
      .select("display_name, currency")
      .eq("id", userId)
      .maybeSingle();
    return {
      displayName: fallback?.display_name ?? null,
      baseCurrency: toCurrency(fallback?.currency),
      layout: sanitizeLayout(null),
    };
  }

  return {
    displayName: data.display_name ?? null,
    baseCurrency: toCurrency(data.currency),
    layout: sanitizeLayout(data.dashboard_layout),
  };
}

// The user's display currency, for server pages that total amounts across
// institutions (stats, recurring).
export async function getBaseCurrency(supabase: SupabaseClient): Promise<CurrencyCode> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return toCurrency(null);
  const { data } = await supabase.from("profiles").select("currency").eq("id", user.id).maybeSingle();
  return toCurrency(data?.currency);
}

// `null` resets to the default layout.
export async function saveDashboardLayout(
  supabase: SupabaseClient,
  userId: string,
  layout: DashboardLayout | null,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ dashboard_layout: layout })
    .eq("id", userId);
  if (error) throw error;
}
