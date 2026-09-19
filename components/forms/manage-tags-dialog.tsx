"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AddTagForm } from "@/components/forms/add-tag-form";
import { RestoreDefaultTagsButton } from "@/components/forms/restore-default-tags-button";
import { DeleteRowButton } from "@/components/forms/delete-row-button";
import { useDashboardData } from "@/app/protected/dashboard/dashboard-provider";
import { cn } from "@/lib/utils";

export function ManageTagsDialog({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { tags } = useDashboardData();

  function handleSuccess() {
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 rounded-xl border border-border text-zinc-500 dark:text-zinc-400",
            triggerClassName,
          )}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add tag
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto rounded-[28px] border-border">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground dark:text-white">
            Tags
          </DialogTitle>
          <DialogDescription>
            Add a new tag or manage your existing ones.
          </DialogDescription>
        </DialogHeader>

        <AddTagForm onSuccess={handleSuccess} />

        <div className="flex flex-col gap-1 border-t border-border pt-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground dark:text-white">
              Existing tags
            </p>
            <RestoreDefaultTagsButton />
          </div>
          {tags.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No tags yet.
            </p>
          )}
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between rounded-xl px-2 py-1.5 hover:bg-zinc-50 dark:hover:bg-white/[0.03]"
            >
              <span className="flex items-center gap-2 text-sm text-foreground dark:text-white">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </span>
              <DeleteRowButton kind="tag" id={tag.id} />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
