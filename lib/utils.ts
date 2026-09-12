import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Dates from the DB are plain YYYY-MM-DD strings with no time or
// timezone. `new Date("2026-09-12")` parses that as UTC midnight,
// which then renders as the previous day in any timezone behind UTC —
// parse the parts directly into local time instead.
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Today as a YYYY-MM-DD string in the local timezone — used to
// pre-fill date inputs. `toISOString()` converts to UTC first, which
// can roll the date to tomorrow for anyone west of UTC in the evening.
export function todayDateOnly(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
