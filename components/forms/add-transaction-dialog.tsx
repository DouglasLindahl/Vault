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
import { AddTransactionForm } from "@/components/forms/add-transaction-form";
import type { TagOption } from "@/lib/types";

type InstitutionOption = { id: string; name: string };

export function AddTransactionDialog({
  institutions,
  tags,
}: {
  institutions: InstitutionOption[];
  tags: TagOption[];
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
        <Button className="h-11 rounded-2xl bg-primary-surface text-white">
          <Plus className="mr-2 h-4 w-4" />
          Add transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto rounded-[28px] border-border">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground dark:text-white">
            Add transaction
          </DialogTitle>
          <DialogDescription>
            Log a one-off, or flip on Recurring for something that repeats.
          </DialogDescription>
        </DialogHeader>
        <AddTransactionForm
          institutions={institutions}
          tags={tags}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
