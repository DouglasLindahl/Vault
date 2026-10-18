"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { saveDashboardLayout } from "@/lib/queries/dashboard-layout";
import { sanitizeLayout } from "@/lib/dashboard-layout";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be logged in.");
  return { supabase, user };
}

// The layout comes from the browser, so it's re-validated here rather than
// trusted — sanitizeLayout drops unknown cards and clamps every option.
export async function saveDashboardLayoutAction(layout: unknown) {
  const { supabase, user } = await requireUser();
  await saveDashboardLayout(supabase, user.id, sanitizeLayout(layout));
  // The layout is loaded in app/protected/layout.tsx, shared by every page.
  revalidatePath("/protected", "layout");
}

export async function resetDashboardLayoutAction() {
  const { supabase, user } = await requireUser();
  await saveDashboardLayout(supabase, user.id, null);
  revalidatePath("/protected", "layout");
}
