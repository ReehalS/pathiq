"use client";

import { Career, UserProfile } from "@/lib/types";
import { getRecommendations } from "@/lib/recommendations";
import { CareerCard } from "@/components/career-card";
import { Sparkles } from "lucide-react";

interface RecommendedCareersProps {
  careers: Career[];
  profile: UserProfile;
  onCompare?: (id: string) => void;
}

export function RecommendedCareers({
  careers,
  profile,
  onCompare,
}: RecommendedCareersProps) {
  const recommendations = getRecommendations(careers, profile, 3);

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Recommended for You</h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Based on your {profile.major ? `${profile.major} background` : "profile"}{" "}
        and interests
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map(({ career, matchReasons }) => (
          <div key={career.id} className="flex flex-col">
            {matchReasons.length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1">
                {matchReasons.slice(0, 2).map((reason) => (
                  <span
                    key={reason}
                    className="text-xs text-primary font-medium"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            )}
            <div className="flex-1 [&>div]:h-full">
              <CareerCard career={career} onCompare={onCompare} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
