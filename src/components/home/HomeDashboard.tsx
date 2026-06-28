"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  startOfWeek,
  addDays,
  isSameDay,
  format,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  Dumbbell,
  Flame,
  Scale,
  Percent,
  CalendarCheck,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Card } from "@/components/ui";
import { toggleDailyTask } from "@/app/panel/actions";
import type { DailyTask } from "@/lib/types";

type Props = {
  name: string;
  todayISO: string;
  weekDoneCount: number;
  latest: { weight: number | null; body_fat: number | null } | null;
  nextControl: string | null;
  todaySessionLabel: string | null;
  todayTasks: DailyTask[];
};

export function HomeDashboard({
  name,
  todayISO,
  weekDoneCount,
  latest,
  nextControl,
  todaySessionLabel,
  todayTasks,
}: Props) {
  const today = new Date(todayISO + "T00:00:00");
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-5">
      {/* selamlama */}
      <div className="pt-1">
        <p className="text-sm text-[var(--muted)]">Hadi başlayalım,</p>
        <h1 className="text-3xl font-black tracking-tight">
          {name.split(" ")[0] || "Sporcu"} 💪
        </h1>
      </div>

      {/* haftalık şerit */}
      <div className="flex justify-between gap-1.5">
        {days.map((d) => {
          const active = isSameDay(d, today);
          return (
            <div
              key={d.toISOString()}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl border py-2 text-xs",
                active
                  ? "border-transparent brand-gradient text-white"
                  : "border-[var(--border)] text-[var(--muted)]",
              )}
            >
              <span className="uppercase">{format(d, "EEEEEE", { locale: tr })}</span>
              <span className={cn("text-base font-bold", active && "text-white")}>
                {format(d, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* bugünkü görev */}
      <div>
        <h2 className="mb-2 font-semibold">Bugün</h2>
        <div className="space-y-2">
          {todaySessionLabel && (
            <Link href="/panel/takvim">
              <Card className="flex items-center justify-between hover:border-[var(--primary)]/50">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary)]/15 text-[var(--primary-glow)]">
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{todaySessionLabel}</p>
                    <p className="text-xs text-[var(--muted)]">Antrenmanı başlat</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--muted)]" />
              </Card>
            </Link>
          )}

          {todayTasks.map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}

          {!todaySessionLabel && todayTasks.length === 0 && (
            <Card className="py-6 text-center text-sm text-[var(--muted)]">
              Bugün için planlanmış görev yok. Dinlenme günü olabilir 😌
            </Card>
          )}
        </div>
      </div>

      {/* ilerleme widget'ları */}
      <div>
        <h2 className="mb-2 font-semibold">Gelişimim</h2>
        <div className="grid grid-cols-2 gap-3">
          <Widget
            icon={Scale}
            label="Kilo"
            value={latest?.weight != null ? `${latest.weight} kg` : "—"}
          />
          <Widget
            icon={Percent}
            label="Yağ Oranı"
            value={latest?.body_fat != null ? `%${latest.body_fat}` : "—"}
          />
          <Widget
            icon={Flame}
            label="Bu Hafta"
            value={`${weekDoneCount} antrenman`}
          />
          <Widget
            icon={CalendarCheck}
            label="Sonraki Kontrol"
            value={formatDate(nextControl)}
          />
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task }: { task: DailyTask }) {
  const [pending, start] = useTransition();
  return (
    <Card
      className={cn(
        "flex items-center justify-between transition",
        task.done && "opacity-60",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--accent)]/15 text-[var(--accent)]">
          <Flame className="h-5 w-5" />
        </div>
        <div>
          <p className={cn("font-medium", task.done && "line-through")}>
            {task.title}
          </p>
          {task.detail && (
            <p className="text-xs text-[var(--muted)]">{task.detail}</p>
          )}
        </div>
      </div>
      <button
        disabled={pending}
        onClick={() => start(() => toggleDailyTask(task.id, !task.done))}
        className={cn(
          "grid h-8 w-8 place-items-center rounded-full border-2 transition",
          task.done
            ? "border-transparent bg-[var(--success)] text-white"
            : "border-[var(--border)] text-transparent hover:border-[var(--success)]",
        )}
        aria-label="Tamamla"
      >
        <Check className="h-4 w-4" />
      </button>
    </Card>
  );
}

function Widget({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card className="space-y-1">
      <Icon className="h-5 w-5 text-[var(--primary-glow)]" />
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-xs text-[var(--muted)]">{label}</p>
    </Card>
  );
}
