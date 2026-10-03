"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deleteConversion } from "@/lib/queries/investments";

// Deleting server-side and calling refresh() ships the updated page back
// in the same round-trip, so the holding disappears without a reload.
export async function deleteConversionAction(id: string) {
  const supabase = await createClient();
  await deleteConversion(supabase, id);
  refresh();
}
