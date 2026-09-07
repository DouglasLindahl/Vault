import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default function Page() {
  return (
    <main className="min-h-svh bg-[#f7f5ef] px-4 py-8 dark:bg-[#09090b] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <OnboardingForm />
      </div>
    </main>
  );
}
