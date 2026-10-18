import { createBrowserClient, type CookieOptions } from "@supabase/ssr";
import { REMEMBER_COOKIE, withRememberPreference } from "./remember";

// A malformed %-sequence in any cookie (even one set by something else on
// this domain) must not break auth, so decoding falls back to the raw text.
function safeDecode(text: string) {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function readCookies() {
  if (!document.cookie) return [];
  return document.cookie.split("; ").map((pair) => {
    const i = pair.indexOf("=");
    return {
      name: safeDecode(pair.slice(0, i)),
      value: safeDecode(pair.slice(i + 1)),
    };
  });
}

function serializeCookie(name: string, value: string, options: CookieOptions) {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  if (options.maxAge !== undefined) cookie += `; Max-Age=${Math.floor(options.maxAge)}`;
  if (options.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
  if (options.domain) cookie += `; Domain=${options.domain}`;
  cookie += `; Path=${options.path ?? "/"}`;
  if (options.sameSite) {
    const sameSite = options.sameSite === true ? "strict" : options.sameSite;
    cookie += `; SameSite=${sameSite}`;
  }
  if (options.secure) cookie += "; Secure";
  return cookie;
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: readCookies,
        setAll(cookiesToSet) {
          const remember =
            readCookies().find((c) => c.name === REMEMBER_COOKIE)?.value !== "0";
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = serializeCookie(
              name,
              value,
              withRememberPreference(options, remember),
            );
          });
        },
      },
    },
  );
}

// Called by the login form before signing in, so the session cookies
// Supabase writes during sign-in already follow the user's choice.
export function setRememberMe(remember: boolean) {
  document.cookie = serializeCookie(REMEMBER_COOKIE, remember ? "1" : "0", {
    path: "/",
    sameSite: "lax",
    maxAge: 400 * 24 * 60 * 60,
  });
}
