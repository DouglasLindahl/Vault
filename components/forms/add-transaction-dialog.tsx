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

type InstitutionOption = { id: string; name: string };
type CategoryOption = { id: string; name: string };

export function AddTransactionDialog({
  institutions,
  categories,
}: {
  institutions: InstitutionOption[];
  categories: CategoryOption[];
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
          variant="secondary"
          className="h-11 rounded-2xl border border-[#e5e2da] dark:border-white/[0.07]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto rounded-[28px] border-[#e5e2da] dark:border-white/[0.07]">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#172033] dark:text-white">
            Add transaction
          </DialogTitle>
          <DialogDescription>
            Log a one-off, or flip on Recurring for something that repeats.
          </DialogDescription>
        </DialogHeader>
        <AddTransactionForm
          institutions={institutions}
          categories={categories}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
