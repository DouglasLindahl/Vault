import type { FxRates } from "@/lib/currency";

// Daily ECB reference rates via Frankfurter (free, keyless), cached for an
// hour. Never throws: on failure it returns just { USD: 1 }, and convert()
// then leaves other currencies unconverted instead of breaking the page.
export async function getFxRates(): Promise<FxRates> {
  try {
    const res = await fetch("https://api.frankfurter.dev/v1/latest?base=USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { USD: 1 };
    const data: { rates?: Record<string, number> } = await res.json();
    return { ...(data.rates ?? {}), USD: 1 };
  } catch {
    return { USD: 1 };
  }
}
