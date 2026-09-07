"use client";

import { Button } from "@/components/ui/button";

import {
  CategoryEditor,
  EditableCategory,
} from "../onboarding-category-editor";

type Props = {
  categories: EditableCategory[];
  onChange: (value: EditableCategory[]) => void;
  onBack: () => void;
  onNext: () => void;
};

export function BudgetsStep({ categories, onChange, onBack, onNext }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
        These are the areas where you want Vault to help you keep spending under
        control. Remove anything you don&apos;t need and add categories that
        actually match your life.
      </p>

      <CategoryEditor
        categories={categories}
        onChange={onChange}
        addLabel="Add spending category"
      />

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>

        <Button onClick={onNext} className="h-12 rounded-2xl px-7">
          Continue
        </Button>
      </div>
    </div>
  );
}
