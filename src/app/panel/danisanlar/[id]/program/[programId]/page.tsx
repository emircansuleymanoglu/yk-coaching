import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Eye, BookmarkPlus } from "lucide-react";
import { saveAsTemplate } from "@/app/panel/sablonlar/actions";
import { requireCoach } from "@/lib/dal";
import { getFullProgram, type FullProgram } from "@/lib/queries";
import { sumMacros, kcalFromMacros } from "@/lib/macros";
import { Button, Card, Input } from "@/components/ui";
import { ExerciseMediaUpload } from "@/components/program/ExerciseMediaUpload";
import {
  updateProgramMeta,
  addMeal,
  deleteMeal,
  addMealItem,
  deleteMealItem,
  addSupplement,
  deleteSupplement,
  addWorkoutDay,
  deleteWorkoutDay,
  addExercise,
  deleteExercise,
} from "./actions";

export default async function ProgramEditor({
  params,
}: {
  params: Promise<{ id: string; programId: string }>;
}) {
  await requireCoach();
  const { id: clientId, programId } = await params;
  const full = await getFullProgram(programId);
  if (!full) notFound();

  const ids = (
    <>
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="program_id" value={programId} />
    </>
  );

  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/panel/danisanlar/${clientId}`}
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)]"
        >
          <ArrowLeft className="h-4 w-4" /> Danışan
        </Link>
        <Link href={`/panel/danisanlar/${clientId}`}>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" /> Önizle
          </Button>
        </Link>
      </div>

      <Card className="space-y-2">
        <div className="flex items-center gap-2">
          <BookmarkPlus className="h-4 w-4 text-[var(--primary-glow)]" />
          <h2 className="text-sm font-semibold">Şablon olarak kaydet</h2>
        </div>
        <p className="text-xs text-[var(--muted)]">
          Bu programı kaydet, başka danışanlara tek tıkla uygula.
        </p>
        <form
          action={saveAsTemplate.bind(null, programId, clientId)}
          className="flex gap-2"
        >
          <Input
            name="title"
            placeholder={full.program.title}
            className="flex-1"
          />
          <Button type="submit" variant="outline" size="md">
            Kaydet
          </Button>
        </form>
      </Card>

      <ProgramMetaSection full={full} ids={ids} />
      <NutritionSection full={full} ids={ids} />
      <SupplementSection full={full} ids={ids} />
      <WorkoutSection
        full={full}
        ids={ids}
        clientId={clientId}
        programId={programId}
      />
    </div>
  );
}

/* --------------------------- Program bilgisi --------------------------- */
function ProgramMetaSection({
  full,
  ids,
}: {
  full: FullProgram;
  ids: React.ReactNode;
}) {
  const p = full.program;
  return (
    <Card>
      <h2 className="mb-3 font-semibold">Program Bilgisi</h2>
      <form action={updateProgramMeta} className="grid gap-3">
        {ids}
        <Field label="Başlık">
          <Input name="title" defaultValue={p.title} />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Hafta">
            <Input name="weeks" type="number" defaultValue={p.weeks} />
          </Field>
          <Field label="Kontrol">
            <Input
              name="control_date"
              type="date"
              defaultValue={p.control_date ?? ""}
            />
          </Field>
          <Field label="Gelecek">
            <Input
              name="next_control"
              type="date"
              defaultValue={p.next_control ?? ""}
            />
          </Field>
        </div>
        <Button type="submit" size="sm" className="justify-self-start">
          Kaydet
        </Button>
      </form>
    </Card>
  );
}

/* --------------------------- Beslenme --------------------------- */
function NutritionSection({
  full,
  ids,
}: {
  full: FullProgram;
  ids: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Beslenme</h2>
      {full.nutrition.map((plan) => {
        const totals = sumMacros(plan.meals.flatMap((m) => m.items));
        return (
          <Card key={plan.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--primary-glow)]">
                {plan.day_type === "low" ? "Low Günler" : "High Günler"}
              </h3>
              <span className="text-sm font-semibold">{totals.kcal} kcal</span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Toplam — P {totals.protein} · K {totals.carb} · Y {totals.fat}
            </p>

            {plan.meals.map((meal) => {
              const mt = sumMacros(meal.items);
              return (
                <div
                  key={meal.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{meal.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--muted)]">
                        {mt.kcal} kcal
                      </span>
                      <DeleteBtn action={deleteMeal} field="meal_id" id={meal.id}>
                        {ids}
                      </DeleteBtn>
                    </div>
                  </div>

                  <div className="mt-2 divide-y divide-[var(--border)]">
                    {meal.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between py-1.5 text-sm"
                      >
                        <span>{it.food_name}</span>
                        <div className="flex items-center gap-2 text-[var(--muted)]">
                          <span className="text-xs">
                            {it.grams}g · {kcalFromMacros(it)}kcal
                          </span>
                          <DeleteBtn
                            action={deleteMealItem}
                            field="item_id"
                            id={it.id}
                          >
                            {ids}
                          </DeleteBtn>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* besin ekle */}
                  <form
                    action={addMealItem}
                    className="mt-2 grid grid-cols-12 gap-1.5"
                  >
                    {ids}
                    <input type="hidden" name="meal_id" value={meal.id} />
                    <input
                      name="food_name"
                      placeholder="Besin"
                      required
                      className="col-span-5 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm outline-none"
                    />
                    <NumCell name="grams" ph="gr" />
                    <NumCell name="protein" ph="P" />
                    <NumCell name="carb" ph="K" />
                    <NumCell name="fat" ph="Y" />
                    <button
                      className="col-span-1 grid h-9 place-items-center rounded-lg brand-gradient text-white"
                      aria-label="Ekle"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              );
            })}

            {/* öğün ekle */}
            <form action={addMeal} className="flex gap-2">
              {ids}
              <input type="hidden" name="plan_id" value={plan.id} />
              <input type="hidden" name="sort" value={plan.meals.length} />
              <input
                name="name"
                placeholder="Öğün adı (Öğün 1, Antrenman Sonrası…)"
                className="h-9 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm outline-none"
              />
              <Button type="submit" variant="outline" size="sm">
                <Plus className="h-4 w-4" /> Öğün
              </Button>
            </form>
          </Card>
        );
      })}
    </section>
  );
}

/* --------------------------- Takviye --------------------------- */
function SupplementSection({
  full,
  ids,
}: {
  full: FullProgram;
  ids: React.ReactNode;
}) {
  return (
    <Card className="space-y-3">
      <h2 className="font-semibold">Takviye & Vitamin</h2>
      <div className="divide-y divide-[var(--border)]">
        {full.supplements.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-xs text-[var(--muted)]">
                {[s.serving, s.timing].filter(Boolean).join(" · ")}
              </p>
            </div>
            <DeleteBtn action={deleteSupplement} field="supp_id" id={s.id}>
              {ids}
            </DeleteBtn>
          </div>
        ))}
      </div>
      <form action={addSupplement} className="grid grid-cols-12 gap-1.5">
        {ids}
        <input
          name="name"
          placeholder="Ad (Kreatin)"
          required
          className="col-span-5 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 text-sm outline-none"
        />
        <input
          name="serving"
          placeholder="5 gr"
          className="col-span-3 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 text-sm outline-none"
        />
        <input
          name="timing"
          placeholder="Sabah"
          className="col-span-3 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2 text-sm outline-none"
        />
        <button
          className="col-span-1 grid h-9 place-items-center rounded-lg brand-gradient text-white"
          aria-label="Ekle"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </Card>
  );
}

/* --------------------------- Antrenman --------------------------- */
function WorkoutSection({
  full,
  ids,
  clientId,
  programId,
}: {
  full: FullProgram;
  ids: React.ReactNode;
  clientId: string;
  programId: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-semibold">Antrenman</h2>
      {full.workouts.map((day) => (
        <Card key={day.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--primary-glow)]">
              {day.name}
            </h3>
            <DeleteBtn action={deleteWorkoutDay} field="day_id" id={day.id}>
              {ids}
            </DeleteBtn>
          </div>

          {day.exercises.map((ex) => (
            <div
              key={ex.id}
              className="rounded-lg bg-[var(--surface-2)] px-3 py-2"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">{ex.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {[ex.sets, ex.reps, ex.rest].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <DeleteBtn action={deleteExercise} field="ex_id" id={ex.id}>
                  {ids}
                </DeleteBtn>
              </div>
              <div className="mt-1">
                <ExerciseMediaUpload
                  exerciseId={ex.id}
                  clientId={clientId}
                  programId={programId}
                  hasImage={!!(ex.image_url || ex.video_url)}
                />
              </div>
            </div>
          ))}

          {/* egzersiz ekle */}
          <form action={addExercise} className="grid grid-cols-12 gap-1.5">
            {ids}
            <input type="hidden" name="day_id" value={day.id} />
            <input
              name="name"
              placeholder="Egzersiz"
              required
              className="col-span-5 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm outline-none"
            />
            <input
              name="sets"
              placeholder="Set"
              className="col-span-2 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm outline-none"
            />
            <input
              name="reps"
              placeholder="Tekrar"
              className="col-span-2 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm outline-none"
            />
            <input
              name="rest"
              placeholder="Dinl."
              className="col-span-2 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-sm outline-none"
            />
            <button
              className="col-span-1 grid h-9 place-items-center rounded-lg brand-gradient text-white"
              aria-label="Ekle"
            >
              <Plus className="h-4 w-4" />
            </button>
          </form>
        </Card>
      ))}

      {/* gün ekle */}
      <form action={addWorkoutDay} className="flex gap-2">
        {ids}
        <input type="hidden" name="sort" value={full.workouts.length} />
        <input
          name="name"
          placeholder="Gün adı (Gün 1 Pull A…)"
          className="h-9 flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm outline-none"
        />
        <Button type="submit" variant="outline" size="sm">
          <Plus className="h-4 w-4" /> Gün
        </Button>
      </form>
    </section>
  );
}

/* --------------------------- yardımcılar --------------------------- */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-[var(--muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function NumCell({ name, ph }: { name: string; ph: string }) {
  return (
    <input
      name={name}
      type="number"
      step="any"
      placeholder={ph}
      className="col-span-1 h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-1 text-center text-xs outline-none"
    />
  );
}

function DeleteBtn({
  action,
  field,
  id,
  children,
}: {
  action: (fd: FormData) => Promise<void>;
  field: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <form action={action}>
      {children}
      <input type="hidden" name={field} value={id} />
      <button
        className="grid h-7 w-7 place-items-center rounded-lg text-[var(--muted)] hover:bg-[var(--danger)]/15 hover:text-[var(--danger)]"
        aria-label="Sil"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </form>
  );
}
