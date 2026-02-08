"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, RefreshCw } from "lucide-react";

interface AIAnalysisProps {
  analysis: string | null;
  loading: boolean;
  onAnalyze: () => void;
  disabled?: boolean;
}

export function AIAnalysis({ analysis, loading, onAnalyze, disabled }: AIAnalysisProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Analysis
        </CardTitle>
        <Button
          onClick={onAnalyze}
          disabled={loading || disabled}
          size="sm"
          className="gap-1.5"
        >
          {loading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              Analyzing...
            </>
          ) : analysis ? (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Re-analyze
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Analyze with AI
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : analysis ? (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed">
            {analysis}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Select 2-3 career paths and click &quot;Analyze with AI&quot; to get a personalized
            comparison analysis powered by GPT-4o.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
