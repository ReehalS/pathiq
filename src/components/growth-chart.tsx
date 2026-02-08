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
  ReferenceLine,
} from "recharts";
import { Career } from "@/lib/types";

interface GrowthChartProps {
  careers: Career[];
}

function CustomTooltip({ active, payload }: {
  active?: boolean;
  payload?: Array<{ payload: { title: string; growth: number; openings: number } }>;
}) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="font-medium text-sm">{data.title}</p>
      <p className="text-sm text-muted-foreground">
        Growth: {data.growth > 0 ? "+" : ""}{data.growth}%
      </p>
      <p className="text-sm text-muted-foreground">
        Openings: {data.openings?.toLocaleString()}/yr
      </p>
    </div>
  );
}

export function GrowthChart({ careers }: GrowthChartProps) {
  const data = careers
    .filter((c) => c.growth_rate_numeric != null)
    .sort((a, b) => (b.growth_rate_numeric || 0) - (a.growth_rate_numeric || 0))
    .slice(0, 15)
    .map((c) => ({
      title: c.title.length > 20 ? c.title.slice(0, 18) + "..." : c.title,
      fullTitle: c.title,
      growth: c.growth_rate_numeric || 0,
      openings: c.current_openings || 0,
      category: c.category,
    }));

  if (data.length === 0) return null;

  const getColor = (growth: number) => {
    if (growth > 20) return "hsl(142, 71%, 45%)";
    if (growth > 10) return "hsl(142, 50%, 55%)";
    if (growth > 0) return "hsl(48, 96%, 53%)";
    return "hsl(0, 84%, 60%)";
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={(v) => `${v}%`}
          className="text-xs"
          tick={{ fontSize: 11 }}
        />
        <YAxis
          dataKey="title"
          type="category"
          width={140}
          className="text-xs"
          tick={{ fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine x={0} stroke="hsl(var(--border))" />
        <Bar dataKey="growth" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={getColor(entry.growth)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
