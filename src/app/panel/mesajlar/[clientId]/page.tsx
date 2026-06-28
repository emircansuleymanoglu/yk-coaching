import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCoach } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { ChatThread } from "@/components/chat/ChatThread";
import type { Message } from "@/lib/types";

export default async function CoachThreadPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const coach = await requireCoach();
  const { clientId } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("id", clientId)
    .single();
  if (!client) notFound();

  const { data: msgs } = await supabase
    .from("messages")
    .select("id, sender_id, recipient_id, body, created_at")
    .or(
      `and(sender_id.eq.${coach.id},recipient_id.eq.${clientId}),and(sender_id.eq.${clientId},recipient_id.eq.${coach.id})`,
    )
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-3">
      <Link
        href="/panel/mesajlar"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)]"
      >
        <ArrowLeft className="h-4 w-4" /> Mesajlar
      </Link>
      <h1 className="text-xl font-bold">{client.full_name}</h1>
      <ChatThread
        meId={coach.id}
        otherId={clientId}
        otherName={client.full_name}
        initial={(msgs ?? []) as Message[]}
      />
    </div>
  );
}
