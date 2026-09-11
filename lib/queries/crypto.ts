import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CryptoHolding,
  CryptoConversion,
  CryptoConversionInsert,
} from "@/lib/types/database";

export async function getCryptoHoldings(
  supabase: SupabaseClient,
  institutionId: string
): Promise<CryptoHolding[]> {
  const { data, error } = await supabase
    .from("crypto_holdings")
    .select("*")
    .eq("institution_id", institutionId)
    .order("asset_symbol", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getCryptoConversions(
  supabase: SupabaseClient,
  institutionId: string
): Promise<CryptoConversion[]> {
  const { data, error } = await supabase
    .from("crypto_conversions")
    .select("*")
    .eq("institution_id", institutionId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
}

// Logs a cash → crypto conversion and adds the resulting quantity
// onto the existing holding for that asset (or creates one).
// Does not touch the institution's cash balance — call
// createTransaction separately for the "out" side of the cash
// account if you want it reflected in the transactions ledger.
export async function recordCryptoConversion(
  supabase: SupabaseClient,
  input: CryptoConversionInsert
): Promise<CryptoConversion> {
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
      .update({ quantity: existing.quantity + input.asset_quantity })
      .eq("id", existing.id);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase.from("crypto_holdings").insert({
      user_id: input.user_id,
      institution_id: input.institution_id,
      asset_symbol: input.asset_symbol,
      quantity: input.asset_quantity,
    });
    if (insertError) throw insertError;
  }

  return conversion;
}
