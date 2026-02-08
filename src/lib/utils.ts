import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
