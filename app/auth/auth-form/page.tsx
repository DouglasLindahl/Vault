import { AuthForm } from "@/components/auth-form";

export default async function AuthFormPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const initialMode = mode === "register" ? "register" : "login";

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-white p-6 dark:bg-[#0c0c0e]">
      <div className="w-full max-w-md">
        <AuthForm initialMode={initialMode} />
      </div>
    </div>
  );
}
