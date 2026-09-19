import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { adminUpdateSubscriptionStatus } from "@/lib/queries/admin";
import type { SubscriptionStatus } from "@/lib/types/database";

const VALID_STATUSES: SubscriptionStatus[] = ["free", "trial", "active", "canceled"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { userId, status } = await request.json();

  if (!userId || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid user or status." }, { status: 400 });
  }

  try {
    const admin = createAdminClient();
    await adminUpdateSubscriptionStatus(admin, userId, status);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't update subscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
