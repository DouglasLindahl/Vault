import { legal } from "@/config/legal";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Vault",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-12 bg-background">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-foreground dark:hover:text-white"
      >
        ← Back
      </Link>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground dark:text-white">
        Privacy Policy
      </h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Last updated: {legal.privacy.lastUpdated}
      </p>

      <div className="mt-8 flex flex-col gap-6 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground dark:text-white">
            1. What we collect
          </h2>
          <p>
            To provide Vault, we store the account details you give us (email, and
            any profile info you add like your name, phone number, or photo) and
            the financial information you choose to enter — institutions,
            transactions, recurring transactions, tags, and balances.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground dark:text-white">
            2. How your data is protected
          </h2>
          <p>
            Sensitive fields — transaction and recurring transaction names and
            amounts, and institution names and balances — are encrypted at rest
            with a key only the server has access to. Access to your data is
            further restricted so that only you (and, for account-management
            actions, an authorized administrator) can read or modify it.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground dark:text-white">
            3. How your data is used
          </h2>
          <p>
            Your data is used solely to provide the Vault app to you — displaying
            your transactions, computing balances and stats, and sending you
            notifications about things like recurring transactions that need your
            attention. We do not sell your data or share it with third parties
            for advertising.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground dark:text-white">
            4. Third-party services
          </h2>
          <p>
            Vault uses Supabase for authentication and data storage, and may use
            CoinGecko to look up cryptocurrency prices for investment holdings you
            add. These services only receive the minimum data needed to perform
            their function.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground dark:text-white">
            5. Your choices
          </h2>
          <p>
            You can update or delete your profile information at any time from
            Settings. Deleting your account permanently removes your profile and
            associated data — this cannot be undone.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-foreground dark:text-white">
            6. Changes
          </h2>
          <p>
            This policy may be updated from time to time. Continued use of Vault
            after a change means you accept the updated policy.
          </p>
        </section>
      </div>
    </div>
  );
}
