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
import { AddInstitutionForm } from "@/components/forms/add-institution-form";
import { cn } from "@/lib/utils";

export function AddInstitutionDialog({
  triggerClassName,
}: {
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSuccess() {
    setOpen(false);
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
          Add institution
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-[28px] border-border">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground dark:text-white">
            Add institution
          </DialogTitle>
          <DialogDescription>Name it and set a starting balance.</DialogDescription>
        </DialogHeader>
        <AddInstitutionForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
