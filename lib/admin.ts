// Admin access is a static allowlist from an env var rather than a DB role
// — this app has one operator, and it avoids a schema change for something
// that's only ever set by editing hosting config.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}
