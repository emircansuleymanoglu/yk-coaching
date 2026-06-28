/**
 * Makro → kalori hesaplama yardımcıları.
 * Atwater faktörleri: protein 4, karbonhidrat 4, yağ 9 kcal/g.
 */

export const KCAL = { protein: 4, carb: 4, fat: 9 } as const;

export type MacroInput = {
  protein: number;
  carb: number;
  fat: number;
};

export function kcalFromMacros({ protein, carb, fat }: MacroInput): number {
  return Math.round(
    protein * KCAL.protein + carb * KCAL.carb + fat * KCAL.fat,
  );
}

export type MacroTotals = MacroInput & { kcal: number };

/** Bir öğündeki / programdaki besinlerin makro ve kalori toplamı. */
export function sumMacros(items: MacroInput[]): MacroTotals {
  const totals = items.reduce(
    (acc, it) => ({
      protein: acc.protein + (it.protein || 0),
      carb: acc.carb + (it.carb || 0),
      fat: acc.fat + (it.fat || 0),
    }),
    { protein: 0, carb: 0, fat: 0 },
  );
  return {
    protein: round1(totals.protein),
    carb: round1(totals.carb),
    fat: round1(totals.fat),
    kcal: kcalFromMacros(totals),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
