"use client";

import { ReactNode } from "react";
import { Sparkles } from "lucide-react";

import { OnboardingProgress } from "./onboarding-progress";

type Props = {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
};

export function OnboardingLayout({
  step,
  title,
  description,
  children,
}: Props) {
  return (
    <div className="py-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#172033] text-white dark:bg-gradient-to-br dark:from-pink-500 dark:to-fuchsia-600">
          <Sparkles className="h-5 w-5" />
        </div>

        <p className="text-sm font-semibold tracking-[0.18em] text-[#315cff] dark:text-pink-400">
          VAULT
        </p>
      </div>

      <OnboardingProgress step={step} totalSteps={7} />

      <div className="mt-8 rounded-[32px] border border-[#e3dfd5] bg-white p-6 shadow-[0_24px_80px_rgba(23,32,51,0.08)] dark:border-white/[0.07] dark:bg-[#141416] sm:p-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-[#315cff] dark:text-pink-400">
            Step {step} of 7
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-[#172033] dark:text-white">
            {title}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
