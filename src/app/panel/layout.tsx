import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireProfile } from "@/lib/dal";
import { logout } from "@/app/login/actions";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/90 px-4 py-3 backdrop-blur">
        <Link href="/panel">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--muted)]">
            {profile.full_name || "Hesabım"}
          </span>
          <form action={logout}>
            <button
              className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
              aria-label="Çıkış"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 px-4 py-5">{children}</main>

      <BottomNav role={profile.role} />
    </div>
  );
}
