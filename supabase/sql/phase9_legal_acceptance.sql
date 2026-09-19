-- Records that a user accepted the Terms and Conditions / Privacy Policy,
-- and which version they accepted (see config/legal.ts).

alter table public.profiles
  add column terms_accepted_at timestamptz,
  add column terms_version text,
  add column privacy_accepted_at timestamptz,
  add column privacy_version text;
