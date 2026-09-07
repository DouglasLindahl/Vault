"use client";

import { useUser } from "@/components/providers/user-provider";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

export default function DashboardPage() {
  const user = useUser();

  const name = user.user_preferred_name || user.user_first_name || "there";

  const currency = user.currencies?.[0]?.currency_symbol || "$";

  const budgets = [
    {
      name: "Groceries",
      spent: 248,
      budget: 400,
      status: "good",
    },
    {
      name: "Eating out",
      spent: 168,
      budget: 200,
      status: "warning",
    },
    {
      name: "Entertainment",
      spent: 53,
      budget: 150,
      status: "good",
    },
  ];

  return (
    <div className="w-full pb-16">
      {/* HEADER */}
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-sm text-zinc-500 dark:text-zinc-500">
            Sunday, September 6
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-[#172033] dark:text-white sm:text-4xl">
            Good evening, {name}.
          </h1>

          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Here&apos;s where your money stands today.
          </p>
        </div>

        <button className="group inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#172033] px-5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-gradient-to-r dark:from-pink-500 dark:to-fuchsia-600">
          <Plus className="h-4 w-4" />
          Add expense
        </button>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden rounded-[32px] border border-[#e5e2da] bg-gradient-to-br from-white via-[#faf9f5] to-[#e8edff] p-7 shadow-[0_15px_50px_rgba(23,32,51,0.08)] dark:border-white/[0.07] dark:bg-[linear-gradient(135deg,#18181b_0%,#111114_50%,#210b1b_100%)] dark:shadow-[0_20px_70px_rgba(0,0,0,0.35)] sm:p-10">
        {/* Dark mode glow */}
        <div className="pointer-events-none absolute -right-24 -top-28 hidden h-80 w-80 rounded-full bg-pink-500/20 blur-[90px] dark:block" />

        <div className="pointer-events-none absolute bottom-[-140px] right-[20%] hidden h-64 w-64 rounded-full bg-fuchsia-700/10 blur-[80px] dark:block" />

        {/* Light mode decoration */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7895ff]/10 blur-[70px] dark:hidden" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-[#315cff] dark:text-pink-400" />

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
              Available to spend
            </p>
          </div>

          <div className="mt-6">
            <p className="text-6xl font-bold tracking-[-0.06em] text-[#172033] dark:text-white sm:text-7xl lg:text-8xl">
              {currency}1,240
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-[#172033]/[0.06] px-4 py-2 text-sm font-medium text-[#172033] dark:bg-white/[0.07] dark:text-zinc-300">
              {currency}47.69 / day until Friday
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <ArrowUpRight className="h-4 w-4" />
              {currency}120 ahead of pace
            </div>
          </div>
        </div>
      </section>

      {/* SECONDARY METRICS */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {/* MONEY SCORE */}
        <section className="relative overflow-hidden rounded-[28px] border border-[#e5e2da] bg-white p-7 shadow-[0_8px_30px_rgba(23,32,51,0.05)] dark:border-white/[0.07] dark:bg-[#141416] dark:shadow-[0_15px_40px_rgba(0,0,0,0.2)]">
          <div className="absolute right-0 top-0 hidden h-32 w-32 bg-pink-500/[0.07] blur-[50px] dark:block" />

          <div className="relative flex items-start justify-between gap-5">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#315cff] dark:text-pink-400" />

                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                  Money Score
                </p>
              </div>

              <div className="mt-5 flex items-end gap-3">
                <p className="text-5xl font-bold tracking-[-0.04em] text-[#172033] dark:text-white">
                  782
                </p>

                <p className="mb-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  +24
                </p>
              </div>

              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Excellent pace this month
              </p>
            </div>

            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#eef1ff] dark:bg-pink-500/10">
              <div className="absolute inset-1 rounded-full border-[5px] border-[#315cff] border-l-transparent rotate-45 dark:border-pink-500 dark:border-l-transparent" />

              <span className="text-xs font-bold text-[#315cff] dark:text-pink-400">
                78%
              </span>
            </div>
          </div>
        </section>

        {/* SAVINGS */}
        <section className="rounded-[28px] border border-[#e5e2da] bg-white p-7 shadow-[0_8px_30px_rgba(23,32,51,0.05)] dark:border-white/[0.07] dark:bg-[#141416] dark:shadow-[0_15px_40px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#315cff] dark:text-pink-400" />

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
              Saved this month
            </p>
          </div>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-5xl font-bold tracking-[-0.04em] text-[#172033] dark:text-white">
                {currency}620
              </p>

              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {currency}180 left to reach your goal
              </p>
            </div>

            <p className="text-sm font-bold text-[#315cff] dark:text-pink-400">
              78%
            </p>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#172033]/[0.07] dark:bg-white/[0.07]">
            <div className="h-full w-[78%] rounded-full bg-[#315cff] dark:bg-gradient-to-r dark:from-pink-500 dark:to-fuchsia-500" />
          </div>
        </section>
      </div>

      {/* SPENDING */}
      <section className="mt-5 rounded-[28px] border border-[#e5e2da] bg-white shadow-[0_8px_30px_rgba(23,32,51,0.05)] dark:border-white/[0.07] dark:bg-[#141416] dark:shadow-[0_15px_40px_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between border-b border-[#ebe8e1] px-7 py-6 dark:border-white/[0.06]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
              Spending
            </p>

            <h2 className="mt-1.5 text-xl font-bold text-[#172033] dark:text-white">
              How your budgets are looking
            </h2>
          </div>

          <button className="group flex items-center gap-1 text-sm font-medium text-zinc-500 transition-colors hover:text-[#172033] dark:hover:text-white">
            All budgets
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        <div className="grid divide-y divide-[#ebe8e1] px-7 dark:divide-white/[0.06] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {budgets.map((budget, index) => {
            const percentage = Math.round((budget.spent / budget.budget) * 100);

            const remaining = budget.budget - budget.spent;

            return (
              <div
                key={budget.name}
                className={`py-7 lg:px-7 ${index === 0 ? "lg:pl-0" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[#172033] dark:text-white">
                      {budget.name}
                    </p>

                    <p className="mt-1 text-sm text-zinc-400">
                      {currency}
                      {remaining} remaining
                    </p>
                  </div>

                  <span
                    className={`text-sm font-bold ${
                      budget.status === "warning"
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#172033] dark:text-zinc-300">
                      {currency}
                      {budget.spent}
                    </span>

                    <span className="text-zinc-400">
                      {currency}
                      {budget.budget}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-[#172033]/[0.07] dark:bg-white/[0.07]">
                    <div
                      className={`h-full rounded-full ${
                        budget.status === "warning"
                          ? "bg-amber-500"
                          : "bg-[#315cff] dark:bg-pink-500"
                      }`}
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* BOTTOM ROW */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        {/* NEXT BILL */}
        <section className="rounded-[28px] border border-[#e5e2da] bg-white p-7 shadow-[0_8px_30px_rgba(23,32,51,0.05)] dark:border-white/[0.07] dark:bg-[#141416] dark:shadow-[0_15px_40px_rgba(0,0,0,0.2)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                Next up
              </p>

              <h2 className="mt-1.5 text-xl font-bold text-[#172033] dark:text-white">
                Car payment
              </h2>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef1ff] dark:bg-pink-500/10">
              <CalendarDays className="h-5 w-5 text-[#315cff] dark:text-pink-400" />
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between gap-6">
            <div>
              <p className="text-sm text-zinc-400">Due between</p>

              <p className="mt-1 font-semibold text-[#172033] dark:text-white">
                September 15–26
              </p>
            </div>

            <p className="text-3xl font-bold tracking-tight text-[#172033] dark:text-white">
              {currency}420
            </p>
          </div>

          <button className="group mt-7 flex items-center gap-1 text-sm font-semibold text-[#315cff] dark:text-pink-400">
            View bills
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </section>

        {/* INSIGHT */}
        <section className="relative overflow-hidden rounded-[28px] bg-[#172033] p-7 text-white shadow-[0_12px_40px_rgba(23,32,51,0.18)] dark:bg-[linear-gradient(135deg,#ec4899_0%,#c026d3_100%)] dark:shadow-[0_15px_45px_rgba(236,72,153,0.15)]">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-[40px]" />

          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Sparkles className="h-5 w-5" />
            </div>

            <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-white/60">
              Vault insight
            </p>

            <p className="mt-3 text-xl font-semibold leading-snug">
              You&apos;re spending 12% less than you were at this point last
              month.
            </p>

            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Keep this pace and you could finish September around {currency}120
              ahead.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
