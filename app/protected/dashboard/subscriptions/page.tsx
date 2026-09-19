import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries/snapshots";
import { SubscriptionPlan } from "@/components/settings/subscription-plan";
import { PageLoading } from "@/components/ui/spinner";

async function SubscriptionContent() {
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
          Subscription
        </h1>
      </div>

      <div className="max-w-md">
        <SubscriptionPlan userId={user.id} currentStatus={profile.subscription_status} />
      </div>
    </>
  );
}

export default function SubscriptionsPage() {
  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="flex-1 px-6 py-10 md:px-10">
        <Suspense fallback={<PageLoading />}>
          <SubscriptionContent />
        </Suspense>
      </div>
    </div>
  );
}
