import Link from "next/link";
import {
  Dumbbell,
  Utensils,
  LineChart,
  MessageCircle,
  ArrowRight,
  Smartphone,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui";

const features = [
  {
    icon: Utensils,
    title: "Beslenme Programı",
    desc: "Low/High günler, öğün ve gramajlı besinler — makrolar ve kalori otomatik hesaplanır.",
  },
  {
    icon: Dumbbell,
    title: "Antrenman Planı",
    desc: "Gün gün split, set/tekrar/dinlenme ve notlarla net bir program.",
  },
  {
    icon: LineChart,
    title: "İlerleme Takibi",
    desc: "Haftalık kilo, ölçü ve fotoğraflarla gelişimini grafikle gör.",
  },
  {
    icon: MessageCircle,
    title: "Doğrudan İletişim",
    desc: "Koçunla aynı yerde mesajlaş, geri bildirim al.",
  },
];

export default function Home() {
  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10">
      {/* arka plan parıltısı */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-[var(--primary-strong)]/25 to-transparent blur-2xl" />

      <header className="flex items-center justify-between py-6">
        <Logo />
        <Link href="/login">
          <Button variant="outline" size="sm">
            Giriş
          </Button>
        </Link>
      </header>

      <section className="mt-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
          <Smartphone className="h-3.5 w-3.5" /> Telefonuna uygulama gibi ekle
        </span>
        <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight">
          Programın artık <span className="brand-text">tek bir yerde</span>.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-balance text-[var(--muted)]">
          WhatsApp&apos;ta kaybolan dosyalar yok. Beslenme, antrenman ve
          gelişimin profesyonel bir panelde, cebinde.
        </p>
        <div className="mt-7 flex flex-col gap-3">
          <Link href="/login">
            <Button size="lg" className="w-full">
              Programıma Giriş Yap <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-12 grid gap-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="flex gap-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--primary)]/12 text-[var(--primary-glow)]">
              <f.icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-0.5 text-sm text-[var(--muted)]">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <footer className="mt-12 text-center text-xs text-[var(--muted)]">
        © {new Date().getFullYear()} YK Coaching · Yasin K.
      </footer>
    </main>
  );
}
