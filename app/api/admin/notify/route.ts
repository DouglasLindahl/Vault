import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { getAllProfiles } from "@/lib/queries/admin";
import { createNotification } from "@/lib/queries/notifications";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { userId, broadcast, title, body, link } = await request.json();

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }
  if (!broadcast && !userId) {
    return NextResponse.json({ error: "Pick a user or broadcast to everyone." }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const targetIds = broadcast
      ? (await getAllProfiles(admin)).map((p) => p.id)
      : [userId as string];

    for (const id of targetIds) {
      await createNotification(admin, {
        user_id: id,
        type: "admin_message",
        title,
        body: body || null,
        link: link || null,
      });
    }

    return NextResponse.json({ ok: true, count: targetIds.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't send notification.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
