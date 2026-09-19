// Enumerates recurring-transaction occurrences for the due-check that runs
// on every authenticated page load (see lib/due-check.ts). Built on the
// same date math as lib/recurrence.ts's nextOccurrence.

import type { Frequency } from "@/lib/types/database";
import { nextOccurrence } from "@/lib/recurrence";

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Every occurrence from `startDate` up to (and including) `upTo`, capped at
// `maxCount` so a very old/neglected recurring transaction can't produce an
// unbounded catch-up list the first time the app is opened again.
export function getOccurrencesUpTo(
  startDate: string,
  frequency: Frequency,
  upTo: Date = new Date(),
  maxCount = 90,
): Date[] {
  const limit = startOfDay(upTo);
  const occurrences: Date[] = [];

  let cursor = parseDate(startDate);
  for (let i = 0; i < maxCount; i++) {
    const occurrence = nextOccurrence(startDate, frequency, cursor);
    if (occurrence > limit) break;
    occurrences.push(occurrence);
    cursor = addDays(occurrence, 1);
  }

  return occurrences;
}
