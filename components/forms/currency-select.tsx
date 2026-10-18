"use client";

import { CURRENCIES } from "@/lib/currency";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const displayNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(undefined, { type: "currency" })
    : null;

export function CurrencySelect({
  value,
  onChange,
  className,
  disabled,
}: {
  value: string;
  onChange: (currency: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn("h-11 rounded-2xl", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {CURRENCIES.map((code) => (
          <SelectItem key={code} value={code}>
            <span className="font-medium">{code}</span>
            {displayNames && (
              <span className="ml-2 text-zinc-500 dark:text-zinc-400">
                {displayNames.of(code)}
              </span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
