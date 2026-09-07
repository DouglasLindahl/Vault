"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function DateOfBirthPicker({ value, onChange }: Props) {
  const [year = "", month = "", day = ""] = value?.split("-") ?? [];

  const currentYear = new Date().getFullYear();

  const years = Array.from(
    { length: 100 },
    (_, index) => currentYear - 13 - index,
  );

  function update(nextYear: string, nextMonth: string, nextDay: string) {
    if (!nextYear || !nextMonth || !nextDay) return;

    onChange(
      `${nextYear}-${nextMonth.padStart(2, "0")}-${nextDay.padStart(2, "0")}`,
    );
  }

  const daysInMonth =
    year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;

  return (
    <div className="grid grid-cols-[1.4fr_.8fr_1fr] gap-3">
      <Select
        value={month ? String(Number(month)) : ""}
        onValueChange={(nextMonth) => update(year, nextMonth, day || "1")}
      >
        <SelectTrigger className="h-12 rounded-2xl">
          <SelectValue placeholder="Month" />
        </SelectTrigger>

        <SelectContent>
          {MONTHS.map((name, index) => (
            <SelectItem key={name} value={String(index + 1)}>
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={day ? String(Number(day)) : ""}
        onValueChange={(nextDay) => update(year, month, nextDay)}
      >
        <SelectTrigger className="h-12 rounded-2xl">
          <SelectValue placeholder="Day" />
        </SelectTrigger>

        <SelectContent>
          {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(
            (number) => (
              <SelectItem key={number} value={String(number)}>
                {number}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>

      <Select
        value={year}
        onValueChange={(nextYear) => update(nextYear, month || "1", day || "1")}
      >
        <SelectTrigger className="h-12 rounded-2xl">
          <SelectValue placeholder="Year" />
        </SelectTrigger>

        <SelectContent>
          {years.map((number) => (
            <SelectItem key={number} value={String(number)}>
              {number}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
