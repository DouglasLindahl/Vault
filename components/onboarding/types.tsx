// components/onboarding/types.ts

export type IncomeDraft = {
  id: string;
  name: string;

  categoryName: string;
  categoryEmoji: string;
  categoryColor: string;

  amountType: "fixed" | "estimated" | "variable";
  amount: string;

  frequency:
    | "weekly"
    | "biweekly"
    | "semimonthly"
    | "monthly"
    | "quarterly"
    | "yearly"
    | "irregular";

  paydayWeekday: string;
  paydayDay: string;
};

export type BillDraft = {
  id: string;
  name: string;

  categoryName: string;
  categoryEmoji: string;
  categoryColor: string;

  amount: string;
  amountType: "fixed" | "estimated" | "variable";

  frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";

  dueType: "exact" | "window";

  dueDay: string;
  dueWindowStart: string;
  dueWindowEnd: string;
};

export type SubscriptionDraft = {
  id: string;
  name: string;

  categoryName: string;
  categoryEmoji: string;
  categoryColor: string;

  amount: string;

  frequency: "weekly" | "monthly" | "quarterly" | "semiannual" | "yearly";

  nextPaymentDate: string;
};
