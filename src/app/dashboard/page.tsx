"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCareers } from "@/hooks/use-careers";
import { StatsBanner } from "@/components/stats-banner";
import { FilterBar } from "@/components/filter-bar";
import { CareerGrid } from "@/components/career-grid";
import { GrowthChart } from "@/components/growth-chart";
import { SalaryRangeChart } from "@/components/salary-range-chart";
import { CategoryChart } from "@/components/category-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { careers, loading, filters, setFilters } = useCareers();
  const [showCharts, setShowCharts] = useState(true);

  const handleCompare = (id: string) => {
    router.push(`/compare?paths=${id}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Career Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Explore and compare post-graduation career paths with real market data
        </p>
      </div>

      <StatsBanner careers={careers} />

      {/* Market Overview Charts */}
      {!loading && careers.length > 0 && showCharts && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Market Overview</CardTitle>
              <button
                onClick={() => setShowCharts(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Hide charts
              </button>
            </div>
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
      )}

      {!showCharts && !loading && careers.length > 0 && (
        <button
          onClick={() => setShowCharts(true)}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Show market overview charts
        </button>
      )}

      <FilterBar
        filters={filters}
        onFiltersChange={setFilters}
        resultCount={careers.length}
      />

      <CareerGrid
        careers={careers}
        loading={loading}
        onCompare={handleCompare}
      />
    </div>
  );
}
