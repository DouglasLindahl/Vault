import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries/snapshots";
import { ProfileForm } from "@/components/settings/profile-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";
import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageLoading } from "@/components/ui/spinner";

async function SettingsContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await getProfile(supabase, user.id);
  if (!profile) return null;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
          Settings
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base text-foreground dark:text-white">
              Profile
            </CardTitle>
            <CardDescription>Your personal details.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm profile={profile} />
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base text-foreground dark:text-white">
              Password
            </CardTitle>
            <CardDescription>Update the password you log in with.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base text-foreground dark:text-white">
              Appearance
            </CardTitle>
            <CardDescription>Light, dark, or match your system.</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSwitcher />
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
          <Link
            href="/protected/dashboard/subscriptions"
            className="flex items-center justify-between gap-4 px-6 py-5"
          >
            <div>
              <CardTitle className="text-base text-foreground dark:text-white">
                Subscription
              </CardTitle>
              <CardDescription className="mt-1">
                {profile.subscription_status === "free"
                  ? "Free plan — upgrade to Vault Plus"
                  : `Currently: ${profile.subscription_status}`}
              </CardDescription>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-zinc-400" />
          </Link>
        </Card>

        <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base text-foreground dark:text-white">Legal</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center justify-between">
              <Link href="/terms" target="_blank" className="text-foreground underline underline-offset-4 dark:text-white">
                Terms and Conditions
              </Link>
              <span>
                {profile.terms_accepted_at
                  ? `Accepted ${new Date(profile.terms_accepted_at).toLocaleDateString()}`
                  : "Not recorded"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <Link href="/privacy" target="_blank" className="text-foreground underline underline-offset-4 dark:text-white">
                Privacy Policy
              </Link>
              <span>
                {profile.privacy_accepted_at
                  ? `Accepted ${new Date(profile.privacy_accepted_at).toLocaleDateString()}`
                  : "Not recorded"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-border bg-card/95 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur">
          <CardHeader>
            <CardTitle className="text-base text-foreground dark:text-white">
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <LogoutButton className="w-fit rounded-xl" />
            <DeleteAccountSection />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="flex-1 px-6 py-10 md:px-10">
        <Suspense fallback={<PageLoading />}>
          <SettingsContent />
        </Suspense>
      </div>
    </div>
  );
}
