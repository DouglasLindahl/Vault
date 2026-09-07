"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type SavingsData = {
  weekly: string;
  monthly: string;
  yearly: string;
};

type Props = {
  value: SavingsData;
  onChange: (value: SavingsData) => void;
  onBack: () => void;
  onFinish: () => void;
  loading?: boolean;
};

export function SavingsStep({
  value,
  onChange,
  onBack,
  onFinish,
  loading,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-[#315cff]/[0.06] p-4 text-sm leading-6 dark:bg-pink-500/[0.08]">
        Not sure what to choose? Start with something comfortable. You can
        change these goals whenever you want.
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Goal
          label="Weekly goal"
          value={value.weekly}
          onChange={(weekly) => onChange({ ...value, weekly })}
        />

        <Goal
          label="Monthly goal"
          value={value.monthly}
          onChange={(monthly) => onChange({ ...value, monthly })}
        />

        <Goal
          label="Yearly goal"
          value={value.yearly}
          onChange={(yearly) => onChange({ ...value, yearly })}
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>

        <Button
          type="button"
          onClick={onFinish}
          disabled={loading}
          className="h-12 rounded-2xl bg-[#172033] px-7 text-white dark:bg-gradient-to-r dark:from-pink-500 dark:to-fuchsia-600"
        >
          {loading ? "Setting up Vault..." : "Finish setup"}
        </Button>
      </div>
    </div>
  );
}

function Goal({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
          $
        </span>

        <Input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 rounded-2xl pl-8"
        />
      </div>
    </div>
  );
}
