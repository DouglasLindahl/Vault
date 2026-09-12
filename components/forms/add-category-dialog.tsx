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
import { AddCategoryForm } from "@/components/forms/add-category-form";

export function AddCategoryDialog() {
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
          Add category
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md rounded-[28px] border-[#e5e2da] dark:border-white/[0.07]">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#172033] dark:text-white">
            Add category
          </DialogTitle>
          <DialogDescription>
            Categories group your transactions so spending breakdowns make sense.
          </DialogDescription>
        </DialogHeader>
        <AddCategoryForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
