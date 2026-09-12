import type { Frequency } from "@/lib/types/database";

const INTERVAL_DAYS: Partial<Record<Frequency, number>> = {
  daily: 1,
  weekly: 7,
  biweekly: 14,
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

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

// Computes the next occurrence on/after `from` for a recurring
// transaction anchored at `startDate`. Monthly/yearly clamp to the
// last day of the target month instead of relying on JS Date's
// month-rollover behavior (e.g. Jan 31 + 1 month must land on Feb
// 28/29, not Mar 3).
export function nextOccurrence(
  startDate: string,
  frequency: Frequency,
  from: Date = new Date(),
): Date {
  const start = startOfDay(parseDate(startDate));
  const today = startOfDay(from);

  if (start >= today) return start;

  const intervalDays = INTERVAL_DAYS[frequency];
  if (intervalDays) {
    const elapsedDays = Math.floor(
      (today.getTime() - start.getTime()) / 86_400_000,
    );
    const intervalsPassed = Math.floor(elapsedDays / intervalDays);
    let next = addDays(start, intervalsPassed * intervalDays);
    while (next < today) next = addDays(next, intervalDays);
    return next;
  }

  const anchorDay = start.getDate();

  if (frequency === "monthly") {
    let year = today.getFullYear();
    let month = today.getMonth();
    for (let i = 0; i < 13; i++) {
      const candidate = new Date(year, month, Math.min(anchorDay, daysInMonth(year, month)));
      if (candidate >= today) return candidate;
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
    }
    return start;
  }

  // yearly
  let year = today.getFullYear();
  for (let i = 0; i < 2; i++) {
    const candidate = new Date(
      year,
      start.getMonth(),
      Math.min(anchorDay, daysInMonth(year, start.getMonth())),
    );
    if (candidate >= today) return candidate;
    year += 1;
  }
  return start;
}
