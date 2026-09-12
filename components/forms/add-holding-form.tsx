"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { recordConversion } from "@/lib/queries/investments";
import type { AssetType } from "@/lib/types/database";
import { todayDateOnly } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function currency(n: number) {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function lookupCoingeckoId(symbol: string): Promise<string> {
  const res = await fetch(`/api/coingecko-search?q=${encodeURIComponent(symbol)}`);
  if (!res.ok) {
    throw new Error(
      `Couldn't find "${symbol}" on CoinGecko. Try a different symbol or name.`,
    );
  }
  const match = await res.json();
  return match.id;
}

async function lookupPriceOnDate(coingeckoId: string, date: string): Promise<number> {
  const res = await fetch(
    `/api/coingecko-price?id=${encodeURIComponent(coingeckoId)}&date=${date}`,
  );
  if (!res.ok) {
    throw new Error("Couldn't find a price for that date. Try a different date.");
  }
  const data = await res.json();
  return data.usd;
}

type PriceQuote = { symbol: string; date: string; coingeckoId: string; usd: number };

export function AddHoldingForm({
  institutionId,
  onSuccess,
}: {
  institutionId: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();

  const [assetType, setAssetType] = useState<AssetType>("crypto");
  const isCash = assetType === "cash";
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [amount, setAmount] = useState(""); // stocks only — no live price source
  const [date, setDate] = useState(todayDateOnly());
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [priceQuote, setPriceQuote] = useState<PriceQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);

  const quantityNum = Number(quantity);
  const hasFreshQuote =
    priceQuote &&
    priceQuote.symbol === symbol.trim().toUpperCase() &&
    priceQuote.date === date;
  const estimatedValue =
    hasFreshQuote && quantityNum > 0 ? priceQuote.usd * quantityNum : null;

  async function refreshQuote() {
    if (assetType !== "crypto" || !symbol.trim() || !date) return;
    setIsQuoting(true);
    setError(null);
    try {
      const coingeckoId = await lookupCoingeckoId(symbol.trim());
      const usd = await lookupPriceOnDate(coingeckoId, date);
      setPriceQuote({ symbol: symbol.trim().toUpperCase(), date, coingeckoId, usd });
    } catch (err) {
      setPriceQuote(null);
      setError(err instanceof Error ? err.message : "Couldn't price that asset.");
    } finally {
      setIsQuoting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!isCash && !symbol.trim()) return setError("Enter a symbol.");
    if (!quantity || quantityNum <= 0)
      return setError(
        isCash ? "Enter an amount greater than zero." : "Enter a quantity greater than zero.",
      );
    if (assetType === "stock" && (!amount || Number(amount) <= 0))
      return setError("Enter an amount invested greater than zero.");

    setIsLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You need to be logged in.");

      let coingeckoId: string | null = null;
      let usdAmount: number;

      if (isCash) {
        usdAmount = quantityNum;
      } else if (assetType === "crypto") {
        let quote = hasFreshQuote ? priceQuote : null;
        if (!quote) {
          const id = await lookupCoingeckoId(symbol.trim());
          const usd = await lookupPriceOnDate(id, date);
          quote = { symbol: symbol.trim().toUpperCase(), date, coingeckoId: id, usd };
        }
        coingeckoId = quote.coingeckoId;
        usdAmount = quote.usd * quantityNum;
      } else {
        usdAmount = Number(amount);
      }

      await recordConversion(
        supabase,
        {
          user_id: user.id,
          institution_id: institutionId,
          asset_symbol: isCash ? "USD" : symbol.trim().toUpperCase(),
          asset_quantity: quantityNum,
          usd_amount: usdAmount,
          date,
        },
        { assetType, coingeckoId },
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div
        className={
          isCash
            ? "grid grid-cols-1 gap-4"
            : "grid grid-cols-1 gap-4 sm:grid-cols-2"
        }
      >
        <div className="grid gap-2">
          <Label>Type</Label>
          <Select
            value={assetType}
            onValueChange={(v) => {
              setAssetType(v as AssetType);
              setPriceQuote(null);
            }}
          >
            <SelectTrigger className="h-11 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="crypto">Crypto</SelectItem>
              <SelectItem value="stock">Stock</SelectItem>
              <SelectItem value="cash">Cash (USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!isCash && (
          <div className="grid gap-2">
            <Label htmlFor="holding-symbol">Symbol</Label>
            <Input
              id="holding-symbol"
              placeholder={assetType === "crypto" ? "SOL" : "NVDA"}
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onBlur={refreshQuote}
              className="h-11 rounded-2xl"
            />
          </div>
        )}
      </div>

      <div
        className={
          assetType === "stock"
            ? "grid grid-cols-1 gap-4 sm:grid-cols-3"
            : "grid grid-cols-1 gap-4 sm:grid-cols-2"
        }
      >
        <div className="grid gap-2">
          <Label htmlFor="holding-quantity">{isCash ? "Amount (USD)" : "Quantity"}</Label>
          <Input
            id="holding-quantity"
            type="number"
            step={isCash ? "0.01" : "any"}
            placeholder={isCash ? "100.00" : "1.3"}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="h-11 rounded-2xl"
          />
        </div>

        {assetType === "stock" && (
          <div className="grid gap-2">
            <Label htmlFor="holding-amount">Amount invested</Label>
            <Input
              id="holding-amount"
              type="number"
              step="0.01"
              placeholder="150.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-11 rounded-2xl"
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="holding-date">Date</Label>
          <Input
            id="holding-date"
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPriceQuote(null);
            }}
            onBlur={refreshQuote}
            className="h-11 rounded-2xl"
          />
        </div>
      </div>

      {assetType === "crypto" && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {isQuoting
            ? "Looking up price..."
            : estimatedValue != null
              ? `≈ ${currency(estimatedValue)} invested, at ${currency(priceQuote!.usd)}/coin on ${date}`
              : "We'll price this using the quantity and CoinGecko's rate on the date above."}
        </p>
      )}

      {error && (
        <div className="rounded-2xl bg-red-500/[0.07] px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading}
        className="h-12 rounded-2xl bg-[#172033] text-white dark:bg-gradient-to-r dark:from-pink-500 dark:to-fuchsia-600"
      >
        {isLoading ? "Saving..." : "Save holding"}
      </Button>
    </form>
  );
}
