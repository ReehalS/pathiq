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
import { formatCompactNumber } from "@/lib/utils";

interface EmploymentTrendChartProps {
  trends: MarketTrend[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { year: string; employment: number } }>;
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="font-medium text-sm">{data.year}</p>
      <p className="text-sm text-muted-foreground">
        Employment: {data.employment.toLocaleString()}
      </p>
    </div>
  );
}

export function EmploymentTrendChart({ trends }: EmploymentTrendChartProps) {
  const data = trends
    .filter((t) => t.employment_count != null)
    .map((t) => ({
      year: new Date(t.date).getFullYear().toString(),
      employment: t.employment_count!,
    }));

  if (data.length < 2) return null;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="employmentGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.2} />
            <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="year" className="text-xs" tick={{ fontSize: 11 }} />
        <YAxis
          tickFormatter={(v) => formatCompactNumber(v)}
          className="text-xs"
          tick={{ fontSize: 11 }}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="employment"
          stroke="hsl(142, 71%, 45%)"
          fill="url(#employmentGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
