"use client";

import { useState } from "react";
import { Career } from "@/lib/types";
import { formatCurrency, interpolateSalary } from "@/lib/utils";

interface PercentileCalculatorProps {
  career: Career;
}

export function PercentileCalculator({ career }: PercentileCalculatorProps) {
  const [percentile, setPercentile] = useState(50);

  const salary = interpolateSalary(
    percentile,
    career.salary_p25,
    career.salary_median,
    career.salary_p75,
    career.salary_p90
  );

  if (salary == null) return null;

  // Build known markers for the track
  const markers: { pct: number; label: string; value: number }[] = [];
  if (career.salary_p25 != null) markers.push({ pct: 25, label: "P25", value: career.salary_p25 });
  if (career.salary_median != null) markers.push({ pct: 50, label: "P50", value: career.salary_median });
  if (career.salary_p75 != null) markers.push({ pct: 75, label: "P75", value: career.salary_p75 });
  if (career.salary_p90 != null) markers.push({ pct: 90, label: "P90", value: career.salary_p90 });

  const minPct = markers.length > 0 ? markers[0].pct : 25;
  const maxPct = markers.length > 0 ? markers[markers.length - 1].pct : 90;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          At the <span className="font-semibold text-foreground">{percentile}th</span> percentile
        </p>
        <p className="text-3xl font-bold tracking-tight mt-1">{formatCurrency(salary)}</p>
        <p className="text-xs text-muted-foreground mt-0.5">estimated annual salary</p>
      </div>

      {/* Slider */}
      <div className="px-2">
        <input
          type="range"
          min={minPct}
          max={maxPct}
          value={percentile}
          onChange={(e) => setPercentile(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary bg-muted"
          aria-label="Salary percentile slider"
        />

        {/* Marker labels */}
        <div className="relative mt-1 h-5">
          {markers.map((m) => (
            <button
              key={m.pct}
              onClick={() => setPercentile(m.pct)}
              className="absolute -translate-x-1/2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              style={{ left: `${((m.pct - minPct) / (maxPct - minPct)) * 100}%` }}
              aria-label={`Set to ${m.label}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reference table */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {markers.map((m) => (
          <button
            key={m.pct}
            onClick={() => setPercentile(m.pct)}
            className={`rounded-md border p-2 transition-colors cursor-pointer ${
              percentile === m.pct
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
          >
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-sm font-semibold">{formatCurrency(m.value)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
