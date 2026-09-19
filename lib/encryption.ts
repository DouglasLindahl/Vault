import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// App-level field encryption (AES-256-GCM) for the sensitive scalar
// columns listed in supabase/sql/phase7_encryption.sql — transaction/
// recurring-transaction names & amounts, institution names & balances.
// Server-only: ENCRYPTION_KEY must never reach the browser.
//
// Losing ENCRYPTION_KEY makes every encrypted row unrecoverable — there is
// no recovery path, so back it up outside of .env.local.

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY is not set. Generate one with `openssl rand -base64 32` and add it to .env.local.",
    );
  }
  const buffer = Buffer.from(key, "base64");
  if (buffer.length !== 32) {
    throw new Error("ENCRYPTION_KEY must decode to exactly 32 bytes (base64-encoded).");
  }
  return buffer;
}

// Returns base64(iv || authTag || ciphertext).
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString("base64");
}

export function decrypt(value: string): string {
  const key = getKey();
  const buffer = Buffer.from(value, "base64");
  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
  const ciphertext = buffer.subarray(IV_LENGTH + 16);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function encryptAmount(amount: number): string {
  return encrypt(String(amount));
}

export function decryptAmount(value: string): number {
  return Number(decrypt(value));
}

// name columns are nullable — pass null/undefined through untouched.
export function encryptNullable(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return encrypt(value);
}

export function decryptNullable(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return decrypt(value);
}
