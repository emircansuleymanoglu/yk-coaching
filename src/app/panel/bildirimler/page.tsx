import Link from "next/link";
import { Bell, Dumbbell, MessageCircle, MessageSquare, FileText } from "lucide-react";
import { requireProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { MarkRead } from "./MarkRead";
import type { Notification } from "@/lib/types";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  message: MessageCircle,
  workout: Dumbbell,
  comment: MessageSquare,
  program: FileText,
  info: Bell,
};

export default async function NotificationsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const items = (data ?? []) as Notification[];

  return (
    <div className="space-y-4">
      <MarkRead />
      <h1 className="text-xl font-bold">Bildirimler</h1>

      {items.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-12 text-center text-sm text-[var(--muted)]">
          <Bell className="h-7 w-7" />
          Henüz bildirim yok.
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            const inner = (
              <Card
                className={cnRow(n.read)}
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--primary)]/12 text-[var(--primary-glow)]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && (
                    <p className="truncate text-xs text-[var(--muted)]">{n.body}</p>
                  )}
                  <p className="mt-0.5 text-[10px] text-[var(--muted)]">
                    {formatDate(n.created_at)}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
                )}
              </Card>
            );
            return n.link ? (
              <Link key={n.id} href={n.link}>
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function cnRow(read: boolean) {
  return `flex items-start gap-3 ${read ? "" : "border-[var(--primary)]/40"}`;
}
