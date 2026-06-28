"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Users,
  Dumbbell,
  CalendarDays,
  LineChart,
  MessageCircle,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const coachNav: NavItem[] = [
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/panel/danisanlar", label: "Danışanlar", icon: Users },
  { href: "/panel/mesajlar", label: "Mesaj", icon: MessageCircle },
  { href: "/panel/odemeler", label: "Ödeme", icon: Wallet },
];

const clientNav: NavItem[] = [
  { href: "/panel", label: "Ana Sayfa", icon: Home },
  { href: "/panel/takvim", label: "Takvim", icon: CalendarDays },
  { href: "/panel/program", label: "Program", icon: Dumbbell },
  { href: "/panel/ilerleme", label: "İlerleme", icon: LineChart },
  { href: "/panel/mesajlar", label: "Mesaj", icon: MessageCircle },
];

export function BottomNav({ role }: { role: "coach" | "client" }) {
  const pathname = usePathname();
  const items = role === "coach" ? coachNav : clientNav;

  return (
    <nav className="sticky bottom-0 z-20 border-t border-[var(--border)] bg-[var(--background)]/90 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {items.map((item) => {
          const active =
            item.href === "/panel"
              ? pathname === "/panel"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition",
                active
                  ? "text-[var(--primary-glow)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
