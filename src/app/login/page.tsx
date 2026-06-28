"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type LoginState } from "./actions";
import { Logo } from "@/components/Logo";
import { Button, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-gradient-to-b from-[var(--primary-strong)]/20 to-transparent blur-2xl" />

      <div className="mb-8 flex justify-center">
        <Logo className="scale-110" />
      </div>

      <h1 className="text-center text-2xl font-bold">Tekrar hoş geldin</h1>
      <p className="mt-1 text-center text-sm text-[var(--muted)]">
        Programına erişmek için giriş yap
      </p>

      <form action={action} className="mt-8 grid gap-4">
        <div>
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="ornek@mail.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Şifre</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
          />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-[var(--danger)]/12 px-3 py-2 text-sm text-[var(--danger)]">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending} className="mt-2">
          {pending ? "Giriş yapılıyor…" : "Giriş Yap"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-[var(--muted)]">
        Hesabın yok mu? Koçun seni davet etmeli.{" "}
        <Link href="/" className="text-[var(--primary-glow)]">
          Ana sayfa
        </Link>
      </p>
    </main>
  );
}
