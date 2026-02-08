"use client";

import { STARTER_QUESTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface StarterQuestionsProps {
  onSelect: (question: string) => void;
}

export function StarterQuestions({ onSelect }: StarterQuestionsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
        <MessageSquare className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Ask PathIQ anything</h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Get personalized career advice backed by real labor market data from BLS and O*NET
      </p>
      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {STARTER_QUESTIONS.map((q) => (
          <Button
            key={q}
            variant="outline"
            size="sm"
            onClick={() => onSelect(q)}
            className="text-sm"
          >
            {q}
          </Button>
        ))}
      </div>
    </div>
  );
}
