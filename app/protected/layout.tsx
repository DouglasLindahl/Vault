import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserProvider } from "@/components/providers/user-provider";

import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Verify that the current request belongs to an authenticated user
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userUid = claimsData?.claims?.sub;

  if (claimsError || !userUid) {
    redirect("/auth/login");
  }

  // Load the Vault profile
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select(
      `
      user_uid,
      user_onboarding_step,
user_weekly_savings_goal,
user_monthly_savings_goal,
user_yearly_savings_goal,
      user_email,
      user_phone_number,
      user_first_name,
      user_last_name,
      user_preferred_name,
      user_display_name,
      user_username,
      user_avatar_url,
      user_date_of_birth,
      user_country_code,
      user_currency_id,
      user_timezone,
      user_locale,
      user_language,
      user_week_starts_on,
      user_first_time_login,
      user_completed_profile,
      user_completed_onboarding,
      user_terms_accepted,
      user_marketing_emails_enabled,
      user_account_status,
      user_created_at,
      currencies (
        currency_id,
        currency_code,
        currency_name,
        currency_symbol
      )
    `,
    )
    .eq("user_uid", userUid)
    .single();

  if (profileError || !profile) {
    console.error("Unable to load Vault profile:", profileError);

    throw new Error("Unable to load Vault user profile");
  }

  return (
    <UserProvider user={profile}>
      <main className="min-h-screen flex flex-col items-center">
        <div className="flex-1 w-full flex flex-col gap-20 items-center">
          <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
            <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
              <div className="flex gap-5 items-center font-semibold">
                <Link href="/dashboard">Vault</Link>

                <div className="flex items-center gap-2">
                  <DeployButton />
                </div>
              </div>

              {!hasEnvVars ? <EnvVarWarning /> : <AuthButton />}
            </div>
          </nav>

          <div className="flex-1 flex flex-col gap-20 w-full max-w-5xl p-5">
            {children}
          </div>
        </div>
      </main>
    </UserProvider>
  );
}
