"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AboutYouData = {
  firstName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
};

type Props = {
  value: AboutYouData;
  onChange: (value: AboutYouData) => void;
  onNext: () => void;
  loading?: boolean;
};

export function AboutYouStep({ value, onChange, onNext, loading }: Props) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first-name">First name</Label>
          <Input
            id="first-name"
            required
            value={value.firstName}
            onChange={(e) =>
              onChange({
                ...value,
                firstName: e.target.value,
              })
            }
            className="h-12 rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last-name">Last name</Label>
          <Input
            id="last-name"
            required
            value={value.lastName}
            onChange={(e) =>
              onChange({
                ...value,
                lastName: e.target.value,
              })
            }
            className="h-12 rounded-2xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred-name">What should Vault call you?</Label>

        <Input
          id="preferred-name"
          value={value.preferredName}
          onChange={(e) =>
            onChange({
              ...value,
              preferredName: e.target.value,
            })
          }
          placeholder="Alex"
          className="h-12 rounded-2xl"
        />

        <p className="text-xs text-zinc-500">
          Usually your first name or nickname.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dob">Date of birth</Label>
        <Input
          id="dob"
          type="date"
          value={value.dateOfBirth}
          onChange={(e) =>
            onChange({
              ...value,
              dateOfBirth: e.target.value,
            })
          }
          className="h-12 rounded-2xl"
        />
      </div>

      <div className="flex justify-end pt-3">
        <Button
          disabled={loading}
          className="h-12 rounded-2xl bg-[#172033] px-7 text-white dark:bg-gradient-to-r dark:from-pink-500 dark:to-fuchsia-600"
        >
          {loading ? "Saving..." : "Continue"}
        </Button>
      </div>
    </form>
  );
}
