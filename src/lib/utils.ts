import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Career } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatCompactCurrency(n: number | null | undefined): string {
  if (n == null) return "N/A";
  if (n >= 1000) {
    return `$${Math.round(n / 1000)}K`;
  }
  return formatCurrency(n);
}

export function formatGrowthRate(rate: string | number | null | undefined): string {
  if (rate == null) return "N/A";
  const num = typeof rate === "string" ? parseFloat(rate) : rate;
  if (isNaN(num)) return String(rate);
  const sign = num > 0 ? "+" : "";
  return `${sign}${num}%`;
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "N/A";
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatCompactNumber(n: number | null | undefined): string {
  if (n == null) return "N/A";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return String(n);
}

export function growthColor(rate: number | null | undefined): string {
  if (rate == null) return "text-muted-foreground";
  if (rate > 10) return "text-green-600";
  if (rate > 0) return "text-yellow-600";
  return "text-red-600";
}

export function calculateHealthScore(career: Career): number {
  // Growth component (30%): normalize -5..30 → 0..100
  const growth = career.growth_rate_numeric ?? 0;
  const growthScore = Math.min(100, Math.max(0, ((growth + 5) / 35) * 100));

  // Openings component (25%): log scale, 500..500K → 0..100
  const openings = career.current_openings ?? 0;
  const openingsScore =
    openings > 0
      ? Math.min(100, (Math.log10(openings) / Math.log10(500000)) * 100)
      : 0;

  // Salary trajectory (25%): growth from entry to year10
  const entry = career.salary_entry ?? career.salary_median ?? 0;
  const year10 = career.salary_year10 ?? career.salary_median ?? 0;
  const trajGrowth = entry > 0 ? ((year10 - entry) / entry) * 100 : 0;
  const trajScore = Math.min(100, Math.max(0, (trajGrowth / 150) * 100));

  // Layoff risk (20%): low=100, medium=50, high=0
  const riskMap: Record<string, number> = { low: 100, medium: 50, high: 0 };
  const riskScore = riskMap[career.layoff_risk] ?? 50;

  return Math.round(
    growthScore * 0.3 + openingsScore * 0.25 + trajScore * 0.25 + riskScore * 0.2
  );
}

export function healthScoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-yellow-600";
  return "text-red-600";
}

export function healthScoreBg(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

export function healthScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Strong";
  if (score >= 50) return "Good";
  if (score >= 35) return "Fair";
  return "Challenging";
}

export function interpolateSalary(
  percentile: number,
  p25: number | null,
  median: number | null,
  p75: number | null,
  p90: number | null
): number | null {
  const points: [number, number][] = [];
  if (p25 != null) points.push([25, p25]);
  if (median != null) points.push([50, median]);
  if (p75 != null) points.push([75, p75]);
  if (p90 != null) points.push([90, p90]);
  if (points.length < 2) return null;

  // Clamp to known range
  if (percentile <= points[0][0]) return points[0][1];
  if (percentile >= points[points.length - 1][0]) return points[points.length - 1][1];

  // Find surrounding points and interpolate
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    if (percentile >= x0 && percentile <= x1) {
      const t = (percentile - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return null;
}
