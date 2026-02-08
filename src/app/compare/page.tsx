"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Career } from "@/lib/types";
import { useUserProfile } from "@/hooks/use-user-profile";
import { PathSelector } from "@/components/path-selector";
import { ComparisonTable } from "@/components/comparison-table";
import { SalaryChart } from "@/components/salary-chart";
import { SkillsRadar } from "@/components/skills-radar";
import { AIAnalysis } from "@/components/ai-analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function CompareContent() {
  const searchParams = useSearchParams();
  const { profile } = useUserProfile();

  const initialPaths = searchParams.get("paths")?.split(",").filter(Boolean) || [];
  const [selectedPaths, setSelectedPaths] = useState<string[]>(initialPaths);
  const [careers, setCareers] = useState<Career[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch career data when paths change
  useEffect(() => {
    if (selectedPaths.length === 0) {
      setCareers([]);
      return;
    }

    Promise.all(
      selectedPaths.map((id) =>
        fetch(`/api/careers/${id}`).then((res) => (res.ok ? res.json() : null))
      )
    ).then((results) => {
      setCareers(results.filter(Boolean) as Career[]);
    });
  }, [selectedPaths]);

  const handleAnalyze = async () => {
    if (selectedPaths.length < 2) return;
    setAnalyzing(true);
    setAiAnalysis(null);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathIds: selectedPaths,
          userProfile: profile.year
            ? { major: profile.major, year: profile.year, interests: profile.interests }
            : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.aiAnalysis);
      }
    } catch {
      setAiAnalysis("Failed to generate analysis. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compare Paths</h1>
        <p className="text-muted-foreground mt-1">
          Select 2-3 career paths to compare side-by-side with AI-powered analysis
        </p>
      </div>

      {/* Path Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Paths to Compare</CardTitle>
        </CardHeader>
        <CardContent>
          <PathSelector
            selectedPaths={selectedPaths}
            onPathsChange={(paths) => {
              setSelectedPaths(paths);
              setAiAnalysis(null);
            }}
          />
        </CardContent>
      </Card>

      {careers.length >= 2 && (
        <>
          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Side-by-Side Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ComparisonTable careers={careers} />
            </CardContent>
          </Card>

          {/* Salary Trajectory */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Salary Trajectory Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <SalaryChart careers={careers} />
              <p className="text-xs text-muted-foreground mt-2">
                Salary progression estimated from BLS wage percentile distribution and research data
              </p>
            </CardContent>
          </Card>

          {/* Skills Comparison Radar */}
          {careers.length === 2 && careers[0].skills.length > 0 && careers[1].skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills Profile Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <SkillsRadar career={careers[0]} comparisonCareer={careers[1]} />
                <div className="flex justify-center gap-6 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: "hsl(221, 83%, 53%)"}} />
                    {careers[0].title}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: "hsl(142, 71%, 45%)"}} />
                    {careers[1].title}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Analysis */}
          <AIAnalysis
            analysis={aiAnalysis}
            loading={analyzing}
            onAnalyze={handleAnalyze}
            disabled={selectedPaths.length < 2}
          />
        </>
      )}

      {careers.length === 1 && (
        <p className="text-center text-muted-foreground py-8">
          Add at least one more career path to see the comparison
        </p>
      )}

      {careers.length === 0 && selectedPaths.length === 0 && (
        <p className="text-center text-muted-foreground py-16">
          Search and select career paths above to start comparing
        </p>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
