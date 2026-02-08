"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChatInterface } from "@/components/chat-interface";
import { PremiumGate } from "@/components/auth/premium-gate";
import { MessageSquare } from "lucide-react";

function ChatContent() {
  const searchParams = useSearchParams();
  const aboutId = searchParams.get("about");
  const aboutTitle = searchParams.get("title");

  const initialQuestion = aboutTitle
    ? `Tell me about ${aboutTitle}. What are the salary prospects, growth potential, and key skills needed? What should I know before pursuing this career?`
    : undefined;

  return <ChatInterface initialQuestion={initialQuestion} />;
}

export default function ChatPage() {
  return (
    <PremiumGate
      feature="AI Career Chat"
      description="Get personalized career advice from our AI assistant, powered by your profile and real market data."
      icon={MessageSquare}
    >
      <Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">Loading...</div>}>
        <ChatContent />
      </Suspense>
    </PremiumGate>
  );
}
