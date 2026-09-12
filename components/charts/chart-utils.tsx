"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

// Validated categorical/sequential steps from the design system's reference
// palette (dataviz skill) — light/dark pairs, used as-is (not re-derived).
export const COLORS = {
  light: {
    blue: "#2a78d6",
    orange: "#eb6834",
    green: "#3d8a5f",
    grid: "#e1e0d9",
    axis: "#898781",
    text: "#52514e",
    surface: "#fcfcfb",
  },
  dark: {
    blue: "#3987e5",
    orange: "#d95926",
    green: "#4fae7d",
    grid: "#2c2c2a",
    axis: "#898781",
    text: "#c3c2b7",
    surface: "#1a1a19",
  },
};

export function currency(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

export function useChartColors() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const mode = mounted && resolvedTheme === "dark" ? "dark" : "light";
  return COLORS[mode];
}

export function ChartTooltip({
  active,
  payload,
  label,
  colors,
  formatValue = currency,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  colors: typeof COLORS.light;
  formatValue?: (n: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-xl border px-3 py-2 text-xs shadow-md"
      style={{
        background: colors.surface,
        borderColor: colors.grid,
        color: colors.text,
      }}
    >
      {label && <p className="mb-1 font-medium">{label}</p>}
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span
            className="inline-block h-0.5 w-3"
            style={{ backgroundColor: p.color }}
          />
          <span className="font-semibold tabular-nums">{formatValue(p.value)}</span>
          <span>{p.name}</span>
        </div>
      ))}
    </div>
  );
}
