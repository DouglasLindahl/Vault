"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const logout = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/auth-form");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={logout}
      disabled={isLoading}
      variant="ghost"
      size="sm"
      className={cn(
        "shrink-0 gap-2 rounded-xl text-zinc-500 hover:bg-zinc-100 hover:text-[#172033] dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white",
        className,
      )}
    >
      <LogOut className="h-4 w-4" />
      {isLoading ? "Logging out..." : "Log out"}
    </Button>
  );
}
