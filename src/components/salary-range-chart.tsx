"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ErrorBar,
} from "recharts";
import { Career } from "@/lib/types";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

interface SalaryRangeChartProps {
  careers: Career[];
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{
    payload: { title: string; entry: number; median: number; high: number; category: string };
  }>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="font-medium text-sm mb-1">{d.title}</p>
      <p className="text-xs text-muted-foreground">Entry: {formatCurrency(d.entry)}</p>
      <p className="text-xs text-muted-foreground">Median: {formatCurrency(d.median)}</p>
      <p className="text-xs text-muted-foreground">High (P90): {formatCurrency(d.high)}</p>
    </div>
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  tech: "hsl(221, 83%, 53%)",
  business: "hsl(160, 60%, 45%)",
  healthcare: "hsl(0, 72%, 51%)",
  engineering: "hsl(25, 95%, 53%)",
  science: "hsl(270, 60%, 55%)",
  law: "hsl(45, 93%, 47%)",
  education: "hsl(190, 80%, 42%)",
  creative: "hsl(330, 65%, 55%)",
  alternative: "hsl(0, 0%, 50%)",
};

export function SalaryRangeChart({ careers }: SalaryRangeChartProps) {
  const data = careers
    .filter((c) => c.salary_median != null)
    .sort((a, b) => (b.salary_median || 0) - (a.salary_median || 0))
    .slice(0, 15)
    .map((c) => ({
      title: c.title.length > 18 ? c.title.slice(0, 16) + "..." : c.title,
      fullTitle: c.title,
      entry: c.salary_entry || 0,
      median: c.salary_median || 0,
      high: c.salary_p90 || c.salary_year10 || 0,
      range: (c.salary_p90 || c.salary_year10 || 0) - (c.salary_entry || 0),
      category: c.category,
    }));

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => formatCompactCurrency(v)}
          className="text-xs"
          tick={{ fontSize: 11 }}
        />
        <YAxis
          dataKey="title"
          type="category"
          width={130}
          className="text-xs"
          tick={{ fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="median" radius={[0, 4, 4, 0]} name="Median Salary">
          {data.map((entry, i) => (
            <Cell key={i} fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.alternative} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
