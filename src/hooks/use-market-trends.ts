"use client";

import { useState, useEffect } from "react";
import { MarketTrend } from "@/lib/types";

export function useMarketTrends(careerId: string) {
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch(`/api/market-trends/${careerId}`);
        if (res.ok) {
          const data = await res.json();
          setTrends(data);
        }
      } catch {
        // silently fail — historical data is optional
      } finally {
        setLoading(false);
      }
    }
    fetchTrends();
  }, [careerId]);

  return { trends, loading };
}
