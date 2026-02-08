"use client";

import { useState, useEffect, useCallback } from "react";
import { Career, CareerFilters } from "@/lib/types";

export function useCareers(initialFilters?: Partial<CareerFilters>) {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Partial<CareerFilters>>(initialFilters || {});

  const fetchCareers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.pathTypes?.length) params.set("pathType", filters.pathTypes.join(","));
      if (filters.categories?.length) params.set("category", filters.categories.join(","));
      if (filters.minSalary) params.set("minSalary", String(filters.minSalary));
      if (filters.maxSalary) params.set("maxSalary", String(filters.maxSalary));
      if (filters.workLifeBalance?.length) params.set("workLifeBalance", filters.workLifeBalance.join(","));
      if (filters.sort) params.set("sort", filters.sort);

      const res = await fetch(`/api/careers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch careers");
      const data = await res.json();
      setCareers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCareers();
  }, [fetchCareers]);

  return { careers, loading, error, filters, setFilters, refetch: fetchCareers };
}
