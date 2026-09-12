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

export function AddInstitutionDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleSuccess() {
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-2xl bg-[#172033] text-white dark:bg-gradient-to-r dark:from-pink-500 dark:to-fuchsia-600">
          <Plus className="mr-2 h-4 w-4" />
          Add institution
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-[28px] border-[#e5e2da] dark:border-white/[0.07]">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#172033] dark:text-white">
            Add institution
          </DialogTitle>
          <DialogDescription>Name it and set a starting balance.</DialogDescription>
        </DialogHeader>
        <AddInstitutionForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
