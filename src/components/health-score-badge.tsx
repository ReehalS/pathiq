"use client";

import { healthScoreColor, healthScoreBg, healthScoreLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface HealthScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function HealthScoreBadge({
  score,
  size = "sm",
  showLabel = false,
}: HealthScoreBadgeProps) {
  const sizeClasses = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-14 w-14 text-lg",
  };

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          "relative rounded-full flex items-center justify-center font-bold text-white shrink-0",
          healthScoreBg(score),
          sizeClasses[size]
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span className={cn("text-xs font-medium", healthScoreColor(score))}>
          {healthScoreLabel(score)}
        </span>
      )}
    </div>
  );
}

interface HealthScoreDetailProps {
  score: number;
  growthRate: number | null;
  openings: number | null;
  salaryEntry: number | null;
  salaryYear10: number | null;
  layoffRisk: string;
}

export function HealthScoreDetail({
  score,
  growthRate,
  openings,
  salaryEntry,
  salaryYear10,
  layoffRisk,
}: HealthScoreDetailProps) {
  const entry = salaryEntry ?? 0;
  const yr10 = salaryYear10 ?? 0;
  const trajGrowth = entry > 0 ? Math.round(((yr10 - entry) / entry) * 100) : 0;

  const factors = [
    { label: "Growth Rate", value: growthRate != null ? `${growthRate > 0 ? "+" : ""}${growthRate}%` : "N/A", weight: "30%" },
    { label: "Job Openings", value: openings != null ? openings.toLocaleString() : "N/A", weight: "25%" },
    { label: "Salary Growth", value: entry > 0 ? `+${trajGrowth}% over 10yr` : "N/A", weight: "25%" },
    { label: "Layoff Risk", value: layoffRisk, weight: "20%" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <HealthScoreBadge score={score} size="lg" />
        <div>
          <p className={cn("text-lg font-bold", healthScoreColor(score))}>
            {healthScoreLabel(score)}
          </p>
          <p className="text-xs text-muted-foreground">Market Health Score</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted rounded-full h-2.5">
        <div
          className={cn("h-2.5 rounded-full transition-all", healthScoreBg(score))}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Factor breakdown */}
      <div className="grid grid-cols-2 gap-2">
        {factors.map((f) => (
          <div key={f.label} className="rounded-md border p-2">
            <p className="text-xs text-muted-foreground">
              {f.label} <span className="opacity-50">({f.weight})</span>
            </p>
            <p className="text-sm font-medium">{f.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
