"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Point = { date: string; weight: number | null; body_fat: number | null };

export function ProgressChart({ data }: { data: Point[] }) {
  if (data.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-[var(--muted)]">
        Grafik için en az iki kayıt gerekir.
      </p>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--foreground)",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            name="Kilo (kg)"
            stroke="var(--primary-glow)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--primary-glow)" }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="body_fat"
            name="Yağ (%)"
            stroke="var(--accent)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--accent)" }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
