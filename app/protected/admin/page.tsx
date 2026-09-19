import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin";
import { getAllProfiles } from "@/lib/queries/admin";
import { AdminUsersPanel } from "@/components/admin/admin-users-panel";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect("/protected/dashboard");
  }

  const admin = createAdminClient();
  const profiles = await getAllProfiles(admin);

  return (
    <div className="relative flex min-h-screen bg-background">
      <div className="flex-1 px-6 py-10 md:px-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground dark:text-white">
            Admin
          </h1>
        </div>
        <AdminUsersPanel profiles={profiles} />
      </div>
    </div>
  );
}
