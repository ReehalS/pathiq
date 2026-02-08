"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Career } from "@/lib/types";

interface CategoryChartProps {
  careers: Career[];
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

const CATEGORY_LABELS: Record<string, string> = {
  tech: "Technology",
  business: "Business",
  healthcare: "Healthcare",
  engineering: "Engineering",
  science: "Science",
  law: "Law & Policy",
  education: "Education",
  creative: "Creative",
  alternative: "Alternative",
};

export function CategoryChart({ careers }: CategoryChartProps) {
  const counts: Record<string, number> = {};
  careers.forEach((c) => {
    counts[c.category] = (counts[c.category] || 0) + 1;
  });

  const data = Object.entries(counts)
    .map(([category, count]) => ({
      name: CATEGORY_LABELS[category] || category,
      value: count,
      category,
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          label={({ name, value }) => `${name} (${value})`}
          labelLine={{ strokeWidth: 1 }}
        >
          {data.map((entry) => (
            <Cell
              key={entry.category}
              fill={CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.alternative}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => [`${value} paths`]}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
