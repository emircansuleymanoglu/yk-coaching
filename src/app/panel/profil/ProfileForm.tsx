"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "./actions";
import { Button, Card, Input, Label } from "@/components/ui";
import type { Profile } from "@/lib/types";

export function ProfileForm({
  profile,
  email,
}: {
  profile: Profile;
  email: string;
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    undefined,
  );

  return (
    <form action={action} className="space-y-5">
      <Card className="space-y-4">
        <h2 className="font-semibold">İletişim</h2>
        <div>
          <Label>E-posta</Label>
          <Input value={email} disabled className="opacity-60" />
        </div>
        <div>
          <Label htmlFor="full_name">Ad Soyad</Label>
          <Input id="full_name" name="full_name" defaultValue={profile.full_name} />
        </div>
        <div>
          <Label htmlFor="phone">Telefon</Label>
          <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} />
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="font-semibold">Kişisel Bilgiler</h2>
        <div>
          <Label htmlFor="goal">Hedef</Label>
          <Input
            id="goal"
            name="goal"
            defaultValue={profile.goal ?? ""}
            placeholder="Yağ yakımı / kas kazanımı"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="activity_level">Aktivite Seviyesi</Label>
            <select
              id="activity_level"
              name="activity_level"
              defaultValue={profile.activity_level ?? ""}
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="">Seç</option>
              <option value="Hareketsiz">Hareketsiz</option>
              <option value="Az Aktif">Az Aktif</option>
              <option value="Orta Aktif">Orta Aktif</option>
              <option value="Çok Aktif">Çok Aktif</option>
            </select>
          </div>
          <div>
            <Label htmlFor="sex">Cinsiyet</Label>
            <select
              id="sex"
              name="sex"
              defaultValue={profile.sex ?? ""}
              className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm outline-none focus:border-[var(--primary)]"
            >
              <option value="">Seç</option>
              <option value="Erkek">Erkek</option>
              <option value="Kadın">Kadın</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="height_cm">Boy (cm)</Label>
            <Input
              id="height_cm"
              name="height_cm"
              type="number"
              step="any"
              defaultValue={profile.height_cm ?? ""}
            />
          </div>
          <div>
            <Label htmlFor="birthday">Doğum Tarihi</Label>
            <Input
              id="birthday"
              name="birthday"
              type="date"
              defaultValue={profile.birthday ?? ""}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="country">Ülke</Label>
            <Input id="country" name="country" defaultValue={profile.country ?? ""} />
          </div>
          <div>
            <Label htmlFor="city">Şehir</Label>
            <Input id="city" name="city" defaultValue={profile.city ?? ""} />
          </div>
        </div>
        <div>
          <Label htmlFor="units">Birim Sistemi</Label>
          <select
            id="units"
            name="units"
            defaultValue={profile.units ?? "metric"}
            className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm outline-none focus:border-[var(--primary)]"
          >
            <option value="metric">Metrik (kg, cm)</option>
            <option value="imperial">İmperyal (lb, in)</option>
          </select>
        </div>
      </Card>

      {state?.error && (
        <p className="rounded-lg bg-[var(--danger)]/12 px-3 py-2 text-sm text-[var(--danger)]">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-[var(--success)]/12 px-3 py-2 text-sm text-[var(--success)]">
          Kaydedildi ✓
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? "Kaydediliyor…" : "Kaydet"}
      </Button>
    </form>
  );
}
