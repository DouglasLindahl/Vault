"use client";

import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#EC4899",
  "#D946EF",
  "#8B5CF6",
  "#6366F1",
  "#3B82F6",
  "#06B6D4",
  "#14B8A6",
  "#22C55E",
  "#84CC16",
  "#EAB308",
  "#F97316",
  "#EF4444",
];

export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
            value === color
              ? "border-zinc-900 dark:border-white"
              : "border-transparent",
          )}
        >
          <span
            className="block h-full w-full rounded-full border-2 border-white dark:border-[#141416]"
            style={{ backgroundColor: color }}
          />
        </button>
      ))}

      <label className="relative flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-medium dark:border-white/10">
        🎨 Custom
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}
