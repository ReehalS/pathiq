"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Career } from "@/lib/types";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";

interface SalaryChartProps {
  careers: Career[];
  showArea?: boolean;
}

const COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(0, 84%, 60%)",
  "hsl(280, 67%, 55%)",
];

function getTrajectoryData(careers: Career[]) {
  const points = [
    { year: "Entry", label: "Year 0" },
    { year: "Year 3", label: "Year 3" },
    { year: "Year 5", label: "Year 5" },
    { year: "Year 10", label: "Year 10" },
  ];

  return points.map((p) => {
    const entry: Record<string, string | number | null> = { year: p.year };
    careers.forEach((career) => {
      switch (p.year) {
        case "Entry":
          entry[career.id] = career.salary_entry;
          break;
        case "Year 3":
          entry[career.id] = career.salary_year3;
          break;
        case "Year 5":
          entry[career.id] = career.salary_year5;
          break;
        case "Year 10":
          entry[career.id] = career.salary_year10;
          break;
      }
    });
    return entry;
  });
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="font-medium text-sm mb-1">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-sm" style={{ color: item.color }}>
          {item.name}: {formatCurrency(item.value)}
        </p>
      ))}
    </div>
  );
}

export function SalaryChart({ careers, showArea = false }: SalaryChartProps) {
  const data = getTrajectoryData(careers);

  if (careers.length === 0) return null;

  if (showArea && careers.length === 1) {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.2} />
              <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="year" className="text-xs" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(v) => formatCompactCurrency(v)}
            className="text-xs"
            tick={{ fontSize: 12 }}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={careers[0].id}
            name={careers[0].title}
            stroke={COLORS[0]}
            fill="url(#salaryGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="year" className="text-xs" tick={{ fontSize: 12 }} />
        <YAxis
          tickFormatter={(v) => formatCompactCurrency(v)}
          className="text-xs"
          tick={{ fontSize: 12 }}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        {careers.map((career, i) => (
          <Line
            key={career.id}
            type="monotone"
            dataKey={career.id}
            name={career.title}
            stroke={COLORS[i % COLORS.length]}
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
