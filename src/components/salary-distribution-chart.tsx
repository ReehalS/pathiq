"use client";

import { Career } from "@/lib/types";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SalaryDistributionChartProps {
  career: Career;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { label: string; value: number; description: string } }>;
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="font-medium text-sm">{data.label}</p>
      <p className="text-sm text-muted-foreground">{data.description}</p>
      <p className="text-sm font-bold">{formatCurrency(data.value)}</p>
    </div>
  );
}

const COLORS = [
  "hsl(221, 83%, 73%)",  // p25 - lighter
  "hsl(221, 83%, 53%)",  // median - primary
  "hsl(142, 71%, 50%)",  // p75
  "hsl(142, 50%, 40%)",  // p90 - darker green
];

export function SalaryDistributionChart({ career }: SalaryDistributionChartProps) {
  const points = [
    { label: "25th Pctl", value: career.salary_p25, description: "Bottom quartile", key: "p25" },
    { label: "Median", value: career.salary_median, description: "Median (50th percentile)", key: "median" },
    { label: "75th Pctl", value: career.salary_p75, description: "Upper quartile", key: "p75" },
    { label: "90th Pctl", value: career.salary_p90, description: "Top 10% earners", key: "p90" },
  ].filter((p) => p.value != null) as Array<{
    label: string;
    value: number;
    description: string;
    key: string;
  }>;

  if (points.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={points} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
        <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 11 }} />
        <YAxis
          tickFormatter={(v) => formatCompactCurrency(v)}
          className="text-xs"
          tick={{ fontSize: 11 }}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {points.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
