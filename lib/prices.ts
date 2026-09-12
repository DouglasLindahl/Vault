// Live crypto prices via CoinGecko's free, keyless API. Never
// throws — a failed lookup (network error, rate limit) just means
// the UI shows no live value for that holding instead of crashing.
export async function getCryptoPrices(
  ids: string[],
): Promise<Record<string, number>> {
  if (ids.length === 0) return {};

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids
        .map(encodeURIComponent)
        .join(",")}&vs_currencies=usd`,
      { next: { revalidate: 60 } },
    );

    if (!res.ok) return {};

    const data: Record<string, { usd?: number }> = await res.json();
    const prices: Record<string, number> = {};
    for (const [id, value] of Object.entries(data)) {
      if (typeof value.usd === "number") prices[id] = value.usd;
    }
    return prices;
  } catch {
    return {};
  }
}
