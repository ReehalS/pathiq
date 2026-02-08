"use client";

import { useRouter } from "next/navigation";
import { useCareers } from "@/hooks/use-careers";
import { StatsBanner } from "@/components/stats-banner";
import { FilterBar } from "@/components/filter-bar";
import { CareerGrid } from "@/components/career-grid";

export default function DashboardPage() {
  const router = useRouter();
  const { careers, loading, filters, setFilters } = useCareers();

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
