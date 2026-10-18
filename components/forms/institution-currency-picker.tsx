"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateInstitutionCurrencyAction } from "@/lib/actions/institutions";
import { CurrencySelect } from "@/components/forms/currency-select";

// Changes which currency this institution's amounts are in. It relabels,
// it doesn't convert — so it asks first.
export function InstitutionCurrencyPicker({
  institutionId,
  currency,
}: {
  institutionId: string;
  currency: string;
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(next: string) {
    if (next === currency) return;
    const ok = window.confirm(
      `Treat this account's balance and transactions as ${next} instead of ${currency}?\n\n` +
        "Amounts are not converted — use this to fix which currency they were in.",
    );
    if (!ok) return;
    setIsSaving(true);
    try {
      await updateInstitutionCurrencyAction(institutionId, next);
      router.refresh();
    } catch (err: unknown) {
      window.alert(err instanceof Error ? err.message : "Couldn't change the currency.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <CurrencySelect
      value={currency}
      onChange={handleChange}
      disabled={isSaving}
      className="h-9 w-auto min-w-24 rounded-xl text-sm"
    />
  );
}
