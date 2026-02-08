"use client";

import { Career } from "@/lib/types";
import { CareerCard } from "@/components/career-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchX } from "lucide-react";

interface CareerGridProps {
  careers: Career[];
  loading: boolean;
  onCompare?: (id: string) => void;
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-7 w-24" />
        </div>
        <div>
          <Skeleton className="h-3 w-16 mb-1" />
          <Skeleton className="h-7 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-32" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  );
}

export function CareerGrid({ careers, loading, onCompare }: CareerGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (careers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No careers found</h3>
        <p className="text-muted-foreground mt-1">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {careers.map((career) => (
        <CareerCard key={career.id} career={career} onCompare={onCompare} />
      ))}
    </div>
  );
}
