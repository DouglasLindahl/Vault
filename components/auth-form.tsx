"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { ArrowRight, LockKeyhole, Mail, Sparkles } from "lucide-react";

type AuthMode = "login" | "register";

export function AuthForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);
    setIsLoading(true);

    const supabase = createClient();

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        router.push("/protected/dashboard");
        router.refresh();
        return;
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        router.push("/protected/onboarding");
      } else {
        router.push("/auth/sign-up-success");
      }

      router.refresh();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("relative flex flex-col gap-6", className)} {...props}>
      {/* glow */}
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(49,92,255,0.10),transparent_45%)] blur-2xl dark:bg-[radial-gradient(circle_at_top,rgba(236,72,153,0.16),transparent_45%)]" />

      {/* BRAND */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#172033] text-white dark:bg-gradient-to-br dark:from-pink-500 dark:to-fuchsia-600">
          <Sparkles className="h-5 w-5" />
        </div>

        <p className="text-sm font-semibold tracking-wide text-[#315cff] dark:text-pink-400">
          VAULT
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#172033] dark:text-white">
          Your money, clearer.
        </h1>

        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Track your money, stay on budget, and build better habits.
        </p>
      </div>

      {/* SWITCH */}
      <div className="grid grid-cols-2 rounded-2xl border border-zinc-200 bg-zinc-100 p-1 dark:border-white/10 dark:bg-white/[0.04]">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={cn(
            "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
            mode === "login"
              ? "bg-[#315cff] text-white shadow-sm dark:bg-gradient-to-r dark:from-pink-500 dark:to-fuchsia-600"
              : "text-zinc-500 hover:text-[#172033] dark:hover:text-white",
          )}
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => switchMode("register")}
          className={cn(
            "rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
            mode === "register"
              ? "bg-[#315cff] text-white shadow-sm dark:bg-gradient-to-r dark:from-pink-500 dark:to-fuchsia-600"
              : "text-zinc-500 hover:text-[#172033] dark:hover:text-white",
          )}
        >
          Register
        </button>
      </div>

      {/* FORM */}
      <Card className="overflow-hidden rounded-[28px] border-[#e5e2da] bg-white/95 shadow-[0_18px_60px_rgba(23,32,51,0.08)] backdrop-blur dark:border-white/[0.07] dark:bg-[#141416]/95">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl text-[#172033] dark:text-white">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </CardTitle>

          <CardDescription>
            {mode === "login"
              ? "Enter your details to continue to Vault."
              : "Start with the basics. We'll set up the rest after."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5">
              {/* EMAIL */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 rounded-2xl pl-10"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>

                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-2xl pl-10"
                  />
                </div>
              </div>

              {/* REGISTER ONLY */}
              {mode === "register" && (
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>

                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />

                    <Input
                      id="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 rounded-2xl pl-10"
                    />
                  </div>

                  <p className="text-xs text-zinc-400">
                    Use at least 8 characters.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-2xl bg-red-500/[0.07] px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="group h-12 w-full rounded-2xl bg-[#172033] text-white dark:bg-gradient-to-r dark:from-pink-500 dark:to-fuchsia-600"
              >
                {isLoading
                  ? mode === "login"
                    ? "Logging in..."
                    : "Creating account..."
                  : mode === "login"
                    ? "Login"
                    : "Create account"}

                {!isLoading && (
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                )}
              </Button>
            </div>

            {mode === "login" && (
              <div className="mt-5 text-center">
                <a
                  href="/auth/forgot-password"
                  className="text-sm text-zinc-500 underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
