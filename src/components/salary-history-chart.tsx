"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { MarketTrend } from "@/lib/types";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

interface SalaryHistoryChartProps {
  trends: MarketTrend[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { year: string; salary: number } }>;
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="font-medium text-sm">{data.year}</p>
      <p className="text-sm text-muted-foreground">
        Median Salary: {formatCurrency(data.salary)}
      </p>
    </div>
  );
}

export function SalaryHistoryChart({ trends }: SalaryHistoryChartProps) {
  const data = trends
    .filter((t) => t.average_salary != null)
    .map((t) => ({
      year: new Date(t.date).getFullYear().toString(),
      salary: t.average_salary!,
    }));

  if (data.length < 2) return null;

  const first = data[0].salary;
  const last = data[data.length - 1].salary;
  const pctChange = ((last - first) / first * 100).toFixed(1);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-muted-foreground">
          {data[0].year} → {data[data.length - 1].year}
        </span>
        <span className={`text-sm font-medium ${Number(pctChange) >= 0 ? "text-green-600" : "text-red-600"}`}>
          {Number(pctChange) >= 0 ? "+" : ""}{pctChange}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="salaryHistGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="year" className="text-xs" tick={{ fontSize: 11 }} />
          <YAxis
            tickFormatter={(v) => formatCompactCurrency(v)}
            className="text-xs"
            tick={{ fontSize: 11 }}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="salary"
            stroke="hsl(221, 83%, 53%)"
            fill="url(#salaryHistGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
