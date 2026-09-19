import Link from "next/link";
import Image from "next/image";
import { Landmark, Repeat, PiggyBank, TrendingUp, ArrowRight } from "lucide-react";
import vaultLogo from "@/app/icons/vaultLogo.png";

const features = [
  {
    icon: Landmark,
    title: "Every account, one place",
    description:
      "Banks, crypto, and everything in between — see all your institutions side by side instead of switching between apps.",
  },
  {
    icon: Repeat,
    title: "Recurring, handled",
    description:
      "Set up what moves on a schedule once — salary, rent, subscriptions — and let it stay accurate automatically.",
  },
  {
    icon: PiggyBank,
    title: "Spending by tag",
    description:
      "See exactly where your money goes each week, month, or year — groceries, bills, whatever matters to you.",
  },
  {
    icon: TrendingUp,
    title: "Net worth, always current",
    description:
      "Cash and investments combined into one number, updated the moment you log something new.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(49,92,255,0.10),transparent_45%)] blur-2xl dark:bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.16),transparent_45%)]" />

      {/* Nav */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <Image
            src={vaultLogo}
            alt="Vault"
            className="h-9 w-9 rounded-2xl object-contain"
          />
          <span className="text-base font-bold tracking-tight text-foreground dark:text-white">
            Vault
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/auth-form?mode=login"
            className="text-sm font-medium text-zinc-500 hover:text-foreground dark:hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/auth/auth-form?mode=register"
            className="flex h-10 items-center rounded-2xl bg-primary-surface px-4 text-sm font-semibold text-white"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 pb-20 pt-16 text-center sm:pt-24">
        <p className="text-sm font-semibold tracking-wide text-accent dark:text-pink-400">
          VAULT
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl dark:text-white">
          Your money, clearer.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-zinc-500 dark:text-zinc-400">
          Track every account, every recurring bill, and every dollar spent —
          all in one place, built for how your money actually moves.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/auth/auth-form?mode=register"
            className="group flex h-12 items-center rounded-2xl bg-primary-surface px-6 text-sm font-semibold text-white"
          >
            Create your account
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/auth/auth-form?mode=login"
            className="flex h-12 items-center rounded-2xl border border-border px-6 text-sm font-semibold text-foreground dark:text-white"
          >
            Log in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-[28px] border border-border bg-card/95 p-6 shadow-[0_18px_60px_rgba(23,32,51,0.06)] backdrop-blur"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground dark:text-white">
                {title}
              </h3>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-6 pb-10">
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-zinc-500 sm:flex-row dark:text-zinc-400">
          <p>Vault</p>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/auth-form?mode=login"
              className="hover:text-foreground dark:hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/auth/auth-form?mode=register"
              className="hover:text-foreground dark:hover:text-white"
            >
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
