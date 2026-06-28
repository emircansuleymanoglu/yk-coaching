"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, Trash2, Save, Dumbbell } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  saveSetLog,
  deleteSetLog,
  completeSession,
  reopenSession,
} from "@/app/panel/takvim/actions";

type ExerciseDef = {
  id: string;
  name: string;
  sets: string | null;
  reps: string | null;
  rest: string | null;
  image_url: string | null;
  video_url: string | null;
};

type LogRow = {
  logId: string | null;
  setNo: number;
  reps: string;
  weight: string;
  done: boolean;
};

type ExistingLog = {
  id: string;
  exercise_id: string | null;
  set_no: number;
  reps: number | null;
  weight: number | null;
  done: boolean;
};

export function WorkoutLogger({
  sessionId,
  date,
  status,
  exercises,
  existing,
}: {
  sessionId: string;
  date: string;
  status: string;
  exercises: ExerciseDef[];
  existing: ExistingLog[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [completed, setCompleted] = useState(status === "completed");

  // egzersiz bazında set satırları
  const [rows, setRows] = useState<Record<string, LogRow[]>>(() => {
    const map: Record<string, LogRow[]> = {};
    for (const ex of exercises) {
      const logs = existing
        .filter((l) => l.exercise_id === ex.id)
        .sort((a, b) => a.set_no - b.set_no);
      map[ex.id] = logs.length
        ? logs.map((l) => ({
            logId: l.id,
            setNo: l.set_no,
            reps: l.reps?.toString() ?? "",
            weight: l.weight?.toString() ?? "",
            done: l.done,
          }))
        : [{ logId: null, setNo: 1, reps: "", weight: "", done: false }];
    }
    return map;
  });

  function addSet(exId: string) {
    setRows((r) => {
      const list = r[exId] ?? [];
      return {
        ...r,
        [exId]: [
          ...list,
          { logId: null, setNo: list.length + 1, reps: "", weight: "", done: false },
        ],
      };
    });
  }

  function update(exId: string, idx: number, patch: Partial<LogRow>) {
    setRows((r) => {
      const list = [...(r[exId] ?? [])];
      list[idx] = { ...list[idx], ...patch };
      return { ...r, [exId]: list };
    });
  }

  async function persist(exId: string, exName: string, idx: number) {
    const row = rows[exId][idx];
    const res = await saveSetLog({
      sessionId,
      exerciseId: exId,
      exerciseName: exName,
      setNo: row.setNo,
      reps: row.reps ? parseInt(row.reps, 10) : null,
      weight: row.weight ? parseFloat(row.weight.replace(",", ".")) : null,
      done: row.done,
      logId: row.logId,
    });
    return res;
  }

  function saveRow(exId: string, exName: string, idx: number) {
    start(async () => {
      await persist(exId, exName, idx);
      router.refresh();
    });
  }

  async function removeRow(exId: string, idx: number) {
    const row = rows[exId][idx];
    if (row.logId) await deleteSetLog(row.logId);
    setRows((r) => ({
      ...r,
      [exId]: r[exId].filter((_, i) => i !== idx),
    }));
  }

  function finish() {
    start(async () => {
      // önce tüm satırları kaydet
      for (const ex of exercises) {
        for (let i = 0; i < (rows[ex.id]?.length ?? 0); i++) {
          const row = rows[ex.id][i];
          if (row.reps || row.weight || row.done) {
            await persist(ex.id, ex.name, i);
          }
        }
      }
      await completeSession(sessionId, date);
      setCompleted(true);
      router.refresh();
    });
  }

  function reopen() {
    start(async () => {
      await reopenSession(sessionId, date);
      setCompleted(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {exercises.map((ex) => (
        <Card key={ex.id} className="space-y-2">
          <div className="flex gap-3">
            {ex.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ex.image_url}
                alt={ex.name}
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-[var(--surface-2)] text-[var(--muted)]">
                <Dumbbell className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold">{ex.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {[ex.sets, ex.reps, ex.rest].filter(Boolean).join(" · ")}
              </p>
              {ex.video_url && (
                <a
                  href={ex.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[var(--primary-glow)]"
                >
                  ▶ Demo videosu
                </a>
              )}
            </div>
          </div>

          {/* set satırları */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-12 gap-1.5 px-1 text-[10px] uppercase text-[var(--muted)]">
              <span className="col-span-2">Set</span>
              <span className="col-span-4">Tekrar</span>
              <span className="col-span-4">Kilo (kg)</span>
              <span className="col-span-2 text-right">✓</span>
            </div>
            {(rows[ex.id] ?? []).map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 items-center gap-1.5">
                <span className="col-span-2 pl-2 text-sm text-[var(--muted)]">
                  {idx + 1}
                </span>
                <input
                  inputMode="numeric"
                  value={row.reps}
                  disabled={completed}
                  onChange={(e) => update(ex.id, idx, { reps: e.target.value })}
                  onBlur={() => saveRow(ex.id, ex.name, idx)}
                  className="col-span-4 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 text-center text-sm outline-none focus:border-[var(--primary)]"
                />
                <input
                  inputMode="decimal"
                  value={row.weight}
                  disabled={completed}
                  onChange={(e) => update(ex.id, idx, { weight: e.target.value })}
                  onBlur={() => saveRow(ex.id, ex.name, idx)}
                  className="col-span-4 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 text-center text-sm outline-none focus:border-[var(--primary)]"
                />
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button
                    disabled={completed}
                    onClick={() => {
                      update(ex.id, idx, { done: !row.done });
                      start(async () => {
                        await saveSetLog({
                          sessionId,
                          exerciseId: ex.id,
                          exerciseName: ex.name,
                          setNo: row.setNo,
                          reps: row.reps ? parseInt(row.reps, 10) : null,
                          weight: row.weight
                            ? parseFloat(row.weight.replace(",", "."))
                            : null,
                          done: !row.done,
                          logId: row.logId,
                        });
                        router.refresh();
                      });
                    }}
                    className={cn(
                      "grid h-7 w-7 place-items-center rounded-md border",
                      row.done
                        ? "border-transparent bg-[var(--success)] text-white"
                        : "border-[var(--border)] text-transparent",
                    )}
                    aria-label="Set tamam"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  {!completed && (
                    <button
                      onClick={() => removeRow(ex.id, idx)}
                      className="text-[var(--muted)] hover:text-[var(--danger)]"
                      aria-label="Sil"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!completed && (
            <button
              onClick={() => addSet(ex.id)}
              className="flex items-center gap-1 text-xs font-medium text-[var(--primary-glow)]"
            >
              <Plus className="h-3.5 w-3.5" /> Set ekle
            </button>
          )}
        </Card>
      ))}

      {completed ? (
        <Button variant="outline" className="w-full" disabled={pending} onClick={reopen}>
          Tamamlandı ✓ — Yeniden aç
        </Button>
      ) : (
        <Button size="lg" className="w-full" disabled={pending} onClick={finish}>
          <Save className="h-4 w-4" /> Antrenmanı Tamamla
        </Button>
      )}
    </div>
  );
}
