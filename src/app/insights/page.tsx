"use client";

import { useCareers } from "@/hooks/use-careers";
import { GrowthChart } from "@/components/growth-chart";
import { SalaryRangeChart } from "@/components/salary-range-chart";
import { CategoryChart } from "@/components/category-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, TrendingUp, DollarSign, Users, Briefcase } from "lucide-react";
import { formatCompactCurrency, formatCompactNumber } from "@/lib/utils";

export default function InsightsPage() {
  const { careers, loading } = useCareers();

  const avgMedian =
    careers.length > 0
      ? Math.round(
          careers.reduce((sum, c) => sum + (c.salary_median || 0), 0) /
            careers.length
        )
      : 0;

  const totalEmployment = careers.reduce(
    (sum, c) => sum + (c.employment_total || 0),
    0
  );

  const totalOpenings = careers.reduce(
    (sum, c) => sum + (c.current_openings || 0),
    0
  );

  const avgGrowth =
    careers.length > 0
      ? (
          careers.reduce(
            (sum, c) => sum + (c.growth_rate_numeric || 0),
            0
          ) / careers.length
        ).toFixed(1)
      : "0";

  const categoryAvgs = Object.entries(
    careers.reduce<Record<string, { sum: number; count: number }>>(
      (acc, c) => {
        const cat = c.category;
        if (!acc[cat]) acc[cat] = { sum: 0, count: 0 };
        acc[cat].sum += c.salary_median || 0;
        acc[cat].count += 1;
        return acc;
      },
      {}
    )
  )
    .map(([cat, { sum, count }]) => ({
      category: cat,
      avgSalary: Math.round(sum / count),
      count,
    }))
    .sort((a, b) => b.avgSalary - a.avgSalary);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-80" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Market Insights</h1>
        <p className="text-muted-foreground mt-1">
          Aggregate market data and trends across all career paths
        </p>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Avg Median Salary"
          value={formatCompactCurrency(avgMedian)}
        />
        <StatCard
          icon={Users}
          label="Total Employment"
          value={formatCompactNumber(totalEmployment)}
        />
        <StatCard
          icon={Briefcase}
          label="Total Openings"
          value={formatCompactNumber(totalOpenings)}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Growth Rate"
          value={`${avgGrowth}%`}
        />
      </div>

      {/* Category Salary Averages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Average Salary by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categoryAvgs.map((c) => (
              <div
                key={c.category}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium capitalize">
                    {c.category}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.count} paths
                  </p>
                </div>
                <p className="text-lg font-bold">
                  {formatCompactCurrency(c.avgSalary)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="growth" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="growth" className="gap-1.5 text-xs">
                <TrendingUp className="h-3.5 w-3.5" />
                Growth Rates
              </TabsTrigger>
              <TabsTrigger value="salary" className="gap-1.5 text-xs">
                <DollarSign className="h-3.5 w-3.5" />
                Salary Ranking
              </TabsTrigger>
              <TabsTrigger value="category" className="gap-1.5 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                By Category
              </TabsTrigger>
            </TabsList>
            <TabsContent value="growth" className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">
                Top 15 careers by projected 10-year growth rate (BLS 2023-2033)
              </p>
              <GrowthChart careers={careers} />
            </TabsContent>
            <TabsContent value="salary" className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">
                Top 15 careers by median annual salary (BLS OEWS 2024)
              </p>
              <SalaryRangeChart careers={careers} />
            </TabsContent>
            <TabsContent value="category" className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">
                Distribution of career paths by industry category
              </p>
              <CategoryChart careers={careers} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
      <div className="rounded-md bg-primary/10 p-2">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
