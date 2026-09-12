import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing q parameter" }, { status: 400 });
  }

  const res = await fetch(
    `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
    { cache: "no-store" },
  );

  if (!res.ok) {
    return NextResponse.json(
      { error: "CoinGecko search failed" },
      { status: 502 },
    );
  }

  const data = await res.json();
  const coin = data.coins?.[0];

  if (!coin) {
    return NextResponse.json({ error: "No match found" }, { status: 404 });
  }

  return NextResponse.json({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
  });
}
