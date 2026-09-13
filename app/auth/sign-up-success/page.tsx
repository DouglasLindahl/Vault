import Link from "next/link";
import Image from "next/image";
import { MailCheck } from "lucide-react";
import vaultLogo from "@/app/icons/vaultLogo.png";

export default function Page() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-6 dark:bg-[#0c0c0e]">
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(49,92,255,0.10),transparent_45%)] blur-2xl dark:bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.16),transparent_45%)]" />

      <div className="w-full max-w-md">
        <div className="text-center">
          <Image
            src={vaultLogo}
            alt="Vault"
            className="mx-auto mb-4 h-11 w-11 rounded-2xl object-contain"
          />

          <p className="text-sm font-semibold tracking-wide text-[#315cff] dark:text-pink-400">
            VAULT
          </p>
        </div>

        <div className="mt-6 rounded-[28px] border border-[#e5e2da] bg-white/95 p-8 text-center shadow-[0_18px_60px_rgba(23,32,51,0.08)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#315cff]/10 text-[#315cff] dark:bg-white/[0.06] dark:text-pink-400">
            <MailCheck className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
            Check your email
          </h1>

          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            You&apos;ve successfully signed up. Click the confirmation link we
            sent to your inbox to activate your account.
          </p>

          <Link
            href="/auth/auth-form?mode=login"
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#172033] text-sm font-semibold text-white dark:bg-gradient-to-r dark:from-pink-500 dark:to-fuchsia-600"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
