"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  createClientAccount,
  type NewClientState,
} from "../actions";
import { Button, Card, Input, Label } from "@/components/ui";

export default function NewClientPage() {
  const [state, action, pending] = useActionState<NewClientState, FormData>(
    createClientAccount,
    undefined,
  );

  return (
    <div className="space-y-4">
      <Link
        href="/panel/danisanlar"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)]"
      >
        <ArrowLeft className="h-4 w-4" /> Danışanlar
      </Link>

      <h1 className="text-xl font-bold">Yeni Danışan</h1>
      <p className="text-sm text-[var(--muted)]">
        Hesap oluşturulduğunda danışan, belirlediğin e-posta ve şifreyle giriş
        yapabilir.
      </p>

      <Card>
        <form action={action} className="grid gap-4">
          <div>
            <Label htmlFor="full_name">Ad Soyad</Label>
            <Input id="full_name" name="full_name" required placeholder="Berat Bulut" />
          </div>
          <div>
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="danisan@mail.com"
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefon (opsiyonel)</Label>
            <Input id="phone" name="phone" placeholder="05xx xxx xx xx" />
          </div>
          <div>
            <Label htmlFor="goal">Hedef (opsiyonel)</Label>
            <Input id="goal" name="goal" placeholder="Yağ yakımı / kas kazanımı" />
          </div>
          <div>
            <Label htmlFor="password">Geçici Şifre</Label>
            <Input
              id="password"
              name="password"
              type="text"
              required
              minLength={6}
              placeholder="En az 6 karakter"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Bu şifreyi danışana ilet; ilk girişten sonra değiştirebilir.
            </p>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-[var(--danger)]/12 px-3 py-2 text-sm text-[var(--danger)]">
              {state.error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={pending}>
            {pending ? "Oluşturuluyor…" : "Danışanı Oluştur"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
