// Currency formatting and conversion. Client-safe.
//
// Every institution has a currency; its balance, transactions and recurring
// amounts are in it. Anything summed across institutions is converted to the
// user's display currency (profiles.currency) first, using FxRates from
// lib/fx.ts.

// Currencies the exchange-rate source (ECB via Frankfurter) publishes rates for.
export const CURRENCIES = [
  "USD", "EUR", "GBP", "SEK", "NOK", "DKK", "ISK", "CHF", "PLN", "CZK", "HUF",
  "RON", "TRY", "CAD", "MXN", "BRL", "AUD", "NZD", "JPY", "CNY", "HKD", "KRW",
  "SGD", "INR", "IDR", "MYR", "PHP", "THB", "ILS", "ZAR",
] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export function isCurrency(value: unknown): value is CurrencyCode {
  return typeof value === "string" && (CURRENCIES as readonly string[]).includes(value);
}

export function toCurrency(value: unknown): CurrencyCode {
  return isCurrency(value) ? value : DEFAULT_CURRENCY;
}

// Units of each currency per 1 USD (USD itself = 1).
export type FxRates = Record<string, number>;

// Converts between two currencies via USD. If a rate is missing (rates
// couldn't be fetched) the amount is returned unconverted rather than
// throwing — callers that care can check `hasRate`.
export function convert(amount: number, from: string, to: string, rates: FxRates): number {
  if (from === to) return amount;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return amount;
  return (amount / fromRate) * toRate;
}

export function hasRate(currency: string, rates: FxRates) {
  return currency === "USD" || Boolean(rates[currency]);
}

const formatters = new Map<string, Intl.NumberFormat>();

// "$1,234.56", "1 234,56 kr" etc. — locale-aware symbol and placement.
// `decimals: 0` for compact chart axes.
export function formatMoney(
  amount: number,
  currency: string,
  options: { decimals?: 0 | 2 } = {},
): string {
  const decimals = options.decimals ?? 2;
  const key = `${currency}:${decimals}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatters.set(key, formatter);
  }
  return formatter.format(amount);
}
