"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type PreferencesData = {
  countryCode: string;
  currencyCode: string;
  timezone: string;
  weekStartsOn: number;
};

type Props = {
  value: PreferencesData;
  onChange: (value: PreferencesData) => void;
  onBack: () => void;
  onNext: () => void;
};

export function PreferencesStep({ value, onChange, onBack, onNext }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Country</Label>
          <Input
            value={value.countryCode}
            onChange={(e) =>
              onChange({
                ...value,
                countryCode: e.target.value.toUpperCase(),
              })
            }
            placeholder="US"
            maxLength={2}
            className="h-12 rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label>Currency</Label>
          <Input
            value={value.currencyCode}
            onChange={(e) =>
              onChange({
                ...value,
                currencyCode: e.target.value.toUpperCase(),
              })
            }
            placeholder="USD"
            maxLength={3}
            className="h-12 rounded-2xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Timezone</Label>
        <Input
          value={value.timezone}
          onChange={(e) =>
            onChange({
              ...value,
              timezone: e.target.value,
            })
          }
          placeholder="America/Chicago"
          className="h-12 rounded-2xl"
        />
      </div>

      <div className="space-y-3">
        <Label>My week starts on</Label>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={value.weekStartsOn === 0 ? "default" : "outline"}
            onClick={() =>
              onChange({
                ...value,
                weekStartsOn: 0,
              })
            }
            className="h-12 rounded-2xl"
          >
            Sunday
          </Button>

          <Button
            type="button"
            variant={value.weekStartsOn === 1 ? "default" : "outline"}
            onClick={() =>
              onChange({
                ...value,
                weekStartsOn: 1,
              })
            }
            className="h-12 rounded-2xl"
          >
            Monday
          </Button>
        </div>
      </div>

      <Navigation onBack={onBack} onNext={onNext} />
    </div>
  );
}

function Navigation({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex justify-between pt-4">
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="rounded-2xl"
      >
        Back
      </Button>

      <Button type="button" onClick={onNext} className="h-12 rounded-2xl px-7">
        Continue
      </Button>
    </div>
  );
}
