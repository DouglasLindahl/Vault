import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin", className)} />;
}

export function PageLoading() {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center">
      <Spinner className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
    </div>
  );
}
