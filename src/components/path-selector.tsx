"use client";

import { useState, useEffect } from "react";
import { Career } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Search, Plus } from "lucide-react";
import { getCategoryColor } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface PathSelectorProps {
  selectedPaths: string[];
  onPathsChange: (paths: string[]) => void;
  maxPaths?: number;
}

export function PathSelector({ selectedPaths, onPathsChange, maxPaths = 3 }: PathSelectorProps) {
  const [allCareers, setAllCareers] = useState<Career[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetch("/api/careers?sort=alphabetical")
      .then((res) => res.json())
      .then(setAllCareers)
      .catch(() => {});
  }, []);

  const selectedCareers = allCareers.filter((c) => selectedPaths.includes(c.id));
  const filteredCareers = allCareers
    .filter((c) => !selectedPaths.includes(c.id))
    .filter(
      (c) =>
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.category.toLowerCase().includes(search.toLowerCase())
    );

  const addPath = (id: string) => {
    if (selectedPaths.length < maxPaths) {
      onPathsChange([...selectedPaths, id]);
    }
    setSearch("");
    setShowDropdown(false);
  };

  const removePath = (id: string) => {
    onPathsChange(selectedPaths.filter((p) => p !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedCareers.map((career) => (
          <Badge
            key={career.id}
            variant="secondary"
            className={cn("text-sm py-1.5 px-3 gap-1", getCategoryColor(career.category))}
          >
            {career.title}
            <button onClick={() => removePath(career.id)} className="ml-1 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {selectedPaths.length < maxPaths && (
          <div className="relative">
            <div className="flex items-center gap-1">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Add a career path..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="pl-7 h-8 w-[220px] text-sm"
                />
              </div>
            </div>
            {showDropdown && (
              <div className="absolute top-9 left-0 z-50 w-[300px] max-h-[200px] overflow-y-auto rounded-md border bg-popover shadow-lg">
                {filteredCareers.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">No careers found</p>
                ) : (
                  filteredCareers.map((career) => (
                    <button
                      key={career.id}
                      onClick={() => addPath(career.id)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
                    >
                      <Plus className="h-3 w-3 text-muted-foreground" />
                      <span>{career.title}</span>
                      <Badge className={cn("text-xs ml-auto", getCategoryColor(career.category))}>
                        {career.category}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {showDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
      )}
    </div>
  );
}
