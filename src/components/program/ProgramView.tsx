"use client";

import { useState, useTransition } from "react";
import { Utensils, Dumbbell, Pill, Flame, Check, Droplet, Plus, Minus } from "lucide-react";
import type { FullProgram } from "@/lib/queries";
import { sumMacros } from "@/lib/macros";
import { cn, formatDate } from "@/lib/utils";
import { Badge, Card } from "@/components/ui";
import { toggleMealCheck, addWater } from "@/app/panel/program/actions";

type Tab = "beslenme" | "antrenman" | "supplement";

export type Compliance = {
  date: string;
  checkedMealIds: string[];
  water: { ml: number; target: number };
};

export function ProgramView({
  data,
  compliance,
}: {
  data: FullProgram;
  compliance?: Compliance;
}) {
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

      {tab === "beslenme" && (
        <NutritionTab plans={nutrition} compliance={compliance} />
      )}
      {tab === "antrenman" && <WorkoutTab days={workouts} />}
      {tab === "supplement" && <SupplementTab items={supplements} />}
    </div>
  );
}

/* ----------------------------- Beslenme ----------------------------- */
function NutritionTab({
  plans,
  compliance,
}: {
  plans: FullProgram["nutrition"];
  compliance?: Compliance;
}) {
  const [dayType, setDayType] = useState<"low" | "high">(
    plans.find((p) => p.day_type === "low") ? "low" : "high",
  );
  const active = plans.find((p) => p.day_type === dayType) ?? plans[0];

  if (!plans.length) return <Empty text="Henüz beslenme planı eklenmemiş." />;

  const allItems = active.meals.flatMap((m) => m.items);
  const totals = sumMacros(allItems);

  const checked = new Set(compliance?.checkedMealIds ?? []);
  const doneCount = active.meals.filter((m) => checked.has(m.id)).length;
  const pct = active.meals.length
    ? Math.round((doneCount / active.meals.length) * 100)
    : 0;

  return (
    <div className="space-y-3">
      {compliance && (
        <>
          <WaterCard date={compliance.date} water={compliance.water} />
          <Card className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Bugünkü Uyum</span>
              <span className="font-semibold text-[var(--primary-glow)]">
                %{pct}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full brand-gradient transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </Card>
        </>
      )}

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
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted)]">{mt.kcal} kcal</span>
                {compliance && (
                  <MealCheckButton
                    mealId={meal.id}
                    date={compliance.date}
                    initial={checked.has(meal.id)}
                  />
                )}
              </div>
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

/* ----------------------------- Su takibi ----------------------------- */
function WaterCard({
  date,
  water,
}: {
  date: string;
  water: { ml: number; target: number };
}) {
  const [ml, setMl] = useState(water.ml);
  const [, start] = useTransition();
  const pct = water.target ? Math.min(100, Math.round((ml / water.target) * 100)) : 0;

  function change(delta: number) {
    setMl((m) => Math.max(0, m + delta));
    start(() => addWater(date, delta, water.target));
  }

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-[var(--primary-glow)]" />
          <span className="font-medium">Su</span>
        </div>
        <span className="text-sm font-semibold">
          {(ml / 1000).toFixed(2)} / {(water.target / 1000).toFixed(1)} L
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className="h-full bg-[var(--primary-glow)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => change(-250)}
          className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] text-[var(--muted)]"
          aria-label="Azalt"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={() => change(250)}
          className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg brand-gradient text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> 250 ml
        </button>
        <button
          onClick={() => change(500)}
          className="flex h-9 flex-1 items-center justify-center gap-1 rounded-lg border border-[var(--border)] text-sm font-semibold"
        >
          <Plus className="h-4 w-4" /> 500 ml
        </button>
      </div>
    </Card>
  );
}

/* ----------------------------- Öğün işaretleme ----------------------------- */
function MealCheckButton({
  mealId,
  date,
  initial,
}: {
  mealId: string;
  date: string;
  initial: boolean;
}) {
  const [done, setDone] = useState(initial);
  const [, start] = useTransition();
  return (
    <button
      onClick={() => {
        const next = !done;
        setDone(next);
        start(() => toggleMealCheck(mealId, date, next));
      }}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-full border-2 transition",
        done
          ? "border-transparent bg-[var(--success)] text-white"
          : "border-[var(--border)] text-transparent",
      )}
      aria-label="Yedim"
    >
      <Check className="h-4 w-4" />
    </button>
  );
}
