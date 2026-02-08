"use client";

import { Career } from "@/lib/types";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";
import { getCategoryColor } from "@/lib/constants";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SweetSpotChartProps {
  careers: Career[];
}

const CATEGORY_FILL: Record<string, string> = {
  tech: "hsl(221, 83%, 53%)",
  business: "hsl(160, 60%, 45%)",
  healthcare: "hsl(0, 72%, 51%)",
  engineering: "hsl(25, 95%, 53%)",
  science: "hsl(271, 81%, 56%)",
  law: "hsl(45, 93%, 47%)",
  education: "hsl(189, 94%, 43%)",
  creative: "hsl(330, 81%, 60%)",
  alternative: "hsl(220, 9%, 46%)",
};

interface DataPoint {
  title: string;
  id: string;
  salary: number;
  openings: number;
  growth: number;
  category: string;
  healthScore: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DataPoint }>;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md max-w-[220px]">
      <p className="font-semibold text-sm">{d.title}</p>
      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
        <p>
          Salary: <span className="font-medium text-foreground">{formatCurrency(d.salary)}</span>
        </p>
        <p>
          Openings: <span className="font-medium text-foreground">{formatCompactNumber(d.openings)}</span>
        </p>
        <p>
          Growth: <span className="font-medium text-foreground">{d.growth > 0 ? "+" : ""}{d.growth}%</span>
        </p>
        <p>
          Health: <span className="font-medium text-foreground">{d.healthScore}/100</span>
        </p>
      </div>
    </div>
  );
}

export function SweetSpotChart({ careers }: SweetSpotChartProps) {
  const data: DataPoint[] = careers
    .filter((c) => c.salary_median && c.current_openings)
    .map((c) => ({
      title: c.title,
      id: c.id,
      salary: c.salary_median!,
      openings: c.current_openings!,
      growth: c.growth_rate_numeric ?? 0,
      category: c.category,
      healthScore: c.market_health_score ?? 0,
    }));

  const categories = [...new Set(data.map((d) => d.category))];

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={420}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="salary"
            name="Median Salary"
            type="number"
            tickFormatter={(v) => `$${Math.round(v / 1000)}K`}
            className="text-xs"
            tick={{ fontSize: 11 }}
            label={{ value: "Median Salary", position: "insideBottom", offset: -5, fontSize: 11 }}
          />
          <YAxis
            dataKey="openings"
            name="Annual Openings"
            type="number"
            scale="log"
            domain={["auto", "auto"]}
            tickFormatter={(v) => formatCompactNumber(v)}
            className="text-xs"
            tick={{ fontSize: 11 }}
            width={55}
            label={{ value: "Openings (log)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
          />
          <ZAxis
            dataKey="growth"
            range={[60, 400]}
            name="Growth Rate"
          />
          <Tooltip content={<CustomTooltip />} />
          <Scatter data={data} strokeWidth={1} stroke="hsl(var(--border))">
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={CATEGORY_FILL[d.category] || "hsl(220, 9%, 46%)"}
                fillOpacity={0.75}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.sort().map((cat) => (
          <div key={cat} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: CATEGORY_FILL[cat] || "#888" }}
            />
            <span className="capitalize">{cat}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-center text-muted-foreground">
        Bubble size represents projected growth rate. Top-right = high salary + high demand.
      </p>
    </div>
  );
}
