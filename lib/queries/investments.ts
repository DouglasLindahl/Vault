import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AssetType,
  InvestmentHolding,
  InvestmentConversion,
  InvestmentConversionInsert,
} from "@/lib/types/database";
import { getCryptoPrices } from "@/lib/prices";

export async function getHoldings(
  supabase: SupabaseClient,
  institutionId?: string
): Promise<InvestmentHolding[]> {
  let query = supabase
    .from("crypto_holdings")
    .select("*")
    .order("asset_symbol", { ascending: true });
  if (institutionId) query = query.eq("institution_id", institutionId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getConversions(
  supabase: SupabaseClient,
  institutionId?: string
): Promise<InvestmentConversion[]> {
  let query = supabase
    .from("crypto_conversions")
    .select("*")
    .order("date", { ascending: false });
  if (institutionId) query = query.eq("institution_id", institutionId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Removes a single purchase/conversion event and unwinds the quantity
// it had added onto the aggregate crypto_holdings row for that asset
// (deleting the holding row entirely if nothing is left of it).
export async function deleteConversion(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { data: conversion, error: fetchError } = await supabase
    .from("crypto_conversions")
    .select("institution_id, asset_symbol, asset_quantity")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  const { error: deleteError } = await supabase
    .from("crypto_conversions")
    .delete()
    .eq("id", id);
  if (deleteError) throw deleteError;

  const { data: holding, error: holdingError } = await supabase
    .from("crypto_holdings")
    .select("id, quantity")
    .eq("institution_id", conversion.institution_id)
    .eq("asset_symbol", conversion.asset_symbol)
    .maybeSingle();
  if (holdingError) throw holdingError;
  if (!holding) return;

  const remaining = holding.quantity - conversion.asset_quantity;
  if (remaining <= 0) {
    const { error } = await supabase
      .from("crypto_holdings")
      .delete()
      .eq("id", holding.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("crypto_holdings")
      .update({ quantity: remaining })
      .eq("id", holding.id);
    if (error) throw error;
  }
}

export type InvestmentPosition = {
  id: string; // conversion id — each purchase/deposit is its own row
  symbol: string;
  assetType: AssetType;
  quantity: number;
  invested: number;
  // null when there's no live price to value it with (e.g. stocks) —
  // callers should fall back to `invested` for totals. Cash is always
  // priced 1:1.
  value: number | null;
  date: string;
};

export type InvestmentSummary = {
  positions: InvestmentPosition[];
  totalInvested: number;
  totalValue: number;
};

// Builds the full picture for an investment account (or, with no
// institutionId, across all of them): every individual purchase/deposit
// as its own position, priced live where possible. Cash sitting
// uninvested is tracked the same way as a crypto/stock buy — just an
// asset_symbol of "USD" priced 1:1 — so it counts toward the total the
// same as an actual holding.
export async function getInvestmentSummary(
  supabase: SupabaseClient,
  institutionId?: string
): Promise<InvestmentSummary> {
  const [holdings, conversions] = await Promise.all([
    getHoldings(supabase, institutionId),
    getConversions(supabase, institutionId),
  ]);

  const metaBySymbol = new Map(
    holdings.map((h) => [
      h.asset_symbol,
      { assetType: h.asset_type, coingeckoId: h.coingecko_id },
    ])
  );

  const coingeckoIds = holdings
    .map((h) => h.coingecko_id)
    .filter((id): id is string => Boolean(id));
  const prices = await getCryptoPrices(coingeckoIds);

  const positions: InvestmentPosition[] = conversions.map((c) => {
    const meta = metaBySymbol.get(c.asset_symbol);
    const assetType = meta?.assetType ?? "crypto";

    let value: number | null;
    if (assetType === "cash") {
      value = c.asset_quantity;
    } else if (assetType === "crypto" && meta?.coingeckoId && prices[meta.coingeckoId] != null) {
      value = c.asset_quantity * prices[meta.coingeckoId];
    } else {
      value = null;
    }

    return {
      id: c.id,
      symbol: c.asset_symbol,
      assetType,
      quantity: c.asset_quantity,
      invested: c.usd_amount,
      value,
      date: c.date,
    };
  });

  return {
    positions,
    totalInvested: positions.reduce((s, p) => s + p.invested, 0),
    totalValue: positions.reduce((s, p) => s + (p.value ?? p.invested), 0),
  };
}

// Logs a cash → asset conversion (buying a stock or crypto position)
// and adds the resulting quantity onto the existing holding for that
// asset (or creates one). Does not touch the institution's cash
// balance — call createTransaction separately for the "out" side of
// the cash account if you want it reflected in the transactions ledger.
export async function recordConversion(
  supabase: SupabaseClient,
  input: InvestmentConversionInsert,
  holding: { assetType: AssetType; coingeckoId?: string | null }
): Promise<InvestmentConversion> {
  const { data: conversion, error: conversionError } = await supabase
    .from("crypto_conversions")
    .insert(input)
    .select()
    .single();

  if (conversionError) throw conversionError;

  const { data: existing, error: fetchError } = await supabase
    .from("crypto_holdings")
    .select("id, quantity")
    .eq("institution_id", input.institution_id)
    .eq("asset_symbol", input.asset_symbol)
    .maybeSingle();

  if (fetchError) throw fetchError;

  if (existing) {
    const { error: updateError } = await supabase
      .from("crypto_holdings")
      .update({
        quantity: existing.quantity + input.asset_quantity,
        asset_type: holding.assetType,
        ...(holding.coingeckoId ? { coingecko_id: holding.coingeckoId } : {}),
      })
      .eq("id", existing.id);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase.from("crypto_holdings").insert({
      user_id: input.user_id,
      institution_id: input.institution_id,
      asset_symbol: input.asset_symbol,
      asset_type: holding.assetType,
      coingecko_id: holding.coingeckoId ?? null,
      quantity: input.asset_quantity,
    });
    if (insertError) throw insertError;
  }

  return conversion;
}
