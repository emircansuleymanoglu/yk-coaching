import Link from "next/link";
import { MessageCircle, ChevronRight } from "lucide-react";
import { requireProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ChatThread } from "@/components/chat/ChatThread";
import { Badge, Card } from "@/components/ui";
import type { Message } from "@/lib/types";

export default async function MessagesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (profile.role === "client") {
    // danışan → koç ile tek thread
    const { data: coach } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "coach")
      .limit(1)
      .maybeSingle();

    if (!coach) {
      return (
        <Card className="py-10 text-center text-sm text-[var(--muted)]">
          Koç bulunamadı.
        </Card>
      );
    }

    const { data: msgs } = await supabase
      .from("messages")
      .select("id, sender_id, recipient_id, body, created_at")
      .or(
        `and(sender_id.eq.${profile.id},recipient_id.eq.${coach.id}),and(sender_id.eq.${coach.id},recipient_id.eq.${profile.id})`,
      )
      .order("created_at", { ascending: true });

    const wa = process.env.COACH_WHATSAPP;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">{coach.full_name || "Koçun"}</h1>
          {wa && (
            <a
              href={`https://wa.me/${wa.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-[var(--success)]/40 px-3 py-1 text-xs font-semibold text-[var(--success)]"
            >
              WhatsApp
            </a>
          )}
        </div>
        <ChatThread
          meId={profile.id}
          otherId={coach.id}
          otherName={coach.full_name || "Koç"}
          initial={(msgs ?? []) as Message[]}
        />
      </div>
    );
  }

  // koç → danışan listesi + okunmamış
  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "client")
    .order("full_name");

  const { data: unread } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("recipient_id", profile.id)
    .eq("read", false);

  const unreadBySender = new Map<string, number>();
  for (const m of unread ?? []) {
    unreadBySender.set(m.sender_id, (unreadBySender.get(m.sender_id) ?? 0) + 1);
  }

  const list = clients ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Mesajlar</h1>
      <div className="space-y-2">
        {list.map((c) => {
          const count = unreadBySender.get(c.id) ?? 0;
          return (
            <Link key={c.id} href={`/panel/mesajlar/${c.id}`}>
              <Card className="flex items-center justify-between hover:border-[var(--primary)]/50">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[var(--surface-2)] font-semibold">
                    {initials(c.full_name)}
                  </div>
                  <span className="font-medium">{c.full_name || "İsimsiz"}</span>
                </div>
                <div className="flex items-center gap-2">
                  {count > 0 && <Badge tone="primary">{count}</Badge>}
                  <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
                </div>
              </Card>
            </Link>
          );
        })}
        {!list.length && (
          <Card className="flex flex-col items-center gap-2 py-10 text-center text-sm text-[var(--muted)]">
            <MessageCircle className="h-7 w-7" />
            Henüz danışan yok.
          </Card>
        )}
      </div>
    </div>
  );
}

function initials(name: string): string {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
