"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markThreadRead } from "@/app/panel/mesajlar/actions";
import { cn } from "@/lib/utils";

type Msg = {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

export function ChatThread({
  meId,
  otherId,
  otherName,
  initial,
}: {
  meId: string;
  otherId: string;
  otherName: string;
  initial: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [, start] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    markThreadRead(otherId);
    const supabase = createClient();
    const channel = supabase
      .channel(`thread-${meId}-${otherId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Msg;
          const inThread =
            (m.sender_id === meId && m.recipient_id === otherId) ||
            (m.sender_id === otherId && m.recipient_id === meId);
          if (inThread) {
            setMessages((prev) =>
              prev.some((x) => x.id === m.id) ? prev : [...prev, m],
            );
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [meId, otherId]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText("");
    // iyimser ekleme
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      sender_id: meId,
      recipient_id: otherId,
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    start(async () => {
      await sendMessage(otherId, body);
    });
  }

  return (
    <div className="flex h-[calc(100dvh-180px)] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto pb-3">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-[var(--muted)]">
            {otherName} ile sohbete başla 👋
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div
              key={m.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm",
                  mine
                    ? "brand-gradient text-white"
                    : "border border-[var(--border)] bg-[var(--surface)]",
                )}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={submit}
        className="flex gap-2 border-t border-[var(--border)] pt-3"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mesaj yaz…"
          className="h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3.5 text-sm outline-none focus:border-[var(--primary)]"
        />
        <button
          type="submit"
          className="grid h-11 w-11 place-items-center rounded-xl brand-gradient text-white"
          aria-label="Gönder"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
