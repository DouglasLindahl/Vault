import type { CookieOptions } from "@supabase/ssr";

// Set by the login form. "0" means the user unticked "Remember me", so
// the Supabase auth cookies are written as session cookies (cleared when
// the browser closes). Missing/"1" keeps Supabase's long-lived default,
// which is what logs the user back in automatically.
export const REMEMBER_COOKIE = "vault-remember";

// Supabase always sets a ~400-day maxAge on its auth cookies, so dropping
// it is the only way to make them session cookies. Deletions (maxAge 0)
// are left alone.
export function withRememberPreference(
  options: CookieOptions,
  remember: boolean,
): CookieOptions {
  if (remember || options.maxAge === 0) return options;
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}
