"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/lib/queries/snapshots";
import type { Profile } from "@/lib/types/database";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "SEK", "NOK"];

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile.date_of_birth ?? "");
  const [timezone, setTimezone] = useState(
    profile.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [currency, setCurrency] = useState(profile.currency ?? "USD");

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    const supabase = createClient();

    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      // Bust cached image with a cache-busting query param.
      const url = `${publicUrl}?t=${Date.now()}`;

      await updateProfile(supabase, profile.id, { avatar_url: url });
      setAvatarUrl(url);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't upload photo.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    try {
      const supabase = createClient();
      await updateProfile(supabase, profile.id, {
        display_name: displayName.trim() || null,
        phone_number: phoneNumber.trim() || null,
        date_of_birth: dateOfBirth || null,
        timezone: timezone || null,
        currency,
      });
      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
          {avatarUrl && (
            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" unoptimized />
          )}
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl"
          >
            <Camera className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Change photo"}
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Email</Label>
        <Input value={profile.email ?? ""} disabled className="h-11 rounded-2xl" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="display-name">Name</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-11 rounded-2xl"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="h-11 rounded-2xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="dob">Date of birth</Label>
          <Input
            id="dob"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="h-11 rounded-2xl"
          />
        </div>
        <div className="grid gap-2">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="h-11 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="h-11 rounded-2xl"
        />
      </div>

      {error && (
        <div className="rounded-2xl bg-red-500/[0.07] px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl bg-success/10 px-4 py-3 text-sm text-success">
          Profile updated.
        </div>
      )}

      <Button
        type="submit"
        disabled={isSaving}
        className="h-12 rounded-2xl bg-primary-surface text-white sm:w-fit sm:px-8"
      >
        {isSaving ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
