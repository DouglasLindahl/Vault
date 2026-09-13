import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions — Vault",
};

export default function TermsPage() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-12 bg-white dark:bg-[#0c0c0e]">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-[#172033] dark:hover:text-white"
      >
        ← Back
      </Link>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
        Terms and Conditions
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Last updated: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
      </p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        <section>
          <h2 className="mb-2 text-base font-semibold text-[#172033] dark:text-white">
            1. Acceptance of terms
          </h2>
          <p>
            By creating an account and using Vault, you agree to these Terms
            and Conditions. If you do not agree, please do not use the
            service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-[#172033] dark:text-white">
            2. Your data
          </h2>
          <p>
            Vault stores the financial information you choose to enter —
            institutions, transactions, categories, and balances — so it can
            be shown back to you. You are responsible for the accuracy of the
            data you provide.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-[#172033] dark:text-white">
            3. Account responsibility
          </h2>
          <p>
            You are responsible for keeping your login credentials secure and
            for all activity that happens under your account.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-[#172033] dark:text-white">
            4. No financial advice
          </h2>
          <p>
            Vault is a personal tracking tool. Nothing shown in the app is
            financial, investment, or tax advice.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-[#172033] dark:text-white">
            5. Changes
          </h2>
          <p>
            These terms may be updated from time to time. Continued use of
            Vault after a change means you accept the updated terms.
          </p>
        </section>
      </div>
    </div>
  );
}
