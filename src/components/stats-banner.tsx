"use client";

import { Career } from "@/lib/types";
import { formatCompactNumber, formatCompactCurrency } from "@/lib/utils";
import { Briefcase, TrendingUp, DollarSign, Sparkles } from "lucide-react";

interface StatsBannerProps {
  careers: Career[];
}

export function StatsBanner({ careers }: StatsBannerProps) {
  const totalPaths = careers.length;
  const totalOpenings = careers.reduce((sum, c) => sum + (c.current_openings || 0), 0);
  const trendingCount = careers.filter((c) => c.is_trending).length;
  const avgEntry = careers.reduce((sum, c) => sum + (c.salary_entry || 0), 0) / (careers.length || 1);

  const stats = [
    {
      label: "Career Paths",
      value: String(totalPaths),
      icon: Briefcase,
    },
    {
      label: "Job Openings",
      value: formatCompactNumber(totalOpenings),
      icon: TrendingUp,
    },
    {
      label: "Trending Paths",
      value: String(trendingCount),
      icon: Sparkles,
    },
    {
      label: "Avg Entry Salary",
      value: formatCompactCurrency(Math.round(avgEntry)),
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-lg border bg-card p-4"
        >
          <div className="rounded-md bg-primary/10 p-2">
            <stat.icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
