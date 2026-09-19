import Image from "next/image";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import vaultLogo from "@/app/icons/vaultLogo.png";

export default function Page() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(49,92,255,0.10),transparent_45%)] blur-2xl dark:bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.16),transparent_45%)]" />

      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Image
            src={vaultLogo}
            alt="Vault"
            className="mx-auto mb-4 h-11 w-11 rounded-2xl object-contain"
          />
          <p className="text-sm font-semibold tracking-wide text-accent dark:text-pink-400">
            VAULT
          </p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
