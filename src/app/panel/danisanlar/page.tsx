import Link from "next/link";
import { Plus, ChevronRight, Search } from "lucide-react";
import { requireCoach } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Badge, Button, Card } from "@/components/ui";
import type { PaymentStatus } from "@/lib/types";

const payTone: Record<PaymentStatus, "success" | "warning" | "danger"> = {
  odendi: "success",
  bekliyor: "warning",
  gecikti: "danger",
};

export default async function ClientsPage() {
  await requireCoach();
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("profiles")
    .select("id, full_name, goal, payment_status")
    .eq("role", "client")
    .order("full_name");

  const list = clients ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Danışanlar</h1>
        <Link href="/panel/danisanlar/yeni">
          <Button size="sm">
            <Plus className="h-4 w-4" /> Ekle
          </Button>
        </Link>
      </div>

      {list.length > 4 && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3">
          <Search className="h-4 w-4 text-[var(--muted)]" />
          <input
            placeholder="Ara… (yakında)"
            className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
            disabled
          />
        </div>
      )}

      <div className="space-y-2">
        {list.map((c) => (
          <Link key={c.id} href={`/panel/danisanlar/${c.id}`}>
            <Card className="flex items-center justify-between hover:border-[var(--primary)]/50">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[var(--surface-2)] font-semibold">
                  {initials(c.full_name)}
                </div>
                <div>
                  <p className="font-medium">{c.full_name || "İsimsiz"}</p>
                  {c.goal && (
                    <p className="text-xs text-[var(--muted)]">{c.goal}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={payTone[c.payment_status as PaymentStatus]}>
                  {c.payment_status}
                </Badge>
                <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
              </div>
            </Card>
          </Link>
        ))}
        {!list.length && (
          <Card className="py-10 text-center text-sm text-[var(--muted)]">
            Henüz danışan eklenmemiş.
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
