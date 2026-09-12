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
import { AddHoldingForm } from "@/components/forms/add-holding-form";

export function AddHoldingDialog({ institutionId }: { institutionId: string }) {
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
          className="h-9 rounded-xl border border-[#e5e2da] dark:border-white/[0.07]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add holding
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl rounded-[28px] border-[#e5e2da] dark:border-white/[0.07]">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#172033] dark:text-white">
            Add holding
          </DialogTitle>
          <DialogDescription>
            Record a stock or crypto position for this account.
          </DialogDescription>
        </DialogHeader>
        <AddHoldingForm institutionId={institutionId} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
