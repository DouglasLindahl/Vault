// One-off maintenance script for Phase 7 (field-level encryption). Encrypts
// every existing row's name/amount/balance columns in place after the
// column-type migration in supabase/sql/phase7_encryption.sql has run.
// Read that file's comment for the required order of operations.
//
// Usage: npx tsx scripts/encrypt-existing-data.ts --yes-encrypt-once
//
// Do NOT run this more than once — running it twice re-encrypts already
// -encrypted values, which the app can no longer decrypt.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { encrypt } from "../lib/encryption";

// This script runs outside Next.js, which is normally what loads
// .env.local automatically — load it ourselves.
function loadEnvLocal() {
  let content: string;
  try {
    content = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  } catch {
    return;
  }
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = (match[2] ?? "").trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

async function encryptTable(admin: SupabaseClient, table: string, columns: string[]) {
  const { data, error } = await admin.from(table).select(["id", ...columns].join(","));
  if (error) throw error;
  if (!data) return;

  for (const row of data as unknown as Record<string, string | number | null>[]) {
    const update: Record<string, string | null> = {};
    for (const column of columns) {
      const raw = row[column];
      update[column] = raw === null || raw === undefined ? null : encrypt(String(raw));
    }
    const { error: updateError } = await admin.from(table).update(update).eq("id", row.id);
    if (updateError) throw updateError;
  }

  console.log(`${table}: encrypted ${data.length} row(s).`);
}

async function main() {
  if (!process.argv.includes("--yes-encrypt-once")) {
    console.error(
      "Refusing to run without --yes-encrypt-once. Read this script's header comment first — running it twice will corrupt already-encrypted data.",
    );
    process.exit(1);
  }

  loadEnvLocal();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
    process.exit(1);
  }
  if (!process.env.ENCRYPTION_KEY) {
    console.error("Missing ENCRYPTION_KEY in .env.local.");
    process.exit(1);
  }

  const admin: SupabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  await encryptTable(admin, "transactions", ["name", "amount"]);
  await encryptTable(admin, "recurring_transactions", ["name", "amount"]);
  await encryptTable(admin, "institutions", ["name", "starting_balance", "current_balance"]);

  console.log(
    "Done. Spot-check a few rows in the Supabase table editor to confirm they're no longer human-readable, then deploy the new app code.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
