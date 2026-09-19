import { AuthForm } from "@/components/auth-form";

export default async function AuthFormPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const initialMode = mode === "register" ? "register" : "login";

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-background p-6">
      <div className="w-full max-w-md">
        <AuthForm initialMode={initialMode} />
      </div>
    </div>
  );
}
