import Link from "next/link";
import { LogOut, Bell } from "lucide-react";
import { requireProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  const supabase = await createClient();
  const { count: unread } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id)
    .eq("read", false);

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/90 px-4 py-3 backdrop-blur">
        <Link href="/panel">
          <Logo />
        </Link>
        <div className="flex items-center gap-2.5">
          <Link
            href="/panel/bildirimler"
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Bildirimler"
          >
            <Bell className="h-4 w-4" />
            {!!unread && unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </Link>
          <Link
            href="/panel/profil"
            className="hidden text-sm text-[var(--muted)] hover:text-[var(--foreground)] sm:block"
          >
            {profile.full_name || "Hesabım"}
          </Link>
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
