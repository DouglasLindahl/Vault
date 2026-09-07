"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/user-provider";

import { OnboardingLayout } from "./onboarding-layout";

import { AboutYouData, AboutYouStep } from "./steps/about-you-step";

import { PreferencesData, PreferencesStep } from "./steps/preferences-step";

import { IncomeStep } from "./steps/income-step";
import { BillsStep } from "./steps/bills-step";
import { SubscriptionsStep } from "./steps/subscriptions-step";
import { BudgetsStep } from "./steps/budgets-step";

import { SavingsData, SavingsStep } from "./steps/savings-step";

import type { IncomeDraft, BillDraft, SubscriptionDraft } from "./types";

import type { EditableCategory } from "./category-editor";

export function OnboardingForm() {
  const user = useUser();
  const router = useRouter();

  const [step, setStep] = useState(user.user_onboarding_step ?? 1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------
  // STEP 1 — ABOUT YOU
  // -------------------------

  const [about, setAbout] = useState<AboutYouData>({
    firstName: user.user_first_name ?? "",
    lastName: user.user_last_name ?? "",
    preferredName: user.user_preferred_name ?? "",
    dateOfBirth: user.user_date_of_birth ?? "",
  });

  // -------------------------
  // STEP 2 — PREFERENCES
  // -------------------------

  const [preferences, setPreferences] = useState<PreferencesData>({
    countryCode: user.user_country_code ?? "US",
    currencyCode: user.currencies[0]?.currency_code ?? "USD",
    timezone:
      user.user_timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    weekStartsOn: user.user_week_starts_on ?? 1,
  });

  // -------------------------
  // STEP 3 — INCOME
  // -------------------------

  const [incomes, setIncomes] = useState<IncomeDraft[]>([
    {
      id: crypto.randomUUID(),

      name: "Salary",

      categoryName: "Salary",
      categoryEmoji: "💼",
      categoryColor: "#3B82F6",

      amountType: "fixed",
      amount: "",

      frequency: "biweekly",

      paydayWeekday: "5",
      paydayDay: "",
    },
  ]);

  // -------------------------
  // STEP 4 — BILLS
  // -------------------------

  const [bills, setBills] = useState<BillDraft[]>([
    {
      id: crypto.randomUUID(),

      name: "Rent",

      categoryName: "Housing",
      categoryEmoji: "🏠",
      categoryColor: "#8B5CF6",

      amount: "",
      amountType: "fixed",

      frequency: "monthly",

      dueType: "exact",

      dueDay: "1",
      dueWindowStart: "",
      dueWindowEnd: "",
    },
  ]);

  // -------------------------
  // STEP 5 — SUBSCRIPTIONS
  // -------------------------

  const [subscriptions, setSubscriptions] = useState<SubscriptionDraft[]>([
    {
      id: crypto.randomUUID(),

      name: "",

      categoryName: "Entertainment",
      categoryEmoji: "🎬",
      categoryColor: "#EC4899",

      amount: "",
      frequency: "monthly",

      nextPaymentDate: "",
    },
  ]);

  // -------------------------
  // STEP 6 — SPENDING CATEGORIES
  // -------------------------

  const [spendingCategories, setSpendingCategories] = useState<
    EditableCategory[]
  >([
    {
      id: crypto.randomUUID(),
      emoji: "🛒",
      name: "Groceries",
      color: "#22C55E",
    },
    {
      id: crypto.randomUUID(),
      emoji: "🍔",
      name: "Eating out",
      color: "#F97316",
    },
    {
      id: crypto.randomUUID(),
      emoji: "🎮",
      name: "Entertainment",
      color: "#EC4899",
    },
    {
      id: crypto.randomUUID(),
      emoji: "👕",
      name: "Shopping",
      color: "#8B5CF6",
    },
    {
      id: crypto.randomUUID(),
      emoji: "⛽",
      name: "Transport",
      color: "#3B82F6",
    },
  ]);

  // -------------------------
  // STEP 7 — SAVINGS
  // -------------------------

  const [savings, setSavings] = useState<SavingsData>({
    weekly: user.user_weekly_savings_goal?.toString() ?? "",
    monthly: user.user_monthly_savings_goal?.toString() ?? "",
    yearly: user.user_yearly_savings_goal?.toString() ?? "",
  });

  // =========================================================
  // HELPERS
  // =========================================================

  function parseOptionalNumber(value: string) {
    if (value.trim() === "") {
      return null;
    }

    return Number(value);
  }

  async function updateOnboardingStep(nextStep: number) {
    const supabase = createClient();

    const { error } = await supabase
      .from("users")
      .update({
        user_onboarding_step: nextStep,
      })
      .eq("user_uid", user.user_uid);

    if (error) {
      throw error;
    }

    setStep(nextStep);
  }

  // =========================================================
  // STEP 1 — SAVE ABOUT YOU
  // =========================================================

  async function saveAbout() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("users")
        .update({
          user_first_name: about.firstName.trim(),
          user_last_name: about.lastName.trim(),

          user_preferred_name: about.preferredName.trim() || null,

          user_date_of_birth: about.dateOfBirth || null,

          user_completed_profile: true,

          user_onboarding_step: 2,
        })
        .eq("user_uid", user.user_uid);

      if (error) {
        throw error;
      }

      setStep(2);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save your profile.",
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // STEP 2 — SAVE PREFERENCES
  // =========================================================

  async function savePreferences() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { data: currency, error: currencyError } = await supabase
        .from("currencies")
        .select("currency_id")
        .eq("currency_code", preferences.currencyCode.toUpperCase())
        .single();

      if (currencyError) {
        throw currencyError;
      }

      const { error } = await supabase
        .from("users")
        .update({
          user_country_code: preferences.countryCode.toUpperCase(),

          user_currency_id: currency.currency_id,

          user_timezone: preferences.timezone,

          user_week_starts_on: preferences.weekStartsOn,

          user_onboarding_step: 3,
        })
        .eq("user_uid", user.user_uid);

      if (error) {
        throw error;
      }

      setStep(3);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save your preferences.",
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // STEP 3 — SAVE INCOME
  // =========================================================

  async function saveIncomes() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Clear existing onboarding income records.
      const { error: incomeDeleteError } = await supabase
        .from("incomes")
        .delete()
        .eq("income_user_uid", user.user_uid);

      if (incomeDeleteError) {
        throw incomeDeleteError;
      }

      // Clear existing income categories.
      const { error: categoryDeleteError } = await supabase
        .from("categories")
        .delete()
        .eq("category_user_uid", user.user_uid)
        .eq("category_type", "income");

      if (categoryDeleteError) {
        throw categoryDeleteError;
      }

      for (let index = 0; index < incomes.length; index++) {
        const income = incomes[index];

        if (!income.name.trim()) {
          continue;
        }

        const { data: category, error: categoryError } = await supabase
          .from("categories")
          .insert({
            category_user_uid: user.user_uid,

            category_name: income.categoryName.trim() || income.name.trim(),

            category_emoji: income.categoryEmoji || null,

            category_color: income.categoryColor || null,

            category_type: "income",

            category_sort_order: index,
          })
          .select("category_id")
          .single();

        if (categoryError) {
          throw categoryError;
        }

        const { error: incomeInsertError } = await supabase
          .from("incomes")
          .insert({
            income_user_uid: user.user_uid,

            income_category_id: category.category_id,

            income_name: income.name.trim(),

            income_amount: parseOptionalNumber(income.amount),

            income_amount_type: income.amountType,

            income_frequency: income.frequency,

            income_payday_weekday: income.paydayWeekday
              ? Number(income.paydayWeekday)
              : null,

            income_payday_day: income.paydayDay
              ? Number(income.paydayDay)
              : null,

            income_is_active: true,
          });

        if (incomeInsertError) {
          throw incomeInsertError;
        }
      }

      await updateOnboardingStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save income.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // STEP 4 — SAVE BILLS
  // =========================================================

  async function saveBills() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: billDeleteError } = await supabase
        .from("bills")
        .delete()
        .eq("bill_user_uid", user.user_uid);

      if (billDeleteError) {
        throw billDeleteError;
      }

      const { error: categoryDeleteError } = await supabase
        .from("categories")
        .delete()
        .eq("category_user_uid", user.user_uid)
        .eq("category_type", "bill");

      if (categoryDeleteError) {
        throw categoryDeleteError;
      }

      for (let index = 0; index < bills.length; index++) {
        const bill = bills[index];

        if (!bill.name.trim()) {
          continue;
        }

        const { data: category, error: categoryError } = await supabase
          .from("categories")
          .insert({
            category_user_uid: user.user_uid,

            category_name: bill.categoryName.trim() || bill.name.trim(),

            category_emoji: bill.categoryEmoji || null,

            category_color: bill.categoryColor || null,

            category_type: "bill",

            category_sort_order: index,
          })
          .select("category_id")
          .single();

        if (categoryError) {
          throw categoryError;
        }

        const { error: billInsertError } = await supabase.from("bills").insert({
          bill_user_uid: user.user_uid,

          bill_category_id: category.category_id,

          bill_name: bill.name.trim(),

          bill_amount: parseOptionalNumber(bill.amount),

          bill_amount_type: bill.amountType,

          bill_frequency: bill.frequency,

          bill_due_type: bill.dueType,

          bill_due_day:
            bill.dueType === "exact" && bill.dueDay
              ? Number(bill.dueDay)
              : null,

          bill_due_window_start:
            bill.dueType === "window" && bill.dueWindowStart
              ? Number(bill.dueWindowStart)
              : null,

          bill_due_window_end:
            bill.dueType === "window" && bill.dueWindowEnd
              ? Number(bill.dueWindowEnd)
              : null,

          bill_is_active: true,
        });

        if (billInsertError) {
          throw billInsertError;
        }
      }

      await updateOnboardingStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save bills.");
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // STEP 5 — SAVE SUBSCRIPTIONS
  // =========================================================

  async function saveSubscriptions() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: subscriptionDeleteError } = await supabase
        .from("subscriptions")
        .delete()
        .eq("subscription_user_uid", user.user_uid);

      if (subscriptionDeleteError) {
        throw subscriptionDeleteError;
      }

      const { error: categoryDeleteError } = await supabase
        .from("categories")
        .delete()
        .eq("category_user_uid", user.user_uid)
        .eq("category_type", "subscription");

      if (categoryDeleteError) {
        throw categoryDeleteError;
      }

      for (let index = 0; index < subscriptions.length; index++) {
        const subscription = subscriptions[index];

        if (!subscription.name.trim()) {
          continue;
        }

        const { data: category, error: categoryError } = await supabase
          .from("categories")
          .insert({
            category_user_uid: user.user_uid,

            category_name:
              subscription.categoryName.trim() || subscription.name.trim(),

            category_emoji: subscription.categoryEmoji || null,

            category_color: subscription.categoryColor || null,

            category_type: "subscription",

            category_sort_order: index,
          })
          .select("category_id")
          .single();

        if (categoryError) {
          throw categoryError;
        }

        const { error: subscriptionInsertError } = await supabase
          .from("subscriptions")
          .insert({
            subscription_user_uid: user.user_uid,

            subscription_category_id: category.category_id,

            subscription_name: subscription.name.trim(),

            subscription_amount: parseOptionalNumber(subscription.amount),

            subscription_frequency: subscription.frequency,

            subscription_next_payment_date:
              subscription.nextPaymentDate || null,

            subscription_status: "active",
          });

        if (subscriptionInsertError) {
          throw subscriptionInsertError;
        }
      }

      await updateOnboardingStep(6);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save subscriptions.",
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // STEP 6 — SAVE SPENDING CATEGORIES
  // =========================================================

  async function saveSpendingCategories() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("category_user_uid", user.user_uid)
        .eq("category_type", "spending");

      if (deleteError) {
        throw deleteError;
      }

      const validCategories = spendingCategories.filter(
        (category) => category.name.trim().length > 0,
      );

      if (validCategories.length > 0) {
        const { error: insertError } = await supabase.from("categories").insert(
          validCategories.map((category, index) => ({
            category_user_uid: user.user_uid,

            category_name: category.name.trim(),

            category_emoji: category.emoji || null,

            category_color: category.color || null,

            category_type: "spending",

            category_sort_order: index,
          })),
        );

        if (insertError) {
          throw insertError;
        }
      }

      await updateOnboardingStep(7);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save spending categories.",
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // STEP 7 — FINISH ONBOARDING
  // =========================================================

  async function finishOnboarding() {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("users")
        .update({
          user_weekly_savings_goal: parseOptionalNumber(savings.weekly),

          user_monthly_savings_goal: parseOptionalNumber(savings.monthly),

          user_yearly_savings_goal: parseOptionalNumber(savings.yearly),

          user_first_time_login: false,

          user_completed_profile: true,

          user_completed_onboarding: true,

          user_onboarding_step: 7,
        })
        .eq("user_uid", user.user_uid);

      if (error) {
        throw error;
      }

      router.push("/protected/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to finish onboarding.",
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <>
      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {step === 1 && (
        <OnboardingLayout
          step={1}
          title="Tell us a little about yourself."
          description="We'll use this to make Vault feel more personal. Nothing financial yet."
        >
          <AboutYouStep
            value={about}
            onChange={setAbout}
            onNext={saveAbout}
            loading={loading}
          />
        </OnboardingLayout>
      )}

      {step === 2 && (
        <OnboardingLayout
          step={2}
          title="Set up Vault for you."
          description="Choose how Vault should display your money, dates and weekly progress."
        >
          <PreferencesStep
            value={preferences}
            onChange={setPreferences}
            onBack={() => setStep(1)}
            onNext={savePreferences}
            loading={loading}
          />
        </OnboardingLayout>
      )}

      {step === 3 && (
        <OnboardingLayout
          step={3}
          title="How does money come in?"
          description="Add your different income sources separately so Vault can understand how your income actually works."
        >
          <IncomeStep
            incomes={incomes}
            onChange={setIncomes}
            onBack={() => setStep(2)}
            onNext={saveIncomes}
            loading={loading}
          />
        </OnboardingLayout>
      )}

      {step === 4 && (
        <OnboardingLayout
          step={4}
          title="What bills do you need to pay?"
          description="Bills are obligations and necessary recurring expenses. Tell Vault roughly how much they cost and when they're due."
        >
          <BillsStep
            bills={bills}
            onChange={setBills}
            onBack={() => setStep(3)}
            onNext={saveBills}
            loading={loading}
          />
        </OnboardingLayout>
      )}

      {step === 5 && (
        <OnboardingLayout
          step={5}
          title="What subscriptions do you have?"
          description="Subscriptions are optional recurring services. Keeping them separate makes it easier to understand what you could cancel or reduce."
        >
          <SubscriptionsStep
            subscriptions={subscriptions}
            onChange={setSubscriptions}
            onBack={() => setStep(4)}
            onNext={saveSubscriptions}
            loading={loading}
          />
        </OnboardingLayout>
      )}

      {step === 6 && (
        <OnboardingLayout
          step={6}
          title="What do you spend money on?"
          description="Start with these categories, remove what you don't need, and add anything that better matches your life."
        >
          <BudgetsStep
            categories={spendingCategories}
            onChange={setSpendingCategories}
            onBack={() => setStep(5)}
            onNext={saveSpendingCategories}
            loading={loading}
          />
        </OnboardingLayout>
      )}

      {step === 7 && (
        <OnboardingLayout
          step={7}
          title="Give your money a goal."
          description="Set savings targets that feel realistic. You can change these whenever you want."
        >
          <SavingsStep
            value={savings}
            onChange={setSavings}
            onBack={() => setStep(6)}
            onFinish={finishOnboarding}
            loading={loading}
          />
        </OnboardingLayout>
      )}
    </>
  );
}
