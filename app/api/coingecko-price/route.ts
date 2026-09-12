import { NextRequest, NextResponse } from "next/server";

// Historical USD price for a coin on a given date — used to auto-fill
// the invested amount from quantity instead of asking the user to
// compute it themselves.
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.trim();
  const date = request.nextUrl.searchParams.get("date")?.trim(); // YYYY-MM-DD

  if (!id || !date) {
    return NextResponse.json(
      { error: "Missing id or date parameter" },
      { status: 400 },
    );
  }

  const [year, month, day] = date.split("-");
  if (!year || !month || !day) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  const coingeckoDate = `${day}-${month}-${year}`;

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}/history?date=${coingeckoDate}&localization=false`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "CoinGecko history lookup failed" },
      { status: 502 },
    );
  }

  const data = await res.json();
  const price = data?.market_data?.current_price?.usd;

  if (typeof price !== "number") {
    return NextResponse.json(
      { error: "No price found for that date" },
      { status: 404 },
    );
  }

  return NextResponse.json({ usd: price });
}
