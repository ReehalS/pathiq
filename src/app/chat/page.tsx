"use client";

import { ChatInterface } from "@/components/chat-interface";
import { PremiumGate } from "@/components/auth/premium-gate";
import { MessageSquare } from "lucide-react";

export default function ChatPage() {
  return (
    <PremiumGate
      feature="AI Career Chat"
      description="Get personalized career advice from our AI assistant, powered by your profile and real market data."
      icon={MessageSquare}
    >
      <ChatInterface />
    </PremiumGate>
  );
}
