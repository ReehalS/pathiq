"use client";

import { Career } from "@/lib/types";
import { formatCurrency, formatGrowthRate, formatCompactNumber, cn } from "@/lib/utils";
import { getPathTypeLabel } from "@/lib/constants";

interface ComparisonTableProps {
  careers: Career[];
}

type Row = {
  label: string;
  values: (string | number | null)[];
  format?: "currency" | "growth" | "number" | "text";
  highlightBest?: "highest" | "lowest" | null;
};

function formatValue(val: string | number | null, format?: string): string {
  if (val == null) return "N/A";
  switch (format) {
    case "currency":
      return formatCurrency(val as number);
    case "growth":
      return formatGrowthRate(val as number);
    case "number":
      return formatCompactNumber(val as number);
    default:
      return String(val);
  }
}

function getBestIndex(values: (string | number | null)[], mode: "highest" | "lowest"): number {
  let bestIdx = -1;
  let bestVal = mode === "highest" ? -Infinity : Infinity;
  values.forEach((v, i) => {
    if (v == null || typeof v !== "number") return;
    if (mode === "highest" && v > bestVal) {
      bestVal = v;
      bestIdx = i;
    }
    if (mode === "lowest" && v < bestVal) {
      bestVal = v;
      bestIdx = i;
    }
  });
  return bestIdx;
}

export function ComparisonTable({ careers }: ComparisonTableProps) {
  if (careers.length === 0) return null;

  const rows: Row[] = [
    { label: "Path Type", values: careers.map((c) => getPathTypeLabel(c.path_type)) },
    { label: "Median Salary", values: careers.map((c) => c.salary_median), format: "currency", highlightBest: "highest" },
    { label: "Entry Salary", values: careers.map((c) => c.salary_entry), format: "currency", highlightBest: "highest" },
    { label: "Year 10 Salary", values: careers.map((c) => c.salary_year10), format: "currency", highlightBest: "highest" },
    { label: "Growth Rate", values: careers.map((c) => c.growth_rate_numeric), format: "growth", highlightBest: "highest" },
    { label: "Current Openings", values: careers.map((c) => c.current_openings), format: "number", highlightBest: "highest" },
    { label: "Total Employed", values: careers.map((c) => c.employment_total), format: "number" },
    { label: "Min Education", values: careers.map((c) => c.minimum_degree) },
    { label: "Work-Life Balance", values: careers.map((c) => c.work_life_balance) },
    { label: "Remote Options", values: careers.map((c) => c.remote_options) },
    { label: "Layoff Risk", values: careers.map((c) => c.layoff_risk) },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium text-muted-foreground min-w-[140px]">Metric</th>
            {careers.map((c) => (
              <th key={c.id} className="text-left p-3 font-semibold min-w-[160px]">
                {c.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const bestIdx = row.highlightBest
              ? getBestIndex(row.values, row.highlightBest)
              : -1;

            return (
              <tr key={row.label} className="border-b hover:bg-muted/30">
                <td className="p-3 font-medium text-muted-foreground">{row.label}</td>
                {row.values.map((val, i) => (
                  <td
                    key={i}
                    className={cn(
                      "p-3",
                      i === bestIdx && "text-green-600 font-semibold bg-green-50"
                    )}
                  >
                    {formatValue(val, row.format)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
