"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AdjustBalanceForm } from "@/components/forms/adjust-balance-form";

export function AdjustBalanceDialog({
  institutionId,
  institutionName,
  currentBalance,
}: {
  institutionId: string;
  institutionName: string;
  currentBalance: number;
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
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-[#315cff] dark:hover:bg-white/[0.04] dark:hover:text-pink-400"
          aria-label={`Adjust balance for ${institutionName}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm rounded-[28px] border-[#e5e2da] dark:border-white/[0.07]">
        <DialogHeader>
          <DialogTitle className="text-xl text-[#172033] dark:text-white">
            Adjust {institutionName}
          </DialogTitle>
          <DialogDescription>
            Correct the balance to match what you actually see at the institution.
          </DialogDescription>
        </DialogHeader>
        <AdjustBalanceForm
          institutionId={institutionId}
          currentBalance={currentBalance}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
