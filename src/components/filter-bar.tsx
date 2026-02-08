"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CareerFilters, PathType, Category } from "@/lib/types";
import { PATH_TYPE_OPTIONS, CATEGORY_OPTIONS, SORT_OPTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  filters: Partial<CareerFilters>;
  onFiltersChange: (filters: Partial<CareerFilters>) => void;
  resultCount: number;
}

export function FilterBar({ filters, onFiltersChange, resultCount }: FilterBarProps) {
  const togglePathType = (pt: PathType) => {
    const current = filters.pathTypes || [];
    const next = current.includes(pt)
      ? current.filter((t) => t !== pt)
      : [...current, pt];
    onFiltersChange({ ...filters, pathTypes: next });
  };

  const toggleCategory = (cat: Category) => {
    const current = filters.categories || [];
    const next = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    onFiltersChange({ ...filters, categories: next });
  };

  return (
    <div className="space-y-4">
      {/* Search + Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search careers..."
            value={filters.search || ""}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-9"
          />
        </div>
        <Select
          value={filters.sort || "salary-desc"}
          onValueChange={(val) =>
            onFiltersChange({ ...filters, sort: val as CareerFilters["sort"] })
          }
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filters */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Category</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((cat) => {
            const active = filters.categories?.includes(cat.value);
            return (
              <Badge
                key={cat.value}
                variant={active ? "default" : "outline"}
                className={cn("cursor-pointer transition-colors", active && cat.color)}
                onClick={() => toggleCategory(cat.value)}
              >
                {cat.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Path Type Filters */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Path Type</p>
        <div className="flex flex-wrap gap-2">
          {PATH_TYPE_OPTIONS.map((pt) => {
            const active = filters.pathTypes?.includes(pt.value);
            return (
              <Badge
                key={pt.value}
                variant={active ? "default" : "outline"}
                className="cursor-pointer transition-colors"
                onClick={() => togglePathType(pt.value)}
              >
                {pt.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Result Count */}
      <p className="text-sm text-muted-foreground">
        Showing {resultCount} career path{resultCount !== 1 ? "s" : ""}
      </p>
    </div>
  );
}
