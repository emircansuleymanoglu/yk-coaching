"use client";

import { useState } from "react";
import { Utensils, Dumbbell, Pill, Flame } from "lucide-react";
import type { FullProgram } from "@/lib/queries";
import { sumMacros } from "@/lib/macros";
import { cn, formatDate } from "@/lib/utils";
import { Badge, Card } from "@/components/ui";

type Tab = "beslenme" | "antrenman" | "supplement";

export function ProgramView({ data }: { data: FullProgram }) {
  const [tab, setTab] = useState<Tab>("beslenme");
  const { program, nutrition, supplements, workouts } = data;

  return (
    <div className="space-y-4">
      {/* program başlığı */}
      <Card className="bg-gradient-to-br from-[var(--surface)] to-[var(--surface-2)]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{program.title}</h2>
            <p className="text-sm text-[var(--muted)]">
              {program.weeks} haftalık program
            </p>
          </div>
          <Badge tone="primary">{program.status}</Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-[var(--background)]/40 px-3 py-2">
            <p className="text-xs text-[var(--muted)]">Kontrol</p>
            <p className="font-semibold">{formatDate(program.control_date)}</p>
          </div>
          <div className="rounded-lg bg-[var(--background)]/40 px-3 py-2">
            <p className="text-xs text-[var(--muted)]">Gelecek kontrol</p>
            <p className="font-semibold">{formatDate(program.next_control)}</p>
          </div>
        </div>
      </Card>

      {/* sekmeler */}
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
        {(
          [
            ["beslenme", "Beslenme", Utensils],
            ["antrenman", "Antrenman", Dumbbell],
            ["supplement", "Takviye", Pill],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition",
              tab === key
                ? "brand-gradient text-white"
                : "text-[var(--muted)]",
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "beslenme" && <NutritionTab plans={nutrition} />}
      {tab === "antrenman" && <WorkoutTab days={workouts} />}
      {tab === "supplement" && <SupplementTab items={supplements} />}
    </div>
  );
}

/* ----------------------------- Beslenme ----------------------------- */
function NutritionTab({ plans }: { plans: FullProgram["nutrition"] }) {
  const [dayType, setDayType] = useState<"low" | "high">(
    plans.find((p) => p.day_type === "low") ? "low" : "high",
  );
  const active = plans.find((p) => p.day_type === dayType) ?? plans[0];

  if (!plans.length) return <Empty text="Henüz beslenme planı eklenmemiş." />;

  const allItems = active.meals.flatMap((m) => m.items);
  const totals = sumMacros(allItems);

  return (
    <div className="space-y-3">
      {plans.length > 1 && (
        <div className="flex gap-2">
          {(["low", "high"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDayType(d)}
              className={cn(
                "flex-1 rounded-xl border py-2 text-sm font-semibold",
                dayType === d
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary-glow)]"
                  : "border-[var(--border)] text-[var(--muted)]",
              )}
            >
              {d === "low" ? "Low Günler" : "High Günler"}
            </button>
          ))}
        </div>
      )}

      {/* günlük toplam */}
      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-[var(--accent)]" />
          <span className="text-sm text-[var(--muted)]">Günlük toplam</span>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{totals.kcal} kcal</p>
          <p className="text-xs text-[var(--muted)]">
            P {totals.protein} · K {totals.carb} · Y {totals.fat}
          </p>
        </div>
      </Card>

      {active.meals.map((meal) => {
        const mt = sumMacros(meal.items);
        return (
          <Card key={meal.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{meal.name}</h3>
              <span className="text-xs text-[var(--muted)]">{mt.kcal} kcal</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {meal.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between py-1.5 text-sm"
                >
                  <span>{it.food_name}</span>
                  <span className="text-[var(--muted)]">{it.grams} g</span>
                </div>
              ))}
              {!meal.items.length && (
                <p className="py-1.5 text-sm text-[var(--muted)]">
                  Besin eklenmemiş
                </p>
              )}
            </div>
            {meal.notes && (
              <p className="text-xs text-[var(--muted)]">{meal.notes}</p>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ----------------------------- Antrenman ----------------------------- */
function WorkoutTab({ days }: { days: FullProgram["workouts"] }) {
  if (!days.length) return <Empty text="Henüz antrenman günü eklenmemiş." />;
  return (
    <div className="space-y-3">
      {days.map((day) => (
        <Card key={day.id} className="space-y-2">
          <h3 className="font-semibold text-[var(--primary-glow)]">{day.name}</h3>
          <div className="space-y-2">
            {day.exercises.map((ex) => (
              <div
                key={ex.id}
                className="rounded-lg bg-[var(--surface-2)] px-3 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{ex.name}</span>
                  {ex.rest && (
                    <span className="text-xs text-[var(--muted)]">
                      ⏱ {ex.rest}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[var(--muted)]">
                  {[ex.sets, ex.reps].filter(Boolean).join(" · ")}
                </p>
                {ex.notes && (
                  <p className="mt-1 text-xs text-[var(--muted)]">{ex.notes}</p>
                )}
              </div>
            ))}
            {!day.exercises.length && (
              <p className="text-sm text-[var(--muted)]">Egzersiz eklenmemiş</p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ----------------------------- Supplement ----------------------------- */
function SupplementTab({ items }: { items: FullProgram["supplements"] }) {
  if (!items.length) return <Empty text="Henüz takviye eklenmemiş." />;
  const vitamins = items.filter((i) => i.kind === "vitamin");
  const supps = items.filter((i) => i.kind === "supplement");

  return (
    <div className="space-y-3">
      {[
        ["Takviyeler", supps],
        ["Vitamin / Mineral", vitamins],
      ].map(([title, list]) =>
        (list as typeof items).length ? (
          <Card key={title as string} className="space-y-2">
            <h3 className="font-semibold">{title as string}</h3>
            <div className="divide-y divide-[var(--border)]">
              {(list as typeof items).map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    {s.timing && (
                      <p className="text-xs text-[var(--muted)]">{s.timing}</p>
                    )}
                  </div>
                  {s.serving && (
                    <Badge tone="primary">{s.serving}</Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ) : null,
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card className="py-8 text-center text-sm text-[var(--muted)]">{text}</Card>
  );
}
