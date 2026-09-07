"use client";

import { createContext, useContext, type ReactNode } from "react";

type Currency = {
  currency_id: number;
  currency_code: string;
  currency_name: string;
  currency_symbol: string;
};

export type VaultUser = {
  user_uid: string;
  user_email: string | null;
  user_phone_number: string | null;

  user_first_name: string | null;
  user_last_name: string | null;
  user_preferred_name: string | null;
  user_display_name: string | null;
  user_username: string | null;
  user_avatar_url: string | null;

  user_date_of_birth: string | null;

  user_country_code: string | null;
  user_currency_id: number | null;
  user_timezone: string | null;
  user_locale: string | null;
  user_language: string | null;
  user_week_starts_on: number | null;

  user_first_time_login: boolean;
  user_completed_profile: boolean;
  user_completed_onboarding: boolean;

  user_terms_accepted: boolean;
  user_marketing_emails_enabled: boolean;

  user_account_status: string;

  user_created_at: string;

  user_onboarding_step: number;

  user_weekly_savings_goal: number | null;
  user_monthly_savings_goal: number | null;
  user_yearly_savings_goal: number | null;

  currencies: Currency[];
};

const UserContext = createContext<VaultUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: VaultUser;
  children: ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  const user = useContext(UserContext);

  if (!user) {
    throw new Error("useUser must be used inside UserProvider");
  }

  return user;
}
