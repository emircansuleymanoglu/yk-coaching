import { LineChart } from "lucide-react";
import { Card } from "@/components/ui";

export default function ProgressPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">İlerleme</h1>
      <Card className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--primary)]/12 text-[var(--primary-glow)]">
          <LineChart className="h-7 w-7" />
        </div>
        <div>
          <p className="font-semibold">Takip yakında</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Faz 2&apos;de haftalık kilo, ölçü, fotoğraf ve gelişim grafikleri
            burada olacak.
          </p>
        </div>
      </Card>
    </div>
  );
}
