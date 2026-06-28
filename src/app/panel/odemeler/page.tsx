import Link from "next/link";
import { Copy, Wallet } from "lucide-react";
import { requireProfile } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Badge, Card } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import type { PaymentStatus, Profile } from "@/lib/types";

const payTone: Record<PaymentStatus, "success" | "warning" | "danger"> = {
  odendi: "success",
  bekliyor: "warning",
  gecikti: "danger",
};

export default async function PaymentsPage() {
  const profile = await requireProfile();
  if (profile.role === "coach") return <CoachPayments />;
  return <ClientPayments profile={profile} />;
}

async function CoachPayments() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, payment_status, subscription_end")
    .eq("role", "client")
    .order("full_name");
  const list = data ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Ödemeler</h1>
      <p className="text-sm text-[var(--muted)]">
        Havale takibi manuel. Bir danışana dokunup durumunu güncelleyebilirsin.
      </p>
      <div className="space-y-2">
        {list.map((c) => (
          <Link key={c.id} href={`/panel/danisanlar/${c.id}`}>
            <Card className="flex items-center justify-between">
              <div>
                <p className="font-medium">{c.full_name}</p>
                <p className="text-xs text-[var(--muted)]">
                  Bitiş: {formatDate(c.subscription_end)}
                </p>
              </div>
              <Badge tone={payTone[c.payment_status as PaymentStatus]}>
                {c.payment_status}
              </Badge>
            </Card>
          </Link>
        ))}
        {!list.length && (
          <Card className="py-8 text-center text-sm text-[var(--muted)]">
            Danışan yok.
          </Card>
        )}
      </div>
    </div>
  );
}

function ClientPayments({ profile }: { profile: Profile }) {
  const iban = process.env.NEXT_PUBLIC_BANK_IBAN || "IBAN tanımlanmadı";
  const bankName = process.env.NEXT_PUBLIC_BANK_NAME || "—";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Ödeme</h1>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--muted)]">Durumun</span>
          <Badge tone={payTone[profile.payment_status]}>
            {profile.payment_status}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--muted)]">Abonelik bitişi</span>
          <span className="font-medium">
            {formatDate(profile.subscription_end)}
          </span>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-[var(--primary-glow)]" />
          <h2 className="font-semibold">Havale Bilgileri</h2>
        </div>
        <div className="rounded-xl bg-[var(--surface-2)] p-3">
          <p className="text-xs text-[var(--muted)]">Alıcı</p>
          <p className="font-medium">{bankName}</p>
          <p className="mt-2 text-xs text-[var(--muted)]">IBAN</p>
          <p className="font-mono text-sm break-all">{iban}</p>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <Copy className="h-3.5 w-3.5" /> Ödeme sonrası koçuna dekontu iletmen
          yeterli.
        </p>
      </Card>
    </div>
  );
}
